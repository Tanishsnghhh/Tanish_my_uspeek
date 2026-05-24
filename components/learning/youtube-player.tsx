'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  onProgress?: (watchedTime: number, totalTime: number) => void;
  onReady?: () => void;
  className?: string;
  initialProgress?: number; // Add initial progress parameter
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  title,
  onProgress,
  onReady,
  className = "",
  initialProgress = 0
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAPIReady, setIsAPIReady] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [hasSeekedToInitial, setHasSeekedToInitial] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Extract and validate video ID
  const getVideoId = (url: string) => {
    if (!url) return '';
    
    // Trim whitespace and check if it's empty
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return '';
    
    // Check if it's a YouTube URL
    if (!trimmedUrl.includes('youtube.com') && !trimmedUrl.includes('youtu.be')) {
      console.warn('Non-YouTube URL provided to YouTubePlayer:', trimmedUrl);
      return ''; // Return empty string for non-YouTube URLs
    }
    
    // If it's already just an ID (no URL patterns), validate and return as is
    if (!trimmedUrl.includes('youtube.com') && !trimmedUrl.includes('youtu.be') && trimmedUrl.length === 11) {
      // Basic validation - YouTube IDs are 11 characters and contain only alphanumeric characters, underscores, and hyphens
      if (/^[a-zA-Z0-9_-]{11}$/.test(trimmedUrl)) {
        return trimmedUrl;
      } else {
        console.warn('Invalid YouTube video ID format:', trimmedUrl);
        return '';
      }
    }
    
    // Extract from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
      /(?:youtube\.com\/embed\/)([^"&?\/\s]{11})/,
      /(?:youtube\.com\/v\/)([^"&?\/\s]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = trimmedUrl.match(pattern);
      if (match && match[1] && /^[a-zA-Z0-9_-]{11}$/.test(match[1])) {
        return match[1];
      }
    }
    
    // If no pattern matches, log warning and return empty string
    console.warn('Could not extract valid video ID from URL:', trimmedUrl);
    return '';
  };

  const actualVideoId = getVideoId(videoId);

  // Load YouTube API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsAPIReady(true);
      return;
    }

    // Load YouTube API script if not already loaded
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);
    }

    // Set up API ready callback
    window.onYouTubeIframeAPIReady = () => {
      setIsAPIReady(true);
    };

    // Cleanup
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (player && typeof player.destroy === 'function') {
        try {
          player.destroy();
        } catch (error) {
          console.error('Error destroying player:', error);
        }
      }
    };
  }, []);

  // Handle initial progress changes - seek to new position if video is loaded
  useEffect(() => {
    if (player && initialProgress > 0 && typeof player.seekTo === 'function' && typeof player.getCurrentTime === 'function') {
      const currentTime = player.getCurrentTime();
      // Only seek if we're not already at or very close to the target position
      if (Math.abs(currentTime - initialProgress) > 1) {
        console.log('⏩ Seeking to updated position:', initialProgress, 'from:', currentTime);
        player.seekTo(initialProgress, true);
        setHasSeekedToInitial(true);
      }
    }
  }, [initialProgress, player]);

  // Cleanup when videoId changes
  useEffect(() => {
    setHasSeekedToInitial(false); // Reset seek state for new video
  }, [videoId]);

  // Handle video ID changes - load new video in existing player
  useEffect(() => {
    if (player && actualVideoId && actualVideoId !== player.getVideoData?.()?.video_id) {
      console.log('🔄 Loading new video:', actualVideoId, 'in existing player');

      // Stop current progress tracking
      stopProgressTracking();
      setHasSeekedToInitial(false); // Reset seek state for new video

      try {
        if (typeof player.loadVideoById === 'function') {
          player.loadVideoById(actualVideoId);
          // Reset progress tracking for new video after a short delay
          setTimeout(() => {
            if (player && typeof player.getPlayerState === 'function') {
              const state = player.getPlayerState();
              if (state === window.YT.PlayerState.PLAYING) {
                startProgressTracking();
              }
            }
          }, 1500); // Give more time for video to load
        } else if (typeof player.cueVideoById === 'function') {
          player.cueVideoById(actualVideoId);
        }
      } catch (error) {
        console.error('Error loading new video:', error);
      }
    }
  }, [actualVideoId, player]);

  // Initialize player when API is ready
  useEffect(() => {
    if (isAPIReady && containerRef.current && !player && actualVideoId) {
      try {
        const newPlayer = new window.YT.Player(containerRef.current, {
          height: '100%',
          width: '100%',
          videoId: actualVideoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            showinfo: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            fs: 1,
            cc_load_policy: 0,
            playsinline: 1
          },
          events: {
            onReady: (event: any) => {
              console.log('✅ YouTube player ready for video:', actualVideoId);
              console.log('🔧 Player methods available:', {
                getCurrentTime: typeof event.target.getCurrentTime === 'function',
                getDuration: typeof event.target.getDuration === 'function',
                seekTo: typeof event.target.seekTo === 'function',
                getPlayerState: typeof event.target.getPlayerState === 'function'
              });

              // Ensure the player target has the required methods
              if (event.target && typeof event.target.getCurrentTime === 'function' && typeof event.target.getDuration === 'function') {
                setPlayer(event.target);
                console.log('🎯 Player reference set successfully');

                // Seek to initial progress if available
                if (initialProgress > 0 && typeof event.target.seekTo === 'function') {
                  console.log('⏩ Seeking to saved position:', initialProgress);
                  event.target.seekTo(initialProgress, true);
                }

                // Check if video is already playing when ready
                const playerState = event.target.getPlayerState();
                console.log('🎮 Player state on ready:', playerState);

                if (playerState === window.YT.PlayerState.PLAYING) {
                  console.log('▶️ Video already playing, starting progress tracking');
                  startProgressTracking();
                }

                if (onReady) onReady();
              } else {
                console.error('❌ YouTube player ready but methods not available');
              }
            },
            onStateChange: (event: any) => {
              console.log('🎬 YouTube player state changed:', event.data, 'for video:', actualVideoId);

              // Only start tracking if player is properly initialized
              if (event.target && typeof event.target.getCurrentTime === 'function') {
                // Start tracking progress when video starts playing
                if (event.data === window.YT.PlayerState.PLAYING) {
                  console.log('▶️ Starting progress tracking - player is playing');
                  // Start immediately without delay for better responsiveness
                  startProgressTracking();
                } else if (event.data === window.YT.PlayerState.PAUSED) {
                  console.log('⏸️ Stopping progress tracking (paused)');
                  stopProgressTracking();
                } else if (event.data === window.YT.PlayerState.ENDED) {
                  console.log('⏹️ Stopping progress tracking (ended)');
                  stopProgressTracking();
                } else if (event.data === window.YT.PlayerState.BUFFERING) {
                  console.log('⏳ Video buffering, continuing progress tracking');
                } else if (event.data === window.YT.PlayerState.CUED) {
                  console.log('🎯 Video cued');
                } else {
                  console.log('❓ Unknown player state:', event.data);
                }
              } else {
                console.log('⚠️ Player not ready for state change:', event.data);
              }
            },
            onError: (event: any) => {
              console.error('YouTube player error:', event.data, 'for video ID:', actualVideoId);
              // Handle specific error codes
              if (event.data === 2) {
                console.error('Invalid video ID parameter');
              } else if (event.data === 5) {
                console.error('HTML5 player error');
              } else if (event.data === 100) {
                console.error('Video not found');
              } else if (event.data === 101 || event.data === 150) {
                console.error('Video cannot be embedded');
              }
            }
          }
        });

        playerRef.current = newPlayer;
      } catch (error) {
        console.error('Error initializing YouTube player:', error);
      }
    }
  }, [isAPIReady, onReady]); // Removed videoId and actualVideoId from dependencies

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    console.log('▶️ Starting progress tracking for video:', actualVideoId);
    console.log('🔍 Player references:', {
      playerRef: !!playerRef.current,
      player: !!player,
      onProgress: !!onProgress
    });

    progressIntervalRef.current = setInterval(() => {
      if ((playerRef.current || player) && onProgress) {
        try {
          // Use the most recent player reference
          const currentPlayer = playerRef.current || player;

          // Check if player has the required methods
          if (currentPlayer && typeof currentPlayer.getCurrentTime === 'function' && typeof currentPlayer.getDuration === 'function') {
            const currentTime = currentPlayer.getCurrentTime();
            const duration = currentPlayer.getDuration();

            console.log('⏱️ Raw player values:', { currentTime, duration });

            if (duration > 0 && currentTime >= 0) {
              // Skip progress updates immediately after seeking to avoid sending incorrect small values
              if (hasSeekedToInitial && initialProgress > 0 && Math.abs(currentTime - initialProgress) < 2) {
                console.log('⏩ Skipping progress update - just seeked to position');
                return;
              }

              console.log('📊 Progress update:', { currentTime, duration, percentage: Math.round((currentTime / duration) * 100) });
              onProgress(currentTime, duration);
            } else {
              console.log('⚠️ Invalid progress values:', { currentTime, duration });
            }
          } else {
            console.log('⚠️ Player methods not available:', {
              hasPlayer: !!currentPlayer,
              hasGetCurrentTime: currentPlayer ? typeof currentPlayer.getCurrentTime === 'function' : false,
              hasGetDuration: currentPlayer ? typeof currentPlayer.getDuration === 'function' : false
            });
          }
        } catch (error) {
          console.error('❌ Error getting player time:', error);
        }
      } else {
        console.log('⚠️ Progress tracking conditions not met:', {
          hasPlayerRef: !!playerRef.current,
          hasPlayer: !!player,
          hasOnProgress: !!onProgress
        });
      }
    }, 1000); // Update every second
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // If no valid video ID, don't render YouTube player
  if (!actualVideoId) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="aspect-video w-full bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">🎥</div>
              <p className="text-sm">Video content not available</p>
              <p className="text-xs mt-1">Please check the video URL</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="aspect-video w-full">
          <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />
        </div>
      </CardContent>
    </Card>
  );
};
