/**
 * 🖼️ Dynamic Video Thumbnail Component
 * Displays video frames extracted from backend analysis
 * Falls back to default images if frames are not available
 */

'use client';

import { useState, useEffect } from 'react';
import { Play, Video } from 'lucide-react';

interface DynamicVideoThumbnailProps {
  uploadId?: string;
  videoId?: string;
  className?: string;
  alt?: string;
  fallbackImage?: string;
  showPlayButton?: boolean;
  accountId?: string;
  aspectRatio?: 'auto' | 'video' | 'square' | 'portrait' | 'landscape';
  maxHeight?: string;
  minHeight?: string;
}

export function DynamicVideoThumbnail({
  uploadId,
  videoId,
  className = "w-full object-cover rounded-t-lg",
  alt = "Video thumbnail",
  fallbackImage = "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400",
  showPlayButton = false,
  accountId,
  aspectRatio = 'auto',
  maxHeight = '60vh',
  minHeight = '200px'
}: DynamicVideoThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(fallbackImage);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageNaturalDimensions, setImageNaturalDimensions] = useState<{ width: number; height: number } | null>(null);

  // Calculate dynamic container styles based on aspect ratio
  const getContainerStyles = () => {
    const baseStyles = {
      maxHeight,
      minHeight,
    };

    if (aspectRatio === 'auto' && imageNaturalDimensions) {
      const { width, height } = imageNaturalDimensions;
      const calculatedAspectRatio = width / height;
      
      // For vertical videos (portrait), allow more height
      if (calculatedAspectRatio < 1) {
        return {
          ...baseStyles,
          aspectRatio: `${width} / ${height}`,
          maxHeight: '70vh', // Allow more height for vertical videos
        };
      }
      // For horizontal videos, maintain reasonable bounds
      return {
        ...baseStyles,
        aspectRatio: `${width} / ${height}`,
      };
    }

    // Predefined aspect ratios
    const aspectRatioMap = {
      square: '1 / 1',
      portrait: '3 / 4',
      landscape: '16 / 9',
      video: '16 / 9',
    };

    if (aspectRatio !== 'auto') {
      // Fixed aspect ratio container (prevents dynamic resizing by natural image size)
      return {
        ...baseStyles,
        aspectRatio: aspectRatioMap[aspectRatio] || '16 / 9',
        maxHeight: undefined, // let aspect ratio control height relative to width
        minHeight: undefined,
      } as any;
    }

    return baseStyles;
  };

  useEffect(() => {
    async function loadThumbnail() {
      // If no video identifiers provided, use fallback
      if (!uploadId && !videoId) {
        setThumbnailUrl(fallbackImage);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setHasError(false);

        // Build thumbnail API URL
        const params = new URLSearchParams();
        if (uploadId) params.append('uploadId', uploadId);
        if (videoId) params.append('videoId', videoId);
        if (accountId) params.append('accountId', accountId);

        const apiUrl = `/api/video-analysis/thumbnail${uploadId ? `/${uploadId}` : ''}${params.toString() ? `?${params.toString()}` : ''}`;
        
        console.log(`🖼️ Loading thumbnail: ${apiUrl}`);

        // Try to fetch the dynamic thumbnail
        const response = await fetch(apiUrl, { method: 'HEAD' });
        
        if (response.ok) {
          setThumbnailUrl(apiUrl);
          console.log('✅ Dynamic thumbnail loaded successfully');
        } else {
          console.log(`⚠️ No dynamic thumbnail found (${response.status}), using fallback`);
          setThumbnailUrl(fallbackImage);
        }
      } catch (error) {
        console.error('❌ Error loading dynamic thumbnail:', error);
        setThumbnailUrl(fallbackImage);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadThumbnail();
  }, [uploadId, videoId, accountId, fallbackImage]);

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.target as HTMLImageElement;
    setImageNaturalDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };

  const handleImageError = () => {
    if (thumbnailUrl !== fallbackImage) {
      console.log('⚠️ Thumbnail failed to load, switching to fallback');
      setThumbnailUrl(fallbackImage);
      setHasError(true);
    }
  };

  return (
    <div className="relative overflow-hidden" style={getContainerStyles()}>
      {/* Loading state */}
      {isLoading && (
        <div className={`${className} bg-gray-200 animate-pulse flex items-center justify-center h-full`}>
          <Video className="w-8 h-8 text-gray-400" />
        </div>
      )}
      
      {/* Thumbnail image */}
      {!isLoading && (
        <img
          src={thumbnailUrl}
          alt={alt}
          className={`${className} transition-opacity duration-300 h-full`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
          style={{ 
            objectFit: 'cover',
            width: '100%',
            height: '100%',
          }}
        />
      )}

      {/* Play button overlay */}
      {showPlayButton && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-30 transition-all duration-200">
          <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all duration-200">
            <Play className="w-6 h-6 text-gray-800 ml-0.5" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Aspect ratio indicator (development only) */}
      {process.env.NODE_ENV === 'development' && imageNaturalDimensions && (
        <div className="absolute bottom-2 left-2">
          <div className="px-2 py-1 rounded text-xs font-mono bg-purple-500 text-white bg-opacity-80">
            {Math.round((imageNaturalDimensions.width / imageNaturalDimensions.height) * 100) / 100}:1
          </div>
        </div>
      )}

      {/* Debug indicator (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2">
          <div className={`px-2 py-1 rounded text-xs font-mono text-white ${
            hasError ? 'bg-red-500' : 
            thumbnailUrl !== fallbackImage ? 'bg-green-500' : 'bg-orange-500'
          }`} style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
            {hasError ? 'ERR' : thumbnailUrl !== fallbackImage ? 'DYN' : 'FB'}
          </div>
          {uploadId && (
            <div className="mt-1 px-2 py-1 rounded text-xs font-mono bg-blue-500 text-white">
              ID: {uploadId.slice(-6)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook for getting thumbnail URL programmatically
export function useThumbnailUrl(uploadId?: string, videoId?: string, accountId?: string) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getThumbnailUrl() {
      if (!uploadId && !videoId) {
        setUrl(null);
        setIsLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        if (uploadId) params.append('uploadId', uploadId);
        if (videoId) params.append('videoId', videoId);
        if (accountId) params.append('accountId', accountId);

        const apiUrl = `/api/video-analysis/thumbnail${uploadId ? `/${uploadId}` : ''}${params.toString() ? `?${params.toString()}` : ''}`;
        
        const response = await fetch(apiUrl, { method: 'HEAD' });
        
        if (response.ok) {
          setUrl(apiUrl);
        } else {
          setUrl(null);
        }
      } catch (error) {
        console.error('Error getting thumbnail URL:', error);
        setUrl(null);
      } finally {
        setIsLoading(false);
      }
    }

    getThumbnailUrl();
  }, [uploadId, videoId, accountId]);

  return { url, isLoading };
}
