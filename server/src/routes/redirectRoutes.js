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

  return res.redirect(link.originalUrl);
});

module.exports = router;
