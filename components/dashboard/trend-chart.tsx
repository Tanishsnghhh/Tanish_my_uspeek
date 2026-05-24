'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserAnalytics, TrendDataPoint } from '@/types/analytics';

interface TrendChartProps {
  data?: UserAnalytics | null;
  isLoading?: boolean;
}

const chartConfigs = [
  {
    title: 'Body Language Trend',
    key: 'bodyLanguage' as keyof TrendDataPoint,
    color: '#10b981',
    gradient: 'from-emerald-400 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50',
    icon: '🤝'
  },
  {
    title: 'Vocal Tone Trend',
    key: 'vocal' as keyof TrendDataPoint,
    color: '#3b82f6',
    gradient: 'from-blue-400 to-indigo-500',
    bgGradient: 'from-blue-50 to-indigo-50',
    icon: '🎤'
  },
  {
    title: 'Word Power Trend',
    key: 'wordPower' as keyof TrendDataPoint,
    color: '#8b5cf6',
    gradient: 'from-purple-400 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50',
    icon: '💬'
  }
];

export function TrendChart({ data, isLoading = false }: TrendChartProps) {
  // Transform API data to chart format for each metric
  const getChartData = (metricKey: keyof TrendDataPoint) => {
    return data?.trend?.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short' }),
      score: item[metricKey]
    })).filter(item => item.score !== null) || [];
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {chartConfigs.map((config, index) => (
          <Card key={index} className={`bg-gradient-to-br ${config.bgGradient} border-0 shadow-xl`}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center space-x-3">
                <div className={`p-2 rounded-full bg-gradient-to-r ${config.gradient} shadow-lg`}>
                  <span className="text-xl filter drop-shadow-sm">{config.icon}</span>
                </div>
                <span className={`bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                  {config.title}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-white/60 backdrop-blur-sm rounded-lg mx-4 mb-4">
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse mx-auto mb-2"></div>
                  <div className="text-sm text-gray-600">Loading trend data...</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {chartConfigs.map((config, index) => {
        const chartData = getChartData(config.key);

        return (
          <Card key={index} className={`bg-gradient-to-br ${config.bgGradient} border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center space-x-3">
                <div className={`p-2 rounded-full bg-gradient-to-r ${config.gradient} shadow-lg`}>
                  <span className="text-xl filter drop-shadow-sm">{config.icon}</span>
                </div>
                <span className={`bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                  {config.title}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-white/60 backdrop-blur-sm rounded-lg mx-4 mb-4">
              {chartData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <defs>
                        <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={config.color} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={config.color} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                        domain={['dataMin - 5', 'dataMax + 5']}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(51, 65, 85, 0.95)',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                        }}
                        formatter={(value: number) => [Math.round(value), 'Score']}
                        labelFormatter={(label: string) => `Month: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke={config.color}
                        strokeWidth={3}
                        dot={{ fill: config.color, strokeWidth: 2, r: 4, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                        activeDot={{ r: 6, fill: config.color, stroke: '#ffffff', strokeWidth: 2 }}
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl text-gray-300 mb-2">📊</div>
                    <div className="text-sm text-gray-600">No trend data available</div>
                    <div className="text-xs text-gray-500 mt-1">Upload videos to see your progress</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}