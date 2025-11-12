/**
 * RECURSOR Achievement Engine
 * 
 * Silently tracks user behavior and awards cryptic achievements.
 * No pop-ups, no explicit notifications - only subtle reveals in constellation.
 */

import { Pattern, Achievement, AchievementCode } from './types';
import { db } from './recursionDB';

/**
 * Achievement definitions with detection logic.
 */
const ACHIEVEMENT_DEFINITIONS = {
  looped_path: {
    name: 'Looped Path',
    crypticHint: 'The circle completes itself',
    check: async (sessionId: number): Promise<boolean> => {
      const nodes = await db.nodes.where('sessionId').equals(sessionId).toArray();
      if (nodes.length < 3) return false;
      
      // Check for pattern repetition
      const signatures = nodes.map(n => n.patternSignature);
      const counts = new Map<string, number>();
      
      for (const sig of signatures) {
        counts.set(sig, (counts.get(sig) || 0) + 1);
      }
      
      return Array.from(counts.values()).some(count => count >= 3);
    },
  },
  
  the_scatterer: {
    name: 'The Scatterer',
    crypticHint: 'Chaos recognizes chaos',
    check: async (sessionId: number): Promise<boolean> => {
      const session = await db.sessions.get(sessionId);
      if (!session) return false;
      
      // Check if high entropy/chaos maintained over time
      const nodes = await db.nodes.where('sessionId').equals(sessionId).toArray();
      if (nodes.length < 5) return false;
      
      // High chaos = many unique patterns relative to total interactions
      const uniquePatterns = new Set(nodes.map(n => n.patternSignature)).size;
      const chaosRatio = uniquePatterns / nodes.length;
      
      return chaosRatio > 0.8; // 80%+ unique patterns
    },
  },
  
  the_diver: {
    name: 'The Diver',
    crypticHint: 'Some descend further than others',
    check: async (sessionId: number): Promise<boolean> => {
      const session = await db.sessions.get(sessionId);
      return session ? session.depth >= 10 : false;
    },
  },
  
  echo_state: {
    name: 'Echo State',
    crypticHint: 'Memory stutters',
    check: async (sessionId: number): Promise<boolean> => {
      const nodes = await db.nodes.where('sessionId').equals(sessionId).toArray();
      if (nodes.length < 2) return false;
      
      // Check for immediate pattern repetition
      for (let i = 1; i < nodes.length; i++) {
        if (nodes[i].patternSignature === nodes[i - 1].patternSignature) {
          return true;
        }
      }
      
      return false;
    },
  },
  
  perfect_symmetry: {
    name: 'Perfect Symmetry',
    crypticHint: 'The mirror shows truth',
    check: async (sessionId: number): Promise<boolean> => {
      const nodes = await db.nodes.where('sessionId').equals(sessionId).toArray();
      
      for (const node of nodes) {
        const pattern = node.pattern;
        const mid = Math.floor(pattern.length / 2);
        let isSymmetric = true;
        
        for (let i = 0; i < mid; i++) {
          if (pattern[i] !== pattern[pattern.length - 1 - i]) {
            isSymmetric = false;
            break;
          }
        }
        
        if (isSymmetric) return true;
      }
      
      return false;
    },
  },
  
  void_gazer: {
    name: 'Void Gazer',
    crypticHint: 'Stillness before the plunge',
    check: async (sessionId: number): Promise<boolean> => {
      const session = await db.sessions.get(sessionId);
      if (!session) return false;
      
      // Stayed at depth 0 for extended time (many interactions before first portal)
      const nodes = await db.nodes.where('sessionId').equals(sessionId).toArray();
      const depth0Nodes = nodes.filter(n => n.depth === 0);
      
      return depth0Nodes.length >= 15;
    },
  },
  
  connection_weaver: {
    name: 'Connection Weaver',
    crypticHint: 'The web grows dense',
    check: async (sessionId: number): Promise<boolean> => {
      const nodes = await db.nodes.where('sessionId').equals(sessionId).toArray();
      const totalConnections = nodes.reduce((sum, n) => sum + n.connections.length, 0);
      
      return totalConnections >= 10;
    },
  },
  
  decay_master: {
    name: 'Decay Master',
    crypticHint: 'All things fade',
    check: async (): Promise<boolean> => {
      const nodes = await db.nodes.toArray();
      if (nodes.length < 5) return false;
      
      // Triggers when all nodes reach minimum weight floor (0.3)
      const allDecayed = nodes.every(n => n.weight <= 0.3);
      return allDecayed;
    },
  },
  
  rapid_descent: {
    name: 'Rapid Descent',
    crypticHint: 'Velocity into the void',
    check: async (sessionId: number): Promise<boolean> => {
      const session = await db.sessions.get(sessionId);
      if (!session || session.depth < 5) return false;
      
      const duration = session.metadata.duration;
      const minutes = duration / (1000 * 60);
      
      return minutes < 2 && session.depth >= 5;
    },
  },
  
  pattern_monk: {
    name: 'Pattern Monk',
    crypticHint: 'Repetition reveals pattern',
    check: async (sessionId: number): Promise<boolean> => {
      const session = await db.sessions.get(sessionId);
      return session ? session.metadata.interactionCount >= 100 : false;
    },
  },
};

/**
 * Check for newly earned achievements for a session.
 */
export const checkAchievements = async (sessionId: number): Promise<AchievementCode[]> => {
  const earned: AchievementCode[] = [];
  
  // Get already earned achievements for this session
  const existing = await db.achievements
    .where('sessionId')
    .equals(sessionId)
    .toArray();
  
  const existingCodes = new Set(existing.map(a => a.code));
  
  // Check each achievement
  for (const [code, definition] of Object.entries(ACHIEVEMENT_DEFINITIONS)) {
    if (existingCodes.has(code as AchievementCode)) continue;
    
    try {
      const isEarned = await definition.check(sessionId);
      
      if (isEarned) {
        const achievement: Achievement = {
          code: code as AchievementCode,
          timestamp: Date.now(),
          sessionId,
          metadata: {
            description: definition.crypticHint,
          },
          revealed: false,
        };
        
        await db.achievements.add(achievement);
        earned.push(code as AchievementCode);
        
        console.log(`[Achievement] Silent unlock: ${code}`);
      }
    } catch (error) {
      console.error(`[Achievement] Error checking ${code}:`, error);
    }
  }
  
  return earned;
};

/**
 * Mark achievement as revealed (user saw it in constellation).
 */
export const revealAchievement = async (achievementId: number): Promise<void> => {
  await db.achievements.update(achievementId, { revealed: true });
};

/**
 * Get all achievements with their human-readable info.
 */
export const getAchievementInfo = (code: AchievementCode) => {
  return ACHIEVEMENT_DEFINITIONS[code];
};

/**
 * Get achievement stats.
 */
export const getAchievementStats = async () => {
  const all = await db.achievements.toArray();
  const revealed = all.filter(a => a.revealed).length;
  const byCode = new Map<AchievementCode, number>();
  
  for (const achievement of all) {
    byCode.set(achievement.code, (byCode.get(achievement.code) || 0) + 1);
  }
  
  return {
    total: all.length,
    revealed,
    unrevealed: all.length - revealed,
    byCode: Object.fromEntries(byCode),
  };
};
