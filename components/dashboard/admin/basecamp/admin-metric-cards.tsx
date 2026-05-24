'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Video, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface AdminMetrics {
  overallImprovementRate: number;
  totalVideosUploaded: number;
  totalTrainingTime: string;
}

const adminMetricsConfig = [
  {
    title: 'Overall Improvement Rate',
    key: 'overallImprovementRate' as keyof AdminMetrics,
    icon: TrendingUp,
    gradient: 'from-emerald-400 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50',
    description: 'Across all employees',
    suffix: '%'
  },
  {
    title: 'Total Videos Uploaded',
    key: 'totalVideosUploaded' as keyof AdminMetrics,
    icon: Video,
    gradient: 'from-blue-400 to-indigo-500',
    bgGradient: 'from-blue-50 to-indigo-50',
    description: 'Platform wide',
    suffix: ''
  },
  {
    title: 'Total Training Time',
    key: 'totalTrainingTime' as keyof AdminMetrics,
    icon: Clock,
    gradient: 'from-purple-400 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50',
    description: 'Time completed',
    suffix: ''
  }
];

export function AdminMetricCards() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics>({
    overallImprovementRate: 0,
    totalVideosUploaded: 0,
    totalTrainingTime: '0m 0s'
  });
  const [loading, setLoading] = useState(true);

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
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        } else {
          console.error('Failed to fetch admin metrics:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching admin metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [token]);

  const formatValue = (value: number | string, suffix: string) => {
    if (typeof value === 'string') return value; // Already formatted
    if (suffix === '%') return `${value}${suffix}`;
    return value.toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {adminMetricsConfig.map((config, index) => {
        const IconComponent = config.icon;
        const value = metrics[config.key];
        return (
          <Card
            key={index}
            className={`bg-gradient-to-br ${config.bgGradient} border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                {config.title}
              </CardTitle>
              <div className={`p-3 rounded-full bg-gradient-to-r ${config.gradient} shadow-lg`}>
                <IconComponent className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="bg-white/60 backdrop-blur-sm rounded-lg mx-4 mb-4 p-4">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : formatValue(value, config.suffix)}
                </div>
                <p className="text-sm text-gray-600">
                  {config.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
