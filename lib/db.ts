import fs from 'fs';
import path from 'path';
import {
  User,
  DocumentItem,
  DocumentShare,
  AccessRole,
  DocumentComment,
  DocumentVersion,
  ActiveEditor,
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export const SEEDED_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Mohan Kumar',
    email: 'mohan@ajaia.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohan',
    role: 'Staff Product Engineer',
  },
  {
    id: 'user-2',
    name: 'Alex Rivera',
    email: 'alex@ajaia.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    role: 'Lead AI Engineer',
  },
  {
    id: 'user-3',
    name: 'Sarah Chen',
    email: 'sarah@ajaia.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    role: 'Product Designer',
  },
];

interface DatabaseSchema {
  users: User[];
  documents: DocumentItem[];
  shares: DocumentShare[];
  comments?: DocumentComment[];
  versions?: DocumentVersion[];
  presence?: ActiveEditor[];
}

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-101',
    title: '🚀 Product Vision: Ajaia AI Productivity Engine',
    contentHtml: `<h1>Ajaia AI Productivity Engine</h1><p>Welcome to <strong>Ajaia Docs</strong>, an internal productivity tool designed for rapid, collaborative document editing with <em>AI assistance</em>.</p><h2>Key Features</h2><ul><li><strong>Rich-Text Editing:</strong> Seamless formatting with headings, lists, and instant styling.</li><li><strong>File Upload & Import:</strong> Directly turn .txt, .md, or .docx files into live drafts.</li><li><strong>Granular Sharing:</strong> Assign Owner, Editor, or Viewer privileges per team member.</li></ul><h2>Architecture Goals</h2><p>Prioritize visual excellence, ultra-fast client interaction, and explicit permission safety.</p>`,
    contentText: 'Ajaia AI Productivity Engine\nWelcome to Ajaia Docs...',
    ownerId: 'user-1',
    ownerName: 'Mohan Kumar',
    ownerEmail: 'mohan@ajaia.io',
    ownerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohan',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'doc-102',
    title: '⚡ Technical Architecture & Storage Strategy',
    contentHtml: `<h1>Technical Architecture</h1><p>This document outlines the full-stack design decisions for <u>Ajaia Docs</u>.</p><h2>Data Storage & Integrity</h2><p>Data persistence is managed via an atomic JSON storage engine with full ACID-like atomic writes, eliminating external setup friction while providing zero-delay reloading.</p><h2>Permission Model</h2><p>Access control differentiates strictly between <strong>Owners</strong>, <strong>Editors</strong>, and <strong>Viewers</strong>.</p>`,
    contentText: 'Technical Architecture\nThis document outlines full-stack design decisions...',
    ownerId: 'user-2',
    ownerName: 'Alex Rivera',
    ownerEmail: 'alex@ajaia.io',
    ownerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'doc-103',
    title: '🎨 Ajaia Design System & UX Principles',
    contentHtml: `<h1>Design System Tokens</h1><p>Guidelines for modern dark/light mode interfaces across Ajaia tools.</p><ul><li>Glassmorphism headers with backdrop-blur</li><li>Inter & System UI typography hierarchy</li><li>Micro-animations on hover and active focus states</li></ul>`,
    contentText: 'Design System Tokens\nGuidelines for modern UI...',
    ownerId: 'user-1',
    ownerName: 'Mohan Kumar',
    ownerEmail: 'mohan@ajaia.io',
    ownerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohan',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

