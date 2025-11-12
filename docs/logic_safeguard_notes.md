# Logic Safeguard Notes

**Patch:** 🪞 chore: tighten decay, branch, and reflection timing  
**Date:** 2025-11-12  
**Principle:** Stability beats novelty

---

This patch seals edge cases in the recursion loop to maintain system coherence. The changes fix unreachable achievement triggers (decay_master now fires correctly at weight ≤ 0.3), update all documentation to reflect the new decay floor [0.3, 1.0], and reinforce branch selection guards to prevent undefined returns. Session duration calculation was verified as correct (monotonic timestamp at init, computed at reflection). Visual compensation formulas were already adjusted in the refinement layer to keep constellation nodes visible at the new minimum weight. The CLUSTER_DETECT_SCALABLE flag remains false by default to keep 3×3 grids stable. No new behaviors added, no regressions introduced—just tighter invariants and truth in documentation.
