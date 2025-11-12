# RECURSOR ALGORITHM AUDIT
## Complete Cognitive Architecture Flow

**Version:** 1.0  
**Generated:** 2025-11-12  
**Purpose:** Document the complete algorithmic thought process of the Recursor Engine

---

## SYSTEM INITIALIZATION

```
FUNCTION initRecursorSystem():
  // Phase 1: Database & Persistence Setup
  db = IndexedDB('RecursorDB')
  db.tables = {
    sessions: [id, timestamp, depth, completed, patterns[], decisions[], metadata],
    nodes: [id, timestamp, sessionId, pattern, signature, weight, connections[], lastAccessed],
    achievements: [id, sessionId, code, timestamp, revealed, metadata]
  }
  
  // Phase 2: Auth & Cloud Detection
  user = getCurrentAuthUser()
  IF user EXISTS:
    cloudSync.setUser(user.id)
    cloudMode = ENABLED
  ELSE:
    cloudMode = LOCAL_ONLY
  
  // Phase 3: Time-Based Decay Application
  AWAIT decayAllNodes()
    FOR EACH node IN db.nodes:
      daysSince = (now - node.lastAccessed) / (24 * 60 * 60 * 1000)
      decayFactor = exp(-0.1 * daysSince)  // 10% per day
      node.weight = max(0.3, min(1.0, decayFactor))  // Floor lowered to 0.3
      UPDATE node.weight
  
  // Phase 4: Session Initialization
  session = {
    timestamp: NOW,
    depth: 0,
    decisions: [],
    patterns: [],
    completed: false,
    decayFactor: 1.0,  // Fresh state
    metadata: { duration: 0, interactionCount: 0, uniquePatterns: 0 }
  }
  
  localSessionId = db.sessions.add(session)
  
  IF cloudMode = ENABLED:
    cloudSessionId = supabase.recursion_sessions.insert(session)
  
  // Phase 5: Initialize Visual State
  pattern = INITIAL_PATTERN = [0,0,0,0,0,0,0,0,0]
  depth = 0
  showPortal = true
  
  RETURN { pattern, depth, sessionId }
```

---

## DEPTH PROGRESSION & PORTAL TRANSITION

```
FUNCTION handleEnterPortal(currentPattern, currentDepth, sessionId):
  // Phase 1: Decay Check
  session = db.sessions.get(sessionId)
  currentDecay = calculateDecayFactor(session.timestamp, NOW)
  db.sessions.update(sessionId, { decayFactor: currentDecay })
  
  // Phase 2: Branching Decision
  newDepth = currentDepth + 1
  enableBranching = (newDepth % 3 == 0) AND (newDepth > 0)
  
  // Phase 3: Pattern Evolution
  evolvedPattern = AWAIT evolvePattern(
    pattern: currentPattern,
    depth: newDepth,
    branching: enableBranching
  )
  
  // Phase 4: State Transition (with delay)
  WAIT(PORTAL_TRANSITION_DURATION = 800ms)
  pattern = evolvedPattern
  depth = newDepth
  interactionCount = 0
  showPortal = false
  
  RETURN { pattern, depth }
```

---

## PATTERN EVOLUTION ENGINE

