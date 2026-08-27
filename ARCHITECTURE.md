# 🏗️ Architecture Note: Ajaia Docs

## Overview & Product Scope

**Ajaia Docs** was designed as a lightweight, full-stack collaborative document workspace. The architecture balances rapid delivery within a 4-6 hour timebox with engineering rigor, modular component isolation, and zero-setup evaluation UX.

---

## Key Architecture Decisions & Trade-Offs

### 1. Full-Stack Framework: Next.js 14 App Router
- **Decision**: Built using Next.js 14 with React 18 and TypeScript.
- **Rationale**: Next.js App Router provides unified client-side rendering for rich-text state and server-side API routes for document CRUD, authorization middleware, and file parsing.
- **Trade-Off**: Server components vs Client components. The workspace UI requires active rich-text state and live user persona switching, so stateful interaction occurs in client components while API routes enforce server-side business rules.

### 2. Persistence Strategy: File-Backed Atomic JSON Engine
- **Decision**: Developed a custom atomic persistent store (`lib/db.ts`) operating on `data/database.json`.
- **Rationale**:
  1. **Zero Setup Overhead**: Reviewers do not need SQLite compilation toolchains, PostgreSQL servers, Docker containers, or cloud database credentials.
  2. **Persistence Guarantee**: State persists seamlessly across browser reloads, server restarts, and multi-session persona switching.
  3. **Atomic Safety**: Data mutation writes to a `.tmp` buffer before executing `fs.renameSync()`, preventing partial file writes or corruption during rapid auto-save requests.
- **Trade-Off**: Scale limitations for production multi-tenant workloads. For production at scale, this interface maps 1:1 to PostgreSQL or Supabase with Row Level Security (RLS).

### 3. Editor Engine: TipTap Headless Rich-Text Framework
- **Decision**: Used `@tiptap/react` built on ProseMirror.
- **Rationale**:
  - Raw `contentEditable` or `document.execCommand` is notoriously buggy across browsers and lacks structured document model enforcement.
  - TipTap provides an extensible Abstract Syntax Tree (AST) for HTML content, seamless formatting hooks (Bold, Italic, Underline, Headings, Bullet Lists, Numbered Lists, Code Blocks), and clean export capabilities.
- **Trade-Off**: Slightly larger client bundle size in exchange for rock-solid document editing UX and cross-browser consistency.

### 4. Access Control & Authorization Model
- **Roles**: `Owner`, `Editor`, and `Viewer`.
- **Enforcement**:
  - **Server-Side**: All document API routes require an httpOnly HMAC-signed `ajaia-session` cookie and validate authorization against document ownership and share permissions before performing mutations.
  - **Client-Side**: Viewers receive read-only editor states (`editable: false`), hidden sharing/delete controls, and an explicit amber warning banner.

---

## System Component Diagram

```

## Stretch Features

- Presence uses short-lived heartbeat records in the same file-backed store. WebSockets would be the production upgrade.
- Comments are persisted per document and restricted to Owners, Editors, and Commenters.
- Updates snapshot the prior document state into version history before writing the new state.
- Version restoration creates a snapshot of the current state before replacing it with the selected version.
+-----------------------------------------------------------------------+
|                             Browser UI                                |
|  +-------------------+  +--------------------+  +------------------+  |
|  | Header & Persona  |  | Sidebar Doc List   |  | TipTap Editor &  |  |
|  | Switcher          |  | Filter & Search    |  | Toolbar          |  |
|  +---------+---------+  +---------+----------+  +--------+---------+  |
+------------|----------------------|----------------------|------------+
             |                      |                      |
             +----------------------+----------------------+
                                    | HTTP API (x-user-id)
                                    v
+-----------------------------------------------------------------------+
|                         Next.js App Router                            |
|  /api/documents       /api/documents/[id]    /api/documents/[id]/share|
|  /api/upload          /api/users                                      |
+-----------------------------------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                    Atomic Storage Engine (lib/db.ts)                  |
|                   Atomically persists data/database.json               |
+-----------------------------------------------------------------------+
```
