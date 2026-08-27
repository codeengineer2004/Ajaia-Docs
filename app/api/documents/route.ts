import { NextRequest, NextResponse } from 'next/server';
import { getDocumentsForUser, createDocument } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const docs = getDocumentsForUser(userId);
    return NextResponse.json(docs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const body = await req.json();

    const newDoc = createDocument({
      title: body.title || 'Untitled Document',
      contentHtml: body.contentHtml || '',
      contentText: body.contentText || '',
      ownerId: userId,
    });

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create document' }, { status: 500 });
  }
}
