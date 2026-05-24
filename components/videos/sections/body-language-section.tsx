"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  computeBodyLanguageMetrics,
  PoseAnalysisData,
  EmotionAnalysisData,
} from "@/lib/body-language";

interface Props {
  analysisData?: { emotion_analysis?: EmotionAnalysisData } | null;
  poseData?: PoseAnalysisData | null;
}

export function BodyLanguageSection({ analysisData, poseData }: Props) {
  const metrics = computeBodyLanguageMetrics(poseData || undefined, analysisData?.emotion_analysis || undefined);

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-8 shadow-lg border border-emerald-100">
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
          <span className="text-xl">🤝</span>
          <span className="font-semibold text-lg">Body Language Analysis</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-lg h-full flex flex-col justify-center items-center">
            <div className="mb-4">
              <div className="text-5xl font-bold text-emerald-600 mb-2">{metrics.gauge.score5.toFixed(1)}</div>
              <div className="text-lg text-gray-600">out of 5</div>
            </div>
            <div className="relative flex flex-col items-center justify-center mb-4" style={{ width: 100, height: 100 }}>
              <div className="relative" style={{ width: 100, height: 100 }}>
                {(() => {
                  const radius = 46;
                  const circumference = 2 * Math.PI * radius;
                  const offset = circumference * (1 - metrics.gauge.score100 / 100);
                  return (
                    <svg width={100} height={100} className="transform -rotate-90">
                      <circle cx={50} cy={50} r={radius} stroke="currentColor" strokeWidth={8} fill="none" className="text-gray-200" />
                      <circle cx={50} cy={50} r={radius} stroke="currentColor" strokeWidth={8} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} className={`transition-all duration-1000 ${metrics.gauge.score100 >= 60 ? "text-green-600" : "text-red-600"}`} strokeLinecap="round" />
                    </svg>
                  );
                })()}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-700">{metrics.gauge.score100}</div>
                    <div className="text-xs text-gray-500">out of 100</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <div className={`inline-flex items-center rounded-full border text-xs font-semibold px-3 py-1 ${
                metrics.gauge.verdict === "Excellent"
                  ? "bg-green-100 text-green-800"
                  : metrics.gauge.verdict === "Good"
                  ? "bg-yellow-100 text-yellow-800"
                  : metrics.gauge.verdict === "Average"
                  ? "bg-orange-100 text-orange-800"
                  : "bg-red-100 text-red-800"
              }`}>{metrics.gauge.verdict}</div>
            </div>

            <div className="grid grid-cols-1 gap-4 w-full">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <h4 className="font-bold mb-3 text-green-700 flex items-center text-sm">
                  <span className="text-lg mr-2">🌟</span>YOUR TOP AREAS
                </h4>
                <ul className="space-y-1 text-xs">
                  {metrics.topAreas.length > 0 ? metrics.topAreas.map((t, i) => (
                    <li key={i} className="flex items-center text-green-700">
                      <span className="mr-2">✅</span>{t}
                    </li>
                  )) : (
                    <li className="text-green-700">N/A</li>
                  )}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                <h4 className="font-bold mb-3 text-red-700 flex items-center text-sm">
                  <span className="text-lg mr-2">🎯</span>AREAS FOR IMPROVEMENT
                </h4>
                <ul className="space-y-1 text-xs">
                  {metrics.improvements.map((t, i) => (
                    <li key={i} className="flex items-center text-red-700">
                      <span className="mr-2">🔴</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Positive Facial Expression from emotion + smiles */}
            <div className="bg-white rounded-lg border border-green-200 p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xl">😊</span>
                <span className="font-semibold text-sm">Positive Facial Expression</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Surprise</span>
                  <Badge className="bg-green-100 text-green-800 text-xs">{metrics.facial.positive.surprisePct ?? 0}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Happy</span>
                  <Badge className="bg-green-100 text-green-800 text-xs">{metrics.facial.positive.happyPct ?? 0}%</Badge>
                </div>
              </div>
            </div>

            {/* Negative Facial Expression from emotion */}
            <div className="bg-white rounded-lg border border-red-200 p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xl">😐</span>
                <span className="font-semibold text-sm">Negative Facial Expression</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Neutral</span>
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">{metrics.facial.negative.neutralPct ?? 0}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Sad</span>
                  <Badge className="bg-red-100 text-red-800 text-xs">{metrics.facial.negative.sadPct ?? 0}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Angry</span>
                  <Badge className="bg-red-100 text-red-800 text-xs">{metrics.facial.negative.angryPct ?? 0}%</Badge>
                </div>
              </div>
            </div>

            {/* Frequency analysis */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-bold mb-3 text-sm flex items-center">
                <span className="text-lg mr-2">📊</span>FREQUENCY ANALYSIS
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <span className="text-xs font-medium">Gaze</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-bold">{metrics.frequency.gazePct}%</span>
                    <div className={`px-2 py-0.5 rounded text-xs ${metrics.frequency.gazePct >= 70 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {metrics.frequency.gazePct >= 70 ? "Good" : "Needs Work"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">👤</span>
                    <span className="text-xs font-medium">Head Position</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-bold">{metrics.frequency.headPositionStablePct}%</span>
                    <div className={`px-2 py-0.5 rounded text-xs ${metrics.frequency.headPositionStablePct >= 70 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {metrics.frequency.headPositionStablePct >= 70 ? "Good" : "Needs Work"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">🤲</span>
                    <span className="text-xs font-medium">Hand Movement</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-bold">{metrics.frequency.handMovementPct}%</span>
                    <div className={`px-2 py-0.5 rounded text-xs ${metrics.frequency.handMovementPct >= 30 && metrics.frequency.handMovementPct <= 60 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {metrics.frequency.handMovementPct >= 30 && metrics.frequency.handMovementPct <= 60 ? "Good" : "Needs Work"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Body posture */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-bold mb-3 text-sm flex items-center">
                <span className="text-lg mr-2">🏃</span>BODY POSTURE
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium">Straight Posture</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-bold">{metrics.posture.straightPosturePct}%</span>
                    <div className={`px-2 py-0.5 rounded text-xs ${metrics.posture.straightPosturePct >= 70 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {metrics.posture.straightPosturePct >= 70 ? "Good" : "Poor"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium">Shoulder Position</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-bold">{metrics.posture.shoulderPositionStablePct}%</span>
                    <div className={`px-2 py-0.5 rounded text-xs ${metrics.posture.shoulderPositionStablePct >= 70 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {metrics.posture.shoulderPositionStablePct >= 70 ? "Good" : "Poor"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="text-xl">💡</div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">Insights</h4>
                <p className="text-xs text-gray-600">{metrics.notes.join(" ") || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BodyLanguageSection;
