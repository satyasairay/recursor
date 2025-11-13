/**
 * PatternField - Pure presentation layer for pattern visualization
 * 
 * This component is 100% presentation-only. It receives (pattern, depth, memory, mutationCount)
 * and renders a deterministic visual field. All logic (mutation, depth, memory writes) is owned
 * by RecursiveEngine.
 * 
 * Deterministic behavior:
 * - Node count: f(pattern signature) → 7-11 nodes
 * - Node positions: f(pattern, depth, historyNodes) → deterministic placement
 * - Luminosity: f(cell value, memory) → deterministic brightness
 * - Distortion: f(historyNodes, depth) → deterministic warping
 * - Pulse phase: f(nodeIndex, pattern signature) → deterministic timing
 * 
 * No randomness. All visual output is a pure function of inputs.
 */
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Pattern } from '@/lib/types';
import {
  CELLS_TO_SELECT,
  MAX_CELL_STATE,
  MIN_NODE_COUNT,
  NODE_BASE_RADIUS,
  NODE_RADIUS_PER_DEPTH,
  NODE_MIN_RADIUS,
  NODE_MAX_RADIUS,
  NODE_GLOW_BASE,
  NODE_GLOW_LUMINOSITY_MULT,
  NODE_GLOW_DISTORTION_MULT,
  NODE_OPACITY_BASE,
  NODE_OPACITY_LUMINOSITY_MULT,
  NODE_BASE_HUE,
  NODE_HUE_PER_DEPTH,
  NODE_HUE_PER_DISTORTION,
  NODE_SATURATION,
  NODE_LIGHTNESS_BASE,
  NODE_LIGHTNESS_LUMINOSITY_MULT,
  FIELD_BOUNDS,
  FIELD_DEPTH_HUE_BASE,
  FIELD_DEPTH_HUE_PER_DEPTH,
  FIELD_DEPTH_HUE_SECONDARY_BASE,
  FIELD_DEPTH_HUE_SECONDARY_PER_DEPTH,
  PULSE_HUE_BASE,
  PULSE_HUE_PER_DEPTH,
  PULSE_SATURATION,
  PULSE_LIGHTNESS,
  PULSE_OPACITY,
  PULSE_MAX_RADIUS,
  PULSE_DURATION,
} from '@/lib/constants';
import { db } from '@/lib/recursionDB';

import { validatePattern, validateDepth, validateMutationCount, type PatternChangeCallback } from '@/lib/regressionGuards';

/**
 * PatternField Props - Strictly typed to prevent engine mutation
 * 
 * REGRESSION GUARANTEE: PatternField can ONLY:
 * - Receive read-only pattern, depth, mutationCount
 * - Emit onPatternChange(newPattern) callback
 * - NEVER mutate depth, sessionId, or memory directly
 */
interface PatternFieldProps {
  /** Read-only pattern array. PatternField cannot mutate this. */
  readonly pattern: Pattern;
  /** Callback to emit new pattern. Only way PatternField can affect engine. */
  readonly onPatternChange: PatternChangeCallback;
  /** Read-only depth. PatternField cannot change depth. */
  readonly depth: number;
  /** Whether interaction is locked (during transitions). */
  readonly locked?: boolean;
  /** Read-only mutation count for visual feedback. */
  readonly mutationCount?: number;
}

type NodeState = {
  index: number;
  x: number;
  y: number;
  luminosity: number;
  distortion: number;
  pulsePhase: number;
};

