'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface CircleAnalysisData {
  circle: string;
  bodyLanguage: number;
  bodyLanguageImprovement: string;
  vocalTone: number;
  vocalToneImprovement: string;
  wordPower: number;
  wordPowerImprovement: string;
}

interface AnalysisResult {
  circles: CircleAnalysisData[];
  summary: {
    bodyLanguageImprovement: string;
    vocalToneImprovement: string;
    wordPowerImprovement: string;
  };
  keyInsights: string[];
}

export function CirclesWiseAnalysisTable({ selectedRegion = 'SOUTH' }: { selectedRegion?: string }) {
  const { token } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/circles-wise-analysis?region=${selectedRegion}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result: AnalysisResult = await response.json();
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
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-blue-700">Loading analysis data...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
        <CardContent className="py-12">
          <div className="text-center text-red-700">
            <p className="text-lg font-semibold">Error loading data</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const displayedData = isExpanded ? data.circles : data.circles.slice(0, 6);

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-blue-800 flex items-center space-x-3 mb-2">
              <Activity className="w-7 h-7 text-blue-600" />
              <span>Circles Wise Analysis on Body Language, Vocal Tone & Word Power</span>
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
            <h3 className="text-sm font-semibold text-blue-700 mb-1">Body Language Improvement</h3>
            <p className="text-2xl font-bold text-blue-800">{data.summary.bodyLanguageImprovement}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <h3 className="text-sm font-semibold text-blue-700 mb-1">Vocal Tone Improvement</h3>
            <p className="text-2xl font-bold text-blue-800">{data.summary.vocalToneImprovement}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <h3 className="text-sm font-semibold text-blue-700 mb-1">Word Power Improvement</h3>
            <p className="text-2xl font-bold text-blue-800">{data.summary.wordPowerImprovement}</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Circles</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Body Language</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">BL Improvement</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Vocal Tone</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">VT Improvement</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Word Power</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">WP Improvement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-200">
                {displayedData.map((row, index) => (
                  <tr key={index} className="hover:bg-blue-50">
                    <td className="px-4 py-3 text-sm font-medium text-blue-900">{row.circle}</td>
                    <td className="px-4 py-3 text-sm text-center text-blue-800">{row.bodyLanguage}</td>
                    <td className="px-4 py-3 text-sm text-center text-green-800 font-semibold">{row.bodyLanguageImprovement}</td>
                    <td className="px-4 py-3 text-sm text-center text-blue-800">{row.vocalTone}</td>
                    <td className="px-4 py-3 text-sm text-center text-green-800 font-semibold">{row.vocalToneImprovement}</td>
                    <td className="px-4 py-3 text-sm text-center text-blue-800">{row.wordPower}</td>
                    <td className="px-4 py-3 text-sm text-center text-green-800 font-semibold">{row.wordPowerImprovement}</td>
                  </tr>
                ))}
                
                {/* Show collapse indicator when table is collapsed */}
                {!isExpanded && data.circles.length > 6 && (
                  <tr className="bg-blue-100">
                    <td colSpan={7} className="px-4 py-3 text-center text-sm text-blue-700 font-medium">
                      ... and {data.circles.length - 6} more circles. Click "Expand" to view all data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Insights */}
        <div className="mt-6 bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Key Insights</h3>
          <ul className="space-y-2">
            {data.keyInsights.map((insight, index) => (
              <li key={index} className="text-sm text-blue-700 flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
