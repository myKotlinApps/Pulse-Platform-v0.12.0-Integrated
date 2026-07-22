
const FALLBACK_VEHICLES = [
  { make: 'پژو', model: '۲۰۶', year: 1398, protocols: ['ISO 15765-4 CAN 11bit/500k'], profile: 'OBD-II', segment: 'passenger' },
  { make: 'سمند', model: 'سورن', year: 1400, protocols: ['ISO 15765-4 CAN 11bit/500k'], profile: 'OBD-II', segment: 'passenger' },
  { make: 'پراید', model: '۱۳۱', year: 1395, protocols: ['ISO 9141-2'], profile: 'OBD-II', segment: 'passenger' },
  { make: 'تویوتا', model: 'کرولا', year: 2019, protocols: ['ISO 15765-4'], profile: 'OBD-II', segment: 'passenger' },
  { make: 'هیوندای', model: 'النترا', year: 2020, protocols: ['ISO 15765-4'], profile: 'OBD-II', segment: 'passenger' },
];

const FALLBACK_DEMO = {
  vehicle: { make: 'ECU Pulse', model: 'خودروی نمایشی', profile: 'Demo ELM327 / ISO 15765-4 CAN', segment: 'demo', protocols: ['ISO 15765-4 CAN 11/500', 'Generic OBD-II'], isDemo: true },
  scenario: { sampleIntervalMs: 800, dtcs: [{ code: 'P0133', kind: 'STORED', description: 'پاسخ کند سنسور اکسیژن بانک ۱ — داده نمایشی' }, { code: 'P0420', kind: 'PENDING', description: 'بازده کاتالیست پایین‌تر از آستانه — داده نمایشی' }] },
  demoTrip: { id: 'demo-trip-fallback', titleFa: 'تهران: مسیر نمایشی', points: [
    { lat: 35.69972, lon: 51.33703, offsetSeconds: 0, speedKph: 0, rpm: 800 },
    { lat: 35.70108, lon: 51.3911, offsetSeconds: 20, speedKph: 52, rpm: 2100 },
    { lat: 35.70405, lon: 51.42115, offsetSeconds: 42, speedKph: 68, rpm: 2400 },
    { lat: 35.72865, lon: 51.5312, offsetSeconds: 80, speedKph: 0, rpm: 820, label: 'پایان مسیر' },
  ], stops: [] },
};

async function getJson(path, fallback) {
  try {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch {
    return fallback;
  }
}

export async function loadAppData() {
  const [core, demo, brandLogos, commandCatalog] = await Promise.all([
    getJson('/data/core-data.json', { vehicles: FALLBACK_VEHICLES, pids: [], fallbackDtcs: [] }),
    getJson('/demo-profile.json', FALLBACK_DEMO),
    getJson('/data/brand-logos.json', { brands: [] }),
    getJson('/data/ecu-console-commands.json', { groups: [] }),
  ]);

  return {
    vehicles: (core.vehicles || FALLBACK_VEHICLES).map((vehicle, index) => ({ ...vehicle, index })),
    pids: core.pids || [],
    fallbackDtcs: core.fallbackDtcs || [],
    profiles: core.profiles || [],
    demo,
    brandLogos: brandLogos.brands || [],
    commandGroups: commandCatalog.groups || [],
    commandPolicy: {
      blockedPrefixes: commandCatalog.blockedPrefixes || ['04', '08', '10', '11', '14', '27', '28', '2E', '2F', '31', '34', '35', '36', '37', '3D', '85'],
      advancedReadPrefixes: commandCatalog.advancedReadPrefixes || ['19', '1A', '21', '22'],
    },
  };
}
