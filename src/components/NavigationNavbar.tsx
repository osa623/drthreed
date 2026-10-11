import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye,
  Footprints,
  Sun,
  Layers,
  Upload,
  Sparkles,
  Home,
  CheckCircle2,
  HelpCircle,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { useEditorStore, editorStore } from '../state/editorStore';
import { DrThreeDLogo } from './brand/DrThreeDLogo';
import { ThemeToggle } from './ThemeToggle';

interface NavigationNavbarProps {
  onLoadSample: () => void;
  onOpenGlbPicker: () => void;
  onOpenHdrPicker: () => void;
  onOpenHelp: () => void;
}

export const NavigationNavbar: React.FC<NavigationNavbarProps> = ({
  onLoadSample,
  onOpenGlbPicker,
  onOpenHdrPicker,
  onOpenHelp,
}) => {
  const { loadedModelName, viewMode, showPhysicsDebug } = useEditorStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on ESC or resize
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleTogglePlay = () => {
    const nextMode = viewMode === 'orbit' ? 'first_person' : 'orbit';
    editorStore.setViewMode(nextMode);
  };

  const handleToggleFly = () => {
    const nextMode = viewMode === 'fly' ? 'orbit' : 'fly';
    editorStore.setViewMode(nextMode);
  };

  const handleTogglePhysicsDebug = () => {
    editorStore.setPhysicsDebug(!showPhysicsDebug);
  };

  return (
    <>
      <header className="inspector-nav-header">
        {/* Left: Brand, Home Link & Active Model Pill */}
        <div className="inspector-nav-left">
          <Link to="/" style={{ textDecoration: 'none' }} title="DrThreeD Platform">
            <DrThreeDLogo size={28} showWordmark={true} />
          </Link>

          <span className="nav-divider" />

          <Link to="/" className="inspector-home-link" title="Return to Homepage">
            <Home size={14} />
            <span className="nav-text-desktop">Home</span>
          </Link>

          {loadedModelName && (
            <div className="inspector-model-badge" title={`Active Model: ${loadedModelName}`}>
              <CheckCircle2 size={12} color="var(--accent-emerald)" />
              <span className="inspector-model-name">{loadedModelName}</span>
            </div>
          )}
        </div>

        {/* Center: Camera & Navigation Mode Selector (Responsive: full labels on desktop, short on tablet, icons on mobile) */}
        <div className="inspector-mode-selector" role="group" aria-label="Camera Navigation Modes">
          <button
            type="button"
            className={`mode-pill-btn ${viewMode === 'orbit' ? 'active' : ''}`}
            onClick={() => editorStore.setViewMode('orbit')}
            title="Orbit Camera: Rotate, Pan, Zoom"
            aria-pressed={viewMode === 'orbit'}
          >
            <Eye size={13} />
            <span className="mode-btn-full">Orbit Inspect</span>
            <span className="mode-btn-short">Orbit</span>
          </button>

          <button
            type="button"
            className={`mode-pill-btn ${viewMode === 'fly' ? 'active fly-active' : ''}`}
            onClick={handleToggleFly}
            title="Free-Fly: Float freely through scene with WASD & Mouse (Tab: Drop to ground)"
            aria-pressed={viewMode === 'fly'}
          >
            <Sparkles size={13} />
            <span className="mode-btn-full">Free-Fly</span>
            <span className="mode-btn-short">Fly</span>
          </button>

          <button
            type="button"
            className={`mode-pill-btn ${viewMode === 'first_person' ? 'active explore-active' : ''}`}
            onClick={handleTogglePlay}
            title="First-Person Exploration: WASD to walk, Space to jump, Rapier physics gravity"
            aria-pressed={viewMode === 'first_person'}
          >
            <Footprints size={13} />
            <span className="mode-btn-full">Explore (WASD)</span>
            <span className="mode-btn-short">Walk</span>
          </button>
        </div>

        {/* Right: Desktop Actions & Mobile Menu Button */}
        <div className="inspector-nav-right">
          {/* Desktop-only action buttons */}
          <button
            type="button"
            className="inspector-action-btn sample-btn"
            onClick={onLoadSample}
            title="Load Sample 3D Model preset scene"
          >
            <Sparkles size={13} color="var(--accent-amber)" />
            <span>Sample 3D Model</span>
          </button>

          <button
            type="button"
            className="inspector-action-btn"
            onClick={onOpenGlbPicker}
            title="Import custom 3D model (.glb, .gltf)"
          >
            <Upload size={13} />
            <span>Import GLB</span>
          </button>

          <button
            type="button"
            className="inspector-action-btn"
            onClick={onOpenHdrPicker}
            title="Import HDRI environment illumination (.hdr)"
          >
            <Sun size={13} />
            <span>Import HDR</span>
          </button>

          <button
            type="button"
            className={`inspector-action-btn ${showPhysicsDebug ? 'active-toggle' : ''}`}
            onClick={handleTogglePhysicsDebug}
            title="Toggle Rapier 3D physical collider wireframes"
          >
            <Layers size={13} />
            <span>Wireframe</span>
          </button>

          <span className="nav-divider nav-divider-desktop" />

          <button
            type="button"
            className="inspector-icon-btn nav-btn-desktop"
            onClick={onOpenHelp}
            title="Controls & Navigation Shortcuts (Shift + /)"
            aria-label="Controls and keyboard shortcuts"
          >
            <HelpCircle size={15} />
          </button>

          {/* Theme Toggle is always visible on PC and mobile */}
          <ThemeToggle />

          {/* Mobile Actions Drawer Button (Visible on mobile/tablet screens <= 860px) */}
          <button
            type="button"
            className="inspector-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle inspector tools menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay for Inspector Workspace */}
      {mobileMenuOpen && (
        <>
          <div
            className="inspector-mobile-drawer-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="inspector-mobile-drawer" role="dialog" aria-modal="true" aria-label="Inspector Tools">
            <div className="inspector-mobile-drawer-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={18} color="var(--accent-cyan)" />
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                  Inspector Actions
                </span>
              </div>
              <button
                type="button"
                className="inspector-icon-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            {loadedModelName && (
              <div style={{ marginBottom: '14px', padding: '10px 12px', background: 'var(--bg-control)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>CURRENT MODEL</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-all' }}>
                  {loadedModelName}
                </div>
              </div>
            )}

            <div className="inspector-mobile-section-title">SCENE ENVIRONMENTS & PRESETS</div>
            <button
              type="button"
              className="inspector-mobile-menu-item"
              onClick={() => {
                onLoadSample();
                setMobileMenuOpen(false);
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={16} color="var(--accent-amber)" />
                <span>Load Sample 3D Model Preset</span>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--accent-amber)' }}>Sample</span>
            </button>

            <button
              type="button"
              className="inspector-mobile-menu-item"
              onClick={() => {
                onOpenGlbPicker();
                setMobileMenuOpen(false);
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Upload size={16} color="var(--accent-cyan)" />
                <span>Import GLB / glTF Model</span>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>3D File</span>
            </button>

            <button
              type="button"
              className="inspector-mobile-menu-item"
              onClick={() => {
                onOpenHdrPicker();
                setMobileMenuOpen(false);
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sun size={16} color="var(--accent-amber)" />
                <span>Import HDR Skybox</span>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>RGBE</span>
            </button>

            <div className="inspector-mobile-section-title">VIEWPORT & SIMULATION</div>
            <button
              type="button"
              className="inspector-mobile-menu-item"
              onClick={() => {
                handleTogglePhysicsDebug();
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={16} color="var(--accent-cyan)" />
                <span>Physics Colliders Wireframe</span>
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: showPhysicsDebug ? 'var(--accent-cyan)' : 'var(--text-dim)',
              }}>
                {showPhysicsDebug ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              type="button"
              className="inspector-mobile-menu-item"
              onClick={() => {
                onOpenHelp();
                setMobileMenuOpen(false);
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HelpCircle size={16} color="var(--text-muted)" />
                <span>Controls & Keyboard Shortcuts</span>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Shift+/</span>
            </button>

            <div className="inspector-mobile-section-title" style={{ marginTop: 'auto' }}>NAVIGATION</div>
            <Link
              to="/"
              className="inspector-mobile-menu-item"
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Home size={16} />
                <span>Return to Homepage</span>
              </span>
            </Link>
          </aside>
        </>
      )}
    </>
  );
};
