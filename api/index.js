const app = require('../server/src/app');
const mongoose = require('mongoose');
const { mongoUri } = require('../server/src/config/env');

let cachedDb = null;

module.exports = async (req, res) => {
  // Ensure we connect to MongoDB and cache the connection across warm serverless container invocations
  if (!cachedDb) {
    if (!mongoUri) {
      console.error('MONGO_URI env variable is missing');
      return res.status(500).json({ message: 'Database configuration missing in environment' });
    }
    try {
      cachedDb = await mongoose.connect(mongoUri);
      console.log('MongoDB connected successfully in Vercel serverless function');
    } catch (err) {
      console.error('MongoDB connection error in serverless function:', err);
      return res.status(500).json({ message: 'Database connection failed' });
    }
  }

  // Restore the original path if rewritten by Vercel
  const url = require('url');
  const parsed = url.parse(req.url, true);
  if (parsed.query && parsed.query.originalUrl) {
    req.url = parsed.query.originalUrl;
  }

  // Make sure we trust proxy headers forwarded by Vercel's load balancers
  app.set('trust proxy', 1);

  // Forward the request and response to the Express app router
  return app(req, res);
};
