import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PatternField } from './PatternField';
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
import { validatePattern } from '@/lib/regressionGuards';

/**
 * RecursiveEngine - Core recursion loop orchestrator
 * 
 * Owns ALL logic: mutation, depth progression, memory writes, session tracking.
 * PatternField is pure presentation layer that receives (pattern, depth, memory, mutationCount).
 */
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
  const [totalMutations, setTotalMutations] = useState(0);
  const [envPulse, setEnvPulse] = useState(0);
  
  // Auth and cloud sync
  const { user } = useAuth();
  
  // Ambient audio system
  const { isEnabled: audioEnabled, toggleAudio, updateParams } = useAmbientAudio();

  const analysis = useMemo(() => analyzePattern(pattern, depth, 1.0), [pattern, depth]);
  const sessionSignature = useMemo(() => computeSignature(pattern), [pattern]);
  const contours = useMemo(() => {
    const layers = 5;
    return Array.from({ length: layers }).map((_, index) => {
      const phase = (sessionSignature % 97) + index * 17;
      return {
        id: index,
        rotation: (depth * 11 + phase * 0.85) % 360,
        scale: 1 + index * 0.14,
        opacity: 0.05 + index * 0.07,
      };
    });
  }, [sessionSignature, depth]);

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
    if (enableBranching && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('recursor-branch-pulse'));
    }

    // Evolve pattern using sophisticated mutation engine
    const evolved = await evolvePattern(pattern, depth, enableBranching);
    
    setTimeout(() => {
      setPattern(evolved);
      setDepth(d => d + 1);
      setIsTransitioning(false);
      setInteractionCount(0);
    }, PORTAL_TRANSITION_DURATION);
  };

  /**
   * REGRESSION GUARANTEE: This is the ONLY function that can:
   * - Create memory nodes (createMemoryNode)
   * - Update sessions (db.sessions.update)
   * - Mutate depth (setDepth - only via handleEnterPortal)
   * - Check achievements (checkAchievements)
   * - Sync to cloud (cloudSync)
   * 
   * PatternField CANNOT call these functions directly.
   * PatternField can ONLY call this function via onPatternChange callback.
   * 
   * INVARIANT: All memory writes, session updates, and depth changes
   * must flow through RecursiveEngine, never through PatternField.
   */
  const handlePatternChange = async (newPattern: number[]) => {
    // REGRESSION GUARD: Validate pattern at engine boundary
    try {
      validatePattern(newPattern);
    } catch (error) {
      console.error('[RecursiveEngine] Pattern validation failed:', error);
      return;
    }

    setPattern(newPattern);
    setInteractionCount(c => c + 1);
    setTotalMutations(m => m + 1);
    
    // Trigger environmental pulse (visual feedback only)
    setEnvPulse(value => value + 1);

    // Create memory node for this pattern change
    if (sessionId) {
      try {
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
      } catch (error) {
        console.error('[RecursiveEngine] Error in handlePatternChange:', error);
        // Continue execution - don't block user interaction on persistence errors
      }
    }

    // Check if pattern is "complete" (all values >= COMPLETION_THRESHOLD)
    // This logic is owned by RecursiveEngine, not PatternField
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative">
      {/* Audio + Reset controls */}
      <motion.div
        className="absolute top-4 right-4 sm:top-8 sm:right-8 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Button
          onClick={toggleAudio}
          variant="outline"
          className="font-mono text-xs"
          size="icon"
        >
          {audioEnabled ? <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />}
        </Button>
        
        {depth > 0 && (
          <Button
            onClick={handleReset}
            variant="outline"
            className="font-mono text-xs"
            size="icon"
          >
            ⟲
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
              <PatternField
                pattern={pattern}
                onPatternChange={handlePatternChange}
                depth={depth}
                locked={isTransitioning}
                mutationCount={totalMutations}
              />
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

      {/* Deterministic ambient field */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {contours.map(contour => (
          <motion.div
            key={`contour-${contour.id}`}
            className="absolute inset-[15%] border border-primary/15 rounded-[40%]"
            style={{
              transform: `rotate(${contour.rotation}deg) scale(${contour.scale})`,
            }}
            animate={{
              opacity: [0, contour.opacity, 0],
            }}
            transition={{
              duration: 8 + contour.id * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0.12, 0.22, 0.12] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: `radial-gradient(circle at 50% 50%, hsla(${210 + analysis.mutationWeights.strength * 40}, 50%, 18%, 0.55) 0%, transparent 68%)`,
          }}
        />
        {envPulse > 0 && (
          <motion.div
            key={envPulse}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{
              opacity: [0, 0.35, 0],
              scale: [0.92, 1.05, 1],
            }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
            style={{
              background: `radial-gradient(circle at center, hsla(${180 + depth * 18}, 70%, 22%, 0.45) 0%, transparent 72%)`,
            }}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Computes deterministic signature from pattern.
 * Used for visual contour generation (ambient field).
 * Pure function: f(pattern) → number
 */
function computeSignature(pattern: Pattern): number {
  if (!Array.isArray(pattern) || pattern.length === 0) return 0;
  return pattern.reduce((sum, value, index) => sum + (value + 1) * (index + 1), 0);
}
