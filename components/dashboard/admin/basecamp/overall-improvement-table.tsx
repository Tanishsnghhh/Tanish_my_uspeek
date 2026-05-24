'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { MapPin, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CircleData {
  circle: string;
  totalParticipants: number;
  uploadedVideos: number;
  noUploadParticipants: number;
  videosUploaded: number;
  aos: number;
  maxOS: number;
  minOS: number;
  ir: string;
  videoUploadRate: string;
}

interface RegionCircleData {
  circles: CircleData[];
  total: {
    circle: string;
    totalParticipants: number;
    uploadedVideos: number;
    noUploadParticipants: number;
    videosUploaded: number;
    aos: number;
    maxOS: number;
    minOS: number;
    ir: string;
    videoUploadRate: string;
  };
  keyInsights: string[];
}

export function OverallImprovementTable({ 
  selectedRegion, 
  onRegionChange 
}: { 
  selectedRegion: string; 
  onRegionChange: (region: string) => void; 
}) {
  const { token } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [data, setData] = useState<RegionCircleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(true);

  useEffect(() => {
    const fetchCircleData = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/dashboard/circle-improvement?region=${selectedRegion}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch circle data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching circle data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCircleData();
  }, [selectedRegion, token]);

  // Fetch available regions
  useEffect(() => {
    const fetchRegions = async () => {
      if (!token) return;
      
      try {
        setRegionsLoading(true);
        const response = await fetch('/api/dashboard/region-improvement', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const regionData = await response.json();
          const regions = regionData.map((item: any) => item.region).filter((region: string) => Boolean(region));
          if (regions.length > 0) {
            setAvailableRegions(regions);
            // If current selectedRegion is not in available regions, set to first available
            if (!regions.includes(selectedRegion)) {
              onRegionChange(regions[0]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching regions:', err);
        // Keep empty array if API fails
      } finally {
        setRegionsLoading(false);
      }
    };

    fetchRegions();
  }, [token]);

  // Region colors for consistent theming - with fallback for dynamic regions
  const regionColors: { [key: string]: { bg: string; border: string; text: string; accent: string } } = {
    SOUTH: { bg: 'from-blue-50 to-indigo-100', border: 'border-blue-200', text: 'text-blue-800', accent: 'text-blue-600' },
    NORTH: { bg: 'from-purple-50 to-pink-100', border: 'border-purple-200', text: 'text-purple-800', accent: 'text-purple-600' },
    EAST: { bg: 'from-green-50 to-teal-100', border: 'border-green-200', text: 'text-green-800', accent: 'text-green-600' },
    WEST: { bg: 'from-orange-50 to-red-100', border: 'border-orange-200', text: 'text-orange-800', accent: 'text-orange-600' }
  };

  // Default colors for unknown regions
  const defaultColors = { bg: 'from-gray-50 to-slate-100', border: 'border-gray-200', text: 'text-gray-800', accent: 'text-gray-600' };

  const currentColors = regionColors[selectedRegion] || defaultColors;

  if (loading) {
    return (
      <Card className={`bg-gradient-to-br ${currentColors.bg} ${currentColors.border} shadow-lg`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <CardTitle className="text-2xl font-bold text-blue-800 flex items-center space-x-3 mb-2">
                  <MapPin className="w-7 h-7 text-blue-600" />
                  <span>Overall Improvement Rate</span>
                </CardTitle>
                <p className="text-lg font-semibold text-blue-700">(Circle Wise)</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-700">Region:</span>
                <Select value={selectedRegion} onValueChange={onRegionChange}>
                  <SelectTrigger className="w-32 border-blue-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRegions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region.charAt(0).toUpperCase() + region.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-blue-700 font-medium">Loading circle data for {selectedRegion} region...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={`bg-gradient-to-br ${currentColors.bg} ${currentColors.border} shadow-lg`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <CardTitle className="text-2xl font-bold text-blue-800 flex items-center space-x-3 mb-2">
                  <MapPin className="w-7 h-7 text-blue-600" />
                  <span>Overall Improvement Rate</span>
                </CardTitle>
                <p className="text-lg font-semibold text-blue-700">(Circle Wise)</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-700">Region:</span>
                <Select value={selectedRegion} onValueChange={onRegionChange}>
                  <SelectTrigger className="w-32 border-blue-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRegions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region.charAt(0).toUpperCase() + region.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-700 font-medium mb-2">Failed to load circle data</p>
            <p className="text-red-600 text-sm">{error || 'Unknown error occurred'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const circleData = data.circles;
  const totalRow = data.total;
  const keyInsights = data.keyInsights;

  // Show only first 6 rows when collapsed
  const displayedData = isExpanded ? circleData : circleData.slice(0, 6);

  return (
    <Card className={`bg-gradient-to-br ${currentColors.bg} ${currentColors.border} shadow-lg hover:shadow-xl transition-all duration-300`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <CardTitle className="text-2xl font-bold text-blue-800 flex items-center space-x-3 mb-2">
                <MapPin className="w-7 h-7 text-blue-600" />
                <span>Overall Improvement Rate</span>
              </CardTitle>
              <p className="text-lg font-semibold text-blue-700">(Circle Wise)</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-700">Region:</span>
              <Select value={selectedRegion} onValueChange={onRegionChange}>
                <SelectTrigger className="w-32 border-blue-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRegions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region.charAt(0).toUpperCase() + region.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <h3 className="text-sm font-semibold text-blue-700 mb-1">Total Participants</h3>
            <p className="text-2xl font-bold text-blue-800">{totalRow.totalParticipants.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <h3 className="text-sm font-semibold text-blue-700 mb-1">Overall Improvement Rate</h3>
            <p className="text-2xl font-bold text-blue-800">{totalRow.ir}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <h3 className="text-sm font-semibold text-blue-700 mb-1">Total Videos Uploaded</h3>
            <p className="text-2xl font-bold text-blue-800">{totalRow.videosUploaded.toLocaleString()}</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Circles</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Participants</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Video Uploads</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Improvement Rate</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Overall Score</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">MAX OS</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">MIN OS</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Upload Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-200">
                {displayedData.map((row, index) => (
                  <tr
                    key={index}
                    className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors duration-200`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-blue-900">{row.circle}</td>
                    <td className="px-4 py-3 text-center text-sm text-blue-800">{row.totalParticipants}</td>
                    <td className="px-4 py-3 text-center text-sm text-blue-800">{row.videosUploaded}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-green-600">{row.ir}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-blue-900">{row.aos}</td>
                    <td className="px-4 py-3 text-center text-sm text-blue-800">{row.maxOS}</td>
                    <td className="px-4 py-3 text-center text-sm text-blue-800">{row.minOS}</td>
                    <td className="px-4 py-3 text-center text-sm text-blue-800">{row.videoUploadRate}</td>
                  </tr>
                ))}

                {/* Show collapse indicator when table is collapsed */}
                {!isExpanded && circleData.length > 6 && (
                  <tr className="bg-blue-100">
                    <td colSpan={8} className="px-4 py-3 text-center text-sm text-blue-700 font-medium">
                      ... and {circleData.length - 6} more circles. Click "Expand" to view all data.
                    </td>
                  </tr>
                )}

                {/* Total Row */}
                <tr className="bg-blue-600 text-white font-semibold">
                  <td className="px-4 py-3 text-sm font-bold">{totalRow.circle}</td>
                  <td className="px-4 py-3 text-center text-sm font-bold">{totalRow.totalParticipants}</td>
                  <td className="px-4 py-3 text-center text-sm font-bold">{totalRow.videosUploaded}</td>
                  <td className="px-4 py-3 text-center text-sm font-bold">{totalRow.ir}</td>
                  <td className="px-4 py-3 text-center text-sm font-bold">{totalRow.aos}</td>
                  <td className="px-4 py-3 text-center text-sm font-bold">{totalRow.maxOS}</td>
                  <td className="px-4 py-3 text-center text-sm font-bold">{totalRow.minOS}</td>
                  <td className="px-4 py-3 text-center text-sm font-bold">{totalRow.videoUploadRate}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Insights */}
        <div className="mt-6 bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Key Insights - {selectedRegion} Region</h3>
          <ul className="space-y-2">
            {keyInsights.map((insight, index) => (
              <li key={index} className="text-sm text-blue-700 flex items-start space-x-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}