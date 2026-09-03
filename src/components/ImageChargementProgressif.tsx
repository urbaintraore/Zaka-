import React, { useState } from 'react';
import { ImageOff, Sparkles } from 'lucide-react';

interface ImageChargementProgressifProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackIcon?: React.ReactNode;
  fallbackText?: string;
  aspectRatio?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  title?: string;
}

/**
 * ImageChargementProgressif component
 * Implements native lazy-loading (loading="lazy"), smooth blur-up effect,
 * placeholder skeleton, and graceful error fallback.
 */
export function ImageChargementProgressif({
  src,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = '',
  fallbackIcon,
  fallbackText,
  aspectRatio,
  onClick,
  title
}: ImageChargementProgressifProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Derive initial placeholder background style
  const placeholderGradient = 'bg-gradient-to-tr from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-750 dark:to-gray-800';

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden ${placeholderGradient} ${aspectRatio || ''} ${containerClassName}`}
      title={title || alt}
    >
      {/* Blurred Low-Fi Placeholder / Skeleton while loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 z-0 flex items-center justify-center animate-pulse bg-gradient-to-r from-orange-100/40 via-amber-50/60 to-orange-100/40 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800">
          <div className="flex flex-col items-center gap-1.5 text-orange-400/60 dark:text-gray-600">
            <Sparkles className="w-5 h-5 animate-spin" />
            <span className="text-[10px] font-semibold tracking-wider uppercase">Chargement...</span>
          </div>
        </div>
      )}

      {/* Fallback Display if image fails to load */}
      {hasError ? (
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center p-3 text-center bg-gray-150 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          {fallbackIcon || <ImageOff className="w-6 h-6 text-gray-400 mb-1" />}
          <span className="text-xs font-bold line-clamp-1">{fallbackText || alt || 'Image non disponible'}</span>
        </div>
      ) : (
        /* Progressive Image Element with blur-up animation and lazy loading */
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`
            ${className}
            transition-all duration-700 ease-out transform
            ${isLoaded ? 'opacity-100 filter-none scale-100' : 'opacity-0 filter blur-md scale-105'}
          `}
        />
      )}
    </div>
  );
}

export default ImageChargementProgressif;
