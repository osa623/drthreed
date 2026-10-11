import React from 'react';
import { Tag, HelpCircle, Layers, Cpu } from 'lucide-react';
import { useEditorStore, editorStore } from '../state/editorStore';
import type { ObjectCategory } from '../state/types';

export const ObjectDiscoveryPanel: React.FC = () => {
  const { nodes, selectedNodeId } = useEditorStore();

  const selectedNode = selectedNodeId ? nodes.get(selectedNodeId) : null;

  const handleCategoryChange = (cat: ObjectCategory) => {
    if (selectedNodeId) {
      editorStore.updateNodeCategory(selectedNodeId, cat);
    }
  };

  // Summary counts
  const categoryCounts = new Map<ObjectCategory, number>();
  nodes.forEach((node) => {
    categoryCounts.set(node.category, (categoryCounts.get(node.category) || 0) + 1);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Category Discovery Summary */}
      <div className="panel-section">
        <div className="section-header">
          <span>Scene Classification Inventory</span>
          <Cpu size={14} color="#00f0ff" />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {Array.from(categoryCounts.entries()).map(([cat, count]) => (
            <div
              key={cat}
              className={`category-badge cat-${cat}`}
              style={{ cursor: 'pointer' }}
              onClick={() => editorStore.setCategoryFilter(cat)}
            >
              <span>{cat}</span>
              <span style={{ opacity: 0.75 }}>({count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Object Detail & Classification Override */}
      {selectedNode ? (
        <div className="panel-section">
          <div className="section-header">
            <span>Object Discovery Details</span>
            <Tag size={14} color="#00f0ff" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>OBJECT NAME</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-all' }}>
                {selectedNode.name}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>TYPE: </span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedNode.type}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>TRIANGLES: </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                  {selectedNode.triangleCount.toLocaleString()}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>DIMENSIONS: </span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {selectedNode.dimensions[0]} × {selectedNode.dimensions[1]} × {selectedNode.dimensions[2]} m
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>FOOTPRINT: </span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedNode.footprintArea} m²</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              <div className="form-label">
                <span>CLASSIFIED CATEGORY</span>
                <span style={{ color: 'var(--accent-cyan)' }}>
                  {(selectedNode.categoryConfidence * 100).toFixed(0)}% Confidence
                </span>
              </div>

              <select
                value={selectedNode.category}
                onChange={(e) => handleCategoryChange(e.target.value as ObjectCategory)}
                style={{ width: '100%', marginTop: '4px' }}
              >
                <option value="building">Building / Habitat</option>
                <option value="floor_ground">Floor / Ground</option>
                <option value="wall">Wall</option>
                <option value="terrain">Terrain</option>
                <option value="rock">Rock</option>
                <option value="furniture">Furniture</option>
                <option value="equipment">Equipment</option>
                <option value="prop">Prop</option>
                <option value="structural">Structural</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-dim)', marginBottom: '2px' }}>
                <HelpCircle size={11} />
                <span>CLASSIFICATION REASONING</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {selectedNode.categoryReason}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
          <Layers size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          <div>Select an object in the viewport or hierarchy to inspect its classification and geometric bounds.</div>
        </div>
      )}
    </div>
  );
};
