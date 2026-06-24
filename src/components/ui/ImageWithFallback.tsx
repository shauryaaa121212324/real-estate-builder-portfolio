import { useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fallback?: string;
  /** Placeholder color while image loads. Default: bg-[#F8F6F1]/5 */
  placeholderColor?: string;
  className?: string;
  /** Callback when image loads successfully */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Show shimmer animation while loading. Default: true */
  showShimmer?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Image component with fallback support, loading state, and error handling.
 * Handles missing images gracefully with:
 * - Fallback image if primary fails
 * - Loading shimmer animation
 * - Lazy loading
 * - Proper error callbacks
 *
 * Usage:
 * ```tsx
 * <ImageWithFallback
 *   src="/images/project.jpg"
 *   fallback="/images/fallback.jpg"
 *   alt="Project cover"
 *   className="w-full h-full object-cover"
 * />
 * ```
 */
export function ImageWithFallback({
  src,
  alt,
  fallback = '/images/fallback.jpg',
  placeholderColor = 'bg-[#F8F6F1]/5',
  className = '',
  onLoad,
  onError,
  showShimmer = true,
}: ImageWithFallbackProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    // If we haven't tried the fallback yet, try it
    if (currentSrc === src && fallback && fallback !== src) {
      setCurrentSrc(fallback);
      return;
    }

    // If fallback also failed, mark as error
    setHasError(true);
    onError?.();
  }, [src, fallback, currentSrc]);

  // If image failed and no fallback available, render placeholder
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-[#1C1A15] ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="text-xs uppercase tracking-wider text-[#F8F6F1]/25">
          Image unavailable
        </span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Shimmer placeholder */}
      {!isLoaded && showShimmer && (
        <div
          className={`absolute inset-0 animate-pulse ${placeholderColor}`}
          aria-hidden="true"
        />
      )}

      {/* Image */}
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-700 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
      />
    </div>
  );
}

export default ImageWithFallback;