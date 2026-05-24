'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface DjangoAnalysisData {
  sentiment_analysis?: {
    overall_sentiment: string;
    positive_score: number;
    negative_score: number;
    neutral_score: number;
    confidence: number;
  };
}

interface SentimentAnalysisSectionProps {
  analysisData?: DjangoAnalysisData | null;
}

export function SentimentAnalysisSection({ analysisData }: SentimentAnalysisSectionProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
          <span className="text-xl">😊</span>
          <span className="font-semibold text-lg">Sentiment Analysis</span>
        </div>
        <p className="text-gray-600 mt-2">Analysis of the emotional tone of your content</p>
      </div>

      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">😊</span>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Overall Sentiment: {analysisData?.sentiment_analysis?.overall_sentiment ? 
                    analysisData.sentiment_analysis.overall_sentiment.charAt(0).toUpperCase() + 
                    analysisData.sentiment_analysis.overall_sentiment.slice(1) : "N/A"}
                </h3>
                <p className="text-gray-600">
                  Confidence: {analysisData?.sentiment_analysis?.confidence ? `${analysisData.sentiment_analysis.confidence}%` : "N/A"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Positive</span>
              <div className="flex items-center space-x-2">
                <div className="w-64 bg-gray-200 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: `${analysisData?.sentiment_analysis?.positive_score || 0}%` }}></div>
                </div>
                <span className="text-sm font-bold text-green-600">{analysisData?.sentiment_analysis?.positive_score || 0}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Negative</span>
              <div className="flex items-center space-x-2">
                <div className="w-64 bg-gray-200 rounded-full h-3">
                  <div className="bg-red-500 h-3 rounded-full" style={{ width: `${analysisData?.sentiment_analysis?.negative_score || 0}%` }}></div>
                </div>
                <span className="text-sm font-bold text-red-600">{analysisData?.sentiment_analysis?.negative_score || 0}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Neutral</span>
              <div className="flex items-center space-x-2">
                <div className="w-64 bg-gray-200 rounded-full h-3">
                  <div className="bg-gray-500 h-3 rounded-full" style={{ width: `${analysisData?.sentiment_analysis?.neutral_score || 0}%` }}></div>
                </div>
                <span className="text-sm font-bold text-gray-600">{analysisData?.sentiment_analysis?.neutral_score || 0}%</span>
              </div>
            </div>
          </div>

          {/* Sentiment Insights */}
          <div className="mt-6 bg-white/60 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">💭</div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Sentiment Insights</h4>
                <p className="text-sm text-gray-600">
                  {analysisData?.sentiment_analysis?.overall_sentiment === 'positive' && analysisData.sentiment_analysis.positive_score >= 90 ? 
                    'Excellent! Your content shows very positive sentiment, which can be highly engaging for your audience.' :
                  analysisData?.sentiment_analysis?.overall_sentiment === 'positive' && analysisData.sentiment_analysis.positive_score >= 70 ?
                    'Good positive sentiment detected. Your message comes across as optimistic and engaging.' :
                  analysisData?.sentiment_analysis?.overall_sentiment === 'negative' && analysisData.sentiment_analysis.negative_score >= 70 ?
                    'Your content shows negative sentiment. Consider adding more positive language to improve engagement.' :
                  analysisData?.sentiment_analysis?.overall_sentiment === 'neutral' ?
                    'Your content has a neutral tone. Consider adding more emotional language to increase engagement.' :
                    'Sentiment analysis shows mixed emotions in your content.'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
