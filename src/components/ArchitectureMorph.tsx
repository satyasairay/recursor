import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ArchitectureMorphProps {
  phase: number;
}

export const ArchitectureMorph = ({ phase }: ArchitectureMorphProps) => {
  const [pattern, setPattern] = useState(0);

  useEffect(() => {
    if (phase < 2) return;
    
    const interval = setInterval(() => {
      setPattern((prev) => (prev + 1) % 3);
    }, 8000);

    return () => clearInterval(interval);
  }, [phase]);

  if (phase < 2) return null;

  const opacity = 0.02 + (phase * 0.01);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Grid distortion */}
      {pattern === 0 && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity }}
          exit={{ opacity: 0 }}
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(155,135,245,${opacity}) 1px, transparent 1px),
              linear-gradient(rgba(155,135,245,${opacity}) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        >
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(155,135,245,${opacity * 0.5}) 1px, transparent 1px),
                linear-gradient(rgba(155,135,245,${opacity * 0.5}) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
        </motion.div>
      )}

      {/* Hexagonal pattern */}
      {pattern === 1 && phase >= 3 && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity }}
          exit={{ opacity: 0 }}
        >
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hexagons" x="0" y="0" width="56" height="100" patternUnits="userSpaceOnUse">
                <polygon
                  points="28,0 56,17 56,50 28,67 0,50 0,17"
                  fill="none"
                  stroke="rgba(155,135,245,0.1)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexagons)" />
          </svg>
        </motion.div>
      )}

      {/* Fractal triangles */}
      {pattern === 2 && phase >= 4 && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity }}
          exit={{ opacity: 0 }}
        >
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="triangles" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path
                  d="M50 0 L100 100 L0 100 Z"
                  fill="none"
                  stroke="rgba(155,135,245,0.08)"
                  strokeWidth="1"
                />
                <path
                  d="M50 50 L75 100 L25 100 Z"
                  fill="none"
                  stroke="rgba(155,135,245,0.06)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#triangles)" />
          </svg>
        </motion.div>
      )}

      {/* Corner anchors that pulse with depth */}
      {phase >= 3 && (
        <>
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
            <motion.div
              key={corner}
              className={`absolute w-24 h-24 ${corner.includes('top') ? 'top-8' : 'bottom-8'} ${corner.includes('left') ? 'left-8' : 'right-8'}`}
              animate={{
                opacity: [opacity * 2, opacity * 4, opacity * 2],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path
                  d={
                    corner === 'top-left'
                      ? 'M 0 20 L 0 0 L 20 0'
                      : corner === 'top-right'
                      ? 'M 80 0 L 100 0 L 100 20'
                      : corner === 'bottom-left'
                      ? 'M 0 80 L 0 100 L 20 100'
                      : 'M 80 100 L 100 100 L 100 80'
                  }
                  stroke="rgba(155,135,245,0.4)"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </motion.div>
          ))}
        </>
      )}
    </div>
  );
};
