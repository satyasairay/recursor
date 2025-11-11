import Dexie, { Table } from 'dexie';
import { RecursionSession, SessionStats, Pattern, RecursionDepth } from './types';
import { EVOLUTION_HISTORY_SIZE } from './constants';
import { evolvePattern as evolvePatternEngine } from './mutationEngine';

/**
 * IndexedDB database for persisting recursive sessions.
 * Stores user interaction history for pattern evolution and visualization.
 */
class RecursionDatabase extends Dexie {
  sessions!: Table<RecursionSession>;

  constructor() {
    super('RecursorDB');
    this.version(1).stores({
      sessions: '++id, timestamp, depth, completed'
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
