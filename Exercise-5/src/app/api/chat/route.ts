import { NextResponse } from 'next/server';
import { processUserMessage } from '@/lib/ai-handler';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let prompt = '';

    if (body.message && typeof body.message === 'string') {
      prompt = body.message;
    } else if (Array.isArray(body.messages) && body.messages.length > 0) {
      const last = body.messages[body.messages.length - 1];
      prompt = last.content || '';
    }

    if (!prompt.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    const response = await processUserMessage(prompt);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      {
        role: 'assistant',
        content: `An unexpected error occurred: ${error.message || 'Internal Server Error'}. Please retry.`,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
