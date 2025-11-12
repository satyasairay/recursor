import { motion } from 'framer-motion';
import { MemoryConstellation } from '@/components/MemoryConstellation';
import { ArtifactExport } from '@/components/ArtifactExport';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { getSessionStats, getNodeStats, db } from '@/lib/recursionDB';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { SessionStats } from '@/lib/types';
import { getAchievementStats } from '@/lib/achievementEngine';

const Memory = () => {
  const navigate = useNavigate();
  const sessions = useLiveQuery(() => db.sessions.toArray()) || [];
  const nodes = useLiveQuery(() => db.nodes.toArray()) || [];
  const achievements = useLiveQuery(() => db.achievements.toArray()) || [];
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [nodeStats, setNodeStats] = useState<any>(null);
  const [achievementStats, setAchievementStats] = useState<any>(null);

  useLiveQuery(async () => {
    const data = await getSessionStats();
    setStats(data);
  });

  useLiveQuery(async () => {
    const data = await getNodeStats();
    setNodeStats(data);
  });

  useLiveQuery(async () => {
    const data = await getAchievementStats();
    setAchievementStats(data);
  });

  const handleExport = async () => {
    if (nodes.length === 0) return;

    const exportData = {
      timestamp: Date.now(),
      stats,
      nodeStats,
      achievementStats,
      sessions: sessions.map(s => ({
        depth: s.depth,
        timestamp: s.timestamp,
        patterns: s.patterns,
        completed: s.completed,
      })),
      nodes: nodes.map(n => ({
        ...n,
        timestamp: new Date(n.timestamp).toISOString(),
        lastAccessed: new Date(n.lastAccessed).toISOString(),
      })),
      achievements: achievements.map(a => ({
        ...a,
        timestamp: new Date(a.timestamp).toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recursor-insights-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearMemories = async () => {
    if (confirm('This will erase all your recursive memories, nodes, and insights. Continue?')) {
      await db.sessions.clear();
      await db.nodes.clear();
      await db.achievements.clear();
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <motion.div
        className="max-w-6xl mx-auto mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-glow mb-2">Memory Constellation</h1>
            <p className="text-muted-foreground font-mono text-sm">
              A visualization of your recursive journey
            </p>
          </div>

          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="font-mono"
          >
            Return to Recursion
          </Button>
        </div>

        {/* Stats Grid */}
        {nodeStats && achievementStats && (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="recursive-border rounded-lg p-4 bg-card/50 backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary">{nodeStats.totalNodes}</div>
              <div className="text-xs text-muted-foreground font-mono">MEMORY NODES</div>
            </div>

            <div className="recursive-border rounded-lg p-4 bg-card/50 backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary">{nodeStats.totalConnections}</div>
              <div className="text-xs text-muted-foreground font-mono">CONNECTIONS</div>
            </div>

            <div className="recursive-border rounded-lg p-4 bg-card/50 backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary">
                {(nodeStats.avgWeight || 0).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground font-mono">AVG WEIGHT</div>
            </div>

            <div className="recursive-border rounded-lg p-4 bg-card/50 backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary">
                {(nodeStats.avgConnectionsPerNode || 0).toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground font-mono">AVG LINKS</div>
            </div>

            <div className="recursive-border rounded-lg p-4 bg-card/50 backdrop-blur-sm relative overflow-hidden">
              <div className="text-2xl font-bold text-primary">{achievementStats.unrevealed}</div>
              <div className="text-xs text-muted-foreground font-mono">HIDDEN INSIGHTS</div>
              {achievementStats.unrevealed > 0 && (
                <motion.div
                  className="absolute inset-0 bg-purple-500/5"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Constellation */}
      <motion.div
        className="max-w-6xl mx-auto recursive-border rounded-xl p-8 bg-card/30 backdrop-blur-sm mb-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <MemoryConstellation />
      </motion.div>

      {/* Artifact Export */}
      <motion.div
        className="max-w-6xl mx-auto mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <ArtifactExport nodes={nodes} sessions={sessions} />
      </motion.div>

      <Separator className="max-w-6xl mx-auto mb-8" />

      {/* Actions */}
      <motion.div
        className="max-w-6xl mx-auto flex justify-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={handleExport}
          disabled={nodes.length === 0}
          className="font-mono"
        >
          Export Data JSON
        </Button>

        <Button
          onClick={handleClearMemories}
          variant="destructive"
          disabled={nodes.length === 0}
          className="font-mono"
        >
          Clear All Memories
        </Button>
      </motion.div>
    </div>
  );
};

export default Memory;
