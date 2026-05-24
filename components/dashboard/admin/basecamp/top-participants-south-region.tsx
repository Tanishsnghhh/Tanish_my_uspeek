'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Users, ChevronDown, ChevronUp, Target, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface TopParticipant {
  employeeId: string;
  phoneNumber: string;
  circle: string;
  supervisor: string;
  videos: number;
  aos: number;
  abl: number;
  avt: number;
  awp: number;
  maxOS: number;
  minOS: number;
  oir: string;
}

interface TopVideoUpload {
  department: string;
  name: string;
  employeeId: string;
  phoneNumber: string;
  circle: string;
  supervisor: string;
  uploads: number;
}

interface SummaryStats {
  totalActiveParticipants: number;
  videoUploadRate: number;
  averageImprovement: number;
}

interface ApiResponse {
  topImprovementParticipants: TopParticipant[];
  topVideoUploads: TopVideoUpload[];
  summaryStats: SummaryStats;
  keyTakeaways: string[];
  participantsWithVideos: number;
}

export function TopParticipantsSouthRegion({ selectedRegion = 'SOUTH' }: { selectedRegion?: string }) {
  const { token } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/top-participants/${selectedRegion.toLowerCase()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result: ApiResponse = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedRegion, token]);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2 text-blue-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading top participants data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-red-600 text-center">
            <p className="font-semibold">Error loading data</p>
            <p className="text-sm">{error || 'No data available'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { topImprovementParticipants, topVideoUploads, summaryStats, keyTakeaways, participantsWithVideos } = data;

  // Show only first 5 rows when collapsed
  const displayedImprovementData = isExpanded ? topImprovementParticipants : topImprovementParticipants.slice(0, 5);
  const displayedVideoData = isExpanded ? topVideoUploads : topVideoUploads.slice(0, 5);

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-blue-800 flex items-center space-x-3 mb-2">
              <Trophy className="w-7 h-7 text-blue-600" />
              <span>Top 10 Participants from {selectedRegion.charAt(0).toUpperCase() + selectedRegion.slice(1).toLowerCase()} Region</span>
            </CardTitle>
          </div>
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Expand</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <h3 className="text-sm font-semibold text-blue-700 mb-1">Total Active Participants</h3>
            <p className="text-2xl font-bold text-blue-800">{summaryStats.totalActiveParticipants}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <h3 className="text-sm font-semibold text-blue-700 mb-1">Video Upload Rate</h3>
            <p className="text-2xl font-bold text-blue-800">{summaryStats.videoUploadRate}%</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <h3 className="text-sm font-semibold text-blue-700 mb-1">Average Improvement</h3>
            <p className="text-2xl font-bold text-blue-800">{summaryStats.averageImprovement}%</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Top Participants with Highest Overall Improvement Rate */}
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 overflow-hidden">
            <div className="bg-blue-600 text-white px-4 py-3">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Top Participants with the Highest Overall Improvement Rate</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Employee ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Phone Number</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Circle</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Videos</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Overall Score</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Improvement Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-200">
                  {displayedImprovementData.map((participant, index) => (
                    <tr key={index} className="hover:bg-blue-50">
                      <td className="px-4 py-3 text-sm font-medium text-blue-900">{participant.employeeId}</td>
                      <td className="px-4 py-3 text-sm text-blue-600">{participant.phoneNumber}</td>
                      <td className="px-4 py-3 text-sm text-blue-800">{participant.circle}</td>
                      <td className="px-4 py-3 text-sm text-center text-blue-800">{participant.videos}</td>
                      <td className="px-4 py-3 text-sm text-center text-blue-800">{participant.aos}</td>
                      <td className="px-4 py-3 text-sm text-center text-green-800 font-semibold">{participant.oir}</td>
                    </tr>
                  ))}
                  
                  {/* Show collapse indicator when table is collapsed */}
                  {!isExpanded && topImprovementParticipants.length > 5 && (
                    <tr className="bg-blue-100">
                      <td colSpan={6} className="px-4 py-3 text-center text-sm text-blue-700 font-medium">
                        ... and {topImprovementParticipants.length - 5} more participants. Click "Expand" to view all.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Participants with Highest Video Uploads */}
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 overflow-hidden">
            <div className="bg-blue-600 text-white px-4 py-3">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Top Participants with Highest Video Uploads</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Employee ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Circle</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Video Uploads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-200">
                  {displayedVideoData.map((participant, index) => (
                    <tr key={index} className="hover:bg-blue-50">
                      <td className="px-4 py-3 text-sm font-medium text-blue-900">{participant.employeeId}</td>
                      <td className="px-4 py-3 text-sm text-blue-800">{participant.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-blue-800">{participant.circle}</td>
                      <td className="px-4 py-3 text-center text-sm text-green-800 font-semibold">{participant.uploads}</td>
                    </tr>
                  ))}
                  
                  {/* Show collapse indicator when table is collapsed */}
                  {!isExpanded && topVideoUploads.length > 5 && (
                    <tr className="bg-blue-100">
                      <td colSpan={4} className="px-4 py-3 text-center text-sm text-blue-700 font-medium">
                        ... and {topVideoUploads.length - 5} more participants. Click "Expand" to view all.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Take Aways & Next Steps */}
          <div className="bg-white rounded-lg p-6 border border-blue-200 shadow-sm">
            <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center space-x-2">
              <Target className="w-6 h-6 text-blue-600" />
              <span>{selectedRegion.charAt(0).toUpperCase() + selectedRegion.slice(1).toLowerCase()} - Key Take Aways & Next Steps</span>
            </h3>
            <ul className="space-y-3">
              {keyTakeaways.map((takeaway, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="text-blue-600 text-lg mt-0.5">•</span>
                  <span className="text-sm text-gray-700 leading-relaxed">
                    {takeaway.includes(`${summaryStats.videoUploadRate}% Video Upload rate`) ? (
                      <>
                        Great momentum achieved at <span className="bg-green-200 px-1 rounded font-medium">{summaryStats.videoUploadRate}% Video Upload rate</span>.
                      </>
                    ) : takeaway.includes('top 10 participants') ? (
                      <>
                        Recognize the <span className="bg-yellow-200 px-1 rounded font-medium">top 10 participants</span> in videos upload and improvement rate will set the right tone to encourage effort and outcomes.
                      </>
                    ) : takeaway.includes(`${participantsWithVideos} participants`) ? (
                      <>
                        Announce the launch of the next level of communication skills <span className="bg-blue-200 px-1 rounded font-medium">basecamp 2 for the {participantsWithVideos} participants</span> of uploaded more than 5 videos – this will show Axis Bank commitment to invest in development of employees and will reward the right behaviours.
                      </>
                    ) : takeaway.includes('Advanced communication skills') ? (
                      <>
                        Launch an <span className="bg-purple-200 px-1 rounded font-medium">Advanced communication skills program for Managers</span> of Basecamp employees – this will ensure that multi skilling is happening at all levels and the managers are also possessing the skills to coach their teams.
                      </>
                    ) : (
                      takeaway
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
