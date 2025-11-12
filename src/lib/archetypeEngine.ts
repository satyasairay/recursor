import { supabase } from '@/integrations/supabase/client';
import { db } from './recursionDB';

export interface ArchetypeResult {
  archetype: string;
  percentile: number;
  totalSessions: number;
}

export interface ArchetypeInfo {
  name: string;
  description: string;
  count: number;
  percentage: number;
  traits: string[];
}

export async function submitAnonymousData(): Promise<ArchetypeResult | null> {
  try {
    // Gather local data
    const sessions = await db.sessions.toArray();
    const nodes = await db.nodes.toArray();
    const achievements = await db.achievements.toArray();

    if (sessions.length === 0) {
      console.log('No sessions to submit');
      return null;
    }

    // Prepare anonymous data
    const patterns = sessions.map(s => ({
      signature: s.patterns.join(','),
      depth: s.depth,
    }));

    const achievementFlags = achievements.map(a => a.id);

    console.log('Submitting anonymous pattern data...');

    const { data, error } = await supabase.functions.invoke('submit-pattern', {
      body: {
        patterns,
        achievements: achievementFlags,
        nodeCount: nodes.length,
      },
    });

    if (error) {
      console.error('Error submitting pattern:', error);
      return null;
    }

    console.log('Archetype result:', data);
    return data as ArchetypeResult;
  } catch (error) {
    console.error('Error in submitAnonymousData:', error);
    return null;
  }
}

export async function getArchetypeStats(): Promise<{
  archetypes: ArchetypeInfo[];
  totalSessions: number;
  lastUpdated: string;
} | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-archetypes');

    if (error) {
      console.error('Error fetching archetypes:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getArchetypeStats:', error);
    return null;
  }
}
