# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install   # Install dependencies
npm start     # Start server at http://localhost:3000
```

No build step, linter, or test framework is configured.

## Architecture

This is a full-stack Node.js blog app with a JSON file as the data store.

**Backend** ([server.js](server.js)): Express.js server that serves static files from `public/` and exposes a REST API at `/api/posts`. Posts are persisted to `data/posts.json` (auto-created on first run). Post IDs are timestamps.

**Frontend** ([public/app.js](public/app.js)): Vanilla JS, multi-page. Page behavior is determined by the `id` attribute on `<body>` (`home`, `single-post`, `editor`). Each page initializes independently in a single `DOMContentLoaded` handler. Post navigation uses `?id=` query params.

**Data model:**
```json
{ "id": "timestamp", "title": "", "body": "", "createdAt": "", "updatedAt": "" }
```

**API endpoints:**
- `GET /api/posts` — all posts, newest first
- `GET /api/posts/:id` — single post
- `POST /api/posts` — create (requires `title`, `body`)
- `PUT /api/posts/:id` — update
- `DELETE /api/posts/:id` — delete
