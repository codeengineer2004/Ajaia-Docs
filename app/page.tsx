'use client';

import React from 'react';
import { User, DocumentItem } from '@/lib/types';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Editor from '@/components/Editor';
import ShareModal from '@/components/ShareModal';
import UploadModal from '@/components/UploadModal';
import Toast, { ToastMessage } from '@/components/Toast';

export default function HomePage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [documents, setDocuments] = React.useState<DocumentItem[]>([]);
  const [activeDocument, setActiveDocument] = React.useState<DocumentItem | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Modals state
  const [shareDoc, setShareDoc] = React.useState<DocumentItem | null>(null);
  const [showUploadModal, setShowUploadModal] = React.useState(false);

  // Toasts
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial fetch users
  React.useEffect(() => {
    async function initUsers() {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: data[0].id }),
          });
          setUsers(data);
          setCurrentUser(data[0]); // Default: Mohan Kumar
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    }
    initUsers();
  }, []);

  // Fetch documents whenever active user changes
  const fetchDocuments = React.useCallback(async (user: User) => {
    setLoading(true);
    try {
      const res = await fetch('/api/documents', {
        headers: { 'x-user-id': user.id },
      });
      const docs = await res.json();
      if (Array.isArray(docs)) {
        setDocuments(docs);
        if (docs.length > 0) {
          // Keep active document if valid, else pick first
          setActiveDocument((prev) => {
            const found = docs.find((d) => d.id === prev?.id);
            return found || docs[0];
          });
        } else {
          setActiveDocument(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch docs:', err);
      addToast('error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (currentUser) {
      fetchDocuments(currentUser);
    }
  }, [currentUser, fetchDocuments]);

  // Handle switching persona
  const handleSelectUser = async (user: User) => {
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });
    setCurrentUser(user);
    addToast('info', `Switched active persona to ${user.name}`);
  };

  // Create new document
  const handleNewDocument = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          title: 'Untitled Document',
          contentHtml: '<h1>Untitled Document</h1><p>Start editing content here...</p>',
          contentText: 'Untitled Document\nStart editing content here...',
        }),
      });

      if (!res.ok) throw new Error('Failed to create document');
      const newDoc = await res.json();

      setDocuments((prev) => [newDoc, ...prev]);
      setActiveDocument(newDoc);
      addToast('success', 'New document created');
    } catch (err: any) {
      addToast('error', err.message || 'Error creating document');
    }
  };

  // Delete document
  const handleDeleteDocument = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser.id },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }

      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (activeDocument?.id === docId) {
        const remaining = documents.filter((d) => d.id !== docId);
        setActiveDocument(remaining[0] || null);
      }
      addToast('success', 'Document deleted');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete document');
    }
  };

  // Update document content/title
  const handleUpdateDocument = async (
    docId: string,
    title: string,
    contentHtml: string,
    contentText: string
  ) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ title, contentHtml, contentText }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update document');
      }

      const updated = await res.json();

      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, ...updated } : d))
      );
      if (activeDocument?.id === docId) {
        setActiveDocument((prev) => (prev ? { ...prev, ...updated } : null));
      }
    } catch (err: any) {
      addToast('error', err.message || 'Error updating document');
    }
  };

  // Share document
  const handleShare = async (targetUserId: string, role: 'editor' | 'commenter' | 'viewer') => {
    if (!currentUser || !shareDoc) return;
    try {
      const res = await fetch(`/api/documents/${shareDoc.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ targetUserId, role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to share');
      }

      addToast('success', 'Access granted successfully');
      await fetchDocuments(currentUser);
      // Refresh shareDoc
      if (currentUser) {
        const updatedRes = await fetch(`/api/documents/${shareDoc.id}`, {
          headers: { 'x-user-id': currentUser.id },
        });
        if (updatedRes.ok) {
          const updatedDoc = await updatedRes.json();
          setShareDoc(updatedDoc);
        }
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to share document');
    }
  };

  // Revoke share
  const handleRevokeShare = async (targetUserId: string) => {
    if (!currentUser || !shareDoc) return;
    try {
      const res = await fetch(
        `/api/documents/${shareDoc.id}/share?targetUserId=${targetUserId}`,
        {
          method: 'DELETE',
          headers: { 'x-user-id': currentUser.id },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to revoke access');
      }

      addToast('success', 'Access revoked');
      await fetchDocuments(currentUser);
      if (currentUser) {
        const updatedRes = await fetch(`/api/documents/${shareDoc.id}`, {
          headers: { 'x-user-id': currentUser.id },
        });
        if (updatedRes.ok) {
          const updatedDoc = await updatedRes.json();
          setShareDoc(updatedDoc);
        }
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to revoke access');
    }
  };

  // File import completion
  const handleImportComplete = async (
    importedTitle: string,
    contentHtml: string,
    contentText: string,
    mode: 'new' | 'append'
  ) => {
    if (!currentUser) return;

    if (mode === 'append' && activeDocument) {
      const newHtml = (activeDocument.contentHtml || '') + contentHtml;
      const newText = (activeDocument.contentText || '') + '\n\n' + contentText;
      await handleUpdateDocument(activeDocument.id, activeDocument.title, newHtml, newText);
      addToast('success', 'Content appended to current document');
    } else {
      // Create new document from import
      try {
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id,
          },
          body: JSON.stringify({
            title: importedTitle,
            contentHtml,
            contentText,
          }),
        });

        if (!res.ok) throw new Error('Failed to create imported document');
        const newDoc = await res.json();

        setDocuments((prev) => [newDoc, ...prev]);
        setActiveDocument(newDoc);
        addToast('success', `Imported "${importedTitle}" as new document`);
      } catch (err: any) {
        addToast('error', err.message || 'Failed to import document');
      }
    }
  };

  if (!currentUser) {
    return <div className="app-loading">Initializing Ajaia Docs workspace...</div>;
  }

  return (
    <div className="app-container">
      {/* Header Bar */}
      <Header
        currentUser={currentUser}
        users={users}
        onSelectUser={handleSelectUser}
        onNewDocument={handleNewDocument}
        onOpenUpload={() => setShowUploadModal(true)}
      />

      {/* Main Workspace Body */}
      <div className="main-body">
        <Sidebar
          documents={documents}
          activeDocumentId={activeDocument?.id || null}
          currentUser={currentUser}
          onSelectDocument={(doc) => setActiveDocument(doc)}
          onNewDocument={handleNewDocument}
          onDeleteDocument={handleDeleteDocument}
          onOpenShareModal={(doc, e) => {
            e.stopPropagation();
            setShareDoc(doc);
          }}
        />

        {activeDocument ? (
          <Editor
            key={`${currentUser.id}-${activeDocument.id}`}
            document={activeDocument}
            currentUser={currentUser}
            onUpdateDocument={handleUpdateDocument}
            onOpenShareModal={(doc) => setShareDoc(doc)}
          />
        ) : (
          <div className="empty-workspace">
            <h2>No document selected</h2>
            <p>Select a document from the sidebar or create a new one to begin editing.</p>
            <button onClick={handleNewDocument} className="btn btn-primary">
              + Create Document
            </button>
          </div>
        )}
      </div>

      {/* Sharing Modal */}
      {shareDoc && (
        <ShareModal
          document={shareDoc}
          currentUser={currentUser}
          allUsers={users}
          onClose={() => setShareDoc(null)}
          onShare={handleShare}
          onRevoke={handleRevokeShare}
        />
      )}

      {/* Upload File Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onImportComplete={handleImportComplete}
        />
      )}

      {/* Toasts */}
      <Toast toasts={toasts} onDismiss={removeToast} />

      <style jsx>{`
        .app-loading {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0B0F17;
          color: var(--text-muted);
          font-size: 1.1rem;
        }

        .empty-workspace {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
