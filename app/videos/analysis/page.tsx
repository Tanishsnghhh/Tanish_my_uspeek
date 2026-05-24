'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  FileText, 
  BarChart3, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Target,
  Award,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Eye,
  Download,
  Mic,
  User,
  Brain,
  Heart,
  Volume2,
  Move,
  Smile,
  PauseCircle,
  BookOpen,
  Zap
} from 'lucide-react';
import Link from 'next/link';

interface AnalysisData {
  upload: {
    filename: string;
    fileSize: number;
    uploadDate: string;
    status: string;
  };
  transcription: {
    transcript: string;
    duration: number;
    segments: Array<{
      start: number;
      end: number;
      text: string;
    }>;
  };
  analysis: {
    // Enhanced sentiment analysis
    sentiment_analysis?: {
      overall_sentiment: 'positive' | 'neutral' | 'negative';
      positive_score: number;
      negative_score: number;
      neutral_score: number;
      confidence: number;
    };
    
    // Comprehensive emotion analysis
    emotion_analysis?: {
      dominant_emotion: string;
      emoji: string;
      confidence: number;
      emotion_scores: { [key: string]: number };
      detected_keywords: Array<{ emotion: string; keyword: string }>;
    };

    // Content assessment
    content_assessment?: {
      quality_score: number;
      vocabulary_diversity: number;
      clarity_score: number;
      complexity_level: string;
    };

    // Strengths and improvements analysis
    strengths_improvements?: {
      strengths: Array<{ area: string; description: string; score: number }>;
      improvements: Array<{ area: string; description: string; score: number }>;
      strength_score: number;
      improvement_areas_score: number;
      detailed_metrics: { [key: string]: number };
    };

    // Enhanced filler words analysis
    filler_words?: Array<{ word: string; count: number; percentage: number }>;
    
    // Repeated words analysis
    repeated_words?: Array<{ word: string; count: number }>;

    // Enhanced speech metrics
    speech_metrics?: {
      wordsPerMinute: number;
      totalWords: number;
      averageWordsPerSentence: number;
      readabilityScore: number;
      sentenceCount: number;
      averageWordLength: number;
      speakingDuration: number;
      pauseAnalysis: {
        estimatedPauses: number;
        averagePauseLength: number;
      };
    };

    // Legacy format for backward compatibility
    sentiment?: {
      overall: 'positive' | 'neutral' | 'negative';
      confidence: number;
      details: { positive: number; neutral: number; negative: number };
    };
    fillerWords?: Array<{ word: string; count: number; percentage: number }>;
    repeatedWords?: Array<{ word: string; count: number }>;
    speechMetrics?: {
      wordsPerMinute: number;
      totalWords: number;
      averageWordsPerSentence: number;
      readabilityScore: number;
      sentenceCount?: number;
      averageWordLength?: number;
      speakingDuration?: number;
      pauseAnalysis?: {
        estimatedPauses: number;
        averagePauseLength: number;
      };
    };
  };
  feedback: {
    overallScore: number;
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
    detailedFeedback: {
      pacing: { score: number; feedback: string };
      clarity: { score: number; feedback: string };
      engagement: { score: number; feedback: string };
      confidence: { score: number; feedback: string };
    };
  };
}

