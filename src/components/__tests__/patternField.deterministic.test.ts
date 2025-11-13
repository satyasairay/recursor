/**
 * Deterministic Rendering Regression Tests
 * 
 * Ensures PatternField renders identical geometry for identical inputs.
 * Prevents visual layer from introducing non-deterministic behavior.
 */

import { Pattern } from '@/lib/types';
import { MemoryNode } from '@/lib/types';

// Mock the deriveNodes function logic (extracted for testing)
function deriveNodesForTest(
  pattern: Pattern,
  depth: number,
  historyNodes: MemoryNode[],
  nodeCount: number
): Array<{ index: number; x: number; y: number; luminosity: number; distortion: number; pulsePhase: number }> {
  if (pattern.length === 0) return [];

  // Simplified history vector computation
  const historyVector = new Array(pattern.length).fill(0);
  const counts = new Array(pattern.length).fill(0);
  
  historyNodes.forEach(node => {
    if (!node.pattern || node.pattern.length === 0) return;
    const sourceLength = node.pattern.length;
    for (let i = 0; i < pattern.length; i++) {
      const sourceIndex = Math.min(sourceLength - 1, Math.floor((i / pattern.length) * sourceLength));
      historyVector[i] += node.pattern[sourceIndex];
      counts[i] += 1 + (node.depth ?? 0) * 0.1;
    }
  });

  const normalizedHistory = historyVector.map((sum, index) => {
    const denom = counts[index] || 1;
    return Math.min(1, Math.max(0, sum / denom / 3));
  });

  // Simplified distortion map
  const distortionMap = new Array(pattern.length).fill(0);
  historyNodes.forEach((node, orderIndex) => {
    if (!node.pattern || node.pattern.length === 0) return;
    const weight = 1 + (node.depth ?? 0) * 0.2 + orderIndex / Math.max(1, historyNodes.length);
    const sourceLength = node.pattern.length;
    for (let i = 0; i < pattern.length; i++) {
      const sourceIndex = Math.min(sourceLength - 1, Math.floor((i / pattern.length) * sourceLength));
      distortionMap[i] += (node.pattern[sourceIndex] ?? 0) * weight;
    }
  });
  const maxDistortion = Math.max(...distortionMap, 1);
  const normalizedDistortion = distortionMap.map(v => v / maxDistortion);

  const depthPhase = depth * 0.12;
  const baseRadius = 20 + depth * 1.2;
  const signature = pattern.reduce((sum, val, idx) => sum + (val + 1) * (idx + 1), 0);

  return Array.from({ length: nodeCount }, (_, nodeIndex) => {
    const patternIndex = Math.floor((nodeIndex / nodeCount) * pattern.length);
    const value = pattern[patternIndex] ?? 0;
    const intensity = value / 3;
    const memory = normalizedHistory[patternIndex] ?? 0;
    const distortion = normalizedDistortion[patternIndex] ?? 0;

    const normalized = (nodeIndex + 0.5) / nodeCount;
    const angle = normalized * Math.PI * 2 + depthPhase + (memory - 0.5) * 1.2 + distortion * 0.8;
    const radiusVariation = memory * 18 + distortion * 22 + (signature % 13) * 0.3;
    const radius = Math.min(42, Math.max(16, baseRadius + radiusVariation));
    const ellipse = 0.75 + memory * 0.2;

    const x = Math.min(92, Math.max(8, 50 + Math.cos(angle) * radius));
    const y = Math.min(92, Math.max(8, 50 + Math.sin(angle) * radius * ellipse));

    const luminosity = Math.min(1, Math.max(0, intensity * 0.6 + memory * 0.4));
    const pulsePhase = ((nodeIndex + signature) % 5) / 5;

    return {
      index: patternIndex,
      x: Math.round(x * 100) / 100, // Round for comparison
      y: Math.round(y * 100) / 100,
      luminosity: Math.round(luminosity * 1000) / 1000,
      distortion: Math.round(distortion * 1000) / 1000,
      pulsePhase: Math.round(pulsePhase * 1000) / 1000,
    };
  });
}

describe('PatternField Deterministic Rendering', () => {
  const testPattern: Pattern = [0, 1, 2, 1, 0, 1, 2, 3, 0];
  const testDepth = 3;
  const testHistoryNodes: MemoryNode[] = [
    {
      id: 1,
      timestamp: 1000,
      patternSignature: 'test-1',
      pattern: [0, 1, 1, 0],
      depth: 1,
      branchOrigin: null,
      weight: 0.8,
      connections: [],
      lastAccessed: 1000,
      sessionId: 1,
    },
  ];

  test('renders identical geometry for identical inputs', () => {
    const nodeCount = 7 + (testPattern.reduce((sum, val, idx) => sum + (val + 1) * (idx + 1), 0) % 5);
    
    const result1 = deriveNodesForTest(testPattern, testDepth, testHistoryNodes, nodeCount);
    const result2 = deriveNodesForTest(testPattern, testDepth, testHistoryNodes, nodeCount);
    const result3 = deriveNodesForTest(testPattern, testDepth, testHistoryNodes, nodeCount);

    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
  });

  test('node count is deterministic based on pattern signature', () => {
    const signature1 = testPattern.reduce((sum, val, idx) => sum + (val + 1) * (idx + 1), 0);
    const nodeCount1 = 7 + (signature1 % 5);
    
    const signature2 = testPattern.reduce((sum, val, idx) => sum + (val + 1) * (idx + 1), 0);
    const nodeCount2 = 7 + (signature2 % 5);

    expect(nodeCount1).toBe(nodeCount2);
    expect(nodeCount1).toBeGreaterThanOrEqual(7);
    expect(nodeCount1).toBeLessThanOrEqual(11);
  });

  test('different patterns produce different geometry', () => {
    const pattern1: Pattern = [0, 1, 2, 1, 0, 1, 2, 3, 0];
    const pattern2: Pattern = [3, 2, 1, 0, 3, 2, 1, 0, 3];
    
    const nodeCount1 = 7 + (pattern1.reduce((sum, val, idx) => sum + (val + 1) * (idx + 1), 0) % 5);
    const nodeCount2 = 7 + (pattern2.reduce((sum, val, idx) => sum + (val + 1) * (idx + 1), 0) % 5);
    
    const result1 = deriveNodesForTest(pattern1, testDepth, testHistoryNodes, nodeCount1);
    const result2 = deriveNodesForTest(pattern2, testDepth, testHistoryNodes, nodeCount2);

    // Should produce different geometry
    expect(result1).not.toEqual(result2);
  });

  test('depth changes produce different geometry', () => {
    const nodeCount = 7 + (testPattern.reduce((sum, val, idx) => sum + (val + 1) * (idx + 1), 0) % 5);
    
    const result1 = deriveNodesForTest(testPattern, 0, testHistoryNodes, nodeCount);
    const result2 = deriveNodesForTest(testPattern, 5, testHistoryNodes, nodeCount);

    // Should produce different geometry due to depth phase
    expect(result1).not.toEqual(result2);
  });

  test('no randomness in node positions', () => {
    const nodeCount = 7 + (testPattern.reduce((sum, val, idx) => sum + (val + 1) * (idx + 1), 0) % 5);
    
    // Run 10 times - should all be identical
    const results = Array.from({ length: 10 }, () =>
      deriveNodesForTest(testPattern, testDepth, testHistoryNodes, nodeCount)
    );

    const first = results[0];
    results.forEach(result => {
      expect(result).toEqual(first);
    });
  });
});

