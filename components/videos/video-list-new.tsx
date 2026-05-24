'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Play, 
  Clock, 
  User, 
  Calendar,
  FileVideo,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface VideoFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
}

interface VideoUpload {
  _id: string;
  filename: string;
  fileSize: number;
  uploadDate: string;
  status: string;
  analysisResults?: any;
  transcription?: {
    duration: number;
    transcript: string;
  };
  analysis?: {
    speechMetrics: {
      wordsPerMinute: number;
    };
    sentiment: {
      overall: string;
    };
  };
  feedback?: {
    overallScore: number;
    detailedFeedback: {
      pacing: { score: number };
      clarity: { score: number };
      engagement: { score: number };
      confidence: { score: number };
    };
  };
}

interface VideoListProps {
  filters: VideoFilters;
}

export function VideoList({ filters }: VideoListProps) {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
    // Set up polling for status updates every 10 seconds
    const interval = setInterval(fetchVideos, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/video-analysis/list');
      if (response.ok) {
        const result = await response.json();
        setVideos(result.data || []);
      } else {
        setError('Failed to fetch videos');
      }
    } catch (err) {
      setError('Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = !filters.search || 
      video.filename.toLowerCase().includes(filters.search.toLowerCase());
    
    const videoDate = new Date(video.uploadDate);
    const matchesDateFrom = !filters.dateFrom || 
      videoDate >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || 
      videoDate <= new Date(filters.dateTo);
    
    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'analysis_failed':
      case 'transcription_failed':
        return 'bg-red-100 text-red-800';
      case 'uploaded':
        return 'bg-blue-100 text-blue-800';
      case 'transcribing':
      case 'analyzing':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'failed':
      case 'analysis_failed':
      case 'transcription_failed':
        return <XCircle className="w-4 h-4" />;
      case 'transcribing':
      case 'analyzing':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchVideos}
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (filteredVideos.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <FileVideo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
          <p className="text-gray-600 mb-4">
            {filters.search || filters.dateFrom || filters.dateTo
              ? "No videos match your current filters."
              : "Upload your first video to get started with AI analysis."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredVideos.map((video) => (
        <Card key={video._id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                {/* Video Thumbnail/Icon */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileVideo className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                {/* Video Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {video.filename}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(video.uploadDate)}
                        </span>
                        {video.transcription && (
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDuration(video.transcription.duration)}
                          </span>
                        )}
                        <span className="flex items-center">
                          <FileVideo className="w-4 h-4 mr-1" />
                          {formatFileSize(video.fileSize)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <Badge className={`${getStatusColor(video.status)} flex items-center`}>
                      {getStatusIcon(video.status)}
                      <span className="ml-1 capitalize">
                        {video.status.replace('_', ' ')}
                      </span>
                    </Badge>
                  </div>

                  {/* Analysis Scores - Only show if analysis is completed */}
                  {video.status === 'completed' && video.feedback && (
                    <div className="mt-4 grid grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(video.feedback.overallScore)}`}>
                          {video.feedback.overallScore}
                        </div>
                        <div className="text-xs text-gray-600">Overall</div>
                      </div>
                      {Object.entries(video.feedback.detailedFeedback).map(([key, item]) => (
                        <div key={key} className="text-center">
                          <div className={`text-xl font-semibold ${getScoreColor(item.score)}`}>
                            {item.score}
                          </div>
                          <div className="text-xs text-gray-600 capitalize">{key}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Processing Info */}
                  {['transcribing', 'analyzing', 'processing'].includes(video.status) && (
                    <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <Loader2 className="w-4 h-4 animate-spin text-yellow-600 mr-2" />
                        <span className="text-sm text-yellow-800">
                          Your video is being processed. This may take a few minutes...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Error Info */}
                  {video.status.includes('failed') && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <XCircle className="w-4 h-4 text-red-600 mr-2" />
                        <span className="text-sm text-red-800">
                          Analysis failed. Please try uploading again.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Quick Stats */}
                  {video.analysis && (
                    <div className="mt-3 flex items-center space-x-6 text-sm text-gray-600">
                      {video.analysis.speechMetrics && (
                        <span>{video.analysis.speechMetrics.wordsPerMinute} WPM</span>
                      )}
                      {video.analysis.sentiment && (
                        <span className="capitalize">
                          {video.analysis.sentiment.overall} tone
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-4">
                {video.status === 'uploaded' && (
                  <Link href={`/videos/analysis?uploadId=${video._id}`}>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Play className="w-4 h-4 mr-2" />
                      Start Analysis
                    </Button>
                  </Link>
                )}
                
                {video.status === 'completed' && (
                  <Link href={`/videos/analysis?uploadId=${video._id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View Results
                    </Button>
                  </Link>
                )}

                {['transcribing', 'analyzing', 'processing'].includes(video.status) && (
                  <Link href={`/videos/analysis?uploadId=${video._id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View Progress
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
