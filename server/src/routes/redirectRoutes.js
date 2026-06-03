const express = require('express');
const Link = require('../models/Link');
const Visit = require('../models/Visit');
const { parseVisitMeta } = require('../utils/visitMeta');
const { clientUrl } = require('../config/env');

const router = express.Router();

function expiredPage(res) {
  return res.status(410).send(`<!DOCTYPE html><html><head><title>Link Expired</title><style>body{font-family:system-ui;background:#0f172a;color:#fff;display:grid;place-items:center;height:100vh;margin:0}div{text-align:center}h1{font-size:2rem}</style></head><body><div><h1>Link Expired</h1><p>This short link is no longer active.</p><a style="color:#38bdf8" href="${clientUrl}">Go to ${clientUrl}</a></div></body></html>`);
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

router.get('/:shortCode', async (req, res) => {
  const reserved = ['api', 'stats', 'favicon.ico'];
  if (reserved.includes(req.params.shortCode)) return res.status(404).json({ message: 'Not found' });

  const link = await Link.findOne({ shortCode: req.params.shortCode });
  if (!link) return res.status(404).json({ message: 'Short URL not found' });

  if (link.expiresAt && link.expiresAt < new Date()) return expiredPage(res);

  if (link.linkPasswordHash && !req.cookies?.[`link_access_${link.shortCode}`]) {
    if (req.query.format === 'json') return res.status(401).json({ message: 'Password required', requiresPassword: true });
    return res.redirect(`${clientUrl}/unlock/${link.shortCode}`);
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
