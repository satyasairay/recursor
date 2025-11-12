import Dexie, { Table } from 'dexie';
import { RecursionSession, SessionStats, Pattern, RecursionDepth, MemoryNode, Achievement } from './types';
import { EVOLUTION_HISTORY_SIZE, WEIGHT_DECAY_RATE, MIN_NODE_WEIGHT, MAX_NODE_CONNECTIONS, SIMILARITY_THRESHOLD } from './constants';
import { evolvePattern as evolvePatternEngine } from './mutationEngine';

/**
 * IndexedDB database for persisting recursive sessions, memory nodes, and achievements.
 * Stores user interaction history for pattern evolution and visualization.
 */
class RecursionDatabase extends Dexie {
  sessions!: Table<RecursionSession>;
  nodes!: Table<MemoryNode>;
  achievements!: Table<Achievement>;

  constructor() {
    super('RecursorDB');
    this.version(3).stores({
      sessions: '++id, timestamp, depth, completed',
      nodes: '++id, timestamp, sessionId, lastAccessed, weight',
      achievements: '++id, sessionId, code, timestamp, revealed'
    });
  }
}

export const db = new RecursionDatabase();

// ============================================================================
// SESSION ANALYTICS
// ============================================================================

/**
 * Calculate aggregate statistics across all recorded sessions.
 */
export const getSessionStats = async (): Promise<SessionStats> => {
  const sessions = await db.sessions.toArray();
  const totalDepth = sessions.reduce((sum, s) => sum + s.depth, 0);
  const avgDepth = sessions.length ? totalDepth / sessions.length : 0;
  const maxDepth = Math.max(...sessions.map(s => s.depth), 0);
  const completionRate = sessions.length 
    ? sessions.filter(s => s.completed).length / sessions.length 
    : 0;

  return {
    totalSessions: sessions.length,
    avgDepth,
    maxDepth,
    completionRate,
    oldestSession: sessions.length ? Math.min(...sessions.map(s => s.timestamp)) : null,
  };
};

// ============================================================================
// DECAY CALCULATION
// ============================================================================

/**
 * Calculate decay factor for a session based on time since last access.
 * Fresh sessions have factor of 1.0, older sessions decay toward 0.5.
 * 
 * @param lastAccessed - Timestamp of last access
 * @param currentTime - Current timestamp (defaults to now)
 * @returns Decay factor between 0.5 and 1.0
 */
export const calculateDecayFactor = (lastAccessed: number, currentTime: number = Date.now()): number => {
  const daysSince = (currentTime - lastAccessed) / (1000 * 60 * 60 * 24);
  
  // Exponential decay: starts at 1.0, decays to 0.5 over 7 days
  const decayRate = 0.1; // ~10% per day
  const decayed = Math.exp(-decayRate * daysSince);
  
  // Clamp between 0.5 and 1.0 (never fully disappear)
  return Math.max(0.5, Math.min(1.0, decayed));
};

// ============================================================================
// PATTERN EVOLUTION ENGINE (Wrapper)
// ============================================================================

/**
 * Evolve a pattern based on the user's historical behavior.
 * This is a wrapper around the sophisticated mutation engine.
 * 
 * @param currentPattern - The pattern to evolve
 * @param depth - Current recursion depth
 * @param enableBranching - Whether to enable branching logic
 * @returns A new mutated pattern
 */
export const evolvePattern = async (
  currentPattern: Pattern,
  depth: RecursionDepth,
  enableBranching: boolean = false
): Promise<Pattern> => {
  const recentSessions = await db.sessions
    .orderBy('timestamp')
    .reverse()
    .limit(EVOLUTION_HISTORY_SIZE)
    .toArray();

  // Aggregate recent patterns
  const recentPatterns = recentSessions.flatMap(s => s.patterns);
  
  // Calculate average decay factor from recent sessions
  const avgDecayFactor = recentSessions.length > 0
    ? recentSessions.reduce((sum, s) => sum + s.decayFactor, 0) / recentSessions.length
    : 1.0;

  // Use the sophisticated mutation engine
  return evolvePatternEngine(
    currentPattern,
    depth,
    recentPatterns,
    avgDecayFactor,
    enableBranching
  );
};

