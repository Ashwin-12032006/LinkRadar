const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const app = require('./app');
const { port, mongoUri, clientUrl } = require('./config/env');
const Visit = require('./models/Visit');
const Link = require('./models/Link');
const { liveVisitorsLast60s } = require('./utils/analytics');

async function start() {
  if (!mongoUri) throw new Error('MONGO_URI is missing');

  await mongoose.connect(mongoUri);
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: clientUrl } });
  app.set('io', io);

  io.on('connection', (socket) => {
    socket.on('join:user', (userId) => {
      if (userId) socket.join(`user:${userId}`);
    });
    socket.on('join:link', (linkId) => {
      if (linkId) socket.join(`link:${linkId}`);
    });
  });

  setInterval(async () => {
    try {
      const since = new Date(Date.now() - 60 * 1000);
      const recent = await Visit.find({ visitedAt: { $gte: since } }).lean();
      const liveCount = liveVisitorsLast60s(recent);
      io.emit('live:global', { liveCount, bars: Array(Math.min(liveCount, 12)).fill('■').join('') });

      const links = await Link.find().select('_id userId shortCode').lean();
      for (const link of links) {
        const linkVisits = recent.filter((v) => v.linkId.toString() === link._id.toString());
        const count = liveVisitorsLast60s(linkVisits);
        if (count > 0) {
          io.to(`user:${link.userId}`).emit('live:linkCount', { linkId: link._id.toString(), shortCode: link.shortCode, count });
        }
      }
    } catch (err) {
      console.error('live ticker error', err.message);
    }
  }, 5000);

  server.listen(port, () => {
    console.log(`LinkLens AI server running on port ${port}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
