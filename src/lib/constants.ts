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
// PATTERN FIELD VISUAL CONSTANTS
// ============================================================================

/**
 * Minimum number of nodes in the pattern field.
 */
export const MIN_NODE_COUNT = 20;

/**
 * Maximum number of nodes in the pattern field.
 */
export const MAX_NODE_COUNT = 40;

/**
 * Base radius for node placement (viewBox units).
 */
export const NODE_BASE_RADIUS = 20;

/**
 * Radius per depth increment (viewBox units).
 */
export const NODE_RADIUS_PER_DEPTH = 1.2;

/**
 * Minimum node radius (viewBox units).
 */
export const NODE_MIN_RADIUS = 16;

/**
 * Maximum node radius (viewBox units).
 */
export const NODE_MAX_RADIUS = 42;

/**
 * Base glow radius for nodes (viewBox units).
 */
export const NODE_GLOW_BASE = 2.5;

/**
 * Glow radius multiplier for luminosity.
 */
export const NODE_GLOW_LUMINOSITY_MULT = 4.5;

/**
 * Glow radius multiplier for distortion.
 */
export const NODE_GLOW_DISTORTION_MULT = 3;

/**
 * Base opacity for nodes.
 */
export const NODE_OPACITY_BASE = 0.25;

/**
 * Opacity multiplier for luminosity.
 */
export const NODE_OPACITY_LUMINOSITY_MULT = 0.65;

/**
 * Base hue for nodes.
 */
export const NODE_BASE_HUE = 190;

/**
 * Hue shift per depth.
 */
export const NODE_HUE_PER_DEPTH = 10;

/**
 * Hue shift per distortion unit.
 */
export const NODE_HUE_PER_DISTORTION = 40;

/**
 * Base saturation for nodes.
 */
export const NODE_SATURATION = 75;

/**
 * Base lightness for nodes.
 */
export const NODE_LIGHTNESS_BASE = 45;

/**
 * Lightness multiplier for luminosity.
 */
export const NODE_LIGHTNESS_LUMINOSITY_MULT = 25;

/**
 * Field bounds (viewBox units).
 */
export const FIELD_BOUNDS = { min: 8, max: 92 };

/**
 * Depth gradient base hue.
 */
export const FIELD_DEPTH_HUE_BASE = 195;

/**
 * Depth gradient hue per depth.
 */
export const FIELD_DEPTH_HUE_PER_DEPTH = 8;

/**
 * Depth gradient secondary hue base.
 */
export const FIELD_DEPTH_HUE_SECONDARY_BASE = 205;

/**
 * Depth gradient secondary hue per depth.
 */
export const FIELD_DEPTH_HUE_SECONDARY_PER_DEPTH = 6;

/**
 * Resonance pulse stroke hue base.
 */
export const PULSE_HUE_BASE = 200;

/**
 * Resonance pulse hue per depth.
 */
export const PULSE_HUE_PER_DEPTH = 12;

/**
 * Resonance pulse stroke saturation.
 */
export const PULSE_SATURATION = 80;

/**
 * Resonance pulse stroke lightness.
 */
export const PULSE_LIGHTNESS = 70;

/**
 * Resonance pulse stroke opacity.
 */
export const PULSE_OPACITY = 0.4;

/**
 * Resonance pulse maximum radius (viewBox units).
 */
export const PULSE_MAX_RADIUS = 48;

/**
 * Resonance pulse duration (ms).
 */
export const PULSE_DURATION = 1200;

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