const INITIAL_SHARES: DocumentShare[] = [
  {
    id: 'share-1',
    documentId: 'doc-101',
    userId: 'user-2',
    userEmail: 'alex@ajaia.io',
    userName: 'Alex Rivera',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    role: 'editor',
    sharedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'share-2',
    documentId: 'doc-101',
    userId: 'user-3',
    userEmail: 'sarah@ajaia.io',
    userName: 'Sarah Chen',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    role: 'viewer',
    sharedAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'share-3',
    documentId: 'doc-102',
    userId: 'user-1',
    userEmail: 'mohan@ajaia.io',
    userName: 'Mohan Kumar',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohan',
    role: 'editor',
    sharedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

// Helper to ensure data file exists
function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = {
        users: SEEDED_USERS,
        documents: INITIAL_DOCUMENTS,
        shares: INITIAL_SHARES,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(content) as DatabaseSchema;
    // Always ensure users are seeded correctly
    db.users = SEEDED_USERS;
    db.comments ||= [];
    db.versions ||= [];
    db.presence ||= [];
    return db;
  } catch (err) {
    console.error('Error reading DB, resetting to defaults:', err);
    return {
      users: SEEDED_USERS,
      documents: INITIAL_DOCUMENTS,
      shares: INITIAL_SHARES,
      comments: [],
      versions: [],
      presence: [],
    };
  }
}

function writeDb(db: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

export function getUsers(): User[] {
  const db = readDb();
  return db.users;
}

export function getUserById(userId: string): User | undefined {
  const db = readDb();
  return db.users.find((u) => u.id === userId);
}

export function getDocumentsForUser(userId: string): DocumentItem[] {
  const db = readDb();
  const result: DocumentItem[] = [];

  for (const doc of db.documents) {
    const docShares = db.shares.filter((s) => s.documentId === doc.id);

    if (doc.ownerId === userId) {
      result.push({
        ...doc,
        shares: docShares,
        currentUserRole: 'owner',
        isOwnedByCurrentUser: true,
      });
    } else {
      const userShare = docShares.find((s) => s.userId === userId);
      if (userShare) {
        result.push({
          ...doc,
          shares: docShares,
          currentUserRole: userShare.role,
          isOwnedByCurrentUser: false,
        });
      }
    }
  }

  // Sort by updatedAt descending
  return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getDocumentById(docId: string, userId: string): DocumentItem | null {
  const db = readDb();
  const doc = db.documents.find((d) => d.id === docId);
  if (!doc) return null;

  const docShares = db.shares.filter((s) => s.documentId === docId);

  if (doc.ownerId === userId) {
    return {
      ...doc,
      shares: docShares,
      currentUserRole: 'owner',
      isOwnedByCurrentUser: true,
    };
  }

  const userShare = docShares.find((s) => s.userId === userId);
  if (userShare) {
    return {
      ...doc,
      shares: docShares,
      currentUserRole: userShare.role,
      isOwnedByCurrentUser: false,
    };
  }

  // User has no access
  return null;
}

export function createDocument(data: {
  title: string;
  contentHtml: string;
  contentText: string;
  ownerId: string;
}): DocumentItem {
  const db = readDb();
  const owner = db.users.find((u) => u.id === data.ownerId) || SEEDED_USERS[0];

  const newDoc: DocumentItem = {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: data.title || 'Untitled Document',
    contentHtml: data.contentHtml || '',
    contentText: data.contentText || '',
    ownerId: owner.id,
    ownerName: owner.name,
    ownerEmail: owner.email,
    ownerAvatar: owner.avatar,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    shares: [],
    currentUserRole: 'owner',
    isOwnedByCurrentUser: true,
  };

  db.documents.unshift(newDoc);
  writeDb(db);
  return newDoc;
}

export function updateDocument(
  docId: string,
  userId: string,
  updates: { title?: string; contentHtml?: string; contentText?: string }
): DocumentItem | null {
  const db = readDb();
  const docIndex = db.documents.findIndex((d) => d.id === docId);
  if (docIndex === -1) return null;

  const doc = db.documents[docIndex];
  const docShares = db.shares.filter((s) => s.documentId === docId);

  // Check permission: Owner or Editor can update
  const isOwner = doc.ownerId === userId;
  const userShare = docShares.find((s) => s.userId === userId);
  const canEdit = isOwner || (userShare && userShare.role === 'editor');

  if (!canEdit) {
    throw new Error('Permission denied: Viewer role cannot edit documents');
  }

  const updatedDoc: DocumentItem = {
    ...doc,
    title: updates.title !== undefined ? updates.title : doc.title,
    contentHtml: updates.contentHtml !== undefined ? updates.contentHtml : doc.contentHtml,
    contentText: updates.contentText !== undefined ? updates.contentText : doc.contentText,
    updatedAt: new Date().toISOString(),
  };

  const editor = db.users.find((user) => user.id === userId) || SEEDED_USERS[0];
  db.versions ||= [];
  db.versions.push({
    id: `version-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    documentId: docId,
    title: doc.title,
    contentHtml: doc.contentHtml,
    contentText: doc.contentText,
    createdAt: new Date().toISOString(),
    createdBy: editor.id,
    createdByName: editor.name,
  });

  db.documents[docIndex] = updatedDoc;
  writeDb(db);

  return {
    ...updatedDoc,
    shares: docShares,
    currentUserRole: isOwner ? 'owner' : (userShare?.role as AccessRole),
    isOwnedByCurrentUser: isOwner,
  };
}

export function deleteDocument(docId: string, userId: string): boolean {
  const db = readDb();
  const doc = db.documents.find((d) => d.id === docId);
  if (!doc) return false;

  // Only Owner can delete
  if (doc.ownerId !== userId) {
    throw new Error('Permission denied: Only the document owner can delete this document');
  }

  db.documents = db.documents.filter((d) => d.id !== docId);
  db.shares = db.shares.filter((s) => s.documentId !== docId);
  writeDb(db);
  return true;
}

export function shareDocument(
  docId: string,
  requestUserId: string,
  targetUserId: string,
  role: 'editor' | 'commenter' | 'viewer'
): DocumentShare {
  const db = readDb();
  const doc = db.documents.find((d) => d.id === docId);
  if (!doc) throw new Error('Document not found');

  // Only Owner can manage sharing
  if (doc.ownerId !== requestUserId) {
    throw new Error('Permission denied: Only the owner can share documents');
  }

  const targetUser = db.users.find((u) => u.id === targetUserId);
  if (!targetUser) throw new Error('Target user not found');

  if (targetUserId === doc.ownerId) {
    throw new Error('Cannot share document with the owner');
  }

  // Remove existing share if any
  db.shares = db.shares.filter((s) => !(s.documentId === docId && s.userId === targetUserId));

  const newShare: DocumentShare = {
    id: `share-${Date.now()}`,
    documentId: docId,
    userId: targetUser.id,
    userEmail: targetUser.email,
    userName: targetUser.name,
    userAvatar: targetUser.avatar,
    role: role,
    sharedAt: new Date().toISOString(),
  };

  db.shares.push(newShare);
  writeDb(db);
  return newShare;
}

export function getComments(docId: string, userId: string): DocumentComment[] {
  if (!getDocumentById(docId, userId)) throw new Error('Permission denied');
  const db = readDb();
  return (db.comments || []).filter((comment) => comment.documentId === docId);
}

export function addComment(docId: string, userId: string, text: string): DocumentComment {
  const doc = getDocumentById(docId, userId);
  if (!doc) throw new Error('Permission denied');
  if (!doc.currentUserRole || !['owner', 'editor', 'commenter'].includes(doc.currentUserRole)) {
    throw new Error('Permission denied: Viewer role cannot comment');
  }
  if (!text.trim()) throw new Error('Comment text is required');
  const db = readDb();
  const user = db.users.find((item) => item.id === userId) || SEEDED_USERS[0];
  const comment: DocumentComment = {
    id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    documentId: docId,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };
  db.comments ||= [];
  db.comments.push(comment);
  writeDb(db);
  return comment;
}

export function getVersions(docId: string, userId: string): DocumentVersion[] {
  if (!getDocumentById(docId, userId)) throw new Error('Permission denied');
  const db = readDb();
  return (db.versions || [])
    .filter((version) => version.documentId === docId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function restoreVersion(docId: string, userId: string, versionId: string): DocumentItem {
  const db = readDb();
  const docIndex = db.documents.findIndex((item) => item.id === docId);
  const version = (db.versions || []).find((item) => item.id === versionId && item.documentId === docId);
  if (docIndex === -1 || !version) throw new Error('Version not found');
  const doc = db.documents[docIndex];
  const share = db.shares.find((item) => item.documentId === docId && item.userId === userId);
  if (doc.ownerId !== userId && share?.role !== 'editor') throw new Error('Permission denied: Only owners and editors can restore versions');
  const user = db.users.find((item) => item.id === userId) || SEEDED_USERS[0];
  db.versions ||= [];
  db.versions.push({ id: `version-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, documentId: docId, title: doc.title, contentHtml: doc.contentHtml, contentText: doc.contentText, createdAt: new Date().toISOString(), createdBy: user.id, createdByName: user.name });
  const restored = { ...doc, title: version.title, contentHtml: version.contentHtml, contentText: version.contentText, updatedAt: new Date().toISOString() };
  db.documents[docIndex] = restored;
  writeDb(db);
  return { ...restored, shares: db.shares.filter((item) => item.documentId === docId), currentUserRole: doc.ownerId === userId ? 'owner' : (share?.role as AccessRole), isOwnedByCurrentUser: doc.ownerId === userId };
}

export function getActiveEditors(docId: string, userId: string): ActiveEditor[] {
  if (!getDocumentById(docId, userId)) throw new Error('Permission denied');
  const db = readDb();
  const cutoff = Date.now() - 30000;
  db.presence = (db.presence || []).filter((editor) => new Date(editor.lastSeen).getTime() > cutoff);
  writeDb(db);
  return db.presence.filter((editor) => editor.documentId === docId);
}

export function heartbeat(docId: string, userId: string, cursorPosition?: number): ActiveEditor[] {
  if (!getDocumentById(docId, userId)) throw new Error('Permission denied');
  const db = readDb();
  const user = db.users.find((item) => item.id === userId) || SEEDED_USERS[0];
  db.presence = (db.presence || []).filter((editor) => !(editor.documentId === docId && editor.userId === userId));
  db.presence.push({
    documentId: docId,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    lastSeen: new Date().toISOString(),
    cursorPosition,
  });
  writeDb(db);
  return getActiveEditors(docId, userId);
}

export function revokeShare(docId: string, requestUserId: string, targetUserId: string): boolean {
  const db = readDb();
  const doc = db.documents.find((d) => d.id === docId);
  if (!doc) throw new Error('Document not found');

  if (doc.ownerId !== requestUserId) {
    throw new Error('Permission denied: Only the owner can revoke document access');
  }

  const initialCount = db.shares.length;
  db.shares = db.shares.filter((s) => !(s.documentId === docId && s.userId === targetUserId));
  writeDb(db);

  return db.shares.length < initialCount;
}