```
FUNCTION evolvePattern(currentPattern, depth, branching = false):
  // Step 1: Historical Context Retrieval
  recentSessions = db.sessions
    .orderBy('timestamp')
    .reverse()
    .limit(10)
    .toArray()
  
  recentPatterns = recentSessions.flatMap(s => s.patterns)
  avgDecayFactor = average(recentSessions.map(s => s.decayFactor))
  
  // Step 2: Entropy Analysis (Shannon)
  entropy = calculateEntropy(currentPattern):
    frequencies = countOccurrences(currentPattern)
    entropy = 0
    FOR EACH (value, count) IN frequencies:
      probability = count / length(currentPattern)
      entropy -= probability * log2(probability)
    RETURN entropy
  
  normalizedEntropy = min(entropy / 2.0, 1.0)
  
  // Step 3: Cluster Detection
  clusters = detectClusters(currentPattern):
    clusters = []
    FOR len = 2 TO floor(length / 2):
      FOR i = 0 TO length - len:
        sequence = currentPattern[i:i+len]
        positions = findAllOccurrences(sequence, currentPattern)
        IF positions.count > 1:
          clusters.add({
            sequence: sequence,
            positions: positions,
            length: len,
            frequency: positions.count
          })
    
    SORT clusters BY (frequency * length) DESC
    RETURN clusters
  
  clusterDensity = calculateClusterDensity(clusters):
    totalCoverage = sum(clusters.map(c => c.frequency * c.length))
    RETURN min(totalCoverage / (length * 2), 1.0)
  
  // Step 4: Mutation Weight Calculation
  weights = calculateMutationWeights(depth, entropy, clusterDensity, avgDecayFactor):
    depthWeight = min(1 + (depth * 0.2), 2.5)          // Exponential depth scaling
    entropyWeight = 1 + (0.5 - normalizedEntropy)      // Counter-entropy bias
    clusterWeight = 1 + (clusterDensity * 0.3)         // Structure awareness
    decayWeight = avgDecayFactor                       // Time-based reduction
    
    strength = depthWeight * entropyWeight * decayWeight
    chaos = (1 - avgDecayFactor) * 0.3 + (depth * 0.05)
    
    RETURN {
      strength,
      chaos,
      depthInfluence: depthWeight,
      entropyInfluence: entropyWeight,
      clusterInfluence: clusterWeight,
      decayInfluence: decayWeight
    }
  
  // Step 5: Branching Evolution (conditional)
  IF branching AND (depth % 3 == 0):
    branches = generateBranches(currentPattern, weights, branchCount = 3):
      branches = []
      FOR i = 0 TO branchCount:
        branch = clone(currentPattern)
        mutations = ceil(weights.strength * (1 + i * 0.5))
        
        FOR m = 0 TO mutations:
          // Deterministic pseudo-random position
          seed = sum(branch) + i * 1000 + m
          pos = seed % length(branch)
          delta = ceil(weights.chaos * 10) + i + 1
          branch[pos] = (branch[pos] + delta) % (MAX_CELL_STATE + 1)
        
        branches.add(branch)
      
      RETURN branches
    
    selectedIndex = selectBranch(branches, recentPatterns):
      affinities = []
      FOR EACH branch IN branches:
        affinity = 0
        FOR i = 0 TO min(length(branch), length(recentPatterns)):
          branchVal = branch[i % length(branch)]
          historyVal = recentPatterns[i] % (MAX_CELL_STATE + 1)
          diff = abs(branchVal - historyVal)
          
          IF diff == 1: affinity += 2      // Close similarity (interesting)
          IF diff == 0: affinity += 0.5    // Exact match (boring)
          IF diff >= 2: affinity += 1      // Variation (somewhat interesting)
        
        affinities.add(affinity)
      
      maxAffinity = max(affinities)
      candidates = affinities.filter(a => a >= maxAffinity * 0.8)
      
      // Deterministic selection
      seed = sum(recentPatterns)
      RETURN candidates[seed % length(candidates)].index
    
    RETURN branches[selectedIndex]
  
  // Step 6: Cluster-Aware Mutation
  strategy = (clusterDensity > 0.5) ? 'disrupt' : 'preserve'
  intensity = min(weights.strength / 2.5, 1.0)
  
  evolved = mutateWithClusters(currentPattern, clusters, strategy, intensity):
    mutated = clone(currentPattern)
    mutationCount = max(1, floor(length * intensity * 0.3))
    
    IF strategy == 'preserve':
      // Target non-cluster cells
      clusterPositions = Set(clusters.flatMap(c => c.positions))
      nonClusterPositions = [0...length].filter(i => NOT clusterPositions.has(i))
      
      FOR i = 0 TO mutationCount:
        idx = nonClusterPositions[i % length(nonClusterPositions)]
        mutated[idx] = (mutated[idx] + 1) % (MAX_CELL_STATE + 1)
    
    ELSE IF strategy == 'disrupt':
      // Target most significant cluster
      IF clusters.length > 0:
        targetCluster = clusters[0]
        FOR i = 0 TO mutationCount:
          clusterPos = targetCluster.positions[i % length(targetCluster.positions)]
          cellIdx = clusterPos + (i % targetCluster.length)
          IF cellIdx < length(mutated):
            mutated[cellIdx] = (mutated[cellIdx] + 2) % (MAX_CELL_STATE + 1)
    
    RETURN mutated
  
  // Step 7: Chaos Injection
  IF weights.chaos > 0.2:
    chaosMutations = floor(weights.chaos * 5)
    FOR i = 0 TO chaosMutations:
      seed = sum(evolved.map((val, idx) => val * idx)) + i
      pos = seed % length(evolved)
      evolved[pos] = (evolved[pos] + floor(weights.chaos * 10)) % (MAX_CELL_STATE + 1)
  
  RETURN evolved
```

---

## USER INTERACTION & DECISION RECORDING

```
FUNCTION handlePatternChange(newPattern, depth, sessionId, cloudSessionId):
  // Phase 1: Local State Update
  pattern = newPattern
  interactionCount++
  
  // Phase 2: Memory Node Creation
  nodeId = AWAIT createMemoryNode(newPattern, depth, sessionId):
    signature = join(newPattern, '-')
    now = NOW
    
    // Check for existing node
    existingNode = db.nodes.where('patternSignature').equals(signature).first()
    
    IF existingNode EXISTS:
      // Reinforce existing memory
      newWeight = min(1.0, existingNode.weight + 0.1)
      db.nodes.update(existingNode.id, {
        weight: newWeight,
        lastAccessed: now
      })
      RETURN existingNode.id
    
    // Find similar patterns for connections
    recentNodes = db.nodes
      .orderBy('lastAccessed')
      .reverse()
      .limit(50)
      .toArray()
    
    connections = []
    FOR EACH node IN recentNodes:
      IF connections.length < MAX_NODE_CONNECTIONS:
        similarity = calculatePatternSimilarity(newPattern, node.pattern):
          IF length(p1) != length(p2): RETURN 0
          matches = 0
          FOR i = 0 TO length(p1):
            IF p1[i] == p2[i]: matches++
          RETURN matches / length(p1)
        
        IF similarity >= SIMILARITY_THRESHOLD:
          connections.add(node.id)
    
    // Create new memory node
    newNode = {
      timestamp: now,
      patternSignature: signature,
      pattern: newPattern,
      depth: depth,
      weight: 1.0,
      connections: connections,
      lastAccessed: now,
      sessionId: sessionId
    }
    
    RETURN db.nodes.add(newNode)
  
  // Phase 3: Session Decision Recording
  session = db.sessions.get(sessionId)
  
  updatedDecisions = session.decisions + [`pattern-${depth}-${NOW}`]
  updatedPatterns = session.patterns + newPattern
  
  updates = {
    decisions: updatedDecisions,
    patterns: updatedPatterns,
    depth: depth,
    metadata: {
      duration: session.metadata.duration,
      interactionCount: interactionCount,
      uniquePatterns: Set(updatedPatterns).size
    }
  }
  
  db.sessions.update(sessionId, updates)
  
  // Phase 4: Cloud Sync (if authenticated)
  IF cloudMode = ENABLED:
    supabase.recursion_sessions.update(cloudSessionId, updates)
    supabase.recursion_patterns.insert({
      session_id: cloudSessionId,
      user_id: user.id,
      pattern: newPattern,
      depth: depth,
      timestamp: NOW
    })
  
  // Phase 5: Achievement Check (silent)
  achievementCodes = AWAIT checkAchievements(sessionId):
    earned = []
    existing = db.achievements.where('sessionId').equals(sessionId).toArray()
    existingCodes = Set(existing.map(a => a.code))
    
    FOR EACH (code, definition) IN ACHIEVEMENT_DEFINITIONS:
      IF existingCodes.has(code): CONTINUE
      
      isEarned = AWAIT definition.check(sessionId)
      
      IF isEarned:
        achievement = {
          code: code,
          timestamp: NOW,
          sessionId: sessionId,
          metadata: { description: definition.crypticHint },
          revealed: false
        }
        db.achievements.add(achievement)
        earned.add(code)
    
    RETURN earned
  
  // Phase 6: Cloud Achievement Sync
  IF cloudMode = ENABLED AND achievementCodes.length > 0:
    FOR EACH code IN achievementCodes:
      supabase.recursion_achievements.insert({
        session_id: cloudSessionId,
        user_id: user.id,
        code: code,
        unlocked_at: NOW,
        metadata: {}
      })
  
  // Phase 7: Portal Trigger Check
  isComplete = every(newPattern, val => val >= COMPLETION_THRESHOLD)
  IF isComplete:
    showPortal = true
  
  RETURN { nodeId, achievementCodes, isComplete }
```

