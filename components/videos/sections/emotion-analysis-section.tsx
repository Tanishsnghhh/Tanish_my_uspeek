'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EmotionAnalysisSectionProps {
  analysisData: {
    emotion_analysis?: {
      dominant_emotion: string;
      emoji: string;
      confidence: number;
      emotion_scores: { [key: string]: number };
      detected_keywords: string[][];
    };
  } | null;
}

export default function EmotionAnalysisSection({ analysisData }: EmotionAnalysisSectionProps) {
  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      happy: 'text-yellow-600 bg-yellow-100',
      sad: 'text-blue-600 bg-blue-100',
      angry: 'text-red-600 bg-red-100',
      fear: 'text-purple-600 bg-purple-100',
      surprise: 'text-green-600 bg-green-100',
      disgust: 'text-gray-600 bg-gray-100',
      neutral: 'text-gray-600 bg-gray-100',
      'no emotion detected': 'text-gray-600 bg-gray-100'
    };
    return colors[emotion.toLowerCase()] || 'text-gray-600 bg-gray-100';
  };

  // Normalize a raw emotion_scores object (counts) into percentages
  const getNormalizedScores = (emotionScores?: { [key: string]: number }) => {
    if (!emotionScores) return { total: 0, percents: {} as { [key: string]: number } };
    const total = Object.values(emotionScores).reduce((acc, v) => acc + (typeof v === 'number' ? v : Number(v) || 0), 0);
    const percents: { [key: string]: number } = {};
    if (total > 0) {
      for (const [emo, val] of Object.entries(emotionScores)) {
        const num = typeof val === 'number' ? val : Number(val) || 0;
        percents[emo] = (num / total) * 100;
      }
    } else {
      for (const emo of Object.keys(emotionScores)) {
        percents[emo] = 0;
      }
    }
    return { total, percents };
  };

  // Extract keywords from detected_keywords which may be [emotion, keyword] tuples
  const getDisplayKeywords = (detected: unknown): string[] => {
    if (!Array.isArray(detected)) return [];
    const out: string[] = [];
    for (const item of detected as any[]) {
      if (Array.isArray(item) && item.length >= 2) {
        out.push(String(item[1]));
      } else if (typeof item === 'string') {
        out.push(item);
      } else if (item && typeof item === 'object' && 'keyword' in item) {
        // in case backend changes to objects later
        // @ts-ignore
        out.push(String(item.keyword));
      }
    }
    // de-duplicate while preserving order
    return Array.from(new Set(out));
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
          <span className="text-xl">🎭</span>
          <span className="font-semibold text-lg">Emotion Analysis</span>
        </div>
        <p className="text-gray-600 mt-2">Detailed emotion categorization based on NLP & Social Media Models</p>
      </div>

      {/* Overall Emotion */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-0 shadow-xl">
        <CardContent className="p-8">
          {analysisData?.emotion_analysis ? (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-3xl">{analysisData.emotion_analysis.emoji || "😊"}</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {analysisData.emotion_analysis.dominant_emotion}
                  </h3>
                  <p className="text-gray-600">
                    Confidence: {analysisData.emotion_analysis.confidence}%
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700 italic">
                  The dominant emotion detected in your speech is <strong>{analysisData.emotion_analysis.dominant_emotion.toLowerCase()}</strong> with high confidence.
                </p>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">Detected Keywords:</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisData.emotion_analysis.detected_keywords && analysisData.emotion_analysis.detected_keywords.length > 0 ? 
                    getDisplayKeywords(analysisData.emotion_analysis.detected_keywords).map((keyword: string, index: number) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium">
                        {keyword}
                      </span>
                    )) : 
                    <span className="bg-gray-100 text-gray-800 px-3 py-2 rounded-full text-sm font-medium">No specific keywords detected</span>
                  }
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Emotion Breakdown:</h4>
                <div className="space-y-3">
                  {analysisData.emotion_analysis.emotion_scores ? 
                    Object.entries(getNormalizedScores(analysisData.emotion_analysis.emotion_scores).percents).map(([emotion, percent]: [string, number]) => (
                      <div key={emotion} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-500">
                            {emotion.includes('Joy') || emotion.includes('Happiness') || emotion.includes('Love') || emotion.includes('Optimism') ? '😊' :
                             emotion.includes('Sadness') || emotion.includes('Pessimism') ? '😢' :
                             emotion.includes('Anger') ? '😠' :
                             emotion.includes('Fear') ? '😨' :
                             emotion.includes('Surprise') ? '😲' :
                             emotion.includes('Disgust') ? '🤢' :
                             emotion.includes('Trust') ? '🤝' :
                             emotion.includes('Anticipation') ? '🤔' :
                             emotion.toLowerCase() === 'no emotion detected' ? '🤔' :
                             '😐'}
                          </span>
                          <span className="text-sm font-medium text-gray-700">{emotion}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full" 
                              style={{ width: `${percent.toFixed(0)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-gray-800 w-12 text-right">
                            {percent.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )) : 
                    <div className="text-center py-4">
                      <span className="bg-gray-100 text-gray-800 px-3 py-2 rounded-full text-sm font-medium">No emotion breakdown available</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No emotion analysis available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
