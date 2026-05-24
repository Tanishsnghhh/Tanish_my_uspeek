'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingUp, Users, Award, Rocket, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface SummaryStats {
  videoUploadRate: number;
  activeParticipants: number;
  topParticipantsCount: number;
  keyTakeaways: string[];
}

export function OverallProgramTakeaways({ selectedRegion }: { selectedRegion?: string }) {
  const { token } = useAuth();
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    videoUploadRate: 0,
    activeParticipants: 0,
    topParticipantsCount: 10,
    keyTakeaways: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummaryStats = async () => {
      if (!token) return;
      
      try {
        const url = selectedRegion 
          ? `/api/dashboard/overall-program-takeaways?region=${selectedRegion}` 
          : '/api/dashboard/overall-program-takeaways';
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setSummaryStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch summary stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryStats();
  }, [selectedRegion, token]);
  const takeaways = summaryStats.keyTakeaways && summaryStats.keyTakeaways.length > 0 ? summaryStats.keyTakeaways.map((text, index) => ({
    id: index + 1,
    text,
    highlight: "", // No specific highlight for dynamic content
    icon: [
      <TrendingUp className="w-5 h-5 text-green-600" />,
      <Users className="w-5 h-5 text-blue-600" />,
      <Award className="w-5 h-5 text-yellow-600" />,
      <Rocket className="w-5 h-5 text-purple-600" />,
      <Target className="w-5 h-5 text-indigo-600" />
    ][index] || <Lightbulb className="w-5 h-5 text-blue-600" />,
    bgColor: [
      "bg-green-100",
      "bg-blue-100", 
      "bg-yellow-100",
      "bg-purple-100",
      "bg-indigo-100"
    ][index] || "bg-blue-100",
    textColor: [
      "text-green-800",
      "text-blue-800",
      "text-yellow-800", 
      "text-purple-800",
      "text-indigo-800"
    ][index] || "text-blue-800"
  })) : [];

  const generateActionItems = (keyTakeaways: string[]) => {
    if (!keyTakeaways || keyTakeaways.length === 0) {
      return {
        immediateActions: [
          `Recognize top ${summaryStats.topParticipantsCount} performers`,
          `Maintain ${summaryStats.videoUploadRate}% upload momentum`,
          "Cultural reinforcement initiatives"
        ],
        strategicLaunches: [
          `Basecamp 2 for ${summaryStats.activeParticipants.toLocaleString()} participants`,
          "Manager coaching program",
          "Multi-level skill development"
        ]
      };
    }

    // Generate immediate actions from first 3 takeaways
    const immediateActions = keyTakeaways.slice(0, 3).map(takeaway => {
      // Extract action-oriented phrases
      const actionPhrases = takeaway.toLowerCase();
      if (actionPhrases.includes('recognize') || actionPhrases.includes('reward')) {
        return `Recognize top ${summaryStats.topParticipantsCount} performers`;
      } else if (actionPhrases.includes('maintain') || actionPhrases.includes('momentum')) {
        return `Maintain ${summaryStats.videoUploadRate}% upload momentum`;
      } else if (actionPhrases.includes('culture') || actionPhrases.includes('reinforce')) {
        return "Cultural reinforcement initiatives";
      } else {
        return takeaway.split('.')[0] + '.'; // Take first sentence
      }
    });

    // Generate strategic launches from last 2 takeaways
    const strategicLaunches = keyTakeaways.slice(3, 5).map(takeaway => {
      const actionPhrases = takeaway.toLowerCase();
      if (actionPhrases.includes('launch') || actionPhrases.includes('program')) {
        if (actionPhrases.includes('basecamp') || actionPhrases.includes('level')) {
          return `Basecamp 2 for ${summaryStats.activeParticipants.toLocaleString()} participants`;
        } else if (actionPhrases.includes('manager') || actionPhrases.includes('leadership')) {
          return "Manager coaching program";
        } else {
          return "Multi-level skill development";
        }
      } else {
        return takeaway.split('.')[0] + '.'; // Take first sentence
      }
    });

    return { immediateActions, strategicLaunches };
  };

  const actionItems = generateActionItems(summaryStats.keyTakeaways);

  const renderHighlightedText = (text: string, highlight: string, bgColor: string, textColor: string) => {
    if (!highlight || highlight.trim() === "") return text;
    
    const parts = text.split(highlight);
    if (parts.length === 1) return text;
    
    return (
      <>
        {parts[0]}
        <span className={`${bgColor} ${textColor} px-2 py-1 rounded-md font-semibold`}>
          {highlight}
        </span>
        {parts[1]}
      </>
    );
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-sky-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-800 flex items-center space-x-3 mb-2">
            <Lightbulb className="w-7 h-7 text-blue-600" />
            <span>Overall Program Key Take Aways & Next Steps</span>
          </CardTitle>
          <p className="text-sm text-blue-600 font-medium">
            Strategic insights and action items for program enhancement
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-blue-600">Loading program insights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-sky-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-blue-800 flex items-center space-x-3 mb-2">
          <Lightbulb className="w-7 h-7 text-blue-600" />
          <span>Overall Program Key Take Aways & Next Steps</span>
        </CardTitle>
        <p className="text-sm text-blue-600 font-medium">
          Strategic insights and action items for program enhancement
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{summaryStats.videoUploadRate}%</p>
                  <p className="text-sm text-gray-600">Video Upload Rate</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700">{summaryStats.activeParticipants.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Active Participants</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Takeaways List */}
          <div className="bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Lightbulb className="w-5 h-5" />
                <span>Strategic Action Items</span>
              </h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {takeaways.length > 0 ? takeaways.map((takeaway, index) => (
                  <div key={takeaway.id} className="flex items-start space-x-4 group">
                    {/* Icon with number */}
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full border-2 border-blue-300 group-hover:border-blue-400 transition-colors duration-200">
                        <span className="text-sm font-bold text-blue-700">{index + 1}</span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200 group-hover:border-blue-200 group-hover:shadow-md transition-all duration-200">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {takeaway.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-base text-gray-700 leading-relaxed">
                            {renderHighlightedText(
                              takeaway.text, 
                              takeaway.highlight, 
                              takeaway.bgColor, 
                              takeaway.textColor
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No insights available at the moment.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Summary */}
          <div className="bg-gradient-to-r from-blue-500 to-sky-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <Target className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Implementation Roadmap</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <h4 className="font-semibold mb-2">Immediate Actions</h4>
                <ul className="text-sm space-y-1">
                  {actionItems.immediateActions.map((action, index) => (
                    <li key={index}>• {action}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <h4 className="font-semibold mb-2">Strategic Launches</h4>
                <ul className="text-sm space-y-1">
                  {actionItems.strategicLaunches.map((launch, index) => (
                    <li key={index}>• {launch}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
