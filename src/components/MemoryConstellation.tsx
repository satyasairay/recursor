import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { db, RecursionSession } from '@/lib/recursionDB';
import { useLiveQuery } from 'dexie-react-hooks';

export const MemoryConstellation = () => {
  const sessions = useLiveQuery(() => db.sessions.toArray()) || [];
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  const getNodePosition = (index: number, total: number) => {
    const angle = (index / total) * Math.PI * 2;
    const radius = 120 + (index % 3) * 30;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  const getNodeColor = (session: RecursionSession) => {
    const hue = 180 + session.depth * 30;
    const opacity = session.completed ? 1 : 0.5;
    return `hsla(${hue}, 100%, 60%, ${opacity})`;
  };

  const getNodeSize = (session: RecursionSession) => {
    return 8 + session.depth * 2 + (session.metadata.interactionCount / 10);
  };

  if (sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          No memories yet. Begin to create your constellation.
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
        <g transform="translate(50%, 50%)">
          {/* Connection lines */}
          {sessions.map((session, i) => {
            const pos1 = getNodePosition(i, sessions.length);
            const nextIndex = (i + 1) % sessions.length;
            const pos2 = getNodePosition(nextIndex, sessions.length);

            return (
              <motion.line
                key={`line-${i}`}
                x1={pos1.x}
                y1={pos1.y}
                x2={pos2.x}
                y2={pos2.y}
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                opacity="0.2"
                initial={{ pathLength: 0 }}
                animate={{ 
                  pathLength: 1,
                  opacity: hoveredNode === i || hoveredNode === nextIndex ? 0.5 : 0.2,
                }}
                transition={{ duration: 2, delay: i * 0.1 }}
              />
            );
          })}

          {/* Nodes */}
          {sessions.map((session, i) => {
            const pos = getNodePosition(i, sessions.length);
            const size = getNodeSize(session);
            const color = getNodeColor(session);

            return (
              <g key={`node-${i}`}>
                {/* Outer glow ring */}
                {hoveredNode === i && (
                  <motion.circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size * 2}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0.2, 0.5],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                {/* Main node */}
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size}
                  fill={color}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring' }}
                  onMouseEnter={() => setHoveredNode(i)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer' }}
                  whileHover={{ scale: 1.3 }}
                />

                {/* Depth indicator */}
                {session.depth > 0 && (
                  <motion.circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size * 0.4}
                    fill="none"
                    stroke="hsl(var(--background))"
                    strokeWidth="1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05 + 0.2 }}
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Info panel */}
      {hoveredNode !== null && sessions[hoveredNode] && (
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg recursive-border bg-card/90 backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-sm space-y-1 font-mono">
            <div className="text-primary">Session {hoveredNode + 1}</div>
            <div className="text-muted-foreground">
              Depth: {sessions[hoveredNode].depth} • 
              Interactions: {sessions[hoveredNode].metadata.interactionCount} •
              {sessions[hoveredNode].completed ? ' Complete' : ' Incomplete'}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(sessions[hoveredNode].timestamp).toLocaleDateString()}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