---

## MEMORY CONSTELLATION GENERATION

```
FUNCTION generateConstellation(sessionId = null):
  // Phase 1: Node Retrieval
  IF sessionId:
    nodes = db.nodes.where('sessionId').equals(sessionId).toArray()
  ELSE:
    nodes = db.nodes.toArray()
  
  IF nodes.length == 0: RETURN null
  
  // Phase 2: Graph Layout Calculation
  layout = calculateForceDirectedLayout(nodes):
    // Initialize positions
    FOR EACH node IN nodes:
      node.x = random(-width/2, width/2)
      node.y = random(-height/2, height/2)
    
    // Apply forces over iterations
    FOR iteration = 0 TO 100:
      // Repulsion between all nodes
      FOR EACH node1 IN nodes:
        FOR EACH node2 IN nodes WHERE node1 != node2:
          dx = node1.x - node2.x
          dy = node1.y - node2.y
          distance = sqrt(dx^2 + dy^2)
          IF distance < MIN_DISTANCE:
            force = REPULSION_STRENGTH / (distance^2)
            node1.x += (dx / distance) * force
            node1.y += (dy / distance) * force
      
      // Attraction along connections
      FOR EACH node IN nodes:
        FOR EACH connectedId IN node.connections:
          connectedNode = nodes.find(n => n.id == connectedId)
          IF connectedNode:
            dx = connectedNode.x - node.x
            dy = connectedNode.y - node.y
            distance = sqrt(dx^2 + dy^2)
            force = ATTRACTION_STRENGTH * distance
            node.x += (dx / distance) * force * 0.5
            node.y += (dy / distance) * force * 0.5
      
      // Apply damping
      FOR EACH node IN nodes:
        node.x *= 0.95
        node.y *= 0.95
    
    RETURN nodes with (x, y) positions
  
  // Phase 3: Visual Mapping
  visualNodes = nodes.map(node => ({
    id: node.id,
    x: node.x,
    y: node.y,
    radius: 3 + (node.weight * 7),           // Weight affects size
    opacity: 0.3 + (node.weight * 0.7),      // Weight affects visibility
    color: hsl(180 + node.depth * 30, 70%, 50%),  // Depth affects hue
    connections: node.connections,
    decayFactor: calculateDecayFactor(node.lastAccessed)
  }))
  
  // Phase 4: Connection Lines
  connections = []
  FOR EACH node IN visualNodes:
    FOR EACH targetId IN node.connections:
      targetNode = visualNodes.find(n => n.id == targetId)
      IF targetNode:
        connections.add({
          from: { x: node.x, y: node.y },
          to: { x: targetNode.x, y: targetNode.y },
          strength: min(node.weight, targetNode.weight),
          opacity: min(node.opacity, targetNode.opacity) * 0.3
        })
  
  RETURN { nodes: visualNodes, connections: connections }
```

---

## DECAY PROPAGATION SYSTEM

```
FUNCTION propagateDecay():
  // Run periodically (on app start, after session complete)
  
  nodes = db.nodes.toArray()
  now = NOW
  
  FOR EACH node IN nodes:
    // Calculate time-based decay
    daysSince = (now - node.lastAccessed) / (24 * 60 * 60 * 1000)
    
    // Exponential decay curve: exp(-k * t)
    // k = 0.1 means ~10% decay per day
    decayFactor = exp(-WEIGHT_DECAY_RATE * daysSince)
    
    // Apply decay with minimum threshold
    newWeight = max(MIN_NODE_WEIGHT, node.weight * decayFactor)
    
    // Update node
    db.nodes.update(node.id, { weight: newWeight })
    
    // Visual consequence: faded nodes in constellation
    // Algorithmic consequence: reduced mutation influence
```

---

## VISUAL MODULATION SYSTEM

