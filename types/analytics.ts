/**
 * TypeScript Types for Analytics Dashboard
 * User-specific analytics data structures
 */

export interface UserAnalytics {
  userId: string;
  counts: {
    videos: number;
  };
  scores: {
    bodyLanguageAvg: number | null;
    vocalAvg: number | null;
    wordPowerAvg: number | null;
    overallCommunicationAvg: number | null;
  };
  strengths: StrengthItem[];
  weaknesses: StrengthItem[];
  trend: TrendDataPoint[];
  videos: UserVideo[];
  topPerformingVideos: TopLowVideo[];
  lowPerformingVideos: TopLowVideo[];
}

export interface StrengthItem {
  area: string;
  score: number;
  description: string;
  category: 'vocal' | 'body' | 'word' | 'overall';
}

export interface TrendDataPoint {
  date: string;
  overall: number | null;
  bodyLanguage: number | null;
  vocal: number | null;
  wordPower: number | null;
  _id: string;
}

export interface UserVideo {
  _id: string;
  filename: string;
  uploadDate: string;
}

export interface TopLowVideo {
  _id: string;
  filename: string;
  uploadDate: string;
  score: number;
  rank: number;
}

export interface AnalyticsApiResponse {
  success: boolean;
  data: UserAnalytics;
  error?: string;
}

// Component props
export interface AnalyticsDashboardProps {
  userId: string;
  className?: string;
}

export interface MetricCardProps {
  title: string;
  value: number | null;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

export interface TrendChartProps {
  data: TrendDataPoint[];
  height?: number;
}
