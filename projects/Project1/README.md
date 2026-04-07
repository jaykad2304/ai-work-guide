# Local Blog

A full-stack blog platform with user authentication, post management, and a rich text editor — deployed on Railway with PostgreSQL.

## Features

- **Auth system** — register, login, session management (PostgreSQL-backed sessions)
- **Rich text editor** — write and publish posts with formatting
- **PWA support** — installable as a progressive web app (`manifest.json` + service worker)
- **Admin + ownership** — post ownership controls, admin roles
- **Production-ready** — Railway deployment config, secure cookies, proxy trust, env-driven secrets

## Stack

- **Backend** — Node.js, Express
- **Database** — PostgreSQL (`pg`, `connect-pg-simple`)
- **Auth** — `bcrypt` + session-based authentication
- **Frontend** — Vanilla JS, HTML/CSS
- **Deployment** — Railway

## Setup

```bash
npm install
```

Create a `.env` file:

```env
SESSION_SECRET=your-secret-here
DATABASE_URL=your-postgres-url
NODE_ENV=development
```

Run locally:

```bash
npm start
```

## Deployment

Configured for Railway — set `SESSION_SECRET` and `DATABASE_URL` as environment variables. The app trusts Railway's proxy for secure HTTPS cookies automatically.
