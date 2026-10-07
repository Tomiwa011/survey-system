# Survey System

A secure online survey platform. Users create surveys, share a public link, collect anonymous responses and view the results. Admins manage users and moderate surveys.

**Live demo:** https://survey-system-jcou.onrender.com

> The demo runs on free hosting, so after a quiet spell the first load can take about a minute while the server wakes up.

## Features

- Registration, login and logout with role-based access (user and admin)
- Survey builder with short text, single choice, multiple choice and rating questions
- Public survey page with a shareable link, no login needed to respond
- Results page with counts, bars, average ratings and text answers
- Search and filter on the dashboard
- Admin tools: user list, deactivate accounts, survey moderation
- Profile page: edit details and change password
- Responsive layout for phone and desktop

## Security

- bcrypt password hashing
- Signed session token in an httpOnly, SameSite cookie (Secure in production)
- Server-side role checks and per-owner access checks on every survey, question and result
- Input validation in the browser, on the server and in the database
- Parameterised SQL queries (SQL injection protection)
- React output escaping and Helmet security headers (XSS protection)
- Rate limiting on login, registration, password changes and public submissions
- Secrets kept in environment variables

## Tech stack

React, Vite, Tailwind CSS, Node.js, Express, PostgreSQL. Deployed on Render (app) and Neon (database).

## Run it locally

1. Create a PostgreSQL database and run `database/schema.sql` in it.
2. Create `server/.env` with these variables (use your own values):
   `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET` (at least 32 random characters)
3. Create `client/.env` containing `VITE_API_URL=http://localhost:4000`
4. In one terminal: `cd server`, `npm install`, `node --watch index.js`
5. In another: `cd client`, `npm install`, `npm run dev`
6. Open http://localhost:5173

New accounts are normal users. To make an admin, set `role = 'admin'` for a user directly in the database.

