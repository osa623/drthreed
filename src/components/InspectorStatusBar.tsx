import React from 'react';
import { Box, Layers, Eye, Sparkles, Footprints, ShieldCheck, Activity } from 'lucide-react';
import { useEditorStore } from '../state/editorStore';

export const InspectorStatusBar: React.FC = () => {
  const {
    loadedModelName,
    nodes,
    viewMode,
    performanceStats,
    spawnPoint,
  } = useEditorStore();

  // Calculate actual total triangles and mesh count from real analyzed nodes
  let totalTriangles = 0;
  let totalMeshes = 0;
  nodes.forEach((node) => {
    totalTriangles += node.triangleCount;
    totalMeshes += node.meshCount;
  });

  return (
    <footer className="inspector-status-bar">
      {/* Left: Active Scene & File info */}
      <div className="status-bar-group">
        <div className="status-item">
          <Box size={12} color="var(--accent-cyan)" />
          <span className="status-label">SCENE:</span>
          <span className="status-value">{loadedModelName || 'No model loaded'}</span>
        </div>

        <span className="status-separator" />

        <div className="status-item">
          <Layers size={12} color="var(--text-muted)" />
          <span className="status-label">NODES:</span>
          <span className="status-value">{nodes.size} ({totalMeshes} meshes)</span>
        </div>

        <span className="status-separator" />

        <div className="status-item">
          <span className="status-label">TRIANGLES:</span>
          <span className="status-value" style={{ color: 'var(--accent-cyan)' }}>
            {totalTriangles > 0 ? totalTriangles.toLocaleString() : performanceStats.triangles.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Center: Navigation Mode Indicator */}
      <div className="status-bar-group">
        <div className="status-item">
          {viewMode === 'orbit' && (
            <>
              <Eye size={12} color="var(--accent-cyan)" />
              <span className="status-mode-pill">ORBIT INSPECTION</span>
            </>
          )}
          {viewMode === 'fly' && (
            <>
              <Sparkles size={12} color="#d166ff" />
              <span className="status-mode-pill" style={{ color: '#d166ff', borderColor: 'rgba(209, 102, 255, 0.4)' }}>
                FREE-FLY (NO GRAVITY)
              </span>
            </>
          )}
          {viewMode === 'first_person' && (
            <>
              <Footprints size={12} color="var(--accent-emerald)" />
              <span className="status-mode-pill" style={{ color: 'var(--accent-emerald)', borderColor: 'rgba(0, 230, 153, 0.4)' }}>
                FIRST-PERSON (PHYSICS)
              </span>
            </>
          )}
        </div>

        <span className="status-separator" />

        <div className="status-item">
          <ShieldCheck size={12} color="var(--accent-emerald)" />
          <span className="status-label">PHYSICS:</span>
          <span className="status-value" style={{ color: 'var(--accent-emerald)' }}>RAPIER 3D WASM</span>
        </div>
      </div>

      {/* Right: Spawn & FPS Telemetry */}
      <div className="status-bar-group">
        <div className="status-item">
          <span className="status-label">SPAWN:</span>
          <span className="status-value">
            [{spawnPoint.position[0].toFixed(1)}, {spawnPoint.position[1].toFixed(1)}, {spawnPoint.position[2].toFixed(1)}]
          </span>
        </div>

        <span className="status-separator" />

        <div className="status-item">
          <Activity size={12} color={performanceStats.fps >= 55 ? 'var(--accent-emerald)' : 'var(--accent-amber)'} />
          <span className="status-value" style={{ fontWeight: 600 }}>
            {performanceStats.fps} FPS
          </span>
        </div>
      </div>
    </footer>
  );
};
