'use client';

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3, Clock, Video, Award } from 'lucide-react';

// Type definitions for chart data
interface TrendDataPoint {
  date: string;
  avgScore?: number;
  timeSpent?: number;
  videosUploaded?: number;
  lessonsCompleted?: number;
}

interface DepartmentData {
  department: string;
  avgScore: number;
  employees: number;
  lessons: number;
  videos: number;
  timeSpent: number;
}

interface ActivityData {
  week: string;
  lessons: number;
  videos: number;
  timeSpent: number;
}

// Props interfaces
interface ScoreTrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  height?: number;
}

interface ActivityComparisonChartProps {
  data: ActivityData[];
  title?: string;
  height?: number;
}

interface DepartmentPerformanceChartProps {
  data: DepartmentData[];
  title?: string;
  height?: number;
}

interface EngagementDistributionChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  title?: string;
  height?: number;
}

// Score Trend Chart Component
export function ScoreTrendChart({ data, title = "Score Trends", height = 300 }: ScoreTrendChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              className="text-muted-foreground"
            />
            <YAxis 
              domain={[0, 100]}
              className="text-muted-foreground"
            />
            <Tooltip 
              labelFormatter={(value) => formatDate(value as string)}
              formatter={(value: number) => [value?.toFixed(1), 'Score']}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="avgScore" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: 'hsl(var(--chart-1))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Activity Comparison Chart Component
export function ActivityComparisonChart({ data, title = "Activity Over Time", height = 300 }: ActivityComparisonChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="week" 
              className="text-muted-foreground"
            />
            <YAxis className="text-muted-foreground" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="lessons"
              stackId="1"
              stroke="hsl(var(--chart-2))"
              fill="hsl(var(--chart-2))"
              fillOpacity={0.6}
              name="Lessons"
            />
            <Area
              type="monotone"
              dataKey="videos"
              stackId="1"
              stroke="hsl(var(--chart-3))"
              fill="hsl(var(--chart-3))"
              fillOpacity={0.6}
              name="Videos"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Department Performance Chart Component
export function DepartmentPerformanceChart({ data, title = "Performance by Department", height = 400 }: DepartmentPerformanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="department" 
              className="text-muted-foreground"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis className="text-muted-foreground" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Bar 
              dataKey="avgScore" 
              fill="hsl(var(--chart-1))"
              name="Avg Score"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="lessons" 
              fill="hsl(var(--chart-2))"
              name="Lessons"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="videos" 
              fill="hsl(var(--chart-3))"
              name="Videos"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Engagement Distribution Chart Component
export function EngagementDistributionChart({ data, title = "Engagement Distribution", height = 300 }: EngagementDistributionChartProps) {
  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))'
  ];

  const renderCustomLabel = (props: any) => {
    const { percent } = props;
    return `${(percent * 100).toFixed(0)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Time Spent Line Chart Component
export function TimeSpentTrendChart({ data, title = "Time Spent Trends", height = 300 }: ScoreTrendChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              className="text-muted-foreground"
            />
            <YAxis className="text-muted-foreground" />
            <Tooltip 
              labelFormatter={(value) => formatDate(value as string)}
              formatter={(value: number) => [`${value} min`, 'Time Spent']}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="timeSpent" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: 'hsl(var(--chart-2))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Video Upload Trends Chart Component
export function VideoUploadTrendChart({ data, title = "Video Upload Trends", height = 300 }: ScoreTrendChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              className="text-muted-foreground"
            />
            <YAxis className="text-muted-foreground" />
            <Tooltip 
              labelFormatter={(value) => formatDate(value as string)}
              formatter={(value: number) => [value, 'Videos']}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Bar 
              dataKey="videosUploaded" 
              fill="hsl(var(--chart-3))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Combined metrics chart showing multiple metrics on different Y axes
export function CombinedMetricsChart({ data, title = "Combined Performance Metrics", height = 400 }: ScoreTrendChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              className="text-muted-foreground"
            />
            <YAxis 
              yAxisId="left"
              domain={[0, 100]}
              className="text-muted-foreground"
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              className="text-muted-foreground"
            />
            <Tooltip 
              labelFormatter={(value) => formatDate(value as string)}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="avgScore" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={2}
              name="Avg Score"
              dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2, r: 4 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="lessonsCompleted" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              name="Lessons"
              dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 4 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="videosUploaded" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={2}
              name="Videos"
              dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
