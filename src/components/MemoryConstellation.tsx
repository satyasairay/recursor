import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, applyWeightDecay } from '@/lib/recursionDB';
import { useState } from 'react';
import { MemoryNode } from '@/lib/types';

/**
 * Constellation visualization of user's memory graph.
 * Each memory node becomes a star, connections show pattern relationships.
 * Node size = weight, brightness = lastAccessed, line thickness = connection strength.
 */
export const MemoryConstellation = () => {
  const nodes = useLiveQuery(() => db.nodes.toArray());
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  if (!nodes || nodes.length === 0) {
    return (
      <div className="text-center text-muted-foreground font-mono text-sm py-12">
        NO MEMORY NODES YET
        <br />
        <span className="text-xs opacity-60">Interact with patterns to generate nodes</span>
      </div>
    );
  }

  const getNodePosition = (index: number, total: number) => {
    const angle = (index / total) * Math.PI * 2;
    const radius = Math.min(120 + total * 2, 180);
    return {
      x: 200 + Math.cos(angle) * radius,
      y: 200 + Math.sin(angle) * radius,
    };
  };

  const getNodeColor = (node: MemoryNode) => {
    const hue = 200 + node.depth * 30;
    return `hsl(${hue}, 80%, 60%)`;
  };

  const getNodeSize = (node: MemoryNode) => {
    // Size based on weight (decayed over time)
    const currentWeight = applyWeightDecay(node.weight, node.lastAccessed);
    return 3 + currentWeight * 8;
  };

  const getNodeOpacity = (node: MemoryNode) => {
    // Brightness based on lastAccessed
    const daysSince = (Date.now() - node.lastAccessed) / (1000 * 60 * 60 * 24);
    const brightness = Math.max(0.3, Math.min(1.0, 1.0 - daysSince * 0.1));
    return brightness;
  };

  const getConnectionThickness = (weight: number) => {
    return 0.5 + weight * 2;
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 0 20px rgba(100, 200, 255, 0.3))' }}
      >
        {/* Connection lines between related nodes */}
        {nodes.map((node, i) => {
          if (!node.id) return null;
          
          const sourcePos = getNodePosition(i, nodes.length);
          
          return node.connections.map((targetId) => {
            const targetIndex = nodes.findIndex(n => n.id === targetId);
            if (targetIndex === -1) return null;
            
            const targetPos = getNodePosition(targetIndex, nodes.length);
            const isHovered = hoveredNode === i || hoveredNode === targetIndex;
            const thickness = getConnectionThickness(node.weight);

            return (
              <motion.line
                key={`${node.id}-${targetId}`}
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                stroke={getNodeColor(node)}
                strokeWidth={thickness}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: isHovered ? 0.8 : 0.2,
                }}
                transition={{ duration: 1, delay: i * 0.05 }}
              />
            );
          });
        })}

        {/* Memory nodes */}
        {nodes.map((node, i) => {
          const pos = getNodePosition(i, nodes.length);
          const size = getNodeSize(node);
          const opacity = getNodeOpacity(node);
          const isHovered = hoveredNode === i;

          return (
            <g key={node.id || i}>
              {/* Glow effect on hover */}
              {isHovered && (
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size + 8}
                  fill={getNodeColor(node)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {/* Main node */}
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={size}
                fill={getNodeColor(node)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.05,
                  type: 'spring',
                  stiffness: 200,
                }}
                whileHover={{ scale: 1.3 }}
                onMouseEnter={() => setHoveredNode(i)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              />

              {/* Pulse animation for high-weight nodes */}
              {node.weight > 0.7 && (
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size}
                  fill="none"
                  stroke={getNodeColor(node)}
                  strokeWidth={1}
                  animate={{
                    r: [size, size + 10],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Node info on hover */}
      {hoveredNode !== null && nodes[hoveredNode] && (
        <motion.div
          className="absolute top-4 right-4 bg-background/95 backdrop-blur border border-primary/30 rounded-lg p-3 shadow-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <div className="font-mono text-xs space-y-1">
            <div className="text-primary font-bold">
              NODE {nodes[hoveredNode].id}
            </div>
            <div>Depth: {nodes[hoveredNode].depth}</div>
            <div>Weight: {applyWeightDecay(nodes[hoveredNode].weight, nodes[hoveredNode].lastAccessed).toFixed(2)}</div>
            <div>Connections: {nodes[hoveredNode].connections.length}</div>
            <div className="text-[10px] opacity-60">
              Last: {new Date(nodes[hoveredNode].lastAccessed).toLocaleString()}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
