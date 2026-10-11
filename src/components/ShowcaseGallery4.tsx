import React from 'react';

export const ShowcaseGallery4: React.FC = () => {
  const cards = [
    {
      id: 'terrain',
      title: 'Terrain & Topography',
      subtitle: 'Crater basin elevation & slope gradients',
      themeColor: '#e63946', // Vibrant crimson / Martian red
      svg: (
        <svg width="100%" height="100%" viewBox="0 0 300 420" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="300" y2="420" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2b0a0d" />
              <stop offset="0.4" stopColor="#7a141d" />
              <stop offset="0.8" stopColor="#d90429" />
              <stop offset="1" stopColor="#ff4d6d" />
            </linearGradient>
            <radialGradient id="r1" cx="40%" cy="30%" r="60%">
              <stop stopColor="#ff758f" stopOpacity="0.8" />
              <stop offset="1" stopColor="#590d22" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="300" height="420" rx="20" fill="url(#g1)" />
          <circle cx="120" cy="130" r="140" fill="url(#r1)" />
          {/* Topographic elevation wireframe lines */}
          <path d="M-20 220 C 60 180, 140 240, 220 200 C 260 180, 320 210, 340 200" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" />
          <path d="M-20 260 C 80 210, 160 280, 240 230 C 280 200, 320 240, 340 230" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.7" />
          <path d="M-20 300 C 50 250, 150 310, 230 260 C 270 230, 320 270, 340 260" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.9" />
          {/* 3D wireframe mountain peaks */}
          <polygon points="150,90 230,220 70,220" stroke="#ffffff" strokeWidth="2" fill="#ffffff" fillOpacity="0.12" />
          <polygon points="150,90 190,220 70,220" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.18" />
          <polygon points="230,130 290,240 170,240" stroke="#ffffff" strokeWidth="1.5" fill="#ffffff" fillOpacity="0.1" />
          {/* Elevation metadata tag */}
          <rect x="24" y="32" width="110" height="24" rx="12" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.2)" />
          <text x="36" y="48" fill="#ffffff" fontSize="10" fontFamily="var(--font-mono)" fontWeight="600">ELEV: +142.5m</text>
        </svg>
      ),
    },
    {
      id: 'architecture',
      title: 'Architectural Scale',
      subtitle: 'Modular enclosures & structural clearance',
      themeColor: '#457b9d', // Clean cool slate / neutral
      svg: (
        <svg width="100%" height="100%" viewBox="0 0 300 420" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g2" x1="0" y1="0" x2="300" y2="420" gradientUnits="userSpaceOnUse">
              <stop stopColor="#e2e8f0" />
              <stop offset="0.5" stopColor="#cbd5e1" />
              <stop offset="1" stopColor="#94a3b8" />
            </linearGradient>
            <radialGradient id="r2" cx="60%" cy="40%" r="50%">
              <stop stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="1" stopColor="#64748b" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="300" height="420" rx="20" fill="url(#g2)" />
          <circle cx="180" cy="160" r="130" fill="url(#r2)" />
          {/* Isometric Architectural Structure */}
          <g transform="translate(150, 210)">
            {/* Ground grid */}
            <path d="M-110 0 L0 55 L110 0 L0 -55 Z" stroke="#334155" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
            {/* Main structural volume */}
            <path d="M-60 -30 L0 0 L60 -30 L0 -60 Z" stroke="#0f172a" strokeWidth="2.5" fill="#f8fafc" fillOpacity="0.7" />
            <path d="M-60 -30 L-60 40 L0 70 L0 0 Z" stroke="#0f172a" strokeWidth="2.5" fill="#334155" fillOpacity="0.2" />
            <path d="M60 -30 L60 40 L0 70 L0 0 Z" stroke="#0f172a" strokeWidth="2.5" fill="#0f172a" fillOpacity="0.4" />
            {/* Interior doorway clearance */}
            <path d="M-25 12 L-25 45 L0 58 L0 25 Z" stroke="#00f0ff" strokeWidth="2" fill="#00f0ff" fillOpacity="0.3" />
            <line x1="-40" y1="52" x2="-28" y2="46" stroke="#00f0ff" strokeWidth="1.5" />
          </g>
          <rect x="24" y="32" width="124" height="24" rx="12" fill="rgba(15,23,42,0.75)" stroke="rgba(255,255,255,0.3)" />
          <text x="36" y="48" fill="#ffffff" fontSize="10" fontFamily="var(--font-mono)" fontWeight="600">AREA: 412.0 m²</text>
        </svg>
      ),
    },
    {
      id: 'habitat',
      title: 'Habitat Engineering',
      subtitle: 'Pressurized dome modules & systems',
      themeColor: '#e0a96d', // Warm amber / golden yellow
      svg: (
        <svg width="100%" height="100%" viewBox="0 0 300 420" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g3" x1="0" y1="0" x2="300" y2="420" gradientUnits="userSpaceOnUse">
              <stop stopColor="#78350f" />
              <stop offset="0.4" stopColor="#b45309" />
              <stop offset="0.8" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#fde68a" />
            </linearGradient>
            <radialGradient id="r3" cx="50%" cy="35%" r="65%">
              <stop stopColor="#fef3c7" stopOpacity="0.9" />
              <stop offset="1" stopColor="#92400e" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="300" height="420" rx="20" fill="url(#g3)" />
          <circle cx="150" cy="150" r="130" fill="url(#r3)" />
          {/* Geodesic Dome Silhouette & Struts */}
          <path d="M60 270 C 60 170, 110 110, 150 110 C 190 110, 240 170, 240 270 Z" fill="#ffffff" fillOpacity="0.25" stroke="#ffffff" strokeWidth="2.5" />
          <line x1="150" y1="110" x2="150" y2="270" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.7" />
          <line x1="105" y1="135" x2="105" y2="270" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.7" />
          <line x1="195" y1="135" x2="195" y2="270" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.7" />
          <path d="M75 220 Q 150 190 225 220" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.8" fill="none" />
          {/* Satellite Dish Array */}
          <path d="M40 230 Q 55 210 70 230" stroke="#ffffff" strokeWidth="2.5" fill="none" />
          <line x1="55" y1="220" x2="55" y2="260" stroke="#ffffff" strokeWidth="2" />
          <rect x="24" y="32" width="120" height="24" rx="12" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.2)" />
          <text x="36" y="48" fill="#ffffff" fontSize="10" fontFamily="var(--font-mono)" fontWeight="600">ALPHA OUTPOST</text>
        </svg>
      ),
    },
    {
      id: 'physics',
      title: 'Physics & Kinematics',
      subtitle: 'Rapier 3D colliders & autostep simulation',
      themeColor: '#ffb703', // Rich warm golden glow
      svg: (
        <svg width="100%" height="100%" viewBox="0 0 300 420" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g4" x1="0" y1="0" x2="300" y2="420" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9a3412" />
              <stop offset="0.4" stopColor="#ea580c" />
              <stop offset="0.8" stopColor="#fb923c" />
              <stop offset="1" stopColor="#fed7aa" />
            </linearGradient>
            <radialGradient id="r4" cx="50%" cy="30%" r="60%">
              <stop stopColor="#ffedd5" stopOpacity="0.9" />
              <stop offset="1" stopColor="#7c2d12" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="300" height="420" rx="20" fill="url(#g4)" />
          <circle cx="150" cy="130" r="130" fill="url(#r4)" />
          {/* Ground Slope & Step Line */}
          <path d="M20 310 L110 310 L200 220 L280 220" stroke="#ffffff" strokeWidth="3.5" />
          <polygon points="20,310 110,310 200,220 280,220 280,380 20,380" fill="rgba(255,255,255,0.15)" />
          {/* Kinematic Player Capsule */}
          <g transform="translate(150, 200)">
            <rect x="-16" y="-55" width="32" height="60" rx="16" stroke="#ffffff" strokeWidth="2.5" fill="#ffffff" fillOpacity="0.3" />
            <circle cx="0" cy="-40" r="4" fill="#ffffff" />
            <line x1="0" y1="-40" x2="28" y2="-40" stroke="#ffffff" strokeWidth="2" />
            <polygon points="28,-40 22,-44 22,-36" fill="#ffffff" />
          </g>
          {/* Normal vector */}
          <line x1="150" y1="240" x2="180" y2="175" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3" />
          <rect x="24" y="32" width="130" height="24" rx="12" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.2)" />
          <text x="36" y="48" fill="#ffffff" fontSize="10" fontFamily="var(--font-mono)" fontWeight="600">SLOPE LIMIT: 42°</text>
        </svg>
      ),
    },
  ];

  return (
    <div className="reference-gallery-row">
      {cards.map((card) => (
        <div key={card.id} className="reference-gallery-card">
          <div className="reference-gallery-media">
            {card.svg}
          </div>
          <div className="reference-gallery-overlay">
            <h4 className="reference-gallery-title">{card.title}</h4>
            <p className="reference-gallery-subtitle">{card.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
