import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { Button } from './ui/button';
import { LogOut, User, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { isPremium } = usePremiumStatus();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Recursion paused",
      description: "Your patterns remain in memory",
    });
    navigate('/auth');
  };

  if (!user) {
    return (
      <Button
        onClick={() => navigate('/auth')}
        variant="outline"
        className="font-mono text-xs"
      >
        <User className="w-4 h-4 mr-2" />
        CONNECT
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isPremium && (
        <motion.div
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Crown className="w-3 h-3" />
          PRO
        </motion.div>
      )}
      
      <Button
        onClick={handleSignOut}
        variant="outline"
        size="icon"
        className="font-mono text-xs"
      >
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
};
