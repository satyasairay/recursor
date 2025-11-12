import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Brain, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { submitAnonymousData, getArchetypeStats, ArchetypeResult, ArchetypeInfo } from '@/lib/archetypeEngine';
import { toast } from 'sonner';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { PremiumGate } from './PremiumGate';
import { PremiumBadge } from './PremiumBadge';

export const ArchetypeInsight = () => {
  const [userArchetype, setUserArchetype] = useState<ArchetypeResult | null>(null);
  const [archetypeStats, setArchetypeStats] = useState<ArchetypeInfo[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { isPremium } = usePremiumStatus();

  useEffect(() => {
    loadArchetypeStats();
  }, []);

  const loadArchetypeStats = async () => {
    const stats = await getArchetypeStats();
    if (stats) {
      setArchetypeStats(stats.archetypes);
      setTotalSessions(stats.totalSessions);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const result = await submitAnonymousData();
      if (result) {
        setUserArchetype(result);
        setHasSubmitted(true);
        toast.success('Your cognitive archetype has been revealed');
        await loadArchetypeStats(); // Refresh stats
      } else {
        toast.error('Not enough data to determine archetype. Continue your recursive journey.');
      }
    } catch (error) {
      console.error('Error submitting archetype:', error);
      toast.error('Failed to analyze archetype');
    } finally {
      setIsLoading(false);
    }
  };

  const getArchetypeIcon = (name: string) => {
    switch (name) {
      case 'Diver': return '🏊';
      case 'Cycler': return '🔄';
      case 'Explorer': return '🗺️';
      case 'Repeater': return '📻';
      case 'Drifter': return '🌊';
      default: return '🧠';
    }
  };

  const getArchetypeColor = (name: string) => {
    switch (name) {
      case 'Diver': return 'from-blue-500 to-cyan-500';
      case 'Cycler': return 'from-purple-500 to-pink-500';
      case 'Explorer': return 'from-green-500 to-emerald-500';
      case 'Repeater': return 'from-orange-500 to-yellow-500';
      case 'Drifter': return 'from-indigo-500 to-violet-500';
      default: return 'from-primary to-purple-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Cognitive Archetype Analysis
          </h2>
          <p className="text-sm text-muted-foreground font-mono">
            Anonymous comparison with {totalSessions.toLocaleString()} recursive journeys
          </p>
        </div>
        {isPremium && <PremiumBadge />}
      </div>

      {/* Submit Section */}
      {!hasSubmitted && (
        <Card className="p-6 recursive-border bg-card/50 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Discover Your Cognitive Archetype
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your patterns will be analyzed anonymously and compared against the collective.
                No personal data is stored—only pattern signatures.
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="font-mono"
            >
              {isLoading ? 'Analyzing...' : 'Reveal My Archetype'}
            </Button>
          </div>
        </Card>
      )}

      {/* User Archetype Result - Premium Gated */}
      {userArchetype && !isPremium && (
        <PremiumGate
          feature="Deep Archetype Analysis"
          description="Unlock personalized cognitive insights, trait breakdown, and behavioral patterns unique to your archetype."
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className={`p-6 recursive-border bg-gradient-to-br ${getArchetypeColor(userArchetype.archetype)} text-white relative overflow-hidden`}>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">{getArchetypeIcon(userArchetype.archetype)}</div>
                  <div>
                    <h3 className="text-2xl font-bold">The {userArchetype.archetype}</h3>
                    <p className="text-white/80 font-mono text-sm">
                      You think like {userArchetype.percentile}% of all users
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono">Rarity</span>
                    <span className="font-bold">{userArchetype.percentile}%</span>
                  </div>
                  <Progress value={userArchetype.percentile} className="h-2 bg-white/20" />
                </div>
              </div>

              <motion.div
                className="absolute inset-0 bg-white/5"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </Card>
          </motion.div>
        </PremiumGate>
      )}

      {/* User Archetype Result - Premium Users */}
      {userArchetype && isPremium && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className={`p-6 recursive-border bg-gradient-to-br ${getArchetypeColor(userArchetype.archetype)} text-white relative overflow-hidden`}>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl">{getArchetypeIcon(userArchetype.archetype)}</div>
                <div>
                  <h3 className="text-2xl font-bold">The {userArchetype.archetype}</h3>
                  <p className="text-white/80 font-mono text-sm">
                    You think like {userArchetype.percentile}% of all users
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono">Rarity</span>
                  <span className="font-bold">{userArchetype.percentile}%</span>
                </div>
                <Progress value={userArchetype.percentile} className="h-2 bg-white/20" />
              </div>
            </div>

            <motion.div
              className="absolute inset-0 bg-white/5"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </Card>
        </motion.div>
      )}

      {/* Global Archetype Distribution */}
      {archetypeStats.length > 0 && (
        <Card className="p-6 recursive-border bg-card/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Global Distribution</h3>
          </div>

          <div className="space-y-4">
            {archetypeStats.map((archetype) => (
              <motion.div
                key={archetype.name}
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getArchetypeIcon(archetype.name)}</span>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {archetype.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {archetype.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-primary">
                      {archetype.percentage}%
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {archetype.count} users
                    </div>
                  </div>
                </div>
                <Progress value={archetype.percentage} className="h-1.5" />
              </motion.div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Sessions Analyzed
              </span>
              <span className="font-bold text-primary">
                {totalSessions.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Privacy Notice */}
      <div className="text-xs text-muted-foreground text-center font-mono p-4 recursive-border rounded-lg bg-card/20">
        🔒 Privacy-first: Only anonymous pattern signatures are collected.
        No identifying information is stored or transmitted.
      </div>
    </div>
  );
};
