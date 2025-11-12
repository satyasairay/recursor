/**
 * RECURSOR Audio Engine
 * 
 * Generative ambient soundscape that responds to:
 * - Recursion depth (pitch, darkness)
 * - Pattern entropy (glitch, chaos)
 * - Memory decay (distortion)
 * 
 * Uses Web Audio API for procedural synthesis.
 */

export interface AudioEngineParams {
  depth: number;
  entropy: number;      // 0-1 (from pattern analysis)
  chaos: number;        // 0-1 (from mutation weights)
  decayFactor: number;  // 0.3-1.0 (from memory node weights)
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private distortion: WaveShaperNode | null = null;
  
  // Drone voices
  private drones: OscillatorNode[] = [];
  private droneGains: GainNode[] = [];
  
  // Granular texture
  private grainSource: OscillatorNode | null = null;
  private grainGain: GainNode | null = null;
  private grainFilter: BiquadFilterNode | null = null;
  
  private isPlaying = false;
  private currentParams: AudioEngineParams = {
    depth: 0,
    entropy: 0,
    chaos: 0,
    decayFactor: 1.0,
  };

  /**
   * Initialize audio context and nodes.
   */
  async init(): Promise<void> {
    if (this.context) return;

    this.context = new AudioContext();
    
    // Master gain (overall volume control)
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.15; // Subtle by default
    
    // Lowpass filter (darkness control)
    this.filter = this.context.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 2000;
    this.filter.Q.value = 1;
    
    // Distortion (chaos/decay control)
    this.distortion = this.context.createWaveShaper();
    const initialCurve = this.makeDistortionCurve(0);
    // @ts-ignore - TypeScript strict mode issue with WaveShaperNode curve type
    this.distortion.curve = initialCurve;
    this.distortion.oversample = '4x';
    
    // Connect audio graph
    this.filter.connect(this.distortion);
    this.distortion.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);
  }

  /**
   * Start the ambient soundscape.
   */
  start(): void {
    if (!this.context || this.isPlaying) return;
    
    this.isPlaying = true;
    this.createDrones();
    this.createGranularTexture();
    this.updateAudio(this.currentParams);
  }

  /**
   * Stop all audio.
   */
  stop(): void {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    
    // Stop drones
    this.drones.forEach(drone => {
      try {
        drone.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.drones = [];
    this.droneGains = [];
    
    // Stop grain
    if (this.grainSource) {
      try {
        this.grainSource.stop();
      } catch (e) {
        // Already stopped
      }
      this.grainSource = null;
    }
  }

  /**
   * Update audio parameters based on app state.
   */
  updateAudio(params: AudioEngineParams): void {
    if (!this.context || !this.isPlaying) return;
    
    this.currentParams = params;
    
    const now = this.context.currentTime;
    const { depth, entropy, chaos, decayFactor } = params;
    
    // Depth affects fundamental frequency and darkness
    const baseFreq = 40 + depth * 8; // Descend into lower frequencies
    const filterFreq = Math.max(200, 2000 - depth * 150); // Darker over time
    
    // Update drone frequencies (smooth transitions)
    this.drones.forEach((drone, i) => {
      const ratio = [1, 1.5, 2, 2.5][i] || 1;
      const detune = (Math.random() - 0.5) * entropy * 20; // Entropy adds detuning
      drone.frequency.linearRampToValueAtTime(
        baseFreq * ratio,
        now + 0.5
      );
      drone.detune.linearRampToValueAtTime(detune, now + 0.5);
    });
    
    // Update filter (darkness)
    if (this.filter) {
      this.filter.frequency.linearRampToValueAtTime(filterFreq, now + 0.5);
      this.filter.Q.linearRampToValueAtTime(1 + entropy * 3, now + 0.5);
    }
    
    // Update distortion (chaos and decay)
    const distortionAmount = (1 - decayFactor) * 100 + chaos * 50;
    if (this.distortion) {
      const newCurve = this.makeDistortionCurve(distortionAmount);
      // @ts-ignore - TypeScript strict mode issue with WaveShaperNode curve type
      this.distortion.curve = newCurve;
    }
    
    // Update grain texture (glitchy when high entropy)
    if (this.grainGain) {
      const grainVolume = entropy * 0.1; // Very subtle
      this.grainGain.gain.linearRampToValueAtTime(grainVolume, now + 0.5);
    }
    
    if (this.grainSource && this.grainFilter) {
      const grainFreq = 200 + depth * 50 + Math.random() * 200 * entropy;
      this.grainSource.frequency.linearRampToValueAtTime(grainFreq, now + 0.1);
      this.grainFilter.frequency.linearRampToValueAtTime(
        500 + entropy * 1500,
        now + 0.5
      );
    }
  }

  /**
   * Set master volume.
   */
  setVolume(volume: number): void {
    if (!this.masterGain) return;
    this.masterGain.gain.linearRampToValueAtTime(
      volume,
      this.context!.currentTime + 0.1
    );
  }

  /**
   * Create drone oscillators (sustained tones).
   */
  private createDrones(): void {
    if (!this.context || !this.filter) return;
    
    const voiceCount = 4;
    const now = this.context.currentTime;
    
    for (let i = 0; i < voiceCount; i++) {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      // Different waveforms for richness
      osc.type = ['sine', 'triangle', 'sawtooth', 'sine'][i] as OscillatorType;
      osc.frequency.value = 40 * (i + 1);
      
      // Very subtle individual volumes
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.15 / voiceCount, now + 2 + i * 0.5);
      
      osc.connect(gain);
      gain.connect(this.filter);
      
      osc.start(now);
      
      this.drones.push(osc);
      this.droneGains.push(gain);
    }
  }

  /**
   * Create granular texture (glitchy, high-frequency texture).
   */
  private createGranularTexture(): void {
    if (!this.context || !this.filter) return;
    
    const now = this.context.currentTime;
    
    // High-frequency noise-like oscillator
    this.grainSource = this.context.createOscillator();
    this.grainSource.type = 'square';
    this.grainSource.frequency.value = 200;
    
    // Grain filter (bandpass for texture)
    this.grainFilter = this.context.createBiquadFilter();
    this.grainFilter.type = 'bandpass';
    this.grainFilter.frequency.value = 1000;
    this.grainFilter.Q.value = 10;
    
    // Grain gain (starts silent)
    this.grainGain = this.context.createGain();
    this.grainGain.gain.value = 0;
    
    this.grainSource.connect(this.grainFilter);
    this.grainFilter.connect(this.grainGain);
    this.grainGain.connect(this.filter);
    
    this.grainSource.start(now);
  }

  /**
   * Create distortion curve for WaveShaper.
   */
  private makeDistortionCurve(amount: number): Float32Array {
    const samples = 44100;
    const buffer = new ArrayBuffer(samples * 4);
    const curve = new Float32Array(buffer);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    
    return curve;
  }

  /**
   * Cleanup audio resources.
   */
  dispose(): void {
    this.stop();
    
    if (this.context) {
      this.context.close();
      this.context = null;
    }
  }
}
