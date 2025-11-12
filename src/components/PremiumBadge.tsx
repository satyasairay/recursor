import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';

export const PremiumBadge = () => {
  return (
    <motion.div
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Crown className="w-3 h-3 text-purple-400" />
      <span className="text-xs font-mono text-purple-300">PREMIUM</span>
    </motion.div>
  );
};
