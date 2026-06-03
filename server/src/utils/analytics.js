function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function aggregateDailyTrend(visits, days = 7) {
  const labels = [];
  const values = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const key = startOfDay(day).toISOString().slice(0, 10);
    labels.push(day.toLocaleDateString('en-US', { weekday: 'short' }));
    values.push(visits.filter((v) => startOfDay(v.visitedAt).toISOString().slice(0, 10) === key).length);
  }
  return { labels, values };
}

function aggregateBrowsers(visits) {
  const map = {};
  visits.forEach((v) => {
    map[v.browser] = (map[v.browser] || 0) + 1;
  });
  return Object.entries(map).map(([name, count]) => ({ name, count }));
}

function aggregateDevices(visits) {
  const map = {};
  visits.forEach((v) => {
    map[v.device] = (map[v.device] || 0) + 1;
  });
  return Object.entries(map).map(([name, count]) => ({ name, count }));
}

function aggregateRegions(visits) {
  const map = {};
  visits.forEach((v) => {
    const key = v.region && v.region !== 'Unknown' ? v.region : v.country;
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map)
    .map(([region, clicks]) => ({ region, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 12);
}

function aggregateCategories(links) {
  const map = {};
  links.forEach((l) => {
    const cat = l.category || 'Others';
    map[cat] = (map[cat] || 0) + 1;
  });
  return Object.entries(map).map(([name, count]) => ({ name, count }));
}

function computeTrendStats(visits) {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const thisWeek = visits.filter((v) => now - new Date(v.visitedAt).getTime() <= weekMs);
  const lastWeek = visits.filter((v) => {
    const age = now - new Date(v.visitedAt).getTime();
    return age > weekMs && age <= 2 * weekMs;
  });
  const growthPercent =
    lastWeek.length === 0 ? (thisWeek.length > 0 ? 100 : 0) : Math.round(((thisWeek.length - lastWeek.length) / lastWeek.length) * 100);

  const hourMap = {};
  visits.forEach((v) => {
    const h = new Date(v.visitedAt).getHours();
    hourMap[h] = (hourMap[h] || 0) + 1;
  });
  let peakHour = null;
  let max = 0;
  Object.entries(hourMap).forEach(([h, c]) => {
    if (c > max) {
      max = c;
      peakHour = `${h}:00 - ${Number(h) + 1}:00`;
    }
  });

  return { growthPercent, peakHour: peakHour || 'N/A' };
}

function liveVisitorsLast60s(visits) {
  const cutoff = Date.now() - 60 * 1000;
  return visits.filter((v) => new Date(v.visitedAt).getTime() >= cutoff).length;
}

module.exports = {
  aggregateDailyTrend,
  aggregateBrowsers,
  aggregateDevices,
  aggregateRegions,
  aggregateCategories,
  computeTrendStats,
  liveVisitorsLast60s,
};
