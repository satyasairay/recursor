import { useState, useEffect } from 'react';

const CRYPTIC_MESSAGES = [
  "It remembers.",
  "A pattern reforms.",
  "The echo stirs.",
];

/**
 * Deterministic cryptic messages hook.
 * Shows messages every 3-6 mutations based on pattern signature.
 */
export function useCrypticMessages(mutationCount: number, patternSignature: number) {
  const [message, setMessage] = useState<string | null>(null);
  const [lastTrigger, setLastTrigger] = useState(0);

  useEffect(() => {
    if (mutationCount === 0) return;
    
    // Deterministic threshold: 3-6 based on pattern signature
    const mutationsSinceLastMessage = mutationCount - lastTrigger;
    const threshold = 3 + (patternSignature % 4); // 3, 4, 5, or 6

    if (mutationsSinceLastMessage >= threshold && mutationCount > 0) {
      // Deterministic message selection based on mutation count
      const messageIndex = (mutationCount + patternSignature) % CRYPTIC_MESSAGES.length;
      setMessage(CRYPTIC_MESSAGES[messageIndex]);
      setLastTrigger(mutationCount);

      // Fade out after 1.5 seconds
      const timer = setTimeout(() => {
        setMessage(null);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [mutationCount, lastTrigger, patternSignature]);

  return message;
}
