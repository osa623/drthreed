import React, { useState } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { useEditorStore } from '../state/editorStore';

export const PerformanceStats: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { performanceStats } = useEditorStore();

  const fpsColor = performanceStats.fps >= 55 ? '#00e699' : performanceStats.fps >= 30 ? '#ffaa00' : '#ff4d4f';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        background: 'rgba(16, 21, 30, 0.88)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 12px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text-muted)',
        zIndex: 15,
        minWidth: '180px',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          gap: '8px',
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={12} color="#00f0ff" />
          <span style={{ color: fpsColor, fontWeight: 600 }}>{performanceStats.fps} FPS</span>
          <span style={{ color: 'var(--text-dim)' }}>({performanceStats.frameTimeMs}ms)</span>
        </div>
        {collapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </div>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>DRAW CALLS:</span>
            <span style={{ color: 'var(--text-main)' }}>{performanceStats.drawCalls}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>TRIANGLES:</span>
            <span style={{ color: 'var(--accent-cyan)' }}>{performanceStats.triangles.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>GEOMETRIES:</span>
            <span style={{ color: 'var(--text-main)' }}>{performanceStats.geometries}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>TEXTURES:</span>
            <span style={{ color: 'var(--text-main)' }}>{performanceStats.textures}</span>
          </div>
        </div>
      )}
    </div>
  );
};