// ============================================================================
// MEMORY GRAPH SYSTEM
// ============================================================================

/**
 * Create a unique signature for a pattern.
 * Used to identify similar patterns across sessions.
 */
export const createPatternSignature = (pattern: Pattern): string => {
  return pattern.join('-');
};

/**
 * Calculate similarity between two patterns (0-1, where 1 = identical).
 */
const calculatePatternSimilarity = (p1: Pattern, p2: Pattern): number => {
  if (p1.length !== p2.length) return 0;
  
  let matches = 0;
  for (let i = 0; i < p1.length; i++) {
    if (p1[i] === p2[i]) matches++;
  }
  
  return matches / p1.length;
};

/**
 * Apply time-based decay to a node's weight.
 */
export const applyWeightDecay = (weight: number, lastAccessed: number): number => {
  const daysSince = (Date.now() - lastAccessed) / (1000 * 60 * 60 * 24);
  const decayed = weight * Math.exp(-WEIGHT_DECAY_RATE * daysSince);
  return Math.max(MIN_NODE_WEIGHT, decayed);
};

/**
 * Create a new memory node from a pattern change.
 * Automatically finds and creates connections to similar nodes.
 */
export const createMemoryNode = async (
  pattern: Pattern,
  depth: RecursionDepth,
  sessionId: number,
  branchOrigin: string | null = null
): Promise<number> => {
  const signature = createPatternSignature(pattern);
  const now = Date.now();

  // Check if this exact pattern already exists
  const existingNode = await db.nodes
    .where('patternSignature')
    .equals(signature)
    .first();

  if (existingNode && existingNode.id) {
    // Update existing node: increase weight and refresh lastAccessed
    const newWeight = Math.min(1.0, existingNode.weight + 0.1);
    await db.nodes.update(existingNode.id, {
      weight: newWeight,
      lastAccessed: now,
    });
    return existingNode.id;
  }

  // Find similar nodes for connections
  const recentNodes = await db.nodes
    .orderBy('lastAccessed')
    .reverse()
    .limit(50)
    .toArray();

  const connections: number[] = [];
  for (const node of recentNodes) {
    if (node.id && connections.length < MAX_NODE_CONNECTIONS) {
      const similarity = calculatePatternSimilarity(pattern, node.pattern);
      if (similarity >= SIMILARITY_THRESHOLD) {
        connections.push(node.id);
      }
    }
  }

  // Create new node
  const newNode: MemoryNode = {
    timestamp: now,
    patternSignature: signature,
    pattern,
    depth,
    branchOrigin,
    weight: 1.0, // Start at full weight
    connections,
    lastAccessed: now,
    sessionId,
  };

  return await db.nodes.add(newNode);
};

/**
 * Apply decay to all nodes in the database.
 * Should be called periodically or on app start.
 */
export const decayAllNodes = async (): Promise<void> => {
  const nodes = await db.nodes.toArray();
  
  for (const node of nodes) {
    if (!node.id) continue;
    
    const newWeight = applyWeightDecay(node.weight, node.lastAccessed);
    await db.nodes.update(node.id, { weight: newWeight });
  }
};

/**
 * Get node statistics for analytics.
 */
export const getNodeStats = async () => {
  const nodes = await db.nodes.toArray();
  const totalWeight = nodes.reduce((sum, n) => sum + n.weight, 0);
  const avgWeight = nodes.length ? totalWeight / nodes.length : 0;
  const totalConnections = nodes.reduce((sum, n) => sum + n.connections.length, 0);
  
  return {
    totalNodes: nodes.length,
    avgWeight,
    totalConnections,
    avgConnectionsPerNode: nodes.length ? totalConnections / nodes.length : 0,
  };
};
