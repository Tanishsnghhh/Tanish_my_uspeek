'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, MessageSquare, Eye, Brain, Volume2, User, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface KeyInsight {
  title: string;
  category: 'improved' | 'needs_improvement';
  metric: string;
  score: number;
  threshold: number;
  icon?: string;
  emoji?: string;
  description: string;
  trend: 'up' | 'down' | 'stable';
}

interface KeyInsightsResponse {
  improved: KeyInsight[];
  needsImprovement: KeyInsight[];
  summary: {
    totalVideos: number;
    averageOverallScore: number;
    topPerformingArea: string;
    mostNeedingImprovement: string;
  };
}

export function KeyInsightsSection() {
  const { token } = useAuth();
  const [insights, setInsights] = useState<KeyInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchKeyInsights();
    }
  }, [token]);

  const fetchKeyInsights = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/key-insights', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }
      
      const data = await response.json();
      setInsights(data);
    } catch (err) {
      console.error('Error fetching key insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const getMetricIcon = (metric: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      rateOfSpeech: <MessageSquare className="w-6 h-6" />,
      eyeContact: <Eye className="w-6 h-6" />,
      vocabularyDiversity: <Brain className="w-6 h-6" />,
      modulation: <Volume2 className="w-6 h-6" />,
      posture: <User className="w-6 h-6" />,
      confidence: <User className="w-6 h-6" />,
      presentation: <TrendingUp className="w-6 h-6" />,
      engagement: <Eye className="w-6 h-6" />,
      clarity: <MessageSquare className="w-6 h-6" />,
      presence: <User className="w-6 h-6" />
    };
    return iconMap[metric] || <User className="w-6 h-6" />;
  };

  const getMetricLabel = (metric: string) => {
    const labelMap: { [key: string]: string } = {
      rateOfSpeech: 'Rate of Speech',
      eyeContact: 'Eye Contact',
      vocabularyDiversity: 'Word Power',
      modulation: 'Voice Modulation',
      posture: 'Body Posture',
      confidence: 'Confidence',
      smiles: 'Smile',
      sad: 'Sad',
      angry: 'Anger',
      fearful: 'Fearful',
      confused: 'Confused',
      disgust: 'Disgust',
      presentation: 'Presentation',
      engagement: 'Engagement',
      clarity: 'Clarity',
      presence: 'Presence'
    };
    return labelMap[metric] || metric;
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-800 flex items-center space-x-3">
            <TrendingUp className="w-7 h-7 text-blue-600" />
            <span>Key Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-blue-600">Loading insights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-pink-100 border-red-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-800 flex items-center space-x-3">
            <TrendingUp className="w-7 h-7 text-red-600" />
            <span>Key Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchKeyInsights}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
            <TrendingUp className="w-7 h-7 text-gray-600" />
            <span>Key Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600">No insights data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-blue-800">Key Insights</CardTitle>
            {insights.summary && (
              <div className="text-sm text-blue-600 mt-1">
                Based on {insights.summary.totalVideos} videos • Average Score: {insights.summary.averageOverallScore}%
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Things that Improved */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-800">Things that Improved</h3>
                <p className="text-xs text-green-600">Areas showing positive progress</p>
              </div>
            </div>
            
            {insights.improved.length > 0 ? (
              insights.improved.map((item, index) => (
                <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        {item.emoji ? (
                          <span className="text-lg">{item.emoji}</span>
                        ) : (
                          <div className="text-green-600">
                            {getMetricIcon(item.metric)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-green-800 text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-green-600 mb-2">{item.description}</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="text-xs font-medium text-green-700">
                            {getMetricLabel(item.metric)}
                          </span>
                        </div>
                        <div className="text-xs text-green-500 font-medium">
                          {Math.round(item.score)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No significant improvements detected yet</p>
                <p className="text-gray-400 text-xs mt-1">Keep practicing to see improvements!</p>
              </div>
            )}
          </div>

          {/* Things Need Improvement */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-orange-800">Things Need Improvement</h3>
                <p className="text-xs text-orange-600">Areas requiring attention</p>
              </div>
            </div>
            
            {insights.needsImprovement.length > 0 ? (
              insights.needsImprovement.map((item, index) => (
                <div key={index} className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        {item.emoji ? (
                          <span className="text-lg">{item.emoji}</span>
                        ) : (
                          <div className="text-orange-600">
                            {getMetricIcon(item.metric)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-orange-800 text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-orange-600 mb-2">{item.description}</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <TrendingDown className="w-3 h-3 text-orange-500" />
                          <span className="text-xs font-medium text-orange-700">
                            {getMetricLabel(item.metric)}
                          </span>
                        </div>
                        <div className="text-xs text-orange-500 font-medium">
                          {Math.round(item.score)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 text-center">
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-green-600 text-sm font-medium">All areas performing well!</p>
                <p className="text-green-500 text-xs mt-1">Great job on your progress!</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