export const PatternField = ({ pattern, onPatternChange, depth, locked = false, mutationCount = 0 }: PatternFieldProps) => {
  // REGRESSION GUARD: Validate inputs at component boundary
  validatePattern(pattern);
  validateDepth(depth);
  if (mutationCount !== undefined) {
    validateMutationCount(mutationCount);
  }

  const historyNodes = useLiveQuery(() => db.nodes.toArray()) ?? [];
  const [selected, setSelected] = useState<number[]>([]);
  const [resonancePulse, setResonancePulse] = useState(0);
  
  // REGRESSION GUARANTEE: PatternField only reads from DB, never writes
  // All memory writes happen in RecursiveEngine.handlePatternChange

  useEffect(() => {
    setSelected([]);
  }, [pattern]);

  useEffect(() => {
    if (mutationCount > 0) {
      setResonancePulse(mutationCount);
    }
  }, [mutationCount]);

  const nodeCount = useMemo(() => {
    const signature = computePatternSignature(pattern);
    return MIN_NODE_COUNT + (signature % (MAX_NODE_COUNT - MIN_NODE_COUNT + 1));
  }, [pattern]);

  const nodes = useMemo(() => {
    return deriveNodes(pattern, depth, historyNodes, nodeCount);
  }, [pattern, depth, historyNodes, nodeCount]);

  /**
   * REGRESSION GUARANTEE: This is the ONLY way PatternField can affect the engine.
   * - Computes new pattern deterministically
   * - Emits via onPatternChange callback
   * - NEVER mutates depth, sessionId, or memory
   * - NEVER calls createMemoryNode, updateSession, or setDepth
   */
  const handleNodeSelect = (index: number) => {
    if (locked) return;

    const updated = selected.includes(index)
      ? selected.filter(i => i !== index)
      : [...selected, index];

    setSelected(updated);

    if (updated.length === CELLS_TO_SELECT) {
      // REGRESSION GUARANTEE: Pattern mutation is pure computation
      // No side effects, no memory writes, no depth changes
      const updatedPattern = pattern.map((value, i) =>
        updated.includes(i) ? (value + 1) % (MAX_CELL_STATE + 1) : value
      );

      // REGRESSION GUARANTEE: Only emit callback, never mutate engine state
      onPatternChange(updatedPattern);
      setSelected([]);
      setResonancePulse(prev => prev + 1);
    }
  };

  return (
    <div className="relative mx-auto w-[min(90vw,420px)] aspect-square">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="field-depth" cx="50%" cy="50%" r="60%">
            <stop
              offset="0%"
              stopColor={`hsla(${FIELD_DEPTH_HUE_BASE + depth * FIELD_DEPTH_HUE_PER_DEPTH}, 50%, 12%, 0.9)`}
            />
            <stop
              offset="70%"
              stopColor={`hsla(${FIELD_DEPTH_HUE_SECONDARY_BASE + depth * FIELD_DEPTH_HUE_SECONDARY_PER_DEPTH}, 35%, 4%, 0.4)`}
            />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="100" height="100" fill="url(#field-depth)" />

        {nodes.map(node => {
          const isSelected = selected.includes(node.index);
          const baseLuminosity = node.luminosity;
          const currentLuminosity = isSelected ? Math.min(1, baseLuminosity * 1.4) : baseLuminosity;
          const glowRadius =
            NODE_GLOW_BASE +
            currentLuminosity * NODE_GLOW_LUMINOSITY_MULT +
            node.distortion * NODE_GLOW_DISTORTION_MULT;
          const opacity = NODE_OPACITY_BASE + currentLuminosity * NODE_OPACITY_LUMINOSITY_MULT;
          const hue = NODE_BASE_HUE + depth * NODE_HUE_PER_DEPTH + node.distortion * NODE_HUE_PER_DISTORTION;

          return (
            <g key={`node-${node.index}`}>
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={glowRadius}
                fill={`hsla(${hue}, ${NODE_SATURATION}%, ${NODE_LIGHTNESS_BASE + currentLuminosity * NODE_LIGHTNESS_LUMINOSITY_MULT}%, ${opacity})`}
                onClick={() => handleNodeSelect(node.index)}
                style={{ cursor: locked ? 'default' : 'pointer' }}
                animate={{
                  opacity: [
                    0.2 + currentLuminosity * 0.4,
                    0.35 + currentLuminosity * 0.7,
                    0.2 + currentLuminosity * 0.4,
                  ],
                  scale: [
                    1 - node.distortion * 0.15,
                    1 + node.distortion * 0.2 + (isSelected ? 0.3 : 0),
                    1 - node.distortion * 0.15,
                  ],
                }}
                transition={{
                  duration: 3.5 - node.pulsePhase * 0.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: node.pulsePhase * 0.4,
                }}
              />
            </g>
          );
        })}

        {resonancePulse > 0 && (
          <motion.circle
            key={`pulse-${resonancePulse}`}
            cx="50"
            cy="50"
            r="0"
            fill="none"
            stroke={`hsla(${PULSE_HUE_BASE + depth * PULSE_HUE_PER_DEPTH}, ${PULSE_SATURATION}%, ${PULSE_LIGHTNESS}%, ${PULSE_OPACITY})`}
            strokeWidth={0.8}
            initial={{ r: 0, opacity: 0.6 }}
            animate={{
              r: PULSE_MAX_RADIUS,
              opacity: [0.6, 0.2, 0],
            }}
            transition={{
              duration: PULSE_DURATION / 1000,
              ease: 'easeOut',
            }}
          />
        )}
      </svg>
    </div>
  );
};

