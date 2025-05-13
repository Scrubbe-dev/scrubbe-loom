'use client';
import { useEffect } from 'react';

export function PresentationMode() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'p' && e.ctrlKey) {
        document.documentElement.classList.toggle('presentation-mode');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return null;
}

// Add to globals.css:
