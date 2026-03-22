# Sai Chakrri — Portfolio Web App

A production-ready personal portfolio with a Node.js/Express backend that handles contact form submissions via email.

---

## Project Structure

```
portfolio/
├── public/
│   └── index.html        ← The complete frontend (all HTML/CSS/JS in one file)
├── server.js             ← Express backend
├── package.json          ← Dependencies & scripts
├── .env.example          ← Environment variable template
├── .env                  ← Your secrets (DO NOT commit)
└── README.md
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in your SMTP credentials:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password        # Gmail App Password (not account password)
CONTACT_TO=stchakrri@gmail.com     # Where contact emails are delivered
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords → generate one for "Mail".

### 3. Run the server

```bash
# Production
npm start

# Development (auto-restart on file changes)
npm run dev
```

Visit → **http://localhost:3000**

---

## API Endpoints

### `POST /api/contact`

Accepts a JSON body and sends an email via the configured SMTP server.

**Request body:**
```json
{
  "firstName": "Jane",
  "lastName":  "Doe",
  "email":     "jane@example.com",
  "topic":     "Project Collaboration",
  "message":   "Hi Sai, I'd love to work together…"
}
```

**Success response:**
```json
{ "ok": true, "message": "Message sent successfully." }
```

**Validation error response:**
```json
{
  "ok": false,
  "errors": {
    "firstName": "First name is required.",
    "email": "Valid email is required."
  }
}
```

**Rate limiting:** 5 requests per 15 minutes per IP.

---

## Deployment

### Render / Railway / Fly.io

1. Push the repo to GitHub.
2. Connect on the hosting platform.
3. Set environment variables in the dashboard (same as `.env`).
4. Deploy — the platform runs `npm start` automatically.

### VPS / DigitalOcean

```bash
# Install PM2 for process management
npm install -g pm2
pm2 start server.js --name portfolio
pm2 save
pm2 startup
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | HTTP port |
| `SMTP_HOST` | Yes | `smtp.gmail.com` | SMTP server hostname |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_SECURE` | No | `false` | Use TLS (true for port 465) |
| `SMTP_USER` | Yes | — | SMTP username / email |
| `SMTP_PASS` | Yes | — | SMTP password / app password |
| `CONTACT_TO` | No | SMTP_USER | Recipient of contact form emails |
| `ALLOWED_ORIGINS` | No | (all) | Comma-separated CORS origins |
| `SEND_AUTOREPLY` | No | `true` | Auto-reply to the sender |

---

## Features

- ✅ Custom animated cursor
- ✅ Sticky nav with active-section highlighting
- ✅ Hero section with smooth scroll CTAs
- ✅ Skills ticker animation
- ✅ About section with stats
- ✅ Projects grid with featured card
- ✅ Resume timeline with sidebar
- ✅ Achievements cards
- ✅ Blog posts carousel (touch/swipe + dots + arrow nav)
- ✅ Contact form → real email delivery via SMTP
- ✅ Form validation (client + server side)
- ✅ Rate limiting (5 req / 15 min)
- ✅ Helmet security headers
- ✅ Auto-reply email to sender
- ✅ Fully responsive (mobile, tablet, desktop)
