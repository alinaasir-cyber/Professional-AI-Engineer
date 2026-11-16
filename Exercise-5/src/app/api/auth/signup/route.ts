import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSession, AUTH_COOKIE_NAME } from '@/lib/auth';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, name, password } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    if (!password || password.length < 4) {
      return NextResponse.json({ success: false, error: 'Password must be at least 4 characters' }, { status: 400 });
    }

    const userEmail = email.trim().toLowerCase();
    const userName = (name || userEmail.split('@')[0]).trim();
    const hashedPassword = hashPassword(password);

    // Check if user already exists
    const existing = await prisma.authUser.findUnique({
      where: { email: userEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists. Please Sign In.' },
        { status: 400 }
      );
    }

    // Create user in Neon PostgreSQL
    const user = await prisma.authUser.create({
      data: {
        email: userEmail,
        name: userName,
        password: hashedPassword,
        provider: 'credentials',
      },
    });

    // Create session
    const { token, expiresAt } = await createSession(user.id);

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        provider: user.provider,
      },
    });

    res.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    return res;
  } catch (error: any) {
    console.error('Sign Up API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sign up' },
      { status: 500 }
    );
  }
}
