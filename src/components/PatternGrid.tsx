import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Pattern } from '@/lib/types';
import { CELLS_TO_SELECT, MAX_CELL_STATE, CELL_REVEAL_DELAY } from '@/lib/constants';
import { DecayParticles } from './DecayParticles';

interface PatternGridProps {
  pattern: Pattern;
  onPatternChange: (newPattern: Pattern) => void;
  depth: number;
  locked?: boolean;
}

export const PatternGrid = ({ pattern, onPatternChange, depth: _depth, locked = false }: PatternGridProps) => {
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [isRevealing, setIsRevealing] = useState(true);
  const [decayTriggers, setDecayTriggers] = useState<Record<number, number>>({});

  useEffect(() => {
    // Reveal animation
    setIsRevealing(true);
    const timer = setTimeout(() => setIsRevealing(false), 1000);
    return () => clearTimeout(timer);
  }, [pattern]);

  const handleCellClick = (index: number) => {
    if (locked || isRevealing) return;

    const newSelected = selectedCells.includes(index)
      ? selectedCells.filter(i => i !== index)
      : [...selectedCells, index];

    setSelectedCells(newSelected);

    // Update pattern based on selection
    if (newSelected.length === CELLS_TO_SELECT) {
      const newPattern = pattern.map((val, i) => 
        newSelected.includes(i) ? (val + 1) % (MAX_CELL_STATE + 1) : val
      );
      
      // Trigger decay particles for selected cells
      const triggers: Record<number, number> = {};
      newSelected.forEach(i => {
        triggers[i] = Date.now();
      });
      setDecayTriggers(triggers);
      
      onPatternChange(newPattern);
      setSelectedCells([]);
    }
  };

  const getCellIntensity = (value: number) => value / MAX_CELL_STATE;

  const getCellTone = (value: number, isSelected: boolean) => {
    const intensity = getCellIntensity(value);
    const baseLight = 10 + intensity * 35;
    const glowAlpha = 0.15 + intensity * 0.4;

    return {
      background: `hsla(220, 60%, ${baseLight}%, ${isSelected ? 0.9 : 0.75})`,
      glow: `0 0 ${18 + intensity * 24}px hsla(210, 80%, 70%, ${glowAlpha})`,
      overlay: `radial-gradient(circle, hsla(210, 85%, 80%, ${glowAlpha}) 0%, transparent 65%)`,
    };
  };

  const gridSize = Math.ceil(Math.sqrt(pattern.length));

  return (
    <div className="relative">
      {/* Decay particles overlay */}
      {Object.entries(decayTriggers).map(([index, trigger]) => (
        <DecayParticles
          key={`${index}-${trigger}`}
          cellIndex={parseInt(index)}
          gridSize={gridSize}
          color="hsla(210, 100%, 75%, 0.6)"
          trigger={trigger}
        />
      ))}
      
      {/* Grid container */}
      <div 
        className="grid gap-2 sm:gap-3 p-3 sm:p-4 recursive-border rounded-xl"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(44px, 1fr))`,
        }}
      >
        {pattern.map((value, index) => {
          const isSelected = selectedCells.includes(index);
          const tone = getCellTone(value, isSelected);

          return (
            <motion.button
              key={index}
              className="aspect-square rounded-lg relative overflow-hidden cursor-pointer disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
              style={{
                backgroundColor: tone.background,
                boxShadow: tone.glow,
              }}
              onClick={() => handleCellClick(index)}
              disabled={locked || isRevealing}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: isRevealing ? [0.8, 1.05, 1] : 1,
                rotate: isRevealing ? [-180, 10, 0] : 0,
              }}
              transition={{
                delay: index * (CELL_REVEAL_DELAY / 1000),
                duration: 0.6,
                ease: 'easeOut',
              }}
              whileHover={!locked && !isRevealing ? { 
                scale: 1.12,
                boxShadow: '0 0 40px hsla(210, 90%, 70%, 0.4)',
              } : {}}
              whileTap={!locked && !isRevealing ? { scale: 0.95 } : {}}
            >
              {/* Inner glow effect */}
              <motion.div
                className="absolute inset-0"
                animate={{
                  opacity: isSelected ? [0.25, 0.6, 0.25] : 0.18 + getCellIntensity(value) * 0.4,
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  background: tone.overlay,
                }}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
