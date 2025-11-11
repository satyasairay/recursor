import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Pattern } from '@/lib/types';
import { CELLS_TO_SELECT, MAX_CELL_STATE, BASE_HUE, HUE_SHIFT_PER_DEPTH, CELL_REVEAL_DELAY } from '@/lib/constants';

interface PatternGridProps {
  pattern: Pattern;
  onPatternChange: (newPattern: Pattern) => void;
  depth: number;
  locked?: boolean;
}

export const PatternGrid = ({ pattern, onPatternChange, depth, locked = false }: PatternGridProps) => {
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [isRevealing, setIsRevealing] = useState(true);

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
      onPatternChange(newPattern);
      setSelectedCells([]);
    }
  };

  const getCellColor = (value: number, index: number) => {
    const isSelected = selectedCells.includes(index);
    const baseHue = BASE_HUE + depth * HUE_SHIFT_PER_DEPTH;
    const brightness = 50 + (value * 15);
    
    if (isSelected) {
      return `hsl(${baseHue + 50}, 100%, 70%)`;
    }
    return `hsl(${baseHue}, 100%, ${brightness}%)`;
  };

  const gridSize = Math.ceil(Math.sqrt(pattern.length));

  return (
    <div className="relative">
      {/* Grid container */}
      <div 
        className="grid gap-2 p-4 recursive-border rounded-xl"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {pattern.map((value, index) => (
          <motion.button
            key={index}
            className="aspect-square rounded-lg relative overflow-hidden cursor-pointer disabled:cursor-not-allowed"
            style={{
              backgroundColor: getCellColor(value, index),
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
              scale: 1.1,
              boxShadow: `0 0 30px ${getCellColor(value, index)}`,
            } : {}}
            whileTap={!locked && !isRevealing ? { scale: 0.95 } : {}}
          >
            {/* Inner glow effect */}
            <motion.div
              className="absolute inset-0"
              animate={{
                opacity: selectedCells.includes(index) ? [0.3, 0.7, 0.3] : 0.2,
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                background: `radial-gradient(circle, transparent, ${getCellColor(value, index)})`,
              }}
            />

            {/* Value indicator */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center text-2xl font-bold"
              animate={{
                opacity: value > 0 ? 1 : 0.3,
              }}
            >
              {value > 0 ? '●'.repeat(value) : '○'}
            </motion.div>

            {/* Fractal corner markers for mature cells */}
            {value >= MAX_CELL_STATE && (
              <>
                <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-background" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-background" />
              </>
            )}
          </motion.button>
        ))}
      </div>

      {/* Selection progress */}
      {selectedCells.length > 0 && !locked && (
        <motion.div
          className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {[...Array(CELLS_TO_SELECT)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: i < selectedCells.length ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
              }}
              animate={{
                scale: i === selectedCells.length ? [1, 1.3, 1] : 1,
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};
