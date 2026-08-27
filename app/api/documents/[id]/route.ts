import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById, updateDocument, deleteDocument } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const doc = getDocumentById(params.id, userId);

    if (!doc) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(doc);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching document' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const body = await req.json();

    const updated = updateDocument(params.id, userId, {
      title: body.title,
      contentHtml: body.contentHtml,
      contentText: body.contentText,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    const isPermissionError = error.message.includes('Permission denied');
    return NextResponse.json(
      { error: error.message || 'Failed to update document' },
      { status: isPermissionError ? 403 : 500 }
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
    const success = deleteDocument(params.id, userId);

    if (!success) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const isPermissionError = error.message.includes('Permission denied');
    return NextResponse.json(
      { error: error.message || 'Failed to delete document' },
      { status: isPermissionError ? 403 : 500 }
    );
  }
}
