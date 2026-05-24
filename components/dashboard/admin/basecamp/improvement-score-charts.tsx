'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface OverallImprovementData {
  improvementRate: number;
  totalVideos: number;
  averageScore: number;
  usersAnalyzed: number;
}

export function ImprovementScoreCharts() {
  const { token } = useAuth();
  const bodyLanguageRef = useRef<any>(null);
  const vocalToneRef = useRef<any>(null);
  const wordPowerRef = useRef<any>(null);

  const [bodyLanguageData, setBodyLanguageData] = useState<OverallImprovementData | null>(null);
  const [vocalToneData, setVocalToneData] = useState<OverallImprovementData | null>(null);
  const [wordPowerData, setWordPowerData] = useState<OverallImprovementData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!token) return;
      
      try {
        setLoading(true);

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Fetch all three improvement datasets
        const [bodyLanguageResponse, vocalToneResponse, wordPowerResponse] = await Promise.all([
          fetch('/api/dashboard/body-language-improvement', { headers }),
          fetch('/api/dashboard/vocal-tone-improvement', { headers }),
          fetch('/api/dashboard/word-power-improvement', { headers })
        ]);

        if (bodyLanguageResponse.ok) {
          const bodyLanguageResult = await bodyLanguageResponse.json();
          setBodyLanguageData(bodyLanguageResult);
        }

        if (vocalToneResponse.ok) {
          const vocalToneResult = await vocalToneResponse.json();
          setVocalToneData(vocalToneResult);
        }

        if (wordPowerResponse.ok) {
          const wordPowerResult = await wordPowerResponse.json();
          setWordPowerData(wordPowerResult);
        }
      } catch (error) {
        console.error('Error fetching improvement data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [token]);

  // Create single bar chart data for each metric
  const createSingleBarData = (value: number, color: string, borderColor: string) => ({
    labels: ['Average Score'],
    datasets: [
      {
        label: 'Average Score',
        data: [value],
        backgroundColor: [color],
        borderColor: [borderColor],
        borderWidth: 2,
        borderRadius: 12,
        borderSkipped: false,
        hoverBackgroundColor: [color.replace('0.8', '0.9')],
        hoverBorderColor: [borderColor],
        hoverBorderWidth: 3,
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        cornerRadius: 12,
        padding: 12,
        displayColors: true,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function (context: any) {
            return `Average Score: ${context.parsed.y}`;
          },
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          color: '#6B7280',
          font: {
            size: 12,
            weight: 'normal' as const,
          },
          callback: function (value: any) {
            return value;
          }
        },
        grid: {
          color: 'rgba(229, 231, 235, 0.3)',
          drawBorder: false,
          lineWidth: 1,
        },
      },
      x: {
        ticks: {
          color: '#374151',
          font: {
            size: 11,
            weight: 'normal' as const,
          },
        },
        grid: {
          display: false,
        },
      },
    },
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 10,
        right: 10,
      },
    },
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart' as const,
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  } as const;

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-center text-gray-400">
                Loading...
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64 w-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Body Language Improvement */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            BODY LANGUAGE IMPROVEMENT
          </CardTitle>
          <div className="text-center">
            <span className="text-3xl font-bold text-emerald-600">
              {bodyLanguageData?.averageScore || 0}
            </span>
            <p className="text-sm text-gray-600 mt-1">Average Score</p>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{bodyLanguageData?.totalVideos || 0} videos</span>
              <span>{bodyLanguageData?.usersAnalyzed || 0} users</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-64 w-full">
            <Bar
              ref={bodyLanguageRef}
              data={createSingleBarData(
                bodyLanguageData?.averageScore || 0,
                'rgba(34, 197, 94, 0.8)',
                '#16a34a'
              )}
              options={chartOptions}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vocal Tone Improvement */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            VOCAL TONE IMPROVEMENT
          </CardTitle>
          <div className="text-center">
            <span className="text-3xl font-bold text-blue-600">
              {vocalToneData?.averageScore || 0}
            </span>
            <p className="text-sm text-gray-600 mt-1">Average Score</p>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{vocalToneData?.totalVideos || 0} videos</span>
              <span>{vocalToneData?.usersAnalyzed || 0} users</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-64 w-full">
            <Bar
              ref={vocalToneRef}
              data={createSingleBarData(
                vocalToneData?.averageScore || 0,
                'rgba(59, 130, 246, 0.8)',
                '#3b82f6'
              )}
              options={chartOptions}
            />
          </div>
        </CardContent>
      </Card>

      {/* Word Power Improvement */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            WORD POWER IMPROVEMENT
          </CardTitle>
          <div className="text-center">
            <span className="text-3xl font-bold text-purple-600">
              {wordPowerData?.averageScore || 0}
            </span>
            <p className="text-sm text-gray-600 mt-1">Average Score</p>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{wordPowerData?.totalVideos || 0} videos</span>
              <span>{wordPowerData?.usersAnalyzed || 0} users</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-64 w-full">
            <Bar
              ref={wordPowerRef}
              data={createSingleBarData(
                wordPowerData?.averageScore || 0,
                'rgba(168, 85, 247, 0.8)',
                '#a855f7'
              )}
              options={chartOptions}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}