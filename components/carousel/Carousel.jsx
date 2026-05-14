'use client';

import React, { forwardRef, useEffect } from 'react';
import useCarousel from './useCarousel';

export function CarouselSlide({ children, id, meta, className, style, onClick }) {
  return (
    <div
      className={`carousel-slide ${className || ''}`}
      data-slide-id={id || ''}
      data-slide-meta={meta ? JSON.stringify(meta) : undefined}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}

const Carousel = forwardRef(({ options = {}, children, onBannerClick, className }, ref) => {
  const {
    rootRef, wrapRef, collectSlides, perView, tick,
    goTo, next, prev, startAutoplay, stopAutoplay, onPointerDown, handleSlideClick,
  } = useCarousel(options);

  // collect slide nodes after first render (children)
  useEffect(() => {
    collectSlides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  const visiblePages = React.Children.count(children) > 0 ? Math.max(1, React.Children.count(children) - perView + 1) : 0;

  return (
    <div ref={rootRef} className={`carousel-root ${className || ''}`} style={{ position: 'relative', overflow: 'hidden' }} tabIndex={0} aria-roledescription="carousel">
      <div
        ref={wrapRef}
        className="carousel-slides-wrap"
        style={{ display: 'flex', gap: `${options.gap}px`, transition: `transform ${options.transitionMs}ms ease`, willChange: 'transform', touchAction: 'pan-y' }}
        onPointerDown={onPointerDown}
      >
        {React.Children.map(children, (child, idx) => {
          if (!React.isValidElement(child)) return null;
          const id = child.props.id;
          const meta = child.props.meta;
          return React.cloneElement(child, {
            onClick: (e) => {
              if (child.props.onClick) child.props.onClick(e);
              handleSlideClick(e, idx, onBannerClick);
            },
            'data-slide-id': id || '',
            'data-slide-meta': meta ? JSON.stringify(meta) : undefined,
            style: Object.assign({ cursor: onBannerClick ? 'pointer' : undefined }, child.props.style || {}),
          });
        })}
      </div>

      {/* controls */}
      <button aria-label="Previous" className="carousel-prev" onClick={() => { prev(); startAutoplay(); }} style={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', zIndex: 4 }}>‹</button>
      <button aria-label="Next" className="carousel-next" onClick={() => { next(); startAutoplay(); }} style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', zIndex: 4 }}>›</button>

      {/* dots */}
      <div className="carousel-dots" style={{ textAlign: 'center', paddingTop: 8 }}>
        {Array.from({ length: visiblePages }).map((_, i) => (
          <button key={i} onClick={() => { goTo(i); startAutoplay(); }} style={{ width: 10, height: 10, borderRadius: '50%', margin: '0 4px', background: '#ccc', border: 0 }} />
        ))}
      </div>
    </div>
  );
});

Carousel.displayName = 'Carousel';
export default Carousel;
