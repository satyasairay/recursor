import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { getArchitectureColors } from '@/lib/narrativeEngine';

interface DepthVortexProps {
  stage: number;
  phase: number;
}

export const DepthVortex = ({ stage, phase }: DepthVortexProps) => {
  const [colors] = useState(() => getArchitectureColors(phase));
  const [rotation, setRotation] = useState(0);
  const [pulse, setPulse] = useState(false);
  const pulseTimeout = useRef<number>();

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const listener = () => {
      if (pulseTimeout.current) {
        window.clearTimeout(pulseTimeout.current);
      }
      setPulse(true);
      pulseTimeout.current = window.setTimeout(() => setPulse(false), 900);
    };

    window.addEventListener('recursor-branch-pulse', listener);
    return () => {
      window.removeEventListener('recursor-branch-pulse', listener);
      if (pulseTimeout.current) {
        window.clearTimeout(pulseTimeout.current);
      }
    };
  }, []);

  // No vortex until stage 1
  if (stage < 1) return null;

  const intensity = Math.min(stage / 5, 1);
  const ringCount = Math.min(stage + 2, 8);
  const opacity = 0.02 + (intensity * 0.08);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Central vortex */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          scale: pulse ? [1.05, 1.3, 0.95] : [1, 1.2, 1],
          opacity: pulse ? [opacity * 2.2, opacity * 0.6, opacity] : [opacity, opacity * 1.5, opacity],
        }}
        transition={{
          duration: pulse ? 1.2 : 8,
          repeat: pulse ? 0 : Infinity,
          ease: 'easeInOut',
        }}
        style={{
          width: '150vmax',
          height: '150vmax',
          background: `radial-gradient(circle, ${colors[0]}15 0%, transparent 60%)`,
        }}
      />

      {/* Branch pulse glyph */}
      <AnimatePresence>
        {pulse && (
          <motion.div
            key="branch-pulse"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.8, 0], scale: [0.8, 1.6] }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{
              width: '60vmax',
              height: '60vmax',
              boxShadow: `0 0 80px ${colors[0]}60`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Rotating rings */}
      {Array.from({ length: ringCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            width: `${20 + i * 15}vmax`,
            height: `${20 + i * 15}vmax`,
            borderColor: `${colors[i % 2]}`,
            borderWidth: '1px',
            opacity: opacity * (1 - i / ringCount),
            transform: `translate(-50%, -50%) rotate(${rotation + i * 45}deg)`,
          }}
          animate={{
            rotate: [rotation + i * 45, rotation + i * 45 + 360],
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Geometric patterns for higher phases */}
      {phase >= 3 && (
        <>
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={`geo-${i}`}
              className="absolute"
              style={{
                width: '2px',
                height: '100vh',
                left: `${16.6 * (i + 1)}%`,
                background: `linear-gradient(to bottom, transparent 0%, ${colors[0]}20 50%, transparent 100%)`,
              }}
              animate={{
                opacity: [0, opacity * 2, 0],
                scaleY: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.5,
              }}
            />
          ))}
        </>
      )}

      {/* Fractal noise for maximum phase */}
      {phase >= 5 && (
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity: [opacity, opacity * 2, opacity],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, ${colors[0]}08 0%, transparent 50%),
              radial-gradient(circle at 80% 50%, ${colors[1]}08 0%, transparent 50%),
              radial-gradient(circle at 50% 20%, ${colors[0]}05 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, ${colors[1]}05 0%, transparent 50%)
            `,
          }}
        />
      )}
    </div>
  );
};
