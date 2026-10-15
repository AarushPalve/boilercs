'use client';

// ---------------------------------------------------------------------------
// Mounted once in the root layout. Two jobs:
//   1. Unregister any stale Service Worker from earlier builds.
//   2. Drive the cursor-following paper-grain layer (#grain-cursor): track the
//      pointer and expose its position as CSS custom properties so a radial
//      mask reveals the dotted texture only around the cursor.
// ---------------------------------------------------------------------------

import { useEffect } from 'react';

export default function RuntimeBootstrap() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {
          /* best-effort cleanup */
        });
    }

    // Create the grain layer once.
    let grain = document.getElementById('grain-cursor');
    if (!grain) {
      grain = document.createElement('div');
      grain.id = 'grain-cursor';
      grain.setAttribute('aria-hidden', 'true');
      document.body.appendChild(grain);
    }

    let raf = 0;
    let hideTimer: ReturnType<typeof setTimeout>;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!grain) return;
        grain.style.setProperty('--mx', `${e.clientX}px`);
        grain.style.setProperty('--my', `${e.clientY}px`);
        grain.classList.add('is-active');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => grain?.classList.remove('is-active'), 2500);
      });
    };
    const onLeave = () => grain?.classList.remove('is-active');

    // Only enable on devices with a fine pointer (skip touch).
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (fine) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerout', onLeave);
    }

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerout', onLeave);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(hideTimer);
    };
  }, []);

  return null;
}
