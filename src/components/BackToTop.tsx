import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Find the main scrollable container. 
      // If we are scrolling the window, use window.scrollY.
      // In this app, App.tsx has a main container.
      const scrollable = document.querySelector('main') || document.documentElement;
      if (scrollable.scrollTop > 300 || window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    const scrollable = document.querySelector('main') || window;
    scrollable.addEventListener('scroll', handleScroll);
    return () => scrollable.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const scrollable = document.querySelector('main') || window;
    scrollable.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-24 right-4 z-50 p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg transition-all active:scale-90"
      aria-label="Retour en haut"
    >
      <ChevronUp className="w-6 h-6" />
    </button>
  );
}
