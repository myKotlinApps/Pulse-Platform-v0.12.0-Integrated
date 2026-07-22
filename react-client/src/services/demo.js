
export function demoSnapshot(tick = 0, demo = null) {
  const cycleSeconds = demo?.scenario?.cycleSeconds || 90;
  const phase = ((tick % cycleSeconds) / cycleSeconds) || 0;
  const drive = Math.sin(phase * Math.PI);
  const stop = tick % 42 > 30 && tick % 42 < 37;
  const signals = demo?.scenario?.signals || {};
  const maxSpeed = signals.speedKph?.max || 112;
  const minRpm = signals.rpm?.min || 760;
  const maxRpm = signals.rpm?.max || 3850;
  const speedKph = stop ? 0 : Math.max(0, 8 + maxSpeed * Math.pow(Math.max(0, drive), 1.25) + 8 * Math.sin(phase * Math.PI * 7));
  const rpm = stop ? minRpm : Math.min(maxRpm, minRpm + speedKph * 22 + 420 * Math.abs(Math.sin(phase * Math.PI * 9)));
  return {
    rpm: Math.round(rpm),
    speedKph: Math.round(speedKph),
    coolantC: Math.round((signals.coolantC?.min || 82) + 12 * Math.min(1, tick / 80)),
    voltage: Number(((signals.voltage?.min || 12.2) + 0.9 + 0.35 * Math.sin(phase * Math.PI * 4)).toFixed(1)),
    engineLoad: Math.round(18 + Math.min(54, speedKph * 0.42 + 18 * Math.abs(Math.sin(phase * Math.PI * 5)))),
  };
}

export function normalizedDemoTrip(demoTrip) {
  if (!demoTrip?.points?.length) return null;
  const now = Date.now() - (demoTrip.points.at(-1)?.offsetSeconds || 0) * 1000;
  const points = demoTrip.points.map((p) => ({
    lat: p.lat,
    lon: p.lon,
    t: now + (p.offsetSeconds || 0) * 1000,
    speed: p.speedKph || p.speed || 0,
    rpm: p.rpm || 0,
    accuracy: 6,
    label: p.label || null,
    stop: !!p.stop,
  }));
  return {
    id: demoTrip.id || `demo-${Date.now()}`,
    name: demoTrip.titleFa || 'سفر نمایشی',
    titleFa: demoTrip.titleFa || 'سفر نمایشی',
    descriptionFa: demoTrip.descriptionFa || '',
    startedAt: points[0]?.t || now,
    endedAt: points.at(-1)?.t || now,
    points,
    route: points.map((p) => [p.lat, p.lon]),
    demo: true,
    stops: demoTrip.stops || [],
  };
}
