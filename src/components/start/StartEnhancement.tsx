'use client';

import { useEffect } from 'react';

interface UnitCenter {
  x: number;
  y: number;
  radius: number;
}

interface WorkLinkState {
  link: HTMLAnchorElement;
  units: Array<HTMLElement | SVGElement>;
  centers: UnitCenter[] | null;
  frame: number;
  release: number;
  pointer: { x: number; y: number };
  reset: () => void;
}

export default function StartEnhancement() {
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const states: WorkLinkState[] = [];

    for (const link of document.querySelectorAll<HTMLAnchorElement>('.start-page .work-link')) {
      for (const word of link.querySelectorAll<HTMLElement>('.word')) {
        const fragment = document.createDocumentFragment();
        for (const letter of word.textContent ?? '') {
          const glyph = document.createElement('span');
          glyph.className = 'glyph';
          glyph.dataset.letter = letter;
          const face = document.createElement('span');
          face.className = 'glyph-face';
          face.textContent = letter;
          glyph.append(face);
          fragment.append(glyph);
        }
        word.replaceChildren(fragment);
        word.dataset.typeset = '';
      }
      link.dataset.ready = '';

      const state: WorkLinkState = {
        link,
        units: Array.from(link.querySelectorAll<HTMLElement | SVGElement>('.glyph, .press-arrow')),
        centers: null,
        frame: 0,
        release: 0,
        pointer: { x: 0, y: 0 },
        reset: () => undefined,
      };
      states.push(state);

      const measure = () => {
        state.centers = state.units.map((unit) => {
          const rect = unit.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            radius: Math.max(100, rect.height * 1.9),
          };
        });
      };

      const impress = () => {
        state.frame = 0;
        if (reducedMotion.matches || document.hidden) return;
        if (!state.centers) measure();
        state.units.forEach((unit, index) => {
          const center = state.centers?.[index];
          if (!center) return;
          const distance = Math.hypot(
            state.pointer.x - center.x,
            (state.pointer.y - center.y) * 0.7,
          );
          const pressure = Math.max(0, 1 - distance / center.radius);
          const smooth = pressure * pressure * (3 - 2 * pressure);
          unit.style.setProperty('--press', smooth.toFixed(3));
        });
      };

      const follow = (event: PointerEvent) => {
        if (event.pointerType === 'touch' || reducedMotion.matches || document.hidden) return;
        state.pointer = { x: event.clientX, y: event.clientY };
        if (!state.frame) state.frame = window.requestAnimationFrame(impress);
      };

      state.reset = () => {
        window.cancelAnimationFrame(state.frame);
        window.clearTimeout(state.release);
        state.frame = 0;
        state.centers = null;
        link.classList.remove('is-pressed');
        state.units.forEach((unit) => unit.style.removeProperty('--press'));
      };

      link.addEventListener('pointerenter', (event) => {
        state.centers = null;
        follow(event);
      }, { signal });
      link.addEventListener('pointermove', follow, { passive: true, signal });
      link.addEventListener('pointerleave', state.reset, { signal });
      link.addEventListener('pointercancel', state.reset, { signal });
      link.addEventListener('blur', state.reset, { signal });
      link.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        window.clearTimeout(state.release);
        link.classList.add('is-pressed');
      }, { signal });
      link.addEventListener('pointerup', () => {
        state.release = window.setTimeout(() => link.classList.remove('is-pressed'), 160);
      }, { signal });
    }

    const resetAll = () => states.forEach((state) => state.reset());
    window.addEventListener('resize', resetAll, { passive: true, signal });
    window.addEventListener('scroll', resetAll, { passive: true, signal });
    window.addEventListener('blur', resetAll, { signal });
    reducedMotion.addEventListener('change', resetAll, { signal });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) resetAll();
    }, { signal });
    void document.fonts?.ready.then(() => {
      if (!signal.aborted) resetAll();
    });

    const notice = document.querySelector<HTMLElement>('.start-page .notice');
    let noticeTimer = 0;
    const dismissNotice = () => {
      window.clearTimeout(noticeTimer);
      notice?.classList.remove('is-visible');
      if (notice) notice.textContent = '';
    };

    for (const link of document.querySelectorAll<HTMLAnchorElement>('.start-page [data-pending]')) {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        window.clearTimeout(noticeTimer);
        if (notice) {
          notice.textContent = `${link.dataset.pending} — link coming soon.`;
          notice.classList.add('is-visible');
        }
        noticeTimer = window.setTimeout(dismissNotice, 3500);
      }, { signal });
    }
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        dismissNotice();
        resetAll();
      }
    }, { signal });

    return () => {
      controller.abort();
      states.forEach((state) => state.reset());
      window.clearTimeout(noticeTimer);
    };
  }, []);

  return null;
}
