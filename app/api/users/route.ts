import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';

export async function GET() {
  try {
    const users = getUsers();
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}
