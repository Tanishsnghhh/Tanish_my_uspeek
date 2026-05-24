"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ContentAnalysisProps {
  analysisData: {
    sentiment_analysis?: {
      overall_sentiment?: string;
      confidence?: number;
    };
    emotion_analysis?: {
      dominant_emotion?: string;
      confidence?: number;
    };
    content_assessment?: {
      quality_score?: number;
      vocabulary_diversity?: number;
      complexity_level?: string;
      overall_strength?: number;
      strength_level?: string;
      strength_description?: string;
      top_strength?: string;
      key_improvement?: string;
      filler_words_percentage?: number;
      avg_words_per_sentence?: number;
      word_count?: number;
    };
    repeated_words?: Array<{
      word: string;
      count: number;
    }>;
    filler_words?: Array<{
      word: string;
      count: number;
      percentage: number;
    }>;
  };
}

export function ContentAnalysisSummary({ analysisData }: ContentAnalysisProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
          <span className="text-xl">📊</span>
          <span className="text-lg font-semibold">Content Analysis Summary</span>
        </div>
        <p className="text-gray-600 mt-2">Based on vocabulary, fluency, sentence structure, and other metrics</p>
      </div>

      {/* Key Insights Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800">Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Sentiment */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-500">😊</span>
                <span className="text-sm font-medium">Sentiment</span>
              </div>
              <Badge className="bg-green-100 text-green-800">
                {analysisData?.sentiment_analysis?.overall_sentiment || "N/A"} ({analysisData?.sentiment_analysis?.confidence ? `${analysisData.sentiment_analysis.confidence}%` : "N/A"} confidence)
              </Badge>
            </div>

            {/* Dominant Emotion */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-500">😊</span>
                <span className="text-sm font-medium">Dominant Emotion</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {analysisData?.emotion_analysis?.dominant_emotion || "N/A"} ({typeof analysisData?.emotion_analysis?.confidence === 'number' ? `${analysisData.emotion_analysis.confidence}%` : "N/A"} confidence)
              </Badge>
            </div>

            {/* Content Quality */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-500">🌟</span>
                <span className="text-sm font-medium">Content Quality</span>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">
                {analysisData?.content_assessment?.quality_score ? `${analysisData.content_assessment.quality_score}%` : "N/A"} overall quality score
              </Badge>
            </div>

            {/* Vocabulary Diversity */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-blue-500">📚</span>
                <span className="text-sm font-medium">Vocabulary Diversity</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {analysisData?.content_assessment?.vocabulary_diversity ? `${analysisData.content_assessment.vocabulary_diversity}%` : "N/A"} unique words
              </Badge>
            </div>

            {/* Complexity Level */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-purple-500">🍭</span>
                <span className="text-sm font-medium">Complexity Level</span>
              </div>
              <Badge className="bg-purple-100 text-purple-800">
                {analysisData?.content_assessment?.complexity_level || "N/A"}
              </Badge>
            </div>

            {/* Overall Strength */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-indigo-500">👌</span>
                <span className="text-sm font-medium">Overall Strength</span>
              </div>
              <Badge className="bg-indigo-100 text-indigo-800">
                {analysisData?.content_assessment?.overall_strength ? `${analysisData.content_assessment.overall_strength}%` : "N/A"} content strength
              </Badge>
            </div>

            {/* Top Strength */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-green-600">✅</span>
                <span className="text-sm font-medium">Top Strength</span>
              </div>
              <Badge className="bg-green-100 text-green-800">
                {analysisData?.content_assessment?.top_strength || "N/A"}
              </Badge>
            </div>

            {/* Key Improvement */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-orange-600">🧑‍💻</span>
                <span className="text-sm font-medium">Key Improvement</span>
              </div>
              <Badge className="bg-orange-100 text-orange-800">
                {analysisData?.content_assessment?.key_improvement || "N/A"}
              </Badge>
            </div>

            {/* Speaking Fluency */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-600">⚠️</span>
                <span className="text-sm font-medium">Speaking Fluency</span>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">
                {analysisData?.content_assessment?.filler_words_percentage !== undefined ? `${analysisData.content_assessment.filler_words_percentage}%` : "N/A"} filler words detected
              </Badge>
            </div>

            {/* Sentence Structure */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-blue-600">✏️</span>
                <span className="text-sm font-medium">Sentence Structure</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {analysisData?.content_assessment?.avg_words_per_sentence ? `Average ${analysisData.content_assessment.avg_words_per_sentence}` : "N/A"} words per sentence
              </Badge>
            </div>

            {/* Most Repeated Word */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-pink-600">🔁</span>
                <span className="text-sm font-medium">Most Repeated Word</span>
              </div>
              <Badge className="bg-pink-100 text-pink-800">
                {analysisData?.repeated_words && analysisData.repeated_words.length > 0 ? 
                  `"${analysisData.repeated_words[0].word}" used ${analysisData.repeated_words[0].count} times` : 
                  "N/A"
                }
              </Badge>
            </div>

            {/* Top Filler Word */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-orange-600">🗣️</span>
                <span className="text-sm font-medium">Top Filler Word</span>
              </div>
              <Badge className="bg-orange-100 text-orange-800">
                {analysisData?.filler_words && analysisData.filler_words.length > 0 ? 
                  `"${analysisData.filler_words[0].word}" (${analysisData.filler_words[0].percentage}% of content)` : 
                  "N/A"
                }
              </Badge>
            </div>

            {/* Content Length */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-500">📏</span>
                <span className="text-sm font-medium">Content Length</span>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">
                {analysisData?.content_assessment?.word_count ? `${analysisData.content_assessment.word_count}` : "N/A"} words total
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Strength Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">💪</span>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Overall Strength</h3>
                <p className="text-gray-600">Your content shows strength in several important areas</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-green-600">
                {analysisData?.content_assessment?.overall_strength ? `${analysisData.content_assessment.overall_strength}%` : "N/A"}
              </div>
              <Badge className="bg-green-100 text-green-800 mt-2">
                {analysisData?.content_assessment?.strength_level || "N/A"}
              </Badge>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div className="bg-green-500 h-4 rounded-full" style={{ width: `${analysisData?.content_assessment?.overall_strength || 0}%` }}></div>
          </div>
          
          <p className="text-sm text-gray-600 text-center">
            {analysisData?.content_assessment?.strength_description || "N/A"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
