import { describe, it, expect } from 'vitest';
import {
  getUsers,
  getDocumentsForUser,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  revokeShare,
  SEEDED_USERS,
} from '../lib/db';

describe('Ajaia Docs - Database & Permission Access Tests', () => {
  it('should seed default users correctly', () => {
    const users = getUsers();
    expect(users).toHaveLength(3);
    expect(users[0].name).toBe('Mohan Kumar');
    expect(users[1].name).toBe('Alex Rivera');
    expect(users[2].name).toBe('Sarah Chen');
  });

  it('should create a new document with owner privileges', () => {
    const newDoc = createDocument({
      title: 'Unit Test Document',
      contentHtml: '<h1>Unit Test</h1>',
      contentText: 'Unit Test',
      ownerId: 'user-1',
    });

    expect(newDoc.id).toBeDefined();
    expect(newDoc.title).toBe('Unit Test Document');
    expect(newDoc.ownerId).toBe('user-1');
    expect(newDoc.currentUserRole).toBe('owner');

    const fetched = getDocumentById(newDoc.id, 'user-1');
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe('Unit Test Document');
  });

  it('should prevent non-shared users from viewing a document', () => {
    const doc = createDocument({
      title: 'Private Document',
      contentHtml: '<p>Secret</p>',
      contentText: 'Secret',
      ownerId: 'user-1',
    });

    // User-3 (Sarah) has no access initially
    const fetched = getDocumentById(doc.id, 'user-3');
    expect(fetched).toBeNull();
  });

  it('should grant access via share and enforce role privileges', () => {
    const doc = createDocument({
      title: 'Collaborative Spec',
      contentHtml: '<p>Initial</p>',
      contentText: 'Initial',
      ownerId: 'user-1',
    });

    // Share with user-3 as Viewer
    shareDocument(doc.id, 'user-1', 'user-3', 'viewer');

    const fetchedForSarah = getDocumentById(doc.id, 'user-3');
    expect(fetchedForSarah).not.toBeNull();
    expect(fetchedForSarah?.currentUserRole).toBe('viewer');
    expect(fetchedForSarah?.isOwnedByCurrentUser).toBe(false);

    // Attempting to edit as Viewer should throw Permission Error
    expect(() => {
      updateDocument(doc.id, 'user-3', { title: 'Hacked Title' });
    }).toThrowError(/Permission denied/);

    // Upgrade Sarah to Editor
    shareDocument(doc.id, 'user-1', 'user-3', 'editor');

    // Editing should now succeed
    const updated = updateDocument(doc.id, 'user-3', { title: 'Updated by Sarah' });
    expect(updated?.title).toBe('Updated by Sarah');
  });

  it('should allow document deletion only by owner', () => {
    const doc = createDocument({
      title: 'To Be Deleted',
      contentHtml: '<p>Temp</p>',
      contentText: 'Temp',
      ownerId: 'user-1',
    });

    shareDocument(doc.id, 'user-1', 'user-2', 'editor');

    // Non-owner (user-2) attempt delete
    expect(() => {
      deleteDocument(doc.id, 'user-2');
    }).toThrowError(/Permission denied/);

    // Owner (user-1) delete
    const success = deleteDocument(doc.id, 'user-1');
    expect(success).toBe(true);

    const checkDeleted = getDocumentById(doc.id, 'user-1');
    expect(checkDeleted).toBeNull();
  });

  it('should revoke access correctly', () => {
    const doc = createDocument({
      title: 'Revocation Test',
      contentHtml: '<p>Content</p>',
      contentText: 'Content',
      ownerId: 'user-1',
    });

    shareDocument(doc.id, 'user-1', 'user-2', 'editor');
    expect(getDocumentById(doc.id, 'user-2')).not.toBeNull();

    revokeShare(doc.id, 'user-1', 'user-2');
    expect(getDocumentById(doc.id, 'user-2')).toBeNull();
  });
});
