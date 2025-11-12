import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, applyWeightDecay } from '@/lib/recursionDB';
import { useState } from 'react';
import { MemoryNode } from '@/lib/types';
import { getAchievementInfo, revealAchievement } from '@/lib/achievementEngine';

/**
 * Constellation visualization of user's memory graph.
 * Each memory node becomes a star, connections show pattern relationships.
 * Node size = weight, brightness = lastAccessed, line thickness = connection strength.
 */
export const MemoryConstellation = () => {
  const nodes = useLiveQuery(() => db.nodes.toArray());
  const achievements = useLiveQuery(() => db.achievements.toArray());
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
    // With MIN_NODE_WEIGHT=0.3, range is [0.3, 1.0]
    // Formula: radius = 3 + weight * 7 → range [5.1, 10]
    const currentWeight = applyWeightDecay(node.weight, node.lastAccessed);
    return 3 + currentWeight * 7;
  };

  const getNodeOpacity = (node: MemoryNode) => {
    // Brightness based on decayed weight
    // With MIN_NODE_WEIGHT=0.3, ensure nodes don't fade too much
    // Formula: opacity = 0.2 + weight * 0.8 → range [0.44, 1.0]
    const currentWeight = applyWeightDecay(node.weight, node.lastAccessed);
    return 0.2 + currentWeight * 0.8;
  };

  const getConnectionThickness = (weight: number) => {
    return 0.5 + weight * 2;
  };

  const getNodeAchievements = (node: MemoryNode) => {
    if (!achievements) return [];
    return achievements.filter(a => a.sessionId === node.sessionId);
  };

  const hasUnrevealedAchievement = (node: MemoryNode) => {
    const nodeAchievements = getNodeAchievements(node);
    return nodeAchievements.some(a => !a.revealed);
  };

  const handleNodeClick = async (node: MemoryNode, index: number) => {
    setHoveredNode(index);
    
    // Reveal achievements when node is clicked
    const nodeAchievements = getNodeAchievements(node);
    for (const achievement of nodeAchievements) {
      if (!achievement.revealed && achievement.id) {
        await revealAchievement(achievement.id);
      }
    }
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
          const hasAchievement = hasUnrevealedAchievement(node);

          return (
            <g key={node.id || i}>
              {/* Achievement indicator (cryptic glow) */}
              {hasAchievement && (
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size + 12}
                  fill="none"
                  stroke="hsl(280, 100%, 60%)"
                  strokeWidth={1.5}
                  animate={{
                    opacity: [0.3, 0.8, 0.3],
                    r: [size + 10, size + 14, size + 10],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}

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
                onClick={() => handleNodeClick(node, i)}
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
          className="absolute top-4 right-4 bg-background/95 backdrop-blur border border-primary/30 rounded-lg p-3 shadow-lg max-w-xs"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <div className="font-mono text-xs space-y-2">
            <div className="text-primary font-bold">
              NODE {nodes[hoveredNode].id}
            </div>
            <div>Depth: {nodes[hoveredNode].depth}</div>
            <div>Weight: {applyWeightDecay(nodes[hoveredNode].weight, nodes[hoveredNode].lastAccessed).toFixed(2)}</div>
            <div>Connections: {nodes[hoveredNode].connections.length}</div>
            <div className="text-[10px] opacity-60">
              Last: {new Date(nodes[hoveredNode].lastAccessed).toLocaleString()}
            </div>
            
            {/* Reveal achievements */}
            {achievements && getNodeAchievements(nodes[hoveredNode]).length > 0 && (
              <div className="border-t border-primary/20 pt-2 mt-2 space-y-1">
                <div className="text-primary/70 text-[10px] uppercase tracking-wider">
                  Insights
                </div>
                {getNodeAchievements(nodes[hoveredNode]).map(achievement => {
                  const info = getAchievementInfo(achievement.code);
                  return (
                    <motion.div
                      key={achievement.id}
                      className="text-[10px] italic text-muted-foreground"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      "{info?.crypticHint || 'Unknown pattern'}"
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
