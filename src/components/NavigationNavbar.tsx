import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Eye,
  Footprints,
  Sun,
  Layers,
  Upload,
  Sparkles,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { useEditorStore, editorStore } from '../state/editorStore';

interface NavigationNavbarProps {
  onLoadSample: () => void;
  onOpenGlbPicker: () => void;
  onOpenHdrPicker: () => void;
}

export const NavigationNavbar: React.FC<NavigationNavbarProps> = ({
  onLoadSample,
  onOpenGlbPicker,
  onOpenHdrPicker,
}) => {
  const { loadedModelName, viewMode, showPhysicsDebug } = useEditorStore();

  const handleTogglePlay = () => {
    const nextMode = viewMode === 'orbit' ? 'first_person' : 'orbit';
    editorStore.setViewMode(nextMode);
  };

  const handleTogglePhysicsDebug = () => {
    editorStore.setPhysicsDebug(!showPhysicsDebug);
  };

  return (
    <header className="nav-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/" className="nav-brand">
          <Box size={18} color="#00f0ff" />
          <span>DrThreeD</span>
          <span className="nav-brand-badge">Inspector</span>
        </Link>

        <Link to="/" className="nav-btn" style={{ textDecoration: 'none' }}>
          <Home size={14} />
          <span>Home</span>
        </Link>

        {loadedModelName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--border-medium)' }}>/</span>
            <CheckCircle2 size={12} color="#00e699" />
            <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{loadedModelName}</span>
          </div>
        )}
      </div>

      <div className="nav-actions">
        <button className="nav-btn" onClick={onLoadSample} title="Load Mars Research Outpost test environment">
          <Sparkles size={14} color="#ff9900" />
          <span>Mars Outpost Sample</span>
        </button>

        <button className="nav-btn" onClick={onOpenGlbPicker} title="Import custom GLB or glTF">
          <Upload size={14} />
          <span>Import GLB</span>
        </button>

        <button className="nav-btn" onClick={onOpenHdrPicker} title="Import HDRI environment image">
          <Sun size={14} />
          <span>Import HDR</span>
        </button>

        <button
          className={`nav-btn ${showPhysicsDebug ? 'nav-btn-active' : ''}`}
          onClick={handleTogglePhysicsDebug}
          title="Toggle visual Rapier collider wireframes"
        >
          <Layers size={14} />
          <span>Colliders Wireframe</span>
        </button>

        <button
          className={`nav-btn ${viewMode === 'first_person' ? 'nav-btn-active' : 'nav-btn-primary'}`}
          onClick={handleTogglePlay}
          title={viewMode === 'orbit' ? 'Enter first-person exploration mode' : 'Exit back to inspection mode'}
        >
          {viewMode === 'orbit' ? (
            <>
              <Footprints size={14} />
              <span>Explore Mode (WASD)</span>
            </>
          ) : (
            <>
              <Eye size={14} />
              <span>Orbit Inspect (Esc)</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
