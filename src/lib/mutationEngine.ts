/**
 * RECURSOR Mutation Engine
 * 
 * A sophisticated pattern evolution system that uses:
 * - Entropy analysis for measuring pattern chaos
 * - Cluster detection for finding repeated sequences
 * - Decay factors for temporal influence
 * - Depth-based mutation strength
 * - Branching evolution paths
 * 
 * This is the "brain" that makes patterns feel intelligent and responsive.
 */

import { Pattern, RecursionDepth, MutationWeights, PatternCluster } from './types';
import { MAX_CELL_STATE } from './constants';

// ============================================================================
// ENTROPY CALCULATION
// ============================================================================

/**
 * Calculate Shannon entropy of a pattern.
 * Higher entropy = more chaos/randomness
 * Lower entropy = more order/structure
 * 
 * Range: 0 (all same values) to ~2 (maximum diversity)
 */
export const calculateEntropy = (pattern: Pattern): number => {
  const frequencies = new Map<number, number>();
  
  // Count occurrences of each value
  pattern.forEach(val => {
    frequencies.set(val, (frequencies.get(val) || 0) + 1);
  });
  
  // Calculate Shannon entropy: -Σ(p * log2(p))
  let entropy = 0;
  const total = pattern.length;
  
  frequencies.forEach(count => {
    const probability = count / total;
    entropy -= probability * Math.log2(probability);
  });
  
  return entropy;
};

/**
 * Normalize entropy to 0-1 range for easier use.
 * Assumes max entropy of 2 bits (4 possible states).
 */
export const normalizeEntropy = (entropy: number): number => {
  return Math.min(entropy / 2, 1);
};

// ============================================================================
// CLUSTER DETECTION
// ============================================================================

/**
 * Detect repeated sequences (clusters) in a pattern.
 * Used to identify structure that should be preserved or disrupted.
 * 
 * @param pattern - Pattern to analyze
 * @param minLength - Minimum cluster length to detect (default: 2)
 * @returns Array of detected clusters
 */
export const detectClusters = (pattern: Pattern, minLength: number = 2): PatternCluster[] => {
  const clusters: PatternCluster[] = [];
  const patternStr = pattern.join(',');
  
  // Try different cluster lengths
  for (let len = minLength; len <= Math.floor(pattern.length / 2); len++) {
    for (let i = 0; i <= pattern.length - len; i++) {
      const sequence = pattern.slice(i, i + len);
      const sequenceStr = sequence.join(',');
      
      // Find all occurrences of this sequence
      const positions: number[] = [];
      let pos = 0;
      
      while (pos <= pattern.length - len) {
        const testSeq = pattern.slice(pos, pos + len).join(',');
        if (testSeq === sequenceStr) {
          positions.push(pos);
        }
        pos++;
      }
      
      // If sequence appears multiple times, it's a cluster
      if (positions.length > 1) {
        clusters.push({
          sequence,
          positions,
          length: len,
          frequency: positions.length,
        });
      }
    }
  }
  
  // Sort by frequency * length (most significant clusters first)
  return clusters.sort((a, b) => 
    (b.frequency * b.length) - (a.frequency * a.length)
  );
};

/**
 * Calculate cluster density (how structured vs random the pattern is).
 * Returns value 0-1 where:
 * - 0 = No clusters (pure chaos)
 * - 1 = Highly clustered (very structured)
 */
export const calculateClusterDensity = (clusters: PatternCluster[], patternLength: number): number => {
  if (clusters.length === 0) return 0;
  
  // Sum of all cluster coverage (positions covered by clusters)
  const totalCoverage = clusters.reduce((sum, cluster) => 
    sum + (cluster.frequency * cluster.length), 0
  );
  
  // Normalize by pattern length (can be > 1 if overlapping)
  return Math.min(totalCoverage / (patternLength * 2), 1);
};

// ============================================================================
// MUTATION WEIGHTS
// ============================================================================

/**
 * Calculate mutation weights based on current system state.
 * These weights determine how aggressively patterns mutate.
 */
