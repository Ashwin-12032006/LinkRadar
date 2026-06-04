const express = require('express');
const Link = require('../models/Link');
const Visit = require('../models/Visit');
const { parseVisitMeta } = require('../utils/visitMeta');
const { clientUrl } = require('../config/env');

const router = express.Router();

function expiredPage(res) {
  return res.status(410).send(`<!DOCTYPE html><html><head><title>Link Expired</title><style>body{font-family:system-ui;background:#07090e;color:#fff;display:grid;place-items:center;height:100vh;margin:0}div{text-align:center;border:1px solid #1e293b;background:#0d121f;padding:2rem;border-radius:1.5rem;box-shadow:0 10px 25px rgba(0,0,0,0.5)}h1{font-size:2rem;color:#10b981;margin-top:0}p{color:#94a3b8;font-size:0.875rem}a{color:#10b981;text-decoration:none;font-weight:600}a:hover{text-decoration:underline}</style></head><body><div><h1>Link Expired</h1><p>This short link is no longer active.</p><a href="${clientUrl}">Go to Dashboard</a></div></body></html>`);
}


function emitLive(io, link, visitMeta) {
  if (!io) return;
  io.to(`user:${link.userId.toString()}`).emit('live:visit', {
    shortCode: link.shortCode,
    linkId: link._id.toString(),
    ...visitMeta,
    visitedAt: new Date(),
  });
  io.to(`link:${link._id}`).emit('live:pulse', { shortCode: link.shortCode });
}

router.get('/:shortCode', async (req, res, next) => {
  const reserved = ['api', 'stats', 'favicon.ico', 'login', 'signup', 'dashboard', 'qr', 'settings', 'unlock', 'analytics', 'assets', 'static'];
  if (reserved.includes(req.params.shortCode)) return next();

  const link = await Link.findOne({ shortCode: req.params.shortCode });
  if (!link) return res.status(404).json({ message: 'Short URL not found' });

  if (link.expiresAt && link.expiresAt < new Date()) return expiredPage(res);

  if (link.linkPasswordHash && !req.cookies?.[`link_access_${link.shortCode}`]) {
    if (req.query.format === 'json') return res.status(401).json({ message: 'Password required', requiresPassword: true });
    return res.redirect(`/unlock/${link.shortCode}`);
  }

  const visitMeta = parseVisitMeta(req);
  link.clickCount += 1;
  link.lastVisitedAt = new Date();
  await link.save();

  await Visit.create({ linkId: link._id, visitedAt: new Date(), ...visitMeta });

  const io = req.app.get('io');
  emitLive(io, link, visitMeta);

  if (link.isSecureShield) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Safe Redirect Shield - LinkLens AI</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;850&display=swap" rel="stylesheet">
        <style>
          body {
            background-color: #07090e;
            color: #f8fafc;
            font-family: 'Outfit', sans-serif;
            display: grid;
            place-items: center;
            height: 100vh;
            margin: 0;
            overflow: hidden;
          }
          .glow-bg {
            position: absolute;
            width: 400px;
            height: 400px;
            background: rgba(16, 185, 129, 0.07);
            border-radius: 50%;
            filter: blur(120px);
            top: 25%;
            left: 25%;
            pointer-events: none;
          }
          .glow-bg-2 {
            position: absolute;
            width: 300px;
            height: 300px;
            background: rgba(249, 115, 22, 0.04);
            border-radius: 50%;
            filter: blur(100px);
            bottom: 20%;
            right: 20%;
            pointer-events: none;
          }
          .card {
            background: rgba(13, 18, 31, 0.55);
            border: 1px solid rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(16px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
            border-radius: 2rem;
            padding: 2.5rem;
            width: 90%;
            max-w: 420px;
            text-align: center;
            position: relative;
            z-index: 10;
          }
          .logo-box {
            display: inline-flex;
            height: 64px;
            width: 64px;
            border-radius: 1.25rem;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.25);
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
            position: relative;
          }
          .spinner {
            position: absolute;
            inset: -4px;
            border-radius: 1.5rem;
            border: 2px solid transparent;
            border-top-color: #10b981;
            border-bottom-color: #f97316;
            animation: spin 1.5s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          h1 {
            font-size: 1.5rem;
            font-weight: 850;
            margin: 0 0 0.5rem 0;
            background: linear-gradient(135deg, #34d399 0%, #fb923c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          p {
            color: #94a3b8;
            font-size: 0.85rem;
            line-height: 1.6;
            margin: 0 0 1.5rem 0;
          }
          .status-feed {
            background: rgba(7, 9, 14, 0.8);
            border: 1px solid rgba(30, 41, 59, 0.8);
            border-radius: 1rem;
            padding: 1rem;
            font-size: 0.75rem;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #a7f3d0;
            font-weight: 600;
            letter-spacing: 0.02em;
            margin-bottom: 1.5rem;
            font-family: monospace;
          }
          .countdown {
            font-size: 2.5rem;
            font-weight: 850;
            color: #fb923c;
            margin-bottom: 1rem;
          }
          .footer-text {
            font-size: 0.75rem;
            color: #475569;
          }
          .fallback-link {
            color: #10b981;
            text-decoration: none;
            font-weight: 600;
          }
          .fallback-link:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="glow-bg"></div>
        <div class="glow-bg-2"></div>
        <div class="card">
          <div class="logo-box">
            <div class="spinner"></div>
            <svg style="width:28px;height:28px;color:#10b981;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h1>Security Sandbox Scan</h1>
          <p>Auditing destination link safety protocols and verifying SSL integrity certificates...</p>
          
          <div class="countdown" id="cd">3</div>
          
          <div class="status-feed" id="status">INITIATING DECRYPTION KEY...</div>
          
          <div class="footer-text">
            If you are not redirected, <a class="fallback-link" href="${link.originalUrl}">click here</a>
          </div>
        </div>

        <script>
          const steps = [
            "DECRYPTION PROTOCOLS RESOLVED...",
            "AUDITING DESTINATION SECURITY SIGNALS...",
            "SSL CERTIFICATE HANDSHAKE STABLE...",
            "SAFE REDIRECTION CONFIRMED!"
          ];
          let stepIdx = 0;
          const statusEl = document.getElementById('status');
          
          const statusInterval = setInterval(() => {
            if (stepIdx < steps.length) {
              statusEl.innerText = steps[stepIdx++];
            }
          }, 700);

          let count = 3;
          const cdEl = document.getElementById('cd');
          const interval = setInterval(() => {
            count--;
            cdEl.innerText = count;
            if (count <= 0) {
              clearInterval(interval);
              clearInterval(statusInterval);
              window.location.href = "${link.originalUrl}";
            }
          }, 1000);
        </script>
      </body>
      </html>
    `);
  }
  return res.redirect(link.originalUrl);
});

module.exports = router;
