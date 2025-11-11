import Dexie, { Table } from 'dexie';
import { RecursionSession, SessionStats } from './types';
import { EVOLUTION_HISTORY_SIZE } from './constants';

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
// PATTERN EVOLUTION ENGINE
// ============================================================================

/**
 * Evolve a pattern based on the user's historical behavior.
 * Analyzes recent sessions to determine mutation strategy.
 * 
 * @param currentPattern - The pattern to evolve
 * @returns A new mutated pattern
 */
export const evolvePattern = async (currentPattern: number[]): Promise<number[]> => {
  const recentSessions = await db.sessions
    .orderBy('timestamp')
    .reverse()
    .limit(EVOLUTION_HISTORY_SIZE)
    .toArray();

  if (recentSessions.length === 0) return currentPattern;

  // Calculate which cell to mutate based on historical pattern data
  // This creates a deterministic but seemingly "intelligent" evolution
  const mutation = recentSessions
    .flatMap(s => s.patterns)
    .reduce((acc, val) => acc + (val % 3), 0) % currentPattern.length;

  const evolved = [...currentPattern];
  evolved[mutation] = (evolved[mutation] + 1) % 4;
  
  return evolved;
}
