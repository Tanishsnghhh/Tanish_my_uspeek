'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAuth } from '@/hooks/use-auth';

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
  baselineScore: number;
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
  const [error, setError] = useState<string | null>(null);

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
      } catch (err) {
        console.error('Error fetching improvement data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [token]);

  // Calculate baseline scores (can be adjusted based on your requirements)
  const getBaselineScore = (data: OverallImprovementData | null) => {
    return data?.baselineScore || 40;
  };

  // Create grouped bar chart data for all three improvement metrics
  const data = {
    labels: ['Body Language', 'Vocal Tone', 'Word Power'],
    datasets: [
      {
        label: 'Baseline',
        data: [
          getBaselineScore(bodyLanguageData),
          getBaselineScore(vocalToneData),
          getBaselineScore(wordPowerData)
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)',   // Lighter green for body language baseline
          'rgba(59, 130, 246, 0.6)',  // Lighter blue for vocal tone baseline
          'rgba(168, 85, 247, 0.6)'   // Lighter purple for word power baseline
        ],
        borderColor: ['#16a34a', '#2563eb', '#a855f7'],
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 25,
      },
      {
        label: 'Go Beyond',
        data: [
          bodyLanguageData?.averageScore || 0,
          vocalToneData?.averageScore || 0,
          wordPowerData?.averageScore || 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // Full green for body language current
          'rgba(59, 130, 246, 0.8)',  // Full blue for vocal tone current
          'rgba(168, 85, 247, 0.8)'   // Full purple for word power current
        ],
        borderColor: ['#16a34a', '#2563eb', '#a855f7'],
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 25,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold' as const,
          }
        }
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
          label: function(context: any) {
            const metricIndex = context.dataIndex;
            const metricData = [
              { name: 'Body Language', data: bodyLanguageData },
              { name: 'Vocal Tone', data: vocalToneData },
              { name: 'Word Power', data: wordPowerData }
            ][metricIndex];

            const label = context.dataset.label === 'Baseline' ? 'Baseline Target' : 'Current Performance';
            const score = context.parsed.y;

            return [
              `${label}: ${score}%`,
              `Videos: ${metricData?.data?.totalVideos || 0}`,
              `Users: ${metricData?.data?.usersAnalyzed || 0}`
            ];
          },
          labelColor: function(context: any) {
            const colors = ['#16a34a', '#2563eb', '#a855f7'];
            return {
              borderColor: colors[context.dataIndex] || '#6B7280',
              backgroundColor: colors[context.dataIndex] || '#6B7280',
            };
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#374151',
          font: {
            size: 12,
            weight: 'normal' as const,
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        max: Math.max(100, Math.ceil(Math.max(
          bodyLanguageData?.averageScore || 0,
          vocalToneData?.averageScore || 0,
          wordPowerData?.averageScore || 0,
          getBaselineScore(bodyLanguageData),
          getBaselineScore(vocalToneData),
          getBaselineScore(wordPowerData)
        ) * 1.1)),
        ticks: {
          stepSize: 10,
          color: '#6B7280',
          font: {
            size: 12,
            weight: 'normal' as const,
          },
          callback: function(value: any) {
            return value + '%';
          }
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.3)',
          drawBorder: false,
          lineWidth: 1,
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

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
            Communication Skills Improvement
          </CardTitle>
          <p className="text-center text-sm text-red-500">
            Error loading improvement data: {error}
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-96 w-full flex items-center justify-center">
            <p className="text-gray-500">Unable to load chart data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Body Language Improvement */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Body Language
          </CardTitle>
          <div className="text-center">
            <span className="text-3xl font-bold text-emerald-600">
              {bodyLanguageData?.averageScore || 0}%
            </span>
            <p className="text-sm text-gray-600 mt-1">Current Performance</p>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{bodyLanguageData?.totalVideos || 0} videos</span>
              <span>{bodyLanguageData?.usersAnalyzed || 0} users</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="relative w-full" style={{ height: '200px' }}>
            <Bar
              data={{
                labels: ['Baseline', 'Go Beyond'],
                datasets: [
                  {
                    label: 'Performance',
                    data: [
                      getBaselineScore(bodyLanguageData),
                      bodyLanguageData?.averageScore || 0
                    ],
                    backgroundColor: [
                      'rgba(34, 197, 94, 0.6)',
                      'rgba(34, 197, 94, 0.8)'
                    ],
                    borderColor: ['#16a34a', '#16a34a'],
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                    barThickness: 40,
                  },
                ],
              }}
              options={{
                indexAxis: 'y' as const,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    cornerRadius: 12,
                    padding: 12,
                    callbacks: {
                      label: function(context: any) {
                        const labels = ['Baseline Target', 'Current Performance'];
                        return `${labels[context.dataIndex]}: ${context.parsed.x}%`;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    max: Math.max(100, (bodyLanguageData?.averageScore || 0) * 1.2, getBaselineScore(bodyLanguageData) * 1.2),
                    ticks: {
                      callback: function(value: any) {
                        return value + '%';
                      }
                    },
                    grid: {
                      color: 'rgba(34, 197, 94, 0.3)',
                      lineWidth: 1,
                    },
                  },
                  y: {
                    ticks: { display: false },
                    grid: { display: false }
                  }
                },
                animation: {
                  duration: 1500,
                  delay: 0
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vocal Tone Improvement */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Vocal Tone
          </CardTitle>
          <div className="text-center">
            <span className="text-3xl font-bold text-blue-600">
              {vocalToneData?.averageScore || 0}%
            </span>
            <p className="text-sm text-gray-600 mt-1">Current Performance</p>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{vocalToneData?.totalVideos || 0} videos</span>
              <span>{vocalToneData?.usersAnalyzed || 0} users</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="relative w-full" style={{ height: '200px' }}>
            <Bar
              data={{
                labels: ['Baseline', 'Go Beyond'],
                datasets: [
                  {
                    label: 'Performance',
                    data: [
                      getBaselineScore(vocalToneData),
                      vocalToneData?.averageScore || 0
                    ],
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.6)',
                      'rgba(59, 130, 246, 0.8)'
                    ],
                    borderColor: ['#2563eb', '#2563eb'],
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                    barThickness: 40,
                  },
                ],
              }}
              options={{
                indexAxis: 'y' as const,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    cornerRadius: 12,
                    padding: 12,
                    callbacks: {
                      label: function(context: any) {
                        const labels = ['Baseline Target', 'Current Performance'];
                        return `${labels[context.dataIndex]}: ${context.parsed.x}%`;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    max: Math.max(100, (vocalToneData?.averageScore || 0) * 1.2, getBaselineScore(vocalToneData) * 1.2),
                    ticks: {
                      callback: function(value: any) {
                        return value + '%';
                      }
                    },
                    grid: {
                      color: 'rgba(59, 130, 246, 0.3)',
                      lineWidth: 1,
                    },
                  },
                  y: {
                    ticks: { display: false },
                    grid: { display: false }
                  }
                },
                animation: {
                  duration: 1500,
                  delay: 200
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Word Power Improvement */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Word Power
          </CardTitle>
          <div className="text-center">
            <span className="text-3xl font-bold text-purple-600">
              {wordPowerData?.averageScore || 0}%
            </span>
            <p className="text-sm text-gray-600 mt-1">Current Performance</p>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{wordPowerData?.totalVideos || 0} videos</span>
              <span>{wordPowerData?.usersAnalyzed || 0} users</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="relative w-full" style={{ height: '200px' }}>
            <Bar
              data={{
                labels: ['Baseline', 'Go Beyond'],
                datasets: [
                  {
                    label: 'Performance',
                    data: [
                      getBaselineScore(wordPowerData),
                      wordPowerData?.averageScore || 0
                    ],
                    backgroundColor: [
                      'rgba(168, 85, 247, 0.6)',
                      'rgba(168, 85, 247, 0.8)'
                    ],
                    borderColor: ['#a855f7', '#a855f7'],
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                    barThickness: 40,
                  },
                ],
              }}
              options={{
                indexAxis: 'y' as const,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    cornerRadius: 12,
                    padding: 12,
                    callbacks: {
                      label: function(context: any) {
                        const labels = ['Baseline Target', 'Current Performance'];
                        return `${labels[context.dataIndex]}: ${context.parsed.x}%`;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    max: Math.max(100, (wordPowerData?.averageScore || 0) * 1.2, getBaselineScore(wordPowerData) * 1.2),
                    ticks: {
                      callback: function(value: any) {
                        return value + '%';
                      }
                    },
                    grid: {
                      color: 'rgba(168, 85, 247, 0.3)',
                      lineWidth: 1,
                    },
                  },
                  y: {
                    ticks: { display: false },
                    grid: { display: false }
                  }
                },
                animation: {
                  duration: 1500,
                  delay: 400
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
