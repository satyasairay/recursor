import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Welcome back",
          description: "Your recursion memories await...",
        });
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        
        if (error) throw error;
        
        toast({
          title: "Resonance established",
          description: "You can now begin your recursion journey",
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="recursive-border rounded-2xl p-8 bg-background/95 backdrop-blur-xl">
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center gap-2 mb-4"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>
            <h1 className="text-3xl font-bold text-foreground font-mono mb-2">
              {isLogin ? 'RETURN TO RECURSION' : 'BEGIN RECURSION'}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              {isLogin 
                ? 'Your memories persist across depths' 
                : 'Identity enables remembrance'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email resonance pattern"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="font-mono"
                disabled={loading}
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Entropy key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="font-mono"
                minLength={6}
                disabled={loading}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full font-mono"
              disabled={loading}
            >
              {loading ? 'INITIALIZING...' : isLogin ? 'RECONNECT' : 'ESTABLISH'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono"
              disabled={loading}
            >
              {isLogin 
                ? 'New to recursion? Begin journey →' 
                : 'Already resonating? Reconnect →'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-primary/10 text-center">
            <p className="text-xs text-muted-foreground font-mono italic">
              "Depth requires identity — not for access, but remembrance."
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