```
FUNCTION updateVisualState(depth, pattern, decayFactor):
  // Phase 1: Pattern Analysis
  analysis = analyzePattern(pattern, depth, decayFactor)
  entropy = analysis.normalizedEntropy
  chaos = analysis.mutationWeights.chaos
  
  // Phase 2: Depth-Based Color
  hue = 180 + (depth * 30)  // Cyan to Purple to Pink progression
  saturation = 70 + (entropy * 30)
  lightness = 50 - (depth * 2)  // Darker at greater depths
  
  primaryColor = hsl(hue, saturation, lightness)
  
  // Phase 3: Glitch Intensity
  glitchParams = getGlitchParams(depth):
    intensity = min(depth / 25, 1.0)
    RETURN {
      frequency: 2000 - (intensity * 1500),      // More frequent
      duration: 100 + (intensity * 400),         // Longer duration
      displacement: 2 + (intensity * 8),         // Stronger shift
      colorShift: intensity * 10,
      scanlines: intensity > 0.3,
      chromatic: intensity > 0.5,
      distortion: intensity > 0.7
    }
  
  // Phase 4: Vortex Stage
  vortexStage = floor(depth / 5)
  vortexParams = {
    ringCount: 3 + vortexStage,
    rotationSpeed: 20 + (vortexStage * 10),
    pulseIntensity: 0.3 + (vortexStage * 0.1),
    bloomRadius: 100 + (vortexStage * 50)
  }
  
  // Phase 5: Architecture Morph
  architecturePhase = min(floor(depth / 4), 5)
  architectureColors = [
    ['#9b87f5', '#7E69AB'],  // Phase 0: Purple
    ['#8B5CF6', '#6E59A5'],  // Phase 1: Deeper purple
    ['#7C3AED', '#5B21B6'],  // Phase 2: Violet
    ['#6D28D9', '#4C1D95'],  // Phase 3: Deep violet
    ['#5B21B6', '#3B0764'],  // Phase 4: Ultra violet
    ['#4C1D95', '#1E1B4B']   // Phase 5: Near black-violet
  ]
  
  // Phase 6: Particle Density
  particleCount = 20 + (depth * 3)
  particleSpeed = 5 + (chaos * 10)
  particleOpacity = 0.3 + (entropy * 0.4)
  
  // Phase 7: Audio Modulation
  IF audioEnabled:
    audioParams = {
      frequency: 220 + (depth * 30),         // Rising pitch
      filterCutoff: 1000 + (entropy * 3000), // More harmonics with chaos
      reverbDecay: 1 + (depth * 0.3),        // Deeper echo
      noiseLevel: chaos * 0.5,               // Chaos = noise
      decayModulation: decayFactor           // Time affects resonance
    }
  
  RETURN {
    colors: { primary: primaryColor, architecture: architectureColors[architecturePhase] },
    glitch: glitchParams,
    vortex: vortexParams,
    particles: { count: particleCount, speed: particleSpeed, opacity: particleOpacity },
    audio: audioParams
  }
```

---

## SESSION REFLECTION & CLOSURE

```
FUNCTION handleReset(sessionId, depth):
  // Phase 1: Session Completion
  session = db.sessions.get(sessionId)
  db.sessions.update(sessionId, {
    completed: true,
    metadata: {
      ...session.metadata,
      duration: NOW - session.timestamp
    }
  })
  
  // Phase 2: Final Achievement Check
  finalAchievements = AWAIT checkAchievements(sessionId)
  
  // Phase 3: Gather Reflection Data
  nodes = db.nodes.where('sessionId').equals(sessionId).toArray()
  achievements = db.achievements.where('sessionId').equals(sessionId).toArray()
  
  reflectionData = {
    depth: depth,
    duration: session.metadata.duration,
    interactionCount: session.metadata.interactionCount,
    uniquePatterns: session.metadata.uniquePatterns,
    nodesCreated: nodes.length,
    connections: sum(nodes.map(n => n.connections.length)),
    achievements: achievements.map(a => ({
      code: a.code,
      name: getAchievementInfo(a.code).name,
      hint: getAchievementInfo(a.code).crypticHint
    })),
    entropy: calculateEntropy(session.patterns),
    decayFactor: session.decayFactor
  }
  
  // Phase 4: Display Reflection Modal
  SHOW ReflectionModal(reflectionData)
  
  // Phase 5: Reset State (after modal close)
  depth = 0
  pattern = INITIAL_PATTERN
  showPortal = true
  interactionCount = 0
  
  // Phase 6: Initialize New Session
  AWAIT initSession()
```

---

## CLOUD SYNC ORCHESTRATION

```
FUNCTION syncToCloud(operation, data):
  IF NOT authenticated: RETURN null
  
  MATCH operation:
    CASE 'session_start':
      cloudSessionId = supabase.recursion_sessions.insert({
        user_id: user.id,
        depth: data.depth,
        pattern: data.patterns,
        timestamp: data.timestamp,
        metadata: data.metadata
      })
      RETURN cloudSessionId
    
    CASE 'session_update':
      supabase.recursion_sessions.update({
        id: data.cloudSessionId,
        depth: data.depth,
        pattern: data.patterns,
        metadata: data.metadata
      })
    
    CASE 'pattern_save':
      supabase.recursion_patterns.insert({
        session_id: data.cloudSessionId,
        user_id: user.id,
        pattern: data.pattern,
        depth: data.depth,
        timestamp: NOW
      })
    
    CASE 'achievement_unlock':
      supabase.recursion_achievements.insert({
        session_id: data.cloudSessionId,
        user_id: user.id,
        code: data.code,
        unlocked_at: NOW,
        metadata: {}
      })
    
    CASE 'constellation_archive':
      IF hasPremium(user.id):
        supabase.constellation_archives.insert({
          session_id: data.cloudSessionId,
          user_id: user.id,
          svg_data: data.svgData,
          metadata: data.metadata
        })
```

---

## EMERGENT FEEDBACK LOOPS

### Loop 1: Weight Reinforcement Cycle
```
USER interacts with pattern
  → CREATE memory node with weight = 1.0
    → IF pattern repeated:
      → INCREASE weight by +0.1
        → HIGHER weight = LARGER visual node in constellation
          → MORE visible = MORE likely to influence future mutations
            → PATTERN becomes "sticky" (self-reinforcing)
```

### Loop 2: Decay-Entropy Coupling
```
TIME passes without interaction
  → APPLY decay to node weights
    → LOWER weight = REDUCED mutation influence
      → PATTERNS evolve toward higher entropy
        → HIGHER entropy = INCREASED mutation aggression
          → MORE aggressive mutation = NEW patterns created
            → CYCLE repeats (equilibrium seeking)
```

### Loop 3: Cluster-Disruption Dialectic
```
USER creates repeated patterns
  → DETECT clusters in pattern
    → HIGH cluster density = STRUCTURED pattern
      → SYSTEM switches to 'disrupt' strategy
        → BREAK clusters via targeted mutation
          → LOWER cluster density
            → SYSTEM switches to 'preserve' strategy
              → CYCLE oscillates (order/chaos balance)
```

