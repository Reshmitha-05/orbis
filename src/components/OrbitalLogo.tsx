import React from 'react';

interface OrbitalLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  showDescriptor?: boolean;
  inverse?: boolean;
  className?: string;
}

export const OrbitalLogo: React.FC<OrbitalLogoProps> = ({
  size = 'md',
  showWordmark = true,
  showDescriptor = false,
  inverse = false,
  className = '',
}) => {
  const iconSizes = {
    sm: 28,
    md: 40,
    lg: 56,
  };

  const dim = iconSizes[size];

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}
    >
      {/* Precise Orbital SVG Icon */}
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="ORBIS celestial icon"
        role="img"
        style={{ flexShrink: 0, overflow: 'visible' }}
      >
        <defs>
          <radialGradient id={`orbis-core-glow-${size}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E8F2FA" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#438A9A" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#24364B" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`orbis-ring-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#438A9A" />
            <stop offset="50%" stopColor="#E8F2FA" />
            <stop offset="100%" stopColor="#24364B" />
          </linearGradient>
        </defs>

        {/* Outer subtle glow */}
        <circle cx="24" cy="24" r="22" fill={`url(#orbis-core-glow-${size})`} opacity="0.35" />

        {/* Background shield/disc */}
        <circle cx="24" cy="24" r="20" fill={inverse ? '#1A2838' : '#24364B'} stroke={inverse ? 'rgba(232, 242, 250, 0.25)' : 'none'} strokeWidth="1" />

        {/* Primary Elliptical Orbit (Rotated -28 deg) */}
        <ellipse
          cx="24"
          cy="24"
          rx="17"
          ry="7.5"
          stroke="#E8F2FA"
          strokeWidth="1.5"
          strokeDasharray="2.5 2"
          transform="rotate(-28 24 24)"
          opacity="0.9"
        />

        {/* Secondary Cross-Trajectory Orbit (Rotated +42 deg) */}
        <ellipse
          cx="24"
          cy="24"
          rx="15"
          ry="6"
          stroke="#438A9A"
          strokeWidth="1.2"
          transform="rotate(42 24 24)"
          opacity="0.8"
        />

        {/* Central Core Stellar Body */}
        <circle cx="24" cy="24" r="5.5" fill="#E8F2FA" />
        <circle cx="24" cy="24" r="3.2" fill="#438A9A" />
        <circle cx="24" cy="24" r="1.5" fill="#FFFFFF" />

        {/* Orbiting Planetary Satellites */}
        {/* Planet on Primary Orbit */}
        <g transform="rotate(-28 24 24)">
          <circle cx="39" cy="24" r="2.8" fill="#E8F2FA" />
          <circle cx="39" cy="24" r="1.2" fill="#FFFFFF" />
        </g>

        {/* Secondary Satellite */}
        <g transform="rotate(42 24 24)">
          <circle cx="10" cy="24" r="2.2" fill="#438A9A" />
        </g>
      </svg>

      {/* Serif Wordmark & Descriptor */}
      {showWordmark && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <div
            style={{
              fontFamily: "var(--font-serif, 'Playfair Display', serif)",
              fontSize: size === 'sm' ? '1.2rem' : size === 'lg' ? '1.85rem' : '1.45rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: inverse ? '#FFFFFF' : '#24364B',
              textTransform: 'uppercase',
            }}
          >
            ORBIS
          </div>
          {showDescriptor && (
            <span
              style={{
                fontFamily: "var(--font-sans, 'Inter', sans-serif)",
                fontSize: size === 'sm' ? '0.55rem' : '0.6rem',
                fontWeight: 600,
                color: inverse ? '#E8F2FA' : '#438A9A',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginTop: '1px',
              }}
            >
              Repository Intelligence
            </span>
          )}
        </div>
      )}
    </div>
  );
};

