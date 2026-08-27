'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import FontFamily from '@tiptap/extension-font-family';
import TextStyle from '@tiptap/extension-text-style';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ActiveEditor, DocumentComment, DocumentItem, DocumentVersion, User, AccessRole } from '@/lib/types';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Undo,
  Redo,
  Share2,
  Download,
  Lock,
  CheckCircle2,
  RefreshCw,
  FileCode,
  FileText,
  MessageSquare,
  History,
} from 'lucide-react';

interface EditorProps {
  document: DocumentItem;
  currentUser: User;
  onUpdateDocument: (
    docId: string,
    title: string,
    contentHtml: string,
    contentText: string
  ) => void;
  onOpenShareModal: (doc: DocumentItem) => void;
}

export default function Editor({
  document,
  currentUser,
  onUpdateDocument,
  onOpenShareModal,
}: EditorProps) {
  const fontFamilies = [
    { label: 'Inter', value: 'Inter' },
    { label: 'Arial', value: 'Arial' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Verdana', value: 'Verdana' },
    { label: 'JetBrains Mono', value: 'JetBrains Mono' },
  ];
  const fontSizes = ['10px', '12px', '14px', '16px', '18px', '24px', '32px'];
  const [title, setTitle] = React.useState(document.title);
  const [saveState, setSaveState] = React.useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [exportOpen, setExportOpen] = React.useState(false);
  const [activeEditors, setActiveEditors] = React.useState<ActiveEditor[]>([]);
  const [comments, setComments] = React.useState<DocumentComment[]>([]);
  const [versions, setVersions] = React.useState<DocumentVersion[]>([]);
  const [showComments, setShowComments] = React.useState(false);
  const [showAllComments, setShowAllComments] = React.useState(false);
  const [showVersions, setShowVersions] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');
  const paperRef = React.useRef<HTMLDivElement | null>(null);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const role: AccessRole = document.currentUserRole || (document.ownerId === currentUser.id ? 'owner' : 'viewer');
  const canEdit = role === 'owner' || role === 'editor';
  const canComment = canEdit || role === 'commenter';

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      FontFamily,
      Placeholder.configure({
        placeholder: 'Start writing your document here...',
      }),
    ],
    content: document.contentHtml || '',
    editable: canEdit,
    onUpdate: ({ editor }) => {
      if (!canEdit) return;
      setSaveState('unsaved');

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        triggerSave(title, editor.getHTML(), editor.getText());
      }, 1000);
    },
  });

  React.useEffect(() => {
    let cancelled = false;
    const refreshPresence = async () => {
      try {
        const response = await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
          body: JSON.stringify({
            documentId: document.id,
            cursorPosition: editor?.state.selection.head,
          }),
        });
        if (!cancelled && response.ok) setActiveEditors(await response.json());
      } catch {
        // Presence is an enhancement and should not interrupt editing.
      }
    };
    refreshPresence();
    const interval = window.setInterval(refreshPresence, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [currentUser.id, document.id, editor]);

  const loadComments = async () => {
    const response = await fetch(`/api/documents/${document.id}/comments`, {
      headers: { 'x-user-id': currentUser.id },
    });
    if (response.ok) setComments(await response.json());
  };

  const loadVersions = async () => {
    const response = await fetch(`/api/documents/${document.id}/versions`, {
      headers: { 'x-user-id': currentUser.id },
    });
    if (response.ok) setVersions(await response.json());
  };

  const handleAddComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!commentText.trim()) return;
    const response = await fetch(`/api/documents/${document.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
      body: JSON.stringify({ text: commentText }),
    });
    if (response.ok) {
      setCommentText('');
      setShowAllComments(false);
      await loadComments();
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    const response = await fetch(`/api/documents/${document.id}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
      body: JSON.stringify({ versionId }),
    });
    if (!response.ok) return;
    const restored: DocumentItem = await response.json();
    setTitle(restored.title);
    editor?.commands.setContent(restored.contentHtml || '', false);
    await loadVersions();
  };

  // Sync document prop change when selecting different doc
  React.useEffect(() => {
    setTitle(document.title);
    if (editor && editor.getHTML() !== document.contentHtml) {
      editor.commands.setContent(document.contentHtml || '');
      editor.setEditable(canEdit);
    }
    setSaveState('saved');
  }, [document.id, document.contentHtml, document.title, canEdit, editor]);

  const triggerSave = (newTitle: string, html: string, text: string) => {
    setSaveState('saving');
    onUpdateDocument(document.id, newTitle, html, text);
    setTimeout(() => {
      setSaveState('saved');
    }, 400);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!canEdit) return;
    setSaveState('unsaved');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (editor) {
        triggerSave(val, editor.getHTML(), editor.getText());
      }
    }, 1000);
  };

  const handleExport = async (type: 'md' | 'txt' | 'html' | 'pdf') => {
    if (!editor) return;

    if (type === 'pdf') {
      const printableTitle = title.replace(/[<>&"']/g, '');
      const exportContainer = window.document.createElement('article');
      exportContainer.innerHTML = `<h1>${printableTitle || 'Untitled Document'}</h1>${editor.getHTML()}`;
      exportContainer.style.cssText = [
        'position: fixed',
        'left: -10000px',
        'top: 0',
        'width: 794px',
        'padding: 56px',
        'box-sizing: border-box',
        'background: #ffffff',
        'color: #111827',
        'font-family: Inter, Arial, sans-serif',
        'font-size: 16px',
        'line-height: 1.6',
      ].join(';');
      window.document.body.appendChild(exportContainer);

      try {
        const canvas = await html2canvas(exportContainer, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
        });
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imageWidth = pageWidth;
        const imageHeight = (canvas.height * imageWidth) / canvas.width;
        let remainingHeight = imageHeight;
        let offset = 0;

        while (remainingHeight > 0) {
          pdf.addImage(canvas, 'PNG', 0, offset, imageWidth, imageHeight);
          remainingHeight -= pageHeight;
          offset -= pageHeight;
          if (remainingHeight > 0) pdf.addPage();
        }

        pdf.save(`${(printableTitle || 'ajaia_document').toLowerCase().replace(/[^a-z0-9]+/g, '_')}.pdf`);
      } finally {
        exportContainer.remove();
      }
      setExportOpen(false);
      return;
    }

    let content = '';
    let mimeType = 'text/plain';
    let ext = 'txt';

    if (type === 'html') {
      content = editor.getHTML();
      mimeType = 'text/html';
      ext = 'html';
    } else if (type === 'md') {
      content = `# ${title}\n\n` + editor.getText();
      mimeType = 'text/markdown';
      ext = 'md';
    } else {
      content = editor.getText();
      mimeType = 'text/plain';
      ext = 'txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  if (!editor) {
    return <div className="editor-loading">Loading editor engine...</div>;
  }

  return (
    <main className="editor-main">
      {/* Top Document Bar */}
      <div className="doc-header-bar">
        <div className="title-area">
          <input
            type="text"
            id="input-doc-title"
            value={title}
            onChange={handleTitleChange}
            disabled={!canEdit}
            placeholder="Untitled Document"
            className="doc-title-input"
          />

          <div className="status-indicator">
            {saveState === 'saving' && (
              <span className="save-tag saving">
                <RefreshCw size={12} className="spin" />
                Saving...
              </span>
            )}
            {saveState === 'saved' && (
              <span className="save-tag saved">
                <CheckCircle2 size={12} />
                Saved to cloud
              </span>
            )}
            {saveState === 'unsaved' && (
              <span className="save-tag unsaved">Unsaved changes</span>
            )}
          </div>
        </div>

        <div className="top-right-actions">
          <div className="presence-stack" title="Active editors">
            {activeEditors.map((activeEditor) => (
              <img key={activeEditor.userId} src={activeEditor.userAvatar} alt={activeEditor.userName} className="presence-avatar" />
            ))}
          </div>
          <button className="btn btn-secondary" onClick={() => { setShowComments(!showComments); setShowVersions(false); if (!showComments) loadComments(); }} title="Document comments">
            <MessageSquare size={15} /><span>Comments</span>
          </button>
          <button className="btn btn-secondary" onClick={() => { setShowVersions(!showVersions); setShowComments(false); if (!showVersions) loadVersions(); }} title="Version history">
            <History size={15} /><span>History</span>
          </button>
          {/* Export Dropdown */}
          <div className="export-wrapper">
            <button
              id="btn-export-doc"
              onClick={() => setExportOpen(!exportOpen)}
              className="btn btn-secondary"
              title="Export document"
            >
              <Download size={15} />
              <span>Export</span>
            </button>

            {exportOpen && (
              <div className="export-dropdown">
                <button onClick={() => handleExport('md')} className="export-item">
                  <FileCode size={14} /> Export Markdown (.md)
                </button>
                <button onClick={() => handleExport('txt')} className="export-item">
                  <FileText size={14} /> Export Text (.txt)
                </button>
                <button onClick={() => handleExport('html')} className="export-item">
                  <FileCode size={14} /> Export HTML (.html)
                </button>
                <button onClick={() => handleExport('pdf')} className="export-item">
                  <FileText size={14} /> Export PDF
                </button>
              </div>
            )}
          </div>

          {/* Share Button (Owner Only) */}
          {document.ownerId === currentUser.id && (
            <button
              id="btn-share-main"
              onClick={() => onOpenShareModal(document)}
              className="btn btn-primary"
            >
              <Share2 size={15} />
              <span>Share</span>
            </button>
          )}
        </div>
      </div>

      {showComments && (
        <aside className="collaboration-panel">
          <div className="panel-heading"><strong>Comments</strong><span>{comments.length}</span></div>
          {comments.length === 0 ? <p className="panel-empty">No comments yet.</p> : (
            <>
              <button className={`comment-preview ${showAllComments ? 'expanded' : ''}`} onClick={() => setShowAllComments(!showAllComments)}>
                <img src={comments[comments.length - 1].userAvatar} alt={comments[comments.length - 1].userName} className="panel-avatar" />
                <span><strong>{comments[comments.length - 1].userName}</strong><small>{comments[comments.length - 1].text}</small></span>
              </button>
              {showAllComments && comments.slice(0, -1).reverse().map((comment) => (
                <div className="comment-row" key={comment.id}>
                  <img src={comment.userAvatar} alt={comment.userName} className="panel-avatar" />
                  <div><strong>{comment.userName}</strong><p>{comment.text}</p></div>
                </div>
              ))}
              {!showAllComments && comments.length > 1 && <button className="view-all-comments" onClick={() => setShowAllComments(true)}>View all {comments.length} comments</button>}
            </>
          )}
          {canComment && <form onSubmit={handleAddComment} className="comment-form"><input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Add a comment..." aria-label="Add a comment" /><button className="btn btn-primary" type="submit">Post</button></form>}
        </aside>
      )}

      {showVersions && (
        <aside className="collaboration-panel">
          <div className="panel-heading"><strong>Version history</strong><span>{versions.length}</span></div>
          {versions.length === 0 ? <p className="panel-empty">No earlier versions yet. Versions appear after edits.</p> : versions.map((version) => (
            <div className="version-row" key={version.id}><div><strong>{version.createdByName}</strong><span>{new Date(version.createdAt).toLocaleString()}</span><p>{version.title}</p></div>{canEdit && <button className="btn btn-secondary" onClick={() => handleRestoreVersion(version.id)}>Restore</button>}</div>
          ))}
        </aside>
      )}

      {/* Read-Only Warning Banner */}
      {!canEdit && (
        <div className="viewer-banner">
          <Lock size={16} />
          <span>You are viewing this document in <strong>View Only</strong> mode. Ask {document.ownerName} for edit access.</span>
        </div>
      )}

      {/* Rich Text Toolbar */}
      {canEdit && (
        <div className="toolbar">
          <div className="toolbar-group">
            <label className="font-family-control">
              <span className="sr-only">Font family</span>
              <select
                id="select-font-family"
                defaultValue="Inter"
                onChange={(event) => {
                  const fontFamily = event.target.value;
                  editor.chain().focus().setFontFamily(fontFamily).run();
                }}
                title="Font family"
                aria-label="Font family"
              >
                {fontFamilies.map((font) => (
                  <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="font-size-control">
              <span className="sr-only">Font size</span>
              <select
                id="select-font-size"
                defaultValue="16px"
                onChange={(event) => {
                  editor.chain().focus().setMark('textStyle', { fontSize: event.target.value }).run();
                }}
                title="Font size"
                aria-label="Font size"
              >
                {fontSizes.map((size) => (
                  <option key={size} value={size}>{size.replace('px', '')}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              id="tool-bold"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`btn-icon ${editor.isActive('bold') ? 'active' : ''}`}
              title="Bold (Ctrl+B)"
            >
              <Bold size={16} />
            </button>
            <button
              id="tool-italic"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`btn-icon ${editor.isActive('italic') ? 'active' : ''}`}
              title="Italic (Ctrl+I)"
            >
              <Italic size={16} />
            </button>
            <button
              id="tool-underline"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`btn-icon ${editor.isActive('underline') ? 'active' : ''}`}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon size={16} />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              id="tool-h1"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`btn-icon ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
              title="Heading 1"
            >
              <Heading1 size={16} />
            </button>
            <button
              id="tool-h2"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`btn-icon ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
              title="Heading 2"
            >
              <Heading2 size={16} />
            </button>
            <button
              id="tool-h3"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`btn-icon ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
              title="Heading 3"
            >
              <Heading3 size={16} />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              id="tool-bullet-list"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`btn-icon ${editor.isActive('bulletList') ? 'active' : ''}`}
              title="Bulleted List"
            >
              <List size={16} />
            </button>
            <button
              id="tool-ordered-list"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`btn-icon ${editor.isActive('orderedList') ? 'active' : ''}`}
              title="Numbered List"
            >
              <ListOrdered size={16} />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              id="tool-code"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`btn-icon ${editor.isActive('codeBlock') ? 'active' : ''}`}
              title="Code Block"
            >
              <Code size={16} />
            </button>
            <button
              id="tool-quote"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`btn-icon ${editor.isActive('blockquote') ? 'active' : ''}`}
              title="Blockquote"
            >
              <Quote size={16} />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              id="tool-undo"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="btn-icon"
              title="Undo (Ctrl+Z)"
            >
              <Undo size={16} />
            </button>
            <button
              id="tool-redo"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="btn-icon"
              title="Redo (Ctrl+Y)"
            >
              <Redo size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Editor Body */}
      <div className="editor-paper-wrapper">
        <div className="editor-paper" ref={paperRef}>
          <EditorContent editor={editor} />
          {activeEditors.filter((activeEditor) => activeEditor.userId !== currentUser.id && activeEditor.cursorPosition !== undefined).map((activeEditor) => {
            let cursorStyle = { top: 12, left: 12 };
            try {
              const coords = editor.view.coordsAtPos(Math.min(activeEditor.cursorPosition || 1, editor.state.doc.content.size));
              const paper = paperRef.current?.getBoundingClientRect();
              if (paper) cursorStyle = { top: coords.top - paper.top + 1, left: coords.left - paper.left };
            } catch {
              return null;
            }
            return (
              <div className="remote-cursor" key={activeEditor.userId} style={cursorStyle}>
                <span className="remote-caret" />
                <span className="remote-cursor-label"><img src={activeEditor.userAvatar} alt="" />{activeEditor.userName}</span>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .editor-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #0B0F17;
          overflow: hidden;
        }

        .editor-loading {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        .doc-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 28px;
          background: rgba(18, 24, 38, 0.6);
          border-bottom: 1px solid var(--border-subtle);
        }

        .title-area {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .doc-title-input {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          padding: 4px 8px;
          outline: none;
          transition: all 0.15s ease;
          width: 60%;
        }

        .doc-title-input:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--border-subtle);
        }

        .doc-title-input:focus {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--accent-primary);
        }

        .status-indicator {
          font-size: 0.75rem;
        }

        .save-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 12px;
          font-weight: 500;
        }

        .save-tag.saved {
          color: var(--accent-emerald);
          background: rgba(16, 185, 129, 0.1);
        }

        .save-tag.saving {
          color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.1);
        }

        .save-tag.unsaved {
          color: var(--accent-amber);
          background: rgba(245, 158, 11, 0.1);
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .top-right-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .export-wrapper {
          position: relative;
        }

        .export-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 6px);
          background: #111827;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          padding: 6px;
          z-index: 50;
          width: 200px;
        }

        .export-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.85rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          text-align: left;
        }

        .export-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .viewer-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 24px;
          background: rgba(245, 158, 11, 0.12);
          border-bottom: 1px solid rgba(245, 158, 11, 0.3);
          color: var(--accent-amber);
          font-size: 0.875rem;
        }

        .toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 24px;
          background: var(--bg-toolbar);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--border-subtle);
          overflow-x: auto;
        }

        .toolbar-group {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .presence-stack { display: flex; align-items: center; margin-right: 4px; }
        .presence-avatar { width: 26px; height: 26px; border: 2px solid var(--bg-toolbar); border-radius: 50%; margin-left: -6px; }
        .presence-avatar:first-child { margin-left: 0; }
        .collaboration-panel { display: flex; flex-direction: column; gap: 10px; padding: 12px 24px; max-height: 220px; overflow-y: auto; background: rgba(18, 24, 38, 0.96); border-bottom: 1px solid var(--border-subtle); }
        .panel-heading, .comment-row, .version-row { display: flex; align-items: center; gap: 8px; }
        .panel-heading { justify-content: space-between; }
        .panel-empty, .version-row span { color: var(--text-muted); font-size: 0.8rem; }
        .comment-row, .version-row { align-items: flex-start; padding: 8px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); }
        .comment-preview { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px; color: var(--text-primary); text-align: left; background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); cursor: pointer; }
        .comment-preview span { display: flex; flex-direction: column; min-width: 0; }
        .comment-preview small { overflow: hidden; color: var(--text-secondary); text-overflow: ellipsis; white-space: nowrap; }
        .view-all-comments { align-self: flex-start; padding: 0; color: var(--accent-primary); background: transparent; border: 0; cursor: pointer; font: inherit; font-size: 0.8rem; }
        .comment-row p, .version-row p { margin: 2px 0 0; color: var(--text-secondary); font-size: 0.85rem; }
        .panel-avatar { width: 28px; height: 28px; border-radius: 50%; }
        .comment-form { display: flex; gap: 8px; }
        .comment-form input { flex: 1; min-width: 0; padding: 8px 10px; color: var(--text-primary); background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); outline: none; }

        .font-family-control select {
          min-width: 132px;
          height: 32px;
          padding: 0 28px 0 10px;
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          font: inherit;
          cursor: pointer;
          outline: none;
        }

        .font-family-control select:focus {
          border-color: var(--accent-primary);
        }

        .font-size-control select {
          width: 64px;
          height: 32px;
          padding: 0 8px;
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          font: inherit;
          cursor: pointer;
          outline: none;
        }

        .font-size-control select:focus {
          border-color: var(--accent-primary);
        }

        .font-size-control option {
          color: #111827;
          background: #ffffff;
        }

        .font-family-control option {
          color: #111827;
          background: #ffffff;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .toolbar-divider {
          width: 1px;
          height: 20px;
          background: var(--border-subtle);
          margin: 0 4px;
        }

        .editor-paper-wrapper {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
          display: flex;
          justify-content: center;
        }

        .editor-paper {
          position: relative;
          width: 100%;
          max-width: 850px;
          background: rgba(18, 24, 38, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          min-height: 600px;
        }

        .remote-cursor { position: absolute; z-index: 4; pointer-events: none; transition: top 0.25s ease, left 0.25s ease; }
        .remote-caret { display: block; width: 2px; height: 22px; background: #f97316; box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.25); }
        .remote-cursor-label { position: absolute; top: -24px; left: 0; display: flex; align-items: center; gap: 4px; padding: 3px 6px; color: #ffffff; background: #f97316; border-radius: 4px; white-space: nowrap; font-size: 0.7rem; font-weight: 600; }
        .remote-cursor-label img { width: 16px; height: 16px; border-radius: 50%; }
      `}</style>
    </main>
  );
}
