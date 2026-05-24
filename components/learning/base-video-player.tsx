'use client';

import React from 'react';
import { Play, Volume2, Maximize2, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BaseVideoPlayerProps {
  title: string;
  subtitle?: string;
  description?: string;
  duration?: string;
  className?: string;
  onPlay?: () => void;
  variant?: 'default' | 'compact' | 'fullscreen';
}

export const BaseVideoPlayer: React.FC<BaseVideoPlayerProps> = ({
  title,
  subtitle,
  description = "Click to play the video",
  duration = "0:00",
  className = "",
  onPlay,
  variant = "default"
}) => {
  const handlePlay = () => {
    if (onPlay) {
      onPlay();
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg overflow-hidden aspect-video relative ${className}`}>
        <div className="w-full h-full flex items-center justify-center relative">
          <div className="text-center text-white">
            <button 
              onClick={handlePlay}
              className="w-16 h-16 mx-auto bg-blue-600 rounded-full flex items-center justify-center mb-3 hover:bg-blue-700 transition-colors"
            >
              <Play className="w-8 h-8" />
            </button>
            <div className="text-lg font-semibold mb-1">{title}</div>
            {subtitle && <div className="text-sm text-gray-300">{subtitle}</div>}
            <p className="text-gray-400 text-xs mt-2">{description}</p>
          </div>
        </div>
        
        {/* uSpeek Logo */}
        <div className="absolute bottom-3 right-3 flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">uS</span>
          </div>
          <span className="text-gray-400 text-xs">uSpeek</span>
        </div>
      </div>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 aspect-video relative">
          {/* Video Player */}
          <div className="w-full h-full flex items-center justify-center relative">
            <div className="text-center text-white">
              <button 
                onClick={handlePlay}
                className="w-20 h-20 mx-auto bg-blue-600 rounded-full flex items-center justify-center mb-4 hover:bg-blue-700 transition-colors"
              >
                <Play className="w-10 h-10" />
              </button>
              <div className="text-2xl font-bold mb-2">
                <div>{title}</div>
                {subtitle && <div className="text-lg">{subtitle}</div>}
              </div>
              <p className="text-gray-300 text-sm mb-2">{description}</p>
              {duration && (
                <div className="text-gray-400 text-xs">
                  Duration: {duration}
                </div>
              )}
            </div>
          </div>
          
          {/* Video Controls */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                <Volume2 className="w-4 h-4" />
              </Button>
              <div className="text-white text-xs">{duration}</div>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                <Settings className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* uSpeek Logo */}
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">uS</span>
            </div>
            <span className="text-gray-400 text-xs">uSpeek</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 