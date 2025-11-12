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
// MEMORY GRAPH (The Soul)
// ============================================================================

/**
 * MEMORY NODE: A single point in the user's cognitive graph.
 * Each node represents a unique pattern state and its relationships.
 * Nodes decay over time but never fully disappear.
 */
export interface MemoryNode {
  id?: number;
  timestamp: number;
  patternSignature: string;      // Hash of the pattern for uniqueness
  pattern: Pattern;               // The actual pattern at this moment
  depth: RecursionDepth;
  branchOrigin: string | null;   // ID of parent node (future branching)
  weight: number;                 // Importance/frequency (0-1, decays over time)
  connections: number[];          // IDs of related nodes
  lastAccessed: number;           // Last time this node was referenced
  sessionId: number;              // Which session created this node
}

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
// ACHIEVEMENTS (Hidden Insights)
// ============================================================================

/**
 * ACHIEVEMENT: A hidden milestone that reveals user behavior patterns.
 * Earned silently, revealed subtly in constellation.
 */
export interface Achievement {
  id?: number;
  code: AchievementCode;
  timestamp: number;
  sessionId: number;
  metadata: AchievementMetadata;
  revealed: boolean; // Whether user has seen it in constellation
}

export type AchievementCode =
  | 'looped_path'        // Same pattern/branch 3+ times
  | 'the_scatterer'      // High chaos mutations consistently
  | 'the_diver'          // Depth > 10 without reset
  | 'echo_state'         // Exact pattern repetition
  | 'perfect_symmetry'   // Created perfectly symmetric pattern
  | 'void_gazer'         // Stayed at depth 0 for extended time
  | 'connection_weaver'  // Created 10+ node connections
  | 'decay_master'       // All nodes below 0.3 weight
  | 'rapid_descent'      // Reached depth 5 in under 2 minutes
  | 'pattern_monk'       // 100+ pattern mutations in one session;

export interface AchievementMetadata {
  depth?: number;
  value?: number;
  pattern?: Pattern;
  description?: string;
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
