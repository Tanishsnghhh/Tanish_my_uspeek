'use client';

import { useRef, useState, useEffect } from 'react';
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

interface RegionData {
  region: string;
  improvementRate: number;
  totalEmployees: number;
  averageScore: number;
}

export function RegionImprovementChart() {
  const { token } = useAuth();
  const chartRef = useRef<any>(null);
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllRegions, setShowAllRegions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const regionsPerPage = 12;

  // Process region data for display
  const processRegionData = (data: RegionData[]) => {
    if (!showAllRegions) {
      // Sort by improvement rate descending
      const sortedData = [...data].sort((a, b) => b.improvementRate - a.improvementRate);
      
      if (sortedData.length <= 10) {
        return sortedData;
      }
      
      // Take top 10 regions
      const topRegions = sortedData.slice(0, 10);
      
      // Calculate "Others" aggregate
      const otherRegions = sortedData.slice(10);
      const totalOtherEmployees = otherRegions.reduce((sum, region) => sum + region.totalEmployees, 0);
      const weightedImprovementRate = otherRegions.reduce((sum, region) => 
        sum + (region.improvementRate * region.totalEmployees), 0
      );
      const avgImprovementRate = totalOtherEmployees > 0 
        ? Math.round(weightedImprovementRate / totalOtherEmployees) 
        : 0;
      
      const othersRegion: RegionData = {
        region: `Others (${otherRegions.length} regions)`,
        improvementRate: avgImprovementRate,
        totalEmployees: totalOtherEmployees,
        averageScore: Math.round(otherRegions.reduce((sum, region) => 
          sum + region.averageScore, 0) / otherRegions.length) || 0
      };
      
      return [...topRegions, othersRegion];
    } else {
      // Show all regions with pagination
      const sortedData = [...data].sort((a, b) => b.improvementRate - a.improvementRate);
      const startIndex = (currentPage - 1) * regionsPerPage;
      const endIndex = startIndex + regionsPerPage;
      return sortedData.slice(startIndex, endIndex);
    }
  };

  const processedData = processRegionData(regionData);
  const totalPages = Math.ceil(regionData.length / regionsPerPage);

  useEffect(() => {
    const fetchRegionData = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/region-improvement', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch region data');
        }
        const data = await response.json();
        setRegionData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching region data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRegionData();
  }, [token]);

  const data = {
    labels: processedData.map(item => item.region),
    datasets: [
      {
        label: 'Improvement Rate (%)',
        data: processedData.map(item => item.improvementRate),
        backgroundColor: processedData.map((_, index) => {
          const colors = [
            'rgba(102, 126, 234, 0.8)', // Purple
            'rgba(245, 87, 108, 0.8)',  // Pink
            'rgba(79, 172, 254, 0.8)',  // Blue
            'rgba(67, 233, 123, 0.8)',  // Green
            'rgba(255, 193, 7, 0.8)',   // Yellow
            'rgba(156, 39, 176, 0.8)',  // Purple
            'rgba(255, 87, 34, 0.8)',   // Orange
            'rgba(0, 188, 212, 0.8)',   // Cyan
            'rgba(76, 175, 80, 0.8)',   // Light Green
            'rgba(255, 152, 0, 0.8)',   // Amber
            'rgba(121, 85, 72, 0.8)',   // Brown (for Others)
          ];
          return colors[index % colors.length];
        }),
        borderColor: processedData.map((_, index) => {
          const borderColors = [
            '#5a6fcf',
            '#e91e63',
            '#2196f3',
            '#4caf50',
            '#ff9800',
            '#9c27b0',
            '#ff5722',
            '#00bcd4',
            '#4caf50',
            '#ff9800',
            '#795548',
          ];
          return borderColors[index % borderColors.length];
        }),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: processedData.map((_, index) => {
          const hoverColors = [
            'rgba(102, 126, 234, 0.9)',
            'rgba(245, 87, 108, 0.9)',
            'rgba(79, 172, 254, 0.9)',
            'rgba(67, 233, 123, 0.9)',
            'rgba(255, 193, 7, 0.9)',
            'rgba(156, 39, 176, 0.9)',
            'rgba(255, 87, 34, 0.9)',
            'rgba(0, 188, 212, 0.9)',
            'rgba(76, 175, 80, 0.9)',
            'rgba(255, 152, 0, 0.9)',
            'rgba(121, 85, 72, 0.9)',
          ];
          return hoverColors[index % hoverColors.length];
        }),
        hoverBorderColor: processedData.map((_, index) => {
          const hoverBorderColors = [
            '#5a6fcf',
            '#e91e63',
            '#2196f3',
            '#4caf50',
            '#ff9800',
            '#9c27b0',
            '#ff5722',
            '#00bcd4',
            '#4caf50',
            '#ff9800',
            '#795548',
          ];
          return hoverBorderColors[index % hoverBorderColors.length];
        }),
        hoverBorderWidth: 3,
      },
    ],
  };

  const options = {
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
        cornerRadius: 12,
        padding: 12,
        displayColors: true,
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
            const regionInfo = processedData[context.dataIndex];
            return [
              `Improvement Rate: ${context.parsed.y}%`,
              `Total Employees: ${regionInfo?.totalEmployees || 0}`,
              `Average Score: ${regionInfo?.averageScore || 0}`
            ];
          },
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 45,
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
          color: 'rgba(229, 231, 235, 0.3)',
          drawBorder: false,
          lineWidth: 1,
        },
      },
      x: {
        ticks: {
          color: '#374151',
          font: {
            size: processedData.length > 10 ? 10 : 12,
            weight: 'normal' as const,
          },
          maxRotation: processedData.length > 10 ? 45 : 0,
          minRotation: processedData.length > 10 ? 45 : 0,
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
      delay: (context: any) => context.dataIndex * 200,
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  } as const;

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Improvement Rates by Region
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-80 w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Improvement Rates by Region
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-80 w-full flex items-center justify-center">
            <div className="text-red-500 text-center">
              <p className="text-lg font-semibold">Error loading data</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Improvement Rates by Region
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="w-full" style={{ height: `${Math.max(320, processedData.length * 25)}px` }}>
          <Bar ref={chartRef} data={data} options={options} />
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 mb-4 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setShowAllRegions(!showAllRegions);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 text-sm font-medium shadow-lg"
            >
              {showAllRegions ? 'Show Top Regions' : 'Show All Regions'}
            </button>
            {regionData.length > 0 && (
              <span className="text-sm text-gray-600">
                Showing {processedData.length} of {regionData.length} regions
              </span>
            )}
          </div>
          
          {showAllRegions && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                ‹ Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next ›
              </button>
            </div>
          )}
        </div>
        
        {/* Display values with dynamic grid based on data length */}
        <div className={`grid gap-4 mt-6 ${processedData.length <= 4 ? `grid-cols-${processedData.length}` : processedData.length <= 6 ? 'grid-cols-3' : processedData.length <= 8 ? 'grid-cols-4' : 'grid-cols-5'}`}>
          {processedData.map((regionItem, index) => {
            const colors = [
              'from-purple-500 to-indigo-600',
              'from-pink-500 to-red-500',
              'from-blue-500 to-cyan-500',
              'from-green-500 to-teal-500',
              'from-orange-500 to-yellow-500',
              'from-teal-500 to-cyan-500',
              'from-red-500 to-pink-500',
              'from-indigo-500 to-purple-500',
              'from-cyan-500 to-blue-500',
              'from-yellow-500 to-orange-500',
              'from-gray-500 to-slate-500', // For Others
            ];
            const bgColors = [
              'from-purple-50 to-indigo-50',
              'from-pink-50 to-red-50',
              'from-blue-50 to-cyan-50',
              'from-green-50 to-teal-50',
              'from-orange-50 to-yellow-50',
              'from-teal-50 to-cyan-50',
              'from-red-50 to-pink-50',
              'from-indigo-50 to-purple-50',
              'from-cyan-50 to-blue-50',
              'from-yellow-50 to-orange-50',
              'from-gray-50 to-slate-50', // For Others
            ];
            const colorIndex = index % colors.length;
            
            return (
              <div key={regionItem.region} className={`text-center p-3 rounded-xl bg-gradient-to-br ${bgColors[colorIndex]} border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300`}>
                <div className={`text-xl font-bold bg-gradient-to-r ${colors[colorIndex]} bg-clip-text text-transparent mb-1`}>
                  {regionItem.improvementRate}%
                </div>
                <div className="text-xs text-gray-700 font-semibold mb-1">
                  {regionItem.region.length > 15 ? `${regionItem.region.substring(0, 12)}...` : regionItem.region}
                </div>
                <div className="text-xs text-gray-500">
                  {regionItem.totalEmployees} employees
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
