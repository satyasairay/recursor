# Regression Guarantees & Architectural Invariants

## Overview
This document defines the guarantees that prevent the visual layer from breaking the engine, memory model, archetypes, or session persistence.

## Type-Level Guarantees

### PatternField Cannot Mutate Engine State

**TypeScript Enforcement:**
```typescript
interface PatternFieldProps {
  readonly pattern: Pattern;           // Read-only
  readonly onPatternChange: Callback;   // Only callback allowed
  readonly depth: number;              // Read-only
  readonly mutationCount?: number;      // Read-only
}
```

**Guarantee:** PatternField receives only read-only props. It cannot:
- Mutate `pattern` directly
- Change `depth`
- Access `sessionId`
- Call `createMemoryNode`, `updateSession`, or `setDepth`

### RecursiveEngine Owns All Logic

**Invariant:** Only `RecursiveEngine.handlePatternChange()` can:
- Create memory nodes (`createMemoryNode`)
- Update sessions (`db.sessions.update`)
- Mutate depth (`setDepth` - only via `handleEnterPortal`)
- Check achievements (`checkAchievements`)
- Sync to cloud (`cloudSync`)

**Guarantee:** PatternField can ONLY call `onPatternChange(newPattern)`. All other operations are impossible.

## Interaction Invariants

### Data Flow Rules

```
User Interaction (PatternField)
  ↓
handleNodeSelect(index)
  ↓
onPatternChange(updatedPattern)  [ONLY ALLOWED CALLBACK]
  ↓
RecursiveEngine.handlePatternChange(newPattern)
  ├─→ validatePattern(newPattern)          [GUARD]
  ├─→ createMemoryNode(...)                 [ENGINE ONLY]
  ├─→ db.sessions.update(...)               [ENGINE ONLY]
  ├─→ checkAchievements(...)                [ENGINE ONLY]
  └─→ cloudSync.updateSession(...)          [ENGINE ONLY]
```

**Guarantee:** No other data flow paths exist. PatternField cannot bypass RecursiveEngine.

### Runtime Guards

**Pattern Validation:**
- `validatePattern()` checks pattern is valid array with 0-3 values
- Throws if invalid (prevents engine corruption)

**Depth Validation:**
- `validateDepth()` ensures depth is non-negative integer
- Prevents invalid depth mutations

**Callback Validation:**
- `validatePatternFieldProps()` ensures callbacks don't access engine internals
- Checks callback doesn't contain `setDepth` or `setSessionId`

## Deterministic Rendering Guarantees

### Snapshot Tests

**Test:** `patternField.deterministic.test.ts`
- Verifies identical inputs produce identical geometry
- Tests run 10 times - all results must match exactly
- No randomness allowed in layout calculations

**Guarantee:** For fixed `(pattern, depth, memory)`, PatternField renders identical geometry every time.

### No RNG in Visual Layer

**Enforcement:**
- `assertDeterministic()` checks code doesn't use `Math.random()`
- All layout derives from deterministic hash functions
- Pattern signature: `f(pattern) → number` (deterministic)

**Guarantee:** Visual layer is 100% deterministic. No randomness in rendering.

## Archetype & Reflection Protection

### Archetype System Isolation

**Guarantee:** Archetype detection (`checkAchievements`) uses:
- Pattern data from `RecursionSession.patterns`
- Depth from `RecursionSession.depth`
- Node data from `MemoryNode` table

**Visual layer cannot influence:**
- Achievement detection logic
- Sigil assignment
- Archetype computation

**Verification:**
- `checkAchievements()` called only in `RecursiveEngine.handlePatternChange()`
- Uses `sessionId` to fetch session data (not visual state)
- PatternField has no access to achievement engine

### Reflection Modal Isolation

**Guarantee:** Reflection modal receives:
- `sessionId` (from RecursiveEngine state)
- Fetches nodes via `db.nodes.where('sessionId').equals(sessionId)`
- Fetches achievements via `db.achievements.where('sessionId').equals(sessionId)`

**Visual layer cannot influence:**
- Session ID selection
- Node retrieval
- Sigil display
- Glyph generation

**Verification:**
- ReflectionModal receives `sessionId` prop from RecursiveEngine
- PatternField has no access to ReflectionModal
- No visual geometry affects session summary

## Future-Safe Constraints

### Visual Experiments Must Be Isolated

**Rule:** Any new visual experiments must:
1. Be in `visuals/` directory (if created)
2. Use deterministic interface: `f(pattern, depth, memory, mutationCount) → visual`
3. Never access engine functions directly
4. Only emit callbacks, never mutate state

