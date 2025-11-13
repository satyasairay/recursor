/**
 * Ambient State Engine - State-driven motion without loops
 * 
 * Generates deterministic micro-variations from recursion state.
 * No time-based cycles, only state-derived transforms.
 */

import { Pattern } from './types';

/**
 * Deterministic hash function for state-based variations.
 */
function hashState(patternSignature: number, depth: number, mutationCount: number, offset: number): number {
  let h = patternSignature;
  h = ((h << 5) - h + depth) | 0;
  h = ((h << 5) - h + mutationCount) | 0;
  h = ((h << 5) - h + offset) | 0;
  return Math.abs(h) % 10000;
}

/**
 * Generates deterministic phase from state.
 * Returns value in [0, 1) that changes with state, never loops.
 */
export function getStatePhase(
  patternSignature: number,
  depth: number,
  mutationCount: number,
  baseOffset: number = 0
): number {
  const hash = hashState(patternSignature, depth, mutationCount, baseOffset);
  return (hash / 10000) % 1;
}

/**
 * Generates deterministic jitter offset from state.
 * Ensures non-zero baseline to prevent freeze.
 */
export function getJitterOffset(
  patternSignature: number,
  depth: number,
  mutationCount: number,
  entropy: number,
  baseOffset: number = 0
): { x: number; y: number } {
  const phaseX = getStatePhase(patternSignature, depth, mutationCount, baseOffset);
  const phaseY = getStatePhase(patternSignature, depth, mutationCount, baseOffset + 1000);
  
  // Clamp to non-zero baseline (0.1 to 1.0)
  const jitterBase = 0.1;
  const jitterAmplitude = jitterBase + entropy * 0.9;
  
  return {
    x: (phaseX - 0.5) * jitterAmplitude,
    y: (phaseY - 0.5) * jitterAmplitude,
  };
}

/**
 * Generates deterministic opacity from state.
 * Never returns to exact same value unless state is identical.
 */
export function getStateOpacity(
  patternSignature: number,
  depth: number,
  mutationCount: number,
  base: number,
  range: number,
  baseOffset: number = 0
): number {
  const phase = getStatePhase(patternSignature, depth, mutationCount, baseOffset);
  return base + (phase * range);
}

/**
 * Generates deterministic scale from state.
 */
export function getStateScale(
  patternSignature: number,
  depth: number,
  mutationCount: number,
  base: number,
  range: number,
  baseOffset: number = 0
): number {
  const phase = getStatePhase(patternSignature, depth, mutationCount, baseOffset);
  return base + ((phase - 0.5) * range);
}

/**
 * Generates deterministic rotation from state.
 */
export function getStateRotation(
  patternSignature: number,
  depth: number,
  mutationCount: number,
  baseOffset: number = 0
): number {
  const phase = getStatePhase(patternSignature, depth, mutationCount, baseOffset);
  return phase * 360;
}

/**
 * Generates background morph parameters from state.
 */
export function getBackgroundMorph(
  patternSignature: number,
  depth: number,
  mutationCount: number
): {
  opacity: number;
  scale: number;
  translateX: number;
  translateY: number;
} {
  const opacityPhase = getStatePhase(patternSignature, depth, mutationCount, 2000);
  const scalePhase = getStatePhase(patternSignature, depth, mutationCount, 3000);
  const translateXPhase = getStatePhase(patternSignature, depth, mutationCount, 4000);
  const translateYPhase = getStatePhase(patternSignature, depth, mutationCount, 5000);
  
  return {
    opacity: 0.08 + (opacityPhase * 0.1), // 0.08 to 0.18
    scale: 1 + ((scalePhase - 0.5) * 0.02), // 0.99 to 1.01
    translateX: (translateXPhase - 0.5) * 1,
    translateY: (translateYPhase - 0.5) * 1,
  };
}

