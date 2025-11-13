/**
 * Regression Guards - Type Safety & Invariant Enforcement
 * 
 * This module provides type-level and runtime guarantees that prevent
 * the visual layer from breaking the engine, memory model, or persistence.
 */

import { Pattern } from './types';

// ============================================================================
// TYPE-LEVEL GUARANTEES
// ============================================================================

/**
 * Read-only pattern type. Prevents mutation of pattern arrays.
 */
export type ReadOnlyPattern = readonly Pattern;

/**
 * Pattern change callback type. Enforces that PatternField can only
 * emit new patterns, never mutate state directly.
 */
export type PatternChangeCallback = (newPattern: Pattern) => void;

/**
 * Cell selection callback type. PatternField can only emit indices,
 * never mutate depth or session state.
 */
export type CellSelectCallback = (index: number) => void;

// ============================================================================
// INVARIANT CHECKS
// ============================================================================

/**
 * Validates that a pattern is valid before processing.
 * Throws if pattern is invalid (prevents engine corruption).
 */
export function validatePattern(pattern: unknown): asserts pattern is Pattern {
  if (!Array.isArray(pattern)) {
    throw new Error('[RegressionGuard] Pattern must be an array');
  }
  if (pattern.length === 0) {
    throw new Error('[RegressionGuard] Pattern cannot be empty');
  }
  if (!pattern.every(val => typeof val === 'number' && val >= 0 && val <= 3)) {
    throw new Error('[RegressionGuard] Pattern values must be 0-3');
  }
}

/**
 * Validates that depth is a non-negative integer.
 * Prevents invalid depth mutations.
 */
export function validateDepth(depth: unknown): asserts depth is number {
  if (typeof depth !== 'number' || !Number.isInteger(depth) || depth < 0) {
    throw new Error('[RegressionGuard] Depth must be non-negative integer');
  }
}

/**
 * Validates that mutation count is non-negative.
 */
export function validateMutationCount(count: unknown): asserts count is number {
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
    throw new Error('[RegressionGuard] Mutation count must be non-negative integer');
  }
}

// ============================================================================
// ARCHITECTURAL INVARIANTS
// ============================================================================

/**
 * Runtime check: Ensures PatternField never receives functions that could
 * mutate engine state. Only pattern change callbacks are allowed.
 */
export function validatePatternFieldProps(props: {
  onPatternChange: unknown;
  onCellSelect?: unknown;
  pattern: unknown;
  depth: unknown;
  mutationCount?: unknown;
}): void {
  validatePattern(props.pattern);
  validateDepth(props.depth);
  
  if (typeof props.onPatternChange !== 'function') {
    throw new Error('[RegressionGuard] onPatternChange must be a function');
  }
  
  if (props.mutationCount !== undefined) {
    validateMutationCount(props.mutationCount);
  }
  
  // Guard: Ensure callback doesn't have access to engine internals
  const callbackStr = props.onPatternChange.toString();
  if (callbackStr.includes('setDepth') || callbackStr.includes('setSessionId')) {
    throw new Error('[RegressionGuard] onPatternChange must not mutate depth or session');
  }
}

/**
 * Ensures visual layer cannot access memory write functions.
 * This is a compile-time and runtime guard.
 */
export const MEMORY_WRITE_FUNCTIONS = [
  'createMemoryNode',
  'updateSession',
  'setDepth',
  'setSessionId',
] as const;

/**
 * Checks if a function name is a protected memory write function.
 */
export function isProtectedFunction(name: string): boolean {
  return MEMORY_WRITE_FUNCTIONS.some(funcName => name.includes(funcName));
}

// ============================================================================
// DETERMINISTIC RENDERING GUARANTEES
// ============================================================================

/**
 * Deterministic hash function for pattern signatures.
 * Same input always produces same output (no randomness).
 */
export function deterministicHash(pattern: Pattern, depth: number, memoryHash: number): number {
  let hash = 0;
  for (let i = 0; i < pattern.length; i++) {
    hash = ((hash << 5) - hash + pattern[i]) | 0;
    hash = ((hash << 5) - hash + i) | 0;
  }
  hash = ((hash << 5) - hash + depth) | 0;
  hash = ((hash << 5) - hash + memoryHash) | 0;
  return hash >>> 0; // Convert to unsigned 32-bit integer
}

/**
 * Validates that a rendering function is deterministic.
 * Checks that it doesn't use Math.random() or Date.now() for layout.
 */
export function assertDeterministic(code: string, functionName: string): void {
  const randomPattern = /Math\.random\(\)/g;
  const datePattern = /Date\.now\(\)/g;
  const timePattern = /performance\.now\(\)/g;
  
  if (randomPattern.test(code)) {
    throw new Error(`[RegressionGuard] ${functionName} must not use Math.random() for deterministic rendering`);
  }
  if (datePattern.test(code) || timePattern.test(code)) {
    throw new Error(`[RegressionGuard] ${functionName} must not use time-based functions for layout`);
  }
}

