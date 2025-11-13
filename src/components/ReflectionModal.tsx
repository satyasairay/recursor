import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { db } from '@/lib/recursionDB';

interface ReflectionModalProps {
  sessionId: number;
  depth: number;
  open: boolean;
  onClose: () => void;
}

interface GlyphPoint {
  x: number;
  y: number;
  delay: number;
  scale: number;
}

const GLYPH_DURATION = 5000;
const VIEWBOX_SIZE = 100;

export const ReflectionModal = ({ sessionId, depth: _depth, open, onClose }: ReflectionModalProps) => {
  const [glyphPoints, setGlyphPoints] = useState<GlyphPoint[]>([]);
  const [pathString, setPathString] = useState<string>('');
  const [sigils, setSigils] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;

    const generateGlyph = async () => {
      const nodes = await db.nodes.where('sessionId').equals(sessionId).toArray();
      const achievements = await db.achievements.where('sessionId').equals(sessionId).toArray();

      if (!active) return;

      const baseSeed = nodes[0]?.timestamp ?? sessionId;
      const random = createSeededRandom(baseSeed);
      const total = Math.max(6, Math.min(nodes.length || 8, 12));

      const points: GlyphPoint[] = Array.from({ length: total }, (_, i) => {
        const angle = (i / total) * Math.PI * 2 + random() * 0.4;
        const radius = 28 + random() * 22;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;
        const jitterX = (random() - 0.5) * 8;
        const jitterY = (random() - 0.5) * 8;

        return {
          x: 50 + offsetX + jitterX,
          y: 50 + offsetY + jitterY,
          delay: 0.35 + i * 0.18 + random() * 0.15,
          scale: 0.4 + random() * 0.9,
        };
      });

      const trace = buildTrace(points);

      setGlyphPoints(points);
      setPathString(trace);

      const symbolSet = achievements.map((achievement) => achievement.sigil || '◦');
      setSigils(symbolSet);
    };

    if (open && sessionId) {
      generateGlyph();
      if (typeof window !== 'undefined') {
        timer = window.setTimeout(() => {
          if (active) onClose();
        }, GLYPH_DURATION);
      }
    } else {
      setGlyphPoints([]);
      setPathString('');
      setSigils([]);
    }

    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [open, sessionId, onClose]);

  if (!open || glyphPoints.length === 0) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-md bg-background/80 backdrop-blur-2xl border-primary/10 shadow-none">
        <div className="relative py-8 sm:py-10">
          <div className="relative mx-auto aspect-square w-[min(70vw,320px)]">
            {/* Constellation trace */}
            <motion.svg
              key={pathString}
              viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
              className="absolute inset-0"
            >
              <motion.path
                d={pathString}
                stroke="hsla(200, 90%, 75%, 0.45)"
                strokeWidth={0.5}
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 3.2, ease: 'easeInOut' }}
              />
            </motion.svg>

            {/* Fading sigils */}
            {glyphPoints.map((point, index) => (
              <motion.div
                key={`${point.x}-${point.y}-${index}`}
                className="absolute rounded-full mix-blend-screen"
                style={{
                  width: '14px',
                  height: '14px',
                  left: `calc(${point.x}% - 7px)`,
                  top: `calc(${point.y}% - 7px)`,
                  background: 'radial-gradient(circle, hsla(195, 100%, 80%, 0.95) 0%, hsla(195, 100%, 40%, 0.35) 60%, transparent 100%)',
                  boxShadow: '0 0 30px hsla(195, 100%, 75%, 0.6)',
                }}
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: [0, 1, 0], scale: [0.2, point.scale, 0.05] }}
                transition={{
                  duration: 2.6,
                  delay: point.delay,
                  ease: 'easeOut',
                }}
              />
            ))}

            {/* Residual shimmer */}
            <AnimatePresence>
              <motion.div
                key="residual-halo"
                className="absolute inset-0 rounded-full blur-3xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.08, 0.2, 0.05] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  background: 'radial-gradient(circle, hsla(200, 100%, 75%, 0.15) 0%, transparent 65%)',
                }}
              />
            </AnimatePresence>

            {/* Achievement sigils */}
            {sigils.map((sigil, index) => {
              const angle = (index / sigils.length) * Math.PI * 2;
              const radius = 42;
              const x = 50 + Math.cos(angle) * radius;
              const y = 50 + Math.sin(angle) * radius;

              return (
                <motion.span
                  key={`sigil-${index}-${sigil}`}
                  className="absolute text-2xl text-primary/80"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 1, 0.7], scale: [0.6, 1.1, 1] }}
                  transition={{
                    duration: 2.4,
                    delay: 0.6 + index * 0.15,
                    ease: 'easeInOut',
                  }}
                >
                  {sigil}
                </motion.span>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function createSeededRandom(seed: number) {
  let current = seed % 2147483647;
  if (current <= 0) current += 2147483646;

  return () => {
    current = (current * 16807) % 2147483647;
    return (current - 1) / 2147483646;
  };
}

function buildTrace(points: GlyphPoint[]): string {
  if (!points.length) return '';
  const commands = points.map((point, index) => {
    const prefix = index === 0 ? 'M' : 'L';
    return `${prefix} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  });
  return `${commands.join(' ')} Z`;
}
