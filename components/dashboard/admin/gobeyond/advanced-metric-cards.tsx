'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Video, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface MetricsData {
  overallImprovementRate: number;
  totalVideosUploaded: number;
  totalTrainingTime: string;
}

const advancedMetrics = [
  {
    title: 'Overall Improvement Rate',
    key: 'overallImprovementRate',
    icon: TrendingUp,
    gradient: 'from-emerald-400 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50',
    description: 'Advanced analytics',
    format: (value: number | string) => typeof value === 'number' ? `${value}%` : value
  },
  {
    title: 'Total Videos Uploaded',
    key: 'totalVideosUploaded',
    icon: Video,
    gradient: 'from-blue-400 to-indigo-500',
    bgGradient: 'from-blue-50 to-indigo-50',
    description: 'Enhanced tracking',
    format: (value: number | string) => typeof value === 'number' ? value.toLocaleString() : value
  },
  {
    title: 'Total Training Hours',
    key: 'totalTrainingTime',
    icon: Clock,
    gradient: 'from-purple-400 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50',
    description: 'Hours completed',
    format: (value: number | string) => value
  }
];

export function AdvancedMetricCards() {
  const { token } = useAuth();
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!token) return;
      
      try {
        const response = await fetch('/api/dashboard/admin-metrics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        const data = await response.json();
        setMetricsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [token]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {advancedMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card 
              key={index} 
              className={`bg-gradient-to-br ${metric.bgGradient} border-0 shadow-xl`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  {metric.title}
                </CardTitle>
                <div className={`p-3 rounded-full bg-gradient-to-r ${metric.gradient} shadow-lg`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="bg-white/60 backdrop-blur-sm rounded-lg mx-4 mb-4 p-4">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-gray-900 animate-pulse">
                    Loading...
                  </div>
                  <p className="text-sm text-gray-600">
                    {metric.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {advancedMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card 
              key={index} 
              className={`bg-gradient-to-br ${metric.bgGradient} border-0 shadow-xl`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  {metric.title}
                </CardTitle>
                <div className={`p-3 rounded-full bg-gradient-to-r ${metric.gradient} shadow-lg`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="bg-white/60 backdrop-blur-sm rounded-lg mx-4 mb-4 p-4">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-red-500">
                    Error
                  </div>
                  <p className="text-sm text-gray-600">
                    {metric.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {advancedMetrics.map((metric, index) => {
        const IconComponent = metric.icon;
        const value = metricsData ? metricsData[metric.key as keyof MetricsData] : 0;
        const formattedValue = metric.format(value as number | string);
        
        return (
          <Card 
            key={index} 
            className={`bg-gradient-to-br ${metric.bgGradient} border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                {metric.title}
              </CardTitle>
              <div className={`p-3 rounded-full bg-gradient-to-r ${metric.gradient} shadow-lg`}>
                <IconComponent className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="bg-white/60 backdrop-blur-sm rounded-lg mx-4 mb-4 p-4">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">
                  {formattedValue}
                </div>
                <p className="text-sm text-gray-600">
                  {metric.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
