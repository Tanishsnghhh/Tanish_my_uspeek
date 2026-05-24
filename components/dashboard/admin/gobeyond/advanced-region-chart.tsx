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
  avgOverallImprovement: number;
  businessUnits: number;
  participants: number;
}

export function AdvancedRegionChart() {
  const chartRef = useRef<any>(null);
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highestRegion, setHighestRegion] = useState<string>('');
  const [highestBusiness, setHighestBusiness] = useState<string>('');

  useEffect(() => {
    const fetchRegionData = async () => {
      try {
        const response = await fetch('/api/dashboard/admin/chart-data');
        if (!response.ok) {
          throw new Error('Failed to fetch region data');
        }
        const result = await response.json();
        
        if (result.success && result.data.regions && result.data.regions.length > 0) {
          // Sort by performance and limit to top 10 regions for scalability
          const sortedRegions = result.data.regions
            .sort((a: RegionData, b: RegionData) => b.avgOverallImprovement - a.avgOverallImprovement)
            .slice(0, 10);
          setRegionData(sortedRegions);
          
          // Find highest performing region
          const highestRegionData = result.data.regions.reduce((max: RegionData, current: RegionData) => 
            current.avgOverallImprovement > max.avgOverallImprovement ? current : max
          );
          setHighestRegion(highestRegionData.region);
          
          // Find highest performing business unit
          if (result.data.businessUnits && result.data.businessUnits.length > 0) {
            const highestBusinessData = result.data.businessUnits.reduce((max: any, current: any) => 
              current.improvementRate > max.improvementRate ? current : max
            );
            setHighestBusiness(highestBusinessData.name);
          }
        } else {
          setRegionData([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRegionData();
  }, []);

  // Generate dynamic colors based on data length
  const generateColors = (length: number) => {
    const baseColors = [
      { bg: 'rgba(67, 233, 123, 0.8)', border: '#4caf50', hover: 'rgba(67, 233, 123, 0.9)' },  // Green
      { bg: 'rgba(79, 172, 254, 0.8)', border: '#2196f3', hover: 'rgba(79, 172, 254, 0.9)' },  // Blue
      { bg: 'rgba(245, 87, 108, 0.8)', border: '#e91e63', hover: 'rgba(245, 87, 108, 0.9)' },  // Pink
      { bg: 'rgba(102, 126, 234, 0.8)', border: '#5a6fcf', hover: 'rgba(102, 126, 234, 0.9)' }, // Purple
      { bg: 'rgba(255, 193, 7, 0.8)', border: '#ff9800', hover: 'rgba(255, 193, 7, 0.9)' },   // Amber
      { bg: 'rgba(156, 39, 176, 0.8)', border: '#9c27b0', hover: 'rgba(156, 39, 176, 0.9)' },  // Deep Purple
      { bg: 'rgba(0, 188, 212, 0.8)', border: '#00bcd4', hover: 'rgba(0, 188, 212, 0.9)' },   // Cyan
      { bg: 'rgba(205, 220, 57, 0.8)', border: '#cddc39', hover: 'rgba(205, 220, 57, 0.9)' },  // Lime
    ];

    const colors = [];
    for (let i = 0; i < length; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  };

  const colors = generateColors(regionData.length);

  // Calculate baseline rates for regions (can be adjusted based on requirements)
  const getBaselineRate = (regionName: string) => {
    const baselines: { [key: string]: number } = {
      'ALL': 25,
      'NORTH': 22,
      'SOUTH': 28,
      'EAST': 20,
      'WEST': 24,
      'CENTRAL': 26
    };
    return baselines[regionName.toUpperCase()] || 25;
  };

  // Create grouped bar chart data (Baseline and Go Beyond for each region)
  const data = {
    labels: regionData.map(item => item.region.toUpperCase()),
    datasets: [
      {
        label: 'Baseline',
        data: regionData.map(item => getBaselineRate(item.region)),
        backgroundColor: colors.map(c => c.bg.replace('0.8', '0.6')), // Lighter for baseline
        borderColor: colors.map(c => c.border),
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 20,
      },
      {
        label: 'Go Beyond',
        data: regionData.map(item => item.avgOverallImprovement),
        backgroundColor: colors.map(c => c.bg), // Full color for go beyond
        borderColor: colors.map(c => c.border),
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 20,
      },
    ],
  };

  const maxValue = regionData.length > 0 ? Math.max(...regionData.map(item => item.avgOverallImprovement)) : 35;
  const chartMax = Math.ceil(maxValue * 1.1); // Add 10% padding

  const options = {
    indexAxis: 'y' as const, // This makes it a horizontal bar chart
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
            const region = regionData[context.dataIndex];
            const label = context.dataset.label === 'Baseline' ? 'Baseline Target' : 'Current Performance';
            return [
              `${label}: ${context.parsed.x}%`,
              region ? `Business Units: ${region.businessUnits}` : '',
              region ? `Participants: ${region.participants}` : ''
            ].filter(Boolean);
          },
          labelColor: function(context: any) {
            return {
              borderColor: context.dataset.borderColor[context.dataIndex] || '#6B7280',
              backgroundColor: context.dataset.borderColor[context.dataIndex] || '#6B7280',
            };
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: chartMax,
        ticks: {
          stepSize: Math.max(5, Math.ceil(chartMax / 10)),
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
          color: 'rgba(147, 197, 253, 0.3)',
          drawBorder: false,
          lineWidth: 1,
        },
      },
      y: {
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
      <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Improvement % Rate by Region
          </CardTitle>
          <p className="text-center text-sm text-gray-600">
            Loading region data...
          </p>
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
            Improvement % Rate by Region
          </CardTitle>
          <p className="text-center text-sm text-red-500">
            Error loading region data: {error}
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-80 w-full flex items-center justify-center">
            <p className="text-gray-500">Unable to load chart data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Improvement % Rate by Region
        </CardTitle>
        <p className="text-center text-sm text-gray-600">
          Top performing regions - Baseline vs Go Beyond comparison
        </p>
      </CardHeader>
      <CardContent className="p-6">
        {regionData.length > 0 ? (
          <div className="relative w-full">
            <div
              className={`overflow-y-auto ${regionData.length > 8 ? 'max-h-96' : ''}`}
              style={{
                height: regionData.length > 8
                  ? '400px'
                  : `${Math.max(300, regionData.length * 50)}px`
              }}
            >
              <Bar
                key={`region-chart-${regionData.length}`}
                ref={chartRef}
                data={data}
                options={options}
              />
            </div>
            {regionData.length > 8 && (
              <div className="text-center text-xs text-gray-500 mt-2">
                Scroll to see all {regionData.length} regions
              </div>
            )}
          </div>
        ) : (
          <div className="h-80 w-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-500 text-lg mb-2">No region data available</p>
              <p className="text-gray-400 text-sm">Region data will appear here once available</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
