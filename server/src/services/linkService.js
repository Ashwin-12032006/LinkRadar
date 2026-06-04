function customAlphabet(alphabet, size) {
  return () => {
    let result = '';
    const alphabetLength = alphabet.length;
    for (let i = 0; i < size; i++) {
      result += alphabet.charAt(Math.floor(Math.random() * alphabetLength));
    }
    return result;
  };
}
const bcrypt = require('bcryptjs');
const Link = require('../models/Link');
const Visit = require('../models/Visit');
const { baseUrl, clientUrl } = require('../config/env');
const {
  detectCategory,
  checkThreat,
  fetchUrlPreview,
  generateAiInsights,
  computePerformanceScore,
  getBadges,
} = require('../utils/intelligence');
const {
  aggregateDailyTrend,
  aggregateBrowsers,
  aggregateDevices,
  aggregateRegions,
  computeTrendStats,
  liveVisitorsLast60s,
} = require('../utils/analytics');

const makeCode = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 7);

function validHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function serializeLink(link) {
  const obj = link.toObject ? link.toObject({ virtuals: true }) : link;
  const expired = obj.expiresAt && new Date(obj.expiresAt) < new Date();
  return {
    id: obj._id,
    originalUrl: obj.originalUrl,
    shortCode: obj.shortCode,
    shortUrl: `${baseUrl}/${obj.shortCode}`,
    publicStatsUrl: `${clientUrl}/stats/${obj.shortCode}`,
    clickCount: obj.clickCount,
    createdAt: obj.createdAt,
    lastVisitedAt: obj.lastVisitedAt,
    expiresAt: obj.expiresAt,
    category: obj.category,
    status: expired ? 'Expired' : 'Active',
    isPublicStats: obj.isPublicStats,
    threatLevel: obj.threatLevel,
    threatMessage: obj.threatMessage,
    preview: obj.preview,
    performanceScore: obj.performanceScore,
    hasPassword: Boolean(obj.linkPasswordHash),
    isSecureShield: obj.isSecureShield,
  };
}

async function analyzeUrl(originalUrl) {
  if (!validHttpUrl(originalUrl)) return { error: 'Please provide a valid http/https URL' };
  const threat = checkThreat(originalUrl);
  const category = detectCategory(originalUrl);
  const preview = await fetchUrlPreview(originalUrl);
  return { category, threat, preview };
}

async function createLink(userId, payload) {
  const {
    originalUrl,
    customAlias,
    expiresInDays,
    password,
    isPublicStats = true,
    ignoreThreatWarning = false,
    isSecureShield = false,
  } = payload;

  if (!validHttpUrl(originalUrl)) throw new Error('Please provide a valid URL');
  const threat = checkThreat(originalUrl);
  if (threat.level === 'blocked') throw new Error(threat.message);
  if (threat.level === 'warning' && !ignoreThreatWarning) {
    const err = new Error(threat.message);
    err.code = 'THREAT_WARNING';
    err.threat = threat;
    throw err;
  }

  let shortCode = customAlias || makeCode();
  if (customAlias) {
    const existing = await Link.findOne({ shortCode: customAlias });
    if (existing) throw new Error('Custom alias already in use');
    shortCode = customAlias;
  } else {
    while (await Link.findOne({ shortCode })) shortCode = makeCode();
  }

  const category = detectCategory(originalUrl);
  const preview = await fetchUrlPreview(originalUrl);
  let expiresAt = null;
  if (expiresInDays && Number(expiresInDays) > 0) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays));
  }

  const linkPasswordHash = password ? await bcrypt.hash(password, 10) : null;

  const link = await Link.create({
    userId,
    originalUrl,
    shortCode,
    customAlias: Boolean(customAlias),
    category,
    expiresAt,
    linkPasswordHash,
    isPublicStats,
    threatLevel: threat.level,
    threatMessage: threat.message,
    preview,
    isSecureShield,
    performanceScore: 10,
  });

  return serializeLink(link);
}

async function getAnalytics(linkId, userId) {
  const link = await Link.findOne({ _id: linkId, userId });
  if (!link) return null;

  const visits = await Visit.find({ linkId: link._id }).sort({ visitedAt: -1 }).lean();
  const trendStats = computeTrendStats(visits);
  const performance = computePerformanceScore(link, visits, trendStats);
  link.performanceScore = performance.score;
  await link.save();

  const insights = generateAiInsights(link, visits, trendStats);
  const badges = getBadges(link.clickCount);

  return {
    link: serializeLink(link),
    totalClicks: link.clickCount,
    lastVisitedAt: link.lastVisitedAt,
    liveVisitors: liveVisitorsLast60s(visits),
    timeline: visits.slice(0, 30).map((v) => ({
      id: v._id,
      time: v.visitedAt,
      city: v.city,
      region: v.region,
      country: v.country,
      browser: v.browser,
      device: v.device,
      os: v.os,
    })),
    clickTrend: aggregateDailyTrend(visits),
    browsers: aggregateBrowsers(visits),
    devices: aggregateDevices(visits),
    regions: aggregateRegions(visits),
    aiInsights: insights,
    performance,
    badges,
  };
}

async function getPublicStats(shortCode) {
  const link = await Link.findOne({ shortCode, isPublicStats: true }).lean();
  if (!link) return null;
  const visits = await Visit.find({ linkId: link._id }).lean();
  const trendStats = computeTrendStats(visits);
  return {
    shortCode: link.shortCode,
    clickCount: link.clickCount,
    category: link.category,
    createdAt: link.createdAt,
    countries: [...new Set(visits.map((v) => v.country).filter((c) => c !== 'Unknown'))],
    clickTrend: aggregateDailyTrend(visits),
    regions: aggregateRegions(visits),
    growth: trendStats.growthPercent,
  };
}

module.exports = {
  validHttpUrl,
  serializeLink,
  analyzeUrl,
  createLink,
  getAnalytics,
  getPublicStats,
  makeCode,
};
