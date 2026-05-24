'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface DjangoAnalysisData {
  filename: string;
  file_size: string;
  language: string;
  duration: string;
  original_transcript: string;
  corrected_transcript: string;
  summary: string;
  keywords: string;
  repeated_words: Array<{ word: string; count: number }>;
  filler_words: Array<{ word: string; count: number; percentage: number }>;
  sentiment_analysis: any;
  content_assessment: any;
  strengths_improvements: any;
  emotion_analysis: any;
}

interface PoseAnalysisData {
  frames_processed: number;
  smiles: string;
  head_moves: string;
  hand_moves: string;
  eye_contact: string;
  leg_moves: string;
  foot_moves: string;
  audio: {
    duration_sec: number;
    volume_db: number;
    mean_pitch_hz: number;
    pitch_range: string;
    num_pauses: number;
    spoken_duration_sec: number;
  };
}

interface CoachingData {
  summary: string;
  interpretation: string;
  suggestions: string;
}

interface SummarySuggestionsSectionProps {
  analysisData?: DjangoAnalysisData | null;
  poseData?: PoseAnalysisData | null;
  coachingData?: CoachingData | null;
}

export function SummarySuggestionsSection({ analysisData, poseData, coachingData }: SummarySuggestionsSectionProps) {
  // Helper functions
  const getPercentageValue = (dataStr: string): number => {
    if (!dataStr) return 0;
    const match = dataStr.match(/\((\d+(?:\.\d+)?)%\)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const getOverallScore = (): number => {
    if (!analysisData && !poseData) return 0;
    let score = 0;
    let count = 0;

    // Vocal score from audio data
    if (poseData?.audio) {
      const vocalScore = Math.min(Math.max(poseData.audio.volume_db + 60, 0), 100);
      score += vocalScore;
      count++;
    }

    // Body language score from pose data
    if (poseData) {
      const bodyScore = (getPercentageValue(poseData.smiles) + getPercentageValue(poseData.eye_contact)) / 2;
      score += bodyScore;
      count++;
    }

    // Word power score from keywords
    if (analysisData?.keywords) {
      const wordScore = Math.min(analysisData.keywords.split(',').length * 10, 100);
      score += wordScore;
      count++;
    }

    return count > 0 ? Math.round(score / count) : 0;
  };

  const CircularProgress = ({ score, size = 120, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-green-600';
      if (score >= 70) return 'text-yellow-600';
      return 'text-red-600';
    };

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`transition-all duration-1000 ${getScoreColor(score)}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score}
            </div>
            <div className="text-sm text-gray-500">out of 100</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-purple-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <span className="text-2xl">📋</span>
            <span>Summary</span>
          </h3>
          <div className="text-sm text-gray-500">AI Generated</div>
        </div>
        
        <div className="bg-white rounded-lg p-6 space-y-6">
          {/* Personal Interests */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Personal Interests</span>
            </h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>{analysisData?.summary ? analysisData.summary.split('.')[0] : "N/A"}</span>
              </li>
            </ul>
          </div>

          {/* Critical Insights */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Critical Insights</span>
            </h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">•</span>
                <span>{analysisData?.summary ? analysisData.summary.split('.')[1] : "N/A"}</span>
              </li>
            </ul>
          </div>

          {/* Implementation/Next Steps */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span>Implementation/Next Steps</span>
            </h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>{analysisData?.summary ? analysisData.summary.split('.')[2] : "N/A"}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Keywords Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <span className="text-2xl">🔑</span>
            <span>Keywords</span>
          </h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {analysisData?.keywords ? 
            analysisData.keywords.split(',').map((keyword, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">
                {keyword.trim()}
              </span>
            )) : 
            <span className="bg-gray-100 text-gray-800 px-3 py-2 rounded-full text-sm font-medium">N/A</span>
          }
        </div>
      </div>

      {/* Advanced Content Analysis & Recommendations */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">🤖</span>
            <span className="font-semibold text-lg">Advanced Content Analysis & Recommendations</span>
          </div>
          <p className="text-gray-600 mt-2">Comprehensive analysis with detailed recommendations based on NLP metrics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Strengths */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-green-800">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">✅</span>
                  <span>Strengths</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">✓</span>
                    <span className="font-semibold text-gray-800">Vocabulary</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {analysisData?.content_assessment?.vocabulary_score ? `${analysisData.content_assessment.vocabulary_score}%` : "N/A"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {analysisData?.content_assessment?.vocabulary_description || "Strong vocabulary usage demonstrated"}
                </p>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">✓</span>
                    <span className="font-semibold text-gray-800">Communication Style</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {analysisData?.sentiment_analysis?.overall || "Good"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {analysisData?.emotion_analysis?.description || "Clear and engaging communication style"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-orange-800">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">⚠️</span>
                  <span>Areas for Improvement</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-orange-600">▲</span>
                    <span className="font-semibold text-gray-800">Content Length</span>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">
                    {analysisData?.content_assessment?.content_length_score ? `${analysisData.content_assessment.content_length_score}%` : "N/A"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {analysisData?.content_assessment?.content_length_description || "Consider expanding content for more depth"}
                </p>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-orange-600">▲</span>
                    <span className="font-semibold text-gray-800">Fluency</span>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">
                    {analysisData?.content_assessment?.fluency_score ? `${analysisData.content_assessment.fluency_score}%` : "N/A"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {analysisData?.content_assessment?.fluency_description || "Focus on reducing filler words for improved fluency"}
                </p>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-orange-600">▲</span>
                    <span className="font-semibold text-gray-800">Flow & Cohesion</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {analysisData?.content_assessment?.flow_description || "Work on creating smoother transitions between ideas"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Word Power Analysis */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">💬</span>
            <span className="font-semibold text-lg">Word Power Analysis</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-0 shadow-xl h-full flex flex-col justify-center items-center">
              <CardContent className="p-8 text-center flex flex-col items-center justify-center">
                <div className="mb-6">
                  <div className="text-6xl font-bold text-pink-600 mb-2">
                    {analysisData?.content_assessment?.word_power_score ? `${analysisData.content_assessment.word_power_score}/5` : "3.6/5"}
                  </div>
                  <div className="text-lg text-gray-600">out of 5</div>
                </div>
                <div className="relative flex flex-col items-center justify-center" style={{ width: 100, height: 100 }}>
                  <CircularProgress score={analysisData?.content_assessment?.word_power_percentage || 72} size={100} strokeWidth={8} />
                </div>
                <div className="mt-4">
                  <Badge className="inline-flex items-center rounded-full border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 bg-yellow-100 text-yellow-800 px-4 py-2">
                    Good
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">💪</div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Word Power Insights</h4>
                    <p className="text-sm text-gray-600">
                      Your Word Power is good. Identify the areas that can enhance your score.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 h-full">
                <Card className="bg-white border border-gray-200 h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span className="text-2xl">📝</span>
                      <span>Word Categories</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 flex-1">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-base flex items-center space-x-2">
                          <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                          <span className="font-medium">Positive</span>
                        </span>
                        <Badge className="bg-green-100 text-green-800 px-3 py-1">Good</Badge>
                      </div>
                      <Progress value={analysisData?.sentiment_analysis?.positive_percentage || 75} className="h-3" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-base flex items-center space-x-2">
                          <span className="w-4 h-4 bg-yellow-500 rounded-full"></span>
                          <span className="font-medium">Neutral</span>
                        </span>
                        <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">Average</Badge>
                      </div>
                      <Progress value={analysisData?.sentiment_analysis?.neutral_percentage || 60} className="h-3" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-base flex items-center space-x-2">
                          <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                          <span className="font-medium">Negative</span>
                        </span>
                        <Badge className="bg-red-100 text-red-800 px-3 py-1">Poor</Badge>
                      </div>
                      <Progress value={analysisData?.sentiment_analysis?.negative_percentage || 25} className="h-3" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-base flex items-center space-x-2">
                          <span className="w-4 h-4 bg-purple-500 rounded-full"></span>
                          <span className="font-medium">Repetition</span>
                        </span>
                        <Badge className="bg-red-100 text-red-800 px-3 py-1">Poor</Badge>
                      </div>
                      <Progress value={analysisData?.repeated_words && analysisData.repeated_words.length > 0 ? Math.min(analysisData.repeated_words.length * 10, 100) : 30} className="h-3" />
                    </div>
                    <div className="flex-1"></div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="bg-green-50 border border-green-200">
                  <CardHeader>
                    <CardTitle className="text-sm text-green-800">✅ Strengths</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">• Clear articulation</div>
                    <div className="text-sm">• Good vocabulary range</div>
                    <div className="text-sm">• Effective emphasis</div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-sm text-orange-800">⚠️ Areas to Improve</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">• Reduce filler words</div>
                    <div className="text-sm">• Vary sentence structure</div>
                    <div className="text-sm">• Minimize repetition</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <Card className="bg-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-center">Detailed Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {analysisData?.content_assessment?.vocabulary_score ? `${analysisData.content_assessment.vocabulary_score}%` : "N/A"}
              </div>
              <div className="text-sm font-semibold text-gray-800">Vocabulary</div>
              <div className="text-xs text-gray-500">
                {analysisData?.content_assessment?.vocabulary_diversity ? `${analysisData.content_assessment.vocabulary_diversity}%` : "N/A"} unique words
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">
                {analysisData?.content_assessment?.fluency_score ? `${analysisData.content_assessment.fluency_score}%` : "N/A"}
              </div>
              <div className="text-sm font-semibold text-gray-800">Fluency</div>
              <div className="text-xs text-gray-500">
                {analysisData?.content_assessment?.filler_words_percentage ? `${analysisData.content_assessment.filler_words_percentage}%` : "N/A"} filler words
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600 mb-2">
                {analysisData?.content_assessment?.sentence_structure_score ? `${analysisData.content_assessment.sentence_structure_score}%` : "N/A"}
              </div>
              <div className="text-sm font-semibold text-gray-800">Sentence Structure</div>
              <div className="text-xs text-gray-500">
                ~{analysisData?.content_assessment?.avg_words_per_sentence || "N/A"} words/sentence
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {analysisData?.content_assessment?.content_length_score ? `${analysisData.content_assessment.content_length_score}%` : "N/A"}
              </div>
              <div className="text-sm font-semibold text-gray-800">Content Length</div>
              <div className="text-xs text-gray-500">Good depth</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-0 shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center space-x-3 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
              <span className="text-2xl">🎯</span>
              <span className="font-semibold text-lg">Performance Summary</span>
            </div>
            <h3 className="text-2xl font-bold">
              {getOverallScore() >= 80 ? 'Excellent performance!' : 
               getOverallScore() >= 70 ? 'Good performance!' : 
               getOverallScore() >= 60 ? 'Average performance' : 
               'Room for improvement'}
            </h3>
            <p className="text-lg opacity-90">
              {getOverallScore() >= 80 ? 'You are performing exceptionally well!' :
               getOverallScore() >= 70 ? 'You are doing well with minor improvements needed.' :
               getOverallScore() >= 60 ? 'You have a solid foundation to build upon.' :
               coachingData?.suggestions || 'Focus on the key areas for improvement.'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">
                  {getOverallScore() || 'N/A'}
                </div>
                <div className="text-sm opacity-80">Your Score</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">
                  {analysisData?.content_assessment?.industry_average ? `${analysisData.content_assessment.industry_average}/100` : '75/100'}
                </div>
                <div className="text-sm opacity-80">Industry Average</div>
              </div>
            </div>
            
            <div className="mt-8">
              <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm px-8 py-3 rounded-xl shadow-lg transition-all duration-300">
                <Download className="w-5 h-5 mr-2" />
                Download Full Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
