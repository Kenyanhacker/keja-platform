# KEJA Platform (Student Housing Kenya)

Wild, animated housing marketplace starter aligned to Kenyan student culture, with role-based backend (user/host/admin), chat, listings, reviews, and admin controls.

## Folder Structure

```text
keja-platform/
  frontend/
    index.html
    login.html
    host.html
    admin.html
    styles.css
    app.js
    auth.js
  backend/
    package.json
    src/
      server.js
      db.js
      middleware/
        auth.js
      routes/
        auth.js
        listings.js
        hosts.js
        chat.js
        reviews.js
        admin.js
  sql/
    schema.sql
    seed.sql
  .env.example
```

## Admin Credential Example

- email: `admin@keja.co.ke`
- password: `Admin@12345`
- role: `admin`

## Host Credential Example

- email: `jane.host@keja.co.ke`
- password: `Admin@12345`
- role: `host`

## Login Flow

- Single sign-in page: `frontend/login.html`
- Host login redirects to: `frontend/host.html`
- Admin login redirects to: `frontend/admin.html`
- Role checks are enforced on frontend route access and backend API access.

> For production, rotate credentials and store hashed passwords only.

## Quick Start

1. Copy `.env.example` to `backend/.env`.
2. For local preview without PostgreSQL, keep `USE_PGMEM=true` in `.env`.
3. Install and run backend:
   - `cd backend`
   - `npm install`
   - `npm run dev`
4. Start frontend static server:
   - `cd ../frontend`
   - `python -m http.server 5500`
5. Open:
   - `http://localhost:5500/login.html` (host/admin login)
   - `http://localhost:5500/host.html`
   - `http://localhost:5500/admin.html`

## Real PostgreSQL Mode

1. Install PostgreSQL and create DB `keja`.
2. Set `USE_PGMEM=false` in `backend/.env`.
3. Set `DATABASE_URL` to your real connection string.
4. Run `sql/schema.sql`, then `sql/seed.sql` in PostgreSQL.

## Deployment Guide

### Backend (Render/Railway/Fly.io)

1. Set environment variables from `.env.example`.
2. Provision managed PostgreSQL.
3. Run migrations using `schema.sql`.
4. Deploy `backend` as Node service.
5. Set CORS origin to frontend domain.

### Frontend (Netlify/Vercel/GitHub Pages)

1. Deploy `frontend` as static site.
2. Update `API_BASE_URL` in `frontend/app.js` to backend URL.
3. Configure HTTPS-only deployment.

### Production Checklist

- Use secure JWT secret (32+ chars).
- Enable rate limiting + request logging.
- Add file upload to cloud storage (S3/Cloudinary).
- Use HTTPS and secure cookies.
- Add moderation workflow for flagged listings.
