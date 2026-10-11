import React from 'react';
import { Sun, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useEditorStore, editorStore } from '../state/editorStore';
import type { LightingManager } from '../engine/LightingManager';

interface LightingPanelProps {
  lightingManager: LightingManager | null;
  onOpenHdrPicker: () => void;
}

export const LightingPanel: React.FC<LightingPanelProps> = ({ lightingManager, onOpenHdrPicker }) => {
  const { lightingSettings } = useEditorStore();

  const updateLighting = <K extends keyof typeof lightingSettings>(
    key: K,
    val: (typeof lightingSettings)[K]
  ) => {
    editorStore.setState((prev) => ({
      lightingSettings: { ...prev.lightingSettings, [key]: val },
    }));
  };

  const handleClearHdr = () => {
    if (lightingManager) {
      lightingManager.clearEnvironment();
      updateLighting('hdrName', undefined);
      updateLighting('hdrUrl', undefined);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Directional Sun & Ambient Lighting */}
      <div className="panel-section">
        <div className="section-header">
          <span>Directional Solar Light</span>
          <Sun size={14} color="#ffaa00" />
        </div>

        <div className="form-group">
          <div className="form-label">
            <span>SUN INTENSITY</span>
            <span className="num-display">{lightingSettings.sunIntensity.toFixed(1)}</span>
          </div>
          <div className="form-control-row">
            <input
              type="range"
              min="0"
              max="5.0"
              step="0.1"
              value={lightingSettings.sunIntensity}
              onChange={(e) => updateLighting('sunIntensity', parseFloat(e.target.value))}
              className="slider-input"
            />
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">
            <span>SUN ELEVATION</span>
            <span className="num-display">{lightingSettings.sunElevation}°</span>
          </div>
          <div className="form-control-row">
            <input
              type="range"
              min="5"
              max="85"
              step="1"
              value={lightingSettings.sunElevation}
              onChange={(e) => updateLighting('sunElevation', parseInt(e.target.value, 10))}
              className="slider-input"
            />
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">
            <span>SUN AZIMUTH</span>
            <span className="num-display">{lightingSettings.sunAzimuth}°</span>
          </div>
          <div className="form-control-row">
            <input
              type="range"
              min="0"
              max="360"
              step="5"
              value={lightingSettings.sunAzimuth}
              onChange={(e) => updateLighting('sunAzimuth', parseInt(e.target.value, 10))}
              className="slider-input"
            />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '4px' }}>
          <div className="form-label">
            <span>EXPOSURE</span>
            <span className="num-display">{lightingSettings.exposure.toFixed(2)}</span>
          </div>
          <div className="form-control-row">
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.05"
              value={lightingSettings.exposure}
              onChange={(e) => updateLighting('exposure', parseFloat(e.target.value))}
              className="slider-input"
            />
          </div>
        </div>
      </div>

      {/* HDRI Environment */}
      <div className="panel-section">
        <div className="section-header">
          <span>HDRI Image-Based Lighting</span>
          <ImageIcon size={14} color="#00f0ff" />
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <button className="nav-btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onOpenHdrPicker}>
            <ImageIcon size={13} />
            <span>{lightingSettings.hdrName ? 'Replace HDRI' : 'Load .HDR File'}</span>
          </button>

          {lightingSettings.hdrName && (
            <button className="margin-btn" onClick={handleClearHdr} title="Clear HDRI">
              <Trash2 size={13} color="var(--accent-red)" />
            </button>
          )}
        </div>

        {lightingSettings.hdrName && (
          <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
            Active: {lightingSettings.hdrName}
          </div>
        )}

        <div className="form-group">
          <div className="form-label">
            <span>ENVIRONMENT INTENSITY</span>
            <span className="num-display">{lightingSettings.intensity.toFixed(1)}</span>
          </div>
          <div className="form-control-row">
            <input
              type="range"
              min="0"
              max="4.0"
              step="0.1"
              value={lightingSettings.intensity}
              onChange={(e) => updateLighting('intensity', parseFloat(e.target.value))}
              className="slider-input"
            />
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">
            <span>ROTATION</span>
            <span className="num-display">{lightingSettings.rotation}°</span>
          </div>
          <div className="form-control-row">
            <input
              type="range"
              min="0"
              max="360"
              step="5"
              value={lightingSettings.rotation}
              onChange={(e) => updateLighting('rotation', parseInt(e.target.value, 10))}
              className="slider-input"
            />
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '6px' }}>
          <input
            type="checkbox"
            checked={lightingSettings.showBackground}
            onChange={(e) => updateLighting('showBackground', e.target.checked)}
            style={{ width: '15px', height: '15px', accentColor: 'var(--accent-cyan)' }}
          />
          <span style={{ fontSize: '11px' }}>Render HDRI as Skybox Background</span>
        </label>
      </div>
    </div>
  );
};
