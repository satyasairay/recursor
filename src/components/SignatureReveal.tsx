import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/recursionDB';
import { AchievementCode } from '@/lib/types';

type ShapeType = 'spiral' | 'web' | 'cluster' | 'scatter' | 'drift';

const FALLBACK_SEQUENCE: ShapeType[] = ['spiral', 'web', 'cluster', 'scatter', 'drift'];

const SAMPLE_POINTS = 24;

export const SignatureReveal = () => {
  const sessions = useLiveQuery(() => db.sessions.toArray()) || [];
  const nodes = useLiveQuery(() => db.nodes.toArray()) || [];
  const achievements = useLiveQuery(() => db.achievements.toArray()) || [];

  const meetsThreshold = useMemo(() => {
    return sessions.length >= 3 && nodes.length >= 30;
  }, [sessions.length, nodes.length]);

  const achievementSet = useMemo(() => new Set<AchievementCode>(achievements.map(a => a.code)), [achievements]);

  const signatureSeed = useMemo(() => {
    if (!meetsThreshold) return 0;
    const sessionSum = sessions.reduce((sum, session) => sum + session.timestamp + session.depth * 17, 0);
    const nodeSum = nodes.reduce((sum, node) => sum + node.pattern.length * 3 + node.depth * 11 + node.connections.length * 19, 0);
    const sigilSum = achievements.reduce((sum, achievement, index) => sum + achievement.sigil.charCodeAt(0) * (index + 1), 0);
    const combined = sessionSum + nodeSum + sigilSum;
    return Math.abs(combined % 997) + 1;
  }, [achievements, meetsThreshold, nodes, sessions]);

  const derivedShape = useMemo<ShapeType>(() => {
    if (!meetsThreshold) {
      return FALLBACK_SEQUENCE[0];
    }

    const depthAverage =
      sessions.length > 0 ? sessions.reduce((sum, session) => sum + session.depth, 0) / sessions.length : 0;

    const interactionAverage =
      sessions.length > 0
        ? sessions.reduce((sum, session) => sum + session.metadata.interactionCount, 0) / sessions.length
        : 0;

    const connectionAverage =
      nodes.length > 0 ? nodes.reduce((sum, node) => sum + node.connections.length, 0) / nodes.length : 0;

    const uniquePatterns = new Set(nodes.map(node => node.patternSignature)).size;
    const patternDiversity = nodes.length > 0 ? uniquePatterns / nodes.length : 0;

    if (achievementSet.has('rapid_descent') || depthAverage >= 10) {
      return 'spiral';
    }

    if (achievementSet.has('connection_weaver') || connectionAverage >= 8) {
      return 'web';
    }

    if (achievementSet.has('the_scatterer') || patternDiversity >= 0.7) {
      return 'scatter';
    }

    if (achievementSet.has('looped_path') || achievementSet.has('perfect_symmetry') || interactionAverage >= 80) {
      return 'cluster';
    }

    if (achievementSet.has('decay_master') || achievementSet.has('void_gazer')) {
      return 'drift';
    }

    const entropySeed =
      (nodes.length * 3 + achievements.length * 7 + sessions.length * 13 + Math.floor(patternDiversity * 11)) %
      FALLBACK_SEQUENCE.length;
    return FALLBACK_SEQUENCE[entropySeed];
  }, [achievementSet, achievements.length, meetsThreshold, nodes, sessions]);

  const renderShape = (type: ShapeType) => {
    switch (type) {
      case 'spiral':
        return <Spiral seed={signatureSeed} />;
      case 'web':
        return <Web seed={signatureSeed} />;
      case 'cluster':
        return <Cluster seed={signatureSeed} />;
      case 'scatter':
        return <Scatter seed={signatureSeed} />;
      case 'drift':
      default:
        return <Drift seed={signatureSeed} />;
    }
  };

  if (!meetsThreshold) {
    return (
      <div className="relative h-72 sm:h-80 flex items-center justify-center">
        <motion.div
          className="w-48 h-48 rounded-full border border-primary/20"
          animate={{ rotate: 360, opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="relative h-72 sm:h-96 flex items-center justify-center">
      <motion.div
        className="absolute inset-0 blur-3xl bg-primary/10"
        animate={{ opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative w-[min(80vw,420px)] aspect-square recursive-border rounded-2xl bg-card/20 backdrop-blur-md overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: [0, 2, -2, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        >
          {renderShape(derivedShape)}
        </motion.div>
      </div>
    </div>
  );
};

const Spiral = ({ seed }: { seed: number }) => {
  const rotations = 2.5;
  const radius = 140;
  return (
    <svg viewBox="0 0 400 400" className="absolute inset-0">
      {Array.from({ length: SAMPLE_POINTS }).map((_, index) => {
        const progress = index / SAMPLE_POINTS;
        const angle = rotations * Math.PI * 2 * progress;
        const currentRadius = radius * progress;
        const x = 200 + Math.cos(angle + seed * 0.01) * currentRadius;
        const y = 200 + Math.sin(angle + seed * 0.01) * currentRadius;
        return (
          <motion.circle
            key={`spiral-${index}`}
            cx={x}
            cy={y}
            r={4 + progress * 6}
            fill="hsla(190, 90%, 70%, 0.8)"
            animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.2, 0.9] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: index * 0.08 }}
          />
        );
      })}
    </svg>
  );
};

const Web = ({ seed }: { seed: number }) => {
  const rings = 5;
  const spokes = 8;
  const maxRadius = 150;
  return (
    <svg viewBox="0 0 400 400" className="absolute inset-0">
      {Array.from({ length: rings }).map((_, ringIdx) => {
        const radius = (maxRadius / rings) * (ringIdx + 1);
        return (
          <motion.circle
            key={`ring-${ringIdx}`}
            cx={200}
            cy={200}
            r={radius}
            fill="none"
            stroke="hsla(200, 80%, 65%, 0.35)"
            strokeWidth={1}
            animate={{ opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 5 + ringIdx, repeat: Infinity, ease: 'easeInOut', delay: ringIdx * 0.2 }}
          />
        );
      })}

      {Array.from({ length: spokes }).map((_, spokeIdx) => {
        const angle = (Math.PI * 2 * spokeIdx) / spokes + seed * 0.005;
        const x = 200 + Math.cos(angle) * maxRadius;
        const y = 200 + Math.sin(angle) * maxRadius;
        return (
          <motion.line
            key={`spoke-${spokeIdx}`}
            x1={200}
            y1={200}
            x2={x}
            y2={y}
            stroke="hsla(200, 90%, 75%, 0.4)"
            strokeWidth={1}
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: spokeIdx * 0.1 }}
          />
        );
      })}
    </svg>
  );
};

const Cluster = ({ seed }: { seed: number }) => {
  const groups = 4;
  const baseRadius = 60;
  const offsets = [
    { x: -70, y: -20 },
    { x: 60, y: -10 },
    { x: -40, y: 70 },
    { x: 50, y: 70 },
  ];

  return (
    <svg viewBox="0 0 400 400" className="absolute inset-0">
      {Array.from({ length: groups }).map((_, groupIdx) => {
        const offset = offsets[groupIdx % offsets.length];
        return Array.from({ length: 6 }).map((__, index) => {
          const angle = (Math.PI * 2 * index) / 6;
          const radius = baseRadius + Math.sin(seed * 0.01 + groupIdx) * 10;
          const x = 200 + offset.x + Math.cos(angle) * radius;
          const y = 200 + offset.y + Math.sin(angle) * radius;
          return (
            <motion.circle
              key={`cluster-${groupIdx}-${index}`}
              cx={x}
              cy={y}
              r={8}
              fill="hsla(195, 100%, 75%, 0.7)"
              animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.8, 1.1, 0.9] }}
              transition={{ duration: 5 + groupIdx * 0.6, repeat: Infinity, ease: 'easeInOut', delay: index * 0.12 }}
            />
          );
        });
      })}
    </svg>
  );
};

