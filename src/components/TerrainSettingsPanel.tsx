import React from 'react';
import { Mountain, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { useEditorStore, editorStore } from '../state/editorStore';
import type { PhysicsManager } from '../physics/PhysicsManager';

interface TerrainSettingsPanelProps {
  physicsManager: PhysicsManager | null;
}

export const TerrainSettingsPanel: React.FC<TerrainSettingsPanelProps> = ({ physicsManager }) => {
  const { playerSettings, spawnPoint, selectedNodeId, nodes } = useEditorStore();

  const handleSlopeChange = (angle: number) => {
    editorStore.setState((prev) => ({
      playerSettings: { ...prev.playerSettings, maxSlopeAngle: angle },
    }));
  };

  const handleStepHeightChange = (height: number) => {
    editorStore.setState((prev) => ({
      playerSettings: { ...prev.playerSettings, maxStepHeight: height },
    }));
  };

  const handlePlaceSpawnAtSelected = () => {
    if (!selectedNodeId || !physicsManager) return;
    const node = nodes.get(selectedNodeId);
    if (!node) return;

    const [cx, , cz] = node.center;
    const safeResult = physicsManager.findSafeSpawn(cx, cz);

    editorStore.setState({
      spawnPoint: {
        position: [cx, safeResult.safeY, cz],
        rotationY: 0,
        eyeHeight: 1.65,
        isValidated: safeResult.found,
        groundHeightFound: safeResult.found ? safeResult.safeY : undefined,
      },
    });
  };

  const handleAutoFindSafeSpawn = () => {
    if (!physicsManager) return;
    const safeResult = physicsManager.findSafeSpawn(0, 10);
    editorStore.setState({
      spawnPoint: {
        position: [0, safeResult.safeY, 10],
        rotationY: 0,
        eyeHeight: 1.65,
        isValidated: safeResult.found,
        groundHeightFound: safeResult.found ? safeResult.safeY : undefined,
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Slope & Step Traversal Config */}
      <div className="panel-section">
        <div className="section-header">
          <span>Terrain Traversal Limits</span>
          <Mountain size={14} color="#00f0ff" />
        </div>

        <div className="form-group">
          <div className="form-label">
            <span>MAX CLIMBABLE SLOPE</span>
            <span className="num-display">{playerSettings.maxSlopeAngle}°</span>
          </div>
          <div className="form-control-row">
            <input
              type="range"
              min="20"
              max="60"
              step="1"
              value={playerSettings.maxSlopeAngle}
              onChange={(e) => handleSlopeChange(parseInt(e.target.value, 10))}
              className="slider-input"
            />
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
            Slopes exceeding {playerSettings.maxSlopeAngle}° will prevent climbing and trigger physical sliding.
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '6px' }}>
          <div className="form-label">
            <span>AUTOSTEP MAX HEIGHT</span>
            <span className="num-display">{playerSettings.maxStepHeight.toFixed(2)} m</span>
          </div>
          <div className="form-control-row">
            <input
              type="range"
              min="0.10"
              max="0.60"
              step="0.05"
              value={playerSettings.maxStepHeight}
              onChange={(e) => handleStepHeightChange(parseFloat(e.target.value))}
              className="slider-input"
            />
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
            Allows smoothly stepping over curbs, thresholds, and stairs without jumping.
          </div>
        </div>
      </div>

      {/* Spawn Point Configuration */}
      <div className="panel-section">
        <div className="section-header">
          <span>Spawn Point Placement</span>
          <MapPin size={14} color="#00f0ff" />
        </div>

        <div style={{ background: 'var(--bg-primary)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>CURRENT SPAWN</span>
            {spawnPoint.isValidated ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-emerald)', fontSize: '10px', fontWeight: 600 }}>
                <CheckCircle size={11} /> VALIDATED GROUND
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-amber)', fontSize: '10px', fontWeight: 600 }}>
                <AlertTriangle size={11} /> UNVERIFIED
              </span>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-cyan)' }}>
            X: {spawnPoint.position[0].toFixed(2)} | Y: {spawnPoint.position[1].toFixed(2)} | Z: {spawnPoint.position[2].toFixed(2)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          <button
            className="nav-btn"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handlePlaceSpawnAtSelected}
            disabled={!selectedNodeId}
          >
            <MapPin size={13} />
            <span>Set Spawn at Selected Object</span>
          </button>

          <button
            className="nav-btn"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleAutoFindSafeSpawn}
          >
            <span>Auto-Find Safe Terrain Spawn</span>
          </button>
        </div>
      </div>
    </div>
  );
};
