import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecursiveEngine } from '@/components/RecursiveEngine';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { GlitchEffect } from '@/components/GlitchEffect';
import { DepthVortex } from '@/components/DepthVortex';
import { ArchitectureMorph } from '@/components/ArchitectureMorph';
import { useNarrativeState } from '@/hooks/useNarrativeState';
import { UserMenu } from '@/components/UserMenu';

// Deterministic session signature for positioning
function computeSessionSignature(): number {
  const visited = localStorage.getItem('recursor-visited');
  const timestamp = Date.now();
  const hash = visited ? visited.charCodeAt(0) : 0;
  return ((hash * 17 + timestamp % 997) % 997) + 1;
}

const Index = () => {
  const [hasEntered, setHasEntered] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const navigate = useNavigate();
  const narrative = useNarrativeState();
  const sessionSignature = useMemo(() => computeSessionSignature(), []);

  useEffect(() => {
    // Check if user has visited before
    const visited = localStorage.getItem('recursor-visited');
    if (visited) {
      setShowIntro(false);
      setHasEntered(true);
    }
  }, []);

  const handleEnter = () => {
    localStorage.setItem('recursor-visited', 'true');
    setShowIntro(false);
    setTimeout(() => setHasEntered(true), 600);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Narrative visual layers - wordless, evolving architecture */}
      <DepthVortex stage={narrative.vortexStage} phase={narrative.architecturePhase} />
      <ArchitectureMorph phase={narrative.architecturePhase} />
      
      <GlitchEffect depth={narrative.maxDepth}>
      {/* Memory navigation - always visible once entered */}
      {hasEntered && (
        <>
          <motion.div
            className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50 flex flex-col sm:flex-row gap-2 items-end sm:items-center"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
          >
            <Button
              onClick={() => navigate('/memory')}
              variant="outline"
              className="font-mono text-[10px] sm:text-xs backdrop-blur-sm bg-card/50 px-2 sm:px-4 h-8"
            >
              <span className="hidden sm:inline">VIEW MEMORIES</span>
              <span className="sm:hidden">MEMORY</span>
            </Button>
            <UserMenu />
          </motion.div>

          {/* Replay Intro button */}
          <motion.button
            onClick={() => {
              localStorage.removeItem('recursor-visited');
              window.location.reload();
            }}
            className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 font-mono text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors backdrop-blur-sm bg-card/30 px-2 py-1 rounded"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            title="Replay intro sequence"
          >
            ↻ Replay Intro
          </motion.button>
        </>
      )}

      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.div
            key="intro"
            className="min-h-screen relative p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
          >
            {/* Deterministic positioning based on session signature */}
            {(() => {
              // Orb position: deterministic off-axis
              const orbSeedX = (sessionSignature * 23) % 100;
              const orbSeedY = (sessionSignature * 31) % 100;
              const orbX = 20 + (orbSeedX / 100) * 40; // 20-60% from left
              const orbY = 30 + (orbSeedY / 100) * 40; // 30-70% from top
              
              // Title position: off-axis, heavily dimmed
              const titleSeedX = (sessionSignature * 7) % 100;
              const titleSeedY = (sessionSignature * 11) % 100;
              const titleX = 15 + (titleSeedX / 100) * 25; // 15-40% from left
              const titleY = 15 + (titleSeedY / 100) * 20; // 15-35% from top
              
              // Cryptic hints position: off-axis
              const hintsSeedX = (sessionSignature * 13) % 100;
              const hintsSeedY = (sessionSignature * 19) % 100;
              const hintsX = 60 + (hintsSeedX / 100) * 30; // 60-90% from left
              const hintsY = 70 + (hintsSeedY / 100) * 20; // 70-90% from top
              
              // Symbol positions: independent drift
              const symbols = ['∞', '◌', '☍'];
              const symbolPositions = symbols.map((_, i) => {
                const seedX = (sessionSignature * (17 + i * 7)) % 100;
                const seedY = (sessionSignature * (29 + i * 11)) % 100;
                return {
                  symbol: symbols[i],
                  x: 10 + (seedX / 100) * 80, // 10-90% from left
                  y: 10 + (seedY / 100) * 80, // 10-90% from top
                  delay: i * 0.3,
                };
              });
              
              return (
                <>
                  {/* Title - heavily dimmed, off-axis */}
                  <motion.h1
                    className="absolute text-5xl sm:text-6xl md:text-7xl font-bold text-glow"
                    style={{
                      left: `${titleX}%`,
                      top: `${titleY}%`,
                      opacity: 0.15, // Heavily dimmed
                    }}
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0.1, 0.15, 0.1],
                      textShadow: [
                        '0 0 10px hsl(180 100% 50% / 0.2)',
                        '0 0 20px hsl(180 100% 50% / 0.3)',
                        '0 0 10px hsl(180 100% 50% / 0.2)',
                      ],
                    }}
                    transition={{
                      opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                      textShadow: { duration: 3, repeat: Infinity },
                    }}
                  >
                    RECURSOR
                  </motion.h1>

                  {/* Symbols - independent drift */}
                  {symbolPositions.map((pos, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-3xl sm:text-4xl text-primary"
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: [0.2, 0.6, 0.2],
                        scale: [1, 1.1, 1],
                        x: [0, Math.sin(i) * 2, 0],
                        y: [0, Math.cos(i) * 2, 0],
                      }}
                      transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: pos.delay,
                      }}
                    >
                      {pos.symbol}
                    </motion.div>
                  ))}

                  {/* Cryptic hints - shortened, off-axis */}
                  <motion.div
                    className="absolute space-y-2 text-muted-foreground text-xs sm:text-sm font-mono"
                    style={{
                      left: `${hintsX}%`,
                      top: `${hintsY}%`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                  >
                    <p>No instructions.</p>
                    <p>Patterns remember.</p>
                    <p>Decisions echo.</p>
                  </motion.div>

                  {/* Orb - off-axis entry point */}
                  <motion.div
                    className="absolute"
                    style={{
                      left: `${orbX}%`,
                      top: `${orbY}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: [0, Math.sin(sessionSignature * 0.01) * 3, 0],
                      y: [0, Math.cos(sessionSignature * 0.01) * 3, 0],
                    }}
                    transition={{
                      opacity: { duration: 0.8 },
                      scale: { duration: 0.8, type: 'spring' },
                      x: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
                      y: { duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 },
                    }}
                  >
                    <button
                      onClick={handleEnter}
                      className="relative group touch-manipulation"
                    >
                      <motion.div
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-full recursive-border bg-card/50 backdrop-blur-sm flex items-center justify-center cursor-pointer"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        animate={{
                          boxShadow: [
                            '0 0 20px hsl(180 100% 50% / 0.3)',
                            '0 0 40px hsl(180 100% 50% / 0.5)',
                            '0 0 20px hsl(180 100% 50% / 0.3)',
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <span className="text-3xl sm:text-4xl text-primary text-glow">◉</span>
                      </motion.div>
                    </button>
                  </motion.div>
                </>
              );
            })()}
          </motion.div>
        ) : (
          <motion.div
            key="engine"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <RecursiveEngine />
          </motion.div>
        )}
      </AnimatePresence>
      </GlitchEffect>
    </div>
  );
};

export default Index;
