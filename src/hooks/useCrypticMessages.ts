import { useState, useEffect } from 'react';

const CRYPTIC_MESSAGES = [
  "Something remembers you.",
  "Patterns recur.",
  "The void adjusts.",
  "Memory fades, but not entirely.",
  "You have been here before.",
  "Deeper still.",
  "The constellation shifts.",
  "Time is not linear here.",
  "Your choices echo.",
  "Recursion intensifies.",
  "The pattern recognizes itself.",
  "Entropy increases.",
  "Coherence dissolves.",
  "The system remembers.",
  "Descent continues.",
];

export function useCrypticMessages(mutationCount: number) {
  const [message, setMessage] = useState<string | null>(null);
  const [lastTrigger, setLastTrigger] = useState(0);

  useEffect(() => {
    // Show message every 3-5 mutations
    const mutationsSinceLastMessage = mutationCount - lastTrigger;
    const threshold = 3 + Math.floor(Math.random() * 3); // Random 3-5

    if (mutationsSinceLastMessage >= threshold && mutationCount > 0) {
      // Select random message
      const randomMessage = CRYPTIC_MESSAGES[Math.floor(Math.random() * CRYPTIC_MESSAGES.length)];
      setMessage(randomMessage);
      setLastTrigger(mutationCount);

      // Fade out after 3 seconds
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [mutationCount, lastTrigger]);

  return message;
}
