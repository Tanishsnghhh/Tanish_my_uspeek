'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CommunicationAnalysisSectionProps {
  analysisData: any;
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

interface CommunicationAnalysisSectionProps {
  poseData?: PoseAnalysisData | null;
}

export function CommunicationAnalysisSection({ poseData }: CommunicationAnalysisSectionProps) {
  // Helper functions to extract data safely
  const getPercentageValue = (dataStr: string): number => {
    if (!dataStr) return 0;
    const match = dataStr.match(/\((\d+(?:\.\d+)?)%\)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const getCountValue = (dataStr: string): number => {
    if (!dataStr) return 0;
    const match = dataStr.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const getVocalScore = (): number => {
    if (!poseData?.audio) return 0;
    return Math.round(Math.min(Math.max(poseData.audio.volume_db + 60, 0), 100));
  };

  const getBodyLanguageScore = (): number => {
    if (!poseData) return 0;
    const smileScore = getPercentageValue(poseData.smiles);
    const eyeContactScore = getPercentageValue(poseData.eye_contact);
    return Math.round((smileScore + eyeContactScore) / 2);
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
      {/* Body Language Analysis */}
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
                <div className="text-5xl font-bold text-emerald-600 mb-2">{((getBodyLanguageScore() || 0) / 20).toFixed(1)}</div>
                <div className="text-lg text-gray-600">out of 5</div>
              </div>
              <div className="relative flex flex-col items-center justify-center mb-4" style={{ width: 100, height: 100 }}>
                <CircularProgress score={getBodyLanguageScore() || 0} size={100} strokeWidth={8} />
              </div>
              <div className="mb-4">
                <Badge className={`px-3 py-1 ${getBodyLanguageScore() >= 80 ? 'bg-green-100 text-green-800' : 
                  getBodyLanguageScore() >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                  {getBodyLanguageScore() >= 80 ? 'Excellent' : getBodyLanguageScore() >= 70 ? 'Good' : 'Needs Improvement'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 w-full">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <h4 className="font-bold mb-3 text-green-700 flex items-center text-sm">
                    <span className="text-lg mr-2">🌟</span>YOUR TOP AREAS
                  </h4>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center text-green-700">
                      <span className="mr-2">✅</span>{poseData?.eye_contact && getPercentageValue(poseData.eye_contact) >= 70 ? 'Good eye contact' : 'Your posture looks good'}
                    </li>
                    <li className="flex items-center text-green-700">
                      <span className="mr-2">✅</span>{poseData?.hand_moves && getPercentageValue(poseData.hand_moves) >= 30 ? 'Good hand movements' : 'Your hand movements are good'}
                    </li>
                    <li className="flex items-center text-green-700">
                      <span className="mr-2">✅</span>Your head movements look fine
                    </li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                  <h4 className="font-bold mb-3 text-red-700 flex items-center text-sm">
                    <span className="text-lg mr-2">🎯</span>AREAS FOR IMPROVEMENT
                  </h4>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center text-red-700">
                      <span className="mr-2">🔴</span>{poseData?.eye_contact && getPercentageValue(poseData.eye_contact) < 70 ? 'Improve eye contact' : 'N/A'}
                    </li>
                    <li className="flex items-center text-red-700">
                      <span className="mr-2">🔴</span>{poseData?.hand_moves && getPercentageValue(poseData.hand_moves) < 30 ? 'Use more hand gestures' : 'N/A'}
                    </li>
                    <li className="flex items-center text-red-700">
                      <span className="mr-2">🔴</span>{poseData?.smiles && getPercentageValue(poseData.smiles) < 50 ? 'Smile more often' : 'N/A'}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border border-green-200 p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xl">😊</span>
                  <span className="font-semibold text-sm">Positive Facial Expression</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Smiles</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {poseData?.smiles ? `${getPercentageValue(poseData.smiles)}%` : "N/A"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Eye Contact</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {poseData?.eye_contact ? `${getPercentageValue(poseData.eye_contact)}%` : "N/A"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-red-200 p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xl">😐</span>
                  <span className="font-semibold text-sm">Body Movement</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Head Movement</span>
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                      {poseData?.head_moves ? `${getPercentageValue(poseData.head_moves)}%` : "N/A"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Leg Movement</span>
                    <Badge className="bg-red-100 text-red-800 text-xs">
                      {poseData?.leg_moves ? `${getPercentageValue(poseData.leg_moves)}%` : "N/A"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Foot Movement</span>
                    <Badge className="bg-red-100 text-red-800 text-xs">
                      {poseData?.foot_moves ? `${getPercentageValue(poseData.foot_moves)}%` : "N/A"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-bold mb-3 text-sm flex items-center">
                  <span className="text-lg mr-2">📊</span>FREQUENCY ANALYSIS
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">👁️</span>
                      <span className="text-xs font-medium">Gaze</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold">
                        {poseData?.eye_contact ? `${getPercentageValue(poseData.eye_contact)}%` : "N/A"}
                      </span>
                      <div className={`px-2 py-0.5 rounded text-xs ${poseData?.eye_contact && getPercentageValue(poseData.eye_contact) >= 70 ? 
                        'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {poseData?.eye_contact && getPercentageValue(poseData.eye_contact) >= 70 ? 'Good' : 'Needs Work'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">👤</span>
                      <span className="text-xs font-medium">Head Position</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold">
                        {poseData?.head_moves ? `${getPercentageValue(poseData.head_moves)}%` : "N/A"}
                      </span>
                      <div className={`px-2 py-0.5 rounded text-xs ${poseData?.head_moves && getPercentageValue(poseData.head_moves) >= 70 ? 
                        'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {poseData?.head_moves && getPercentageValue(poseData.head_moves) >= 70 ? 'Good' : 'Needs Work'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">🤲</span>
                      <span className="text-xs font-medium">Hand Movement</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold">
                        {poseData?.hand_moves ? `${getPercentageValue(poseData.hand_moves)}%` : "N/A"}
                      </span>
                      <div className={`px-2 py-0.5 rounded text-xs ${poseData?.hand_moves && getPercentageValue(poseData.hand_moves) >= 30 ? 
                        'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {poseData?.hand_moves && getPercentageValue(poseData.hand_moves) >= 30 ? 'Good' : 'Needs Work'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-bold mb-3 text-sm flex items-center">
                  <span className="text-lg mr-2">🏃</span>BODY POSTURE
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-medium">Straight Posture</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold">
                        {poseData?.head_moves && poseData?.eye_contact ? 
                          `${Math.round((getPercentageValue(poseData.head_moves) + getPercentageValue(poseData.eye_contact)) / 2)}%` : 
                          "N/A"
                        }
                      </span>
                      <div className={`px-2 py-0.5 rounded text-xs ${poseData?.head_moves && poseData?.eye_contact && 
                        ((getPercentageValue(poseData.head_moves) + getPercentageValue(poseData.eye_contact)) / 2) >= 70 ? 
                        'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {poseData?.head_moves && poseData?.eye_contact && 
                         ((getPercentageValue(poseData.head_moves) + getPercentageValue(poseData.eye_contact)) / 2) >= 70 ? 
                         'Good' : 'Poor'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-medium">Shoulder Position</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold">
                        {poseData?.hand_moves ? `${getPercentageValue(poseData.hand_moves)}%` : "N/A"}
                      </span>
                      <div className={`px-2 py-0.5 rounded text-xs ${poseData?.hand_moves && getPercentageValue(poseData.hand_moves) >= 50 ? 
                        'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {poseData?.hand_moves && getPercentageValue(poseData.hand_moves) >= 50 ? 'Good' : 'Poor'}
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
                  <p className="text-xs text-gray-600">
                    {getBodyLanguageScore() >= 80 ? 'Excellent body language! You maintain good eye contact and confident posture.' :
                     getBodyLanguageScore() >= 70 ? 'Good body language overall. Focus on maintaining consistent eye contact.' :
                     'Consider working on your eye contact and hand gestures to improve engagement.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Vocal Tone Analysis */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">🎤</span>
            <span className="font-semibold text-lg">Vocal Tone Analysis</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-0 shadow-xl h-full">
              <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
                <div className="mb-6">
                  <div className="text-6xl font-bold text-purple-600 mb-2">
                    {getVocalScore() ? (getVocalScore() / 20).toFixed(1) : 'N/A'}
                  </div>
                  <div className="text-lg text-gray-600">out of 5</div>
                </div>
                <div className="relative flex flex-col items-center justify-center" style={{ width: 100, height: 100 }}>
                  <CircularProgress score={getVocalScore() || 0} size={100} strokeWidth={8} />
                </div>
                <div className="mt-6">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    🎯 Best Part of Speech - {getVocalScore() >= 80 ? 'Great' : getVocalScore() >= 70 ? 'Good' : 'Needs Work'}
                  </div>
                </div>
                <div className="mt-4 space-y-2 w-full">
                  <div className="flex justify-between text-sm">
                    <span>Avg Pace</span>
                    <span className="font-semibold">Medium</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Tone</span>
                    <span className="font-semibold">Avg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Voice Insights</h4>
                    <p className="text-sm text-gray-600">
                      {getVocalScore() >= 80 ? 'Excellent vocal performance! Your volume and pitch are well-controlled.' :
                       getVocalScore() >= 70 ? 'Good vocal quality. Consider adding more pitch variation for engagement.' :
                       'Focus on improving volume control and adding vocal variety to enhance delivery.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audio Processing Details */}
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-center">
                  <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm mb-2">AUDIO PROCESSING</div>
                  Voice Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-indigo-600">
                      {poseData?.audio?.duration_sec ? `${poseData.audio.duration_sec.toFixed(2)}s` : "N/A"}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">DURATION</div>
                    <div className="text-sm font-semibold text-indigo-600">Total Length</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-indigo-600">
                      {poseData?.audio?.volume_db ? `${poseData.audio.volume_db.toFixed(2)} dB` : "N/A"}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">VOLUME</div>
                    <div className="text-sm font-semibold text-indigo-600">Average Volume</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-indigo-600">
                      {poseData?.audio?.mean_pitch_hz ? `${poseData.audio.mean_pitch_hz.toFixed(2)} Hz` : "N/A"}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">MEAN PITCH</div>
                    <div className="text-sm font-semibold text-indigo-600">Average Pitch</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-indigo-600">
                      {poseData?.audio?.pitch_range || "N/A"}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">PITCH RANGE</div>
                    <div className="text-sm font-semibold text-indigo-600">Frequency Range</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-indigo-600">
                      {poseData?.audio?.num_pauses || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">PAUSES</div>
                    <div className="text-sm font-semibold text-indigo-600">Number of Pauses</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-indigo-600">
                      {poseData?.audio?.spoken_duration_sec ? `${poseData.audio.spoken_duration_sec.toFixed(2)}s` : "N/A"}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">SPEAKING TIME</div>
                    <div className="text-sm font-semibold text-indigo-600">Active Speaking</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Top Areas & Areas for Improvement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-lg">
            <h4 className="font-bold mb-4 text-green-700 flex items-center">
              <span className="text-2xl mr-2">🌟</span>YOUR TOP AREAS
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center text-green-700">
                <span className="mr-2">✅</span>{poseData?.audio?.volume_db && poseData.audio.volume_db >= 60 ? 'Good volume control' : 'Consistent vocal delivery'}
              </li>
              <li className="flex items-center text-green-700">
                <span className="mr-2">✅</span>{poseData?.audio?.mean_pitch_hz && poseData.audio.mean_pitch_hz >= 200 ? 'Clear pitch' : 'Clear articulation'}
              </li>
              <li className="flex items-center text-green-700">
                <span className="mr-2">✅</span>{poseData?.audio?.num_pauses !== undefined && poseData.audio.num_pauses <= 2 ? 'Minimal pauses' : 'Good pacing'}
              </li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 shadow-lg">
            <h4 className="font-bold mb-4 text-orange-700 flex items-center">
              <span className="text-2xl mr-2">🎯</span>AREAS FOR IMPROVEMENT
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center text-orange-700">
                <span className="mr-2">🔶</span>{poseData?.audio?.mean_pitch_hz && poseData.audio.mean_pitch_hz < 200 ? 'Add pitch variation' : 'Enhance vocal variety'}
              </li>
              <li className="flex items-center text-orange-700">
                <span className="mr-2">🔶</span>{poseData?.audio?.volume_db && poseData.audio.volume_db < 60 ? 'Improve modulation' : 'Work on emphasis'}
              </li>
            </ul>
          </div>
        </div>

        <Card className="bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200">
          <CardContent className="p-6">
            <div className="text-sm text-gray-700">
              <strong>Note:</strong> Voice analysis is based on audio processing algorithms that measure volume, pitch, and speaking patterns to provide insights into vocal delivery effectiveness.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
