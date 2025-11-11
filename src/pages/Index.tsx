import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecursiveEngine } from '@/components/RecursiveEngine';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [hasEntered, setHasEntered] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const navigate = useNavigate();

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
      {/* Memory navigation - always visible once entered */}
      {hasEntered && (
        <motion.div
          className="absolute top-8 right-8 z-50"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
        >
          <Button
            onClick={() => navigate('/memory')}
            variant="outline"
            className="font-mono text-xs backdrop-blur-sm bg-card/50"
          >
            VIEW MEMORIES
          </Button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.div
            key="intro"
            className="min-h-screen flex items-center justify-center p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
          >
            <div className="max-w-2xl text-center space-y-12">
              {/* Title sequence */}
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.h1 
                  className="text-7xl font-bold text-glow"
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
                className="flex justify-center gap-8 text-4xl"
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
                  className="relative group"
                >
                  <motion.div
                    className="w-32 h-32 rounded-full recursive-border bg-card/50 backdrop-blur-sm flex items-center justify-center cursor-pointer"
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
                    <span className="text-3xl text-primary text-glow">◉</span>
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
    </div>
  );
};

export default Index;
