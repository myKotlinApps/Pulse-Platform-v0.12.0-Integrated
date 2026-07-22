import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/legacy.css';
import legacyBody from './legacy/body.html?raw';
import legacyRuntime from './legacy/runtime.js?raw';

function LegacyParityApp() {
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'fa');
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.text = legacyRuntime;
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: legacyBody }} />;
}

createRoot(document.getElementById('root')).render(<LegacyParityApp />);
