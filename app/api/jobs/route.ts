import { NextResponse } from 'next/server';
export const dynamic='force-dynamic';
type Opening={id:string;company:string;role:string;location:string;url:string;source:string;date:string;description:string};
export async function GET(){
 const appId=process.env.ADZUNA_APP_ID, appKey=process.env.ADZUNA_APP_KEY;
 if(appId&&appKey){
  try { const url=`https://api.adzuna.com/v1/api/jobs/ae/search/1?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}&results_per_page=30&what=${encodeURIComponent('SOC analyst OR security analyst OR incident response OR cybersecurity')}&where=${encodeURIComponent('Dubai')}&content-type=application/json`;
   const res=await fetch(url,{cache:'no-store',headers:{Accept:'application/json'}}); if(res.ok){const data=await res.json();const openings:Opening[]=(data.results||[]).map((j:any)=>({id:String(j.id),company:j.company?.display_name||'Company not listed',role:j.title||'Cybersecurity role',location:j.location?.display_name||'UAE',url:j.redirect_url||'',source:'Adzuna',date:j.created||'',description:String(j.description||'').replace(/<[^>]*>/g,' ').slice(0,420)}));return NextResponse.json({openings:openings.filter(j=>j.url),source:'Adzuna',refreshedAt:new Date().toISOString()});}
  }catch{}
 }
 // Public job-board fallback; results are filtered and linked to their original listing.
 try {const res=await fetch('https://www.arbeitnow.com/api/job-board-api',{cache:'no-store',headers:{Accept:'application/json'}});if(!res.ok)throw new Error('Public job source unavailable');const data=await res.json();const relevant=(data.data||[]).filter((j:any)=>{const t=`${j.title||''} ${j.description||''} ${(j.tags||[]).join(' ')}`.toLowerCase();const loc=String(j.location||'').toLowerCase();const security=/soc analyst|security analyst|cyber.?security|incident response|threat hunter|security engineer|siem/.test(t);const target=/dubai|united arab emirates|\buae\b|remote/.test(loc)||j.remote===true;return security&&target;}).slice(0,30).map((j:any)=>({id:String(j.slug||j.url),company:j.company_name||'Company not listed',role:j.title||'Cybersecurity role',location:j.location||'Remote',url:j.url||'',source:'Arbeitnow',date:j.created_at||'',description:String(j.description||'').replace(/<[^>]*>/g,' ').slice(0,420)})).filter((j:Opening)=>j.url);return NextResponse.json({openings:relevant,source:'Arbeitnow public feed',refreshedAt:new Date().toISOString(),note:'For broader UAE-specific results, add ADZUNA_APP_ID and ADZUNA_APP_KEY in Vercel.'});}
 catch{return NextResponse.json({error:'Could not refresh job listings right now. Please retry shortly.'},{status:502});}
}