### Loop 4: Depth-Chaos Escalation
```
DEPTH increases
  → MUTATION strength increases exponentially
    → MORE aggressive changes per evolution
      → FASTER pattern divergence
        → USERS forced to adapt strategy
          → ACHIEVEMENT unlocks (behavioral feedback)
            → NEW interaction patterns emerge
              → DEPTH continues increasing (exponential scaling)
```

### Loop 5: Branching-History Affinity
```
DEPTH reaches branching point (d % 3 == 0)
  → GENERATE multiple evolution branches
    → COMPARE branches to historical patterns
      → SELECT branch with highest "affinity"
        → AFFINITY rewards similarity-but-not-sameness
          → SELECTED branch influenced by past decisions
            → HISTORY shapes future (deterministic chaos)
```

### Loop 6: Achievement-Behavior Modification
```
USER exhibits pattern (e.g., rapid descent, symmetry)
  → SILENT achievement unlock
    → ACHIEVEMENT stored but not revealed
      → USER discovers in constellation later
        → REVELATION recontextualizes past actions
          → USER modifies future behavior
            → NEW achievements become possible (meta-pattern)
```

---

## INTERACTION FLOW SUMMARY

```
┌─────────────────────────────────────────────────────────┐
│                   INIT SYSTEM                           │
│  • Load IndexedDB                                       │
│  • Check auth → enable cloud sync if authenticated     │
│  • Apply decay to all nodes                             │
│  • Create session (local + cloud)                       │
└─────────────────┬───────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────┐
│              SHOW PORTAL (depth = 0)                    │
│  • Display recursion entrance                           │
│  • Wait for user to enter                               │
└─────────────────┬───────────────────────────────────────┘
                  ↓ USER ENTERS
┌─────────────────────────────────────────────────────────┐
│            EVOLVE PATTERN                               │
│  1. Retrieve recent session history                     │
│  2. Calculate entropy & detect clusters                 │
│  3. Determine mutation weights (depth/decay/entropy)    │
│  4. Check if branching depth (d % 3 == 0)               │
│     YES → Generate branches, select via affinity        │
│     NO → Apply cluster-aware mutation + chaos           │
│  5. Return evolved pattern                              │
└─────────────────┬───────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────┐
│           DISPLAY PATTERN GRID                          │
│  • Render 3x3 grid with evolved pattern                 │
│  • Wait for user to select 3 cells                      │
└─────────────────┬───────────────────────────────────────┘
                  ↓ USER MODIFIES PATTERN
┌─────────────────────────────────────────────────────────┐
│         RECORD DECISION & CREATE NODE                   │
│  1. Create memory node with signature                   │
│     • Check for duplicate → reinforce weight            │
│     • Find similar patterns → create connections        │
│     • Store in IndexedDB                                │
│  2. Update session with decision + pattern              │
│  3. Sync to cloud (if authenticated)                    │
│     • session update                                    │
│     • pattern insert                                    │
│  4. Check achievements (silent)                         │
│  5. Sync achievements to cloud                          │
│  6. Check if pattern complete → show portal             │
└─────────────────┬───────────────────────────────────────┘
                  ↓
        ┌─────────┴──────────┐
        ↓                    ↓
┌──────────────────┐  ┌─────────────────┐
│ PORTAL SHOWN     │  │ CONTINUE EDIT   │
│ depth++          │  │ same depth      │
│ GOTO EVOLVE      │  │ GOTO DISPLAY    │
└──────────────────┘  └─────────────────┘
        ↓
        ... cycle repeats until RESET ...
        ↓
┌─────────────────────────────────────────────────────────┐
│              SESSION RESET                              │
│  1. Mark session as completed                           │
│  2. Final achievement check                             │
│  3. Gather reflection data                              │
│     • depth, duration, interactions                     │
│     • nodes created, connections                        │
│     • achievements unlocked                             │
│     • entropy analysis                                  │
│  4. Display ReflectionModal with stats                  │
│  5. On close → initialize new session                   │
│  6. GOTO INIT SYSTEM                                    │
└─────────────────────────────────────────────────────────┘
```

---

## VISUAL EFFECT PROGRESSION

```
DEPTH     VISUAL EFFECTS UNLOCKED
────────────────────────────────────────────────────────────
0         • Clean interface
          • Purple primary color
          • Smooth animations

3         • Subtle glitch (10% intensity)
          • Occasional scanline artifacts
          • Slight color shift

5         • Noticeable glitch (20% intensity)
          • Color shift on interactions
          • Particle density increases
          
8         • Geometry distortion (30% intensity)
          • Pattern grid warping
          • Vortex awakening (stage 1)

12        • Reality fracture (50% intensity)
          • Strong chromatic aberration
          • Persistent scanlines
          • Vortex stage 2 (more rings)

15        • Architecture morph (70% intensity)
          • Background color shifts to deep violet
          • Heavy distortion
          • Vortex stage 3

20        • Vortex awakening (90% intensity)
          • Maximum particle density
          • Full chromatic separation
          • Vortex stage 4 (rotating rapidly)

25+       • Singularity (100% intensity)
          • Complete visual breakdown
          • Reality glitch at maximum
          • Near-black architecture
          • Vortex stage 5 (chaos mode)
```

---

## ACHIEVEMENT DETECTION LOGIC

```
ACHIEVEMENT            TRIGGER CONDITION
─────────────────────────────────────────────────────────────
looped_path           • Same pattern signature appears 3+ times in session

the_scatterer         • 80%+ of patterns in session are unique (high entropy)

the_diver             • Session reaches depth ≥ 10

echo_state            • Immediate pattern repetition (adjacent nodes identical)

perfect_symmetry      • Any pattern in session is perfectly symmetric

void_gazer            • 15+ interactions at depth 0 before first portal

connection_weaver     • Total connections across session nodes ≥ 10

decay_master          • ALL nodes in database have weight < 0.3

rapid_descent         • Depth ≥ 5 reached in < 2 minutes

pattern_monk          • Session interaction count ≥ 100
```

