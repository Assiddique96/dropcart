'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const defaultOptions = {
  breakpoints: [
    { width: 0, perView: 1 },
    { width: 640, perView: 1 },
    { width: 900, perView: 2 },
    { width: 1200, perView: 2 },
  ],
  gap: 12,
  autoplay: true,
  autoplayInterval: 4000,
  loop: true,
  transitionMs: 400,
  impressionBatchInterval: 3000,
  impressionStorageKey: 'carousel_impressions_v1', // localStorage key for dedupe
};

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function getPerViewFromBreakpoints(bps, width) {
  let perView = bps[0].perView;
  for (let i = 0; i < bps.length; i++) if (width >= bps[i].width) perView = bps[i].perView;
  return perView;
}

export default function useCarousel(userOptions = {}) {
  const options = { ...defaultOptions, ...userOptions };
  options.breakpoints = (options.breakpoints || []).sort((a, b) => a.width - b.width);

  const rootRef = useRef(null);
  const wrapRef = useRef(null);
  const slidesRef = useRef([]);
  const slideWidthRef = useRef(0);
  const indexRef = useRef(0);
  const [perView, setPerView] = useState(() =>
    typeof window === 'undefined' ? options.breakpoints[0].perView : getPerViewFromBreakpoints(options.breakpoints, window.innerWidth)
  );
  const [tick, setTick] = useState(0);

  const autoplayRef = useRef(null);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragDeltaRef = useRef(0);

  // impression dedupe queue and observer
  const impressionQueueRef = useRef([]);
  const impressionObserverRef = useRef(null);

  // read dedupe map from localStorage for this session
  const readImpressionMap = useCallback(() => {
    try {
      const raw = localStorage.getItem(options.impressionStorageKey);
      if (!raw) return {};
      return JSON.parse(raw) || {};
    } catch (e) {
      return {};
    }
  }, [options.impressionStorageKey]);

  const writeImpressionMap = useCallback((map) => {
    try {
      localStorage.setItem(options.impressionStorageKey, JSON.stringify(map));
    } catch (e) {
      // ignore
    }
  }, [options.impressionStorageKey]);

  // Setup slides refs when children mount (call from component)
  const collectSlides = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    slidesRef.current = Array.from(wrap.children);
    slidesRef.current.forEach(s => s.classList.add('carousel-slide'));
    updateLayout();
    setupImpressionObserver();
  }, []);

  const updateLayout = useCallback(() => {
    const root = rootRef.current;
    const wrap = wrapRef.current;
    if (!root || !wrap) return;
    const width = root.clientWidth || window.innerWidth;
    const pv = getPerViewFromBreakpoints(options.breakpoints, width);
    setPerView(pv);
    const totalGap = (pv - 1) * (options.gap || 0);
    const sw = (width - totalGap) / pv;
    slideWidthRef.current = sw;
    slidesRef.current.forEach(s => {
      s.style.minWidth = Math.round(sw) + 'px';
      s.style.maxWidth = Math.round(sw) + 'px';
    });
    goTo(indexRef.current, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.breakpoints, options.gap]);

  function maxStartIndex() {
    if (options.loop) return Math.max(0, slidesRef.current.length - 1);
    return Math.max(0, slidesRef.current.length - perView);
  }

  function goTo(i, instant = false) {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (!options.loop) i = clamp(i, 0, maxStartIndex());
    indexRef.current = i;
    if (instant) wrap.style.transition = 'none';
    else wrap.style.transition = `transform ${options.transitionMs}ms ease`;
    const offset = -(slideWidthRef.current + (options.gap || 0)) * indexRef.current;
    wrap.style.transform = `translateX(${offset}px)`;
    if (instant) { void wrap.offsetWidth; wrap.style.transition = `transform ${options.transitionMs}ms ease`; }
    slidesRef.current.forEach((s, idx) => {
      s.setAttribute('aria-hidden', idx < indexRef.current || idx >= indexRef.current + perView ? 'true' : 'false');
    });
    setTick(t => t + 1);
  }

  function next() {
    if (options.loop) indexRef.current = (indexRef.current + 1) % Math.max(1, slidesRef.current.length);
    else indexRef.current = clamp(indexRef.current + 1, 0, maxStartIndex());
    goTo(indexRef.current);
  }
  function prev() {
    if (options.loop) indexRef.current = (indexRef.current - 1 + Math.max(1, slidesRef.current.length)) % Math.max(1, slidesRef.current.length);
    else indexRef.current = clamp(indexRef.current - 1, 0, maxStartIndex());
    goTo(indexRef.current);
  }

  // autoplay controls
  function startAutoplay() {
    stopAutoplay();
    if (!options.autoplay) return;
    autoplayRef.current = window.setInterval(() => next(), options.autoplayInterval);
  }
  function stopAutoplay() {
    if (autoplayRef.current) { window.clearInterval(autoplayRef.current); autoplayRef.current = null; }
  }
  function resetAutoplay() { stopAutoplay(); startAutoplay(); }

  // drag handlers
  function onPointerDown(e) {
    draggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragDeltaRef.current = 0;
    try { e.target.setPointerCapture(e.pointerId); } catch {}
    const wrap = wrapRef.current; if (wrap) wrap.style.transition = 'none';
  }
  function onPointerMove(e) {
    if (!draggingRef.current) return;
    dragDeltaRef.current = e.clientX - dragStartXRef.current;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const offset = -(slideWidthRef.current + (options.gap || 0)) * indexRef.current + dragDeltaRef.current;
    wrap.style.transform = `translateX(${offset}px)`;
  }
  function onPointerUp(e) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try { e.target.releasePointerCapture(e.pointerId); } catch {}
    const wrap = wrapRef.current; if (wrap) wrap.style.transition = `transform ${options.transitionMs}ms ease`;
    if (Math.abs(dragDeltaRef.current) > slideWidthRef.current * 0.25) {
      if (dragDeltaRef.current < 0) next(); else prev();
    } else goTo(indexRef.current);
    resetAutoplay();
  }

  // impression observer: dedupe per-session using localStorage
  function setupImpressionObserver() {
    disconnectImpressionObserver();
    const observer = new IntersectionObserver((entries) => {
      const seen = readImpressionMap();
      entries.forEach(ent => {
        if (ent.isIntersecting) {
          const el = ent.target;
          const id = el.dataset.slideId;
          const meta = el.dataset.slideMeta ? JSON.parse(el.dataset.slideMeta) : undefined;
          const idx = slidesRef.current.indexOf(el);
          if (!id) return;
          // dedupe: check localStorage map
          if (!seen[id]) {
            // mark seen now (so concurrent entries don't duplicate)
            seen[id] = { ts: Date.now() };
            impressionQueueRef.current.push({ id, index: idx, meta, ts: Date.now() });
            writeImpressionMap(seen);
          }
          observer.unobserve(el); // we only need one impression per session per slide
        }
      });
    }, { threshold: 0.5 });
    impressionObserverRef.current = observer;
    slidesRef.current.forEach(s => observer.observe(s));
  }

  function disconnectImpressionObserver() {
    if (impressionObserverRef.current) {
      impressionObserverRef.current.disconnect();
      impressionObserverRef.current = null;
    }
  }

  // flush impressions batch to server
  useEffect(() => {
    const id = setInterval(() => {
      const q = impressionQueueRef.current.splice(0);
      if (!q || q.length === 0) return;
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'banner_impressions', impressions: q }),
      }).catch(() => {});
    }, options.impressionBatchInterval);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // window resize & lifecycle
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ro = new ResizeObserver(() => updateLayout());
    if (rootRef.current) ro.observe(rootRef.current);
    window.addEventListener('resize', updateLayout);
    updateLayout();
    if (options.autoplay) startAutoplay();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateLayout);
      stopAutoplay();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      disconnectImpressionObserver();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // click analytics helper to call external callback passed by consumer
  function handleSlideClick(e, idx, callback) {
    const el = e.currentTarget;
    const id = el.dataset.slideId || undefined;
    const meta = el.dataset.slideMeta ? JSON.parse(el.dataset.slideMeta) : undefined;
    if (typeof callback === 'function') {
      try { callback({ index: idx, id, meta }); } catch (err) {}
    }
  }

  return {
    rootRef,
    wrapRef,
    collectSlides,
    perView,
    tick,
    goTo,
    next,
    prev,
    startAutoplay,
    stopAutoplay,
    onPointerDown,
    handleSlideClick,
  };
}
