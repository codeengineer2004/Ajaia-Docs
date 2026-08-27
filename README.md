# 🚀 Ajaia Docs - AI-Native Collaborative Document Editor

A lightweight, high-performance, full-stack collaborative document editor inspired by Google Docs and Notion, built for the **Ajaia LLC AI-Native Full Stack Developer Assignment**.

Candidate: **Mohan Kumar Sampatirao** ([mohankumarsampatirao@gmail.com](mailto:mohankumarsampatirao@gmail.com))

---

## ✨ Features Overview

### 1. Document Creation & Editing
- **Instant Creation**: Create blank documents or generate drafts from uploaded files.
- **Rich-Text Formatting**: Powered by a headless TipTap engine supporting:
  - **Text Styling**: Bold (`Ctrl+B`), Italic (`Ctrl+I`), Underline (`Ctrl+U`)
  - **Font Families**: Inter, Arial, Georgia, Verdana, and JetBrains Mono
  - **Font Sizes**: 10px, 12px, 14px, 16px, 18px, 24px, and 32px
  - **Headings**: H1, H2, H3 hierarchy
  - **Lists**: Bulleted lists and numbered lists
  - **Code Blocks & Quotes**: Syntax-styled code blocks and formatted blockquotes
  - **Undo / Redo**: Built-in history state management
- **Inline Title Renaming**: Quick document title updating with real-time auto-sync.
- **Auto-Save & Status Indicator**: Visual feedback badges (`Saved to cloud`, `Saving...`, `Unsaved changes`).

### 2. Multi-Format File Import
- **Drag-and-Drop Dropzone**: Upload external files directly into the workflow.
- **Supported Formats**: `.txt`, `.md`, `.docx` (Microsoft Word), and `.json`.
- **Import Modes**:
  - **New Document**: Turns file contents into a newly formatted editable document.
  - **Append Content**: Injects imported content directly into the currently open document.

### 3. Granular Access Control & Sharing Model
- **Role Hierarchy**:
  - 👑 **Owner**: Full control (edit, rename, share, grant/revoke permissions, delete).
  - ✏️ **Editor**: Edit title and content; cannot manage shares or delete document.
  - 👁️ **Viewer**: Read-only access; editing controls locked with clear banner notification.
  - 💬 **Commenter**: Add comments without changing document content.
- **Seeded Multi-User Persona Switcher**: Top navigation header bar allows instant switching between demo accounts:
  1. `Mohan Kumar` (Staff Product Engineer - Default Owner)
  2. `Alex Rivera` (Lead AI Engineer)
  3. `Sarah Chen` (Product Designer)
- **Visual Ownership Badges**: Distinct `Owned`, `Can Edit`, and `View Only` tags on sidebar document cards.
- **Sidebar Categorization**: Filter by **All**, **Mine**, and **Shared**.
- **Commenter Access**: Grant a collaborator permission to add comments without editing document content.
- **Signed Demo Sessions**: Persona selection creates an httpOnly signed session cookie used by protected APIs.

### 4. Zero-Setup Persistence Engine
- **File-Backed Atomic Store**: Database state persists across server restarts and browser refreshes in `data/database.json`.
- **Atomic Writes**: Writes utilize temporary file renaming (`.tmp` -> `.json`) to prevent data corruption during concurrent operations.

### 5. Export Capabilities
- Export documents to **Markdown (.md)**, **Plain Text (.txt)**, or **HTML (.html)**.
- Export a print-ready **PDF** using the browser's Save as PDF option.

### 6. Collaboration Enhancements
- **Active Editor Presence**: User avatars refresh through a lightweight 10-second heartbeat and expire after 30 seconds.
- **Comments**: Authorized collaborators can post persistent comments from the editor.
- **Version History**: Every saved update records the previous document state for review.
- **Version Restore**: Owners and Editors can restore a saved version from the history panel.

### 7. Security and Upload Limits
- API routes require the signed `ajaia-session` cookie; the client user ID header is not trusted for authorization.
- Uploads are limited to `.txt`, `.md`, `.docx`, and `.json` files up to 5 MB.

---

## 🛠️ Quick Start & Local Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation & Running Locally

1. **Clone / Navigate to Project Directory**:
   ```bash
   cd C:\Users\mohan\.gemini\antigravity\scratch\ajaia-docs
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure the session secret (recommended)**:
  Copy `.env.example` to `.env.local` and set a long random `AJAIA_AUTH_SECRET` value.

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Open in Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

---

## 🧪 Running Automated Tests

The repository includes a Node.js test suite covering document CRUD, permission rules, sharing, comments, version history, and presence.

Run the test suite:
```bash
npm run test
```

---

## 📁 Repository Structure

```
scratch/ajaia-docs/
├── app/
│   ├── api/
│   │   ├── documents/
│   │   │   ├── route.ts              # Document list & creation API
│   │   │   └── [id]/
│   │   │       ├── route.ts          # Single doc GET, PUT, DELETE
│   │   │       └── share/
│   │   │           └── route.ts      # Grant & revoke access API
│   │   ├── upload/route.ts           # File upload parser (.txt, .md, .docx, .json)
│   │   └── users/route.ts            # Seeded demo users API
│   ├── globals.css                   # Global styling system & glassmorphism theme
│   ├── layout.tsx                    # Root HTML layout with SEO metadata
│   └── page.tsx                      # Main workspace client component
├── components/
│   ├── Header.tsx                    # Header with persona switcher & actions
│   ├── Sidebar.tsx                   # Document list, filters, search & delete
│   ├── Editor.tsx                    # TipTap rich-text editor & toolbar
│   ├── ShareModal.tsx                # Sharing management drawer/modal
│   ├── UploadModal.tsx               # Drag-and-drop file import modal
│   └── Toast.tsx                     # Toast notification feedback
├── lib/
│   ├── db.ts                         # Atomic persistent storage engine & seeding
│   └── types.ts                      # TypeScript type definitions
├── tests/
│   └── db.test.ts                    # Vitest unit & integration test matrix
├── ARCHITECTURE.md                   # Architecture & design trade-off notes
├── AI_WORKFLOW.md                    # AI usage & engineering evaluation note
├── SUBMISSION.md                     # Deliverables checklist & roadmap
├── VIDEO_LINK.txt                    # Walkthrough video link
└── package.json
```
