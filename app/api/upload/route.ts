import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['txt', 'md', 'docx', 'json']);

// Simple helper to convert plain text or markdown lines into HTML paragraphs & headings
function textToHtml(text: string): string {
  const lines = text.split('\n');
  const htmlLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('# ')) {
      return `<h1>${escapeHtml(trimmed.slice(2))}</h1>`;
    }
    if (trimmed.startsWith('## ')) {
      return `<h2>${escapeHtml(trimmed.slice(3))}</h2>`;
    }
    if (trimmed.startsWith('### ')) {
      return `<h3>${escapeHtml(trimmed.slice(4))}</h3>`;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return `<li>${escapeHtml(trimmed.slice(2))}</li>`;
    }
    return `<p>${escapeHtml(trimmed)}</p>`;
  });

  return htmlLines.join('');
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileName = file.name;
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json({ error: 'Unsupported file type. Use .txt, .md, .docx, or .json.' }, { status: 415 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File is too large. Maximum upload size is 5 MB.' }, { status: 413 });
    }
    if (!fileName.trim() || fileName.length > 180) {
      return NextResponse.json({ error: 'Invalid file name.' }, { status: 400 });
    }
    const titleWithoutExt = fileName.replace(/\.[^/.]+$/, '');

    let contentHtml = '';
    let contentText = '';

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (extension === 'docx') {
      try {
        const result = await mammoth.convertToHtml({ buffer });
        contentHtml = result.value || '<p>Empty DOCX document</p>';
        const textResult = await mammoth.extractRawText({ buffer });
        contentText = textResult.value || '';
      } catch (err) {
        console.error('Docx conversion error, using fallback:', err);
        contentText = buffer.toString('utf-8');
        contentHtml = textToHtml(contentText);
      }
    } else if (extension === 'json') {
      const text = buffer.toString('utf-8');
      try {
        const parsed = JSON.parse(text);
        contentText = JSON.stringify(parsed, null, 2);
        contentHtml = `<pre><code>${escapeHtml(contentText)}</code></pre>`;
      } catch {
        contentText = text;
        contentHtml = textToHtml(text);
      }
    } else {
      // .txt, .md, or general text file
      contentText = buffer.toString('utf-8');
      contentHtml = textToHtml(contentText);
    }

    return NextResponse.json({
      title: titleWithoutExt || 'Imported Document',
      contentHtml: contentHtml,
      contentText: contentText,
      fileType: extension.toUpperCase(),
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process file' },
      { status: 500 }
    );
  }
}
