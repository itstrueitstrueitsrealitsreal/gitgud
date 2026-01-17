import { useState, useEffect } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number; // milliseconds per character
  enabled?: boolean;
}

export function useTypewriter({ text, speed = 30, enabled = true }: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayedText(text || '');
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, speed);

    return () => clearInterval(typeInterval);
  }, [text, speed, enabled]);

  return { displayedText, isTyping };
}
