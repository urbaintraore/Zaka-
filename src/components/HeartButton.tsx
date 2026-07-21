import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';

interface HeartButtonProps {
  isFavorite: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export function HeartButton({ isFavorite, onClick }: HeartButtonProps) {
  const [showAnim, setShowAnim] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isFavorite) {
      // Trigger floating heart animation
      setShowAnim(true);
      setTimeout(() => setShowAnim(false), 1000);
    }
    onClick(e);
  };

  return (
    <div className="relative inline-block">
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-colors text-white flex items-center justify-center relative overflow-visible cursor-pointer"
        title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        <motion.div
          animate={isFavorite ? { scale: [1, 1.4, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-white"}`} 
          />
        </motion.div>

        {/* Burst small particles when favorited */}
        <AnimatePresence>
          {isFavorite && showAnim && (
            <>
              {[...Array(6)].map((_, i) => {
                const angle = (i * 360) / 6;
                const distance = 24;
                const radians = (angle * Math.PI) / 180;
                const x = Math.cos(radians) * distance;
                const y = Math.sin(radians) * distance;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                    animate={{ opacity: 0, scale: 1.2, x, y }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute text-[8px] text-red-500 pointer-events-none"
                    style={{ left: '50%', top: '50%', marginLeft: '-4px', marginTop: '-4px' }}
                  >
                    ❤️
                  </motion.div>
                );
              })}
            </>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Floating big heart animation */}
      <AnimatePresence>
        {showAnim && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 0, rotate: -15 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.8, 1.5, 1], y: -50, rotate: [15, -15, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, times: [0, 0.2, 0.7, 1] }}
            className="absolute pointer-events-none text-2xl select-none"
            style={{ left: '15%', top: '-30px', zIndex: 50 }}
          >
            ❤️
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
