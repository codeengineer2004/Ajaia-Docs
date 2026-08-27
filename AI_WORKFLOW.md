# 🤖 AI-Native Workflow Note

Candidate: **Mohan Kumar Sampatirao** ([mohankumarsampatirao@gmail.com](mailto:mohankumarsampatirao@gmail.com))

---

## 1. AI Tools Utilized
During this assignment, I leveraged **Antigravity AI (Gemini 3.6 Flash)** as an intelligent pair-programming co-pilot and automated code assistant.

---

## 2. Where AI Materially Accelerated Work

1. **Rapid Architecture & Scaffold Generation**:
   - AI generated the complete Next.js 14 App Router file structure, TypeScript interface declarations (`lib/types.ts`), and seeded persona data within minutes.
2. **TipTap Editor Integration**:
   - Fast setup of TipTap extensions (`StarterKit`, `Underline`, `Placeholder`) and bidirectional HTML sync logic.
3. **Automated Test Matrix**:
   - AI helped write comprehensive unit and permission tests (`tests/db.test.ts`), covering positive and negative authorization test cases (e.g., verifying that a Viewer role attempt to edit triggers a permission rejection error).
4. **CSS Glassmorphism Design System**:
   - AI accelerated the creation of custom CSS variables, glassmorphism modal panels, custom scrollbars, and dark-mode styling tokens.

---

## 3. What AI-Generated Output Was Changed or Rejected

1. **Rejected Raw `document.execCommand`**:
   - Initial naive boilerplate suggested browser `execCommand` for text formatting. I rejected this approach because `execCommand` is deprecated and produces inconsistent HTML across browsers. Replaced it with **TipTap** for AST document structure.
2. **Refined Data Store Concurrency**:
   - Standard AI output used basic `fs.writeFileSync()` on the primary database file. I modified this to implement atomic write swaps via temporary `.tmp` files and `fs.renameSync()` to guarantee zero file corruption under concurrent auto-save requests.
3. **Strict Authorization Error Handling**:
   - Refactored AI-generated API endpoints to ensure unauthorized actions explicitly return `403 Forbidden` status codes with structured JSON error responses rather than generic 500 server errors.

---

## 4. Verification of Correctness, UX Quality, and Reliability

- **Automated Verification**: Vitest unit test suite executed against `lib/db.ts` to validate document creation, owner updates, editor updates, viewer rejection, and share revocation.
- **Cross-Persona Interactive Testing**: Switched between all 3 seeded accounts (`Mohan`, `Alex`, `Sarah`) in real-time to verify document visibility filters (`Mine` vs `Shared`), toolbar state locking for read-only viewers, and owner-only share button visibility.
- **File Upload Format Edge Cases**: Tested file upload parsing with `.txt`, `.md`, `.docx`, and `.json` files, verifying clean conversion to HTML and text appending.
