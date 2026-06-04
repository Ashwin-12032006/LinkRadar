const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const QRCode = require('qrcode');
const { z } = require('zod');
const Link = require('../models/Link');
const Visit = require('../models/Visit');
const { requireAuth } = require('../middleware/auth');
const { analyzeUrl, createLink, getAnalytics, serializeLink } = require('../services/linkService');
const { aggregateCategories } = require('../utils/analytics');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 } });

router.use(requireAuth);

router.post('/analyze', async (req, res) => {
  const schema = z.object({ originalUrl: z.string().min(5).max(2048) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid URL input' });
  const result = await analyzeUrl(parsed.data.originalUrl);
  if (result.error) return res.status(400).json({ message: result.error });
  return res.json(result);
});

router.post('/', async (req, res) => {
  const schema = z.object({
    originalUrl: z.string().min(5).max(2048),
    customAlias: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
    expiresInDays: z.number().int().min(1).max(365).optional(),
    password: z.string().min(4).max(64).optional(),
    isPublicStats: z.boolean().optional(),
    ignoreThreatWarning: z.boolean().optional(),
    isSecureShield: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.issues });

  try {
    const link = await createLink(req.user.id, parsed.data);
    return res.status(201).json(link);
  } catch (err) {
    if (err.code === 'THREAT_WARNING') {
      return res.status(409).json({ message: err.message, threat: err.threat, requiresConfirmation: true });
    }
    return res.status(400).json({ message: err.message });
  }
});

router.post('/bulk', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'CSV file is required' });
  const text = req.file.buffer.toString('utf8');
  let rows = [];
  try {
    rows = parse(text, { columns: false, skip_empty_lines: true });
  } catch {
    return res.status(400).json({ message: 'Invalid CSV format' });
  }

  const urls = rows.map((r) => (Array.isArray(r) ? r[0] : r)).filter(Boolean).slice(0, 50);
  const created = [];
  const failed = [];

  for (const originalUrl of urls) {
    try {
      const link = await createLink(req.user.id, { originalUrl, ignoreThreatWarning: true });
      created.push({ originalUrl, shortUrl: link.shortUrl, shortCode: link.shortCode });
    } catch (err) {
      failed.push({ originalUrl, reason: err.message });
    }
  }

  return res.json({ created, failed });
});

router.get('/dashboard/summary', async (req, res) => {
  const links = await Link.find({ userId: req.user.id }).lean();
  const totalClicks = links.reduce((sum, l) => sum + (l.clickCount || 0), 0);
  const categories = aggregateCategories(links);
  const topLink = [...links].sort((a, b) => b.clickCount - a.clickCount)[0] || null;
  return res.json({
    totalLinks: links.length,
    totalClicks,
    categories,
    topLink: topLink ? serializeLink(topLink) : null,
  });
});

router.get('/', async (req, res) => {
  const links = await Link.find({ userId: req.user.id }).sort({ createdAt: -1 });
  return res.json({ links: links.map(serializeLink) });
});

router.delete('/:id', async (req, res) => {
  const link = await Link.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!link) return res.status(404).json({ message: 'Link not found' });
  await Visit.deleteMany({ linkId: link._id });
  return res.json({ message: 'Link deleted' });
});

router.get('/:id/analytics', async (req, res) => {
  const data = await getAnalytics(req.params.id, req.user.id);
  if (!data) return res.status(404).json({ message: 'Link not found' });
  return res.json(data);
});

router.get('/:id/qr', async (req, res) => {
  const link = await Link.findOne({ _id: req.params.id, userId: req.user.id });
  if (!link) return res.status(404).json({ message: 'Link not found' });

  const color = (req.query.color || '#111827').replace('#', '');
  const format = req.query.format === 'svg' ? 'svg' : 'png';
  const shortUrl = `${require('../config/env').baseUrl}/${link.shortCode}`;

  const options = { color: { dark: `#${color}`, light: '#FFFFFFFF' }, width: 320 };
  if (format === 'svg') {
    let svg = await QRCode.toString(shortUrl, { ...options, type: 'svg' });
    if (req.query.logo === 'true' || req.query.logo === true) {
      const match = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
      if (match) {
        const M = parseInt(match[1], 10);
        const logoSize = Math.floor(M * 0.22);
        const x = (M - logoSize) / 2;
        const y = (M - logoSize) / 2;
        const scale = logoSize / 24;
        const logoSvg = `
          <rect x="${x}" y="${y}" width="${logoSize}" height="${logoSize}" fill="#FFFFFFFF" rx="${logoSize * 0.15}" />
          <g transform="translate(${x}, ${y}) scale(${scale})">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#${color}"/>
          </g>
        `;
        svg = svg.replace('</svg>', `${logoSvg}</svg>`);
      }
    }
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(svg);
  }
  const png = await QRCode.toBuffer(shortUrl, options);
  res.setHeader('Content-Type', 'image/png');
  return res.send(png);
});

module.exports = router;
