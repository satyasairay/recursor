# PatternField Recomputation Audit

## Questions & Answers

### 1. Does PatternField rebuild when pattern updates?

**YES** ✅

**Evidence:**
- **File:** `recursor/src/components/PatternField.tsx`
- **Line 86-88:**
  ```typescript
  const nodes = useMemo(() => {
    return deriveNodes(pattern, depth, historyNodes, nodeCount, entropy);
  }, [pattern, depth, historyNodes, nodeCount, entropy]);
  ```
- `pattern` is in the dependency array, so `nodes` recomputes when `pattern` changes.

---

### 2. Is pattern included in all dependency arrays (useMemo/useEffect)?

**MOSTLY YES** ⚠️

**Evidence:**

#### ✅ Direct Dependencies:
- **Line 81-84:** `nodeCount` useMemo
  ```typescript
  const nodeCount = useMemo(() => {
    const signature = computePatternSignature(pattern);
    return MIN_NODE_COUNT + (signature % (MAX_NODE_COUNT - MIN_NODE_COUNT + 1));
  }, [pattern]); // ✅ pattern included
  ```

- **Line 86-88:** `nodes` useMemo
  ```typescript
  const nodes = useMemo(() => {
    return deriveNodes(pattern, depth, historyNodes, nodeCount, entropy);
  }, [pattern, depth, historyNodes, nodeCount, entropy]); // ✅ pattern included
  ```

#### ⚠️ Indirect Dependencies:
- **Line 91-112:** `memoryConnections` useMemo
  ```typescript
  const memoryConnections = useMemo(() => {
    // ... uses nodes ...
  }, [nodes, historyNodes]); // ⚠️ pattern NOT directly included
  ```
  - **Analysis:** `memoryConnections` depends on `nodes`, which depends on `pattern`, so it's **indirectly** included. This is acceptable but could be more explicit.

#### ❌ Intentional Exclusion:
- **Line 71-79:** `useEffect` for branch pulse
  ```typescript
  useEffect(() => {
    // Event listener setup only
  }, []); // ❌ pattern NOT included (intentional - event listener setup)
  ```
  - **Analysis:** This is intentional - it's only setting up an event listener, not computing from `pattern`.

**Summary:** Pattern is directly included in all relevant computation dependencies. `memoryConnections` depends on `nodes` (which depends on `pattern`), so it's indirectly included.

---

### 3. Are nodes disappearing due to a re-render or due to a full ambient reset?

**FULL AMBIENT RESET (REMONTING)** ❌

**Critical Issue Found:**

**File:** `recursor/src/components/PatternField.tsx`

**Line 360:**
```typescript
const nodeId = `node-${patternIndex}-${localIndex}-${signature}`;
```

**Line 338:**
```typescript
const signature = computePatternSignature(pattern);
```

**Line 224:**
```typescript
<g key={node.nodeId}>
```

**Problem:**
1. When `pattern` changes → `signature` changes (line 338)
2. When `signature` changes → all `nodeId`s change (line 360)
3. When `nodeId`s change → React sees them as different components
4. React unmounts old nodes and mounts new ones → **FULL REMOUNT**

**Result:** Nodes are **disappearing and reappearing** (remounting) on every pattern mutation, not just re-rendering with updated props.

**Impact:**
- Animation state is lost (motion.text animations restart)
- Hover state is lost
- Visual "pop" as nodes unmount/remount
- Performance overhead from remounting

**Root Cause:** `nodeId` includes `signature`, which is derived from `pattern`. When `pattern` changes, all node identities change.

---

### 4. Is the field using stale pattern values?

**NO** ✅

**Evidence:**

**File:** `recursor/src/components/PatternField.tsx`

**Line 119-121:**
```typescript
const updatedPattern = pattern.map((value, i) =>
  i === patternIndex ? (value + 1) % (MAX_CELL_STATE + 1) : value
);
```
- Uses current `pattern` prop directly (not stale)

**Line 86-88:**
```typescript
const nodes = useMemo(() => {
  return deriveNodes(pattern, depth, historyNodes, nodeCount, entropy);
}, [pattern, depth, historyNodes, nodeCount, entropy]);
```
- `pattern` is in dependency array, so `nodes` always uses fresh `pattern`

**Line 345:**
```typescript
const value = pattern[patternIndex];
```
- Inside `deriveNodes`, uses the current `pattern` parameter

**Analysis:** All computations use the current `pattern` prop. No stale values detected.

---

## Summary

| Question | Answer | Status | File + Line |
|----------|--------|--------|-------------|
| **1. Does PatternField rebuild when pattern updates?** | YES | ✅ Correct | `PatternField.tsx:86-88` |
| **2. Is pattern in all dependency arrays?** | MOSTLY YES | ⚠️ Acceptable | `PatternField.tsx:81-88, 91-112` |
| **3. Are nodes disappearing due to re-render or reset?** | **FULL RESET** | ❌ **CRITICAL ISSUE** | `PatternField.tsx:360, 338, 224` |
| **4. Is the field using stale pattern values?** | NO | ✅ Correct | `PatternField.tsx:119, 86-88, 345` |

---

## Critical Issue: Node Remounting

**Location:** `recursor/src/components/PatternField.tsx:360`

**Problem:** `nodeId` includes `signature`, which changes when `pattern` changes, causing all nodes to remount on every mutation.

**Current Code:**
```typescript
const nodeId = `node-${patternIndex}-${localIndex}-${signature}`;
```

**Impact:**
- Nodes disappear and reappear (visual pop)
- Animation state lost
- Hover state lost
- Performance overhead

**Recommended Fix:**
Remove `signature` from `nodeId` to make node identity stable across pattern mutations:

```typescript
// Stable node ID: pattern index + local index (signature removed)
const nodeId = `node-${patternIndex}-${localIndex}`;
```

**Note:** This will make node identity stable, but node properties (position, luminosity, etc.) will still update correctly because they're computed from `pattern` in `deriveNodes`.

---

*Audit completed*

