import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        provider: user.provider,
      },
    });
  } catch (error: any) {
    console.error('Session API error:', error);
    return NextResponse.json({ authenticated: false, user: null, error: error.message }, { status: 500 });
  }
}
