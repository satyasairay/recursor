import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getArchitectureColors } from '@/lib/narrativeEngine';

interface DepthVortexProps {
  stage: number;
  phase: number;
}

export const DepthVortex = ({ stage, phase }: DepthVortexProps) => {
  const [colors] = useState(() => getArchitectureColors(phase));
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(interval);
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
          scale: [1, 1.2, 1],
          opacity: [opacity, opacity * 1.5, opacity],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          width: '150vmax',
          height: '150vmax',
          background: `radial-gradient(circle, ${colors[0]}15 0%, transparent 60%)`,
        }}
      />

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
