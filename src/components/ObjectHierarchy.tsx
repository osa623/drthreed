import React from 'react';
import { Eye, EyeOff, Search, ChevronRight, Box, MapPin } from 'lucide-react';
import { useEditorStore, editorStore } from '../state/editorStore';
import type { AnalyzedNode, ObjectCategory } from '../state/types';

export const ObjectHierarchy: React.FC = () => {
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

  const handleSpawnOnNode = (e: React.MouseEvent, node: AnalyzedNode) => {
    e.stopPropagation();
    editorStore.selectNode(node.id);
    // Position player safely on top of the chosen object
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
  };

  const handleShowAll = () => {
    nodes.forEach((n) => editorStore.setNodeVisibility(n.id, true));
  };

  const handleHideAll = () => {
    nodes.forEach((n) => editorStore.setNodeVisibility(n.id, false));
  };

  const selectedNode = selectedNodeId ? nodes.get(selectedNodeId) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '8px', top: '9px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search hierarchy..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{ width: '100%', paddingLeft: '28px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <select
            value={categoryFilter}
            onChange={handleCategoryChange}
            style={{ flex: 1, fontSize: '11px' }}
          >
            <option value="all">All Categories</option>
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

          <button className="margin-btn" onClick={handleShowAll} title="Show all objects">
            Show All
          </button>
          <button className="margin-btn" onClick={handleHideAll} title="Hide all objects">
            Hide All
          </button>
        </div>
      </div>

      {/* Selected Object Quick Spawn Action Banner */}
      {selectedNode && (
        <div style={{
          background: 'rgba(0, 240, 255, 0.08)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>SELECTED OBJECT</span>
            <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600 }}>{selectedNode.name}</span>
          </div>
          <button
            className="nav-btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '11px', padding: '5px' }}
            onClick={(e) => handleSpawnOnNode(e, selectedNode)}
            title="Set player spawn point on top of this object"
          >
            <MapPin size={13} />
            <span>Spawn Player On This Object</span>
          </button>
        </div>
      )}

      <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
        <span>OBJECTS ({nodeList.length} of {nodes.size})</span>
        <span style={{ color: 'var(--accent-cyan)', fontSize: '10px' }}>
          Spawn: ({spawnPoint.position[0].toFixed(1)}, {spawnPoint.position[1].toFixed(1)}, {spawnPoint.position[2].toFixed(1)})
        </span>
      </div>

      {/* Node List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {nodeList.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>
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
                  style={{ background: 'none', padding: '2px', color: node.visible ? 'var(--text-main)' : 'var(--text-dim)' }}
                  onClick={(e) => handleToggleVisibility(e, node)}
                  title={node.visible ? 'Hide object' : 'Show object'}
                >
                  {node.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>

                <Box size={13} color={node.hasMeshes ? '#00f0ff' : 'var(--text-dim)'} />

                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {node.name}
                </span>

                <span className={`category-badge cat-${node.category}`} style={{ fontSize: '9px', padding: '1px 4px' }}>
                  {node.category}
                </span>

                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px 4px',
                    cursor: 'pointer',
                    color: 'var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
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
