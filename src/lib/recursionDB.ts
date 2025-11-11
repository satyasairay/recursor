import Dexie, { Table } from 'dexie';

export interface RecursionSession {
  id?: number;
  timestamp: number;
  depth: number;
  decisions: string[];
  patterns: number[];
  completed: boolean;
  decayFactor: number;
  metadata: {
    duration: number;
    interactionCount: number;
    uniquePatterns: number;
  };
}

export interface MemoryNode {
  id?: number;
  sessionId: number;
  pattern: string;
  weight: number;
  connections: number[];
  lastAccessed: number;
}

class RecursionDatabase extends Dexie {
  sessions!: Table<RecursionSession>;
  memories!: Table<MemoryNode>;

  constructor() {
    super('RecursorDB');
    this.version(1).stores({
      sessions: '++id, timestamp, depth, completed',
      memories: '++id, sessionId, lastAccessed, weight'
    });
  }
}

export const db = new RecursionDatabase();

// Memory decay system
export const calculateDecay = (lastAccessed: number): number => {
  const daysSince = (Date.now() - lastAccessed) / (1000 * 60 * 60 * 24);
  return Math.max(0.1, 1 - (daysSince * 0.05));
};

// Session analytics
export const getSessionStats = async () => {
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

// Pattern evolution
export const evolvePattern = async (currentPattern: number[]): Promise<number[]> => {
  const recentSessions = await db.sessions
    .orderBy('timestamp')
    .reverse()
    .limit(5)
    .toArray();

  if (recentSessions.length === 0) return currentPattern;

  // Mutate based on user's historical patterns
  const mutation = recentSessions
    .flatMap(s => s.patterns)
    .reduce((acc, val, idx, arr) => acc + (val % 3), 0) % currentPattern.length;

  const evolved = [...currentPattern];
  evolved[mutation] = (evolved[mutation] + 1) % 4;
  
  return evolved;
};
