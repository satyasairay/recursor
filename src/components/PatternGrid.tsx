import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Pattern } from '@/lib/types';
import { CELLS_TO_SELECT, MAX_CELL_STATE, BASE_HUE, HUE_SHIFT_PER_DEPTH, CELL_REVEAL_DELAY } from '@/lib/constants';
import { DecayParticles } from './DecayParticles';

interface PatternGridProps {
  pattern: Pattern;
  onPatternChange: (newPattern: Pattern) => void;
  depth: number;
  locked?: boolean;
}

export const PatternGrid = ({ pattern, onPatternChange, depth, locked = false }: PatternGridProps) => {
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

  const getCellColor = (value: number, index: number) => {
    const isSelected = selectedCells.includes(index);
    const baseHue = BASE_HUE + depth * HUE_SHIFT_PER_DEPTH;
    
    // Dark cosmic palette: deep blues, violets, cyans
    // Saturation decreases with value for mystery
    const saturation = 70 - (value * 8);
    const lightness = 15 + (value * 8); // Much darker range (15-40%)
    
    if (isSelected) {
      // Selected cells glow with cyan accent
      return `hsl(${baseHue + 60}, 85%, 45%)`;
    }
    return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
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
          color={getCellColor(pattern[parseInt(index)], parseInt(index))}
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
        {pattern.map((value, index) => (
          <motion.button
            key={index}
            className="aspect-square rounded-lg relative overflow-hidden cursor-pointer disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
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
              scale: 1.15,
              boxShadow: `0 0 40px ${getCellColor(value, index)}, 0 0 60px ${getCellColor(value, index)}`,
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
              className="absolute inset-0 flex items-center justify-center text-lg sm:text-xl md:text-2xl font-bold"
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

      {/* Selection progress - visual only, no text */}
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
                backgroundColor: i < selectedCells.length ? 'hsl(180, 70%, 50%)' : 'hsl(220, 20%, 25%)',
                boxShadow: i < selectedCells.length ? '0 0 10px hsl(180, 70%, 50%)' : 'none',
              }}
              animate={{
                scale: i === selectedCells.length ? [1, 1.4, 1] : 1,
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};
