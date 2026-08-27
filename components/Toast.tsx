'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-card toast-${toast.type}`}>
          {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald" />}
          {toast.type === 'error' && <AlertCircle size={16} className="text-rose" />}
          {toast.type === 'info' && <Info size={16} className="text-cyan" />}
          <span className="toast-text">{toast.message}</span>
          <button onClick={() => onDismiss(toast.id)} className="toast-close">
            <X size={14} />
          </button>
        </div>
      ))}

      <style jsx>{`
        .toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 1000;
        }

        .toast-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #1E293B;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          color: var(--text-primary);
          font-size: 0.875rem;
          min-width: 280px;
          animation: slideUp 0.2s ease-out;
        }

        @keyframes slideUp {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .toast-success {
          border-color: rgba(16, 185, 129, 0.4);
        }

        .toast-error {
          border-color: rgba(244, 63, 94, 0.4);
        }

        .toast-info {
          border-color: rgba(6, 182, 212, 0.4);
        }

        .toast-text {
          flex: 1;
        }

        .toast-close {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
