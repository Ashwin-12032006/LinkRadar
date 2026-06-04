const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalUrl: { type: String, required: true, trim: true },
    shortCode: { type: String, required: true, unique: true, index: true },
    customAlias: { type: Boolean, default: false },
    category: { type: String, default: 'Others' },
    clickCount: { type: Number, default: 0 },
    lastVisitedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    linkPasswordHash: { type: String, default: null },
    isPublicStats: { type: Boolean, default: true },
    threatLevel: { type: String, enum: ['safe', 'warning', 'blocked'], default: 'safe' },
    threatMessage: { type: String, default: '' },
    preview: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      image: { type: String, default: '' },
      favicon: { type: String, default: '' },
    },
    isSecureShield: { type: Boolean, default: false },
    performanceScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

linkSchema.virtual('status').get(function status() {
  if (this.expiresAt && this.expiresAt < new Date()) return 'Expired';
  return 'Active';
});

linkSchema.set('toJSON', { virtuals: true });
linkSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Link', linkSchema);
