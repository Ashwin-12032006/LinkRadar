const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  linkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Link', required: true, index: true },
  visitedAt: { type: Date, default: Date.now, index: true },
  userAgent: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  browser: { type: String, default: 'Unknown' },
  device: { type: String, default: 'Unknown' },
  os: { type: String, default: 'Unknown' },
  country: { type: String, default: 'Unknown' },
  city: { type: String, default: 'Unknown' },
  region: { type: String, default: 'Unknown' },
});

module.exports = mongoose.model('Visit', visitSchema);
