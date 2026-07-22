import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../stores/appStore';

const demoClips = [
  { id: 1, name: 'Morning Drive',           date: '2025-01-15', duration: '12:34', thumbnail: '🎬' },
  { id: 2, name: 'Highway Cruise',          date: '2025-01-14', duration: '25:10', thumbnail: '🛣️' },
  { id: 3, name: 'Night City',              date: '2025-01-13', duration: '08:45', thumbnail: '🌃' },
  { id: 4, name: 'Parking Lot Incident',    date: '2025-01-12', duration: '01:23', thumbnail: '⚠️' },
];

export default function DashcamPage() {
  const setActivePage = useAppStore((s) => s.setActivePage);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedClip, setSelectedClip] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [clips] = useState(demoClips);
  const timerRef = useRef(null);

  useEffect(() => {
    setActivePage('dashcam');
  }, [setActivePage]);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing]);

  const toggleRec = () => {
    if (!recording) {
      setRecording(true);
      setSelectedClip(null);
      setPlaying(false);
      setElapsed(0);
    } else {
      setRecording(false);
    }
  };

  const playClip = (clip) => {
    setSelectedClip(clip);
    setPlaying(true);
    setElapsed(0);
    setRecording(false);
  };

  const togglePlay = () => {
    if (!selectedClip && !recording) return;
    setPlaying((prev) => !prev);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    setFullscreen((prev) => !prev);
  };

  return (
    <div className="animate-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ecu-bright">Dashcam</h2>
        {recording && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-ecu-red animate-pulse" />
            <span className="text-xs text-ecu-red font-bold">REC</span>
            <span className="text-xs text-ecu-muted">{formatTime(elapsed)}</span>
          </div>
        )}
      </div>

      {/* Video Player Placeholder */}
      <div
        className={`glass-card relative bg-black overflow-hidden flex items-center justify-center ${
          fullscreen ? 'fixed inset-0 z-50 rounded-none m-0' : ''
        }`}
        style={{ minHeight: fullscreen ? '100vh' : 220 }}
      >
        {/* Placeholder content */}
        <div className="text-center">
          {recording ? (
            <>
              <div className="text-4xl mb-2">📹</div>
              <div className="text-ecu-red font-bold text-lg animate-pulse">● RECORDING</div>
              <div className="text-ecu-muted text-sm mt-1">{formatTime(elapsed)}</div>
            </>
          ) : selectedClip ? (
            <>
              <div className="text-4xl mb-2">{selectedClip.thumbnail}</div>
              <div className="text-ecu-bright font-semibold">{selectedClip.name}</div>
              <div className="text-ecu-muted text-sm">
                {playing ? `${formatTime(elapsed)} / ${selectedClip.duration}` : selectedClip.duration}
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl mb-2">🎥</div>
              <div className="text-ecu-muted text-sm">No video selected</div>
              <div className="text-ecu-muted text-xs mt-1">Press REC or select a clip</div>
            </>
          )}
        </div>

        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <button
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              recording ? 'bg-ecu-red text-white' : 'bg-ecu-red/20 text-ecu-red border border-ecu-red/40'
            }`}
            onClick={toggleRec}
          >
            {recording ? '■' : '●'}
          </button>
          <button
            className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center"
            onClick={togglePlay}
            disabled={!selectedClip && !recording}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <button
            className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"
            onClick={toggleFullscreen}
          >
            {fullscreen ? '⤓' : '⛶'}
          </button>
        </div>
      </div>

      {/* REC Status Indicator */}
      <div className="flex items-center gap-3 glass-card">
        <div className={`w-3 h-3 rounded-full ${recording ? 'bg-ecu-red animate-pulse' : 'bg-ecu-border'}`} />
        <span className="text-sm text-ecu-bright">
          {recording ? 'Recording in progress...' : 'Standby'}
        </span>
      </div>

      {/* Clip List */}
      <div className="glass-card">
        <h3 className="text-sm font-semibold text-ecu-bright mb-3">
          Saved Clips ({clips.length})
        </h3>
        <div className="space-y-2">
          {clips.map((clip) => (
            <button
              key={clip.id}
              className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                selectedClip && selectedClip.id === clip.id
                  ? 'bg-ecu-accent/15 border border-ecu-accent/40'
                  : 'bg-ecu-surface border border-ecu-border hover:border-ecu-accent/50'
              }`}
              onClick={() => playClip(clip)}
            >
              <div className="text-2xl">{clip.thumbnail}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ecu-bright">{clip.name}</div>
                <div className="text-xs text-ecu-muted">{clip.date} · {clip.duration}</div>
              </div>
              <span className="text-ecu-muted text-xs">{clip.duration}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
