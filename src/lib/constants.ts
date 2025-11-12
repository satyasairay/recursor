/**
 * RECURSOR Core Constants
 * 
 * Immutable values that define the system's behavior.
 */

import { Pattern } from './types';

// ============================================================================
// PATTERN CONSTANTS
// ============================================================================

/**
 * The initial pattern shown to every user on first load.
 * Carefully designed to be solvable but not obvious.
 */
export const INITIAL_PATTERN: Pattern = [0, 1, 2, 1, 0, 1, 2, 3, 0];

/**
 * Number of cells that must be selected to mutate the pattern.
 */
export const CELLS_TO_SELECT = 3;

/**
 * Maximum cell state value before wrapping to 0.
 */
export const MAX_CELL_STATE = 3;

/**
 * A pattern is considered "complete" when all cells reach this threshold.
 */
export const COMPLETION_THRESHOLD = 3;

// ============================================================================
// VISUAL CONSTANTS
// ============================================================================

/**
 * Base hue for color generation (cyan-ish starting point).
 */
export const BASE_HUE = 180;

/**
 * How much the hue shifts per recursion depth level.
 */
export const HUE_SHIFT_PER_DEPTH = 30;

/**
 * Duration of portal transition animation (ms).
 */
export const PORTAL_TRANSITION_DURATION = 1000;

/**
 * Duration of pattern reveal animation per cell (ms).
 */
export const CELL_REVEAL_DELAY = 50;

// ============================================================================
// SESSION CONSTANTS
// ============================================================================

/**
 * Number of recent sessions to consider for pattern evolution.
 */
export const EVOLUTION_HISTORY_SIZE = 5;

// ============================================================================
// MUTATION ENGINE CONSTANTS
// ============================================================================

/**
 * Branching occurs every N depths.
 */
export const BRANCHING_INTERVAL = 3;

/**
 * Number of branches to generate at branching points.
 */
export const BRANCH_COUNT = 3;

/**
 * Minimum cluster length to detect in patterns.
 */
export const MIN_CLUSTER_LENGTH = 2;

// ============================================================================
// MEMORY GRAPH CONSTANTS
// ============================================================================

/**
 * Weight decay rate per day (weights decay to minimum over time).
 */
export const WEIGHT_DECAY_RATE = 0.05; // 5% per day

/**
 * Minimum weight a node can decay to (never fully disappears).
 * Lowered to 0.3 to allow deeper fade while maintaining presence.
 */
export const MIN_NODE_WEIGHT = 0.3;

/**
 * Maximum connections per node.
 */
export const MAX_NODE_CONNECTIONS = 5;

/**
 * Pattern similarity threshold for connecting nodes (0-1).
 */
export const SIMILARITY_THRESHOLD = 0.6;

// ============================================================================
// OPTIMIZATION FLAGS
// ============================================================================

/**
 * Enable scalable cluster detection using Map-based approach.
 * Automatically activates for grids larger than 3×3.
 */
export const CLUSTER_DETECT_SCALABLE = false;
