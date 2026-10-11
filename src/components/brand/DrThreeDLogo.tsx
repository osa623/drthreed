import React from 'react';
import logoPng from './DrThreeDLogo.png';
import { Scale } from 'lucide-react';

export interface DrThreeDLogoProps {
  size?: number;
  showWordmark?: boolean;
  showVersion?: boolean;
  className?: string;
  marginTop?: number;
  scale?: number;
}

export const DrThreeDLogo: React.FC<DrThreeDLogoProps> = ({
  size = 36,
  showWordmark = true,
  showVersion = false,
  className = '',
  marginTop = 0,
  scale,
}) => {
  return (
    <div
      className={`drthreed-brand-wrap ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        userSelect: 'none',
        verticalAlign: 'middle',
      }}
    >
      <img
        src={logoPng}
        alt="DrThreeD Logo"
        style={{
          width: size,
          height: size,
          marginTop: marginTop,
          scale: scale || 1,
          objectFit: 'contain',
          borderRadius: Math.round(size * 0.100),
          filter: 'drop-shadow(0 2px 8px rgba(0, 240, 255, 0.22))',
          display: 'block',
          flexShrink: 0,
        }}
      />
      {showWordmark && (
        <span
          className="brand-wordmark"
          style={{
            fontWeight: 700,
            fontSize: Math.max(15, Math.round(size * 0.5)),
            letterSpacing: '-0.4px',
            color: 'var(--text-main)',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>DrThreeD</span>
          {showVersion && (
            <span
              className="brand-version-badge"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '9999px',
                backgroundColor: 'var(--accent-cyan-dim)',
                color: 'var(--accent-cyan)',
                border: '1px solid var(--border-subtle)',
                fontWeight: 600,
              }}
            >
              v1.0
            </span>
          )}
        </span>
      )}
    </div>
  );
};

export default DrThreeDLogo;
