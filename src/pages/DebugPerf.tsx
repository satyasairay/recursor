import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useNarrativeState } from '@/hooks/useNarrativeState';
import { ArrowLeft, Play, Pause, Camera, Download } from 'lucide-react';

export default function DebugPerf() {
  const navigate = useNavigate();
  const narrative = useNarrativeState();
  
  const [isLive, setIsLive] = useState(false);
  
  const { metrics, history, isPaused, toggleLive, snapshot, exportData } = usePerformanceMonitor({
    depth: narrative.depth,
    entropy: narrative.glitchIntensity,
    chaos: narrative.vortexStage,
    isLive,
  });

  const fpsCanvasRef = useRef<HTMLCanvasElement>(null);
  const memoryCanvasRef = useRef<HTMLCanvasElement>(null);
  const depthCanvasRef = useRef<HTMLCanvasElement>(null);

  // Draw FPS meter
  useEffect(() => {
    const canvas = fpsCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const fps = metrics.fps;
    const targetFps = 60;
    const barWidth = (fps / targetFps) * width;

    ctx.clearRect(0, 0, width, height);

    // Target line
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width, 0);
    ctx.lineTo(width, height);
    ctx.stroke();

    // FPS bar
    const color = fps > 50 ? 'rgba(34, 197, 94' : fps > 30 ? 'rgba(234, 179, 8' : 'rgba(239, 68, 68';
    ctx.fillStyle = `${color}, 0.6)`;
    ctx.fillRect(0, 0, barWidth, height);

    // Glow effect
    ctx.fillStyle = `${color}, 0.2)`;
    ctx.fillRect(0, 0, Math.min(barWidth + 20, width), height);

    // FPS text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${fps.toFixed(1)} FPS`, 10, height / 2 + 5);
  }, [metrics.fps]);

  // Draw memory graph
  useEffect(() => {
    const canvas = memoryCanvasRef.current;
    if (!canvas || history.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const maxHeap = Math.max(...history.map(h => h.heapLimit), 1);

    ctx.clearRect(0, 0, width, height);

    // Draw area chart
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.6)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)');

    ctx.beginPath();
    ctx.moveTo(0, height);

    history.forEach((h, i) => {
      const x = (i / (history.length - 1)) * width;
      const y = height - (h.heapUsed / maxHeap) * height;
      ctx.lineTo(x, y);
    });

    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((h, i) => {
      const x = (i / (history.length - 1)) * width;
      const y = height - (h.heapUsed / maxHeap) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Memory text
    const memorySupported = metrics.heapLimit > 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    if (memorySupported) {
      ctx.fillText(`${metrics.heapUsed.toFixed(1)} / ${metrics.heapLimit.toFixed(1)} MB`, 10, 20);
      ctx.fillText(`${((metrics.heapUsed / metrics.heapLimit) * 100).toFixed(1)}%`, 10, 38);
    } else {
      ctx.fillText('Memory API N/A', 10, 20);
    }
  }, [history, metrics.heapUsed, metrics.heapLimit]);

  // Draw depth vs frame time
  useEffect(() => {
    const canvas = depthCanvasRef.current;
    if (!canvas || history.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const maxDepth = Math.max(...history.map(h => h.depth), 1);
    const maxFrameTime = Math.max(...history.map(h => h.avgFrameTime), 33);

    ctx.clearRect(0, 0, width, height);

    // Depth line (blue)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((h, i) => {
      const x = (i / (history.length - 1)) * width;
      const y = height - (h.depth / maxDepth) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Frame time line (orange, inverted)
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((h, i) => {
      const x = (i / (history.length - 1)) * width;
      const y = (h.avgFrameTime / maxFrameTime) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Labels
    ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Depth: ${metrics.depth}`, 10, 15);

    ctx.fillStyle = 'rgba(251, 146, 60, 0.9)';
    ctx.textAlign = 'right';
    ctx.fillText(`Frame: ${metrics.avgFrameTime.toFixed(2)}ms`, width - 10, 15);
  }, [history, metrics.depth, metrics.avgFrameTime]);

  const handleToggleLive = () => {
    setIsLive(!isLive);
    toggleLive();
  };

  const handleSnapshot = () => {
    snapshot();
    setIsLive(false);
  };

  const isCollecting = history.length < 10;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="sm"
              className="font-mono text-xs"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="font-mono text-2xl sm:text-3xl text-foreground">
              /debug/perf
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleToggleLive}
              variant={isLive ? 'default' : 'outline'}
              size="sm"
              className="font-mono text-xs"
            >
              {isLive ? <Pause className="w-3 h-3 mr-2" /> : <Play className="w-3 h-3 mr-2" />}
              {isLive ? 'LIVE' : 'PAUSED'}
            </Button>
            <Button
              onClick={handleSnapshot}
              variant="outline"
              size="sm"
              className="font-mono text-xs"
            >
              <Camera className="w-3 h-3 mr-2" />
              Snapshot
            </Button>
            <Button
              onClick={exportData}
              variant="outline"
              size="sm"
              className="font-mono text-xs"
            >
              <Download className="w-3 h-3 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {isCollecting && (
          <motion.div
            className="text-center text-muted-foreground font-mono text-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Collecting data...
          </motion.div>
        )}

        {/* FPS Meter */}
        <motion.div
          className="backdrop-blur-sm bg-card/30 border border-primary/20 rounded-lg p-6 space-y-2"
          animate={{ opacity: [0.95, 1, 0.95] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            FPS Meter
          </h2>
          <canvas
            ref={fpsCanvasRef}
            width={800}
            height={60}
            className="w-full h-[60px] rounded"
          />
        </motion.div>

        {/* Memory Graph */}
        <motion.div
          className="backdrop-blur-sm bg-card/30 border border-primary/20 rounded-lg p-6 space-y-2"
          animate={{ opacity: [0.95, 1, 0.95] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        >
          <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            Memory & Heap Usage
          </h2>
          <canvas
            ref={memoryCanvasRef}
            width={800}
            height={120}
            className="w-full h-[120px] rounded"
          />
        </motion.div>

        {/* Depth vs Frame Time */}
        <motion.div
          className="backdrop-blur-sm bg-card/30 border border-primary/20 rounded-lg p-6 space-y-2"
          animate={{ opacity: [0.95, 1, 0.95] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        >
          <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            Depth vs Frame Time
          </h2>
          <canvas
            ref={depthCanvasRef}
            width={800}
            height={150}
            className="w-full h-[150px] rounded"
          />
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Depth', value: metrics.depth },
            { label: 'Entropy', value: metrics.entropy.toFixed(2) },
            { label: 'Chaos', value: metrics.chaos.toFixed(2) },
            { label: 'Particles', value: metrics.particleCount },
          ].map((metric, i) => (
            <motion.div
              key={metric.label}
              className="backdrop-blur-sm bg-card/20 border border-primary/10 rounded p-4 text-center"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
            >
              <div className="font-mono text-xs text-muted-foreground">{metric.label}</div>
              <div className="font-mono text-2xl text-foreground mt-1">{metric.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-muted-foreground/60 font-mono text-xs">
          The debugger breathes with recursion itself. {isPaused && '(PAUSED)'}
        </div>
      </div>
    </div>
  );
}
