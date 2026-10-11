import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Opening = {
  id: string;
  company: string;
  role: string;
  location: string;
  url: string;
  source: string;
  date: string;
  description: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function normalize(value: string) {
  return value.toLowerCase().replace(/https?:\/\//g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function withinLast24Hours(opening: Opening, now = Date.now()) {
  const postedAt = Date.parse(opening.date);
  return Number.isFinite(postedAt) && postedAt <= now && now - postedAt <= DAY_MS;
}

function deduplicate(openings: Opening[]) {
  const seen = new Set<string>();
  return openings.filter((opening) => {
    const urlKey = normalize(opening.url.split('?')[0].replace(/\/$/, ''));
    const roleKey = `${normalize(opening.company)}|${normalize(opening.role)}|${normalize(opening.location)}`;
    const key = urlKey || roleKey;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function response(openings: Opening[], source: string, extra: Record<string, unknown> = {}) {
  const now = Date.now();
  const fresh = deduplicate(openings.filter((opening) => opening.url && withinLast24Hours(opening, now)))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return NextResponse.json({
    openings: fresh,
    source,
    refreshedAt: new Date(now).toISOString(),
    windowHours: 24,
    note: 'Only listings with a verifiable posting time within the last 24 hours are shown. Duplicate links and matching company/role listings are removed.',
    ...extra,
  });
}

export async function GET() {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (appId && appKey) {
    try {
      const url = `https://api.adzuna.com/v1/api/jobs/ae/search/1?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}&results_per_page=100&sort_by=date&what=${encodeURIComponent('SOC analyst OR security analyst OR incident response OR cybersecurity OR SIEM OR threat detection')}&where=${encodeURIComponent('Dubai')}&content-type=application/json`;
      const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        const openings: Opening[] = (data.results || []).map((job: any) => ({
          id: String(job.id || job.redirect_url || `${job.company?.display_name}-${job.title}`),
          company: job.company?.display_name || 'Company not listed',
          role: job.title || 'Cybersecurity role',
          location: job.location?.display_name || 'Dubai, UAE',
          url: job.redirect_url || '',
          source: 'Adzuna',
          date: job.created || '',
          description: String(job.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 420),
        }));
        return response(openings, 'Adzuna');
      }
    } catch {
      // Fall through to the public feed if the configured provider is unavailable.
    }
  }

  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('Public job source unavailable');
    const data = await res.json();
    const relevant: Opening[] = (data.data || []).filter((job: any) => {
      const text = `${job.title || ''} ${job.description || ''} ${(job.tags || []).join(' ')}`.toLowerCase();
      const location = String(job.location || '').toLowerCase();
      const security = /soc analyst|security analyst|cyber.?security|incident response|threat hunter|security engineer|siem|information security/.test(text);
      const target = /dubai|united arab emirates|\buae\b|remote/.test(location) || job.remote === true;
      return security && target;
    }).map((job: any) => ({
      id: String(job.slug || job.url || `${job.company_name}-${job.title}`),
      company: job.company_name || 'Company not listed',
      role: job.title || 'Cybersecurity role',
      location: job.location || 'Remote',
      url: job.url || '',
      source: 'Arbeitnow',
      date: job.created_at || job.createdAt || '',
      description: String(job.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 420),
    }));
    return response(relevant, 'Arbeitnow public feed', {
      note: 'Only listings with a verifiable posting time within the last 24 hours are shown. This public feed may have limited UAE coverage; configure ADZUNA_APP_ID and ADZUNA_APP_KEY in Vercel for broader UAE results.',
    });
  } catch {
    return NextResponse.json({ error: 'Could not refresh job listings right now. Please retry shortly.' }, { status: 502 });
  }
}
