/**
 * Loop Breaker Regression Guard
 * 
 * Prevents reintroduction of looping animation constructs.
 * Ensures all ambient motion is state-driven, never time-loop-driven.
 */

/**
 * Guards against looping animation patterns in code.
 * Throws if repeat: Infinity or time-based loops are detected.
 */
export function assertNoLoops(code: string, fileName: string): void {
  const loopPatterns = [
    /repeat:\s*Infinity/gi,
    /repeat:\s*true/gi,
    /setInterval/gi,
    /requestAnimationFrame/gi,
  ];
  
  for (const pattern of loopPatterns) {
    if (pattern.test(code)) {
      throw new Error(
        `[LoopBreakerGuard] ${fileName} contains looping construct: ${pattern.source}. ` +
        `All animations must be state-driven, not time-loop-driven.`
      );
    }
  }
}

/**
 * Validates that animation values are state-derived, not time-derived.
 */
export function validateStateDriven(
  hasTimeDependency: boolean,
  hasStateDependency: boolean,
  functionName: string
): void {
  if (hasTimeDependency && !hasStateDependency) {
    throw new Error(
      `[LoopBreakerGuard] ${functionName} uses time but not state. ` +
      `All ambient motion must derive from recursion state (pattern, depth, mutationCount).`
    );
  }
}

/**
 * Continuity test: Simulates 200 idle frames and confirms no frame repeats.
 * Returns true if all frames are unique (state-driven), false if any repeat.
 */
export function testFrameContinuity(
  getFrameState: (frame: number) => { pattern: number[]; depth: number; mutationCount: number }
): boolean {
  const frames = new Set<string>();
  
  for (let frame = 0; frame < 200; frame++) {
    const state = getFrameState(frame);
    const frameKey = `${state.pattern.join(',')}-${state.depth}-${state.mutationCount}`;
    
    if (frames.has(frameKey)) {
      return false; // Frame repeated
    }
    
    frames.add(frameKey);
  }
  
  return true; // All frames unique
}

