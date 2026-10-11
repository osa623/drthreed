import React from 'react';

interface ShowcaseVisualProps {
  id: string;
  accentColor: string;
}

export const ShowcaseVisual: React.FC<ShowcaseVisualProps> = ({ id, accentColor }) => {
  switch (id) {
    case 'terrain-exploration':
      return (
        <svg width="100%" height="100%" viewBox="0 0 360 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="terrainGrad" x1="0" y1="0" x2="360" y2="220" gradientUnits="userSpaceOnUse">
              <stop stopColor={accentColor} stopOpacity="0.25" />
              <stop offset="1" stopColor="var(--accent-cyan)" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {/* Topographic Contour Curves */}
          <path d="M-20 180 C 80 140, 160 200, 240 160 C 300 130, 360 170, 400 160 L 400 240 L -20 240 Z" fill="url(#terrainGrad)" />
          <path d="M-20 150 C 90 100, 150 160, 230 120 C 310 80, 360 140, 400 120" stroke={accentColor} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
          <path d="M-20 120 C 70 80, 140 130, 220 90 C 290 60, 350 110, 400 90" stroke={accentColor} strokeWidth="1.8" />
          <path d="M-20 90 C 80 40, 150 90, 210 60 C 280 30, 340 70, 400 60" stroke={accentColor} strokeWidth="2" opacity="0.8" />
          {/* 3D Wireframe Elevation Peaks */}
          <polygon points="180,40 260,110 100,110" stroke={accentColor} strokeWidth="1.5" fill={accentColor} fillOpacity="0.08" />
          <polygon points="180,40 210,110 100,110" stroke={accentColor} strokeWidth="1" fill={accentColor} fillOpacity="0.14" />
          <polygon points="260,70 330,130 190,130" stroke={accentColor} strokeWidth="1.2" fill={accentColor} fillOpacity="0.06" />
          {/* Elevation Markers */}
          <circle cx="180" cy="40" r="3" fill={accentColor} />
          <text x="190" y="44" fill={accentColor} fontSize="10" fontFamily="var(--font-mono)">+142.5m (Peak)</text>
          <text x="50" y="195" fill="var(--text-dim)" fontSize="9" fontFamily="var(--font-mono)">SLOPE: 28.4° NORMAL</text>
        </svg>
      );

    case 'architectural-inspection':
      return (
        <svg width="100%" height="100%" viewBox="0 0 360 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Isometric Structural Module */}
          <g transform="translate(180, 110)">
            {/* Base Grid */}
            <path d="M-120 0 L0 60 L120 0 L0 -60 Z" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M-80 0 L0 40 L80 0 L0 -40 Z" stroke="var(--border-subtle)" strokeWidth="1" />
            {/* Main Building Volume */}
            <path d="M-60 -20 L0 10 L60 -20 L0 -50 Z" stroke={accentColor} strokeWidth="1.5" fill={accentColor} fillOpacity="0.15" />
            <path d="M-60 -20 L-60 30 L0 60 L0 10 Z" stroke={accentColor} strokeWidth="1.5" fill={accentColor} fillOpacity="0.08" />
            <path d="M60 -20 L60 30 L0 60 L0 10 Z" stroke={accentColor} strokeWidth="1.5" fill={accentColor} fillOpacity="0.12" />
            {/* Doorway Threshold & Clearance Arrow */}
            <path d="M-20 20 L-20 45 L0 55 L0 30 Z" stroke="#00e699" strokeWidth="1.2" fill="#00e699" fillOpacity="0.25" />
            <line x1="-35" y1="50" x2="-22" y2="44" stroke="#00e699" strokeWidth="1.2" />
            <text x="-95" y="58" fill="#00e699" fontSize="9" fontFamily="var(--font-mono)">CLEARANCE 2.4m</text>
            {/* Dimension Bounding Box */}
            <path d="M-75 -35 L0 -72 L75 -35 L75 45 L0 82 L-75 45 Z" stroke="var(--accent-cyan)" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
          </g>
        </svg>
      );

    case 'mars-habitat':
      return (
        <svg width="100%" height="100%" viewBox="0 0 360 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Crater Background */}
          <ellipse cx="180" cy="150" rx="140" ry="45" stroke="#ff9900" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
          {/* Geodesic Dome */}
          <path d="M110 140 C 110 90, 140 60, 180 60 C 220 60, 250 90, 250 140 Z" fill={accentColor} fillOpacity="0.12" stroke={accentColor} strokeWidth="1.8" />
          {/* Geodesic Struts */}
          <line x1="180" y1="60" x2="180" y2="140" stroke={accentColor} strokeWidth="1" opacity="0.5" />
          <line x1="145" y1="75" x2="145" y2="140" stroke={accentColor} strokeWidth="1" opacity="0.5" />
          <line x1="215" y1="75" x2="215" y2="140" stroke={accentColor} strokeWidth="1" opacity="0.5" />
          <path d="M120 115 Q 180 100 240 115" stroke={accentColor} strokeWidth="1" opacity="0.6" />
          {/* Airlock Tunnel */}
          <rect x="245" y="115" width="40" height="25" rx="3" fill={accentColor} fillOpacity="0.2" stroke={accentColor} strokeWidth="1.5" />
          {/* Dish Antenna */}
          <path d="M90 105 Q 105 90 120 105" stroke="var(--accent-cyan)" strokeWidth="2" />
          <line x1="105" y1="98" x2="105" y2="125" stroke="var(--accent-cyan)" strokeWidth="1.5" />
          {/* Solar Panel Array */}
          <polygon points="40,140 75,130 85,150 50,160" stroke="#00f0ff" strokeWidth="1.2" fill="#00f0ff" fillOpacity="0.15" />
          <polygon points="60,145 95,135 105,155 70,165" stroke="#00f0ff" strokeWidth="1.2" fill="#00f0ff" fillOpacity="0.15" />
          <text x="135" y="175" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">HAB_OUTPOST_ALPHA // 0.38G</text>
        </svg>
      );

    case 'scene-hierarchy':
      return (
        <svg width="100%" height="100%" viewBox="0 0 360 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Node Tree Diagram */}
          <g transform="translate(30, 30)">
            {/* Root Node */}
            <rect x="0" y="0" width="130" height="26" rx="4" fill="var(--accent-cyan-dim)" stroke="var(--accent-cyan)" strokeWidth="1.2" />
            <text x="12" y="17" fill="var(--accent-cyan)" fontSize="10" fontFamily="var(--font-mono)" fontWeight="600">Root_Scene [3D]</text>
            {/* Branches */}
            <path d="M20 26 L20 60 L40 60" stroke="var(--border-strong)" strokeWidth="1.5" />
            <path d="M20 60 L20 105 L40 105" stroke="var(--border-strong)" strokeWidth="1.5" />
            <path d="M20 105 L20 150 L40 150" stroke="var(--border-strong)" strokeWidth="1.5" />
            {/* Child Node 1: Terrain */}
            <rect x="40" y="47" width="160" height="26" rx="4" fill="rgba(0, 230, 153, 0.12)" stroke="#00e699" strokeWidth="1" />
            <text x="52" y="64" fill="#00e699" fontSize="10" fontFamily="var(--font-mono)">Terrain_Basin [Mesh]</text>
            {/* Child Node 2: Hab Dome */}
            <rect x="40" y="92" width="180" height="26" rx="4" fill="rgba(167, 139, 250, 0.12)" stroke="#a78bfa" strokeWidth="1" />
            <text x="52" y="109" fill="#a78bfa" fontSize="10" fontFamily="var(--font-mono)">Hab_Dome [Building: 98%]</text>
            {/* Child Node 3: Interior */}
            <rect x="40" y="137" width="170" height="26" rx="4" fill="rgba(255, 153, 0, 0.12)" stroke="#ffaa00" strokeWidth="1" />
            <text x="52" y="154" fill="#ffaa00" fontSize="10" fontFamily="var(--font-mono)">Console_Main [Equipment]</text>
            {/* Metadata Chips on right */}
            <g transform="translate(230, 48)">
              <rect x="0" y="0" width="75" height="18" rx="3" fill="var(--bg-control)" stroke="var(--border-subtle)" strokeWidth="1" />
              <text x="8" y="12" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">4,120 TRIS</text>
              <rect x="0" y="45" width="75" height="18" rx="3" fill="var(--bg-control)" stroke="var(--border-subtle)" strokeWidth="1" />
              <text x="8" y="57" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">COLLIDER: ON</text>
            </g>
          </g>
        </svg>
      );

    case 'lighting-hdri':
      return (
        <svg width="100%" height="100%" viewBox="0 0 360 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Celestial Sphere & Solar Rays */}
          <circle cx="180" cy="110" r="70" stroke={accentColor} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
          <ellipse cx="180" cy="110" rx="70" ry="25" stroke={accentColor} strokeWidth="1" opacity="0.3" />
          {/* Shaded Material Sphere */}
          <circle cx="180" cy="110" r="42" fill="url(#hdriSphereGrad)" stroke={accentColor} strokeWidth="1.5" />
          <defs>
            <radialGradient id="hdriSphereGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor={accentColor} />
              <stop offset="70%" stopColor="#0f2027" />
              <stop offset="100%" stopColor="#05070a" />
            </radialGradient>
          </defs>
          {/* Sun Directional Vector Indicator */}
          <line x1="180" y1="110" x2="250" y2="45" stroke="#ffaa00" strokeWidth="2.5" />
          <circle cx="250" cy="45" r="7" fill="#ffaa00" />
          <circle cx="250" cy="45" r="14" stroke="#ffaa00" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
          <text x="220" y="30" fill="#ffaa00" fontSize="9" fontFamily="var(--font-mono)">SUN: ELEV 42° / AZ 135°</text>
          <text x="35" y="195" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">RGBE 32-BIT RADIANCE MAP // PMREM</text>
        </svg>
      );

    case 'physics-traversal':
    default:
      return (
        <svg width="100%" height="100%" viewBox="0 0 360 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ground Surface with Slope */}
          <path d="M20 170 L140 170 L240 110 L340 110" stroke="var(--accent-emerald)" strokeWidth="2.5" />
          <polygon points="20,170 140,170 240,110 340,110 340,210 20,210" fill="rgba(0, 230, 153, 0.08)" />
          {/* Autostep Step Indicator */}
          <path d="M130 170 L140 170 L140 162" stroke="#ffaa00" strokeWidth="1.5" />
          <text x="80" y="160" fill="#ffaa00" fontSize="8" fontFamily="var(--font-mono)">AUTOSTEP 0.35m</text>
          {/* Player Capsule Collider */}
          <g transform="translate(180, 100)">
            <rect x="-10" y="-35" width="20" height="40" rx="10" stroke="var(--accent-cyan)" strokeWidth="2" fill="var(--accent-cyan-dim)" />
            {/* Eye Line / Forward Vector */}
            <circle cx="0" cy="-25" r="2.5" fill="#ffffff" />
            <line x1="0" y1="-25" x2="25" y2="-25" stroke="#ffffff" strokeWidth="1.5" />
            <polygon points="25,-25 20,-28 20,-22" fill="#ffffff" />
          </g>
          {/* Velocity Vector & Slope Normal */}
          <line x1="180" y1="125" x2="200" y2="85" stroke="var(--accent-emerald)" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="200" y="80" fill="var(--accent-emerald)" fontSize="9" fontFamily="var(--font-mono)">NORMAL (31.0°)</text>
          <text x="35" y="45" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">RAPIER 3D WASM KINEMATICS</text>
        </svg>
      );
  }
};
