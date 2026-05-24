'use client';

import { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface WeeklyData {
  week: number;
  weekLabel: string;
  dateRange: string;
  totalVideos: number;
  weeklyIncrease: number;
  regionBreakdown: {
    [region: string]: number;
  };
}

interface BasecampStatusData {
  weeklyData: WeeklyData[];
  regionTotals: {
    [region: string]: number[];
  };
  weeklyIncreases: {
    labels: string[];
    data: number[];
  };
  summary: {
    totalVideos: number;
    totalEmployees: number;
    activeRegions: string[];
    latestWeekIncrease: number;
    totalAnalyzedVideos: number;
    analysisRate: number;
  };
}

export function BasecampProgramStatus() {
  const { token } = useAuth();
  const [data, setData] = useState<BasecampStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/basecamp-status', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching basecamp status data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-blue-700 font-medium">Loading basecamp status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-700 font-medium mb-2">Failed to load basecamp status</p>
            <p className="text-red-600 text-sm">{error || 'Unknown error occurred'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Region color mapping
  const regionColors: { [key: string]: { border: string; background: string } } = {
    'SOUTH': { border: '#0ea5e9', background: 'rgba(14, 165, 233, 0.1)' },
    'NORTH': { border: '#eab308', background: 'rgba(234, 179, 8, 0.1)' },
    'EAST': { border: '#9333ea', background: 'rgba(147, 51, 234, 0.1)' },
    'WEST': { border: '#16a34a', background: 'rgba(22, 163, 74, 0.1)' },
    'CENTRAL': { border: '#dc2626', background: 'rgba(220, 38, 38, 0.1)' },
  };

  // Prepare Line Chart Data - Week on Week Videos Uploaded
  const lineChartData = {
    labels: data.weeklyData.map(w => w.weekLabel),
    datasets: [
      // All videos line
      {
        label: 'All',
        data: data.weeklyData.map(w => w.totalVideos),
        borderColor: '#1e3a8a',
        backgroundColor: 'rgba(30, 58, 138, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        pointBackgroundColor: '#1e3a8a',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
      },
      // Region-specific lines
      ...data.summary.activeRegions.map(region => ({
        label: region,
        data: data.regionTotals[region] || [],
        borderColor: regionColors[region]?.border || '#6b7280',
        backgroundColor: regionColors[region]?.background || 'rgba(107, 114, 128, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointBackgroundColor: regionColors[region]?.border || '#6b7280',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
      }))
    ],
  };

  // Prepare Bar Chart Data - Week on Week Increase
  const barChartData = {
    labels: data.weeklyIncreases.labels,
    datasets: [
      {
        label: 'Videos Uploaded',
        data: data.weeklyIncreases.data,
        backgroundColor: data.weeklyIncreases.data.map(() => 'rgba(59, 130, 246, 0.8)'),
        borderColor: data.weeklyIncreases.data.map(() => '#3b82f6'),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  // Calculate dynamic max values based on data
  const maxTotalVideos = Math.max(...data.weeklyData.map(w => w.totalVideos), 10);
  const maxWeeklyIncrease = Math.max(...data.weeklyIncreases.data, 10);

  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#fff',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          title: (context) => {
            const weekData = data.weeklyData[context[0].dataIndex];
            return weekData ? `Week ${weekData.week} (${weekData.dateRange})` : '';
          },
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y} videos`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.ceil(maxTotalVideos * 1.1),
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#666',
          font: {
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#666',
          font: {
            size: 11,
          },
        },
      },
    },
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart',
    },
  } as const;

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#fff',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          title: (context) => {
            return context[0].label;
          },
          label: (context) => {
            return `Videos: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.ceil(maxWeeklyIncrease * 1.2),
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#666',
          font: {
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#666',
          font: {
            size: 10,
          },
          maxRotation: 45,
        },
      },
    },
    animation: {
      duration: 1200,
      easing: 'easeInOutQuart',
    },
  } as const;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-blue-800 text-center">
          Basecamp Program Overall Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm text-center">
            <h4 className="text-sm font-semibold text-blue-700 mb-1">Total Videos</h4>
            <p className="text-2xl font-bold text-blue-800">{data.summary.totalVideos}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm text-center">
            <h4 className="text-sm font-semibold text-blue-700 mb-1">Active Employees</h4>
            <p className="text-2xl font-bold text-blue-800">{data.summary.totalEmployees}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm text-center">
            <h4 className="text-sm font-semibold text-blue-700 mb-1">Analyzed Videos</h4>
            <p className="text-2xl font-bold text-blue-800">{data.summary.totalAnalyzedVideos}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm text-center">
            <h4 className="text-sm font-semibold text-blue-700 mb-1">Analysis Rate</h4>
            <p className="text-2xl font-bold text-blue-800">{data.summary.analysisRate}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart - Trend chart of Week on Week Videos Uploaded */}
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Trend chart of Week on Week Videos Uploaded
            </h3>
            <div className="h-80">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          {/* Bar Chart - Week on week Increase in the number of videos */}
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Week on week Increase in the number of videos
            </h3>
            <div className="h-80">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>
        </div>

        {/* Active Regions */}
        {data.summary.activeRegions.length > 0 && (
          <div className="mt-6 bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Active Regions</h3>
            <div className="flex flex-wrap gap-2">
              {data.summary.activeRegions.map(region => (
                <span
                  key={region}
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: regionColors[region]?.background || 'rgba(107, 114, 128, 0.1)',
                    color: regionColors[region]?.border || '#6b7280'
                  }}
                >
                  {region}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
