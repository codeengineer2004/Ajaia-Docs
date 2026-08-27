import { NextRequest, NextResponse } from 'next/server';
import { addComment, getComments } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    return NextResponse.json(getComments(params.id, userId));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load comments' }, { status: 403 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { text } = await req.json();
    return NextResponse.json(addComment(params.id, userId, text), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add comment' }, { status: 400 });
  }
}
