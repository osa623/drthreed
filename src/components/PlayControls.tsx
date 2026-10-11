import React from 'react';
import { Sliders, Activity, ShieldCheck } from 'lucide-react';
import { useEditorStore, editorStore } from '../state/editorStore';

export const PlayControls: React.FC = () => {
  const { playerSettings } = useEditorStore();

  const updateSetting = <K extends keyof typeof playerSettings>(key: K, val: (typeof playerSettings)[K]) => {
    editorStore.setState((prev) => ({
      playerSettings: { ...prev.playerSettings, [key]: val },
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Locomotion Dynamics */}
      <div className="panel-section">
        <div className="section-header">
          <span>First-Person Locomotion</span>
          <Sliders size={14} color="#00f0ff" />
        </div>

        <div className="form-group">
          <div className="form-label">
            <span>WALK SPEED</span>
            <span className="num-display">{playerSettings.walkSpeed.toFixed(1)} m/s</span>
          </div>
          <div className="form-control-row">
            <input
              type="range"
              min="1.5"
              max="7.0"
              step="0.1"
              value={playerSettings.walkSpeed}
              onChange={(e) => updateSetting('walkSpeed', parseFloat(e.target.value))}
              className="slider-input"
            />
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">
            <span>RUN SPRINT SPEED</span>
            <span className="num-display">{playerSettings.runSpeed.toFixed(1)} m/s</span>
          </div>
          <div className="form-control-row">
            <input
              type="range"
              min="4.0"
              max="14.0"
              step="0.2"
              value={playerSettings.runSpeed}
              onChange={(e) => updateSetting('runSpeed', parseFloat(e.target.value))}
              className="slider-input"
            />
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">
            <span>JUMP IMPULSE</span>
            <span className="num-display">{playerSettings.jumpForce.toFixed(1)} m/s</span>
          </div>
          <div className="form-control-row">
            <input
              type="range"
              min="2.0"
              max="9.0"
              step="0.2"
              value={playerSettings.jumpForce}
              onChange={(e) => updateSetting('jumpForce', parseFloat(e.target.value))}
              className="slider-input"
            />
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">
            <span>MOUSE SENSITIVITY</span>
            <span className="num-display">{(playerSettings.mouseSensitivity * 1000).toFixed(1)}</span>
          </div>
          <div className="form-control-row">
            <input
              type="range"
              min="0.0008"
              max="0.005"
              step="0.0002"
              value={playerSettings.mouseSensitivity}
              onChange={(e) => updateSetting('mouseSensitivity', parseFloat(e.target.value))}
              className="slider-input"
            />
          </div>
        </div>
      </div>

      {/* Motion Effects & Comfort Settings */}
      <div className="panel-section">
        <div className="section-header">
          <span>Camera Motion & Comfort</span>
          <Activity size={14} color="#00f0ff" />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={playerSettings.enableBreathing}
            onChange={(e) => updateSetting('enableBreathing', e.target.checked)}
            style={{ width: '15px', height: '15px', accentColor: 'var(--accent-cyan)' }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>Subtle Idle Breathing</div>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Low-frequency organic camera oscillation when standing still.</div>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '6px' }}>
          <input
            type="checkbox"
            checked={playerSettings.enableHeadBob}
            onChange={(e) => updateSetting('enableHeadBob', e.target.checked)}
            style={{ width: '15px', height: '15px', accentColor: 'var(--accent-cyan)' }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>Velocity-Driven Head Bob</div>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Cadence dynamically driven by actual physical movement speed.</div>
          </div>
        </label>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '4px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={playerSettings.reducedMotion}
              onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
              style={{ width: '15px', height: '15px', accentColor: 'var(--accent-emerald)' }}
            />
            <div>
              <div style={{ fontWeight: 600, color: playerSettings.reducedMotion ? 'var(--accent-emerald)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={13} /> Reduced Motion (Comfort Mode)
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Suppresses all head bobbing, breathing oscillations, and sudden camera dips.</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
