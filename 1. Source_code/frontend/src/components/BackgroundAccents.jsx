import React from 'react';

export function BackgroundAccents() {
  return (
    <div className="bg-accents-container" aria-hidden="true">
      {/* Decorative circuit connector lines */}
      <svg className="bg-circuit-lines" width="100%" height="100%" preserveAspectRatio="none">
        {/* Trace 1: Top-left to Mid-left */}
        <path
          d="M 38 125 L 38 270 L 18 270 L 18 395"
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="1"
          strokeDasharray="4 3"
          opacity="0.25"
        />
        <circle cx="38" cy="125" r="3" fill="var(--text-muted)" opacity="0.4" />
        <circle cx="18" cy="395" r="3" fill="var(--text-muted)" opacity="0.4" />

        {/* Trace 2: Top-right to Mid-right */}
        <path
          d="M calc(100% - 38px) 145 L calc(100% - 38px) 290 L calc(100% - 18px) 290 L calc(100% - 18px) 435"
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="1"
          strokeDasharray="4 3"
          opacity="0.25"
        />

        {/* Trace 3: Mid-right to Bottom-right */}
        <path
          d="M calc(100% - 24px) 475 L calc(100% - 24px) 610 L calc(100% - 40px) 610 L calc(100% - 40px) 715"
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="1"
          opacity="0.25"
        />
      </svg>

      {/* 1. Plug (Top Left) */}
      <div className="bg-icon-tile bg-tile-tl" title="Decorative Plug Accent">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22v-5" />
          <path d="M9 8V2" />
          <path d="M15 8V2" />
          <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z" />
        </svg>
      </div>

      {/* 2. Shield (Top Right) */}
      <div className="bg-icon-tile bg-tile-tr" title="Decorative Shield Accent">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
        </svg>
      </div>

      {/* 3. Search/Crosshair (Mid Left) */}
      <div className="bg-icon-tile bg-tile-ml" title="Decorative Crosshair Accent">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="7" />
          <line x1="12" y1="2" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="2" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="22" y2="12" />
        </svg>
      </div>

      {/* 4. Cloud (Mid Right) */}
      <div className="bg-icon-tile bg-tile-mr" title="Decorative Cloud Accent">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
      </div>

      {/* 5. Chat-Bubble (Bottom Left) */}
      <div className="bg-icon-tile bg-tile-bl" title="Decorative Chat Accent">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
      </div>

      {/* 6. Circuit Node (Bottom Right) */}
      <div className="bg-icon-tile bg-tile-br" title="Decorative Circuit Accent">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="8" width="8" height="8" rx="1.5" />
          <line x1="12" y1="2" x2="12" y2="8" />
          <line x1="12" y1="16" x2="12" y2="22" />
          <line x1="2" y1="12" x2="8" y2="12" />
          <line x1="16" y1="12" x2="22" y2="12" />
        </svg>
      </div>
    </div>
  );
}

export default BackgroundAccents;
