import { db } from './recursionDB';

export interface NarrativeState {
  depth: number;
  totalSessions: number;
  maxDepth: number;
  glitchIntensity: number;
  vortexStage: number;
  architecturePhase: number;
  unlocked: string[];
}

export interface VisualThreshold {
  depth: number;
  effect: string;
  intensity: number;
}

// Visual effects unlock at different depths
export const VISUAL_THRESHOLDS: VisualThreshold[] = [
  { depth: 3, effect: 'subtle_glitch', intensity: 0.1 },
  { depth: 5, effect: 'color_shift', intensity: 0.2 },
  { depth: 8, effect: 'geometry_distortion', intensity: 0.3 },
  { depth: 12, effect: 'reality_fracture', intensity: 0.5 },
  { depth: 15, effect: 'architecture_morph', intensity: 0.7 },
  { depth: 20, effect: 'vortex_awakening', intensity: 0.9 },
  { depth: 25, effect: 'singularity', intensity: 1.0 },
];

export async function getNarrativeState(): Promise<NarrativeState> {
  const sessions = await db.sessions.toArray();
  const nodes = await db.nodes.toArray();
  
  const totalSessions = sessions.length;
  const maxDepth = Math.max(...sessions.map(s => s.depth), 0);
  const avgDepth = sessions.length > 0 
    ? sessions.reduce((sum, s) => sum + s.depth, 0) / sessions.length 
    : 0;

  // Calculate which effects are unlocked
  const unlocked = VISUAL_THRESHOLDS
    .filter(threshold => maxDepth >= threshold.depth)
    .map(t => t.effect);

  // Glitch intensity increases with depth
  const glitchIntensity = Math.min(maxDepth / 25, 1.0);

  // Vortex evolves through stages
  const vortexStage = Math.floor(maxDepth / 5);

  // Architecture phases (0-5)
  const architecturePhase = Math.min(Math.floor(maxDepth / 4), 5);

  return {
    depth: Math.floor(avgDepth),
    totalSessions,
    maxDepth,
    glitchIntensity,
    vortexStage,
    architecturePhase,
    unlocked,
  };
}

export function getGlitchParams(depth: number) {
  const intensity = Math.min(depth / 25, 1.0);
  
  return {
    frequency: 2000 - (intensity * 1500), // More frequent as depth increases
    duration: 100 + (intensity * 400), // Longer glitches
    displacement: 2 + (intensity * 8), // Stronger displacement
    colorShift: intensity * 10,
    scanlines: intensity > 0.3,
    chromatic: intensity > 0.5,
    distortion: intensity > 0.7,
  };
}

export function getArchitectureColors(phase: number): string[] {
  const phases = [
    ['#9b87f5', '#7E69AB'], // Phase 0: Purple
    ['#8B5CF6', '#6E59A5'], // Phase 1: Deeper purple
    ['#7C3AED', '#5B21B6'], // Phase 2: Violet
    ['#6D28D9', '#4C1D95'], // Phase 3: Deep violet
    ['#5B21B6', '#3B0764'], // Phase 4: Ultra violet
    ['#4C1D95', '#1E1B4B'], // Phase 5: Near black-violet
  ];
  
  return phases[Math.min(phase, 5)];
}

export function shouldTriggerEffect(
  depth: number,
  effect: string
): boolean {
  const threshold = VISUAL_THRESHOLDS.find(t => t.effect === effect);
  return threshold ? depth >= threshold.depth : false;
}
