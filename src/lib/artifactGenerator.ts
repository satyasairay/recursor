import { MemoryNode, RecursionSession } from './types';

export type ArtifactType = 'constellation' | 'depth-map' | 'pattern-timeline' | 'decay-rings';

interface ArtifactConfig {
  width: number;
  height: number;
  theme: 'dark' | 'light';
}

const THEMES = {
  dark: {
    background: '#0A0A0B',
    primary: '#9b87f5',
    secondary: '#7E69AB',
    muted: '#6E59A5',
    text: '#F1F0FB',
    accent: '#D946EF',
  },
  light: {
    background: '#FFFFFF',
    primary: '#7E69AB',
    secondary: '#9b87f5',
    muted: '#D3D3E8',
    text: '#1A1F2C',
    accent: '#D946EF',
  },
};

export class ArtifactGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: ArtifactConfig;

  constructor(config: Partial<ArtifactConfig> = {}) {
    this.config = {
      width: config.width || 1200,
      height: config.height || 800,
      theme: config.theme || 'dark',
    };

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    this.ctx = this.canvas.getContext('2d')!;
  }

  private get theme() {
    return THEMES[this.config.theme];
  }

  private clear() {
    this.ctx.fillStyle = this.theme.background;
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);
  }

  generateConstellation(nodes: MemoryNode[]): HTMLCanvasElement {
    this.clear();
    
    if (nodes.length === 0) {
      this.drawEmptyState('No memories to visualize');
      return this.canvas;
    }

    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    const maxRadius = Math.min(this.config.width, this.config.height) * 0.4;

    // Position nodes in a radial layout (deterministic)
    const positions = nodes.map((node, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      // Deterministic distance based on node signature (no Math.random)
      const seed = node.patternSignature.split('-').reduce((sum, val) => sum + parseInt(val, 10), 0);
      const distanceFactor = 0.5 + (seed % 50) / 100; // Range: [0.5, 1.0]
      const distance = maxRadius * distanceFactor;
      return {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        node,
      };
    });

    // Draw connections
    this.ctx.strokeStyle = this.theme.muted + '40';
    this.ctx.lineWidth = 1;
    positions.forEach((pos, i) => {
      pos.node.connections.forEach(connIdx => {
        if (connIdx < positions.length) {
          const target = positions[connIdx];
          this.ctx.beginPath();
          this.ctx.moveTo(pos.x, pos.y);
          this.ctx.lineTo(target.x, target.y);
          this.ctx.stroke();
        }
      });
    });

    // Draw nodes
    positions.forEach(({ x, y, node }) => {
      const size = 3 + node.weight * 15;
      const age = Date.now() - node.lastAccessed;
      const brightness = Math.max(0.3, 1 - age / (1000 * 60 * 60 * 24 * 30));

      // Glow
      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size * 2);
      gradient.addColorStop(0, this.theme.primary + Math.floor(brightness * 255).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, this.theme.primary + '00');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x - size * 2, y - size * 2, size * 4, size * 4);

      // Node
      this.ctx.fillStyle = this.theme.primary;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Add title
    this.drawTitle('Memory Constellation', nodes.length);

    return this.canvas;
  }

  generateDepthMap(sessions: RecursionSession[]): HTMLCanvasElement {
    this.clear();

    if (sessions.length === 0) {
      this.drawEmptyState('No sessions recorded');
      return this.canvas;
    }

    const maxDepth = Math.max(...sessions.map(s => s.depth), 1); // Ensure at least 1
    const padding = 60;
    const chartWidth = this.config.width - padding * 2;
    const chartHeight = this.config.height - padding * 2;

    // Draw axes
    this.ctx.strokeStyle = this.theme.text + '40';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(padding, padding);
    this.ctx.lineTo(padding, this.config.height - padding);
    this.ctx.lineTo(this.config.width - padding, this.config.height - padding);
    this.ctx.stroke();

    // Draw depth bars
    const barWidth = Math.min(chartWidth / sessions.length, 40);
    const spacing = chartWidth / sessions.length;

    sessions.forEach((session, i) => {
      const x = padding + i * spacing + (spacing - barWidth) / 2;
      const height = Math.max(1, (session.depth / maxDepth) * chartHeight);
      const y = this.config.height - padding - height;

      // Validate coordinates are finite
      if (!isFinite(x) || !isFinite(y) || !isFinite(height)) {
        return;
      }

      // Bar gradient
      const gradient = this.ctx.createLinearGradient(x, y, x, this.config.height - padding);
      gradient.addColorStop(0, this.theme.accent);
      gradient.addColorStop(1, this.theme.primary);
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x, y, barWidth, height);

      // Glow
      this.ctx.shadowColor = this.theme.primary;
      this.ctx.shadowBlur = 10;
      this.ctx.fillRect(x, y, barWidth, height);
      this.ctx.shadowBlur = 0;
    });

    // Labels
    this.ctx.fillStyle = this.theme.text;
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Sessions', this.config.width / 2, this.config.height - 20);
    this.ctx.save();
    this.ctx.translate(20, this.config.height / 2);
    this.ctx.rotate(-Math.PI / 2);
    this.ctx.fillText('Depth', 0, 0);
    this.ctx.restore();

    this.drawTitle('Depth Journey', sessions.length);

    return this.canvas;
  }

  generatePatternTimeline(nodes: MemoryNode[]): HTMLCanvasElement {
    this.clear();

    if (nodes.length === 0) {
      this.drawEmptyState('No pattern history');
      return this.canvas;
    }

    const sortedNodes = [...nodes].sort((a, b) => a.timestamp - b.timestamp);
    const padding = 60;
    const chartHeight = this.config.height - padding * 2;
    const spacing = (this.config.width - padding * 2) / (sortedNodes.length - 1 || 1);

    // Draw timeline
    this.ctx.strokeStyle = this.theme.muted;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(padding, this.config.height / 2);
    this.ctx.lineTo(this.config.width - padding, this.config.height / 2);
    this.ctx.stroke();

    // Draw pattern evolution
    sortedNodes.forEach((node, i) => {
      const x = padding + i * spacing;
      const y = this.config.height / 2;
      
      // Pattern signature visualization
      const patternHash = node.patternSignature.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const offset = ((patternHash % 100) - 50) * 2;
      const nodeY = y + offset;

      // Connection line
      if (i > 0) {
        const prevX = padding + (i - 1) * spacing;
        const prevNode = sortedNodes[i - 1];
        const prevHash = prevNode.patternSignature.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const prevOffset = ((prevHash % 100) - 50) * 2;
        const prevY = y + prevOffset;

        const gradient = this.ctx.createLinearGradient(prevX, prevY, x, nodeY);
        gradient.addColorStop(0, this.theme.primary);
        gradient.addColorStop(1, this.theme.secondary);
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(prevX, prevY);
        this.ctx.lineTo(x, nodeY);
        this.ctx.stroke();
      }

      // Node point
      const size = 4 + node.weight * 8;
      this.ctx.fillStyle = this.theme.accent;
      this.ctx.beginPath();
      this.ctx.arc(x, nodeY, size, 0, Math.PI * 2);
      this.ctx.fill();

      // Glow
      this.ctx.shadowColor = this.theme.accent;
      this.ctx.shadowBlur = 15;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });

    this.drawTitle('Pattern Evolution', sortedNodes.length);

    return this.canvas;
  }

  generateDecayRings(nodes: MemoryNode[]): HTMLCanvasElement {
    this.clear();

    if (nodes.length === 0) {
      this.drawEmptyState('No decay data');
      return this.canvas;
    }

    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    const maxRadius = Math.min(this.config.width, this.config.height) * 0.45;

    // Group nodes by age brackets
    const now = Date.now();
    const ageGroups = [
      { max: 24 * 60 * 60 * 1000, label: '24h', nodes: [] as MemoryNode[] },
      { max: 7 * 24 * 60 * 60 * 1000, label: '7d', nodes: [] as MemoryNode[] },
      { max: 30 * 24 * 60 * 60 * 1000, label: '30d', nodes: [] as MemoryNode[] },
      { max: Infinity, label: '30d+', nodes: [] as MemoryNode[] },
    ];

    nodes.forEach(node => {
      const age = now - node.lastAccessed;
      const group = ageGroups.find(g => age < g.max);
      if (group) group.nodes.push(node);
    });

    // Draw rings
    ageGroups.forEach((group, i) => {
      const radius = maxRadius * ((i + 1) / ageGroups.length);
      const avgWeight = group.nodes.reduce((sum, n) => sum + n.weight, 0) / (group.nodes.length || 1);
      const opacity = Math.floor(avgWeight * 255);

      // Ring
      this.ctx.strokeStyle = this.theme.primary + opacity.toString(16).padStart(2, '0');
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.stroke();

      // Fill
      this.ctx.fillStyle = this.theme.primary + Math.floor(opacity * 0.1).toString(16).padStart(2, '0');
      this.ctx.fill();

      // Label
      this.ctx.fillStyle = this.theme.text;
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        `${group.label} (${group.nodes.length})`,
        centerX,
        centerY - radius + 20
      );
    });

    this.drawTitle('Memory Decay', nodes.length);

    return this.canvas;
  }

  private drawTitle(title: string, count: number) {
    this.ctx.fillStyle = this.theme.text;
    this.ctx.font = 'bold 24px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(title, this.config.width / 2, 35);

    this.ctx.font = '14px monospace';
    this.ctx.fillStyle = this.theme.text + '80';
    this.ctx.fillText(`${count} data points`, this.config.width / 2, 55);
  }

  private drawEmptyState(message: string) {
    this.ctx.fillStyle = this.theme.text + '40';
    this.ctx.font = '20px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(message, this.config.width / 2, this.config.height / 2);
  }

  exportToPNG(): string {
    return this.canvas.toDataURL('image/png');
  }

  exportToSVG(type: ArtifactType, data: any): string {
    // Simplified SVG export - could be enhanced
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${this.config.width}" height="${this.config.height}">
        <rect width="100%" height="100%" fill="${this.theme.background}"/>
        <text x="50%" y="50%" text-anchor="middle" fill="${this.theme.text}" font-family="monospace" font-size="20">
          ${type.toUpperCase()} - Export to Canvas for full visualization
        </text>
      </svg>
    `;
    return svg;
  }

  // Animated constellation with rotation
  generateAnimatedConstellation(
    nodes: MemoryNode[],
    frameCount: number = 60,
    onProgress?: (frame: number) => void
  ): string[] {
    const frames: string[] = [];
    
    for (let frame = 0; frame < frameCount; frame++) {
      this.clear();
      
      if (nodes.length === 0) {
        this.drawEmptyState('No memories to visualize');
        frames.push(this.canvas.toDataURL('image/png'));
        continue;
      }

      const centerX = this.config.width / 2;
      const centerY = this.config.height / 2;
      const maxRadius = Math.min(this.config.width, this.config.height) * 0.4;
      const rotation = (frame / frameCount) * Math.PI * 2;

      // Position nodes with rotation (deterministic)
      const positions = nodes.map((node, i) => {
        const angle = (i / nodes.length) * Math.PI * 2 + rotation;
        // Deterministic distance based on node signature (no Math.random)
        const seed = node.patternSignature.split('-').reduce((sum, val) => sum + parseInt(val, 10), 0);
        const distanceFactor = 0.5 + (seed % 50) / 100; // Range: [0.5, 1.0]
        const distance = maxRadius * distanceFactor;
        return {
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          node,
        };
      });

      // Draw pulsing connections
      this.ctx.strokeStyle = this.theme.muted + '40';
      this.ctx.lineWidth = 1 + Math.sin(frame / 10) * 0.5;
      positions.forEach((pos) => {
        pos.node.connections.forEach(connIdx => {
          if (connIdx < positions.length) {
            const target = positions[connIdx];
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
            this.ctx.lineTo(target.x, target.y);
            this.ctx.stroke();
          }
        });
      });

      // Draw pulsing nodes
      positions.forEach(({ x, y, node }) => {
        const size = (3 + node.weight * 15) * (1 + Math.sin(frame / 15) * 0.2);
        const age = Date.now() - node.lastAccessed;
        const brightness = Math.max(0.3, 1 - age / (1000 * 60 * 60 * 24 * 30));

        // Animated glow
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size * 3);
        gradient.addColorStop(0, this.theme.primary + Math.floor(brightness * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, this.theme.primary + '00');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x - size * 3, y - size * 3, size * 6, size * 6);

        // Node
        this.ctx.fillStyle = this.theme.primary;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
      });

      this.drawTitle('Memory Constellation', nodes.length);
      frames.push(this.canvas.toDataURL('image/png'));
      
      if (onProgress) onProgress(frame);
    }
    
    return frames;
  }

  download(filename: string, format: 'png' | 'svg', svgContent?: string) {
    const link = document.createElement('a');
    
    if (format === 'png') {
      link.href = this.exportToPNG();
      link.download = `${filename}.png`;
    } else {
      const blob = new Blob([svgContent || ''], { type: 'image/svg+xml' });
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.svg`;
    }
    
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
