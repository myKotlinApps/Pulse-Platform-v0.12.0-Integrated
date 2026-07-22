import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loadAppData } from '../services/dataLoader';
import { demoSnapshot, normalizedDemoTrip } from '../services/demo';

const DEFAULT_LIVE = { rpm: 0, speedKph: 0, coolantC: null, voltage: null, engineLoad: null };

export const useAppStore = create(
  persist(
    (set, get) => ({
      theme: 'mydiag',
      plan: 'free',
      demoMode: true,
      vehicleIndex: 0,
      live: DEFAULT_LIVE,
      dtcs: [],
      vehicles: [],
      pids: [],
      fallbackDtcs: [],
      profiles: [],
      demo: null,
      brandLogos: [],
      commandGroups: [],
      commandPolicy: {},
      trips: [],
      errors: [],
      activePage: 'home',
      activeApi: null,
      token: null,
      tokenExp: 0,
      customLogo: '',
      initialized: false,
      loading: false,
      loadError: '',

      initialize: async () => {
        const s = get();
        if (s.initialized || s.loading) return;
        set({ loading: true, loadError: '' });
        try {
          const data = await loadAppData();
          const storedVehicle = Number(localStorage.getItem('ecuVehicle'));
          const vehicleIndex = Number.isFinite(storedVehicle) && storedVehicle >= 0 ? storedVehicle : s.vehicleIndex;
          const customLogo = localStorage.getItem('ecuCustomLogo') || s.customLogo || '';
          const demoMode = localStorage.getItem('ecuDemoMode') === 'false' ? false : s.demoMode;
          const seededTrips = [...s.trips];
          const demoTrip = normalizedDemoTrip(data.demo?.demoTrip);
          if (demoTrip && !seededTrips.some((t) => t.id === demoTrip.id)) seededTrips.push(demoTrip);
          set({ ...data, vehicleIndex, customLogo, demoMode, trips: seededTrips, initialized: true, loading: false });
          if (demoMode) get().startDemo();
        } catch (error) {
          set({ loading: false, loadError: error.message || 'خطا در بارگذاری داده‌ها' });
        }
      },

      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme;
        try { localStorage.setItem('ecuTheme', theme); } catch {}
      },
      setPlan: (plan) => set({ plan }),
      setDemoMode: (demoMode) => {
        set({ demoMode });
        try { localStorage.setItem('ecuDemoMode', String(demoMode)); } catch {}
        if (demoMode) get().startDemo(); else get().stopDemo();
      },
      setVehicleIndex: (vehicleIndex) => {
        set({ vehicleIndex, demoMode: false, customLogo: '' });
        try { localStorage.setItem('ecuVehicle', String(vehicleIndex)); localStorage.setItem('ecuDemoMode', 'false'); localStorage.removeItem('ecuCustomLogo'); } catch {}
        get().stopDemo();
      },
      updateLive: (data) => set((s) => ({ live: { ...s.live, ...data } })),
      setDtcs: (dtcs) => set({ dtcs }),
      addTrip: (trip) => set((s) => ({ trips: [...s.trips, trip].slice(-100) })),
      removeTrip: (id) => set((s) => ({ trips: s.trips.filter((x) => x.id !== id || x.demo) })),
      setActivePage: (activePage) => set({ activePage }),
      setToken: (token, tokenExp) => set({ token, tokenExp }),
      addVehicle: (v) => set((s) => ({ vehicles: [...s.vehicles, { ...v, index: s.vehicles.length }] })),
      removeVehicle: (id) => set((s) => ({ vehicles: s.vehicles.filter((x) => x.id !== id) })),
      setCustomLogo: (customLogo) => {
        set({ customLogo });
        try { if (customLogo) localStorage.setItem('ecuCustomLogo', customLogo); else localStorage.removeItem('ecuCustomLogo'); } catch {}
      },
      activeVehicle: () => {
        const s = get();
        return s.demoMode ? s.demo?.vehicle : (s.vehicles[s.vehicleIndex] || s.vehicles[0] || s.demo?.vehicle);
      },
      availableVehicles: () => {
        const s = get();
        if (s.plan === 'pro') return s.vehicles;
        return s.vehicles.filter((v, i) => v.segment === 'passenger' && i < Math.max(8, Math.ceil(s.vehicles.length * 0.1)));
      },
      startDemo: () => {
        get().stopDemo();
        const interval = get().demo?.scenario?.sampleIntervalMs || 800;
        let tick = 0;
        const step = () => set({ live: demoSnapshot(tick++, get().demo), demoMode: true });
        step();
        const timer = setInterval(step, interval);
        set({ demoTimer: timer, demoMode: true });
      },
      stopDemo: () => {
        const timer = get().demoTimer;
        if (timer) clearInterval(timer);
        set({ demoTimer: null });
      },
      readDemoDtcs: () => set((s) => ({ dtcs: (s.demo?.scenario?.dtcs || []).map((x) => ({ ...x })) })),
      clearDtcs: () => set({ dtcs: [] }),
    }),
    {
      name: 'ecu-pulse-state',
      partialize: (s) => ({ theme: s.theme, plan: s.plan, demoMode: s.demoMode, vehicleIndex: s.vehicleIndex, trips: s.trips, customLogo: s.customLogo }),
    },
  ),
);
