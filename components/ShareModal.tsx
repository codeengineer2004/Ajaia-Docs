'use client';

import React from 'react';
import { DocumentItem, User } from '@/lib/types';
import { X, UserPlus, Trash2, Link, Check, Shield, Users } from 'lucide-react';

interface ShareModalProps {
  document: DocumentItem;
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onShare: (targetUserId: string, role: 'editor' | 'commenter' | 'viewer') => Promise<void>;
  onRevoke: (targetUserId: string) => Promise<void>;
}

export default function ShareModal({
  document,
  currentUser,
  allUsers,
  onClose,
  onShare,
  onRevoke,
}: ShareModalProps) {
  const [selectedUser, setSelectedUser] = React.useState<string>('');
  const [selectedRole, setSelectedRole] = React.useState<'editor' | 'commenter' | 'viewer'>('editor');
  const [copied, setCopied] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Available users to invite (excluding owner)
  const availableUsers = allUsers.filter((u) => u.id !== currentUser.id);

  // Pre-select first user if none selected
  React.useEffect(() => {
    if (availableUsers.length > 0 && !selectedUser) {
      setSelectedUser(availableUsers[0].id);
    }
  }, [availableUsers, selectedUser]);

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    try {
      await onShare(selectedUser, selectedRole);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="title-row">
            <Users className="modal-icon" size={20} />
            <div>
              <h3>Share Document</h3>
              <p className="subtitle">{document.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Grant Access Form */}
          <form onSubmit={handleGrantAccess} className="share-form">
            <label className="field-label">Invite Collaborator</label>
            <div className="form-inputs">
              <select
                id="select-share-user"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="select-input"
              >
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>

              <select
                id="select-share-role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'editor' | 'commenter' | 'viewer')}
                className="role-select"
              >
                <option value="editor">Editor (Can edit)</option>
                <option value="commenter">Commenter (Can comment)</option>
                <option value="viewer">Viewer (Read only)</option>
              </select>

              <button
                type="submit"
                id="btn-confirm-share"
                disabled={loading || !selectedUser}
                className="btn btn-primary"
              >
                <UserPlus size={16} />
                <span>Invite</span>
              </button>
            </div>
          </form>

          {/* Current Collaborators */}
          <div className="collaborators-section">
            <label className="field-label">People with access</label>

            {/* Owner */}
            <div className="user-row">
              <img src={document.ownerAvatar} alt={document.ownerName} className="row-avatar" />
              <div className="row-info">
                <span className="row-name">{document.ownerName} (You)</span>
                <span className="row-email">{document.ownerEmail}</span>
              </div>
              <span className="badge badge-owner">Owner</span>
            </div>

            {/* Shares */}
            {document.shares && document.shares.length > 0 ? (
              document.shares.map((share) => (
                <div key={share.id} className="user-row">
                  <img src={share.userAvatar} alt={share.userName} className="row-avatar" />
                  <div className="row-info">
                    <span className="row-name">{share.userName}</span>
                    <span className="row-email">{share.userEmail}</span>
                  </div>
                  <span
                    className={`badge ${share.role === 'editor' ? 'badge-editor' : 'badge-viewer'}`}
                  >
                    {share.role === 'editor' ? 'Editor' : share.role === 'commenter' ? 'Commenter' : 'Viewer'}
                  </span>
                  <button
                    id={`btn-revoke-share-${share.userId}`}
                    onClick={() => onRevoke(share.userId)}
                    className="btn-icon btn-delete"
                    title="Revoke access"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="no-shares">No extra collaborators added yet.</p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button id="btn-copy-link" onClick={handleCopyLink} className="btn btn-secondary">
            {copied ? <Check size={16} className="text-emerald" /> : <Link size={16} />}
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Done
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-content {
          width: 100%;
          max-width: 520px;
          background: #111827;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-icon {
          color: var(--accent-primary);
        }

        h3 {
          font-size: 1.1rem;
          font-weight: 700;
        }

        .subtitle {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .modal-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .field-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          display: block;
        }

        .form-inputs {
          display: flex;
          gap: 8px;
        }

        .select-input, .role-select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          padding: 8px 12px;
          font-size: 0.85rem;
          outline: none;
        }

        .select-input {
          flex: 1;
        }

        .role-select {
          width: 130px;
        }

        .collaborators-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .user-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
        }

        .row-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
        }

        .row-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .row-name {
          font-size: 0.85rem;
          font-weight: 600;
        }

        .row-email {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .no-shares {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-style: italic;
          padding: 4px 0;
        }

        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid var(--border-subtle);
        }
      `}</style>
    </div>
  );
}
