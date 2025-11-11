import { motion } from 'framer-motion';
import { MemoryConstellation } from '@/components/MemoryConstellation';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { getSessionStats, db } from '@/lib/recursionDB';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';

const Memory = () => {
  const navigate = useNavigate();
  const sessions = useLiveQuery(() => db.sessions.toArray()) || [];
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getSessionStats>> | null>(null);

  useLiveQuery(async () => {
    const data = await getSessionStats();
    setStats(data);
  });

  const handleExport = async () => {
    if (sessions.length === 0) return;

    const exportData = {
      timestamp: Date.now(),
      stats,
      sessions: sessions.map(s => ({
        depth: s.depth,
        timestamp: s.timestamp,
        patterns: s.patterns,
        completed: s.completed,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recursor-memory-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearMemories = async () => {
    if (confirm('This will erase all your recursive memories. Continue?')) {
      await db.sessions.clear();
      await db.memories.clear();
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
        {stats && (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="recursive-border rounded-lg p-4 bg-card/50 backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary">{stats.totalSessions}</div>
              <div className="text-xs text-muted-foreground font-mono">TOTAL SESSIONS</div>
            </div>

            <div className="recursive-border rounded-lg p-4 bg-card/50 backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary">{stats.maxDepth}</div>
              <div className="text-xs text-muted-foreground font-mono">MAX DEPTH</div>
            </div>

            <div className="recursive-border rounded-lg p-4 bg-card/50 backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary">
                {(stats.avgDepth || 0).toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground font-mono">AVG DEPTH</div>
            </div>

            <div className="recursive-border rounded-lg p-4 bg-card/50 backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary">
                {(stats.completionRate * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground font-mono">COMPLETION</div>
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

      {/* Actions */}
      <motion.div
        className="max-w-6xl mx-auto flex justify-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          onClick={handleExport}
          disabled={sessions.length === 0}
          className="font-mono"
        >
          Export Memory Artifact
        </Button>

        <Button
          onClick={handleClearMemories}
          variant="destructive"
          disabled={sessions.length === 0}
          className="font-mono"
        >
          Clear All Memories
        </Button>
      </motion.div>
    </div>
  );
};

export default Memory;
