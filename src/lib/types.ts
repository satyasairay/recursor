/**
 * RECURSOR Core Type System
 * 
 * This file defines the fundamental vocabulary and data structures
 * that power the recursive experience engine.
 */

// ============================================================================
// CORE VOCABULARY
// ============================================================================

/**
 * PATTERN: A linear sequence of cells representing the current puzzle state.
 * Patterns evolve through user interaction and historical analysis.
 * Patterns are always flat arrays for consistency and predictability.
 */
export type Pattern = number[];

/**
 * CELL: A single interactive unit within a pattern.
 * Each cell has a state (0-3) representing its evolution level.
 * 
 * Cell States:
 * 0 = Empty/dormant
 * 1 = Awakening
 * 2 = Active
 * 3 = Complete/mature
 */
export interface Cell {
  index: number;
  state: CellState;
}

export type CellState = 0 | 1 | 2 | 3;

// ============================================================================
// MUTATION ENGINE TYPES
// ============================================================================

/**
 * CLUSTER: A repeated sequence detected within a pattern.
 * Used for intelligent mutation that preserves or disrupts structure.
 */
export interface PatternCluster {
  sequence: number[];
  positions: number[];  // Starting positions of each occurrence
  length: number;       // Length of the repeating sequence
  frequency: number;    // How many times it appears
}

/**
 * MUTATION WEIGHTS: Parameters that control pattern evolution behavior.
 * Calculated based on depth, entropy, clusters, and decay.
 */
export interface MutationWeights {
  strength: number;         // Overall mutation intensity (0-2.5)
  chaos: number;            // Randomness level (0-1)
  depthInfluence: number;   // How much depth affects mutation
  entropyInfluence: number; // How much entropy affects mutation
  clusterInfluence: number; // How much clustering affects mutation
  decayInfluence: number;   // How much decay affects mutation
}

/**
 * DEPTH: How many recursive layers deep the user has descended.
 * Each portal entry increases depth by 1.
 * Depth affects visual presentation and pattern evolution.
 */
export type RecursionDepth = number;

/**
 * BRANCH: A unique path through the recursion tree.
 * Currently linear, but future versions may support branching.
 * Reserved for future multi-path recursion.
 */
export interface Branch {
  id: string;
  parentId: string | null;
  depth: RecursionDepth;
  pattern: Pattern;
}

/**
 * NODE: A single point of interaction in the recursion tree.
 * Represents a decision or mutation event.
 */
export interface Node {
  timestamp: number;
  depth: RecursionDepth;
  action: NodeAction;
  patternState: Pattern;
}

export type NodeAction = 
  | 'pattern-mutation'
  | 'portal-entry'
  | 'session-start'
  | 'session-complete';

// ============================================================================
// SESSION TRACKING
// ============================================================================

/**
 * MEMORY: A completed recursive session stored in IndexedDB.
 * Represents the user's journey through one complete recursion cycle.
 */
export interface RecursionSession {
  id?: number;
  timestamp: number;
  depth: RecursionDepth;
  decisions: string[];
  patterns: number[]; // Flattened history of all pattern states
  completed: boolean;
  decayFactor: number; // Time-based influence factor (0.5-1.0, where 1 = fresh)
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  duration: number;
  interactionCount: number;
  uniquePatterns: number;
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

export interface SessionStats {
  totalSessions: number;
  avgDepth: number;
  maxDepth: number;
  completionRate: number;
  oldestSession: number | null;
}

// ============================================================================
// UI STATE
// ============================================================================

export interface EngineState {
  depth: RecursionDepth;
  pattern: Pattern;
  sessionId: number | null;
  sessionStart: number;
  interactionCount: number;
  showPortal: boolean;
  isTransitioning: boolean;
}
