import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: 'Gemini is not configured. Add GEMINI_API_KEY in Vercel Environment Variables.' }, { status: 503 });
    const body = await req.json();
    const prompt = typeof body.prompt === 'string' ? body.prompt.slice(0, 12000) : '';
    if (!prompt.trim()) return NextResponse.json({ error: 'Add a question or job description first.' }, { status: 400 });
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-3.8-flash', systemInstruction: 'You are a practical Dubai cybersecurity career coach specializing in SOC Analyst, Security Operations, Incident Response, Threat Detection, SIEM, and DFIR roles. Tailor advice to the candidate profile: around 2 years SOC experience; Rapid7 InsightIDR, Wazuh, Sekoia SIEM, alert triage, phishing and malware investigation, log analysis, threat hunting, IOC/CVE intelligence, MITRE ATT&CK, custom detection rules, false-positive tuning, agent/log-source integration, incident reporting, client communication; CEH V12; BSc Computer Science. Be truthful; never invent qualifications, employers, certifications, or achievements. Keep output structured and useful. For applications, produce editable drafts and ask the user to verify details before sending.' });
    const result = await model.generateContent(prompt);
    return NextResponse.json({ text: result.response.text() });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Gemini request failed.' }, { status: 500 }); }
}