---

## DATA PERSISTENCE HIERARCHY

```
┌─────────────────────────────────────────────────────────┐
│                    USER STATE                           │
└─────────────┬───────────────────────────────────────────┘
              ↓
    ┌─────────┴──────────┐
    ↓                    ↓
┌─────────────────┐  ┌──────────────────────┐
│  ANONYMOUS      │  │  AUTHENTICATED       │
│  (Local Only)   │  │  (Local + Cloud)     │
└────────┬────────┘  └──────────┬───────────┘
         ↓                      ↓
┌─────────────────┐  ┌──────────────────────┐
│  IndexedDB      │  │  IndexedDB           │
│  • sessions     │  │  • sessions          │
│  • nodes        │  │  • nodes             │
│  • achievements │  │  • achievements      │
└─────────────────┘  └──────────┬───────────┘
                                ↓
                     ┌──────────────────────┐
                     │  Supabase            │
                     │  • recursion_sessions│
                     │  • recursion_patterns│
                     │  • recursion_achievements│
                     │  • constellation_archives (premium) │
                     └──────────────────────┘
```

---

## MEMORY MANAGEMENT STRATEGY

```
STRATEGY: Exponential decay with connection-weighted importance

1. BASE DECAY
   weight(t) = weight(0) * exp(-k * days)
   where k = 0.1 (10% per day)

2. CONNECTION BOOST
   Nodes with many connections decay slower:
   effective_k = k * (1 - (connections.length / MAX_CONNECTIONS) * 0.5)

3. ACCESS REFRESH
   Each time node accessed:
   node.lastAccessed = NOW
   node.weight = min(1.0, node.weight + 0.1)

4. MINIMUM THRESHOLD
   Nodes never fully disappear:
   weight_final = max(0.5, weight_decayed)

5. VISUAL CONSEQUENCE
   Constellation rendering:
   node.radius = 3 + (weight * 7)
   node.opacity = 0.3 + (weight * 0.7)

6. ALGORITHMIC CONSEQUENCE
   Pattern evolution:
   decayFactor = avg(recent_sessions.map(s => s.decayFactor))
   weights.strength *= decayFactor
```

---

## ENTROPY DYNAMICS

```
ENTROPY CALCULATION (Shannon):
  H(X) = -Σ p(x) * log₂(p(x))
  
  Where:
  - X = pattern state
  - p(x) = probability of value x appearing
  - Range: 0 (all same) to 2 (maximum diversity for 4 states)

NORMALIZED ENTROPY:
  H_norm = H / 2.0  (assuming 4 possible cell states)

ENTROPY EFFECTS:
  • LOW entropy (< 0.3)
    → Pattern is ordered/structured
    → Mutation increases (break order)
    → Cluster detection more impactful
  
  • MEDIUM entropy (0.3 - 0.7)
    → Balanced chaos/order
    → Standard mutation rates
    → Branching explores alternatives
  
  • HIGH entropy (> 0.7)
    → Pattern is chaotic/random
    → Mutation decreases (preserve chaos)
    → System seeks structure
```

---

## MUTATION WEIGHT COMPOSITION

```
FORMULA:
  strength = depthWeight * entropyWeight * decayWeight
  
WHERE:
  depthWeight = min(1 + (depth * 0.2), 2.5)
    → Exponential scaling: depth 0 = 1.0x, depth 10 = 3.0x (capped)
  
  entropyWeight = 1 + (0.5 - normalizedEntropy)
    → Counter-entropy: low entropy = 1.5x, high entropy = 0.5x
  
  decayWeight = avgDecayFactor
    → Fresh sessions = 1.0x, old sessions = 0.5x minimum
  
  chaos = (1 - avgDecayFactor) * 0.3 + (depth * 0.05)
    → Random mutation component increases with depth and decay

INTERPRETATION:
  strength → How many cells mutate, how much they change
  chaos → Unpredictability of mutations (random injection)
```

---

## CONSTELLATION FORCE ALGORITHM

```
LAYOUT: Force-directed graph with custom physics

1. INITIALIZATION
   FOR EACH node:
     node.x = random(-width/2, width/2)
     node.y = random(-height/2, height/2)
     node.vx = 0
     node.vy = 0

2. ITERATION (100 steps)
   
   // Repulsion (prevent overlap)
   FOR EACH pair (node_i, node_j):
     dx = node_i.x - node_j.x
     dy = node_i.y - node_j.y
     distance = sqrt(dx² + dy²)
     IF distance < MIN_DISTANCE:
       force = REPULSION_STRENGTH / distance²
       node_i.vx += (dx / distance) * force
       node_i.vy += (dy / distance) * force
   
   // Attraction (along connections)
   FOR EACH node WITH connections:
     FOR EACH connected_id IN node.connections:
       connected = find_node(connected_id)
       dx = connected.x - node.x
       dy = connected.y - node.y
       distance = sqrt(dx² + dy²)
       force = ATTRACTION_STRENGTH * distance
       node.vx += (dx / distance) * force * 0.5
       node.vy += (dy / distance) * force * 0.5
   
   // Apply velocity
   FOR EACH node:
     node.x += node.vx
     node.y += node.vy
     node.vx *= DAMPING
     node.vy *= DAMPING

3. VISUAL MAPPING
   radius = 3 + (weight * 7)
   opacity = 0.3 + (weight * 0.7)
   hue = 180 + (depth * 30)
```

---

## CRITICAL CONSTANTS

