import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface RecursionPortalProps {
  depth: number;
  onEnter: () => void;
  isActive: boolean;
}

export const RecursionPortal = ({ depth, onEnter, isActive }: RecursionPortalProps) => {
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const depthColor = `hsl(${180 + depth * 30}, 100%, ${50 + depth * 5}%)`;

  return (
    <motion.div
      className="relative flex items-center justify-center cursor-pointer"
      onClick={isActive ? onEnter : undefined}
      whileHover={isActive ? { scale: 1.05 } : {}}
      animate={{
        opacity: isActive ? 1 : 0.4,
        filter: isActive ? 'brightness(1)' : 'brightness(0.5)',
      }}
    >
      {/* Outer ring */}
      <motion.div
        className="absolute w-64 h-64 rounded-full border-2 opacity-30"
        style={{ borderColor: depthColor }}
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
          scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Middle ring */}
      <motion.div
        className="absolute w-48 h-48 rounded-full border-2 opacity-50"
        style={{ borderColor: depthColor }}
        animate={{
          rotate: -360,
          scale: [1, 0.95, 1],
        }}
        transition={{
          rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
          scale: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Core portal */}
      <motion.div
        className="w-32 h-32 rounded-full relative overflow-hidden glow-primary"
        style={{ 
          background: `radial-gradient(circle, ${depthColor}, transparent)`,
        }}
        animate={{
          boxShadow: [
            `0 0 20px ${depthColor}`,
            `0 0 40px ${depthColor}`,
            `0 0 20px ${depthColor}`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Fractal inner pattern */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 border border-primary/20 rounded-full"
            animate={{
              scale: [0.6 + i * 0.1, 0.7 + i * 0.1],
              opacity: [0.2, 0.5, 0.2],
              rotate: i % 2 === 0 ? 360 : -360,
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.2,
            }}
          />
        ))}

        {/* Center symbol */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-glow"
          style={{ color: depthColor }}
          animate={{
            opacity: [0.7, 1, 0.7],
            scale: [0.9, 1, 0.9],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          ∞
        </motion.div>
      </motion.div>

      {/* Depth indicator */}
      <motion.div
        className="absolute -bottom-12 text-sm font-mono text-muted-foreground"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        DEPTH: {depth}
      </motion.div>
    </motion.div>
  );
};
