import React from 'react';

export const OrbitalArtwork: React.FC<{ size?: number; className?: string }> = ({
  size = 460,
  className = '',
}) => {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{
        position: 'relative',
        width: size,
        height: size,
        maxWidth: '100%',
        aspectRatio: '1 / 1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="hero-core-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E8F2FA" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#438A9A" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#24364B" stopOpacity="0" />
          </radialGradient>

          <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient celestial background halo */}
        <circle cx="250" cy="250" r="230" fill="url(#hero-core-gradient)" />

        {/* Outer Ring 1: Static Guide */}
        <circle
          cx="250"
          cy="250"
          r="210"
          stroke="#D8E1EA"
          strokeWidth="1"
          strokeDasharray="4 6"
          opacity="0.6"
        />

        {/* Animated Orbit 1: Wide Ellipse */}
        <g className="animate-orbit" style={{ transformOrigin: '250px 250px' }}>
          <ellipse
            cx="250"
            cy="250"
            rx="195"
            ry="90"
            stroke="#438A9A"
            strokeWidth="1.5"
            opacity="0.7"
            transform="rotate(-25 250 250)"
          />
          {/* Satellite Alpha */}
          <g transform="rotate(-25 250 250)">
            <circle cx="445" cy="250" r="7" fill="#24364B" />
            <circle cx="445" cy="250" r="4" fill="#E8F2FA" />
            <circle cx="445" cy="250" r="2" fill="#FFFFFF" />
          </g>
        </g>

        {/* Animated Orbit 2: Counter-rotating High Inclination */}
        <g className="animate-orbit-reverse" style={{ transformOrigin: '250px 250px' }}>
          <ellipse
            cx="250"
            cy="250"
            rx="160"
            ry="75"
            stroke="#A6CEE8"
            strokeWidth="1.8"
            strokeDasharray="6 4"
            opacity="0.85"
            transform="rotate(45 250 250)"
          />
          {/* Satellite Beta */}
          <g transform="rotate(45 250 250)">
            <circle cx="90" cy="250" r="6" fill="#438A9A" />
            <circle cx="90" cy="250" r="3" fill="#E8F2FA" />
          </g>
          <g transform="rotate(45 250 250)">
            <circle cx="410" cy="250" r="4.5" fill="#24364B" />
          </g>
        </g>

        {/* Third Orbit: Inner Trajectory */}
        <g className="animate-orbit" style={{ transformOrigin: '250px 250px', animationDuration: '28s' }}>
          <ellipse
            cx="250"
            cy="250"
            rx="115"
            ry="50"
            stroke="#24364B"
            strokeWidth="1.5"
            opacity="0.6"
            transform="rotate(-70 250 250)"
          />
          <g transform="rotate(-70 250 250)">
            <circle cx="365" cy="250" r="5" fill="#E8F2FA" />
            <circle cx="365" cy="250" r="2.5" fill="#438A9A" />
          </g>
        </g>

        {/* Core Stellar Nucleus */}
        <circle cx="250" cy="250" r="50" fill="#24364B" filter="url(#glow-filter)" />
        <circle cx="250" cy="250" r="44" fill="#24364B" />
        <circle cx="250" cy="250" r="32" fill="#438A9A" />
        <circle cx="250" cy="250" r="20" fill="#E8F2FA" />
        <circle cx="250" cy="250" r="10" fill="#FFFFFF" className="animate-pulse-gentle" />

        {/* Cardinal Grid / Coordinate Markers */}
        <line x1="250" y1="20" x2="250" y2="35" stroke="#438A9A" strokeWidth="1.5" />
        <line x1="250" y1="465" x2="250" y2="480" stroke="#438A9A" strokeWidth="1.5" />
        <line x1="20" y1="250" x2="35" y2="250" stroke="#438A9A" strokeWidth="1.5" />
        <line x1="465" y1="250" x2="480" y2="250" stroke="#438A9A" strokeWidth="1.5" />

        {/* Micro coordinate labels */}
        <text x="256" y="32" fill="#438A9A" fontSize="9" fontFamily="monospace" letterSpacing="1">
          ORB-01
        </text>
        <text x="430" y="244" fill="#438A9A" fontSize="9" fontFamily="monospace" letterSpacing="1">
          77°W
        </text>
      </svg>
    </div>
  );
};
