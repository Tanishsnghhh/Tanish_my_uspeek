'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DynamicVideoThumbnail } from '@/components/ui/dynamic-video-thumbnail';
import { 
  Play, 
  Clock, 
  TrendingUp, 
  Eye, 
  Mic2, 
  Mic,
  MessageSquare, 
  FileText,
  MoreVertical,
  Share2,
  Trash2,
  Calendar,
  User,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Activity,
  Mail,
  Shield
} from 'lucide-react';

// Utility function to format dates consistently (DD/MM/YYYY format)
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

interface VideoAnalysis {
  id: string;
  _id?: string;
  uploadId?: string; // Added for dynamic thumbnails
  title: string;
  duration: string;
  uploadDate: string;
  status: 'completed' | 'processing' | 'failed';
  progress: number;
  thumbnail: string;
  speaker?: string;
  userInfo?: {
    name: string;
    email: string;
    role: string;
  } | null;
  summary?: string;
  sentences?: number;
  keywords?: string[];
  wordCount?: number;
  transcript?: string;
  performanceLevel?: string;
  emotionEmoji?: string;
  overallScore?: number;
  bodyLanguageScore?: number;
  vocalToneScore?: number;
  wordPowerScore?: number;
  framesProcessed?: number; // Added for frame info
  hasFrames?: boolean; // Added for frame availability
  metrics: {
    overallScore: number;
    vocalScore: number;
    bodyLanguageScore: number;
    wordPowerScore: number;
  };
}

interface VideoListProps {
  filters: {
    search: string;
    dateFrom: string;
    dateTo: string;
    status?: string;
    performanceLevel?: string;
    language?: string;
    minDuration?: string;
    maxDuration?: string;
  };
}

