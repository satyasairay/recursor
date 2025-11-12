import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  angle: number;
}

interface DecayParticlesProps {
  cellIndex: number;
  gridSize: number;
  color: string;
  trigger: number;
}

export const DecayParticles = ({ cellIndex, gridSize, color, trigger }: DecayParticlesProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger > 0) {
      // Calculate cell position
      const row = Math.floor(cellIndex / gridSize);
      const col = cellIndex % gridSize;
      const cellSize = 100 / gridSize;
      const x = col * cellSize + cellSize / 2;
      const y = row * cellSize + cellSize / 2;

      // Generate particles
      const newParticles: Particle[] = Array.from({ length: 8 }, (_, i) => ({
        id: `${Date.now()}-${i}`,
        x,
        y,
        color,
        angle: (i / 8) * Math.PI * 2,
      }));

      setParticles(newParticles);

      // Clear particles after animation
      const timer = setTimeout(() => setParticles([]), 1000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: particle.color,
              boxShadow: `0 0 10px ${particle.color}`,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{
              x: Math.cos(particle.angle) * 60,
              y: Math.sin(particle.angle) * 60,
              scale: [0, 1.5, 0],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 0.8,
              ease: 'easeOut',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