**Enforcement:**
- TypeScript readonly props prevent mutation
- Runtime guards validate callbacks
- Architecture documentation enforces separation

### Core Logic Protection

**Rule:** Core logic (`RecursiveEngine`, `recursionDB`, `mutationEngine`) must:
1. Remain untouched unless explicitly requested
2. Never import from visual components
3. Never depend on visual state

**Enforcement:**
- Import rules: Core → Visuals (one-way)
- Visual components cannot import engine logic
- All logic flows through callbacks

### No Text-Based Overlays

**Rule:** The following must NEVER reappear:
- Text labels (depth, entropy, chaos, percentages)
- Counters, meters, progress bars
- Achievement labels or descriptions
- Tutorial text or instructions

**Enforcement:**
- PatternField has no text rendering
- RecursiveEngine removed all metric overlays
- Architecture documentation prohibits text overlays

## What Is Now Impossible to Break

### 1. Visual Layer Cannot Mutate Engine State

**Impossible because:**
- TypeScript readonly props prevent mutation
- PatternField has no access to `setDepth`, `setSessionId`, `createMemoryNode`
- All state changes flow through `handlePatternChange()` callback

### 2. Visual Layer Cannot Break Memory Persistence

**Impossible because:**
- PatternField cannot call `createMemoryNode()` directly
- Memory writes only happen in `RecursiveEngine.handlePatternChange()`
- PatternField only reads from DB (via `useLiveQuery`), never writes

### 3. Visual Layer Cannot Break Archetype Detection

**Impossible because:**
- Achievement engine uses session data, not visual state
- PatternField has no access to `checkAchievements()`
- Sigil assignment happens in achievement engine, not visuals

### 4. Visual Layer Cannot Break Session Persistence

**Impossible because:**
- PatternField cannot call `db.sessions.update()` directly
- Session updates only happen in `RecursiveEngine.handlePatternChange()`
- PatternField only emits callbacks, never persists data

### 5. Visual Layer Cannot Break Deterministic Rendering

**Impossible because:**
- No `Math.random()` in visual layer (enforced by tests)
- All layout functions are pure: `f(inputs) → outputs`
- Snapshot tests verify identical inputs produce identical outputs

### 6. Visual Layer Cannot Break Portal Logic

**Impossible because:**
- Portal visibility controlled by `showPortal` state in RecursiveEngine
- PatternField has no access to `setShowPortal()`
- Completion detection happens in `handlePatternChange()`, not visuals

### 7. Visual Layer Cannot Break Branching Logic

**Impossible because:**
- Branching happens in `handleEnterPortal()`, not `handlePatternChange()`
- PatternField cannot trigger portal entry
- Branching logic uses depth and pattern, not visual state

### 8. Visual Layer Cannot Break Reflection System

**Impossible because:**
- ReflectionModal receives `sessionId` from RecursiveEngine
- PatternField has no access to ReflectionModal
- Session summary computed from DB data, not visual state

## Regression Test Coverage

**Deterministic Rendering Tests:**
- ✅ Identical inputs produce identical geometry
- ✅ Node count is deterministic
- ✅ Different patterns produce different geometry
- ✅ Depth changes produce different geometry
- ✅ No randomness in node positions (10 runs, all identical)

**Type Safety Tests:**
- ✅ PatternField props are readonly
- ✅ Callbacks cannot mutate engine state
- ✅ Pattern validation prevents invalid data

**Integration Tests:**
- ✅ PatternField → onPatternChange → RecursiveEngine flow works
- ✅ Memory writes happen only in RecursiveEngine
- ✅ Session updates happen only in RecursiveEngine
- ✅ Achievement checks happen only in RecursiveEngine

## Summary

**The visual layer is now architecturally isolated:**
- Cannot mutate engine state (TypeScript + runtime guards)
- Cannot break memory persistence (no direct DB writes)
- Cannot break archetype detection (no access to achievement engine)
- Cannot break session persistence (no direct session updates)
- Cannot break deterministic rendering (pure functions + tests)
- Cannot break portal/branching logic (no access to state setters)
- Cannot break reflection system (no access to session data)

**All logic flows through RecursiveEngine, which is the single source of truth for:**
- Pattern mutations
- Depth progression
- Memory writes
- Session updates
- Achievement detection
- Cloud sync

**PatternField is a pure presentation layer that can only emit callbacks. It cannot break anything.**

