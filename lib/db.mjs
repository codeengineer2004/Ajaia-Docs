import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export const SEEDED_USERS = [
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

const INITIAL_DOCUMENTS = [
  {
    id: 'doc-101',
    title: '🚀 Product Vision: Ajaia AI Productivity Engine',
    contentHtml: '<h1>Ajaia AI Productivity Engine</h1><p>Welcome to <strong>Ajaia Docs</strong>.</p>',
    contentText: 'Ajaia AI Productivity Engine\nWelcome to Ajaia Docs...',
    ownerId: 'user-1',
    ownerName: 'Mohan Kumar',
    ownerEmail: 'mohan@ajaia.io',
    ownerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohan',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

const INITIAL_SHARES = [];

function readDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = {
        users: SEEDED_USERS,
        documents: INITIAL_DOCUMENTS,
        shares: INITIAL_SHARES,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(content);
    db.users = SEEDED_USERS;
    db.comments ||= [];
    db.versions ||= [];
    db.presence ||= [];
    return db;
  } catch (err) {
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

function writeDb(db) {
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

export function getUsers() {
  const db = readDb();
  return db.users;
}

export function getUserById(userId) {
  const db = readDb();
  return db.users.find((u) => u.id === userId);
}

export function getDocumentsForUser(userId) {
  const db = readDb();
  const result = [];

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

  return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getDocumentById(docId, userId) {
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

  return null;
}

export function createDocument(data) {
  const db = readDb();
  const owner = db.users.find((u) => u.id === data.ownerId) || SEEDED_USERS[0];

  const newDoc = {
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

export function updateDocument(docId, userId, updates) {
  const db = readDb();
  const docIndex = db.documents.findIndex((d) => d.id === docId);
  if (docIndex === -1) return null;

  const doc = db.documents[docIndex];
  const docShares = db.shares.filter((s) => s.documentId === docId);

  const isOwner = doc.ownerId === userId;
  const userShare = docShares.find((s) => s.userId === userId);
  const canEdit = isOwner || (userShare && userShare.role === 'editor');

  if (!canEdit) {
    throw new Error('Permission denied: Viewer role cannot edit documents');
  }

  const updatedDoc = {
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
    currentUserRole: isOwner ? 'owner' : userShare?.role,
    isOwnedByCurrentUser: isOwner,
  };
}

export function deleteDocument(docId, userId) {
  const db = readDb();
  const doc = db.documents.find((d) => d.id === docId);
  if (!doc) return false;

  if (doc.ownerId !== userId) {
    throw new Error('Permission denied: Only the document owner can delete this document');
  }

  db.documents = db.documents.filter((d) => d.id !== docId);
  db.shares = db.shares.filter((s) => s.documentId !== docId);
  writeDb(db);
  return true;
}

export function shareDocument(docId, requestUserId, targetUserId, role) {
  const db = readDb();
  const doc = db.documents.find((d) => d.id === docId);
  if (!doc) throw new Error('Document not found');

  if (doc.ownerId !== requestUserId) {
    throw new Error('Permission denied: Only the owner can share documents');
  }

  const targetUser = db.users.find((u) => u.id === targetUserId);
  if (!targetUser) throw new Error('Target user not found');

  db.shares = db.shares.filter((s) => !(s.documentId === docId && s.userId === targetUserId));

  const newShare = {
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

export function revokeShare(docId, requestUserId, targetUserId) {
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

export function getComments(docId, userId) {
  const doc = getDocumentById(docId, userId);
  if (!doc) throw new Error('Permission denied');
  const db = readDb();
  return (db.comments || []).filter((comment) => comment.documentId === docId);
}

export function addComment(docId, userId, text) {
  const doc = getDocumentById(docId, userId);
  if (!doc || !['owner', 'editor', 'commenter'].includes(doc.currentUserRole)) {
    throw new Error('Permission denied: Viewer role cannot comment');
  }
  if (!text?.trim()) throw new Error('Comment text is required');
  const db = readDb();
  const user = db.users.find((item) => item.id === userId) || SEEDED_USERS[0];
  const comment = {
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

export function getVersions(docId, userId) {
  if (!getDocumentById(docId, userId)) throw new Error('Permission denied');
  const db = readDb();
  return (db.versions || []).filter((version) => version.documentId === docId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function restoreVersion(docId, userId, versionId) {
  const db = readDb();
  const docIndex = db.documents.findIndex((item) => item.id === docId);
  const version = (db.versions || []).find((item) => item.id === versionId && item.documentId === docId);
  if (docIndex === -1 || !version) throw new Error('Version not found');
  const doc = db.documents[docIndex];
  const share = db.shares.find((item) => item.documentId === docId && item.userId === userId);
  if (doc.ownerId !== userId && share?.role !== 'editor') throw new Error('Permission denied: Only owners and editors can restore versions');
  const user = db.users.find((item) => item.id === userId) || SEEDED_USERS[0];
  db.versions.push({ id: `version-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, documentId: docId, title: doc.title, contentHtml: doc.contentHtml, contentText: doc.contentText, createdAt: new Date().toISOString(), createdBy: user.id, createdByName: user.name });
  const restored = { ...doc, title: version.title, contentHtml: version.contentHtml, contentText: version.contentText, updatedAt: new Date().toISOString() };
  db.documents[docIndex] = restored;
  writeDb(db);
  return { ...restored, shares: db.shares.filter((item) => item.documentId === docId), currentUserRole: doc.ownerId === userId ? 'owner' : share?.role, isOwnedByCurrentUser: doc.ownerId === userId };
}

export function getActiveEditors(docId, userId) {
  if (!getDocumentById(docId, userId)) throw new Error('Permission denied');
  const db = readDb();
  const cutoff = Date.now() - 30000;
  db.presence = (db.presence || []).filter((editor) => new Date(editor.lastSeen).getTime() > cutoff);
  writeDb(db);
  return db.presence.filter((editor) => editor.documentId === docId);
}

export function heartbeat(docId, userId, cursorPosition) {
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
