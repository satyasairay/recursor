/**
 * MemoryLattice - Persistent, cumulative memory substrate
 * 
 * Renders an ever-growing lattice of memory traces that never resets.
 * Each mutation adds irreversible visual residue. The lattice accumulates
 * across the entire session, providing a sense of consequence and continuity.
 * 
 * This layer lives under PatternField and is purely observational.
 */
import { useEffect, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/recursionDB';
import { Pattern } from '@/lib/types';
import { NODE_BASE_HUE, NODE_HUE_PER_DEPTH, NODE_SATURATION } from '@/lib/constants';

interface MemoryLatticeProps {
  pattern: Pattern;
  depth: number;
  mutationCount: number;
}

const GLYPHS = ['◉', '⬡', '•'];

/**
 * Deterministic hash for consistent visual generation.
 */
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Computes pattern signature for deterministic positioning.
 */
function computeSignature(pattern: Pattern): number {
  return pattern.reduce((sum, val, idx) => sum + (val + 1) * (idx + 1), 0);
}

export const MemoryLattice = ({ pattern, depth, mutationCount }: MemoryLatticeProps) => {
  const svgRef = useRef<SVGGElement>(null);
  const lastMutationCountRef = useRef(0);
  const accumulatedTracesRef = useRef<Array<{
    type: 'line' | 'fracture' | 'trail' | 'glyph';
    element: SVGElement;
  }>>([]);

  const historyNodes = useLiveQuery(() => db.nodes.toArray()) ?? [];

  // Initialize lattice from existing history (only once on mount)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!svgRef.current || initializedRef.current) return;
    if (historyNodes.length === 0) return;

    initializedRef.current = true;

    // Generate initial lattice from history
    historyNodes.forEach((node, idx) => {
      if (!node.pattern || node.pattern.length === 0) return;

      const signature = computeSignature(node.pattern);
      const nodeDepth = node.depth ?? 0;
      const seed = hash(`${signature}-${nodeDepth}-${idx}`);

      // Generate traces for this historical node
      generateTracesForNode(
        svgRef.current!,
        node.pattern,
        nodeDepth,
        signature,
        seed,
        accumulatedTracesRef.current
      );
    });
  }, [historyNodes]); // Run when history nodes change (but only initialize once)

  // Add new traces on each mutation
  useEffect(() => {
    if (!svgRef.current) return;
    if (mutationCount <= lastMutationCountRef.current) return;

    const newMutations = mutationCount - lastMutationCountRef.current;
    lastMutationCountRef.current = mutationCount;

    const signature = computeSignature(pattern);
    const baseSeed = hash(`${signature}-${depth}-${mutationCount}`);

    // Add traces for each new mutation
    for (let i = 0; i < newMutations; i++) {
      generateTracesForNode(
        svgRef.current,
        pattern,
        depth,
        signature,
        baseSeed + i * 10000,
        accumulatedTracesRef.current
      );
    }
  }, [mutationCount, pattern, depth]);

  // State-driven transformation (no loops, accumulates with mutations)
  const patternSignature = useMemo(() => {
    if (pattern.length === 0) return 0;
    return pattern.reduce((sum, val, idx) => sum + (val + 1) * (idx + 1), 0);
  }, [pattern]);
  
  const transformRef = useRef({
    translateX: 0,
    translateY: 0,
    rotate: 0,
    scaleX: 1,
    scaleY: 1,
  });

  useEffect(() => {
    if (!svgRef.current) return;

    // State-driven transform: depth + mutationCount + patternSignature
    // Never loops, always accumulates
    const stateHash = (patternSignature + depth * 100 + mutationCount * 17) % 10000;
    const phase = stateHash / 10000;
    
    transformRef.current = {
      translateX: Math.sin(phase * Math.PI * 2) * 2 + (mutationCount * 0.01),
      translateY: Math.cos(phase * Math.PI * 2) * 1.5 + (mutationCount * 0.008),
      rotate: (depth * 3) + (mutationCount * 0.5) + (phase * 10),
      scaleX: 1 + Math.sin(phase * Math.PI) * 0.02 + (mutationCount * 0.0001),
      scaleY: 1 + Math.cos(phase * Math.PI) * 0.02 + (mutationCount * 0.0001),
    };

    svgRef.current.setAttribute(
      'transform',
      `translate(${transformRef.current.translateX}, ${transformRef.current.translateY}) 
       rotate(${transformRef.current.rotate}) 
       scale(${transformRef.current.scaleX}, ${transformRef.current.scaleY})`
    );
  }, [depth, mutationCount, patternSignature]);

  return (
    <g
      ref={svgRef}
      className="memory-lattice"
      style={{ 
        mixBlendMode: 'multiply', 
        opacity: 0.35, // Restored visibility
        pointerEvents: 'none',
      }}
    />
  );
};

/**
 * Generates visual traces for a single memory node.
 * Appends directly to SVG without React keys.
 */