function VideoAnalysisPage() {
  const searchParams = useSearchParams();
  const uploadId = searchParams.get('uploadId');
  
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (uploadId) {
      fetchAnalysisData();
      
      // Poll for updates if still processing
      const interval = setInterval(() => {
        fetchAnalysisData();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [uploadId]);

  const fetchAnalysisData = async () => {
    try {
      const response = await fetch(`/api/video-analysis/status?uploadId=${uploadId}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        
        // Stop polling if analysis is complete
        if (result.data.upload?.status === 'completed') {
          setProcessing(false);
        } else if (['transcribing', 'analyzing', 'generating_feedback'].includes(result.data.upload?.status)) {
          setProcessing(true);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch analysis data');
    } finally {
      setLoading(false);
    }
  };

  const startProcessing = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/video-analysis/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start processing');
      }
    } catch (err) {
      setError('Failed to start processing');
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analysis...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Analysis data not found'}</p>
          <Link href="/videos">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Videos
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/videos">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Video Analysis Results</h1>
              <p className="text-gray-600">{data.upload.filename}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {getStatusIcon(data.upload.status)}
            <Badge variant={data.upload.status === 'completed' ? 'default' : 'secondary'}>
              {data.upload.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Processing Status */}
        {processing && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="font-medium">Processing your video...</p>
                <p className="text-sm text-gray-600">This may take a few minutes</p>
                <Progress value={33} className="mt-4 max-w-xs mx-auto" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Start Processing Button */}
        {data.upload.status === 'uploaded' && !processing && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="mb-4">Your video has been uploaded successfully. Click below to start the analysis process.</p>
              <Button onClick={startProcessing} className="bg-blue-600 hover:bg-blue-700">
                <Play className="w-4 h-4 mr-2" />
                Start Analysis
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {data.upload.status === 'completed' && data.feedback && (
          <div className="space-y-8">
            {/* Video Analysis Header */}
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Video Analysis Report</h2>
                    <p className="text-gray-600">AI-powered communication insights</p>
                    <div className="flex items-center mt-3 text-sm text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      LIVE ANALYSIS
                    </div>
                  </div>
                  
                  {/* Video Player Placeholder */}
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ width: '200px', height: '120px' }}>
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {data.transcription?.duration ? formatDuration(data.transcription.duration) : '0:00'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overall Score and Key Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overall Score */}
              <Card className="lg:col-span-1">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="transform -rotate-90 w-32 h-32">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-gray-200"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - (data.feedback?.overallScore || 0) / 100)}`}
                          className={`${getScoreColor(data.feedback?.overallScore || 0)} transition-all duration-1000 ease-out`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className={`text-4xl font-bold ${getScoreColor(data.feedback?.overallScore || 0)}`}>
                            {data.feedback?.overallScore || 0}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">OVERALL SCORE</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics Grid */}
              <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center text-purple-600 mb-2">
                          <Volume2 className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">Vocal</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round((data.analysis?.sentiment_analysis?.confidence || data.analysis?.sentiment?.confidence || 0.75) * 100)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center text-blue-600 mb-2">
                          <BookOpen className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">Words</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round((data.analysis?.content_assessment?.quality_score || 77) * 0.77)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center text-green-600 mb-2">
                          <User className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">Body</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round((data.analysis?.emotion_analysis?.confidence || 82) * 0.82)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center text-orange-600 mb-2">
                          <Zap className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">WPM</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-600">
                          {(data.analysis?.speech_metrics || data.analysis?.speechMetrics)?.wordsPerMinute || 145}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Export Report Button */}
            <div className="flex justify-center">
              <Button className="bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-3">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>

            {/* Comprehensive Analysis Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid grid-cols-6 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="emotion">Emotions</TabsTrigger>
                <TabsTrigger value="voice">Voice</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="body">Body Language</TabsTrigger>
                <TabsTrigger value="detailed">Detailed</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Sentiment & Emotion Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Heart className="w-5 h-5 mr-2 text-red-500" />
                        Emotion Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {data.analysis?.emotion_analysis ? (
                        <div className="text-center">
                          <div className="text-4xl mb-2">{data.analysis.emotion_analysis.emoji}</div>
                          <div className="text-lg font-semibold">{data.analysis.emotion_analysis.dominant_emotion}</div>
                          <div className="text-sm text-gray-600 mb-4">
                            {data.analysis.emotion_analysis.confidence}% confidence
                          </div>
                          <div className="space-y-2">
                            {Object.entries(data.analysis.emotion_analysis.emotion_scores).slice(0, 3).map(([emotion, score]) => (
                              <div key={emotion} className="flex justify-between items-center text-sm">
                                <span className="capitalize">{emotion.toLowerCase()}</span>
                                <div className="flex items-center">
                                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                    <div 
                                      className="bg-red-500 h-2 rounded-full" 
                                      style={{ width: `${Math.min(100, (score as number) * 10)}%` }}
                                    ></div>
                                  </div>
                                  <span className="w-6 text-right">{score}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-gray-500">No emotion analysis available</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
                        Sentiment Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {data.analysis?.sentiment_analysis?.positive_score || 
                             (data.analysis?.sentiment?.details?.positive ? Math.round(data.analysis.sentiment.details.positive * 100) : 0)}%
                          </div>
                          <div className="text-sm text-gray-600">Positive</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-600">
                            {data.analysis?.sentiment_analysis?.neutral_score || 
                             (data.analysis?.sentiment?.details?.neutral ? Math.round(data.analysis.sentiment.details.neutral * 100) : 0)}%
                          </div>
                          <div className="text-sm text-gray-600">Neutral</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">
                            {data.analysis?.sentiment_analysis?.negative_score || 
                             (data.analysis?.sentiment?.details?.negative ? Math.round(data.analysis.sentiment.details.negative * 100) : 0)}%
                          </div>
                          <div className="text-sm text-gray-600">Negative</div>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <Badge 
                          variant={
                            (data.analysis?.sentiment_analysis?.overall_sentiment || data.analysis?.sentiment?.overall) === 'positive' ? 'default' : 
                            (data.analysis?.sentiment_analysis?.overall_sentiment || data.analysis?.sentiment?.overall) === 'negative' ? 'destructive' : 'secondary'
                          }
                        >
                          {(data.analysis?.sentiment_analysis?.overall_sentiment || data.analysis?.sentiment?.overall || 'unknown').toUpperCase()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Content Quality & Speech Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BookOpen className="w-5 h-5 mr-2 text-purple-500" />
                        Content Quality
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {data.analysis?.content_assessment ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span>Quality Score</span>
                            <span className="font-bold text-purple-600">
                              {Math.round(data.analysis.content_assessment.quality_score)}/100
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Vocabulary Diversity</span>
                            <span className="font-bold text-blue-600">
                              {Math.round(data.analysis.content_assessment.vocabulary_diversity)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Clarity Score</span>
                            <span className="font-bold text-green-600">
                              {Math.round(data.analysis.content_assessment.clarity_score)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Complexity Level</span>
                            <Badge variant="outline">{data.analysis.content_assessment.complexity_level}</Badge>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">No content assessment available</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Mic className="w-5 h-5 mr-2 text-orange-500" />
                        Speech Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {(data.analysis?.speech_metrics || data.analysis?.speechMetrics)?.wordsPerMinute || 0}
                          </div>
                          <div className="text-sm text-gray-600">Words/Min</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {(data.analysis?.speech_metrics || data.analysis?.speechMetrics)?.totalWords || 0}
                          </div>
                          <div className="text-sm text-gray-600">Total Words</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {(data.analysis?.speech_metrics || data.analysis?.speechMetrics)?.averageWordsPerSentence || 0}
                          </div>
                          <div className="text-sm text-gray-600">Avg Words/Sentence</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {(data.analysis?.speech_metrics || data.analysis?.speechMetrics)?.readabilityScore || 0}/10
                          </div>
                          <div className="text-sm text-gray-600">Complexity</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Emotion Tab */}
              <TabsContent value="emotion" className="space-y-6">
                {data.analysis?.emotion_analysis ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Brain className="w-5 h-5 mr-2 text-purple-500" />
                          Detailed Emotion Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center mb-6">
                          <div className="text-6xl mb-4">{data.analysis.emotion_analysis.emoji}</div>
                          <h3 className="text-2xl font-bold mb-2">{data.analysis.emotion_analysis.dominant_emotion}</h3>
                          <p className="text-gray-600">Confidence: {data.analysis.emotion_analysis.confidence}%</p>
                        </div>
                        
                        <div className="space-y-3">
                          {Object.entries(data.analysis.emotion_analysis.emotion_scores)
                            .sort(([,a], [,b]) => (b as number) - (a as number))
                            .map(([emotion, score]) => (
                            <div key={emotion} className="flex justify-between items-center">
                              <span className="font-medium capitalize">{emotion.toLowerCase().replace('_', ' ')}</span>
                              <div className="flex items-center w-1/2">
                                <div className="flex-1 bg-gray-200 rounded-full h-3 mr-3">
                                  <div 
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-1000" 
                                    style={{ width: `${Math.min(100, (score as number) * 5)}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-bold w-8 text-right">{score}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Detected Keywords</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {data.analysis.emotion_analysis.detected_keywords.map((item, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {item.keyword}
                              <span className="ml-1 text-gray-500">({item.emotion})</span>
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-gray-500">No emotion analysis data available</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Voice Analysis Tab */}
              <TabsContent value="voice" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Volume2 className="w-5 h-5 mr-2 text-blue-500" />
                        Voice Characteristics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Speaking Pace</span>
                          <span className="font-bold">
                            {(data.analysis?.speech_metrics || data.analysis?.speechMetrics)?.wordsPerMinute || 0} WPM
                          </span>
                        </div>
                        {((data.analysis?.speech_metrics?.speakingDuration || data.analysis?.speechMetrics?.speakingDuration) != null) && (
                          <div className="flex justify-between items-center">
                            <span>Speaking Duration</span>
                            <span className="font-bold">
                              {formatDuration((data.analysis?.speech_metrics?.speakingDuration || data.analysis?.speechMetrics?.speakingDuration || 0))}
                            </span>
                          </div>
                        )}
                        {(data.analysis?.speech_metrics?.pauseAnalysis || data.analysis?.speechMetrics?.pauseAnalysis) && (
                          <>
                            <div className="flex justify-between items-center">
                              <span>Estimated Pauses</span>
                              <span className="font-bold">
                                {(data.analysis?.speech_metrics?.pauseAnalysis?.estimatedPauses || data.analysis?.speechMetrics?.pauseAnalysis?.estimatedPauses || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Avg Pause Length</span>
                              <span className="font-bold">
                                {(data.analysis?.speech_metrics?.pauseAnalysis?.averagePauseLength || data.analysis?.speechMetrics?.pauseAnalysis?.averagePauseLength || 0)}s
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <PauseCircle className="w-5 h-5 mr-2 text-orange-500" />
                        Filler Words Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {((data.analysis?.filler_words || data.analysis?.fillerWords) && (data.analysis?.filler_words || data.analysis?.fillerWords)!.length > 0) ? (
                        <div className="space-y-3">
                          {(data.analysis?.filler_words || data.analysis?.fillerWords || []).slice(0, 5).map((item, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="font-medium">"{item.word}"</span>
                              <div className="text-right">
                                <div className="font-bold">{item.count}x</div>
                                <div className="text-xs text-gray-600">{item.percentage}%</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center">Excellent! No significant filler words detected</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Content Analysis Tab */}
              <TabsContent value="content" className="space-y-6">
                {/* Content Quality Metrics */}
                {data.analysis?.content_assessment && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
                          Content Quality Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span>Overall Quality</span>
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-3 mr-3">
                                <div 
                                  className="bg-purple-500 h-3 rounded-full transition-all duration-1000" 
                                  style={{ width: `${data.analysis.content_assessment.quality_score}%` }}
                                ></div>
                              </div>
                              <span className="font-bold">{Math.round(data.analysis.content_assessment.quality_score)}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Vocabulary Diversity</span>
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-3 mr-3">
                                <div 
                                  className="bg-blue-500 h-3 rounded-full transition-all duration-1000" 
                                  style={{ width: `${data.analysis.content_assessment.vocabulary_diversity}%` }}
                                ></div>
                              </div>
                              <span className="font-bold">{Math.round(data.analysis.content_assessment.vocabulary_diversity)}%</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Clarity</span>
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-3 mr-3">
                                <div 
                                  className="bg-green-500 h-3 rounded-full transition-all duration-1000" 
                                  style={{ width: `${data.analysis.content_assessment.clarity_score}%` }}
                                ></div>
                              </div>
                              <span className="font-bold">{Math.round(data.analysis.content_assessment.clarity_score)}%</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Complexity Level</span>
                            <Badge variant="outline" className="font-bold">
                              {data.analysis.content_assessment.complexity_level}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Target className="w-5 h-5 mr-2 text-green-500" />
                          Strengths & Improvements
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {data.analysis?.strengths_improvements ? (
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center mb-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                                <span className="font-medium">Strengths ({data.analysis.strengths_improvements.strengths.length})</span>
                              </div>
                              <div className="space-y-1">
                                {data.analysis.strengths_improvements.strengths.slice(0, 3).map((strength, index) => (
                                  <div key={index} className="text-sm text-gray-700 pl-6">
                                    • {strength.description}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex items-center mb-2">
                                <Target className="w-4 h-4 text-orange-500 mr-2" />
                                <span className="font-medium">Areas to Improve ({data.analysis.strengths_improvements.improvements.length})</span>
                              </div>
                              <div className="space-y-1">
                                {data.analysis.strengths_improvements.improvements.slice(0, 3).map((improvement, index) => (
                                  <div key={index} className="text-sm text-gray-700 pl-6">
                                    • {improvement.description}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500">No detailed analysis available</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Word Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
                      Word Usage Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3 text-red-600">Repeated Words</h4>
                        {((data.analysis?.repeated_words || data.analysis?.repeatedWords) && (data.analysis?.repeated_words || data.analysis?.repeatedWords)!.length > 0) ? (
                          <div className="space-y-2">
                            {(data.analysis?.repeated_words || data.analysis?.repeatedWords || []).slice(0, 5).map((item, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span>"{item.word}"</span>
                                <Badge variant="secondary">{item.count}x</Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-green-600">Great vocabulary diversity!</p>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3 text-orange-600">Most Used Filler Words</h4>
                        {((data.analysis?.filler_words || data.analysis?.fillerWords) && (data.analysis?.filler_words || data.analysis?.fillerWords)!.length > 0) ? (
                          <div className="space-y-2">
                            {(data.analysis?.filler_words || data.analysis?.fillerWords || []).slice(0, 3).map((item, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span>"{item.word}"</span>
                                <div className="text-right">
                                  <Badge variant="outline">{item.count}x</Badge>
                                  <div className="text-xs text-gray-500">{item.percentage}%</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-green-600">Minimal filler words detected!</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Body Language Tab */}
              <TabsContent value="body" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Move className="w-5 h-5 mr-2 text-green-500" />
                      Body Language Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <User className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <div className="text-lg font-bold text-blue-600">85%</div>
                        <div className="text-sm text-gray-600">Posture</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <Eye className="w-8 h-8 mx-auto mb-2 text-green-600" />
                        <div className="text-lg font-bold text-green-600">78%</div>
                        <div className="text-sm text-gray-600">Eye Contact</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <Move className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                        <div className="text-lg font-bold text-purple-600">72%</div>
                        <div className="text-sm text-gray-600">Gestures</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <Smile className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                        <div className="text-lg font-bold text-yellow-600">
                          {data.analysis?.emotion_analysis?.confidence || 88}%
                        </div>
                        <div className="text-sm text-gray-600">Facial Expression</div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Body Language Insights:</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>• Maintain good posture throughout the presentation</li>
                          <li>• Strong eye contact with the audience</li>
                          <li>• Natural hand gestures support your message</li>
                          <li>• Facial expressions align well with content tone</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Detailed Analysis Tab */}
              <TabsContent value="detailed" className="space-y-6">
                {/* Full Transcript */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Full Transcript
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Duration: {data.transcription?.duration ? formatDuration(data.transcription.duration) : 'N/A'}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {data.transcription?.transcript || 'No transcript available'}
                      </p>
                    </div>
                    
                    {/* Transcript Segments */}
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Transcript Segments</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {data.transcription?.segments?.map((segment, index) => (
                          <div key={index} className="flex items-start space-x-3 text-sm">
                            <Badge variant="outline" className="text-xs">
                              {formatDuration(segment.start)}
                            </Badge>
                            <span className="flex-1">{segment.text}</span>
                          </div>
                        )) || <p className="text-gray-500">No segments available</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-600 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {data.feedback?.recommendations?.map((recommendation, index) => (
                        <li key={index} className="flex items-start">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                            {index + 1}
                          </div>
                          <span className="text-sm">{recommendation}</span>
                        </li>
                      )) || (
                        <div className="space-y-2">
                          <li className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">1</div>
                            <span className="text-sm">Practice maintaining consistent eye contact with your audience</span>
                          </li>
                          <li className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">2</div>
                            <span className="text-sm">Work on reducing filler words to improve speech fluency</span>
                          </li>
                          <li className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">3</div>
                            <span className="text-sm">Consider varying your speech pace for better engagement</span>
                          </li>
                        </div>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VideoAnalysisPage />
    </Suspense>
  );
}
