import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePremiumStatus() {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkPremiumStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkPremiumStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsPremium(false);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_tiers')
        .select('tier')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching premium status:', error);
        setIsPremium(false);
      } else {
        setIsPremium(data?.tier === 'premium');
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { isPremium, isLoading, refresh: checkPremiumStatus };
}
