import { motion } from 'framer-motion';
import { MemoryConstellation } from '@/components/MemoryConstellation';
import { ArtifactExport } from '@/components/ArtifactExport';
import { ArchetypeInsight } from '@/components/ArchetypeInsight';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { getSessionStats, getNodeStats, db } from '@/lib/recursionDB';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { SessionStats } from '@/lib/types';
import { getAchievementStats } from '@/lib/achievementEngine';
import { GlitchEffect } from '@/components/GlitchEffect';
import { DepthVortex } from '@/components/DepthVortex';
import { ArchitectureMorph } from '@/components/ArchitectureMorph';
import { useNarrativeState } from '@/hooks/useNarrativeState';
import { UserMenu } from '@/components/UserMenu';

const Memory = () => {
  const navigate = useNavigate();
  const sessions = useLiveQuery(() => db.sessions.toArray()) || [];
  const nodes = useLiveQuery(() => db.nodes.toArray()) || [];
  const achievements = useLiveQuery(() => db.achievements.toArray()) || [];
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [nodeStats, setNodeStats] = useState<any>(null);
  const [achievementStats, setAchievementStats] = useState<any>(null);
  const narrative = useNarrativeState();

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
    <div className="min-h-screen p-4 sm:p-8 relative overflow-hidden">
      {/* Narrative visual layers */}
      <DepthVortex stage={narrative.vortexStage} phase={narrative.architecturePhase} />
      <ArchitectureMorph phase={narrative.architecturePhase} />
      
      <GlitchEffect depth={narrative.maxDepth}>
        {/* Header */}
        <motion.div
        className="max-w-6xl mx-auto mb-8 sm:mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-glow mb-2">Memory Constellation</h1>
            <p className="text-muted-foreground font-mono text-xs sm:text-sm">
              A visualization of your recursive journey
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="font-mono text-[10px] sm:text-xs px-2 sm:px-4 h-8 sm:h-9"
            >
              <span className="hidden sm:inline">Return to Recursion</span>
              <span className="sm:hidden">RETURN</span>
            </Button>
            <UserMenu />
          </div>
        </div>

        {/* Stats Grid */}
        {nodeStats && achievementStats && (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="recursive-border rounded-lg p-3 sm:p-4 bg-card/50 backdrop-blur-sm">
              <div className="text-xl sm:text-2xl font-bold text-primary">{nodeStats.totalNodes}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground font-mono">MEMORY NODES</div>
            </div>

            <div className="recursive-border rounded-lg p-3 sm:p-4 bg-card/50 backdrop-blur-sm">
              <div className="text-xl sm:text-2xl font-bold text-primary">{nodeStats.totalConnections}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground font-mono">CONNECTIONS</div>
            </div>

            <div className="recursive-border rounded-lg p-3 sm:p-4 bg-card/50 backdrop-blur-sm">
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {(nodeStats.avgWeight || 0).toFixed(2)}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground font-mono">AVG WEIGHT</div>
            </div>

            <div className="recursive-border rounded-lg p-3 sm:p-4 bg-card/50 backdrop-blur-sm">
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {(nodeStats.avgConnectionsPerNode || 0).toFixed(1)}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground font-mono">AVG LINKS</div>
            </div>

            <div className="recursive-border rounded-lg p-3 sm:p-4 bg-card/50 backdrop-blur-sm relative overflow-hidden">
              <div className="text-xl sm:text-2xl font-bold text-primary">{achievementStats.unrevealed}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground font-mono">HIDDEN INSIGHTS</div>
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

      {/* Tabs for different views */}
      <motion.div
        className="max-w-6xl mx-auto mb-6 sm:mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="constellation" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-9 sm:h-10">
            <TabsTrigger value="constellation" className="font-mono text-[10px] sm:text-xs">Constellation</TabsTrigger>
            <TabsTrigger value="archetypes" className="font-mono text-[10px] sm:text-xs">Archetypes</TabsTrigger>
            <TabsTrigger value="export" className="font-mono text-[10px] sm:text-xs">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="constellation">
            <div className="recursive-border rounded-xl p-4 sm:p-6 md:p-8 bg-card/30 backdrop-blur-sm">
              <MemoryConstellation />
            </div>
          </TabsContent>

          <TabsContent value="archetypes">
            <ArchetypeInsight />
          </TabsContent>

          <TabsContent value="export">
            <ArtifactExport nodes={nodes} sessions={sessions} />
          </TabsContent>
        </Tabs>
      </motion.div>

      <Separator className="max-w-6xl mx-auto mb-8" />

      {/* Actions */}
      <motion.div
        className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-center gap-3 sm:gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={handleExport}
          disabled={nodes.length === 0}
          className="font-mono text-xs sm:text-sm w-full sm:w-auto"
        >
          Export Data JSON
        </Button>

        <Button
          onClick={handleClearMemories}
          variant="destructive"
          disabled={nodes.length === 0}
          className="font-mono text-xs sm:text-sm w-full sm:w-auto"
        >
          Clear All Memories
        </Button>
      </motion.div>
      </GlitchEffect>
    </div>
  );
};

export default Memory;
