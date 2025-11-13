/**
 * PatternField - Ambient interactive field with floating nodes
 * 
 * Pure presentation layer: receives (pattern, depth, memory, mutationCount)
 * and renders a living field of floating nodes that respond to state.
 * 
 * No grids, no labels, no UI. Only life, presence, and memory.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Pattern } from '@/lib/types';
import {
  MAX_CELL_STATE,
  MIN_NODE_COUNT,
  MAX_NODE_COUNT,
  NODE_BASE_HUE,
  NODE_HUE_PER_DEPTH,
  NODE_SATURATION,
  FIELD_BOUNDS,
} from '@/lib/constants';
import { db } from '@/lib/recursionDB';
import { validatePattern, validateDepth, validateMutationCount, type PatternChangeCallback } from '@/lib/regressionGuards';
import { analyzePattern } from '@/lib/mutationEngine';
import { MemoryLattice } from './MemoryLattice';

interface PatternFieldProps {
  readonly pattern: Pattern;
  readonly onPatternChange: PatternChangeCallback;
  readonly depth: number;
  readonly locked?: boolean;
  readonly mutationCount?: number;
  readonly entropy?: number;
  readonly showBranchPulse?: boolean;
}

type NodeState = {
  patternIndex: number; // Stable: always maps to same pattern index
  nodeId: string; // Stable: deterministic identity
  x: number;
  y: number;
  luminosity: number;
  distortion: number;
  pulsePhase: number;
  glyph: string;
  memoryWeight: number;
};

const GLYPHS = ['◉', '●', '⬡'];

export const PatternField = ({ 
  pattern, 
  onPatternChange, 
  depth, 
  locked = false, 
  mutationCount = 0,
  entropy = 0,
  showBranchPulse = false,
}: PatternFieldProps) => {
  validatePattern(pattern);
  validateDepth(depth);
  if (mutationCount !== undefined) {
    validateMutationCount(mutationCount);
  }

  const historyNodes = useLiveQuery(() => db.nodes.toArray()) ?? [];
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [branchPulseActive, setBranchPulseActive] = useState(false);

  // Listen for branch pulse events
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const listener = () => {
      setBranchPulseActive(true);
      setTimeout(() => setBranchPulseActive(false), 150);
    };
    window.addEventListener('recursor-branch-pulse', listener);
    return () => window.removeEventListener('recursor-branch-pulse', listener);
  }, []);

  const nodeCount = useMemo(() => {
    const signature = computePatternSignature(pattern);
    return MIN_NODE_COUNT + (signature % (MAX_NODE_COUNT - MIN_NODE_COUNT + 1));
  }, [pattern]);

  const nodes = useMemo(() => {
    return deriveNodes(pattern, depth, historyNodes, nodeCount, entropy);
  }, [pattern, depth, historyNodes, nodeCount, entropy]);

  // Memory connections: thin lines between historically "hot" nodes
  const memoryConnections = useMemo(() => {
    if (historyNodes.length === 0) return [];
    const connections: Array<{ from: string; to: string; weight: number }> = [];
    const hotNodes = nodes.filter(n => n.memoryWeight > 0.3);
    
    for (let i = 0; i < hotNodes.length; i++) {
      for (let j = i + 1; j < hotNodes.length; j++) {
        const distance = Math.sqrt(
          Math.pow(hotNodes[i].x - hotNodes[j].x, 2) + 
          Math.pow(hotNodes[i].y - hotNodes[j].y, 2)
        );
        if (distance < 25) {
          connections.push({
            from: hotNodes[i].nodeId,
            to: hotNodes[j].nodeId,
            weight: (hotNodes[i].memoryWeight + hotNodes[j].memoryWeight) / 2,
          });
        }
      }
    }
    return connections;
  }, [nodes, historyNodes]);

  const handleNodeClick = (patternIndex: number) => {
    if (locked) return;
    
    // Direct mutation: increment the pattern value at this pattern index
    // patternIndex is stable and independent of nodeCount
    const updatedPattern = pattern.map((value, i) =>
      i === patternIndex ? (value + 1) % (MAX_CELL_STATE + 1) : value
    );
    
    onPatternChange(updatedPattern);
  };

  // Fallback: show dim nodes if pattern is empty
  const hasData = pattern.length > 0 && nodes.length > 0;

  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Background architecture morph (depth-based breathing) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity: [0.08, 0.18, 0.08],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 8 + depth * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: `radial-gradient(
              ellipse ${60 + depth * 5}% ${50 + depth * 3}% at ${50 + (depth % 3) * 2}% ${50 + (depth % 5) * 1}%,
              hsla(${NODE_BASE_HUE + depth * NODE_HUE_PER_DEPTH}, 40%, 15%, 0.4) 0%,
              hsla(${NODE_BASE_HUE + depth * NODE_HUE_PER_DEPTH + 30}, 30%, 8%, 0.2) 50%,
              transparent 100%
            )`,
          }}
        />
        
        {/* Branching chromatic pulse */}
        <AnimatePresence>
          {(branchPulseActive || showBranchPulse) && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                background: `radial-gradient(circle, 
                  hsla(${NODE_BASE_HUE + depth * NODE_HUE_PER_DEPTH + 60}, 90%, 50%, 0.8) 0%,
                  transparent 70%
                )`,
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Main field */}
      <svg 
        viewBox="0 0 100 100" 
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: 'screen' }}
      >
        {/* Memory lattice layer (persistent, cumulative) */}
        <MemoryLattice
          pattern={pattern}
          depth={depth}
          mutationCount={mutationCount}
        />
        {/* Memory constellation lines */}
        {memoryConnections.map((conn, idx) => {
          const fromNode = nodes.find(n => n.nodeId === conn.from);
          const toNode = nodes.find(n => n.nodeId === conn.to);
          if (!fromNode || !toNode) return null;
          
          return (
            <line
              key={`conn-${idx}`}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke={`hsla(${NODE_BASE_HUE + depth * NODE_HUE_PER_DEPTH}, 60%, 60%, ${0.15 * conn.weight})`}
              strokeWidth={0.3}
              opacity={0.2 + conn.weight * 0.3}
            />
          );
        })}

        {/* Floating nodes */}
        {hasData ? (
          nodes.map((node) => {
            const isHovered = hoveredNode === node.nodeId;
            const baseLuminosity = node.luminosity;
            const currentLuminosity = isHovered 
              ? Math.min(1, baseLuminosity * 1.6) 
              : baseLuminosity;
            
            // Entropy-based jitter
            const jitterX = entropy * (node.pulsePhase - 0.5) * 0.8;
            const jitterY = entropy * ((node.pulsePhase + 0.3) % 1 - 0.5) * 0.8;
            
            const hue = NODE_BASE_HUE + depth * NODE_HUE_PER_DEPTH + node.distortion * 30;
            const opacity = 0.3 + currentLuminosity * 0.7;
            const size = 2.5 + currentLuminosity * 3 + node.memoryWeight * 2;

        return (
              <g key={node.nodeId}>
                {/* Memory scar (brightness/shape distortion) */}
                {node.memoryWeight > 0.2 && (
                  <motion.circle
                    cx={node.x}
                    cy={node.y}
                    r={size * 1.8}
                    fill="none"
                    stroke={`hsla(${hue}, ${NODE_SATURATION}%, 70%, ${0.2 * node.memoryWeight})`}
                    strokeWidth={0.4}
                    animate={{
                      opacity: [0.1, 0.3 * node.memoryWeight, 0.1],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 4 + node.pulsePhase * 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}

                {/* Node glyph */}
                <motion.text
                  x={node.x + jitterX}
                  y={node.y + jitterY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={size}
                  fill={`hsla(${hue}, ${NODE_SATURATION}%, ${45 + currentLuminosity * 35}%, ${opacity})`}
                  onClick={() => handleNodeClick(node.patternIndex)}
                  onMouseEnter={() => setHoveredNode(node.nodeId)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ 
                    cursor: locked ? 'default' : 'pointer',
                    filter: isHovered ? 'drop-shadow(0 0 4px currentColor)' : 'none',
                  }}
                  animate={{
                    opacity: [
                      0.3 + currentLuminosity * 0.5,
                      0.5 + currentLuminosity * 0.8,
                      0.3 + currentLuminosity * 0.5,
                    ],
                    scale: isHovered 
                      ? [1, 1.4, 1]
                      : [
                          1 - node.distortion * 0.1,
                          1 + node.distortion * 0.15,
                          1 - node.distortion * 0.1,
                        ],
                    x: isHovered 
                      ? [node.x + jitterX, node.x + jitterX + 1, node.x + jitterX]
                      : node.x + jitterX,
                    y: isHovered 
                      ? [node.y + jitterY, node.y + jitterY - 1, node.y + jitterY]
                      : node.y + jitterY,
                  }}
                  transition={{
                    duration: 3 + node.pulsePhase * 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: node.pulsePhase * 0.5,
                  }}
                >
                  {node.glyph}
                </motion.text>
              </g>
            );
          })
        ) : (
          // Fallback: dim idle nodes
          Array.from({ length: 15 }).map((_, idx) => {
            const angle = (idx / 15) * Math.PI * 2;
            const radius = 30 + (idx % 3) * 5;
            return (
              <text
                key={`fallback-${idx}`}
                x={50 + Math.cos(angle) * radius}
                y={50 + Math.sin(angle) * radius}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={2}
                fill={`hsla(${NODE_BASE_HUE}, 30%, 30%, 0.2)`}
                opacity={0.15}
              >
                ●
              </text>
            );
          })
        )}
      </svg>
    </div>
  );
};

/**
 * Deterministic node derivation with stable identity.
 * Pure function: f(pattern, depth, historyNodes, nodeCount, entropy) → NodeState[]
 * 
 * CRITICAL: Nodes are generated per pattern index, ensuring stable identity
 * independent of nodeCount fluctuations. Each pattern index gets a stable
 * set of nodes that persist across recomputations.
 */
function deriveNodes(
  pattern: Pattern,
  depth: number,
  historyNodes: any[],
  nodeCount: number,
  entropy: number
): NodeState[] {
  if (pattern.length === 0) return [];

  const historyVector = deriveHistoryVector(historyNodes, pattern.length);
  const distortionMap = deriveDistortionMap(historyNodes, pattern.length, depth);
  const signature = computePatternSignature(pattern);

  const nodes: NodeState[] = [];

  // Generate nodes per pattern index (stable mapping)
  // Each pattern index gets multiple nodes distributed deterministically
  for (let patternIndex = 0; patternIndex < pattern.length; patternIndex++) {
    const value = pattern[patternIndex];
    const intensity = value / MAX_CELL_STATE;
    const memory = historyVector[patternIndex] ?? 0;
    const distortion = distortionMap[patternIndex] ?? 0;

    // Calculate how many nodes this pattern index should have
    // Distribute nodeCount across pattern indices deterministically
    const nodesPerIndex = Math.floor(nodeCount / pattern.length);
    const extraNodes = nodeCount % pattern.length;
    const nodeCountForIndex = nodesPerIndex + (patternIndex < extraNodes ? 1 : 0);

    // Generate nodes for this pattern index
    for (let localIndex = 0; localIndex < nodeCountForIndex; localIndex++) {
      // Stable node ID: pattern index + local index + signature
      // This ensures same node always has same ID regardless of nodeCount
      const nodeId = `node-${patternIndex}-${localIndex}-${signature}`;
      
      // Deterministic positioning based on pattern index (stable)
      const seed1 = (signature + patternIndex * 17 + localIndex * 7) % 97;
      const seed2 = (signature + patternIndex * 23 + localIndex * 11) % 89;
      const seed3 = (signature + patternIndex * 31 + localIndex * 13) % 83;
      
      // Use seeds to create non-aligned, non-centered distribution
      const baseX = FIELD_BOUNDS.min + (seed1 / 97) * (FIELD_BOUNDS.max - FIELD_BOUNDS.min);
      const baseY = FIELD_BOUNDS.min + (seed2 / 89) * (FIELD_BOUNDS.max - FIELD_BOUNDS.min);
      
      // Add depth-based phase and memory-based offset
      const phase = (depth * 0.15 + patternIndex * 0.1 + localIndex * 0.05) % 1;
      const memoryOffset = memory * 8;
      const finalX = clamp(baseX + Math.cos(phase * Math.PI * 2) * memoryOffset, FIELD_BOUNDS.min, FIELD_BOUNDS.max);
      const finalY = clamp(baseY + Math.sin(phase * Math.PI * 2) * memoryOffset, FIELD_BOUNDS.min, FIELD_BOUNDS.max);

      const luminosity = clamp(intensity * 0.5 + memory * 0.5, 0, 1);
      const pulsePhase = ((patternIndex * 7 + localIndex + signature) % 7) / 7;
      
      // Deterministic glyph selection (stable per pattern index)
      const glyphIndex = (signature + patternIndex + localIndex) % GLYPHS.length;
      const glyph = GLYPHS[glyphIndex];

      nodes.push({
        patternIndex, // Stable: always maps to same pattern index
        nodeId, // Stable: deterministic identity
        x: finalX,
        y: finalY,
        luminosity,
        distortion,
        pulsePhase,
        glyph,
        memoryWeight: memory,
      });
    }
  }

  return nodes;
}

function computePatternSignature(pattern: Pattern): number {
  return pattern.reduce((sum, val, idx) => sum + (val + 1) * (idx + 1), 0);
}

function deriveHistoryVector(nodes: any[], length: number): number[] {
  if (length === 0 || nodes.length === 0) {
    return new Array(length).fill(0);
  }

  const vector = new Array(length).fill(0);
  const counts = new Array(length).fill(0);

  nodes.forEach(node => {
    if (!node.pattern || node.pattern.length === 0) return;
    const sourceLength = node.pattern.length;
    for (let i = 0; i < length; i++) {
      const sourceIndex = Math.min(sourceLength - 1, Math.floor((i / length) * sourceLength));
      vector[i] += node.pattern[sourceIndex];
      counts[i] += 1 + (node.depth ?? 0) * 0.1;
    }
  });

  return vector.map((sum, index) => {
    const denom = counts[index] || 1;
    return clamp(sum / denom / MAX_CELL_STATE, 0, 1);
  });
}

function deriveDistortionMap(nodes: any[], length: number, depth: number): number[] {
  if (length === 0 || nodes.length === 0) {
    return new Array(length).fill(0);
  }

  const distortion = new Array(length).fill(0);
  let max = 0;

  const ordered = [...nodes].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  ordered.forEach((node, orderIndex) => {
    if (!node.pattern || node.pattern.length === 0) return;
    const weight = 1 + (node.depth ?? 0) * 0.2 + orderIndex / Math.max(1, ordered.length);
    const sourceLength = node.pattern.length;

    for (let i = 0; i < length; i++) {
      const sourceIndex = Math.min(sourceLength - 1, Math.floor((i / length) * sourceLength));
      distortion[i] += (node.pattern[sourceIndex] ?? 0) * weight;
      if (distortion[i] > max) {
        max = distortion[i];
      }
    }
  });

  if (max === 0) {
    return distortion;
  }

  return distortion.map(value => clamp(value / max, 0, 1));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
