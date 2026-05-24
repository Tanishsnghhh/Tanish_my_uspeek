'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { UserAnalytics } from '@/types/analytics';

interface ScoreCardsProps {
  data?: UserAnalytics | null;
  isLoading?: boolean;
}

const scoreCardConfig = [
  {
    title: 'Body Language Score',
    key: 'bodyLanguageAvg' as keyof UserAnalytics['scores'],
    icon: '🤝',
    gradient: 'from-emerald-400 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50'
  },
  {
    title: 'Vocal Tone Score',
    key: 'vocalAvg' as keyof UserAnalytics['scores'],
    icon: '🎤',
    gradient: 'from-blue-400 to-indigo-500',
    bgGradient: 'from-blue-50 to-indigo-50'
  },
  {
    title: 'Word Power Score',
    key: 'wordPowerAvg' as keyof UserAnalytics['scores'],
    icon: '💬',
    gradient: 'from-purple-400 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50'
  }
];

export function ScoreCards({ data, isLoading = false }: ScoreCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scoreCardConfig.map((item, index) => (
          <Card key={index} className={`bg-gradient-to-br ${item.bgGradient} border-0 shadow-xl`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                {item.title}
              </CardTitle>
              <div className={`text-3xl p-2 rounded-full bg-gradient-to-r ${item.gradient} shadow-lg`}>
                <span className="filter drop-shadow-sm">{item.icon}</span>
              </div>
            </CardHeader>
            <CardContent className="bg-white/60 backdrop-blur-sm rounded-lg mx-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-10 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="text-sm text-gray-600 font-medium mt-1">Loading...</div>
                </div>
                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {scoreCardConfig.map((item, index) => {
        const score = data?.scores[item.key];
        const displayValue = score !== null && score !== undefined ? Math.round(score) : null;
        
        return (
          <Card key={index} className={`bg-gradient-to-br ${item.bgGradient} border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                {item.title}
              </CardTitle>
              <div className={`text-3xl p-2 rounded-full bg-gradient-to-r ${item.gradient} shadow-lg`}>
                <span className="filter drop-shadow-sm">{item.icon}</span>
              </div>
            </CardHeader>
            <CardContent className="bg-white/60 backdrop-blur-sm rounded-lg mx-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-4xl font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                    {displayValue !== null ? displayValue : '—'}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {displayValue !== null ? 'out of 100' : 'No data'}
                  </div>
                </div>
                <div className="flex items-center space-x-1 bg-white/80 px-3 py-1 rounded-full shadow-md">
                  <Minus className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-400">
                    —
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}