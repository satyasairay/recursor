import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PatternGrid } from './PatternGrid';
import { RecursionPortal } from './RecursionPortal';
import { ReflectionModal } from './ReflectionModal';
import { db, evolvePattern, calculateDecayFactor, createMemoryNode, decayAllNodes } from '@/lib/recursionDB';
import { Button } from './ui/button';
import { RecursionSession, Pattern } from '@/lib/types';
import { INITIAL_PATTERN, PORTAL_TRANSITION_DURATION, COMPLETION_THRESHOLD } from '@/lib/constants';
import { analyzePattern } from '@/lib/mutationEngine';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';
import { Volume2, VolumeX } from 'lucide-react';
import { checkAchievements } from '@/lib/achievementEngine';
import { cloudSync } from '@/lib/cloudSync';
import { useAuth } from '@/hooks/useAuth';

export const RecursiveEngine = () => {
  const [depth, setDepth] = useState(0);
  const [pattern, setPattern] = useState<Pattern>(INITIAL_PATTERN);
  const [sessionStart, setSessionStart] = useState(Date.now());
  const [interactionCount, setInteractionCount] = useState(0);
  const [showPortal, setShowPortal] = useState(true);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [cloudSessionId, setCloudSessionId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<number | null>(null);
  
  // Auth and cloud sync
  const { user } = useAuth();
  
  // Ambient audio system
  const { isEnabled: audioEnabled, toggleAudio, updateParams } = useAmbientAudio();

  useEffect(() => {
    if (user) {
      cloudSync.setUser(user.id);
    }
  }, [user]);

  useEffect(() => {
    // Initialize first session and apply decay
    const init = async () => {
      await decayAllNodes();
      await initSession();
    };
    init();
  }, []);

  // Update audio parameters when state changes
  useEffect(() => {
    if (audioEnabled && depth >= 0) {
      const analysis = analyzePattern(pattern, depth, 1.0);
      
      // Get average decay from recent nodes
      const getAvgDecay = async () => {
        const recentNodes = await db.nodes
          .orderBy('lastAccessed')
          .reverse()
          .limit(10)
          .toArray();
        
        const avgDecay = recentNodes.length > 0
          ? recentNodes.reduce((sum, n) => {
              const decay = calculateDecayFactor(n.lastAccessed);
              return sum + decay;
            }, 0) / recentNodes.length
          : 1.0;
        
        updateParams({
          depth,
          entropy: analysis.normalizedEntropy,
          chaos: analysis.mutationWeights.chaos,
          decayFactor: avgDecay,
        });
      };
      
      getAvgDecay();
    }
  }, [depth, pattern, audioEnabled]);

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
    
    // Sync to cloud if authenticated
    if (user) {
      const cloudId = await cloudSync.saveSession(session);
      if (cloudId) setCloudSessionId(cloudId);
    }
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

    // Create memory node for this pattern change
    if (sessionId) {
      await createMemoryNode(newPattern, depth, sessionId);
      
      // Record decision in session
      const session = await db.sessions.get(sessionId);
      if (session) {
        const updatedDecisions = [...session.decisions, `pattern-${depth}-${Date.now()}`];
        const updatedPatterns = [...session.patterns, ...newPattern];
        const updates = {
          decisions: updatedDecisions,
          patterns: updatedPatterns,
          depth: depth,
          metadata: {
            duration: session.metadata.duration,
            interactionCount: interactionCount + 1,
            uniquePatterns: new Set(updatedPatterns).size,
          }
        };
        
        await db.sessions.update(sessionId, updates);
        
        // Sync to cloud if authenticated
        if (user && cloudSessionId) {
          await cloudSync.updateSession(cloudSessionId, updates);
          await cloudSync.savePattern(cloudSessionId, newPattern, depth);
        }
      }
      
      // Check for achievements (silent)
      const achievementCodes = await checkAchievements(sessionId);
      
      // Sync achievements to cloud
      if (user && cloudSessionId && achievementCodes.length > 0) {
        for (const code of achievementCodes) {
          await cloudSync.saveAchievement(cloudSessionId, code);
        }
      }
    }

    // Check if pattern is "complete" (all values >= COMPLETION_THRESHOLD)
    const isComplete = newPattern.every(v => v >= COMPLETION_THRESHOLD);
    if (isComplete) {
      setShowPortal(true);
    }
  };

  const handleReset = async () => {
    // Mark session as complete and check final achievements
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
        
        // Final achievement check
        await checkAchievements(sessionId);
        
        // Show reflection modal
        setCompletedSessionId(sessionId);
        setShowReflection(true);
      }
    }
  };

  const handleReflectionClose = async () => {
    setShowReflection(false);
    
    // Start new session after reflection
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

      {/* Audio + Reset controls */}
      <motion.div
        className="absolute top-8 right-8 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Button
          onClick={toggleAudio}
          variant="outline"
          className="font-mono text-xs"
          size="icon"
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>
        
        {depth > 0 && (
          <Button
            onClick={handleReset}
            variant="outline"
            className="font-mono text-xs"
          >
            RESET MEMORY
          </Button>
        )}
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

      {/* Reflection modal */}
      {completedSessionId && (
        <ReflectionModal
          sessionId={completedSessionId}
          depth={depth}
          open={showReflection}
          onClose={handleReflectionClose}
        />
      )}

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
