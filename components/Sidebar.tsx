'use client';

import React from 'react';
import { DocumentItem, User } from '@/lib/types';
import {
  FileText,
  Search,
  Plus,
  Users,
  UserCheck,
  Trash2,
  Share2,
  FolderOpen,
} from 'lucide-react';

interface SidebarProps {
  documents: DocumentItem[];
  activeDocumentId: string | null;
  currentUser: User;
  onSelectDocument: (doc: DocumentItem) => void;
  onNewDocument: () => void;
  onDeleteDocument: (docId: string, e: React.MouseEvent) => void;
  onOpenShareModal: (doc: DocumentItem, e: React.MouseEvent) => void;
}

export default function Sidebar({
  documents,
  activeDocumentId,
  currentUser,
  onSelectDocument,
  onNewDocument,
  onDeleteDocument,
  onOpenShareModal,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'owned' | 'shared'>('all');

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.contentText.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'owned') return doc.ownerId === currentUser.id;
    if (filter === 'shared') return doc.ownerId !== currentUser.id;
    return true;
  });

  const ownedCount = documents.filter((d) => d.ownerId === currentUser.id).length;
  const sharedCount = documents.filter((d) => d.ownerId !== currentUser.id).length;

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <button
          id="btn-sidebar-new"
          onClick={onNewDocument}
          className="btn btn-primary new-doc-btn"
        >
          <Plus size={18} />
          <span>New Document</span>
        </button>

        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            id="input-search-docs"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Filter Navigation */}
        <div className="filter-tabs">
          <button
            id="filter-tab-all"
            onClick={() => setFilter('all')}
            className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
          >
            <span>All ({documents.length})</span>
          </button>
          <button
            id="filter-tab-owned"
            onClick={() => setFilter('owned')}
            className={`tab-btn ${filter === 'owned' ? 'active' : ''}`}
          >
            <span>Mine ({ownedCount})</span>
          </button>
          <button
            id="filter-tab-shared"
            onClick={() => setFilter('shared')}
            className={`tab-btn ${filter === 'shared' ? 'active' : ''}`}
          >
            <span>Shared ({sharedCount})</span>
          </button>
        </div>
      </div>

      {/* Document List */}
      <div className="doc-list">
        {filteredDocs.length === 0 ? (
          <div className="empty-state">
            <FolderOpen size={32} className="empty-icon" />
            <p>No documents found</p>
            <span className="empty-sub">
              {searchQuery ? 'Try adjusting your search' : 'Create a new document to get started'}
            </span>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isSelected = doc.id === activeDocumentId;
            const isOwner = doc.ownerId === currentUser.id;
            const role = doc.currentUserRole || (isOwner ? 'owner' : 'viewer');

            return (
              <div
                key={doc.id}
                id={`doc-item-${doc.id}`}
                onClick={() => onSelectDocument(doc)}
                className={`doc-card ${isSelected ? 'selected' : ''}`}
              >
                <div className="doc-card-top">
                  <div className="doc-icon">
                    <FileText size={18} />
                  </div>
                  <h4 className="doc-title" title={doc.title}>
                    {doc.title || 'Untitled Document'}
                  </h4>
                </div>

                <div className="doc-card-footer">
                  <div className="badge-group">
                    {isOwner ? (
                      <span className="badge badge-owner" title="You own this document">
                        <UserCheck size={11} />
                        Owned
                      </span>
                    ) : (
                      <span
                        className={`badge ${role === 'editor' ? 'badge-editor' : 'badge-viewer'}`}
                        title={`Shared with you as ${role}`}
                      >
                        <Users size={11} />
                        {role === 'editor' ? 'Can Edit' : 'View Only'}
                      </span>
                    )}
                  </div>

                  <div className="doc-actions">
                    {isOwner && (
                      <button
                        id={`btn-share-doc-${doc.id}`}
                        onClick={(e) => onOpenShareModal(doc, e)}
                        className="btn-icon"
                        title="Share document"
                      >
                        <Share2 size={14} />
                      </button>
                    )}
                    {isOwner && (
                      <button
                        id={`btn-delete-doc-${doc.id}`}
                        onClick={(e) => onDeleteDocument(doc.id, e)}
                        className="btn-icon btn-delete"
                        title="Delete document"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .sidebar {
          width: 320px;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .sidebar-top {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .new-doc-btn {
          width: 100%;
          justify-content: center;
          padding: 10px;
          font-weight: 600;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px 8px 34px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 0.85rem;
          outline: none;
          transition: all 0.15s ease;
        }

        .search-input:focus {
          border-color: var(--accent-primary);
          background: rgba(255, 255, 255, 0.07);
        }

        .filter-tabs {
          display: flex;
          background: rgba(0, 0, 0, 0.25);
          padding: 3px;
          border-radius: var(--radius-md);
          gap: 2px;
        }

        .tab-btn {
          flex: 1;
          padding: 6px 0;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tab-btn.active {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
          font-weight: 600;
        }

        .doc-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
          color: var(--text-muted);
          text-align: center;
        }

        .empty-icon {
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .empty-sub {
          font-size: 0.75rem;
          margin-top: 4px;
        }

        .doc-card {
          padding: 12px 14px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .doc-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .doc-card.selected {
          background: rgba(99, 102, 241, 0.12);
          border-color: var(--border-glow);
          box-shadow: var(--shadow-glow);
        }

        .doc-card-top {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .doc-icon {
          color: var(--accent-primary);
        }

        .doc-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .doc-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .doc-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          opacity: 0.7;
        }

        .doc-card:hover .doc-actions {
          opacity: 1;
        }

        .btn-delete:hover {
          color: var(--accent-rose);
          background: rgba(244, 63, 94, 0.15);
        }
      `}</style>
    </aside>
  );
}
