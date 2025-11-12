import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Image, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArtifactGenerator, ArtifactType } from '@/lib/artifactGenerator';
import { MemoryNode, RecursionSession } from '@/lib/types';
import { toast } from 'sonner';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { PremiumGate } from './PremiumGate';
import { PremiumBadge } from './PremiumBadge';

interface ArtifactExportProps {
  nodes: MemoryNode[];
  sessions: RecursionSession[];
}

export const ArtifactExport = ({ nodes, sessions }: ArtifactExportProps) => {
  const [selectedType, setSelectedType] = useState<ArtifactType>('constellation');
  const [preview, setPreview] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationFrames, setAnimationFrames] = useState<string[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const { isPremium } = usePremiumStatus();

  useEffect(() => {
    generatePreview();
  }, [selectedType, nodes, sessions, theme]);

  // Animate preview for constellation
  useEffect(() => {
    if (selectedType === 'constellation' && animationFrames.length > 0) {
      const interval = setInterval(() => {
        setCurrentFrame(f => (f + 1) % animationFrames.length);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [selectedType, animationFrames]);

  useEffect(() => {
    if (animationFrames.length > 0 && currentFrame < animationFrames.length) {
      setPreview(animationFrames[currentFrame]);
    }
  }, [currentFrame, animationFrames]);

  const generatePreview = () => {
    const generator = new ArtifactGenerator({ 
      width: 800, 
      height: 600,
      theme 
    });

    let canvas: HTMLCanvasElement;
    
    switch (selectedType) {
      case 'constellation':
        // Generate animated preview
        setIsAnimating(true);
        const frames = generator.generateAnimatedConstellation(nodes, 30);
        setAnimationFrames(frames);
        setCurrentFrame(0);
        setIsAnimating(false);
        return;
      case 'depth-map':
        canvas = generator.generateDepthMap(sessions);
        break;
      case 'pattern-timeline':
        canvas = generator.generatePatternTimeline(nodes);
        break;
      case 'decay-rings':
        canvas = generator.generateDecayRings(nodes);
        break;
      default:
        return;
    }

    setPreview(canvas.toDataURL('image/png'));
  };

  const handleExport = (format: 'png' | 'svg') => {
    // HD exports require premium
    const width = isPremium ? 1920 : 800;
    const height = isPremium ? 1080 : 600;
    
    const generator = new ArtifactGenerator({ 
      width, 
      height,
      theme 
    });

    let canvas: HTMLCanvasElement;
    
    switch (selectedType) {
      case 'constellation':
        canvas = generator.generateConstellation(nodes);
        break;
      case 'depth-map':
        canvas = generator.generateDepthMap(sessions);
        break;
      case 'pattern-timeline':
        canvas = generator.generatePatternTimeline(nodes);
        break;
      case 'decay-rings':
        canvas = generator.generateDecayRings(nodes);
        break;
      default:
        return;
    }

    const filename = `recursor-${selectedType}-${Date.now()}`;
    
    if (format === 'svg') {
      const svg = generator.exportToSVG(selectedType, { nodes, sessions });
      generator.download(filename, 'svg', svg);
    } else {
      generator.download(filename, 'png');
    }

    const quality = isPremium ? 'HD' : 'Standard';
    toast.success(`Exported ${selectedType} as ${quality} ${format.toUpperCase()}`);
  };

  const artifactTypes = [
    { id: 'constellation', label: 'Constellation', desc: 'Memory network visualization' },
    { id: 'depth-map', label: 'Depth Map', desc: 'Session depth over time' },
    { id: 'pattern-timeline', label: 'Pattern Timeline', desc: 'Pattern evolution journey' },
    { id: 'decay-rings', label: 'Decay Rings', desc: 'Memory age distribution' },
  ] as const;

  const hasData = nodes.length > 0 || sessions.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Export Artifacts</h2>
          <p className="text-sm text-muted-foreground font-mono">
            Generate visual representations of your recursive journey
          </p>
        </div>
        {isPremium && <PremiumBadge />}
      </div>

      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as ArtifactType)}>
        <TabsList className="grid grid-cols-4 w-full">
          {artifactTypes.map(type => (
            <TabsTrigger key={type.id} value={type.id} className="font-mono text-xs">
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {artifactTypes.map(type => (
          <TabsContent key={type.id} value={type.id}>
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{type.label}</h3>
                <p className="text-sm text-muted-foreground">{type.desc}</p>
              </div>

              {hasData ? (
                <>
                  {/* Preview */}
                  <motion.div
                    className="relative recursive-border rounded-lg overflow-hidden bg-card"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {preview && (
                      <img 
                        src={preview} 
                        alt={`${type.label} preview`}
                        className="w-full h-auto"
                      />
                    )}
                  </motion.div>

                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTheme('dark')}
                        className="font-mono"
                      >
                        Dark
                      </Button>
                      <Button
                        variant={theme === 'light' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTheme('light')}
                        className="font-mono"
                      >
                        Light
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleExport('png')}
                        className="font-mono"
                      >
                        <Image className="w-4 h-4 mr-2" />
                        Export PNG {isPremium && '(HD)'}
                      </Button>
                      <Button
                        onClick={() => handleExport('svg')}
                        variant="outline"
                        className="font-mono"
                      >
                        <FileImage className="w-4 h-4 mr-2" />
                        Export SVG {isPremium && '(HD)'}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center">
                  <Download className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground font-mono">
                    No data available yet. Start your recursive journey to unlock exports.
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
