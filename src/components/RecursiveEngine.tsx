import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PatternGrid } from './PatternGrid';
import { RecursionPortal } from './RecursionPortal';
import { db, evolvePattern, calculateDecayFactor } from '@/lib/recursionDB';
import { Button } from './ui/button';
import { RecursionSession, Pattern } from '@/lib/types';
import { INITIAL_PATTERN, PORTAL_TRANSITION_DURATION, COMPLETION_THRESHOLD } from '@/lib/constants';
import { analyzePattern } from '@/lib/mutationEngine';

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
    const now = Date.now();
    const session: RecursionSession = {
      timestamp: now,
      depth: 0,
      decisions: [],
      patterns: [],
      completed: false,
      decayFactor: 1.0, // Fresh session
      metadata: {
        duration: 0,
        interactionCount: 0,
        uniquePatterns: 0,
      },
    };

    const id = await db.sessions.add(session);
    setSessionId(id);
    setSessionStart(now);
  };

  const handleEnterPortal = async () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setShowPortal(false);

    // Update decay factor for current session
    if (sessionId) {
      const session = await db.sessions.get(sessionId);
      if (session) {
        const currentDecay = calculateDecayFactor(session.timestamp);
        await db.sessions.update(sessionId, { decayFactor: currentDecay });
      }
    }

    // Enable branching every 3 depths
    const enableBranching = (depth + 1) % 3 === 0 && depth > 0;

    // Evolve pattern using sophisticated mutation engine
    const evolved = await evolvePattern(pattern, depth, enableBranching);
    
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
      {/* Depth indicator with mutation stats */}
      <motion.div
        className="absolute top-8 left-8 font-mono text-xs text-muted-foreground space-y-1"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div>RECURSION DEPTH: {depth}</div>
        {depth > 0 && (() => {
          const analysis = analyzePattern(pattern, depth, 1.0);
          return (
            <>
              <div className="text-[10px] opacity-70">
                ENTROPY: {analysis.normalizedEntropy.toFixed(2)} | 
                CLUSTERS: {analysis.clusterCount} | 
                CHAOS: {(analysis.mutationWeights.chaos * 100).toFixed(0)}%
              </div>
            </>
          );
        })()}
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

              {depth > 0 && (() => {
                const analysis = analyzePattern(pattern, depth, 1.0);
                const willBranch = (depth + 1) % 3 === 0;
                return (
                  <motion.div
                    className="text-center space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="text-muted-foreground font-mono text-sm">
                      Pattern complete. Descend deeper?
                    </div>
                    {willBranch && (
                      <div className="text-primary font-mono text-xs">
                        ⚠ BRANCHING POINT DETECTED ⚠
                      </div>
                    )}
                  </motion.div>
                );
              })()}
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
