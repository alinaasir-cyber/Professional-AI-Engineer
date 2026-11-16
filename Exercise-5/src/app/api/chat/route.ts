import { NextResponse } from 'next/server';
import { processUserMessage } from '@/lib/ai-handler';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let prompt = '';
    let conversationId = body.conversationId as string | undefined;

    if (body.message && typeof body.message === 'string') {
      prompt = body.message;
    } else if (Array.isArray(body.messages) && body.messages.length > 0) {
      const last = body.messages[body.messages.length - 1];
      prompt = last.content || '';
    }

    if (!prompt.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    // Ensure conversation exists or create one
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    }

    if (!conversation) {
      const title = prompt.length > 30 ? `${prompt.slice(0, 28)}...` : prompt;
      conversation = await prisma.conversation.create({
        data: { title },
      });
      conversationId = conversation.id;
    } else {
      // Update updatedAt timestamp
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });
    }

    const response = await processUserMessage(prompt, conversationId);

    return NextResponse.json({
      ...response,
      conversationId,
      conversationTitle: conversation.title,
    });
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
