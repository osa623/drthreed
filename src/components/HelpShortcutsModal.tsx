import React from 'react';
import { X, Eye, Sparkles, Footprints, Keyboard } from 'lucide-react';

interface HelpShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpShortcutsModal: React.FC<HelpShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="help-modal-backdrop" onClick={onClose}>
      <div className="help-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="help-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Keyboard size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
              DrThreeD Navigation & Controls Guide
            </h3>
          </div>
          <button
            type="button"
            className="help-modal-close"
            onClick={onClose}
            aria-label="Close shortcuts guide"
          >
            <X size={18} />
          </button>
        </div>

        <div className="help-modal-content">
          {/* Orbit Inspect Mode */}
          <div className="help-mode-block">
            <div className="help-mode-title" style={{ color: 'var(--accent-cyan)' }}>
              <Eye size={15} />
              <span>Orbit Inspection Mode (Default)</span>
            </div>
            <div className="help-shortcut-row">
              <span className="help-key-chip">Left Click + Drag</span>
              <span className="help-action-desc">Orbit camera around target center</span>
            </div>
            <div className="help-shortcut-row">
              <span className="help-key-chip">Right Click + Drag</span>
              <span className="help-action-desc">Pan camera laterally across viewport</span>
            </div>
            <div className="help-shortcut-row">
              <span className="help-key-chip">Mouse Wheel / Pinch</span>
              <span className="help-action-desc">Zoom in / out towards target</span>
            </div>
            <div className="help-shortcut-row">
              <span className="help-key-chip">Click 3D Mesh</span>
              <span className="help-action-desc">Select object and inspect properties</span>
            </div>
          </div>

          {/* Blender Free-Fly Mode */}
          <div className="help-mode-block">
            <div className="help-mode-title" style={{ color: '#d166ff' }}>
              <Sparkles size={15} />
              <span>Blender Free-Fly Mode (No Gravity)</span>
            </div>
            <div className="help-shortcut-row">
              <span className="help-key-chip">Click Viewport</span>
              <span className="help-action-desc">Capture pointer to look around with mouse</span>
            </div>
            <div className="help-shortcut-row">
              <span className="help-key-chip">W / A / S / D</span>
              <span className="help-action-desc">Fly Forward / Left / Backward / Right</span>
            </div>
            <div className="help-shortcut-row">
              <span className="help-key-chip">E / Space</span>
              <span className="help-action-desc">Fly straight Up vertically</span>
            </div>
            <div className="help-shortcut-row">
              <span className="help-key-chip">Q / C</span>
              <span className="help-action-desc">Fly straight Down vertically</span>
            </div>
            <div className="help-shortcut-row">
              <span className="help-key-chip">Shift</span>
              <span className="help-action-desc">Sprint / 2x Speed boost</span>
            </div>
            <div className="help-shortcut-row">
              <span className="help-key-chip">Tab</span>
              <span className="help-action-desc">Drop to ground and activate Rapier gravity</span>
            </div>
            <div className="help-shortcut-row">
              <span className="help-key-chip">Esc</span>
              <span className="help-action-desc">Release mouse capture</span>
            </div>
          </div>

          {/* First-Person Exploration Mode */}
          <div className="help-mode-block">
            <div className="help-mode-title" style={{ color: 'var(--accent-emerald)' }}>
              <Footprints size={15} />
              <span>First-Person Exploration Mode (Physics Gravity)</span>
            </div>
            <div className="help-shortcut-row">
              <span className="help-key-chip">W / A / S / D</span>
              <span className="help-action-desc">Walk across terrain & structures</span>
            </div>
            <div className="help-shortcut-row">
              <span className="help-key-chip">Mouse</span>
              <span className="help-action-desc">Look around (pitch & yaw with stable horizon)</span>
            </div>
            <div className="help-shortcut-row">
              <span className="help-key-chip">Space</span>
              <span className="help-action-desc">Jump over obstacles</span>
            </div>
            <div className="help-shortcut-row">
              <span className="help-key-chip">Shift</span>
              <span className="help-action-desc">Sprint run</span>
            </div>
            <div className="help-shortcut-row">
              <span className="help-key-chip">Tab</span>
              <span className="help-action-desc">Switch back to Free-Fly mode</span>
            </div>
          </div>
        </div>

        <div className="help-modal-footer">
          <button type="button" className="btn-primary-pill" onClick={onClose} style={{ padding: '8px 24px', fontSize: '13px' }}>
            <span>Got It</span>
          </button>
        </div>
      </div>
    </div>
  );
};
