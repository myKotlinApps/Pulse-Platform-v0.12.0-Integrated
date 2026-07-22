import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Shell from './components/Shell';
import { useAppStore } from './stores/appStore';

const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const VehiclesPage = lazy(() => import('./pages/VehiclesPage'));
const TripsPage = lazy(() => import('./pages/TripsPage'));
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'));
const ProCenterPage = lazy(() => import('./pages/ProCenterPage'));
const StorePage = lazy(() => import('./pages/StorePage'));
const ErrorsPage = lazy(() => import('./pages/ErrorsPage'));
const ScannerPage = lazy(() => import('./pages/ScannerPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const DrivingStylePage = lazy(() => import('./pages/DrivingStylePage'));
const ParkingPage = lazy(() => import('./pages/ParkingPage'));
const DashcamPage = lazy(() => import('./pages/DashcamPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-ecu-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const initialize = useAppStore((s) => s.initialize);
  const initialized = useAppStore((s) => s.initialized);
  const loading = useAppStore((s) => s.loading);
  const loadError = useAppStore((s) => s.loadError);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!initialized && loading) {
    return <PageLoader />;
  }

  if (loadError) {
    return (
      <div className="min-h-dvh grid place-items-center bg-ecu-bg text-ecu-bright p-6 text-center">
        <div className="glass-card max-w-md">
          <h1 className="text-lg font-bold mb-2">خطا در بارگذاری ECU Pulse</h1>
          <p className="text-sm text-ecu-muted">{loadError}</p>
          <button className="btn-primary mt-4" onClick={initialize}>تلاش دوباره</button>
        </div>
      </div>
    );
  }

  return (
    <Shell>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/pro" element={<ProCenterPage />} />
          <Route path="/procenter" element={<ProCenterPage />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/errors" element={<ErrorsPage />} />
          <Route path="/scanner" element={<ScannerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/driving-style" element={<DrivingStylePage />} />
          <Route path="/parking" element={<ParkingPage />} />
          <Route path="/dashcam" element={<DashcamPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Shell>
  );
}
