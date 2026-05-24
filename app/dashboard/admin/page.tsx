'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AdminMetricCards } from '@/components/dashboard/admin/basecamp/admin-metric-cards';
import { RegionImprovementChart } from '@/components/dashboard/admin/basecamp/region-improvement-chart';
import { ImprovementScoreCharts } from '@/components/dashboard/admin/basecamp/improvement-score-charts';
import { KeyInsightsSection } from '@/components/dashboard/admin/basecamp/key-insights-section';
import { OverallImprovementTable } from '@/components/dashboard/admin/basecamp/overall-improvement-table';
import { BasecampProgramStatus } from '@/components/dashboard/admin/basecamp/basecamp-program-status';
import { BasecampImprovementRateTable } from '@/components/dashboard/admin/basecamp/basecamp-improvement-rate-table';
import { CirclesWiseAnalysisTable } from '@/components/dashboard/admin/basecamp/circles-wise-analysis-table';
import { TopParticipantsSouthRegion } from '@/components/dashboard/admin/basecamp/top-participants-south-region';
import { OverallProgramTakeaways } from '@/components/dashboard/admin/basecamp/overall-program-takeaways';
import { ImprovementScoreCharts as GoBeyondImprovementCharts } from '@/components/dashboard/admin/gobeyond/improvement-score-charts';
import { AdvancedMetricCards } from '@/components/dashboard/admin/gobeyond/advanced-metric-cards';
import { AdvancedRegionChart } from '@/components/dashboard/admin/gobeyond/advanced-region-chart';
import { BusinessImprovementChart } from '@/components/dashboard/admin/gobeyond/business-improvement-chart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Mountain, Rocket, BarChart3, TrendingUp, Users, Clock } from 'lucide-react';

export default function AdminDashboardPage() {
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentView, setCurrentView] = useState<'basecamp' | 'gobeyond'>('basecamp');
  const [selectedRegion, setSelectedRegion] = useState<string>('SOUTH');
  const { user, isAuthenticated, isLoading } = useAuth();

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

  // Check if user is authenticated and is admin
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access the admin dashboard.</p>
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

  // Check if user has admin privileges
  const isAdmin = user.role === 'CORPORATE_ADMIN' || user.role === 'ADMIN';
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need admin privileges to access this dashboard.</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to User Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* View Toggle Button - Top Left */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-white rounded-lg shadow-lg border border-gray-200 p-1">
              <Button
                onClick={() => setCurrentView('basecamp')}
                variant={currentView === 'basecamp' ? 'default' : 'ghost'}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                  currentView === 'basecamp' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Mountain className="w-4 h-4" />
                <span className="font-medium">Base Camp</span>
              </Button>
              <Button
                onClick={() => setCurrentView('gobeyond')}
                variant={currentView === 'gobeyond' ? 'default' : 'ghost'}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                  currentView === 'gobeyond' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <Rocket className="w-4 h-4" />
                <span className="font-medium">Go Beyond</span>
              </Button>
            </div>
            <Badge 
              variant="outline" 
              className={`px-3 py-1 ${
                currentView === 'basecamp' 
                  ? 'border-blue-200 text-blue-700 bg-blue-50' 
                  : 'border-purple-200 text-purple-700 bg-purple-50'
              }`}
            >
              {currentView === 'basecamp' ? 'Essential Analytics' : 'Advanced Insights'}
            </Badge>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {currentView === 'basecamp' ? 'Admin Analytics Dashboard' : 'Advanced Analytics Hub'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back, {user?.firstName} {user?.lastName}
              {user?.companyName && ` • ${user.companyName}`}
              <span className="ml-2 text-gray-400">
                • {currentView === 'basecamp' ? 'Base Camp View' : 'Go Beyond View'}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">{currentDate}</p>
            <p className="text-xs text-gray-400">Admin Portal</p>
          </div>
        </div>

        {/* Content based on current view */}
        {currentView === 'basecamp' ? (
          <>
            {/* Base Camp Content */}
            <AdminMetricCards />
            <RegionImprovementChart />
            
            {/* Basecamp Program Overall Improvement Rate */}
            <BasecampImprovementRateTable />
            
            {/* Improvement Score Charts */}
            <ImprovementScoreCharts />
            
            {/* Key Insights Section */}
            <KeyInsightsSection />
            
            {/* Overall Improvement Table with Region Selection */}
            <OverallImprovementTable 
              selectedRegion={selectedRegion} 
              onRegionChange={setSelectedRegion} 
            />
            
            {/* Circles Wise Analysis Table */}
            <CirclesWiseAnalysisTable selectedRegion={selectedRegion} />
            
            {/* Top Participants South Region */}
            <TopParticipantsSouthRegion selectedRegion={selectedRegion} />
            
            {/* Overall Program Takeaways */}
            <OverallProgramTakeaways selectedRegion={selectedRegion} />
            
          </>
        ) : (
          <>
            {/* Go Beyond Content */}
            {/* Advanced Metric Cards */}
            <AdvancedMetricCards />


            {/* Advanced Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdvancedRegionChart />
              <BusinessImprovementChart />
            </div>
            {/* Go Beyond Improvement Score Charts */}
            <GoBeyondImprovementCharts />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
