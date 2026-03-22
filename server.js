'use strict';

const express    = require('express');
const path       = require('path');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const nodemailer = require('nodemailer');
require('dotenv').config();

/* app */
const app  = express();
const PORT = process.env.PORT || 3000;

/* security*/
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc : ["'self'"],
      scriptSrc     : ["'self'", "'unsafe-inline'"],
      scriptSrcAttr : ["'unsafe-inline'"],
      styleSrc   : ["'self'", "'unsafe-inline'"],
      fontSrc    : ["'self'", "data:"],
      imgSrc     : ["'self'", "data:", "https:"],
      connectSrc : ["'self'"],
      frameSrc   : ["https://www.linkedin.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

/* cors  */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
}));

/* body parsing */
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

/* static files */
// Serve from /public if index.html exists there, otherwise fall back to project root.
// This means index.html can live in either location — no manual moving required.
const fs         = require('fs');
const publicDir  = path.join(__dirname, 'public');
const staticRoot = (fs.existsSync(publicDir) && fs.existsSync(path.join(publicDir, 'index.html')))
  ? publicDir
  : __dirname;
app.use(express.static(staticRoot));

/* rate limiter */
const contactLimiter = rateLimit({
  windowMs : 15 * 60 * 1000,   // 15 minutes
  max      : 5,
  message  : { ok: false, error: 'Too many messages. Please try again later.' },
  standardHeaders: true,
  legacyHeaders  : false,
});

/* nodemailer transporter  */
function createTransporter() {
  return nodemailer.createTransport({
    host   : process.env.SMTP_HOST   || 'smtp.gmail.com',
    port   : parseInt(process.env.SMTP_PORT || '587', 10),
    secure : process.env.SMTP_SECURE === 'true',
    auth   : {
      user : process.env.SMTP_USER,
      pass : process.env.SMTP_PASS,
    },
  });
}

/* helpers */
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>&"']/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
  }[c])).trim().slice(0, 2000);
}

/* POST /api/contact */
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const firstName = sanitize(req.body.firstName);
    const lastName  = sanitize(req.body.lastName  || '');
    const email     = sanitize(req.body.email);
    const topic     = sanitize(req.body.topic     || 'General');
    const message   = sanitize(req.body.message);

    /*  validation  */
    const errors = {};
    if (!firstName)             errors.firstName = 'First name is required.';
    if (!emailRe.test(email))   errors.email     = 'Valid email is required.';
    if (message.length < 5)     errors.message   = 'Message must be at least 5 characters.';

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ ok: false, errors });
    }

    /*  skip email send if SMTP not configured  */
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('[contact] SMTP not configured — logging message to console');
      console.log({ firstName, lastName, email, topic, message });
      return res.json({ ok: true, message: 'Message received (dev mode — no SMTP).' });
    }

    /*  compose & send  */
    const transporter = createTransporter();

    const fullName   = lastName ? `${firstName} ${lastName}` : firstName;
    const toAddress  = process.env.CONTACT_TO || process.env.SMTP_USER;
    const subject    = `Portfolio Contact [${topic}] from ${fullName}`;

    const htmlBody = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h2 style="font-size:20px;color:#1d1d1f;margin-bottom:8px">New Portfolio Message</h2>
        <p style="color:#86868b;font-size:14px;margin-bottom:28px">Received via saichakrri.com contact form</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:10px 0;color:#86868b;width:110px">From</td><td style="padding:10px 0;color:#1d1d1f;font-weight:600">${fullName}</td></tr>
          <tr><td style="padding:10px 0;color:#86868b">Email</td><td style="padding:10px 0"><a href="mailto:${email}" style="color:#0071e3">${email}</a></td></tr>
          <tr><td style="padding:10px 0;color:#86868b">Topic</td><td style="padding:10px 0;color:#1d1d1f">${topic}</td></tr>
        </table>

        <hr style="border:none;border-top:1px solid #e8e8ed;margin:20px 0">

        <p style="font-size:13px;color:#86868b;margin-bottom:8px">MESSAGE</p>
        <div style="background:#f5f5f7;border-radius:12px;padding:20px;font-size:15px;color:#1d1d1f;line-height:1.6;white-space:pre-wrap">${message}</div>

        <p style="margin-top:28px;font-size:13px;color:#86868b">Reply directly to this email to respond to ${fullName}.</p>
      </div>
    `;

    await transporter.sendMail({
      from    : `"Portfolio Contact" <${process.env.SMTP_USER}>`,
      to      : toAddress,
      replyTo : email,
      subject,
      html    : htmlBody,
    });

    /*  auto-reply to sender  */
    if (process.env.SEND_AUTOREPLY !== 'false') {
      await transporter.sendMail({
        from    : `"Sai Chakrri" <${process.env.SMTP_USER}>`,
        to      : email,
        subject : `Got your message, ${firstName}!`,
        html    : `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px">
            <h2 style="font-size:20px;color:#1d1d1f">Thanks for reaching out, ${firstName}!</h2>
            <p style="font-size:15px;color:#424245;line-height:1.7">
              I received your message about <strong>${topic}</strong> and will get back to you within 24 hours.
            </p>
            <p style="font-size:14px;color:#86868b;margin-top:32px">— Sai Chakrri</p>
          </div>
        `,
      });
    }

    return res.json({ ok: true, message: 'Message sent successfully.' });

  } catch (err) {
    console.error('[contact] Error:', err.message);
    return res.status(500).json({ ok: false, error: 'Server error. Please try emailing directly.' });
  }
});

app.get('/resume', (_req, res) => {
  const resumePath = path.join(__dirname, 'resume', 'Sai_Chakrri_Resume.pdf');

  if (!fs.existsSync(resumePath)) {
    console.error('[resume] PDF not found at:', resumePath);
    return res.status(404).send(
      '<h2 style="font-family:sans-serif;padding:40px">Resume PDF not found.<br>' +
      '<small style="color:#888">Unknown Error Occurred</small></h2>'
    );
  }

  res.setHeader('Content-Disposition', 'attachment; filename="Sai_Chakrri_Resume.pdf"');
  res.setHeader('Content-Type', 'application/pdf');
  res.sendFile(resumePath, (err) => {
    if (err) {
      console.error('[resume] Send error:', err.message);
      if (!res.headersSent) res.status(500).send('Error sending file.');
    } else {
      console.log('[resume] Downloaded by', _req.ip);
    }
  });
});

/*  404 → index.html (SPA fallback) ─ */
app.get('*', (_req, res) => {
  res.sendFile(path.join(staticRoot, 'index.html'));
});

/*  start  */
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`\n Portfolio server running → http://localhost:${port}`);
    console.log(`   Serving files from   → ${staticRoot}\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`  Port ${port} is in use — trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  return server;
}

const server = startServer(Number(PORT));
module.exports = { app, server };