```
// Pattern Evolution
MAX_CELL_STATE = 3                    // Cell values: 0-3
COMPLETION_THRESHOLD = 2              // Pattern complete when all ≥ 2
EVOLUTION_HISTORY_SIZE = 10           // Sessions to consider for evolution
SIMILARITY_THRESHOLD = 0.6            // 60% match = similar patterns

// Memory Graph
MAX_NODE_CONNECTIONS = 5              // Max links per node
MIN_NODE_WEIGHT = 0.5                 // Minimum weight (never 0)
WEIGHT_DECAY_RATE = 0.1               // 10% decay per day

// Visual
PORTAL_TRANSITION_DURATION = 800      // ms for depth transition
GLITCH_FREQUENCY_MIN = 500            // ms between glitches
GLITCH_FREQUENCY_MAX = 2000           // ms between glitches

// Branching
BRANCHING_INTERVAL = 3                // Branch every 3 depths
BRANCH_COUNT = 3                      // Number of evolution paths

// Physics
REPULSION_STRENGTH = 1000             // Node repulsion force
ATTRACTION_STRENGTH = 0.01            // Connection attraction
DAMPING = 0.95                        // Velocity damping factor
```

---

## PHASE 1.1: DEPTH RESTORATION PATCH

**Implemented:** 2025-11-12  
**Objective:** Transform passive clicking into immersive descent

### REASONING FOR PATCH

User disengagement detected due to:
- **Static Recursion Loop:** Mutation feedback felt mechanical rather than environmental
- **Tonal Mismatch:** Bright white cells contradicted dark cosmic theme
- **Cognitive Disconnect:** Explicit instructions broke mystery and discovery
- **Absence of Resonance:** No environmental response to user decisions

The recursion grid existed in isolation — changes lacked weight, consequence, or atmosphere. Users reported feeling like they were "clicking boxes" rather than "descending into memory."

### UPDATED ALGORITHMIC BEHAVIOR

#### 1. Dark Cosmic Color System
```
FUNCTION getCellColor(value, depth, isSelected):
  baseHue = BASE_HUE + depth * HUE_SHIFT_PER_DEPTH
  
  // Dark palette transformation
  saturation = 70 - (value * 8)        // Mystery through desaturation
  lightness = 15 + (value * 8)         // Range: 15-40% (dark cosmic)
  
  IF isSelected:
    RETURN hsl(baseHue + 60, 85%, 45%)  // Cyan accent glow
  
  RETURN hsl(baseHue, saturation%, lightness%)
  
  // Color progression:
  // Depth 0: Deep blue (hsl(180, 70%, 15%))
  // Depth 5: Violet-blue (hsl(330, 62%, 23%))
  // Depth 10+: Cyan-violet (hsl(480, 54%, 31%))
```

**Rationale:** Dark tones create atmospheric depth. Lightness never exceeds 40%, maintaining cosmic immersion. Saturation decreases with cell maturity, suggesting entropy and decay.

#### 2. Environmental Feedback Loop
```
FUNCTION onMutation(pattern, depth):
  totalMutations++
  envPulse = NOW  // Timestamp trigger
  
  // Reactive systems cascade:
  TRIGGER particleFieldPulse(envPulse, depth)
  TRIGGER constellationDrift(envPulse, depth)
  TRIGGER entropyCounterFlash(envPulse)
  TRIGGER audioDeepening(depth)
  
  // Visual responses:
  // - 30 particles burst outward (scale: 1 → 2.5 → 0)
  // - Background constellation drifts (radial gradient pulse)
  // - Entropy/Chaos counters briefly brighten (opacity: 0.7 → 1 → 0.7)
  // - Ambient audio base frequency drops by 2 Hz per depth
```

**Rationale:** Every mutation creates environmental ripples. The system "notices" and responds. Feedback is subtle but pervasive — not gamified notifications, but atmospheric consequence.

#### 3. Ambient Resonance Enhancement
```
FUNCTION updateAudioWithDepth(depth, entropy, chaos):
  // Enhanced descent feel
  baseFreq = max(30, 45 - depth * 2)           // Lower frequencies per depth
  filterFreq = max(150, 2000 - depth * 180)    // More aggressive darkening
  distortion = (1 - decay) * 100 + chaos * 60 + depth * 5
  
  // Master volume increases subtly with depth (presence without loudness)
  masterVolume = 0.15 + min(depth * 0.015, 0.1)
  
  // Psychological effect:
  // - Frequencies descend from 45 Hz → 30 Hz (subsonic rumble)
  // - Filter cuts high frequencies more aggressively
  // - Distortion accumulates with depth, creating "weight"
  // - Volume presence increases to prevent silence = emptiness
```

**Rationale:** Audio must feel like *descending*, not leveling up. Lower frequencies = psychological depth. Increased distortion with depth = psychological pressure. Subtle volume increase = presence without aggression.

#### 4. Micro-Reveal System (Cryptic Messages)
```
FUNCTION triggerCrypticMessage(mutationCount):
  mutationsSinceLastMessage = mutationCount - lastTriggerCount
  threshold = random(3, 5)  // Every 3-5 mutations
  
  IF mutationsSinceLastMessage >= threshold:
    message = selectRandom(CRYPTIC_MESSAGES)
    display(message, duration: 3000ms, fadeIn: 500ms, fadeOut: 500ms)
    lastTriggerCount = mutationCount
  
  CRYPTIC_MESSAGES = [
    "Something remembers you.",
    "Patterns recur.",
    "The void adjusts.",
    "Memory fades, but not entirely.",
    "You have been here before.",
    "Deeper still.",
    "The constellation shifts.",
    "Time is not linear here.",
    "Your choices echo.",
    "Recursion intensifies.",
    "The pattern recognizes itself.",
    // ... 15 total messages
  ]
```

**Rationale:** Mystery retention through sparse revelation. Messages appear without user input, creating sense of observation by system. 3-second duration prevents distraction but ensures absorption. No explanations, no context — only atmospheric hints that the system is aware.

#### 5. Mystery Retention (Instruction Removal)
```
BEFORE:
  "Select 3 cells to mutate the pattern"  // Explicit, tutorial-like
  
AFTER:
  Visual progress indicators only:
  - 3 dots below grid (hollow → filled with glow)
  - Dots pulse when active (scale: 1 → 1.4 → 1)
  - Cyan glow on filled dots (hsl(180, 70%, 50%))
  - Hover glow on cells (0 0 40px + 0 0 60px)
```

