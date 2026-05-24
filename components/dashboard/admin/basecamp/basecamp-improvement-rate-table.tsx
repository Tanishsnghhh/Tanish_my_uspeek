'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface BusinessData {
  rowLabel: string;
  avgOIR: number;
  avgMaxOS: number;
  avgMinOS: number;
  avgBIR: number;
  avgMaxBL: number;
  avgMinBL: number;
  avgVIR: number;
  avgMaxVT: number;
  avgMinVT: number;
  avgWIR: number;
  avgMaxWP: number;
  avgMinWP: number;
}

export function BasecampImprovementRateTable() {
  const { token } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [businessData, setBusinessData] = useState<BusinessData[]>([]);
  const [businessAverage, setBusinessAverage] = useState<BusinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalVideos, setTotalVideos] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);

  const fetchBusinessData = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/business-metrics?format=business-wise', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch business data: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.businessData) {
        console.log('Basecamp dashboard received business data:', data.businessData);
        // The business-wise API already returns data in the correct format
        const transformedData: BusinessData[] = data.businessData.map((business: any) => ({
          rowLabel: business.businessName,
          avgOIR: business.avgOIR || 0,
          avgMaxOS: business.avgMaxOS || 0,
          avgMinOS: business.avgMinOS || 0,
          avgBIR: business.avgBIR || 0,
          avgMaxBL: business.avgMaxBL || 0,
          avgMinBL: business.avgMinBL || 0,
          avgVIR: business.avgVIR || 0,
          avgMaxVT: business.avgMaxVT || 0,
          avgMinVT: business.avgMinVT || 0,
          avgWIR: business.avgWIR || 0,
          avgMaxWP: business.avgMaxWP || 0,
          avgMinWP: business.avgMinWP || 0
        }));

        console.log('Transformed data for display:', transformedData);
        setBusinessData(transformedData);

        // Calculate averages
        if (transformedData.length > 0) {
          const avgData: BusinessData = {
            rowLabel: 'Averages',
            avgOIR: Math.round((transformedData.reduce((sum, item) => sum + item.avgOIR, 0) / transformedData.length) * 100) / 100,
            avgMaxOS: Math.round((transformedData.reduce((sum, item) => sum + item.avgMaxOS, 0) / transformedData.length) * 100) / 100,
            avgMinOS: Math.round((transformedData.reduce((sum, item) => sum + item.avgMinOS, 0) / transformedData.length) * 100) / 100,
            avgBIR: Math.round((transformedData.reduce((sum, item) => sum + item.avgBIR, 0) / transformedData.length) * 100) / 100,
            avgMaxBL: Math.round((transformedData.reduce((sum, item) => sum + item.avgMaxBL, 0) / transformedData.length) * 100) / 100,
            avgMinBL: Math.round((transformedData.reduce((sum, item) => sum + item.avgMinBL, 0) / transformedData.length) * 100) / 100,
            avgVIR: Math.round((transformedData.reduce((sum, item) => sum + item.avgVIR, 0) / transformedData.length) * 100) / 100,
            avgMaxVT: Math.round((transformedData.reduce((sum, item) => sum + item.avgMaxVT, 0) / transformedData.length) * 100) / 100,
            avgMinVT: Math.round((transformedData.reduce((sum, item) => sum + item.avgMinVT, 0) / transformedData.length) * 100) / 100,
            avgWIR: Math.round((transformedData.reduce((sum, item) => sum + item.avgWIR, 0) / transformedData.length) * 100) / 100,
            avgMaxWP: Math.round((transformedData.reduce((sum, item) => sum + item.avgMaxWP, 0) / transformedData.length) * 100) / 100,
            avgMinWP: Math.round((transformedData.reduce((sum, item) => sum + item.avgMinWP, 0) / transformedData.length) * 100) / 100
          };
          setBusinessAverage(avgData);
        }

        // Set summary data from the API response
        setTotalVideos(data.summary?.totalVideos || 0);
        setTotalParticipants(data.summary?.totalParticipants || 0);

      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (err) {
      console.error('Error fetching business data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load business data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBusinessData();
      fetchRegionalData();
    }
  }, [token]);

  const handleRefresh = async () => {
    await Promise.all([fetchBusinessData(), fetchRegionalData()]);
  };

  const [regionalData, setRegionalData] = useState<BusinessData[]>([]);
  const [regionalAverage, setRegionalAverage] = useState<BusinessData | null>(null);

  const fetchRegionalData = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/dashboard/region-improvement', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch regional data: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        // Transform regional API data to match table format
        const transformedRegionalData: BusinessData[] = data.map((region: any) => ({
          rowLabel: region.region,
          avgOIR: region.avgOIR || region.improvementRate || 0,
          avgMaxOS: region.avgMaxOS || 0,
          avgMinOS: region.avgMinOS || 0,
          avgBIR: region.avgBIR || 0,
          avgMaxBL: region.avgMaxBL || 0,
          avgMinBL: region.avgMinBL || 0,
          avgVIR: region.avgVIR || 0,
          avgMaxVT: region.avgMaxVT || 0,
          avgMinVT: region.avgMinVT || 0,
          avgWIR: region.avgWIR || 0,
          avgMaxWP: region.avgMaxWP || 0,
          avgMinWP: region.avgMinWP || 0
        }));

        setRegionalData(transformedRegionalData);

        // Calculate regional averages
        if (transformedRegionalData.length > 0) {
          const avgRegionalData: BusinessData = {
            rowLabel: 'Averages',
            avgOIR: Math.round((transformedRegionalData.reduce((sum, item) => sum + item.avgOIR, 0) / transformedRegionalData.length) * 100) / 100,
            avgMaxOS: Math.round((transformedRegionalData.reduce((sum, item) => sum + item.avgMaxOS, 0) / transformedRegionalData.length) * 100) / 100,
            avgMinOS: Math.round((transformedRegionalData.reduce((sum, item) => sum + item.avgMinOS, 0) / transformedRegionalData.length) * 100) / 100,
            avgBIR: Math.round((transformedRegionalData.reduce((sum, item) => sum + item.avgBIR, 0) / transformedRegionalData.length) * 100) / 100,
            avgMaxBL: Math.round((transformedRegionalData.reduce((sum, item) => sum + item.avgMaxBL, 0) / transformedRegionalData.length) * 100) / 100,
            avgMinBL: Math.round((transformedRegionalData.reduce((sum, item) => sum + item.avgMinBL, 0) / transformedRegionalData.length) * 100) / 100,
            avgVIR: Math.round((transformedRegionalData.reduce((sum, item) => sum + item.avgVIR, 0) / transformedRegionalData.length) * 100) / 100,
            avgMaxVT: Math.round((transformedRegionalData.reduce((sum, item) => sum + item.avgMaxVT, 0) / transformedRegionalData.length) * 100) / 100,
            avgMinVT: Math.round((transformedRegionalData.reduce((sum, item) => sum + item.avgMinVT, 0) / transformedRegionalData.length) * 100) / 100,
            avgWIR: Math.round((transformedRegionalData.reduce((sum, item) => sum + item.avgWIR, 0) / transformedRegionalData.length) * 100) / 100,
            avgMaxWP: Math.round((transformedRegionalData.reduce((sum, item) => sum + item.avgMaxWP, 0) / transformedRegionalData.length) * 100) / 100,
            avgMinWP: Math.round((transformedRegionalData.reduce((sum, item) => sum + item.avgMinWP, 0) / transformedRegionalData.length) * 100) / 100
          };
          setRegionalAverage(avgRegionalData);
        }
      }
    } catch (err) {
      console.error('Error fetching regional data:', err);
      // Set fallback regional data if API fails
      setRegionalData([]);
      setRegionalAverage(null);
    }
  };

  // Show only first 5 rows when collapsed for business and regional data
  const displayedBusinessData = isExpanded ? businessData : businessData.slice(0, 5);
  const displayedRegionalData = isExpanded ? regionalData : regionalData.slice(0, 3);

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-blue-800 flex items-center space-x-3 mb-2">
              <TrendingUp className="w-7 h-7 text-blue-600" />
              <span>Basecamp Program Overall Improvement Rate</span>
              {isLoading && <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />}
            </CardTitle>
            <p className="text-lg font-semibold text-blue-700">(Business & Region Wise - Dynamic Data)</p>
            {error && (
              <p className="text-sm text-red-600 mt-1">⚠️ {error}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="flex items-center space-x-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
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

        {/* Summary Cards - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <h3 className="text-sm font-semibold text-blue-700 mb-2">Total Videos Uploaded</h3>
            <p className="text-3xl font-bold text-blue-800 mb-1">
              {isLoading ? '...' : totalVideos.toLocaleString()}
            </p>
            <p className="text-sm text-blue-600">
              by {isLoading ? '...' : totalParticipants.toLocaleString()} Participants
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <h3 className="text-sm font-semibold text-blue-700 mb-2">Overall Improvement Rate</h3>
            <p className="text-3xl font-bold text-blue-800">
              {isLoading ? '...' : businessAverage ? `${businessAverage.avgOIR}%` : 'N/A'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Business Data Table */}
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 overflow-hidden">
            <div className="bg-blue-600 text-white px-4 py-2">
              <h3 className="text-lg font-semibold">Business Wise Data</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Row Labels</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg OIR%</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg MAX OS</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg MIN OS</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg BIR%</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg MAX BL</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg MIN BL</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg VIR%</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg MAX VT</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg MIN VT</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg WIR%</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg MAX WP</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg MIN WP</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading business data...
                      </td>
                    </tr>
                  ) : businessData.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                        No business data available. Create some businesses in Business Management.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {displayedBusinessData.map((row, index) => (
                        <tr
                          key={index}
                          className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors duration-200`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.rowLabel}</td>
                          <td className="px-4 py-3 text-center text-sm text-green-600 font-medium">{row.avgOIR}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{row.avgMaxOS}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{row.avgMinOS}</td>
                          <td className="px-4 py-3 text-center text-sm text-blue-600 font-medium">{row.avgBIR}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{row.avgMaxBL}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{row.avgMinBL}</td>
                          <td className="px-4 py-3 text-center text-sm text-purple-600 font-medium">{row.avgVIR}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{row.avgMaxVT}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{row.avgMinVT}</td>
                          <td className="px-4 py-3 text-center text-sm text-blue-600 font-medium">{row.avgWIR}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{row.avgMaxWP}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{row.avgMinWP}</td>
                        </tr>
                      ))}

                      {/* Show collapse indicator when table is collapsed */}
                      {!isExpanded && businessData.length > 5 && (
                        <tr className="bg-blue-100">
                          <td colSpan={13} className="px-4 py-3 text-center text-sm text-blue-700 font-medium">
                            ... and {businessData.length - 5} more business rows. Click "Expand" to view all data.
                          </td>
                        </tr>
                      )}

                      {/* Business Average Row */}
                      {businessAverage && (
                        <tr className="bg-blue-600 text-white font-semibold">
                          <td className="px-4 py-3 text-sm font-bold">{businessAverage.rowLabel}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{businessAverage.avgOIR}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{businessAverage.avgMaxOS}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{businessAverage.avgMinOS}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{businessAverage.avgBIR}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{businessAverage.avgMaxBL}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{businessAverage.avgMinBL}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{businessAverage.avgVIR}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{businessAverage.avgMaxVT}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{businessAverage.avgMinVT}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{businessAverage.avgWIR}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{businessAverage.avgMaxWP}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{businessAverage.avgMinWP}</td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Regional Data Table */}
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 overflow-hidden">
            <div className="bg-blue-600 text-white px-4 py-2">
              <h3 className="text-lg font-semibold">Region Wise Data</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Row Labels</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg OIR%</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg MAX OS</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg MIN OS</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg BIR%</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg MAX BL</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg MIN BL</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg VIR%</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg MAX VT</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg MIN VT</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg WIR%</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg MAX WP</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg MIN WP</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading regional data...
                      </td>
                    </tr>
                  ) : regionalData.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                        No regional data available.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {displayedRegionalData.map((row, index) => (
                        <tr
                          key={index}
                          className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors duration-200`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.rowLabel}</td>
                          <td className="px-4 py-3 text-center text-sm text-green-600 font-medium">{row.avgOIR}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{row.avgMaxOS}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{row.avgMinOS}</td>
                          <td className="px-4 py-3 text-center text-sm text-blue-600 font-medium">{row.avgBIR}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{row.avgMaxBL}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{row.avgMinBL}</td>
                          <td className="px-4 py-3 text-center text-sm text-purple-600 font-medium">{row.avgVIR}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{row.avgMaxVT}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{row.avgMinVT}</td>
                          <td className="px-4 py-3 text-center text-sm text-blue-600 font-medium">{row.avgWIR}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{row.avgMaxWP}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{row.avgMinWP}</td>
                        </tr>
                      ))}

                      {/* Show collapse indicator when table is collapsed */}
                      {!isExpanded && regionalData.length > 3 && (
                        <tr className="bg-blue-100">
                          <td colSpan={13} className="px-4 py-3 text-center text-sm text-blue-700 font-medium">
                            ... and {regionalData.length - 3} more regional rows. Click "Expand" to view all data.
                          </td>
                        </tr>
                      )}

                      {/* Regional Average Row */}
                      {regionalAverage && (
                        <tr className="bg-blue-600 text-white font-semibold">
                          <td className="px-4 py-3 text-sm font-bold">{regionalAverage.rowLabel}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{regionalAverage.avgOIR}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{regionalAverage.avgMaxOS}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{regionalAverage.avgMinOS}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{regionalAverage.avgBIR}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{regionalAverage.avgMaxBL}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{regionalAverage.avgMinBL}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{regionalAverage.avgVIR}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{regionalAverage.avgMaxVT}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{regionalAverage.avgMinVT}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{regionalAverage.avgWIR}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{regionalAverage.avgMaxWP}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{regionalAverage.avgMinWP}</td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
