
export function fa(value) {
  if (value === null || value === undefined) return '--';
  return String(value).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

export function formatTime(seconds = 0) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${fa(String(m).padStart(2, '0'))}:${fa(String(s).padStart(2, '0'))}`;
}

export function normalizeCommand(value) {
  return String(value || '').toUpperCase().replace(/\s+/g, '').replace(/[\r\n]/g, '');
}

export function haversine(a, b) {
  const r = 6371e3;
  const p1 = (a.lat * Math.PI) / 180;
  const p2 = (b.lat * Math.PI) / 180;
  const dp = ((b.lat - a.lat) * Math.PI) / 180;
  const dl = ((b.lon - a.lon) * Math.PI) / 180;
  const q = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));
}

export function tripSummary(points = []) {
  let distance = 0;
  let moving = 0;
  let stopped = 0;
  let max = 0;
  for (let i = 1; i < points.length; i += 1) {
    const dt = Math.max(0, ((points[i].t || 0) - (points[i - 1].t || 0)) / 1000);
    const d = haversine(points[i - 1], points[i]);
    if (d < 1000) distance += d;
    const speed = points[i].speed || points[i].speedKph || (dt ? (d / dt) * 3.6 : 0) || 0;
    max = Math.max(max, speed);
    if (speed < 2) stopped += dt;
    else moving += dt;
  }
  return { distance, moving, stopped, max };
}