export const calculateMutationWeights = (
  depth: RecursionDepth,
  entropy: number,
  clusterDensity: number,
  decayFactor: number
): MutationWeights => {
  // Depth increases mutation strength (exponentially)
  const depthWeight = Math.min(1 + (depth * 0.2), 2.5);
  
  // High entropy = reduce mutation (preserve chaos)
  // Low entropy = increase mutation (break order)
  const entropyWeight = 1 + (0.5 - normalizeEntropy(entropy));
  
  // High cluster density = targeted disruption
  // Low cluster density = broad mutation
  const clusterWeight = 1 + (clusterDensity * 0.3);
  
  // Decay reduces mutation strength over time (stability)
  const decayWeight = decayFactor;
  
  // Combined mutation strength
  const strength = depthWeight * entropyWeight * decayWeight;
  
  // Chaos level (how unpredictable mutations are)
  const chaos = (1 - decayFactor) * 0.3 + (depth * 0.05);
  
  return {
    strength,
    chaos,
    depthInfluence: depthWeight,
    entropyInfluence: entropyWeight,
    clusterInfluence: clusterWeight,
    decayInfluence: decayWeight,
  };
};

// ============================================================================
// BRANCHING EVOLUTION
// ============================================================================

/**
 * Generate multiple possible pattern evolutions.
 * At certain depths, the system offers implicit "choices" through branching.
 * 
 * @param currentPattern - Starting pattern
 * @param weights - Mutation weights
 * @param branchCount - Number of branches to generate (2-3 typically)
 * @returns Array of possible evolved patterns
 */
export const generateBranches = (
  currentPattern: Pattern,
  weights: MutationWeights,
  branchCount: number = 2
): Pattern[] => {
  const branches: Pattern[] = [];
  
  for (let i = 0; i < branchCount; i++) {
    const branch = [...currentPattern];
    const mutations = Math.ceil(weights.strength * (1 + i * 0.5));
    
    // Apply multiple mutations per branch
    for (let m = 0; m < mutations; m++) {
      // Deterministic but varied mutation position
      const seed = currentPattern.reduce((sum, val) => sum + val, 0) + i * 1000 + m;
      const pos = seed % branch.length;
      
      // Mutation amount varies by branch
      const delta = Math.ceil(weights.chaos * 10) + i + 1;
      branch[pos] = (branch[pos] + delta) % (MAX_CELL_STATE + 1);
    }
    
    branches.push(branch);
  }
  
  return branches;
};

/**
 * Select the "best" branch based on pattern history.
 * Uses recent patterns to determine which evolution feels most "natural".
 * 
 * @param branches - Available branch options
 * @param recentPatterns - Recent pattern history
 * @returns Index of selected branch
 */
export const selectBranch = (branches: Pattern[], recentPatterns: number[]): number => {
  if (branches.length === 0) return 0;
  if (branches.length === 1) return 0;
  
  // Calculate "affinity" of each branch to historical patterns
  const affinities = branches.map(branch => {
    let affinity = 0;
    
    // Compare branch to recent patterns
    for (let i = 0; i < Math.min(branch.length, recentPatterns.length); i++) {
      const branchVal = branch[i % branch.length];
      const historyVal = recentPatterns[i] % (MAX_CELL_STATE + 1);
      
      // Reward similarity (but not exact matches)
      const diff = Math.abs(branchVal - historyVal);
      if (diff === 1) affinity += 2; // Close but not same
      if (diff === 0) affinity += 0.5; // Same (less interesting)
      if (diff >= 2) affinity += 1; // Different (somewhat interesting)
    }
    
    return affinity;
  });
  
  // Select branch with highest affinity (with slight randomness)
  const maxAffinity = Math.max(...affinities);
  const candidates = affinities
    .map((a, i) => ({ index: i, affinity: a }))
    .filter(c => c.affinity >= maxAffinity * 0.8); // Top 80%
  
  // Deterministic selection from candidates
  const seed = recentPatterns.reduce((sum, val) => sum + val, 0);
  return candidates[seed % candidates.length].index;
};

// ============================================================================
// CLUSTER-AWARE MUTATION
// ============================================================================

/**
 * Apply mutations with awareness of detected clusters.
 * Either preserves or disrupts clusters based on strategy.
 * 
 * @param pattern - Pattern to mutate
 * @param clusters - Detected clusters
 * @param strategy - 'preserve' | 'disrupt'
 * @param intensity - Mutation intensity (0-1)
 */
