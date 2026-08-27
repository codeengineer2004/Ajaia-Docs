export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

export type AccessRole = 'owner' | 'editor' | 'commenter' | 'viewer';

export interface DocumentShare {
  id: string;
  documentId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userAvatar: string;
  role: 'editor' | 'commenter' | 'viewer';
  sharedAt: string;
}

export interface DocumentComment {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  title: string;
  contentHtml: string;
  contentText: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

export interface ActiveEditor {
  documentId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lastSeen: string;
  cursorPosition?: number;
}

export interface DocumentItem {
  id: string;
  title: string;
  contentHtml: string;
  contentText: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerAvatar: string;
  createdAt: string;
  updatedAt: string;
  shares?: DocumentShare[];
  // Calculated properties for current user:
  currentUserRole?: AccessRole;
  isOwnedByCurrentUser?: boolean;
}

export interface FileImportResponse {
  title: string;
  contentHtml: string;
  contentText: string;
  fileType: string;
}
