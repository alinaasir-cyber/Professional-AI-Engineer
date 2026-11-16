import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      }).catch(() => {});
    }

    const res = NextResponse.json({ success: true, message: 'Signed out successfully' });

    res.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return res;
  } catch (error: any) {
    console.error('SignOut API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sign out' },
      { status: 500 }
    );
  }
}
