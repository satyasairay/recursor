import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGlitchParams } from '@/lib/narrativeEngine';

interface GlitchEffectProps {
  depth: number;
  children: React.ReactNode;
}

export const GlitchEffect = ({ depth, children }: GlitchEffectProps) => {
  const [isGlitching, setIsGlitching] = useState(false);
  const params = getGlitchParams(depth);

  useEffect(() => {
    if (depth < 3) return; // No glitches until depth 3

    const interval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), params.duration);
    }, params.frequency);

    return () => clearInterval(interval);
  }, [depth, params.frequency, params.duration]);

  if (depth < 3) return <>{children}</>;

  return (
    <motion.div
      className="relative"
      animate={
        isGlitching
          ? {
              x: [0, -params.displacement, params.displacement, 0],
              filter: [
                'hue-rotate(0deg)',
                `hue-rotate(${params.colorShift}deg)`,
                `hue-rotate(-${params.colorShift}deg)`,
                'hue-rotate(0deg)',
              ],
            }
          : {}
      }
      transition={{ duration: params.duration / 1000, ease: 'easeInOut' }}
    >
      {children}
      
      {/* Scanlines overlay for deeper depths */}
      <AnimatePresence>
        {isGlitching && params.scanlines && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Chromatic aberration for very deep depths */}
      <AnimatePresence>
        {isGlitching && params.chromatic && (
          <>
            <motion.div
              className="absolute inset-0 pointer-events-none mix-blend-screen opacity-70"
              initial={{ x: 0 }}
              animate={{ x: params.displacement }}
              exit={{ x: 0 }}
              style={{
                filter: 'blur(1px)',
                background: 'radial-gradient(circle, rgba(255,0,0,0.1) 0%, transparent 70%)',
              }}
            />
            <motion.div
              className="absolute inset-0 pointer-events-none mix-blend-screen opacity-70"
              initial={{ x: 0 }}
              animate={{ x: -params.displacement }}
              exit={{ x: 0 }}
              style={{
                filter: 'blur(1px)',
                background: 'radial-gradient(circle, rgba(0,0,255,0.1) 0%, transparent 70%)',
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Reality distortion for maximum depth */}
      <AnimatePresence>
        {isGlitching && params.distortion && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ 
              opacity: [0, 0.3, 0],
              scale: [1, 1.02, 1],
            }}
            exit={{ opacity: 0 }}
            style={{
              background: 'radial-gradient(circle at center, transparent 0%, rgba(139,92,246,0.1) 100%)',
              mixBlendMode: 'screen',
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
