import { NextRequest, NextResponse } from 'next/server';
import { getActiveEditors, heartbeat } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const documentId = new URL(req.url).searchParams.get('documentId');
    if (!documentId) return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    return NextResponse.json(getActiveEditors(documentId, userId));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load presence' }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { documentId, cursorPosition } = await req.json();
    if (!documentId) return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    return NextResponse.json(heartbeat(documentId, userId, cursorPosition));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update presence' }, { status: 403 });
  }
}
