import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { db } from '@/lib/recursionDB';
import { Sparkles, Zap, Target } from 'lucide-react';

interface ReflectionModalProps {
  sessionId: number;
  depth: number;
  open: boolean;
  onClose: () => void;
}

interface SessionSummary {
  duration: number;
  interactions: number;
  uniquePatterns: number;
  peakDepth: number;
  achievements: string[];
}

export const ReflectionModal = ({ sessionId, depth, open, onClose }: ReflectionModalProps) => {
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (open && sessionId) {
      loadSummary();
    }
  }, [open, sessionId]);

  useEffect(() => {
    if (open && summary) {
      // Phase animation sequence
      const timers = [
        setTimeout(() => setPhase(1), 400),
        setTimeout(() => setPhase(2), 800),
        setTimeout(() => setPhase(3), 1200),
        setTimeout(() => setPhase(4), 1600),
      ];
      return () => timers.forEach(clearTimeout);
    } else {
      setPhase(0);
    }
  }, [open, summary]);

  const loadSummary = async () => {
    const session = await db.sessions.get(sessionId);
    const achievements = await db.achievements
      .where('sessionId')
      .equals(sessionId)
      .toArray();

    if (session) {
      setSummary({
        duration: session.metadata.duration,
        interactions: session.metadata.interactionCount,
        uniquePatterns: session.metadata.uniquePatterns,
        peakDepth: session.depth,
        achievements: achievements.map(a => a.code),
      });
    }
  };

  if (!summary) return null;

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-primary/20">
        <div className="relative py-8">
          {/* Animated background rings */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: open ? [1, 2 + i * 0.5] : 0,
                  opacity: open ? [0.5, 0] : 0,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeOut',
                }}
                style={{
                  width: '100px',
                  height: '100px',
                }}
              />
            ))}
          </div>

          <div className="relative space-y-6 text-center">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h2 className="text-2xl font-bold text-foreground font-mono">
                RECURSION COMPLETE
              </h2>
              <p className="text-sm text-muted-foreground font-mono">
                Session depth reached: {summary.peakDepth}
              </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <AnimatePresence>
                {phase >= 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-2"
                  >
                    <Zap className="w-6 h-6 mx-auto text-primary" />
                    <div className="text-2xl font-bold text-foreground font-mono">
                      {summary.interactions}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Mutations
                    </div>
                  </motion.div>
                )}

                {phase >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-2"
                  >
                    <Target className="w-6 h-6 mx-auto text-primary" />
                    <div className="text-2xl font-bold text-foreground font-mono">
                      {summary.uniquePatterns}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Patterns
                    </div>
                  </motion.div>
                )}

                {phase >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-2"
                  >
                    <Sparkles className="w-6 h-6 mx-auto text-primary" />
                    <div className="text-2xl font-bold text-foreground font-mono">
                      {formatDuration(summary.duration)}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Duration
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Achievements */}
            {phase >= 4 && summary.achievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 border-t border-primary/20"
              >
                <div className="text-xs text-muted-foreground font-mono mb-2">
                  Unlocked Achievements
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {summary.achievements.map((achievement, i) => (
                    <motion.div
                      key={achievement}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono"
                    >
                      {achievement}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Echo message */}
            {phase >= 4 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.7] }}
                transition={{ duration: 2, delay: 0.5 }}
                className="pt-4 text-xs text-muted-foreground font-mono italic"
              >
                "The pattern persists in memory..."
              </motion.div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
