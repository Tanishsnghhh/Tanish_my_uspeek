'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { UserAnalytics } from '@/types/analytics';

interface OverallScoreProps {
  data?: UserAnalytics | null;
  isLoading?: boolean;
}

export function OverallScore({ data, isLoading = false }: OverallScoreProps) {
  const overallScore = data?.scores?.overallCommunicationAvg;
  const displayScore = overallScore !== null && overallScore !== undefined ? Math.round(overallScore) : null;
  
  if (isLoading) {
    return (
      <Card className="h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Overall Communication Score
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          <div className="w-36 h-36 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Overall Communication Score
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        <div className="relative w-36 h-36">
          <svg className="w-36 h-36 transform -rotate-90 drop-shadow-lg" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#f1f5f9"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="url(#scoreGradient)"
              strokeWidth="10"
              fill="none"
              strokeDasharray={displayScore !== null ? `${displayScore * 2.51} 251` : `0 251`}
              strokeLinecap="round"
              className="drop-shadow-sm"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {displayScore !== null ? displayScore : '—'}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {displayScore !== null ? 'out of 100' : 'No data'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
          <span className="text-sm font-semibold text-gray-600">
            Computed from {data?.counts?.videos || 0} videos
          </span>
        </div>
      </CardContent>
    </Card>
  );
}