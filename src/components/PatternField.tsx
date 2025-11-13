import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Pattern } from '@/lib/types';
import { CELLS_TO_SELECT, MAX_CELL_STATE } from '@/lib/constants';
import { db } from '@/lib/recursionDB';

interface PatternFieldProps {
  pattern: Pattern;
  onPatternChange: (newPattern: Pattern) => void;
  depth: number;
  locked?: boolean;
}

type Point = {
  x: number;
  y: number;
};

type CellGeometry = {
  index: number;
  position: Point;
  intensity: number;
  memory: number;
  distortion: number;
  resonance: number;
};

type VoronoiCell = {
  index: number;
  polygon: Point[];
  centroid: Point;
};

type Attractor = {
  index: number;
  position: Point;
  weight: number;
};

type Scar = {
  path: string;
  weight: number;
  branching: boolean;
};

const BOUNDS = { min: 6, max: 94 };
const VORONOI_STEPS = 80;

export const PatternField = ({ pattern, onPatternChange, depth, locked = false }: PatternFieldProps) => {
  const historyNodes = useLiveQuery(() => db.nodes.toArray()) ?? [];
  const [selected, setSelected] = useState<number[]>([]);
  const [interactionSignature, setInteractionSignature] = useState(() => deriveResonanceSignature(pattern));

  useEffect(() => {
    setSelected([]);
    setInteractionSignature(deriveResonanceSignature(pattern));
  }, [pattern]);

  const historyVector = useMemo(
    () => deriveHistoryVector(historyNodes, pattern.length),
    [historyNodes, pattern.length]
  );

  const distortionMap = useMemo(
    () => deriveDistortionMap(historyNodes, pattern.length),
    [historyNodes, pattern.length]
  );

  const cells = useMemo(
    () => deriveCellGeometries(pattern, depth, historyVector, distortionMap),
    [pattern, depth, historyVector, distortionMap]
  );

  const voronoiCells = useMemo(() => computeVoronoiCells(cells), [cells]);
  const attractors = useMemo(
    () => deriveAttractors(historyVector, distortionMap, depth),
    [historyVector, distortionMap, depth]
  );
  const scars = useMemo(() => computeScars(historyNodes, pattern.length), [historyNodes, pattern.length]);
  const resonanceSignature = useMemo(() => deriveResonanceSignature(pattern), [pattern]);

  const connections = useMemo(() => {
    if (attractors.length === 0) return [];
    return cells.map(cell => {
      const anchor = findNearestAttractor(cell.position, attractors);
      return {
        key: cell.index,
        path: `M ${cell.position.x} ${cell.position.y} L ${anchor.position.x} ${anchor.position.y}`,
        weight: clamp(anchor.weight * 1.4, 0.2, 1.6),
        resonance: cell.resonance,
      };
    });
  }, [cells, attractors]);

  const handleCellSelect = (index: number) => {
    if (locked) return;

    const updated = selected.includes(index)
      ? selected.filter(i => i !== index)
      : [...selected, index];

    setSelected(updated);

    if (updated.length === CELLS_TO_SELECT) {
      const updatedPattern = pattern.map((value, i) =>
        updated.includes(i) ? (value + 1) % (MAX_CELL_STATE + 1) : value
      );

      onPatternChange(updatedPattern);
      setSelected([]);
      setInteractionSignature(deriveResonanceSignature(updatedPattern));
    }
  };

  return (
    <div className="relative mx-auto w-[min(90vw,420px)] aspect-square">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="pattern-field-depth" cx="50%" cy="50%" r="64%">
            <stop offset="0%" stopColor={`hsla(${195 + depth * 9}, 60%, 14%, 0.85)`} />
            <stop offset="70%" stopColor={`hsla(${205 + depth * 7}, 40%, 6%, 0.35)`} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="100" height="100" fill="url(#pattern-field-depth)" />

        {scars.map((scar, index) => (
          <motion.path
            key={`scar-${index}`}
            d={scar.path}
            fill="none"
            stroke={`hsla(${scar.branching ? 280 : 200}, 70%, 60%, ${0.25 + scar.weight * 0.2})`}
            strokeWidth={0.45 + scar.weight * 0.5}
            strokeLinecap="round"
            animate={{
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 6 + index * 0.05,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {connections.map(connection => (
          <motion.path
            key={`connection-${connection.key}-${interactionSignature}`}
            d={connection.path}
            fill="none"
            stroke={`hsla(${210 + connection.resonance * 40}, 90%, 70%, ${0.15 + connection.weight * 0.1})`}
            strokeWidth={0.35 + Math.abs(connection.resonance) * 0.8}
            strokeLinecap="round"
            strokeDasharray="3 6"
            animate={{
              strokeDashoffset: [0, -9],
            }}
            transition={{
              duration: 5 - connection.weight,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}

        {attractors.map(attractor => (
          <g key={`attractor-${attractor.index}`}>
            <motion.path
              d={generateAttractorGlyph(attractor.position, attractor.weight)}
              fill="none"
              stroke={`hsla(${230 + attractor.weight * 80}, 80%, 68%, 0.4)`}
              strokeWidth={0.5 + attractor.weight * 0.6}
              animate={{
                opacity: [0.2, 0.7, 0.2],
              }}
              transition={{
                duration: 4 + attractor.index,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </g>
        ))}

        {cells.map(cell => {
          const region = voronoiCells.find(v => v.index === cell.index);
          if (!region) return null;

          const path = pointsToPath(region.polygon);
          const isSelected = selected.includes(cell.index);
          const fillOpacity = 0.15 + cell.intensity * 0.25 + cell.distortion * 0.2;
          const strokeWidth = 0.5 + cell.distortion * 0.9 + (isSelected ? 0.8 : 0);
          const highlightOpacity = isSelected ? 0.4 : 0.18 + Math.abs(cell.resonance) * 0.18;

          return (
            <g key={`cell-${cell.index}`}>
              <motion.path
                d={path}
                fill={`hsla(${210 + cell.memory * 45}, 70%, 58%, ${fillOpacity})`}
                stroke={`hsla(${200 + cell.resonance * 60}, 85%, 80%, ${highlightOpacity})`}
                strokeWidth={strokeWidth}
                onClick={() => handleCellSelect(cell.index)}
                style={{ cursor: locked ? 'default' : 'pointer' }}
                initial={{ opacity: 0.6 }}
                animate={{
                  opacity: [0.52, 0.78, 0.52],
                  strokeDashoffset: isSelected ? [0, 6, 0] : [0, 0],
                }}
                transition={{
                  duration: 3.8 - cell.intensity,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              <motion.path
                d={`M ${region.centroid.x} ${region.centroid.y} L ${cell.position.x} ${cell.position.y}`}
                stroke={`hsla(${200 + cell.resonance * 60}, 70%, 65%, ${0.14 + Math.abs(cell.resonance) * 0.25})`}
                strokeWidth={0.35 + Math.abs(cell.resonance) * 0.6}
                strokeLinecap="round"
                animate={{
                  opacity: [0.18, 0.5, 0.18],
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </g>
          );
        })}

        <motion.path
          d={generateResonanceRing(resonanceSignature)}
          fill="none"
          stroke={`hsla(${210 + resonanceSignature % 60}, 65%, 70%, 0.32)`}
          strokeWidth={0.6}
          strokeDasharray="2 6"
          animate={{
            strokeDashoffset: [0, 8],
            opacity: [0.25, 0.55, 0.25],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </svg>
    </div>
  );
};

function deriveHistoryVector(nodes: any[], length: number): number[] {
  if (length === 0 || nodes.length === 0) {
    return new Array(length).fill(0);
  }

  const vector = new Array(length).fill(0);
  const counts = new Array(length).fill(0);

  nodes.forEach(node => {
    if (!node.pattern || node.pattern.length === 0) return;
    const sourceLength = node.pattern.length;

    for (let i = 0; i < length; i++) {
      const sourceIndex = Math.min(sourceLength - 1, Math.floor((i / length) * sourceLength));
      vector[i] += node.pattern[sourceIndex];
      counts[i] += 1 + node.depth * 0.1;
    }
  });

  return vector.map((sum, index) => {
    const denom = counts[index] || 1;
    return clamp(sum / denom / MAX_CELL_STATE, 0, 1);
  });
}

function deriveDistortionMap(nodes: any[], length: number): number[] {
  if (length === 0 || nodes.length === 0) {
    return new Array(length).fill(0);
  }

  const distortion = new Array(length).fill(0);
  let max = 0;

  const ordered = [...nodes].sort((a, b) => a.timestamp - b.timestamp);
  ordered.forEach((node, orderIndex) => {
    if (!node.pattern || node.pattern.length === 0) return;
    const weight = 1 + node.depth * 0.2 + orderIndex / ordered.length;
    const sourceLength = node.pattern.length;

    for (let i = 0; i < length; i++) {
      const sourceIndex = Math.min(sourceLength - 1, Math.floor((i / length) * sourceLength));
      distortion[i] += node.pattern[sourceIndex] * weight;
      if (distortion[i] > max) {
        max = distortion[i];
      }
    }
  });

  if (max === 0) {
    return distortion;
  }

  return distortion.map(value => clamp(value / max, 0, 1));
}

function deriveCellGeometries(
  pattern: Pattern,
  depth: number,
  historyVector: number[],
  distortionMap: number[]
): CellGeometry[] {
  const length = pattern.length;
  if (length === 0) return [];

  const depthFactor = Math.min(depth, 24);
  const symmetry = computeSymmetry(historyVector);
  const baseRadius = 18 + depthFactor * 1.4 + symmetry * 6;
  const depthPhase = depth * 0.065;

  return pattern.map((value, index) => {
    const normalized = (index + 0.5) / length;
    const intensity = value / MAX_CELL_STATE;
    const memory = historyVector[index] ?? 0;
    const distortion = distortionMap[index] ?? 0;
    const resonance = intensity - memory;
    const parity = index % 2 === 0 ? 1 : -1;
    const angularShift = (memory - 0.5) * 0.85 + (distortion - 0.5) * 0.7 + parity * symmetry * 0.6;
    const angle = normalized * Math.PI * 2 + depthPhase + angularShift;
    const radiusBase = baseRadius + memory * 14 + distortion * 22 + resonance * 10;
    const radius = clamp(radiusBase, 14, 48);
    const ellipse = 0.74 + memory * 0.18 + distortion * 0.15;

    const x = clamp(50 + Math.cos(angle) * radius, BOUNDS.min, BOUNDS.max);
    const y = clamp(50 + Math.sin(angle) * radius * ellipse, BOUNDS.min, BOUNDS.max);

    return {
      index,
      position: { x, y },
      intensity,
      memory,
      distortion,
      resonance,
    };
  });
}

function computeVoronoiCells(cells: CellGeometry[]): VoronoiCell[] {
  return cells.map(cell => {
    const polygon: Point[] = [];
    const origin = cell.position;

    for (let step = 0; step < VORONOI_STEPS; step++) {
      const angle = (step / VORONOI_STEPS) * Math.PI * 2;
      const direction = { x: Math.cos(angle), y: Math.sin(angle) };
      let distance = boundaryDistance(origin, direction);

      cells.forEach(neighbor => {
        if (neighbor.index === cell.index) return;
        const candidate = bisectorIntersection(origin, neighbor.position, direction);
        if (candidate > 0 && candidate < distance) {
          distance = candidate;
        }
      });

      const point = {
        x: clamp(origin.x + direction.x * distance, BOUNDS.min, BOUNDS.max),
        y: clamp(origin.y + direction.y * distance, BOUNDS.min, BOUNDS.max),
      };

      polygon.push(point);
    }

    const centroid = computeCentroid(polygon, origin);
    return { index: cell.index, polygon, centroid };
  });
}

function deriveAttractors(historyVector: number[], distortionMap: number[], depth: number): Attractor[] {
  if (historyVector.length === 0) return [];

  const groupCount = Math.max(2, Math.min(4, Math.round(historyVector.length / 3)));
  const attractors: Attractor[] = [];

  for (let group = 0; group < groupCount; group++) {
    const start = Math.floor((group / groupCount) * historyVector.length);
    const end = Math.floor(((group + 1) / groupCount) * historyVector.length);
    const segment = historyVector.slice(start, Math.max(start + 1, end));
    const distortionSegment = distortionMap.slice(start, Math.max(start + 1, end));

    const segmentAverage = segment.reduce((sum, value) => sum + value, 0) / Math.max(1, segment.length);
    const distortionAverage =
      distortionSegment.reduce((sum, value) => sum + value, 0) / Math.max(1, distortionSegment.length);

    const combined = clamp(segmentAverage * 0.7 + distortionAverage * 0.3, 0, 1);
    const angle = (group / groupCount) * Math.PI * 2 + depth * 0.04 + combined * 0.8;
    const radius = clamp(26 + combined * 34 + depth * 1.2, 18, 52);
    const ellipse = 0.8 + combined * 0.18;

    const position = {
      x: clamp(50 + Math.cos(angle) * radius, BOUNDS.min, BOUNDS.max),
      y: clamp(50 + Math.sin(angle) * radius * ellipse, BOUNDS.min, BOUNDS.max),
    };

    attractors.push({
      index: group,
      position,
      weight: combined,
    });
  }

  return attractors;
}

function computeScars(nodes: any[], baseLength: number): Scar[] {
  if (nodes.length < 2) return [];

  const ordered = [...nodes].sort((a, b) => a.timestamp - b.timestamp);
  const limit = Math.min(ordered.length, 80);
  const subset = ordered.slice(-limit);
  const scars: Scar[] = [];

  for (let i = 1; i < subset.length; i++) {
    const previous = subset[i - 1];
    const current = subset[i];
    if (!previous.pattern || !current.pattern) continue;

    const from = signaturePoint(previous.pattern, previous.depth, baseLength);
    const to = signaturePoint(current.pattern, current.depth, baseLength);
    const depthDelta = Math.abs((current.depth ?? 0) - (previous.depth ?? 0));
    const weight = clamp(depthDelta / 12 + i / subset.length, 0.2, 1.6);

    scars.push({
      path: `M ${from.x} ${from.y} L ${to.x} ${to.y}`,
      weight,
      branching: (current.depth ?? 0) % 3 === 0,
    });
  }

  return scars;
}

function computeSymmetry(values: number[]): number {
  if (values.length === 0) return 0;
  const half = Math.floor(values.length / 2);
  let sum = 0;

  for (let i = 0; i < half; i++) {
    const mirrorIndex = values.length - 1 - i;
    sum += Math.abs((values[i] ?? 0) - (values[mirrorIndex] ?? 0));
  }

  return clamp(sum / Math.max(1, half), 0, 1);
}

function deriveResonanceSignature(pattern: Pattern): number {
  return pattern.reduce((sum, value, index) => sum + (value + 1) * (index + 1), 0);
}

function generateAttractorGlyph(position: Point, weight: number): string {
  const span = 4 + weight * 6;
  const inner = span * 0.45;
  return [
    `M ${position.x - span} ${position.y}`,
    `L ${position.x + span} ${position.y}`,
    `M ${position.x} ${position.y - inner}`,
    `L ${position.x} ${position.y + inner}`,
  ].join(' ');
}

function generateResonanceRing(signature: number): string {
  const radius = clamp(32 + (signature % 37), 28, 46);
  const offset = (signature % 13) * 1.1;
  return [
    `M ${50 - radius} ${50}`,
    `A ${radius} ${radius} 0 0 1 ${50 + radius} ${50}`,
    `M ${50} ${50 - radius * 0.82}`,
    `A ${radius * 0.82} ${radius * 0.82} 0 0 0 ${50} ${50 + radius * 0.82}`,
    `M ${50 - offset} ${50 - radius * 0.45}`,
    `L ${50 + offset} ${50 + radius * 0.45}`,
  ].join(' ');
}

function pointsToPath(points: Point[]): string {
  if (points.length === 0) return '';
  const commands = points.map((point, index) => {
    const prefix = index === 0 ? 'M' : 'L';
    return `${prefix} ${point.x} ${point.y}`;
  });
  return `${commands.join(' ')} Z`;
}

function computeCentroid(points: Point[], fallback: Point): Point {
  if (points.length === 0) return fallback;
  let area = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const cross = current.x * next.y - next.x * current.y;
    area += cross;
    cx += (current.x + next.x) * cross;
    cy += (current.y + next.y) * cross;
  }

  if (Math.abs(area) < 1e-6) {
    return fallback;
  }

  const factor = 1 / (3 * area);
  return {
    x: cx * factor,
    y: cy * factor,
  };
}

function boundaryDistance(origin: Point, direction: Point): number {
  let distance = Infinity;

  if (direction.x > 0) {
    distance = Math.min(distance, (BOUNDS.max - origin.x) / direction.x);
  } else if (direction.x < 0) {
    distance = Math.min(distance, (BOUNDS.min - origin.x) / direction.x);
  }

  if (direction.y > 0) {
    distance = Math.min(distance, (BOUNDS.max - origin.y) / direction.y);
  } else if (direction.y < 0) {
    distance = Math.min(distance, (BOUNDS.min - origin.y) / direction.y);
  }

  return Number.isFinite(distance) ? Math.max(distance, 0.1) : 0.1;
}

function bisectorIntersection(origin: Point, target: Point, direction: Point): number {
  const diffX = target.x - origin.x;
  const diffY = target.y - origin.y;
  const lengthSquared = diffX * diffX + diffY * diffY;
  const denom = 2 * (direction.x * diffX + direction.y * diffY);

  if (Math.abs(denom) < 1e-6) return Infinity;

  const t = lengthSquared / denom;
  return t > 0 ? t : Infinity;
}

function signaturePoint(pattern: Pattern, depth: number, baseLength: number): Point {
  if (!pattern.length) {
    return { x: 50, y: 50 };
  }

  const numerator = pattern.reduce((sum, value, index) => sum + (value + 1) * (index + 1), 0);
  const normalized = numerator / (pattern.length * baseLength * (MAX_CELL_STATE + 1));
  const asymmetry =
    pattern.reduce((sum, value, index) => sum + ((index % 2 === 0 ? 1 : -1) * value), 0) /
    (pattern.length * MAX_CELL_STATE || 1);
  const radius = clamp(24 + normalized * 34 + depth * 1.3, 14, 50);
  const angle = asymmetry * Math.PI + depth * 0.08;

  return {
    x: clamp(50 + Math.cos(angle) * radius, BOUNDS.min, BOUNDS.max),
    y: clamp(50 + Math.sin(angle) * radius * (0.8 + normalized * 0.2), BOUNDS.min, BOUNDS.max),
  };
}

function findNearestAttractor(position: Point, attractors: Attractor[]): Attractor {
  return attractors.reduce((nearest, candidate) => {
    const nearestDistance = distanceSquared(position, nearest.position);
    const candidateDistance = distanceSquared(position, candidate.position);
    return candidateDistance < nearestDistance ? candidate : nearest;
  }, attractors[0]);
}

function distanceSquared(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

