'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { OverallScore } from '@/components/dashboard/overall-score';
import { TrendChart } from '@/components/dashboard/trend-chart';
import { OverallScoreTrend } from '@/components/dashboard/overall-score-trend';
import { ScoreCards } from '@/components/dashboard/score-cards';
import { StrengthsAndDevelopment } from '@/components/dashboard/strengths-development';
import { TopLowPerformingVideos } from '@/components/dashboard/top-low-performing-videos';
import { PendingAssignments } from '@/components/dashboard/pending-assignments';
import { VideoScoresChart } from '@/components/dashboard/video-scores-chart';
import { useAuth } from '@/hooks/use-auth';
import { useUserAnalytics } from '@/hooks/use-user-analytics';

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState<string>('');
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  
  // Format userId for analytics API (expects EMPLOYEE:id format)
  const userId = user?.id ? `EMPLOYEE:${user.id}` : null;
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useUserAnalytics(userId);

  useEffect(() => {
    // Set the date only on the client side to avoid hydration mismatch
    const formattedDate = formatDate(new Date());
    setCurrentDate(formattedDate);
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access the dashboard.</p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Redirect admin users to admin dashboard
  const isAdmin = user?.role === 'CORPORATE_ADMIN' || user?.role === 'ADMIN';
  if (isAdmin) {
    window.location.href = '/dashboard/admin';
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Communication Analytics Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back, {user?.firstName} {user?.lastName}
              {user?.companyName && ` • ${user.companyName}`}
            </p>
          </div>
        </div>

        {/* Overall Score and Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OverallScore data={analyticsData} isLoading={analyticsLoading} />
          <OverallScoreTrend data={analyticsData} isLoading={analyticsLoading} />
        </div>

        {/* Score Cards */}
        <ScoreCards data={analyticsData} isLoading={analyticsLoading} />

        {/* Individual Metric Trends */}
        <TrendChart data={analyticsData} isLoading={analyticsLoading} />

        {/* Strengths & Development Areas */}
        <StrengthsAndDevelopment 
          strengths={analyticsData?.strengths} 
          weaknesses={analyticsData?.weaknesses} 
          isLoading={analyticsLoading} 
        />

        {/* Top and Low Performing Videos */}
        <TopLowPerformingVideos 
          topPerformingVideos={analyticsData?.topPerformingVideos} 
          lowPerformingVideos={analyticsData?.lowPerformingVideos} 
          isLoading={analyticsLoading} 
        />

        {/* Video Scores Chart */}
        <VideoScoresChart 
          userId={userId} 
          analyticsData={analyticsData} 
          isLoading={analyticsLoading} 
        />

        {/* Pending Assignments */}
        <PendingAssignments userId={user?.id} />
      </div>
    </DashboardLayout>
  );
}