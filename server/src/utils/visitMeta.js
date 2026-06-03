const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');

function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .toString()
    .split(',')[0]
    .trim()
    .replace('::ffff:', '');
}

function parseVisitMeta(req) {
  const ua = req.get('user-agent') || '';
  const parsed = new UAParser(ua).getResult();
  const ip = getClientIp(req);
  const geo = geoip.lookup(ip) || {};

  return {
    userAgent: ua,
    ipAddress: ip,
    browser: parsed.browser.name || 'Unknown',
    device: parsed.device.type === 'mobile' ? 'Mobile' : parsed.device.type === 'tablet' ? 'Tablet' : 'Desktop',
    os: parsed.os.name || 'Unknown',
    country: geo.country || 'Unknown',
    city: geo.city || 'Unknown',
    region: geo.region || geo.country || 'Unknown',
  };
}

module.exports = { parseVisitMeta, getClientIp };
