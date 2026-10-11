import React from 'react';
import { Eye, EyeOff, Search, ChevronRight, Box, MapPin, Target } from 'lucide-react';
import { useEditorStore, editorStore } from '../state/editorStore';
import type { AnalyzedNode, ObjectCategory } from '../state/types';

interface ObjectHierarchyProps {
  onFocusNode?: (nodeId: string) => void;
  onSpawnAtNode?: (nodeId: string) => void;
}

export const ObjectHierarchy: React.FC<ObjectHierarchyProps> = ({ onFocusNode, onSpawnAtNode }) => {
  const { nodes, selectedNodeId, searchQuery, categoryFilter, spawnPoint } = useEditorStore();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    editorStore.setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    editorStore.setCategoryFilter(e.target.value as ObjectCategory | 'all');
  };

  const nodeList = Array.from(nodes.values()).filter((node) => {
    if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (categoryFilter !== 'all' && node.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  const handleToggleVisibility = (e: React.MouseEvent, node: AnalyzedNode) => {
    e.stopPropagation();
    editorStore.setNodeVisibility(node.id, !node.visible);
  };

  const handleSelectNode = (node: AnalyzedNode) => {
    editorStore.selectNode(node.id);
  };

  const handleFocusNode = (e: React.MouseEvent, node: AnalyzedNode) => {
    e.stopPropagation();
    editorStore.selectNode(node.id);
    if (onFocusNode) {
      onFocusNode(node.id);
    }
  };

  const handleSpawnOnNode = (e: React.MouseEvent, node: AnalyzedNode) => {
    e.stopPropagation();
    editorStore.selectNode(node.id);
    if (onSpawnAtNode) {
      onSpawnAtNode(node.id);
    } else {
      // Fallback if full 3D engine is not attached
      const [cx, , cz] = node.center;
      const topY = parseFloat((node.worldBoundingBox.max[1] + 1.0).toFixed(2));

      editorStore.setState({
        spawnPoint: {
          position: [cx, topY, cz],
          rotationY: 0,
          eyeHeight: 1.65,
          isValidated: true,
          groundHeightFound: topY,
        },
      });
    }
  };

  const handleShowAll = () => {
    nodes.forEach((n) => editorStore.setNodeVisibility(n.id, true));
  };

  const handleHideAll = () => {
    nodes.forEach((n) => editorStore.setNodeVisibility(n.id, false));
  };

  const selectedNode = selectedNodeId ? nodes.get(selectedNodeId) : null;

  return (
    <div className="scene-explorer-container">
      {/* Search & Filter Bar */}
      <div className="scene-explorer-header">
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search scene nodes..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{ width: '100%', paddingLeft: '32px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <select
            value={categoryFilter}
            onChange={handleCategoryChange}
            style={{ flex: 1, fontSize: '11px' }}
          >
            <option value="all">All Categories ({nodes.size})</option>
            <option value="terrain">Terrain</option>
            <option value="floor_ground">Floor / Ground</option>
            <option value="building">Building / Habitat</option>
            <option value="wall">Wall</option>
            <option value="rock">Rock</option>
            <option value="equipment">Equipment</option>
            <option value="furniture">Furniture</option>
            <option value="prop">Prop</option>
            <option value="structural">Structural</option>
            <option value="unknown">Unknown</option>
          </select>

          <button type="button" className="margin-btn" onClick={handleShowAll} title="Show all objects">
            Show All
          </button>
          <button type="button" className="margin-btn" onClick={handleHideAll} title="Hide all objects">
            Hide All
          </button>
        </div>
      </div>

      {/* Selected Object Quick Banner */}
      {selectedNode && (
        <div className="selected-node-banner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.5px' }}>SELECTED NODE</span>
            <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedNode.name}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            {onFocusNode && (
              <button
                type="button"
                className="nav-btn"
                style={{ flex: 1, justifyContent: 'center', fontSize: '11px', padding: '5px' }}
                onClick={(e) => handleFocusNode(e, selectedNode)}
                title="Center camera on this object"
              >
                <Target size={12} />
                <span>Focus View</span>
              </button>
            )}

            <button
              type="button"
              className="nav-btn-primary"
              style={{ flex: 1, justifyContent: 'center', fontSize: '11px', padding: '5px' }}
              onClick={(e) => handleSpawnOnNode(e, selectedNode)}
              title="Set spawn position directly on top of this object"
            >
              <MapPin size={12} />
              <span>Spawn Here</span>
            </button>
          </div>
        </div>
      )}

      <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
        <span>OBJECTS ({nodeList.length} of {nodes.size})</span>
        <span style={{ color: 'var(--accent-cyan)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
          Spawn: ({spawnPoint.position[0].toFixed(1)}, {spawnPoint.position[1].toFixed(1)}, {spawnPoint.position[2].toFixed(1)})
        </span>
      </div>

      {/* Node Hierarchy List */}
      <div className="scene-node-list">
        {nodeList.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
            No objects matched search or filter criteria.
          </div>
        ) : (
          nodeList.map((node) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <div
                key={node.id}
                className={`tree-node-row ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectNode(node)}
              >
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', padding: '3px', color: node.visible ? 'var(--text-main)' : 'var(--text-dim)', cursor: 'pointer' }}
                  onClick={(e) => handleToggleVisibility(e, node)}
                  title={node.visible ? 'Hide object' : 'Show object'}
                >
                  {node.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>

                <Box size={13} color={node.hasMeshes ? 'var(--accent-cyan)' : 'var(--text-dim)'} style={{ flexShrink: 0 }} />

                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {node.name}
                </span>

                <span className={`category-badge cat-${node.category}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                  {node.category}
                </span>

                {onFocusNode && (
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', color: 'var(--text-muted)' }}
                    onClick={(e) => handleFocusNode(e, node)}
                    title={`Focus camera on ${node.name}`}
                  >
                    <Target size={12} />
                  </button>
                )}

                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px 4px',
                    cursor: 'pointer',
                    color: 'var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onClick={(e) => handleSpawnOnNode(e, node)}
                  title={`Spawn player directly on ${node.name}`}
                >
                  <MapPin size={12} />
                </button>

                <ChevronRight size={12} color="var(--text-dim)" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