function generateTracesForNode(
  svgGroup: SVGGElement,
  pattern: Pattern,
  nodeDepth: number,
  signature: number,
  seed: number,
  accumulatedTraces: Array<{ type: string; element: SVGElement }>
) {
  const hue = NODE_BASE_HUE + nodeDepth * NODE_HUE_PER_DEPTH;
  const baseOpacity = 0.15 + (nodeDepth * 0.02);

  // Deterministic pseudo-random from seed
  const rng = (offset: number) => {
    const h = hash(`${seed}-${offset}`);
    return (h % 1000) / 1000;
  };

  // Generate 2-4 traces per node
  const traceCount = 2 + (seed % 3);
  
  for (let t = 0; t < traceCount; t++) {
    const traceSeed = seed + t * 1000;
    const traceType = ['line', 'fracture', 'trail', 'glyph'][traceSeed % 4] as 'line' | 'fracture' | 'trail' | 'glyph';

    switch (traceType) {
      case 'line': {
        // Thin drifting line
        const x1 = 10 + rng(traceSeed) * 80;
        const y1 = 10 + rng(traceSeed + 1) * 80;
        const x2 = x1 + (rng(traceSeed + 2) - 0.5) * 15;
        const y2 = y1 + (rng(traceSeed + 3) - 0.5) * 12;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(x1));
        line.setAttribute('y1', String(y1));
        line.setAttribute('x2', String(x2));
        line.setAttribute('y2', String(y2));
        line.setAttribute('stroke', `hsla(${hue}, ${NODE_SATURATION}%, 50%, ${baseOpacity * 0.6})`);
        line.setAttribute('stroke-width', '0.2');
        line.setAttribute('opacity', String(baseOpacity * 0.5));
        svgGroup.appendChild(line);
        accumulatedTraces.push({ type: 'line', element: line });
        break;
      }

      case 'fracture': {
        // Faint fracture (short broken line)
        const x = 10 + rng(traceSeed) * 80;
        const y = 10 + rng(traceSeed + 1) * 80;
        const angle = rng(traceSeed + 2) * Math.PI * 2;
        const length = 3 + rng(traceSeed + 3) * 4;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dx = Math.cos(angle) * length;
        const dy = Math.sin(angle) * length;
        path.setAttribute('d', `M ${x} ${y} L ${x + dx * 0.3} ${y + dy * 0.3} M ${x + dx * 0.7} ${y + dy * 0.7} L ${x + dx} ${y + dy}`);
        path.setAttribute('stroke', `hsla(${hue}, ${NODE_SATURATION}%, 45%, ${baseOpacity * 0.4})`);
        path.setAttribute('stroke-width', '0.15');
        path.setAttribute('opacity', String(baseOpacity * 0.3));
        svgGroup.appendChild(path);
        accumulatedTraces.push({ type: 'fracture', element: path });
        break;
      }

      case 'trail': {
        // Slow direction-biased trail (curved path)
        const startX = 10 + rng(traceSeed) * 80;
        const startY = 10 + rng(traceSeed + 1) * 80;
        const direction = rng(traceSeed + 2) * Math.PI * 2;
        const biasX = Math.cos(direction) * 8;
        const biasY = Math.sin(direction) * 6;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const midX = startX + biasX * 0.5;
        const midY = startY + biasY * 0.5;
        const endX = startX + biasX;
        const endY = startY + biasY;
        path.setAttribute('d', `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`);
        path.setAttribute('stroke', `hsla(${hue}, ${NODE_SATURATION}%, 55%, ${baseOpacity * 0.5})`);
        path.setAttribute('stroke-width', '0.25');
        path.setAttribute('fill', 'none');
        path.setAttribute('opacity', String(baseOpacity * 0.4));
        svgGroup.appendChild(path);
        accumulatedTraces.push({ type: 'trail', element: path });
        break;
      }

      case 'glyph': {
        // Micro-glyph residue
        const x = 10 + rng(traceSeed) * 80;
        const y = 10 + rng(traceSeed + 1) * 80;
        const glyphIndex = traceSeed % GLYPHS.length;
        const glyph = GLYPHS[glyphIndex];
        const size = 1.2 + rng(traceSeed + 2) * 0.8;
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', String(x));
        text.setAttribute('y', String(y));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('font-size', String(size));
        text.setAttribute('fill', `hsla(${hue}, ${NODE_SATURATION}%, 50%, ${baseOpacity * 0.3})`);
        text.setAttribute('opacity', String(baseOpacity * 0.25));
        text.textContent = glyph;
        svgGroup.appendChild(text);
        accumulatedTraces.push({ type: 'glyph', element: text });
        break;
      }
    }
  }

  // Deepen scars over repeated choices (age-based distortion)
  if (accumulatedTraces.length > 10) {
    const recentTraces = accumulatedTraces.slice(-20);
    recentTraces.forEach((trace, ageIndex) => {
      const age = accumulatedTraces.length - (accumulatedTraces.length - recentTraces.length + ageIndex);
      const currentOpacity = parseFloat(trace.element.getAttribute('opacity') || '0.1');
      const ageDistortion = Math.min(0.3, age * 0.01); // Older traces get more distortion
      const newOpacity = Math.min(0.6, currentOpacity + 0.02 + ageDistortion);
      trace.element.setAttribute('opacity', String(newOpacity));
      
      // Add age-based visual warping (older = more distorted)
      if (age > 50 && trace.type !== 'glyph') {
        const warpX = Math.sin(age * 0.1) * ageDistortion;
        const warpY = Math.cos(age * 0.1) * ageDistortion;
        if (trace.element.tagName === 'line') {
          const x1 = parseFloat(trace.element.getAttribute('x1') || '0');
          const y1 = parseFloat(trace.element.getAttribute('y1') || '0');
          const x2 = parseFloat(trace.element.getAttribute('x2') || '0');
          const y2 = parseFloat(trace.element.getAttribute('y2') || '0');
          trace.element.setAttribute('x1', String(x1 + warpX));
          trace.element.setAttribute('y1', String(y1 + warpY));
          trace.element.setAttribute('x2', String(x2 + warpX * 0.5));
          trace.element.setAttribute('y2', String(y2 + warpY * 0.5));
        } else if (trace.element.tagName === 'path') {
          const d = trace.element.getAttribute('d') || '';
          // Apply subtle warping to path (simplified - full path parsing would be complex)
          // For now, just increase opacity to show age
        }
      }
    });
  }
}

