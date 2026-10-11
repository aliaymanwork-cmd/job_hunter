import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Groq is not configured. Add GROQ_API_KEY in Vercel Environment Variables.' }, { status: 503 });
    const body = await req.json();
    const question = typeof body.question === 'string' ? body.question.slice(0, 3000) : '';
    const expectedAnswer = typeof body.expectedAnswer === 'string' ? body.expectedAnswer.slice(0, 5000) : '';
    const userAnswer = typeof body.userAnswer === 'string' ? body.userAnswer.slice(0, 6000) : '';
    const keywords = Array.isArray(body.keywords) ? body.keywords.slice(0, 20).map(String) : [];
    if (!question || !expectedAnswer || !userAnswer.trim()) return NextResponse.json({ error: 'Question, expected answer and your answer are required.' }, { status: 400 });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        temperature: 0.1,
        max_tokens: 700,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a fair cybersecurity SOC interview examiner. Grade the candidate answer semantically, not by exact wording. Accept equivalent technically correct answers. Award correct=true only when the answer demonstrates the essential technical understanding and safe operational judgement. For multi-step scenarios, do not mark correct if major safety steps are missing. Return JSON only: {"correct":boolean,"feedback":string,"modelAnswer":string}. Feedback should be concise and constructive. The modelAnswer should be a useful complete answer, not just a list of keywords.' },
          { role: 'user', content: JSON.stringify({ question, expectedAnswer, importantConcepts: keywords, candidateAnswer: userAnswer }) },
        ],
      }),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = data?.error?.message;
      return NextResponse.json({ error: response.status === 429 ? 'Groq rate limit reached. Wait a moment and try again.' : typeof message === 'string' ? `Groq API error: ${message}` : `Groq request failed (${response.status}).` }, { status: response.status >= 500 ? 502 : response.status });
    }
    const raw = data?.choices?.[0]?.message?.content;
    if (typeof raw !== 'string') return NextResponse.json({ error: 'The AI examiner returned an empty response.' }, { status: 502 });
    const result = JSON.parse(raw);
    return NextResponse.json({ correct: result.correct === true, feedback: String(result.feedback || ''), modelAnswer: String(result.modelAnswer || expectedAnswer) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not evaluate answer.' }, { status: 500 });
  }
}
