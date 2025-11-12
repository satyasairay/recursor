import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useNavigate } from 'react-router-dom';

interface PremiumGateProps {
  children: ReactNode;
  feature: string;
  description?: string;
  showUpgrade?: boolean;
}

export const PremiumGate = ({ 
  children, 
  feature, 
  description,
  showUpgrade = true 
}: PremiumGateProps) => {
  const { isPremium, isLoading } = usePremiumStatus();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground font-mono text-sm">
          Loading...
        </div>
      </div>
    );
  }

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Blurred content */}
      <div className="pointer-events-none blur-sm opacity-30">
        {children}
      </div>

      {/* Overlay */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="relative max-w-md p-6 bg-card/95 backdrop-blur-md border-purple-500/30 shadow-lg">
          <div className="absolute -top-3 -right-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-6 h-6 text-purple-400" />
            </motion.div>
          </div>

          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-3 rounded-full bg-purple-500/20 border border-purple-500/30">
              <Lock className="w-6 h-6 text-purple-400" />
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2 text-foreground">
                {feature}
              </h3>
              {description && (
                <p className="text-sm text-muted-foreground font-mono">
                  {description}
                </p>
              )}
            </div>

            {showUpgrade && (
              <Button
                onClick={() => navigate('/upgrade')}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-mono"
              >
                Unlock Deeper Exploration
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
