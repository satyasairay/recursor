import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Crown, Sparkles, ArrowLeft } from 'lucide-react';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';

const features = [
  {
    name: 'Premium Exports',
    description: 'HD visuals and animated fractals',
    icon: '🎨',
  },
  {
    name: 'Deep Insight Reports',
    description: 'Advanced behavior clustering and timeline analysis',
    icon: '📊',
  },
  {
    name: 'Archetype Unlocks',
    description: 'Personalized meaning and cognitive pattern analysis',
    icon: '🧬',
  },
  {
    name: 'Constellation Archive',
    description: 'Permanent storage of all recursion sessions',
    icon: '💾',
  },
  {
    name: 'Pro Mode',
    description: 'Save and explore multiple recursion paths',
    icon: '🔀',
  },
];

const Upgrade = () => {
  const navigate = useNavigate();
  const { isPremium } = usePremiumStatus();

  return (
    <div className="min-h-screen p-8">
      <motion.div
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="mb-6 font-mono"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center gap-2 mb-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="w-8 h-8 text-purple-400" />
              <h1 className="text-4xl font-bold text-glow">Premium Access</h1>
              <Sparkles className="w-8 h-8 text-pink-400" />
            </motion.div>
            <p className="text-muted-foreground font-mono text-sm">
              Unlock deeper exploration without the cringe
            </p>
          </div>
        </div>

        {/* Pricing Card */}
        <Card className="relative overflow-hidden p-8 mb-8 bg-card/50 backdrop-blur-sm border-purple-500/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 blur-3xl" />

          <div className="relative">
            {isPremium ? (
              <div className="text-center py-8">
                <Crown className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">You're Premium!</h2>
                <p className="text-muted-foreground font-mono">
                  Enjoy all the deep exploration features
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="text-5xl font-bold mb-2">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                      $9.99
                    </span>
                    <span className="text-2xl text-muted-foreground font-normal">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    Cancel anytime • No hidden fees
                  </p>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-mono text-lg mb-8"
                  onClick={() => {
                    // TODO: Integrate with payment provider
                    console.log('Upgrade to premium');
                  }}
                >
                  Unlock Deeper Exploration
                </Button>
              </>
            )}

            {/* Features Grid */}
            <div className="grid gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  className="flex items-start gap-3 p-4 rounded-lg bg-background/50 border border-border/50"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="text-2xl">{feature.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Check className="w-4 h-4 text-primary" />
                      <h3 className="font-bold">{feature.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>

        {/* Philosophy */}
        <motion.div
          className="text-center text-sm text-muted-foreground font-mono space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>No ads. No forced subscriptions. No popups. No dopamine loops.</p>
          <p className="text-xs">
            Just thoughtful features for those who want to go deeper.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Upgrade;
