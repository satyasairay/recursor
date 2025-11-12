import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecursiveEngine } from '@/components/RecursiveEngine';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { GlitchEffect } from '@/components/GlitchEffect';
import { DepthVortex } from '@/components/DepthVortex';
import { ArchitectureMorph } from '@/components/ArchitectureMorph';
import { useNarrativeState } from '@/hooks/useNarrativeState';
import { UserMenu } from '@/components/UserMenu';

const Index = () => {
  const [hasEntered, setHasEntered] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const navigate = useNavigate();
  const narrative = useNarrativeState();

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
            className="min-h-screen flex items-center justify-center p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
          >
            <div className="max-w-2xl text-center space-y-8 sm:space-y-12">
              {/* Title sequence */}
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.h1 
                  className="text-5xl sm:text-6xl md:text-7xl font-bold text-glow"
                  animate={{
                    textShadow: [
                      '0 0 20px hsl(180 100% 50%)',
                      '0 0 40px hsl(180 100% 50%)',
                      '0 0 20px hsl(180 100% 50%)',
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  RECURSOR
                </motion.h1>

                <motion.div
                  className="text-muted-foreground font-mono text-sm tracking-widest"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  AN EXPERIMENT IN RECURSIVE COGNITION
                </motion.div>
              </motion.div>

              {/* Symbol sequence */}
              <motion.div
                className="flex justify-center gap-4 sm:gap-8 text-3xl sm:text-4xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                {['∞', '⟲', '◯', '◉'].map((symbol, i) => (
                  <motion.div
                    key={i}
                    className="text-primary"
                    animate={{
                      opacity: [0.3, 1, 0.3],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  >
                    {symbol}
                  </motion.div>
                ))}
              </motion.div>

              {/* Cryptic hints */}
              <motion.div
                className="space-y-4 text-muted-foreground text-sm font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              >
                <p>There are no instructions.</p>
                <p>Only patterns that remember.</p>
                <p>Only decisions that echo.</p>
              </motion.div>

              {/* Enter portal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.5, type: 'spring' }}
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

                  <motion.div
                    className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-xs font-mono text-muted-foreground whitespace-nowrap"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    BEGIN
                  </motion.div>
                </button>
              </motion.div>
            </div>
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
