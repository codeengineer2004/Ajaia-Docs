import { NextRequest, NextResponse } from 'next/server';
import { shareDocument, revokeShare } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const body = await req.json();
    const { targetUserId, role } = body;

    if (!targetUserId || !role) {
      return NextResponse.json({ error: 'Target user ID and role are required' }, { status: 400 });
    }

    const share = shareDocument(params.id, userId, targetUserId, role);
    return NextResponse.json(share);
  } catch (error: any) {
    const isPermissionError = error.message.includes('Permission denied');
    return NextResponse.json(
      { error: error.message || 'Failed to share document' },
      { status: isPermissionError ? 403 : 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId query param is required' }, { status: 400 });
    }

    const success = revokeShare(params.id, userId, targetUserId);
    return NextResponse.json({ success });
  } catch (error: any) {
    const isPermissionError = error.message.includes('Permission denied');
    return NextResponse.json(
      { error: error.message || 'Failed to revoke share' },
      { status: isPermissionError ? 403 : 400 }
    );
  }
}
