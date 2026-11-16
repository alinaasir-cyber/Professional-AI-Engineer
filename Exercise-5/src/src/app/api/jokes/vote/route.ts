import { NextResponse } from 'next/server';
import { voteOnJoke } from '@/lib/joke-tool';

export async function POST(req: Request) {
  try {
    const { id, type } = await req.json();

    if (!id || (type !== 'up' && type !== 'down')) {
      return NextResponse.json({ error: 'Invalid joke id or vote type' }, { status: 400 });
    }

    const result = await voteOnJoke(id, type);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