export const mutateWithClusters = (
  pattern: Pattern,
  clusters: PatternCluster[],
  strategy: 'preserve' | 'disrupt',
  intensity: number
): Pattern => {
  const mutated = [...pattern];
  const mutationCount = Math.max(1, Math.floor(pattern.length * intensity * 0.3));
  
  if (strategy === 'preserve') {
    // Mutate cells NOT in clusters
    const clusterPositions = new Set(clusters.flatMap(c => c.positions));
    const nonClusterPositions = mutated
      .map((_, i) => i)
      .filter(i => !clusterPositions.has(i));
    
    for (let i = 0; i < mutationCount && nonClusterPositions.length > 0; i++) {
      const idx = nonClusterPositions[i % nonClusterPositions.length];
      mutated[idx] = (mutated[idx] + 1) % (MAX_CELL_STATE + 1);
    }
  } else {
    // Disrupt clusters by mutating their cells
    if (clusters.length > 0) {
      const targetCluster = clusters[0]; // Most significant cluster
      
      for (let i = 0; i < mutationCount; i++) {
        const clusterPos = targetCluster.positions[i % targetCluster.positions.length];
        const cellIdx = clusterPos + (i % targetCluster.length);
        if (cellIdx < mutated.length) {
          mutated[cellIdx] = (mutated[cellIdx] + 2) % (MAX_CELL_STATE + 1);
        }
      }
    }
  }
  
  return mutated;
};

// ============================================================================
// MAIN EVOLUTION ENGINE
// ============================================================================

/**
 * The primary pattern evolution function.
 * Integrates all subsystems into a cohesive mutation strategy.
 * 
 * @param currentPattern - Current pattern state
 * @param depth - Current recursion depth
 * @param recentPatterns - Flattened history of recent patterns
 * @param decayFactor - Time-based decay factor (0-1)
 * @param enableBranching - Whether to use branching at this depth
 * @returns Evolved pattern
 */
export const evolvePattern = async (
  currentPattern: Pattern,
  depth: RecursionDepth,
  recentPatterns: number[] = [],
  decayFactor: number = 1,
  enableBranching: boolean = false
): Promise<Pattern> => {
  // Step 1: Analyze current pattern
  const entropy = calculateEntropy(currentPattern);
  const clusters = detectClusters(currentPattern);
  const clusterDensity = calculateClusterDensity(clusters, currentPattern.length);
  
  // Step 2: Calculate mutation weights
  const weights = calculateMutationWeights(depth, entropy, clusterDensity, decayFactor);
  
  // Step 3: Decide on branching
  if (enableBranching && depth > 0 && depth % 3 === 0) {
    // Generate and select from branches
    const branches = generateBranches(currentPattern, weights, 3);
    const selectedIndex = selectBranch(branches, recentPatterns);
    return branches[selectedIndex];
  }
  
  // Step 4: Apply cluster-aware mutation
  const strategy = clusterDensity > 0.5 ? 'disrupt' : 'preserve';
  const intensity = Math.min(weights.strength / 2.5, 1);
  
  let evolved = mutateWithClusters(currentPattern, clusters, strategy, intensity);
  
  // Step 5: Apply chaos-based random mutations
  if (weights.chaos > 0.2) {
    const chaosMutations = Math.floor(weights.chaos * 5);
    for (let i = 0; i < chaosMutations; i++) {
      // Deterministic "random" position based on pattern state
      const seed = evolved.reduce((sum, val, idx) => sum + val * idx, 0) + i;
      const pos = seed % evolved.length;
      evolved[pos] = (evolved[pos] + Math.floor(weights.chaos * 10)) % (MAX_CELL_STATE + 1);
    }
  }
  
  return evolved;
};

// ============================================================================
// DIAGNOSTIC UTILITIES
// ============================================================================

/**
 * Get detailed analysis of pattern state.
 * Useful for debugging and understanding mutation behavior.
 */
export interface PatternAnalysis {
  entropy: number;
  normalizedEntropy: number;
  clusterCount: number;
  clusterDensity: number;
  topClusters: PatternCluster[];
  mutationWeights: MutationWeights;
}

export const analyzePattern = (
  pattern: Pattern,
  depth: RecursionDepth,
  decayFactor: number = 1
): PatternAnalysis => {
  const entropy = calculateEntropy(pattern);
  const clusters = detectClusters(pattern);
  const clusterDensity = calculateClusterDensity(clusters, pattern.length);
  const weights = calculateMutationWeights(depth, entropy, clusterDensity, decayFactor);
  
  return {
    entropy,
    normalizedEntropy: normalizeEntropy(entropy),
    clusterCount: clusters.length,
    clusterDensity,
    topClusters: clusters.slice(0, 3),
    mutationWeights: weights,
  };
};
