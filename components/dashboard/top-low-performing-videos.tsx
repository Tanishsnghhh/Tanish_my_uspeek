'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Eye } from 'lucide-react';

interface VideoData {
  _id: string;
  filename: string;
  uploadDate: string;
  score: number;
  rank: number;
}

interface TopLowPerformingVideosProps {
  topPerformingVideos?: VideoData[];
  lowPerformingVideos?: VideoData[];
  isLoading?: boolean;
}

export function TopLowPerformingVideos({ 
  topPerformingVideos = [], 
  lowPerformingVideos = [], 
  isLoading = false 
}: TopLowPerformingVideosProps) {
  // Memoize formatted dates to prevent infinite re-renders
  const formattedDates = useMemo(() => {
    const dates: Record<string, string> = {};
    [...topPerformingVideos, ...lowPerformingVideos].forEach(video => {
      dates[video._id] = formatDate(new Date(video.uploadDate));
    });
    return dates;
  }, [topPerformingVideos, lowPerformingVideos]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center space-x-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg">
                <TrendingUp className="w-5 h-5 text-white filter drop-shadow-sm" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Top Performing Videos
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 bg-white/60 backdrop-blur-sm rounded-lg mx-4 mb-4">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center space-x-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-red-400 to-rose-500 shadow-lg">
                <TrendingDown className="w-5 h-5 text-white filter drop-shadow-sm" />
              </div>
              <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                Low Performing Videos
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 bg-white/60 backdrop-blur-sm rounded-lg mx-4 mb-4">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-100">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Performing Videos */}
      <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center space-x-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg">
              <TrendingUp className="w-5 h-5 text-white filter drop-shadow-sm" />
            </div>
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Top Performing Videos
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 bg-white/60 backdrop-blur-sm rounded-lg mx-4 mb-4">
          {topPerformingVideos.length > 0 ? (
            topPerformingVideos.map((video, index) => (
              <div key={video._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 shadow-md hover:shadow-lg transition-all duration-200">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">#{video.rank}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">{video.filename}</h4>
                  </div>
                  <p className="text-xs text-gray-600">{formattedDates[video._id] || 'Loading...'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`${getScoreColor(video.score)} font-semibold shadow-sm`}>
                    {video.score}/100
                  </Badge>
                  <Button variant="ghost" size="sm" className="hover:bg-green-100 transition-colors">
                    <Eye className="w-4 h-4 text-green-600" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No top performing videos yet</p>
              <p className="text-xs mt-1">Videos with scores ≥75 will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Performing Videos */}
      <Card className="bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center space-x-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-red-400 to-rose-500 shadow-lg">
              <TrendingDown className="w-5 h-5 text-white filter drop-shadow-sm" />
            </div>
            <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
              Low Performing Videos
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 bg-white/60 backdrop-blur-sm rounded-lg mx-4 mb-4">
          {lowPerformingVideos.length > 0 ? (
            lowPerformingVideos.map((video, index) => (
              <div key={video._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-100 shadow-md hover:shadow-lg transition-all duration-200">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">#{video.rank}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">{video.filename}</h4>
                  </div>
                  <p className="text-xs text-gray-600">{formattedDates[video._id] || 'Loading...'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`${getScoreColor(video.score)} font-semibold shadow-sm`}>
                    {video.score}/100
                  </Badge>
                  <Button variant="ghost" size="sm" className="hover:bg-red-100 transition-colors">
                    <Eye className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingDown className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No low performing videos</p>
              <p className="text-xs mt-1">Videos with scores &lt;75 will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}