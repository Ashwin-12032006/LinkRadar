const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const Link = require('../models/Link');
const { getPublicStats } = require('../services/linkService');
const { baseUrl, brandName } = require('../config/env');

const router = express.Router();

router.post('/unlock/:shortCode', async (req, res) => {
  const schema = z.object({ password: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Password required' });

  const link = await Link.findOne({ shortCode: req.params.shortCode });
  if (!link || !link.linkPasswordHash) return res.status(404).json({ message: 'Protected link not found' });

  const ok = await bcrypt.compare(parsed.data.password, link.linkPasswordHash);
  if (!ok) return res.status(401).json({ message: 'Incorrect password' });

  res.cookie(`link_access_${link.shortCode}`, '1', { httpOnly: true, maxAge: 60 * 60 * 1000, sameSite: 'lax' });
  return res.json({ ok: true, redirectUrl: link.originalUrl });
});

router.get('/stats/:shortCode', async (req, res) => {
  const stats = await getPublicStats(req.params.shortCode);
  if (!stats) return res.status(404).json({ message: 'Public stats not available for this link' });
  return res.json({ ...stats, brandName, baseUrl });
});

module.exports = router;
