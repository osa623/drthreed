import React from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import { useEditorStore, editorStore } from '../state/editorStore';
import type { ColliderMode } from '../state/types';

interface ColliderSettingsPanelProps {
  onRebuildColliders: () => void;
}

export const ColliderSettingsPanel: React.FC<ColliderSettingsPanelProps> = ({ onRebuildColliders }) => {
  const { nodes, selectedNodeId } = useEditorStore();
  const selectedNode = selectedNodeId ? nodes.get(selectedNodeId) : null;

  if (!selectedNode) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
        <Shield size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
        <div>Select an object to configure its Rapier physics collision boundary.</div>
      </div>
    );
  }

  const { colliderConfig, dimensions } = selectedNode;

  const handleToggleEnabled = (e: React.ChangeEvent<HTMLInputElement>) => {
    editorStore.updateNodeCollider(selectedNode.id, { enabled: e.target.checked });
    onRebuildColliders();
  };

  const handleModeChange = (mode: ColliderMode) => {
    editorStore.updateNodeCollider(selectedNode.id, { mode });
    onRebuildColliders();
  };

  const handleMarginChange = (margin: number) => {
    editorStore.updateNodeCollider(selectedNode.id, {
      margin,
      mode: margin > 0 ? 'box_expanded' : 'box_exact',
    });
    onRebuildColliders();
  };

  const handleToggleGround = (e: React.ChangeEvent<HTMLInputElement>) => {
    editorStore.updateNodeCollider(selectedNode.id, { isGround: e.target.checked });
    onRebuildColliders();
  };

  const handleReset = () => {
    // Reset to auto defaults
    editorStore.updateNodeCollider(selectedNode.id, {
      enabled: true,
      mode: 'box_exact',
      margin: 0,
      customDimensions: undefined,
      isGround: selectedNode.category === 'terrain' || selectedNode.category === 'floor_ground',
    });
    onRebuildColliders();
  };

  const currentMargin = colliderConfig.margin || 0;
  // Effective dimensions calculation
  const effW = colliderConfig.customDimensions?.width ?? (dimensions[0] + currentMargin * 2);
  const effH = colliderConfig.customDimensions?.height ?? dimensions[1];
  const effD = colliderConfig.customDimensions?.depth ?? (dimensions[2] + currentMargin * 2);
  const effArea = (effW * effD).toFixed(2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Collision State & Mode */}
      <div className="panel-section">
        <div className="section-header">
          <span>Collider Configuration</span>
          <Shield size={14} color="#00f0ff" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={colliderConfig.enabled}
              onChange={handleToggleEnabled}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-cyan)' }}
            />
            <span>Enable Physics Collision</span>
          </label>

          <button className="margin-btn" onClick={handleReset} title="Reset collider to defaults">
            <RefreshCw size={11} />
            <span>Reset</span>
          </button>
        </div>

        {colliderConfig.enabled && (
          <div className="form-group">
            <label className="form-label">COLLIDER SHAPE MODE</label>
            <select
              value={colliderConfig.mode}
              onChange={(e) => handleModeChange(e.target.value as ColliderMode)}
            >
              <option value="box_exact">Exact Bounding Box</option>
              <option value="box_expanded">Expanded Box (+Margin)</option>
              <option value="trimesh">Static Triangle Mesh (Exact)</option>
              <option value="convex">Convex Hull (Approximate)</option>
              <option value="none">None (Pass-through)</option>
            </select>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
              {colliderConfig.mode === 'trimesh'
                ? 'Best for complex terrain, floors, and buildings with walkable doorways.'
                : colliderConfig.mode === 'box_expanded'
                ? 'Expands safety margin around habitat/equipment.'
                : 'Simplified bounding box for maximum physics performance.'}
            </div>
          </div>
        )}
      </div>

      {/* Margin & Footprint Expansion */}
      {colliderConfig.enabled && (
        <div className="panel-section">
          <div className="section-header">
            <span>Footprint Margin Expansion</span>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            A margin of <strong style={{ color: 'var(--accent-cyan)' }}>m</strong> per side expands total width and depth by <strong style={{ color: 'var(--accent-cyan)' }}>2m</strong>.
          </div>

          <div className="margin-buttons">
            <button
              className={`margin-btn ${currentMargin === 0 ? 'active' : ''}`}
              onClick={() => handleMarginChange(0)}
            >
              Exact (0m)
            </button>
            <button
              className={`margin-btn ${currentMargin === 0.25 ? 'active' : ''}`}
              onClick={() => handleMarginChange(0.25)}
            >
              +0.25m
            </button>
            <button
              className={`margin-btn ${currentMargin === 0.5 ? 'active' : ''}`}
              onClick={() => handleMarginChange(0.5)}
            >
              +0.50m
            </button>
            <button
              className={`margin-btn ${currentMargin === 1.0 ? 'active' : ''}`}
              onClick={() => handleMarginChange(1.0)}
            >
              +1.00m
            </button>
          </div>

          <div className="form-group" style={{ marginTop: '8px' }}>
            <div className="form-label">
              <span>CUSTOM MARGIN</span>
              <span className="num-display">{currentMargin.toFixed(2)} m</span>
            </div>
            <div className="form-control-row">
              <input
                type="range"
                min="0"
                max="5"
                step="0.05"
                value={currentMargin}
                onChange={(e) => handleMarginChange(parseFloat(e.target.value))}
                className="slider-input"
              />
            </div>
          </div>

          {/* Derived Effective Footprint */}
          <div style={{ background: 'var(--bg-primary)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginTop: '4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>BASE FOOTPRINT: </span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{dimensions[0]} × {dimensions[2]} m</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>COLLIDER DIMS: </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                  {effW.toFixed(2)} × {effH.toFixed(2)} × {effD.toFixed(2)} m
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>BASE AREA: </span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedNode.footprintArea} m²</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>EFFECTIVE AREA: </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>{effArea} m²</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ground Surface Role */}
      {colliderConfig.enabled && (
        <div className="panel-section">
          <div className="section-header">
            <span>Ground Surface Designation</span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={colliderConfig.isGround}
              onChange={handleToggleGround}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-emerald)' }}
            />
            <div>
              <div style={{ fontWeight: 500, color: colliderConfig.isGround ? 'var(--accent-emerald)' : 'var(--text-main)' }}>
                Mark as Walkable Ground Surface
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Enables player character controller snap-to-ground and elevation tracking.
              </div>
            </div>
          </label>
        </div>
      )}
    </div>
  );
};
