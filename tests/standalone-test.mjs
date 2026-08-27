import test from 'node:test';
import { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  getUsers,
  getDocumentsForUser,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  revokeShare,
  addComment,
  getComments,
  getVersions,
  heartbeat,
  SEEDED_USERS,
} from '../lib/db.mjs';

const databaseFile = path.join(process.cwd(), 'data', 'database.json');
const originalDatabase = fs.readFileSync(databaseFile, 'utf8');

before(() => {
  fs.writeFileSync(databaseFile, originalDatabase, 'utf8');
});

after(() => {
  fs.writeFileSync(databaseFile, originalDatabase, 'utf8');
});

test('1. Seeded Users Initialization', () => {
  const users = getUsers();
  assert.equal(users.length, 3);
  assert.equal(users[0].name, 'Mohan Kumar');
  assert.equal(users[1].name, 'Alex Rivera');
  assert.equal(users[2].name, 'Sarah Chen');
});

test('2. Document Creation & Owner Privileges', () => {
  const doc = createDocument({
    title: 'Node Test Document',
    contentHtml: '<h1>Header</h1><p>Test</p>',
    contentText: 'Header\nTest',
    ownerId: 'user-1',
  });

  assert.ok(doc.id);
  assert.equal(doc.title, 'Node Test Document');
  assert.equal(doc.ownerId, 'user-1');
  assert.equal(doc.currentUserRole, 'owner');

  const fetched = getDocumentById(doc.id, 'user-1');
  assert.ok(fetched);
  assert.equal(fetched.title, 'Node Test Document');
});

test('3. Privacy & Non-Shared User Isolation', () => {
  const doc = createDocument({
    title: 'Confidential Strategy',
    contentHtml: '<p>Secret</p>',
    contentText: 'Secret',
    ownerId: 'user-1',
  });

  // User-3 (Sarah) has no access
  const fetched = getDocumentById(doc.id, 'user-3');
  assert.equal(fetched, null);
});

test('4. Granular Sharing & Viewer Permission Lock Enforcement', () => {
  const doc = createDocument({
    title: 'Shared Roadmap',
    contentHtml: '<p>Draft</p>',
    contentText: 'Draft',
    ownerId: 'user-1',
  });

  // Grant Sarah Viewer access
  shareDocument(doc.id, 'user-1', 'user-3', 'viewer');

  const fetchedForSarah = getDocumentById(doc.id, 'user-3');
  assert.ok(fetchedForSarah);
  assert.equal(fetchedForSarah.currentUserRole, 'viewer');
  assert.equal(fetchedForSarah.isOwnedByCurrentUser, false);

  // Attempting edit as Viewer MUST throw Permission Error
  assert.throws(
    () => {
      updateDocument(doc.id, 'user-3', { title: 'Unauthorized Edit' });
    },
    { message: /Permission denied/ }
  );

  // Upgrade Sarah to Editor
  shareDocument(doc.id, 'user-1', 'user-3', 'editor');

  const updated = updateDocument(doc.id, 'user-3', { title: 'Updated by Sarah' });
  assert.equal(updated.title, 'Updated by Sarah');
});

test('5. Owner-Only Deletion Enforcement', () => {
  const doc = createDocument({
    title: 'Doc To Delete',
    contentHtml: '<p>Temp</p>',
    contentText: 'Temp',
    ownerId: 'user-1',
  });

  shareDocument(doc.id, 'user-1', 'user-2', 'editor');

  // Editor (user-2) attempt delete MUST throw error
  assert.throws(
    () => {
      deleteDocument(doc.id, 'user-2');
    },
    { message: /Permission denied/ }
  );

  // Owner (user-1) delete succeeds
  const success = deleteDocument(doc.id, 'user-1');
  assert.equal(success, true);
  assert.equal(getDocumentById(doc.id, 'user-1'), null);
});

test('6. Access Revocation', () => {
  const doc = createDocument({
    title: 'Revoke Access Test',
    contentHtml: '<p>Content</p>',
    contentText: 'Content',
    ownerId: 'user-1',
  });

  shareDocument(doc.id, 'user-1', 'user-2', 'editor');
  assert.ok(getDocumentById(doc.id, 'user-2'));

  revokeShare(doc.id, 'user-1', 'user-2');
  assert.equal(getDocumentById(doc.id, 'user-2'), null);
});

test('7. Collaboration Features', () => {
  const doc = createDocument({
    title: 'Collaboration Features',
    contentHtml: '<p>Initial</p>',
    contentText: 'Initial',
    ownerId: 'user-1',
  });

  shareDocument(doc.id, 'user-1', 'user-3', 'commenter');
  const comment = addComment(doc.id, 'user-3', 'Please review this section');
  assert.equal(comment.userId, 'user-3');
  assert.equal(getComments(doc.id, 'user-1').length, 1);

  updateDocument(doc.id, 'user-1', {
    contentHtml: '<p>Updated</p>',
    contentText: 'Updated',
  });
  assert.equal(getVersions(doc.id, 'user-3').length, 1);

  const activeEditors = heartbeat(doc.id, 'user-1', 4);
  assert.equal(activeEditors.find((editor) => editor.userId === 'user-1').cursorPosition, 4);

  deleteDocument(doc.id, 'user-1');
});
