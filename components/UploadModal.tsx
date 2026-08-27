'use client';

import React from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadModalProps {
  onClose: () => void;
  onImportComplete: (
    title: string,
    contentHtml: string,
    contentText: string,
    mode: 'new' | 'append'
  ) => void;
}

export default function UploadModal({ onClose, onImportComplete }: UploadModalProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [importMode, setImportMode] = React.useState<'new' | 'append'>('new');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['txt', 'md', 'docx', 'json'].includes(ext || '')) {
      setError('Unsupported file type. Please upload a .txt, .md, .docx, or .json file.');
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      onImportComplete(data.title, data.contentHtml, data.contentText, importMode);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error processing file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="title-row">
            <Upload className="modal-icon" size={20} />
            <div>
              <h3>Import File Content</h3>
              <p className="subtitle">Upload .txt, .md, or .docx files into Ajaia Docs</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Drag and Drop Zone */}
          <div
            className={`dropzone ${dragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload-input"
              accept=".txt,.md,.docx,.json"
              onChange={handleFileInput}
              className="hidden-file-input"
            />

            {selectedFile ? (
              <div className="file-preview">
                <FileText size={36} className="text-indigo" />
                <div className="file-info">
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button onClick={() => setSelectedFile(null)} className="btn-icon">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label htmlFor="file-upload-input" className="dropzone-label">
                <Upload size={36} className="upload-icon" />
                <span className="drag-text">Drag and drop file here, or browse</span>
                <span className="supported-formats">Supported: .txt, .md, .docx, .json</span>
              </label>
            )}
          </div>

          {error && (
            <div className="error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Import Target Option */}
          {selectedFile && (
            <div className="mode-options">
              <label className="field-label">Import Mode</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="importMode"
                    value="new"
                    checked={importMode === 'new'}
                    onChange={() => setImportMode('new')}
                  />
                  <span>Create as a new document</span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                  />
                  <span>Append to currently open document</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            id="btn-process-upload"
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            className="btn btn-primary"
          >
            {loading ? 'Processing...' : 'Import Document'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-content {
          width: 100%;
          max-width: 500px;
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
          gap: 16px;
        }

        .dropzone {
          border: 2px dashed var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 28px;
          text-align: center;
          transition: all 0.2s ease;
          background: rgba(255, 255, 255, 0.01);
        }

        .dropzone.drag-over {
          border-color: var(--accent-primary);
          background: rgba(99, 102, 241, 0.08);
        }

        .dropzone.has-file {
          border-style: solid;
          border-color: var(--border-glow);
          background: rgba(99, 102, 241, 0.05);
          padding: 16px;
        }

        .hidden-file-input {
          display: none;
        }

        .dropzone-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .upload-icon {
          color: var(--text-muted);
        }

        .drag-text {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .supported-formats {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .file-preview {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .file-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          text-align: left;
        }

        .file-name {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .file-size {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(244, 63, 94, 0.15);
          border: 1px solid rgba(244, 63, 94, 0.3);
          border-radius: var(--radius-sm);
          color: var(--accent-rose);
          font-size: 0.85rem;
        }

        .mode-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
        }

        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid var(--border-subtle);
        }
      `}</style>
    </div>
  );
}
