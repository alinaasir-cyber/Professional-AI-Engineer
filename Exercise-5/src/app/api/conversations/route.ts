import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET all conversations for current user or guest
export async function GET() {
  try {
    const user = await getCurrentUser();

    const whereClause = user ? {
      OR: [
        { userId: user.id },
        { userId: null },
      ],
    } : {};

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true },
        },
      },
    });

    return NextResponse.json({ success: true, conversations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create a new conversation
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = body.title || 'New Chat';
    const user = await getCurrentUser();

    const conversation = await prisma.conversation.create({
      data: {
        title,
        userId: user ? user.id : null,
      },
    });

    return NextResponse.json({ success: true, conversation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
