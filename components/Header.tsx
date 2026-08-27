'use client';

import React from 'react';
import { User } from '@/lib/types';
import { FileText, Users, Sparkles, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  onNewDocument: () => void;
  onOpenUpload: () => void;
}

export default function Header({
  currentUser,
  users,
  onSelectUser,
  onNewDocument,
  onOpenUpload,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <header className="header-nav">
      <div className="header-brand">
        <div className="logo-icon">
          <Sparkles size={20} className="sparkle-svg" />
        </div>
        <div className="brand-text">
          <span className="brand-title">Ajaia Docs</span>
          <span className="brand-badge">AI Productivity</span>
        </div>
      </div>

      <div className="header-actions">
        <button
          id="btn-import-header"
          onClick={onOpenUpload}
          className="btn btn-secondary"
          title="Import file (.txt, .md, .docx)"
        >
          <FileText size={16} />
          <span>Import File</span>
        </button>

        <button
          id="btn-new-doc-header"
          onClick={onNewDocument}
          className="btn btn-primary"
        >
          <span>+ New Document</span>
        </button>

        {/* Persona Switcher */}
        <div className="persona-wrapper">
          <button
            id="btn-persona-switcher"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="persona-btn"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="user-avatar"
            />
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role">{currentUser.role}</span>
            </div>
            <ChevronDown size={14} className="chevron" />
          </button>

          {dropdownOpen && (
            <div className="persona-dropdown">
              <div className="dropdown-header">
                <Users size={14} />
                <span>Switch Persona (Demo Auth)</span>
              </div>
              {users.map((u) => (
                <button
                  key={u.id}
                  id={`persona-option-${u.id}`}
                  onClick={() => {
                    onSelectUser(u);
                    setDropdownOpen(false);
                  }}
                  className={`dropdown-item ${u.id === currentUser.id ? 'active' : ''}`}
                >
                  <img src={u.avatar} alt={u.name} className="user-avatar-sm" />
                  <div className="user-details">
                    <div className="user-name-row">
                      <span>{u.name}</span>
                      {u.id === currentUser.id && <span className="active-dot" />}
                    </div>
                    <span className="user-email">{u.email}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .header-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          background: rgba(15, 22, 35, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-subtle);
          z-index: 50;
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: var(--shadow-glow);
        }

        .brand-text {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .brand-title {
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-badge {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 10px;
          background: rgba(99, 102, 241, 0.15);
          color: var(--accent-primary);
          border: 1px solid rgba(99, 102, 241, 0.3);
          text-transform: uppercase;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .persona-wrapper {
          position: relative;
        }

        .persona-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--text-primary);
        }

        .persona-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #1E293B;
        }

        .user-avatar-sm {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #1E293B;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .user-name {
          font-size: 0.85rem;
          font-weight: 600;
          line-height: 1.1;
        }

        .user-role {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .chevron {
          color: var(--text-muted);
        }

        .persona-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 280px;
          background: #111827;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          padding: 8px;
          z-index: 100;
        }

        .dropdown-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 4px;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          background: transparent;
          border: none;
          color: var(--text-primary);
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .dropdown-item.active {
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.25);
        }

        .user-details {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .user-name-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .active-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-emerald);
          box-shadow: 0 0 8px var(--accent-emerald);
        }

        .user-email {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
      `}</style>
    </header>
  );
}
