import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are a practical Dubai cybersecurity career coach. Candidate profile: around 2 years SOC experience; Rapid7 InsightIDR, Wazuh, Sekoia SIEM, alert triage, phishing/malware investigation, log analysis, threat hunting, IOC/CVE intelligence, MITRE ATT&CK, detection tuning, agent/log-source integration, incident reporting, client communication; CEH V12; BSc Computer Science. Never invent qualifications, employers, certifications, dates, metrics, or achievements. Return valid JSON only with this shape: {"title":string,"summary":string,"sections":[{"heading":string,"items":string[]}],"draft":string}. Use sections for clear headings and lists. Put copy-ready letter/message text in draft. Do not return HTML or Markdown tags.`;
export async function POST(req: Request) {
 try {
  const apiKey=process.env.GROQ_API_KEY;
  if(!apiKey)return NextResponse.json({error:'Groq is not configured. Add GROQ_API_KEY in Vercel Environment Variables.'},{status:503});
  const body=await req.json(); const prompt=typeof body.prompt==='string'?body.prompt.slice(0,12000):'';
  if(!prompt.trim())return NextResponse.json({error:'Add a question or job description first.'},{status:400});
  const response=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.GROQ_MODEL||'openai/gpt-oss-120b',messages:[{role:'system',content:SYSTEM_PROMPT},{role:'user',content:prompt}],temperature:0.4,max_tokens:2200,response_format:{type:'json_object'}}),cache:'no-store'});
  const data=await response.json().catch(()=>null);
  if(!response.ok){const message=data?.error?.message;return NextResponse.json({error:response.status===429?'Groq rate limit reached. Wait and try again.':typeof message==='string'?`Groq API error: ${message}`:`Groq request failed (${response.status}). Check your API key and model.`},{status:response.status>=500?502:response.status});}
  const raw=data?.choices?.[0]?.message?.content;
  if(typeof raw!=='string'||!raw.trim())return NextResponse.json({error:'Groq returned an empty response.'},{status:502});
  try { const parsed=JSON.parse(raw); return NextResponse.json({result:{title:String(parsed.title||'AI response'),summary:String(parsed.summary||''),sections:Array.isArray(parsed.sections)?parsed.sections.map((s:any)=>({heading:String(s.heading||'Details'),items:Array.isArray(s.items)?s.items.map(String):[]})):[],draft:String(parsed.draft||'')}}); }
  catch { return NextResponse.json({result:{title:'AI response',summary:raw,sections:[],draft:''}}); }
 } catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Could not reach Groq.'},{status:500});}
}