**Rationale:** Discovery through light, not words. Users intuit through visual feedback. Hover glows guide attention without instructing. Pulsing dots create anticipation. No explicit teaching = preservation of mystery and exploration.

### FEEDBACK MODEL ARCHITECTURE

```
USER ACTION (cell click)
  ↓
MUTATION TRIGGERED
  ↓
PARALLEL FEEDBACK SYSTEMS:
├─ Visual: Particle burst (30 particles, radial outward)
├─ Spatial: Constellation drift pulse (1.5s radial gradient)
├─ Audio: Frequency descent + distortion increase
├─ Data: Entropy/Chaos counters flash briefly
└─ Narrative: Cryptic message (probabilistic, 3-5 mutation interval)
  ↓
ENVIRONMENTAL COHERENCE RESTORED
```

**Key Principle:** Feedback is *atmospheric*, not *informational*. The system doesn't tell you what happened — it *shows* through environmental response. Users feel immersed rather than instructed.

### DESIGN INTENT

> "To transform passive clicking into immersive descent."

**Core Philosophy:**
- **No Overexposure:** Dark palette prevents visual fatigue
- **No Gamification:** No scores, no progress bars, no congratulations
- **No Hand-Holding:** Discovery through environmental cues, not tutorials
- **Eerie Deliberation:** Slow pace is intentional — recursion is meditation, not reaction
- **Psychological Weight:** Each mutation should feel consequential, not casual

**Emotional Trajectory:**
```
Depth 0-3:   Curiosity (dark, glowing, mysterious)
Depth 4-7:   Immersion (audio deepens, messages appear)
Depth 8-12:  Unease (environment responds, patterns recur)
Depth 13+:   Descent (psychological weight, subsonic pressure)
```

### TECHNICAL IMPLEMENTATION NOTES

**Color System:**
- HSL-based for smooth hue transitions
- Lightness capped at 40% (never approaches white)
- Saturation decreases with value (entropy visual)

**Audio Modulation:**
- Web Audio API for real-time synthesis
- Frequency range: 30-45 Hz (subsonic to low bass)
- Distortion curve scales with depth + chaos + decay

**Particle System:**
- 30 ambient particles (increased from 20)
- Pulse trigger on mutation via envPulse timestamp
- Scale animation: 1 → 2.5 → 0 (burst then fade)
- Glow effect via box-shadow (hsl-based)

**Message Timing:**
- Random interval 3-5 mutations (prevents predictability)
- 3-second display duration (absorption without distraction)
- Opacity animation: 0 → 1 → 1 → 0 (gradual)
- Position: Below grid, near cryptic messages context

### VALIDATION CRITERIA

Patch successful if users report:
- ✓ "Feels like descending, not progressing"
- ✓ "The system knows I'm here"
- ✓ "Darker, more mysterious now"
- ✓ "I discover rather than being told"

Patch failed if users report:
- ✗ "Too dark, can't see cells"
- ✗ "Doesn't feel different"
- ✗ "Lost/confused without instructions"

**Status:** Monitoring user feedback post-deployment.

---

## SYSTEM INVARIANTS

```
GUARANTEES maintained by the system:

1. SESSION PERSISTENCE
   ✓ Every user interaction creates exactly one session record
   ✓ Sessions never deleted, only marked completed
   ✓ Cloud sync is eventual (local-first, sync on save)

2. MEMORY GRAPH INTEGRITY
   ✓ Node connections only reference existing nodes
   ✓ Pattern signatures uniquely identify patterns
   ✓ Weights always in range [0.3, 1.0] (floor lowered for deeper fade)
   ✓ Decay applied globally before session start

3. EVOLUTION DETERMINISM
   ✓ Same pattern + depth + history → same evolution
   ✓ Branching is deterministic (no Math.random())
   ✓ Chaos is pseudo-random (seeded from state)

4. ACHIEVEMENT UNIQUENESS
   ✓ Each achievement unlocked at most once per session
   ✓ Silent unlock → no immediate UI feedback
   ✓ Reveal happens in constellation view

5. VISUAL CONSISTENCY
   ✓ Depth → color → entropy → all derived from state
   ✓ No arbitrary randomness in visuals
   ✓ Effect intensity always proportional to depth/entropy

6. DATA SOVEREIGNTY
   ✓ Anonymous users: 100% local IndexedDB
   ✓ Authenticated users: local + cloud (never cloud-only)
   ✓ Premium features never block free tier core loop
```

---

## EMERGENT PROPERTIES

Properties that arise from system interactions but are not explicitly programmed:

1. **Pattern Attractor States**
   - Certain patterns become "sticky" due to weight reinforcement
   - Users unconsciously gravitate toward familiar structures
   - Creates personal "fingerprint" in constellation

2. **Depth Plateaus**
   - Mutation aggression makes deep progression harder
   - Natural difficulty curve emerges from weight equations
   - Users hit "walls" around depth 5, 10, 15

3. **Historical Influence**
   - Past sessions subtly shape future evolutions
   - Users experience déjà vu when patterns echo history
   - Long-term players develop "muscle memory" for mutations

4. **Constellation Clustering**
   - Similar patterns naturally cluster in force layout
   - Visual reveals behavioral patterns user didn't notice
   - Emergence of "memory regions" (chaotic, ordered, transitional)

5. **Achievement Hunting**
   - Silent achievements create mystery
   - Users develop theories about unlock conditions
   - Behavioral experimentation emerges naturally

6. **Decay Rhythm**
   - Time away creates "freshness" on return
   - Returning players experience different mutation landscape
   - Encourages periodic engagement over marathon sessions

---

## END OF ALGORITHM AUDIT

**System Status:** SELF-AWARE  
**Thought Pattern:** DOCUMENTED  
**Recursion Loop:** COMPLETE

"If you've read this far, you understand the mirror is not empty."
