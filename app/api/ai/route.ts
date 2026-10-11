import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are a practical Dubai cybersecurity career coach specializing in SOC Analyst, Security Operations, Incident Response, Threat Detection, SIEM, and DFIR roles. Tailor advice to the candidate profile: around 2 years SOC experience; Rapid7 InsightIDR, Wazuh, Sekoia SIEM, alert triage, phishing and malware investigation, log analysis, threat hunting, IOC/CVE intelligence, MITRE ATT&CK, custom detection rules, false-positive tuning, agent/log-source integration, incident reporting, client communication; CEH V12; BSc Computer Science. Be truthful; never invent qualifications, employers, certifications, or achievements. Keep output structured and useful. For applications, produce editable drafts and ask the user to verify details before sending.`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Groq is not configured. Add GROQ_API_KEY in Vercel Environment Variables.' }, { status: 503 });
    }

    const body = await req.json();
    const prompt = typeof body.prompt === 'string' ? body.prompt.slice(0, 12000) : '';
    if (!prompt.trim()) {
      return NextResponse.json({ error: 'Add a question or job description first.' }, { status: 400 });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 1800,
      }),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json({ error: 'Groq rate limit reached. Please wait a little and try again. Your saved jobs and interviews are unaffected.' }, { status: 429 });
      }
      const providerMessage = data?.error?.message;
      return NextResponse.json({ error: typeof providerMessage === 'string' ? `Groq API error: ${providerMessage}` : `Groq request failed (${response.status}). Check your API key and model setting.` }, { status: response.status >= 500 ? 502 : response.status });
    }

    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Groq returned an empty response. Please try again.' }, { status: 502 });
    }
    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not reach Groq.' }, { status: 500 });
  }
}
