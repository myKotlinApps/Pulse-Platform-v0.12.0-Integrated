
export function getPlatform() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const isCapacitor = typeof window !== 'undefined' && !!window.Capacitor;
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isDesktop = !isAndroid && !isIOS;
  return {
    isCapacitor,
    isAndroid,
    isIOS,
    isDesktop,
    isWeb: !isCapacitor,
    supportsWebSerial: typeof navigator !== 'undefined' && 'serial' in navigator,
    supportsGeolocation: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    supportsFilePicker: typeof window !== 'undefined' && 'showSaveFilePicker' in window,
  };
}

export const platformAdapters = {
  storage: {
    get(key, fallback = null) {
      try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch {}
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch {}
    },
  },
  files: {
    downloadText(fileName, content, type = 'text/plain;charset=utf-8') {
      if (typeof document === 'undefined') return false;
      const blob = new Blob([content], { type });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      return true;
    },
  },
};