export function VideoList({ filters }: VideoListProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [videoAnalyses, setVideoAnalyses] = useState<VideoAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    skip: 0,
    hasMore: false,
    page: 1,
    totalPages: 1
  });

  // Fetch video analyses from MongoDB
  const fetchVideoAnalyses = async () => {
    // Wait for auth to complete
    if (authLoading) {
      console.log('🔄 Auth still loading, waiting...');
      return;
    }
    
    console.log('👤 User data:', { user, authLoading });
    
    setLoading(true);
    setError(null);
    
    try {
      const accountId = user?.corporateAccountId || 'default';
      console.log('🏢 Using account ID:', accountId);
      
      const searchParams = new URLSearchParams({
        accountId: accountId,
        limit: pagination.limit.toString(),
        skip: pagination.skip.toString(),
        sortBy: 'uploadDate',
        sortOrder: 'desc'
      });

      // Add filters
      if (filters.search) {
        searchParams.append('search', filters.search);
      }
      if (filters.dateFrom) {
        searchParams.append('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        searchParams.append('dateTo', filters.dateTo);
      }
      if (filters.status) {
        searchParams.append('status', filters.status);
      }
      if (filters.performanceLevel) {
        searchParams.append('performanceLevel', filters.performanceLevel);
      }
      if (filters.language) {
        searchParams.append('language', filters.language);
      }
      if (filters.minDuration) {
        searchParams.append('minDuration', filters.minDuration);
      }
      if (filters.maxDuration) {
        searchParams.append('maxDuration', filters.maxDuration);
      }

      console.log(`🔍 Fetching videos for Account: ${accountId}, User: ${user?.role}:${user?.id}`);
      
      const response = await fetch(`/api/video-analysis/list?${searchParams}`, {
        headers: {
          'x-account-id': accountId,
          'x-user-id': user ? `${user.role}:${user.id}` : 'guest:unknown'
        }
      });

      console.log(`📊 API Response: ${response.status}`, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log(`📋 Received ${result.data?.length || 0} video analyses:`, result);
        if (result.success) {
          setVideoAnalyses(result.data);
          setPagination(result.pagination);
        } else {
          setError(result.error || 'Failed to fetch video analyses');
        }
      } else {
        // If API fails, show empty state instead of error
        console.warn('API not available, showing empty state');
        setVideoAnalyses([]);
        setPagination(prev => ({ ...prev, total: 0 }));
      }
    } catch (err) {
      console.warn('Error fetching video analyses:', err);
      // Don't show error to user, just show empty state
      setVideoAnalyses([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideoAnalyses();
  }, [
    filters.search, 
    filters.dateFrom, 
    filters.dateTo, 
    filters.status,
    filters.performanceLevel,
    filters.language,
    filters.minDuration,
    filters.maxDuration,
    pagination.skip, 
    user, 
    authLoading
  ]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string, progress: number) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Complete
          </Badge>
        );
      case 'analyzing':
      case 'transcribing':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Processing ({progress}%)
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  const handleViewReport = (analysis: VideoAnalysis) => {
    // Navigate to the report page with the analysis ID
    router.push(`/videos/${analysis.id}/report`);
  };

  const handleLoadMore = () => {
    setPagination(prev => ({
      ...prev,
      skip: prev.skip + prev.limit
    }));
  };

  const hasActiveFilters = Object.values(filters).some(value => value && value !== '');

  if (loading && videoAnalyses.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video analyses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Video Analyses Grid */}
      {videoAnalyses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Video Analyses</h2>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {pagination.total} Total
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {videoAnalyses.map((analysis) => (
              <Card key={analysis._id} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="p-0">
                  <div className="relative">
                    <DynamicVideoThumbnail
                      uploadId={analysis.uploadId}
                      className="w-full h-48 object-cover rounded-t-lg"
                      alt={analysis.title}
                      fallbackImage={analysis.thumbnail}
                      showPlayButton={false}
                      aspectRatio="video"
                    />
                    <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs">
                      {analysis.duration}
                    </div>
                    <div className="absolute top-3 left-3">
                      {getStatusBadge(analysis.status, analysis.progress)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  {/* Title & Speaker Info */}
                  <div className="mb-6">
                    <CardTitle className="text-lg font-medium text-gray-900 mb-3">
                      {analysis.title}
                    </CardTitle>
                    
                    {/* Employee Information */}
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900 text-sm">
                          {analysis.speaker || 'Unknown Speaker'}
                        </span>
                      </div>
                      {analysis.userInfo && (
                        <div className="space-y-1 text-xs text-gray-600 ml-6">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-3 h-3" />
                            <span>{analysis.userInfo.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Shield className="w-3 h-3" />
                            <span className="capitalize">{analysis.userInfo.role.toLowerCase()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Date */}
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(analysis.uploadDate)}</span>
                    </div>
                  </div>

                  {/* Transcript Preview */}
                  {analysis.transcript && analysis.transcript.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Transcript Preview</span>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                          {analysis.wordCount || 0} words • {analysis.sentences || 0} sentences
                        </Badge>
                      </div>
                      <p className="text-xs text-blue-800 line-clamp-3 leading-relaxed">
                        {analysis.transcript.slice(0, 200) + (analysis.transcript.length > 200 ? '...' : '')}
                      </p>
                      {analysis.keywords && analysis.keywords.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {analysis.keywords.slice(0, 3).map((keyword: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                              {keyword.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Score Display */}
                  {analysis.status === 'completed' && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600">Overall Score</span>
                        <span className={`text-lg font-semibold ${getScoreColor(analysis.overallScore || analysis.metrics?.overallScore || 0)}`}>
                          {analysis.overallScore || analysis.metrics?.overallScore || 0}/100
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Activity className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Body Language</span>
                          </div>
                          <span className={`text-sm font-medium ${getScoreColor(analysis.bodyLanguageScore || analysis.metrics?.bodyLanguageScore || 0)}`}>
                            {analysis.bodyLanguageScore || analysis.metrics?.bodyLanguageScore || 0}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Mic className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Vocal Tone</span>
                          </div>
                          <span className={`text-sm font-medium ${getScoreColor(analysis.vocalToneScore || analysis.metrics?.vocalScore || 0)}`}>
                            {analysis.vocalToneScore || analysis.metrics?.vocalScore || 0}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Word Power</span>
                          </div>
                          <span className={`text-sm font-medium ${getScoreColor(analysis.wordPowerScore || analysis.metrics?.wordPowerScore || 0)}`}>
                            {analysis.wordPowerScore || analysis.metrics?.wordPowerScore || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      size="sm"
                      onClick={() => handleViewReport(analysis)}
                      disabled={analysis.status !== 'completed'}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More Button */}
          {pagination.hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
                className="px-8"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {videoAnalyses.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {hasActiveFilters 
              ? 'No videos found matching your filters.' 
              : 'No video analyses available yet.'
            }
          </div>
          {(!hasActiveFilters) && (
            <p className="text-sm text-gray-400">
              Upload your first video to get started with AI-powered analysis.
            </p>
          )}
        </div>
      )}
    </div>
  );
}