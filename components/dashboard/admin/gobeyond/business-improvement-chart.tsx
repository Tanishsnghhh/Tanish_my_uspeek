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

interface BusinessUnitData {
  name: string;
  region: string;
  improvementRate: number;
  participants: number;
}

export function BusinessImprovementChart() {
  const chartRef = useRef<any>(null);
  const [businessData, setBusinessData] = useState<BusinessUnitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        const response = await fetch('/api/dashboard/admin/chart-data');
        if (!response.ok) {
          throw new Error('Failed to fetch business data');
        }
        const result = await response.json();

        if (result.success && result.data.businessUnits && result.data.businessUnits.length > 0) {
          // Filter out business units with no participants and zero improvement rate
          // Also limit to top 20 for performance with large datasets
          const filteredData = result.data.businessUnits
            .filter((unit: BusinessUnitData) =>
              unit.participants > 0 || unit.improvementRate > 0
            )
            .sort((a: BusinessUnitData, b: BusinessUnitData) => b.improvementRate - a.improvementRate) // Sort by performance
            .slice(0, 20); // Limit to top 20 for scalability
          setBusinessData(filteredData);
        } else {
          setBusinessData([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, []);

  // Generate dynamic colors based on data length
  const generateColors = (length: number) => {
    const baseColors = [
      { bg: 'rgba(255, 87, 34, 0.8)', border: '#ff5722', hover: 'rgba(255, 87, 34, 0.9)' },   // Deep Orange
      { bg: 'rgba(76, 175, 80, 0.8)', border: '#4caf50', hover: 'rgba(76, 175, 80, 0.9)' },   // Green
      { bg: 'rgba(233, 30, 99, 0.8)', border: '#e91e63', hover: 'rgba(233, 30, 99, 0.9)' },   // Pink
      { bg: 'rgba(63, 81, 181, 0.8)', border: '#3f51b5', hover: 'rgba(63, 81, 181, 0.9)' },   // Indigo
      { bg: 'rgba(255, 152, 0, 0.8)', border: '#ff9800', hover: 'rgba(255, 152, 0, 0.9)' },   // Orange
      { bg: 'rgba(156, 39, 176, 0.8)', border: '#9c27b0', hover: 'rgba(156, 39, 176, 0.9)' },  // Purple
      { bg: 'rgba(0, 188, 212, 0.8)', border: '#00bcd4', hover: 'rgba(0, 188, 212, 0.9)' },   // Cyan
      { bg: 'rgba(205, 220, 57, 0.8)', border: '#cddc39', hover: 'rgba(205, 220, 57, 0.9)' },  // Lime
      { bg: 'rgba(121, 85, 72, 0.8)', border: '#795548', hover: 'rgba(121, 85, 72, 0.9)' },   // Brown
      { bg: 'rgba(96, 125, 139, 0.8)', border: '#607d8b', hover: 'rgba(96, 125, 139, 0.9)' }, // Blue Grey
      { bg: 'rgba(255, 235, 59, 0.8)', border: '#ffeb3b', hover: 'rgba(255, 235, 59, 0.9)' },  // Yellow
      { bg: 'rgba(244, 67, 54, 0.8)', border: '#f44336', hover: 'rgba(244, 67, 54, 0.9)' },   // Red
    ];

    const colors = [];
    for (let i = 0; i < length; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  };

  const colors = generateColors(businessData.length);

  // Calculate baseline rates for business units (can be adjusted based on requirements)
  const getBaselineRate = (businessName: string, region: string) => {
    // Different baselines based on business type and region
    const businessBaselines: { [key: string]: number } = {
      'TANISHQ': 35,
      'ACQUIRING': 30,
      'CARDS': 32,
      'INDUSTRY': 28,
      'RETAIL': 33,
      'DIGITAL': 38
    };

    // Check for business name matches
    for (const [key, value] of Object.entries(businessBaselines)) {
      if (businessName.toUpperCase().includes(key)) {
        return value;
      }
    }

    // Fallback to region-based baseline
    const regionBaselines: { [key: string]: number } = {
      'ALL': 30,
      'NORTH': 28,
      'SOUTH': 32,
      'EAST': 25,
      'WEST': 29,
      'CENTRAL': 31
    };

    return regionBaselines[region.toUpperCase()] || 30;
  };

  // Create grouped bar chart data (Baseline and Go Beyond for each business)
  const data = {
    labels: businessData.map(item => item.name.length > 15 ? item.name.substring(0, 12) + '...' : item.name),
    datasets: [
      {
        label: 'Baseline',
        data: businessData.map(item => getBaselineRate(item.name, item.region)),
        backgroundColor: colors.map(c => c.bg.replace('0.8', '0.6')), // Lighter for baseline
        borderColor: colors.map(c => c.border),
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 16,
      },
      {
        label: 'Go Beyond',
        data: businessData.map(item => item.improvementRate),
        backgroundColor: colors.map(c => c.bg), // Full color for go beyond
        borderColor: colors.map(c => c.border),
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 16,
      },
    ],
  };

  const maxValue = businessData.length > 0 ? Math.max(...businessData.map(item => item.improvementRate)) : 30;
  const chartMax = Math.max(30, Math.ceil(maxValue * 1.2)); // Ensure minimum of 30% and add 20% padding

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
            const business = businessData[context.dataIndex];
            const label = context.dataset.label === 'Baseline' ? 'Baseline Target' : 'Current Performance';
            return [
              `${label}: ${context.parsed.x}%`,
              business ? `Region: ${business.region}` : '',
              business ? `Participants: ${business.participants}` : ''
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
          color: 'rgba(251, 146, 60, 0.3)',
          drawBorder: false,
          lineWidth: 1,
        },
      },
      y: {
        ticks: {
          color: '#374151',
          font: {
            size: 11,
            weight: 'normal' as const,
          },
          // Truncate long business names and handle empty data
          callback: function(value: any, index: any): string {
            const label = businessData[index]?.name || `Business ${index + 1}`;
            return label.length > 20 ? label.substring(0, 17) + '...' : label;
          }
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
      <Card className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            Improvement Rate % by Business
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-96 w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            Improvement Rate % by Business
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-96 w-full flex items-center justify-center">
            <p className="text-gray-500">Error loading chart data: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
          Improvement Rate % by Business
        </CardTitle>
        <p className="text-center text-sm text-gray-600">
          Top performing business units - Baseline vs Go Beyond comparison
        </p>
      </CardHeader>
      <CardContent className={`p-6 ${businessData.length > 8 ? 'overflow-y-auto' : ''}`} style={businessData.length > 8 ? { maxHeight: '600px' } : {}}>
        {businessData.length > 0 ? (
          <div className="relative w-full" style={{ height: `${Math.max(400, Math.min(800, businessData.length * 40))}px` }}>
            <Bar
              key={`business-chart-${businessData.length}`}
              ref={chartRef}
              data={data}
              options={options}
            />
          </div>
        ) : (
          <div className="h-96 w-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-500 text-lg mb-2">No business improvement data available</p>
              <p className="text-gray-400 text-sm">Business units with active participants will appear here</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