const Scatter = ({ seed }: { seed: number }) => {
  const scatterPoints = 40;
  const random = seededRandom(seed);

  return (
    <svg viewBox="0 0 400 400" className="absolute inset-0">
      {Array.from({ length: scatterPoints }).map((_, index) => {
        const x = 60 + random() * 280;
        const y = 60 + random() * 280;
        const size = 3 + random() * 6;
        return (
          <motion.circle
            key={`scatter-${index}`}
            cx={x}
            cy={y}
            r={size}
            fill="hsla(188, 90%, 70%, 0.6)"
            animate={{ opacity: [0.1, 0.8, 0.1], scale: [0.7, 1.3, 0.8] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.05 }}
          />
        );
      })}
    </svg>
  );
};

const Drift = ({ seed }: { seed: number }) => {
  const lines = 6;
  const amplitude = 60;
  return (
    <svg viewBox="0 0 400 400" className="absolute inset-0">
      {Array.from({ length: lines }).map((_, index) => {
        const y = 80 + index * 40;
        return (
          <motion.path
            key={`drift-${index}`}
            d={generateWavePath(200, y, amplitude, seed + index * 10)}
            stroke="hsla(190, 85%, 65%, 0.5)"
            strokeWidth={2}
            fill="none"
            animate={{ opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 7 + index, repeat: Infinity, ease: 'easeInOut' }}
          />
        );
      })}
    </svg>
  );
};

function seededRandom(seed: number) {
  let value = seed || 1;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function generateWavePath(length: number, yOffset: number, amplitude: number, seed: number) {
  const segments = 12;
  const step = length / segments;
  let path = `M ${200 - length / 2} ${yOffset}`;
  for (let i = 1; i <= segments; i++) {
    const progress = i / segments;
    const x = 200 - length / 2 + step * i;
    const y =
      yOffset +
      Math.sin(progress * Math.PI * 2 + seed * 0.02) * amplitude * (0.4 + Math.sin(progress * Math.PI) * 0.6);
    path += ` L ${x} ${y}`;
  }
  return path;
}