/**
 * Deterministic node derivation function.
 * Pure function: f(pattern, depth, historyNodes, nodeCount) → NodeState[]
 * No randomness. All outputs are deterministic hashes of inputs.
 */
function deriveNodes(pattern: Pattern, depth: number, historyNodes: any[], nodeCount: number): NodeState[] {
  if (pattern.length === 0) return [];

  const historyVector = deriveHistoryVector(historyNodes, pattern.length);
  const distortionMap = deriveDistortionMap(historyNodes, pattern.length, depth);

  const depthPhase = depth * 0.12; // Deterministic phase shift per depth
  const baseRadius = NODE_BASE_RADIUS + depth * NODE_RADIUS_PER_DEPTH;
  const signature = computePatternSignature(pattern);

  return Array.from({ length: nodeCount }, (_, nodeIndex) => {
    const patternIndex = Math.floor((nodeIndex / nodeCount) * pattern.length);
    const value = pattern[patternIndex] ?? 0;
    const intensity = value / MAX_CELL_STATE;
    const memory = historyVector[patternIndex] ?? 0;
    const distortion = distortionMap[patternIndex] ?? 0;

    const normalized = (nodeIndex + 0.5) / nodeCount;
    const angle = normalized * Math.PI * 2 + depthPhase + (memory - 0.5) * 1.2 + distortion * 0.8;
    const radiusVariation = memory * 18 + distortion * 22 + (signature % 13) * 0.3;
    const radius = clamp(baseRadius + radiusVariation, NODE_MIN_RADIUS, NODE_MAX_RADIUS);
    const ellipse = 0.75 + memory * 0.2;

    const x = clamp(50 + Math.cos(angle) * radius, FIELD_BOUNDS.min, FIELD_BOUNDS.max);
    const y = clamp(50 + Math.sin(angle) * radius * ellipse, FIELD_BOUNDS.min, FIELD_BOUNDS.max);

    const luminosity = clamp(intensity * 0.6 + memory * 0.4, 0, 1);
    const pulsePhase = ((nodeIndex + signature) % 5) / 5;

    return {
      index: patternIndex,
      x,
      y,
      luminosity,
      distortion,
      pulsePhase,
    };
  });
}

/**
 * Deterministic pattern signature hash.
 * Pure function: f(pattern) → number
 * Used for node count and pulse phase calculations.
 */
function computePatternSignature(pattern: Pattern): number {
  return pattern.reduce((sum, val, idx) => sum + (val + 1) * (idx + 1), 0);
}

/**
 * Derives history vector from memory nodes.
 * Pure function: f(nodes, length) → number[]
 * Computes average pattern values per index, weighted by depth.
 */
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

/**
 * Derives distortion map from memory nodes.
 * Pure function: f(nodes, length, depth) → number[]
 * Computes weighted pattern accumulation, normalized to [0, 1].
 */
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
