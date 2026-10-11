import React from 'react';
import { SITE_BRAND } from '../../config/siteContent';

interface DrThreeDLogoProps {
  size?: number;
  showWordmark?: boolean;
  showVersion?: boolean;
  className?: string;
  customLogoUrl?: string; // If user provides an image URL in the future
}

/**
 * Replaceable DrThreeD Logo Component
 * 
 * To replace the logo:
 * 1. You can pass a `customLogoUrl` prop pointing to your logo image, OR
 * 2. Replace the SVG below with your custom brand SVG.
 */
export const DrThreeDLogo: React.FC<DrThreeDLogoProps> = ({
  size = 28,
  showWordmark = true,
  showVersion = false,
  className = '',
  customLogoUrl,
}) => {
  return (
    <div className={`drthreed-logo-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      {customLogoUrl ? (
        <img
          src={customLogoUrl}
          alt={SITE_BRAND.name}
          style={{ width: size, height: size, objectFit: 'contain' }}
        />
      ) : (
        /* Default Art-Directed DrThreeD Geometric 3D Spatial Glyph */
        <div
          className="logo-mark"
          style={{
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Hexagonal 3D Isometric Cube Projection */}
            <path
              d="M16 2L29 9.5V22.5L16 30L3 22.5V9.5L16 2Z"
              stroke="var(--accent-cyan)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Top Plane */}
            <path
              d="M16 2L29 9.5L16 17L3 9.5L16 2Z"
              fill="var(--accent-cyan)"
              fillOpacity="0.12"
            />
            {/* Internal 3D Edges */}
            <path
              d="M16 17V30"
              stroke="var(--accent-cyan)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M3 9.5L16 17L29 9.5"
              stroke="var(--accent-cyan)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Central Spatial Focal Node */}
            <circle cx="16" cy="17" r="2.2" fill="#00f0ff" />
            <circle cx="16" cy="2" r="1.5" fill="var(--accent-emerald)" />
            <circle cx="29" cy="9.5" r="1.5" fill="var(--accent-cyan)" />
            <circle cx="3" cy="9.5" r="1.5" fill="var(--accent-cyan)" />
          </svg>
        </div>
      )}

      {showWordmark && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span className="brand-wordmark">
            {SITE_BRAND.wordmark}
          </span>
          {showVersion && (
            <span className="brand-version-badge">
              {SITE_BRAND.releaseTag}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
