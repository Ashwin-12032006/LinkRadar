const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const { clientUrl } = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const linkRoutes = require('./routes/linkRoutes');
const publicRoutes = require('./routes/publicRoutes');
const redirectRoutes = require('./routes/redirectRoutes');

const app = express();
app.set('trust proxy', 1);

app.use(helmet({ 
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));

app.get('/api/health', (req, res) => res.json({ ok: true, product: 'LinkLens AI' }));

app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/public', publicRoutes);
app.use('/', redirectRoutes);

// Static hosting of compiled React files in production
app.use(express.static(path.join(__dirname, '../../client/dist')));

// SPA Wildcard Route Fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;

