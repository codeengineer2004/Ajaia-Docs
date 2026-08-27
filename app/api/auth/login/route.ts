import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, COOKIE_NAME } from '@/lib/auth';
import { getUserById } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId || !getUserById(userId)) {
      return NextResponse.json({ error: 'Invalid demo user' }, { status: 401 });
    }
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, createSessionToken(userId), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid login request' }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, '', { httpOnly: true, expires: new Date(0), path: '/' });
  return response;
}
