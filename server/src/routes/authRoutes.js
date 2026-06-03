const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const { jwtSecret } = require('../config/env');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign({ email: user.email }, jwtSecret, { subject: user._id.toString(), expiresIn: '7d' });
}

router.post('/signup', async (req, res) => {
  const schema = z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(6).max(128),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.issues });

  const { name, email, password } = parsed.data;
  if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already exists' });

  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
  return res.status(201).json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, theme: user.theme } });
});

router.post('/login', async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(6).max(128) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.issues });

  const user = await User.findOne({ email: parsed.data.email });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  return res.json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, theme: user.theme } });
});

router.patch('/profile', requireAuth, async (req, res) => {
  const schema = z.object({ name: z.string().min(2).max(80).optional(), theme: z.enum(['light', 'dark']).optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });

  const user = await User.findByIdAndUpdate(req.user.id, parsed.data, { new: true });
  return res.json({ user: { id: user._id, name: user.name, email: user.email, theme: user.theme } });
});

module.exports = router;
