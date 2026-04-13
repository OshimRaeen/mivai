import { NextResponse } from 'next/server';

// JDoodle specific language codes and version indexes
const LANGUAGE_MAP: Record<string, { language: string; versionIndex: string }> = {
  javascript: { language: 'nodejs', versionIndex: '4' }, // Node 17.x
  typescript: { language: 'typescript', versionIndex: '0' }, // TS 3.7.4
  python: { language: 'python3', versionIndex: '4' }, // Python 3.9.9
  cpp: { language: 'cpp', versionIndex: '5' },
  java: { language: 'java', versionIndex: '4' }, // JDK 17.0.1
  sql: { language: 'sql', versionIndex: '4' }, // SQLite
};

export async function POST(req: Request) {
  try {
    const { code, language } = await req.json();

    if (!code || !language) {
      return NextResponse.json({ error: 'Code and language are required' }, { status: 400 });
    }

    if (language === 'markdown') {
      return NextResponse.json({ 
        run: { output: 'System Design saved. Markdown does not require compilation.' } 
      });
    }

    const runtime = LANGUAGE_MAP[language];

    if (!runtime) {
      return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
    }

    const clientId = process.env.JDOODLE_CLIENT_ID;
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Server configuration error: Missing API Keys' }, { status: 500 });
    }

    // 1. Send the payload to JDoodle
    const response = await fetch('https://api.jdoodle.com/v1/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: clientId,
        clientSecret: clientSecret,
        script: code,
        language: runtime.language,
        versionIndex: runtime.versionIndex,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Execution engine error' }, { status: response.status });
    }

    // 2. Format the JDoodle response to match our frontend's expectations
    // JDoodle returns 'output' for both success and errors, and a 'statusCode' (200 is success)
    const isError = data.statusCode !== 200 || data.output.toLowerCase().includes('error') || data.output.toLowerCase().includes('exception');

    return NextResponse.json({
      run: {
        code: isError ? 1 : 0,
        output: data.output || 'Code executed successfully with no console output.',
      }
    });

  } catch (error: any) {
    console.error('Execution Error:', error);
    return NextResponse.json({ error: 'Failed to connect to the execution server' }, { status: 500 });
  }
}