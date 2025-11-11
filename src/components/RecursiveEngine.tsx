import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PatternGrid } from './PatternGrid';
import { RecursionPortal } from './RecursionPortal';
import { db, evolvePattern } from '@/lib/recursionDB';
import { Button } from './ui/button';
import { RecursionSession, Pattern } from '@/lib/types';
import { INITIAL_PATTERN, PORTAL_TRANSITION_DURATION, COMPLETION_THRESHOLD } from '@/lib/constants';

export const RecursiveEngine = () => {
  const [depth, setDepth] = useState(0);
  const [pattern, setPattern] = useState<Pattern>(INITIAL_PATTERN);
  const [sessionStart, setSessionStart] = useState(Date.now());
  const [interactionCount, setInteractionCount] = useState(0);
  const [showPortal, setShowPortal] = useState(true);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Initialize first session
    initSession();
  }, []);

  const initSession = async () => {
    const session: RecursionSession = {
      timestamp: Date.now(),
      depth: 0,
      decisions: [],
      patterns: [],
      completed: false,
      metadata: {
        duration: 0,
        interactionCount: 0,
        uniquePatterns: 0,
      },
    };

    const id = await db.sessions.add(session);
    setSessionId(id);
    setSessionStart(Date.now());
  };

  const handleEnterPortal = async () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setShowPortal(false);

    // Evolve pattern based on history
    const evolved = await evolvePattern(pattern);
    
    setTimeout(() => {
      setPattern(evolved);
      setDepth(d => d + 1);
      setIsTransitioning(false);
      setInteractionCount(0);
    }, PORTAL_TRANSITION_DURATION);
  };

  const handlePatternChange = async (newPattern: number[]) => {
    setPattern(newPattern);
    setInteractionCount(c => c + 1);

    // Record decision
    if (sessionId) {
      const session = await db.sessions.get(sessionId);
      if (session) {
        const updatedDecisions = [...session.decisions, `pattern-${depth}-${Date.now()}`];
        const updatedPatterns = [...session.patterns, ...newPattern];
        await db.sessions.update(sessionId, {
          decisions: updatedDecisions,
          patterns: updatedPatterns,
          depth: depth,
          metadata: {
            duration: session.metadata.duration,
            interactionCount: interactionCount + 1,
            uniquePatterns: new Set(updatedPatterns).size,
          }
        });
      }
    }

    // Check if pattern is "complete" (all values >= COMPLETION_THRESHOLD)
    const isComplete = newPattern.every(v => v >= COMPLETION_THRESHOLD);
    if (isComplete) {
      setShowPortal(true);
    }
  };

  const handleReset = async () => {
    // Mark session as complete
    if (sessionId) {
      const session = await db.sessions.get(sessionId);
      if (session) {
        await db.sessions.update(sessionId, {
          completed: true,
          metadata: {
            ...session.metadata,
            duration: Date.now() - sessionStart,
          }
        });
      }
    }

    // Start new session
    setDepth(0);
    setPattern(INITIAL_PATTERN);
    setShowPortal(true);
    setInteractionCount(0);
    await initSession();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      {/* Depth indicator */}
      <motion.div
        className="absolute top-8 left-8 font-mono text-sm text-muted-foreground"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        RECURSION DEPTH: {depth}
      </motion.div>

      {/* Reset button */}
      <motion.div
        className="absolute top-8 right-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: depth > 0 ? 1 : 0 }}
      >
        <Button
          onClick={handleReset}
          variant="outline"
          className="font-mono text-xs"
        >
          RESET MEMORY
        </Button>
      </motion.div>

      {/* Main content area */}
      <div className="relative w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {showPortal ? (
            <motion.div
              key="portal"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center gap-12"
            >
              <RecursionPortal
                depth={depth}
                onEnter={handleEnterPortal}
                isActive={!isTransitioning}
              />

              {depth > 0 && (
                <motion.div
                  className="text-center text-muted-foreground font-mono text-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Pattern complete. Descend deeper?
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="pattern"
              initial={{ opacity: 0, scale: 0.8, rotateX: -90 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateX: 90 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center gap-8"
            >
              <PatternGrid
                pattern={pattern}
                onPatternChange={handlePatternChange}
                depth={depth}
                locked={isTransitioning}
              />

              <motion.div
                className="text-center text-muted-foreground font-mono text-xs"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Select 3 cells to mutate the pattern
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ambient particle effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: `hsl(${180 + depth * 30}, 100%, 60%)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
};
