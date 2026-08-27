import { NextRequest, NextResponse } from 'next/server';
import { getVersions, restoreVersion } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    return NextResponse.json(getVersions(params.id, userId));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load versions' }, { status: 403 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { versionId } = await req.json();
    return NextResponse.json(restoreVersion(params.id, userId, versionId));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to restore version' }, { status: 400 });
  }
}
