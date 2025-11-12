import { useEffect, useState, useCallback, useRef } from 'react';

export interface PerfMetrics {
  fps: number;
  avgFrameTime: number; // ms
  heapUsed: number; // MB
  heapLimit: number; // MB
  depth: number;
  entropy: number;
  chaos: number;
  particleCount: number;
  timestamp: number;
}

interface UsePerformanceMonitorOptions {
  depth?: number;
  entropy?: number;
  chaos?: number;
  isLive?: boolean;
}

const ROLLING_BUFFER_SIZE = 300; // 5 seconds at 60fps
const UPDATE_INTERVAL = 500; // 2 Hz (500ms)
const MAX_HISTORY = 60; // 30 seconds of history at 2 Hz

export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const { depth = 0, entropy = 0, chaos = 0, isLive = false } = options;
  
  const [metrics, setMetrics] = useState<PerfMetrics>({
    fps: 0,
    avgFrameTime: 0,
    heapUsed: 0,
    heapLimit: 0,
    depth: 0,
    entropy: 0,
    chaos: 0,
    particleCount: 0,
    timestamp: Date.now(),
  });
  
  const [history, setHistory] = useState<PerfMetrics[]>([]);
  const [isPaused, setIsPaused] = useState(!isLive);
  
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const rafIdRef = useRef<number>();
  const updateIntervalRef = useRef<number>();

  // FPS tracking via RAF
  const trackFrame = useCallback(() => {
    const now = performance.now();
    const delta = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;
    
    frameTimesRef.current.push(delta);
    if (frameTimesRef.current.length > ROLLING_BUFFER_SIZE) {
      frameTimesRef.current.shift();
    }
    
    rafIdRef.current = requestAnimationFrame(trackFrame);
  }, []);

  // Calculate metrics snapshot
  const calculateMetrics = useCallback((): PerfMetrics => {
    // Calculate FPS from frame times
    const frameTimes = frameTimesRef.current;
    const avgFrameTime = frameTimes.length > 0
      ? frameTimes.reduce((sum, t) => sum + t, 0) / frameTimes.length
      : 0;
    const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;

    // Get memory info if available (Chrome only)
    let heapUsed = 0;
    let heapLimit = 0;
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      heapUsed = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
      heapLimit = memory.jsHeapSizeLimit / (1024 * 1024);
    }

    // Estimate particle count based on depth (rough heuristic)
    const particleCount = Math.floor(depth * 15 + Math.random() * 10);

    return {
      fps: Math.round(fps * 10) / 10,
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
      heapUsed: Math.round(heapUsed * 100) / 100,
      heapLimit: Math.round(heapLimit * 100) / 100,
      depth,
      entropy: Math.round(entropy * 100) / 100,
      chaos: Math.round(chaos * 100) / 100,
      particleCount,
      timestamp: Date.now(),
    };
  }, [depth, entropy, chaos]);

  // Update metrics at fixed interval
  const updateMetrics = useCallback(() => {
    if (isPaused) return;
    
    const newMetrics = calculateMetrics();
    setMetrics(newMetrics);
    
    setHistory(prev => {
      const updated = [...prev, newMetrics];
      return updated.slice(-MAX_HISTORY);
    });
  }, [isPaused, calculateMetrics]);

  // Snapshot current state
  const snapshot = useCallback(() => {
    const current = calculateMetrics();
    setMetrics(current);
    setIsPaused(true);
    return current;
  }, [calculateMetrics]);

  // Export data as JSON
  const exportData = useCallback(() => {
    const data = {
      snapshot: metrics,
      history,
      metadata: {
        exportTime: new Date().toISOString(),
        browserInfo: navigator.userAgent,
        memorySupported: 'memory' in performance,
      },
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perf_snapshot_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics, history]);

  // Toggle live mode
  const toggleLive = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // Start/stop RAF tracking
  useEffect(() => {
    rafIdRef.current = requestAnimationFrame(trackFrame);
    
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [trackFrame]);

  // Start/stop update interval
  useEffect(() => {
    if (!isPaused) {
      updateIntervalRef.current = window.setInterval(updateMetrics, UPDATE_INTERVAL);
    }
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isPaused, updateMetrics]);

  // Pause when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {
    metrics,
    history,
    isPaused,
    toggleLive,
    snapshot,
    exportData,
  };
}
