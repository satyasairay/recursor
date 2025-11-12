import { useEffect, useState } from 'react';
import { getNarrativeState, NarrativeState } from '@/lib/narrativeEngine';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/recursionDB';

export function useNarrativeState() {
  const [narrativeState, setNarrativeState] = useState<NarrativeState>({
    depth: 0,
    totalSessions: 0,
    maxDepth: 0,
    glitchIntensity: 0,
    vortexStage: 0,
    architecturePhase: 0,
    unlocked: [],
  });

  // React to database changes
  const sessions = useLiveQuery(() => db.sessions.toArray()) || [];
  const nodes = useLiveQuery(() => db.nodes.toArray()) || [];

  useEffect(() => {
    updateNarrativeState();
  }, [sessions.length, nodes.length]);

  const updateNarrativeState = async () => {
    const state = await getNarrativeState();
    setNarrativeState(state);
  };

  return narrativeState;
}
