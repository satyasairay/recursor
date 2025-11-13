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

// Hook for responsive screen dimensions and aspect ratio
function useScreenDimensions() {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const aspectRatio = dimensions.width / dimensions.height;
  const isNarrow = dimensions.width < 420;
  const isSmall = dimensions.width < 500;
  const isTall = aspectRatio < 0.75; // Tall screens (portrait)
  const isWide = aspectRatio > 1.5; // Wide screens (landscape)

  return { ...dimensions, aspectRatio, isNarrow, isSmall, isTall, isWide };
}

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
  const screen = useScreenDimensions();

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
            style={{
              // Spatial scaling: zoom out slightly on small screens
              transform: screen.isSmall ? 'scale(0.85)' : 'scale(1)',
              transformOrigin: 'center center',
            }}
          >
            {/* Deterministic positioning based on session signature */}
            {(() => {
              // Orb position: deterministic off-axis (never centers)
              const orbSeedX = (sessionSignature * 23) % 100;
              const orbSeedY = (sessionSignature * 31) % 100;
              const orbX = 20 + (orbSeedX / 100) * 40; // 20-60% from left
              const orbY = 30 + (orbSeedY / 100) * 40; // 30-70% from top
              
              // Orb avoidance radius (minimum distance from orb center)
              // Slightly larger on mobile for better touch targets
              const orbRadius = screen.isSmall ? 14 : 12; // % of viewport - orb glow area
              
              // Helper: ensure position doesn't overlap orb (gravitational zone)
              const avoidOrb = (x: number, y: number, minDistance: number = orbRadius): { x: number; y: number } => {
                const dx = x - orbX;
                const dy = y - orbY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < minDistance) {
                  // Push away from orb
                  const angle = Math.atan2(dy, dx);
                  return {
                    x: orbX + Math.cos(angle) * minDistance,
                    y: orbY + Math.sin(angle) * minDistance,
                  };
                }
                return { x, y };
              };
              
              // Title position: off-axis, heavily dimmed, avoiding orb
              const titleSeedX = (sessionSignature * 7) % 100;
              const titleSeedY = (sessionSignature * 11) % 100;
              let titleX = 15 + (titleSeedX / 100) * 25; // 15-40% from left
              let titleY = 15 + (titleSeedY / 100) * 20; // 15-35% from top
              const titlePos = avoidOrb(titleX, titleY, orbRadius + 5); // Extra margin for large text
              titleX = titlePos.x;
              titleY = titlePos.y;
              
              // Title avoidance radius (calculated after titleX/titleY are set)
              // Prevents sigils from drifting over "RECURSOR" mark
              const titleRadius = screen.isSmall ? 18 : 15; // % of viewport - title area
              
              // Helper: ensure position doesn't overlap title
              const avoidTitle = (x: number, y: number, minDistance: number = titleRadius): { x: number; y: number } => {
                const dx = x - titleX;
                const dy = y - titleY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < minDistance) {
                  // Push away from title
                  const angle = Math.atan2(dy, dx);
                  return {
                    x: titleX + Math.cos(angle) * minDistance,
                    y: titleY + Math.sin(angle) * minDistance,
                  };
                }
                return { x, y };
              };
              
              // Combined avoidance: check both orb and title
              const avoidBoundaries = (x: number, y: number): { x: number; y: number } => {
                let pos = avoidOrb(x, y, orbRadius);
                pos = avoidTitle(pos.x, pos.y, titleRadius);
                return pos;
              };
              
              // Cryptic hints position: off-axis, avoiding orb
              const hintsSeedX = (sessionSignature * 13) % 100;
              const hintsSeedY = (sessionSignature * 19) % 100;
              let hintsX = 60 + (hintsSeedX / 100) * 30; // 60-90% from left
              let hintsY = 70 + (hintsSeedY / 100) * 20; // 70-90% from top
              const hintsPos = avoidOrb(hintsX, hintsY, orbRadius);
              hintsX = hintsPos.x;
              hintsY = hintsPos.y;
              
              // Symbol positions: independent drift with unique profiles
              const symbols = ['∞', '◌', '☍'];
              const symbolPositions = symbols.map((_, i) => {
                const seedX = (sessionSignature * (17 + i * 7)) % 100;
                const seedY = (sessionSignature * (29 + i * 11)) % 100;
                let x = 10 + (seedX / 100) * 80; // 10-90% from left
                let y = 10 + (seedY / 100) * 80; // 10-90% from top
                
                // Avoid both orb and title boundaries (sigils can overlap each other, but not orb/title)
                const pos = avoidBoundaries(x, y);
                x = pos.x;
                y = pos.y;
                
                // Unique drift profile for each sigil
                // Adapt drift to screen aspect ratio
                const baseDriftRadius = 1.5 + (i * 0.8);
                const horizontalDrift = screen.isTall ? baseDriftRadius * 0.6 : baseDriftRadius; // Reduce horizontal on tall screens
                const verticalDrift = screen.isWide ? baseDriftRadius * 0.6 : baseDriftRadius; // Reduce vertical on wide screens
                const driftRadius = Math.max(horizontalDrift, verticalDrift);
                
                const phase = (sessionSignature * (13 + i * 19)) % 360; // Unique phase
                const duration = 12 + (i * 3); // Different duration per sigil
                const delay = i * 0.5; // Staggered delay
                
                // Invisible touch target increase (larger hit area, same visual size)
                const touchPadding = screen.isSmall ? 12 : 8; // Extra padding for touch on mobile
                
                return {
                  symbol: symbols[i],
                  x,
                  y,
                  driftRadius,
                  phase,
                  duration,
                  delay,
                  touchPadding,
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

                  {/* Symbols - independent drift with unique profiles */}
                  {symbolPositions.map((pos, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-3xl sm:text-4xl text-primary"
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        // Invisible touch target increase
                        padding: `${pos.touchPadding}px`,
                        margin: `-${pos.touchPadding}px`,
                        touchAction: 'manipulation',
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: [0.2, 0.6, 0.2],
                        scale: [1, 1.1, 1],
                        x: [
                          0,
                          Math.sin((pos.phase * Math.PI) / 180) * pos.driftRadius,
                          Math.sin((pos.phase * Math.PI) / 180 + Math.PI) * pos.driftRadius,
                          0,
                        ],
                        y: [
                          0,
                          Math.cos((pos.phase * Math.PI) / 180) * pos.driftRadius,
                          Math.cos((pos.phase * Math.PI) / 180 + Math.PI) * pos.driftRadius,
                          0,
                        ],
                      }}
                      transition={{
                        duration: pos.duration,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: pos.delay,
                      }}
                    >
                      {pos.symbol}
                    </motion.div>
                  ))}

                  {/* Cryptic hints - all three lines, fade earlier on small screens instead of wrapping */}
                  <motion.div
                    className="absolute space-y-2 text-muted-foreground text-xs sm:text-sm font-mono"
                    style={{
                      left: `${hintsX}%`,
                      top: screen.isSmall ? undefined : `${hintsY}%`,
                      bottom: screen.isSmall 
                        ? `calc(${100 - hintsY}% + env(safe-area-inset-bottom, 0px) + 5vh)` 
                        : undefined, // Bottom safe-area padding on mobile (5vh minimum, plus safe-area)
                      opacity: screen.isNarrow ? 0.2 : screen.isSmall ? 0.28 : 0.35, // Fade earlier on small screens
                      filter: 'blur(0.4px)', // Slight blur for static effect
                      maxWidth: screen.isNarrow ? '140px' : 'none', // Prevent wrapping, allow all 3 lines
                      whiteSpace: 'nowrap', // Prevent line breaks
                    }}
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: screen.isNarrow 
                        ? [0.15, 0.2, 0.15] 
                        : screen.isSmall 
                        ? [0.22, 0.28, 0.22]
                        : [0.3, 0.35, 0.3],
                      y: [0, -0.3, 0.3, 0], // Tiny vertical jitter
                    }}
                    transition={{
                      opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                      y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                      delay: 2,
                    }}
                  >
                    {/* Always show all three lines */}
                    <p>No instructions.</p>
                    <p>Patterns remember.</p>
                    <p>Decisions echo.</p>
                  </motion.div>

                  {/* Orb - off-axis entry point with barely noticeable drift */}
                  {/* Drift adapts to screen aspect ratio */}
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
                      // Adapt drift to screen ratio
                      x: [
                        0, 
                        Math.sin(sessionSignature * 0.01) * (screen.isTall ? 0.5 : 0.8), // Reduce horizontal on tall screens
                        0
                      ],
                      y: [
                        0, 
                        Math.cos(sessionSignature * 0.01) * (screen.isWide ? 0.5 : 0.8), // Reduce vertical on wide screens
                        0
                      ],
                    }}
                    transition={{
                      opacity: { duration: 0.8 },
                      scale: { duration: 0.8, type: 'spring' },
                      x: { duration: 25, repeat: Infinity, ease: 'easeInOut' },
                      y: { duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 },
                    }}
                  >
                    <button
                      onClick={handleEnter}
                      className="relative group touch-manipulation"
                      style={{
                        // Invisible touch radius increase on mobile
                        padding: screen.isSmall ? '16px' : '8px',
                        margin: screen.isSmall ? '-16px' : '-8px',
                      }}
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
