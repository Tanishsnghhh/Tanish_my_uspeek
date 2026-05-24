'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Volume2, 
  Download, 
  Eye, 
  Calendar, 
  Clock, 
  User,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MessageSquare,
  Mic,
  Users,
  FileText
} from 'lucide-react';
import { computeBodyLanguageMetrics, type PoseAnalysisData as LibPoseData, type EmotionAnalysisData as LibEmotionData } from '@/lib/body-language';
import { exportToPDF, downloadVideoReportPDF } from '@/lib/pdf-export';
import { DynamicVideoThumbnail } from '@/components/ui/dynamic-video-thumbnail';

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
  confidence_analysis: any;
  videoUrl?: string;
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

interface UserData {
  name?: string;
  email?: string;
  role?: string;
  title?: string;
  avatar?: string;
  department?: string;
  isAdmin?: boolean;
  employeeId?: string;
  position?: string;
  profilePicture?: string;
}

interface VideoReportProps {
  analysisData?: DjangoAnalysisData | null;
  poseData?: PoseAnalysisData | null;
  coachingData?: CoachingData | null;
  userData?: UserData | null;
  uploadId?: string; // Added uploadId prop for dynamic thumbnails
  onClose: () => void;
}

export function VideoReport({ analysisData, poseData, coachingData, userData, uploadId, onClose }: VideoReportProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(100);
  const [duration, setDuration] = useState(0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video event handlers
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
    }
  };

  const handleSeek = (newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 🔧 DEBUG: Log the actual data being received
  console.log('🔍 DEBUG - analysisData received:', {
    word_power_score: analysisData?.content_assessment?.word_power_score,
    word_power_percentage: analysisData?.content_assessment?.word_power_percentage,
    full_content_assessment: analysisData?.content_assessment,
    confidence_analysis: analysisData?.confidence_analysis
  });

  // 🔧 DEBUG: Log pose and emotion data for Body Language Analysis
  console.log('🔍 DEBUG - poseData received:', poseData);
  console.log('🔍 DEBUG - emotion_analysis received:', analysisData?.emotion_analysis);

  // Compute body language metrics using Django MediaPipe outputs
  const bodyLanguageMetrics = computeBodyLanguageMetrics(
    poseData as LibPoseData | null,
    analysisData?.emotion_analysis as LibEmotionData | null
  );

  // 🔧 DEBUG: Log computed body language metrics
  console.log('🔍 DEBUG - bodyLanguageMetrics computed:', bodyLanguageMetrics);

  // Helper function to get explanatory text for 0% values
  const getZeroExplanation = (metric: string, value: number): string => {
    if (value > 0) return `${value}%`;
    
    switch (metric) {
      case 'surprise':
        return '0% (no surprise detected)';
      case 'happy':
        return '0% (no smiles detected)';
      case 'neutral':
        return '0% (no neutral emotions)';
      case 'sad':
        return '0% (no sadness detected)';
      case 'angry':
        return '0% (no anger detected)';
      case 'gaze':
        return '0% (poor eye contact)';
      case 'hand_movement':
        return '0% (no hand gestures)';
      case 'head_position':
        return `${value}% (minimal movement)`;
      default:
        return `${value}% (not detected)`;
    }
  };

  // Helper function to get word power status and styling
  const getWordPowerStatus = (percentage: number) => {
    if (percentage >= 80) return { text: 'Excellent', className: 'bg-green-100 text-green-800' };
    if (percentage >= 60) return { text: 'Good', className: 'bg-yellow-100 text-yellow-800' };
    if (percentage >= 40) return { text: 'Average', className: 'bg-orange-100 text-orange-800' };
    return { text: 'Poor', className: 'bg-red-100 text-red-800' };
  };

  // Helper function to get word power insights
  const getWordPowerInsights = (percentage: number) => {
    if (percentage >= 80) return 'Your Word Power is excellent! You demonstrate strong vocabulary and communication skills.';
    if (percentage >= 60) return 'Your Word Power is good. Identify the areas that can enhance your score.';
    if (percentage >= 40) return 'Your Word Power is average. Focus on expanding vocabulary and reducing filler words.';
    return 'Your Word Power needs improvement. Work on vocabulary expansion and clarity.';
  };

  // Helper function to get sentiment badge class
  const getSentimentBadgeClass = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-100 text-green-800';
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Helper function to get sentiment label
  const getSentimentLabel = (percentage: number) => {
    if (percentage >= 70) return 'Good';
    if (percentage >= 40) return 'Average';
    return 'Poor';
  };

  // Helper function to get repetition badge class
  const getRepetitionBadgeClass = (count: number) => {
    if (count <= 2) return 'bg-green-100 text-green-800';
    if (count <= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Helper function to get repetition label
  const getRepetitionLabel = (count: number) => {
    if (count <= 2) return 'Good';
    if (count <= 5) return 'Average';
    return 'Poor';
  };

  // Function to highlight differences between original and corrected text
  const highlightTextDifferences = (original: string, corrected: string) => {
    if (!original || !corrected) return corrected || original || "N/A";
    
    // If transcripts are identical, just return the text
    if (original.trim() === corrected.trim()) {
      return (
        <div>
          <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded mb-2">
            ✨ No grammar corrections needed - your transcript is already well-structured!
          </div>
          <div className="text-gray-800">{corrected}</div>
        </div>
      );
    }

    // Enhanced word-based comparison with better matching
    const originalWords = original.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const correctedWords = corrected.split(/\s+/).filter(w => w.length > 0);
    
    const result = [];
    let correctedIndex = 0;
    
    // Simple diff approach - highlight words that don't appear in original
    for (let i = 0; i < correctedWords.length; i++) {
      const word = correctedWords[i];
      const wordLower = word.toLowerCase().replace(/[^\w]/g, '');
      
      // Check if this word (or its stem) exists in original
      const existsInOriginal = originalWords.some(origWord => {
        const origLower = origWord.replace(/[^\w]/g, '');
        return origLower === wordLower || 
               origLower.includes(wordLower) || 
               wordLower.includes(origLower) ||
               calculateSimilarity(origLower, wordLower) > 0.7;
      });
      
      if (!existsInOriginal && wordLower.length > 2) {
        // This is likely a correction or addition
        result.push(
          <span key={`correction-${i}`} className="text-red-600 font-semibold bg-red-50 px-1 rounded mx-0.5 border border-red-200">
            {word}
          </span>
        );
      } else {
        result.push(word);
      }
      
      // Add space except for last word
      if (i < correctedWords.length - 1) {
        result.push(' ');
      }
    }

    return result;
  };

  // Helper function to calculate word similarity
  const calculateSimilarity = (str1: string, str2: string): number => {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    const distance = getEditDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  };

  // Levenshtein distance calculation
  const getEditDistance = (str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };



  // Helper function to extract data safely
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

  // Emotion helpers: normalize raw counts to percentages and format detected keywords
  const getNormalizedEmotionScores = (scores?: Record<string, number>) => {
    if (!scores) return { total: 0, percents: {} as Record<string, number> };
    const total = Object.values(scores).reduce((acc, v) => acc + (typeof v === 'number' ? v : Number(v) || 0), 0);
    const percents: Record<string, number> = {};
    if (total > 0) {
      for (const [k, v] of Object.entries(scores)) {
        const num = typeof v === 'number' ? v : Number(v) || 0;
        percents[k] = (num / total) * 100;
      }
    } else {
      for (const k of Object.keys(scores)) percents[k] = 0;
    }
    return { total, percents };
  };

  const getDisplayKeywords = (detected: unknown): string[] => {
    if (!Array.isArray(detected)) return [];
    const out: string[] = [];
    for (const item of detected as any[]) {
      if (Array.isArray(item) && item.length >= 2) {
        out.push(String(item[1]));
      } else if (typeof item === 'string') {
        out.push(item);
      } else if (item && typeof item === 'object' && 'keyword' in item) {
        // @ts-ignore
        out.push(String(item.keyword));
      }
    }
    return Array.from(new Set(out));
  };

  // Calculate dynamic scores from Django data
  // Helper: compute dynamic vocal metrics similar in spirit to body language metrics
  const computeVocalMetrics = () => {
    const audio = poseData?.audio;
    const durationStr = analysisData?.duration || '';
    // Parse duration like "3:25" or "00:03:25" or "205.3s"
    const parseDurationSec = (s: string): number => {
      if (!s) return 0;
      const secMatch = s.match(/([0-9]+(?:\.[0-9]+)?)\s*s/);
      if (secMatch) return parseFloat(secMatch[1]);
      const parts = s.split(':').map(p => p.trim()).filter(Boolean);
      if (parts.length === 1) return parseFloat(parts[0]) || 0;
      if (parts.length === 2) {
        const [m, sec] = parts;
        return (parseFloat(m) || 0) * 60 + (parseFloat(sec) || 0);
      }
      if (parts.length >= 3) {
        const [h, m, sec] = parts.slice(-3);
        return (parseFloat(h) || 0) * 3600 + (parseFloat(m) || 0) * 60 + (parseFloat(sec) || 0);
      }
      return 0;
    };

    const totalDurationSec = parseDurationSec(durationStr);
    const transcript = analysisData?.original_transcript || '';
    const words = transcript ? transcript.split(/\s+/).filter(Boolean) : [];
    const minutes = totalDurationSec > 0 ? totalDurationSec / 60 : 0;
    const wpm = minutes > 0 ? Math.round(words.length / minutes) : 0;

    console.log('🔍 DEBUG - WPM Calculation:', {
      durationStr,
      totalDurationSec,
      wordsCount: words.length,
      minutes,
      wpm
    });

    // Normalize sub-scores (0-100)
    const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));
    // Volume: keep consistent with existing heuristic (db + 60 -> 0..100)
    const volumeDb = typeof audio?.volume_db === 'number' ? audio.volume_db : NaN;
    const volumeScore = isNaN(volumeDb) ? 0 : clamp(volumeDb + 60, 0, 100);

    // Pitch score: prefer ~160-230 Hz as strong/clear band; degrade as it diverges
    const pitchHz = typeof audio?.mean_pitch_hz === 'number' ? audio.mean_pitch_hz : NaN;
    let pitchScore = 0;
    if (!isNaN(pitchHz)) {
      const optimalCenter = 195; // middle of 160-230
      const deviation = Math.abs(pitchHz - optimalCenter);
      // 0 dev => 100, 195 dev (~0 or double) => ~0
      pitchScore = clamp(100 - (deviation / optimalCenter) * 100);
      // Slight boost if pitch_range signals variation
      if (audio?.pitch_range && /high|wide|good/i.test(audio.pitch_range)) pitchScore = clamp(pitchScore + 5);
    }

    // Pauses: 1-3 ideal, more reduces score
    const pauses = typeof audio?.num_pauses === 'number' ? audio.num_pauses : NaN;
    let pauseScore = 0;
    if (!isNaN(pauses)) {
      if (pauses === 0) pauseScore = 70; // sometimes no pause can feel rushed
      else if (pauses <= 2) pauseScore = 95;
      else if (pauses <= 4) pauseScore = 80;
      else if (pauses <= 7) pauseScore = 65;
      else pauseScore = 50;
    }

    // Pace: target ~140 WPM typical presentation pace
    const paceScore = wpm > 0 ? clamp(100 - Math.abs(wpm - 140) / 140 * 100) : 0;

    // Aggregate: simple average (equal weights)
    const subs = [volumeScore, pitchScore, pauseScore, paceScore].filter(v => typeof v === 'number');
    const score100 = subs.length ? Math.round(subs.reduce((a, b) => a + b, 0) / subs.length) : 0;
    const score5 = (score100 / 20).toFixed(1);

    // Labels
    const paceLabel = wpm === 0 ? 'N/A' : wpm < 110 ? 'Slow' : wpm <= 160 ? 'Medium' : 'Fast';
    const toneLabel = isNaN(pitchHz) ? 'N/A' : pitchHz < 160 ? 'Low' : pitchHz <= 230 ? 'Avg' : 'High';

    // Build insights and bullets - Enhanced with more detailed feedback (ensure 6 points each)
    const topAreas: string[] = [];
    const improvements: string[] = [];
    
    if (!isNaN(volumeDb)) {
      if (volumeDb >= 70) topAreas.push(`Excellent volume projection at ${volumeDb.toFixed(0)} dB`);
      else if (volumeDb >= 60) topAreas.push('Good volume control');
      else if (volumeDb >= 50) improvements.push('Increase volume for better projection');
      else improvements.push('Significantly increase volume and projection');
    }
    
    if (!isNaN(pitchHz)) {
      if (pitchHz >= 160 && pitchHz <= 230) {
        topAreas.push(`Clear, pleasant pitch at ${pitchHz.toFixed(0)} Hz`);
      } else if (pitchHz > 230) {
        improvements.push('Lower pitch slightly for more authority');
      } else if (pitchHz < 160) {
        improvements.push('Add pitch variation and clarity');
      }
    }
    
    if (!isNaN(pauses)) {
      if (pauses <= 2) topAreas.push('Effective use of pauses');
      else if (pauses <= 5) improvements.push(`Reduce pauses from ${pauses} to 2-3 for better flow`);
      else improvements.push(`Use fewer, more strategic pauses (currently ${pauses})`);
    }
    
    if (wpm > 0) {
      if (paceLabel === 'Medium') {
        topAreas.push(`Comfortable speaking pace at ${wpm} wpm`);
      } else if (paceLabel === 'Fast') {
        improvements.push(`Slow down from ${wpm} to 120-140 wpm for clarity`);
      } else if (paceLabel === 'Slow') {
        improvements.push(`Increase pace from ${wpm} to 120-140 wpm for engagement`);
      }
    }
    
    // Add speaking ratio insights
    if (audio?.spoken_duration_sec && audio?.duration_sec) {
      const ratio = (audio.spoken_duration_sec / audio.duration_sec) * 100;
      if (ratio >= 80) topAreas.push(`Excellent speaking engagement (${ratio.toFixed(0)}%)`);
      else if (ratio >= 70) topAreas.push(`Good speaking time utilization (${ratio.toFixed(0)}%)`);
      else if (ratio < 60) improvements.push(`Increase speaking time from ${ratio.toFixed(0)}% to 75%+`);
    }
    
    // Add pitch range insights
    if (audio?.pitch_range) {
      if (audio.pitch_range.toLowerCase().includes('high') || audio.pitch_range.toLowerCase().includes('wide')) {
        topAreas.push(`Good vocal variety with ${audio.pitch_range.toLowerCase()} range`);
      } else if (audio.pitch_range.toLowerCase().includes('low') || audio.pitch_range.toLowerCase().includes('narrow')) {
        improvements.push('Add more pitch variation for expressiveness');
      }
    }

    // Generate dynamic strengths based on actual performance metrics
    const generateDynamicStrengths = () => {
      const dynamicStrengths = [...topAreas];
      
      // Add strengths based on actual audio data
      if (audio?.spoken_duration_sec && audio?.duration_sec) {
        const ratio = (audio.spoken_duration_sec / audio.duration_sec) * 100;
        if (ratio >= 60 && !dynamicStrengths.some(s => s.includes('speaking'))) {
          dynamicStrengths.push(`Effective speaking time utilization (${ratio.toFixed(0)}%)`);
        }
      }
      
      if (score100 >= 70 && !dynamicStrengths.some(s => s.includes('quality'))) {
        dynamicStrengths.push(`Strong overall vocal quality (${score100}% score)`);
      }
      
      if (wpm >= 120 && wpm <= 160 && !dynamicStrengths.some(s => s.includes('pace'))) {
        dynamicStrengths.push(`Well-controlled speaking pace at ${wpm} words per minute`);
      }
      
      if (volumeScore >= 60 && !dynamicStrengths.some(s => s.includes('volume'))) {
        dynamicStrengths.push(`Adequate voice projection and audibility`);
      }
      
      if (pitchScore >= 60 && !dynamicStrengths.some(s => s.includes('pitch'))) {
        dynamicStrengths.push(`Clear vocal tone and pitch control`);
      }
      
      if (pauseScore >= 70 && !dynamicStrengths.some(s => s.includes('pause'))) {
        dynamicStrengths.push(`Natural pause placement for emphasis`);
      }
      
      return dynamicStrengths.slice(0, 6);
    };

    // Generate dynamic improvements based on actual performance gaps
    const generateDynamicImprovements = () => {
      const dynamicImprovements = [...improvements];
      
      // Add improvements based on low scores
      if (volumeScore < 60 && !dynamicImprovements.some(s => s.includes('volume'))) {
        dynamicImprovements.push(`Improve voice projection (current: ${volumeScore}%)`);
      }
      
      if (pitchScore < 60 && !dynamicImprovements.some(s => s.includes('pitch'))) {
        dynamicImprovements.push(`Enhance vocal tone variety (current: ${pitchScore}%)`);
      }
      
      if (paceScore < 60 && !dynamicImprovements.some(s => s.includes('pace'))) {
        dynamicImprovements.push(`Adjust speaking pace for clarity (current: ${wpm} wpm)`);
      }
      
      if (pauseScore < 60 && !dynamicImprovements.some(s => s.includes('pause'))) {
        dynamicImprovements.push(`Use more strategic pauses (current: ${pauses} pauses)`);
      }
      
      if (audio?.spoken_duration_sec && audio?.duration_sec) {
        const ratio = (audio.spoken_duration_sec / audio.duration_sec) * 100;
        if (ratio < 60 && !dynamicImprovements.some(s => s.includes('speaking time'))) {
          dynamicImprovements.push(`Increase speaking engagement (current: ${ratio.toFixed(0)}%)`);
        }
      }
      
      if (score100 < 70 && !dynamicImprovements.some(s => s.includes('overall'))) {
        dynamicImprovements.push(`Focus on overall vocal delivery improvement`);
      }
      
      return dynamicImprovements.slice(0, 6);
    };

    // Generate final arrays with exactly 6 items each
    const finalTopAreas = generateDynamicStrengths();
    const finalImprovements = generateDynamicImprovements();

    const verdict = score100 >= 80 ? 'Excellent' : score100 >= 70 ? 'Good' : score100 >= 50 ? 'Average' : 'Needs Work';
    
    // Enhanced insights with more comprehensive data
    const insightsParts: string[] = [];
    if (!isNaN(volumeDb)) insightsParts.push(`Avg volume ~${volumeDb.toFixed(0)} dB`);
    if (!isNaN(pitchHz)) insightsParts.push(`mean pitch ~${pitchHz.toFixed(0)} Hz (${toneLabel})`);
    if (wpm > 0) insightsParts.push(`pace ${wpm} wpm (${paceLabel})`);
    if (!isNaN(pauses)) insightsParts.push(`${pauses} pauses`);
    
    // Add more dynamic metrics
    if (audio?.spoken_duration_sec && audio?.duration_sec) {
      const speakingRatio = ((audio.spoken_duration_sec / audio.duration_sec) * 100).toFixed(0);
      insightsParts.push(`${speakingRatio}% speaking time`);
    }
    
    if (audio?.num_pauses && audio?.num_pauses > 0 && audio?.duration_sec && audio?.spoken_duration_sec) {
      const pauseDuration = audio.duration_sec - audio.spoken_duration_sec;
      const avgPauseLength = (pauseDuration / audio.num_pauses).toFixed(1);
      insightsParts.push(`avg pause ${avgPauseLength}s`);
    }
    
    // Add pitch range info if available
    if (audio?.pitch_range && audio.pitch_range !== 'N/A') {
      insightsParts.push(`range: ${audio.pitch_range.toLowerCase()}`);
    }
    
    // Add energy/intensity level based on volume and pace
    const energyLevel = volumeDb > 60 && wpm > 120 ? 'high energy' : 
                       volumeDb > 50 && wpm > 100 ? 'moderate energy' : 'calm delivery';
    insightsParts.push(energyLevel);
    
    const insights = insightsParts.length ? insightsParts.join(' • ') : 
      `Analysis based on ${transcript ? 'transcript' : 'available'} data • ${totalDurationSec > 0 ? `${totalDurationSec.toFixed(0)}s duration` : 'duration pending'} • vocal analysis ${audio ? 'completed' : 'in progress'}`;

    return { 
      score100, 
      score5, 
      paceLabel, 
      toneLabel, 
      wpm, 
      volumeDb, 
      pitchHz, 
      pauses, 
      verdict, 
      insights, 
      topAreas: finalTopAreas, 
      improvements: finalImprovements,
      // Additional metrics for enhanced display
      speakingRatio: audio?.spoken_duration_sec && audio?.duration_sec ? 
        ((audio.spoken_duration_sec / audio.duration_sec) * 100).toFixed(0) : null,
      avgPauseLength: audio?.num_pauses && audio?.num_pauses > 0 && audio?.duration_sec && audio?.spoken_duration_sec ?
        ((audio.duration_sec - audio.spoken_duration_sec) / audio.num_pauses).toFixed(1) : null,
      pitchRange: audio?.pitch_range || 'N/A',
      energyLevel: volumeDb > 60 && wpm > 120 ? 'High' : 
                   volumeDb > 50 && wpm > 100 ? 'Moderate' : 'Calm',
      clarityScore: Math.round((volumeScore + pitchScore) / 2),
      fluencyScore: Math.round((paceScore + pauseScore) / 2)
    };
  };

  const vocal = computeVocalMetrics();

    // Build dynamic time-series for voice graphs (modulation, pitch, volume)
  const buildVoiceSeries = () => {
    const audio = poseData?.audio;
    // Prefer active speaking duration; fallback to total duration from Django string; else 80s
    const parseDurationSec = (s: string): number => {
      if (!s) return 0;
      const secMatch = s.match(/([0-9]+(?:\.[0-9]+)?)\s*s/);
      if (secMatch) return parseFloat(secMatch[1]);
      const parts = s.split(':').map(p => p.trim()).filter(Boolean);
      if (parts.length === 1) return parseFloat(parts[0]) || 0;
      if (parts.length === 2) {
        const [m, sec] = parts; return (parseFloat(m) || 0) * 60 + (parseFloat(sec) || 0);
      }
      if (parts.length >= 3) {
        const [h, m, sec] = parts.slice(-3); return (parseFloat(h) || 0) * 3600 + (parseFloat(m) || 0) * 60 + (parseFloat(sec) || 0);
      }
      return 0;
    };

    const durationSec = audio?.spoken_duration_sec || audio?.duration_sec || parseDurationSec(analysisData?.duration || '') || 80;
    const n = 9; // points/bars to render
    const times: number[] = Array.from({ length: n }, (_, i) => Math.round((i * durationSec) / (n - 1)));

    // Derive a deterministic seed so the waveforms are stable across renders
    const seedBase = (poseData?.frames_processed || 0) + (analysisData?.original_transcript?.length || 0) + (audio?.num_pauses || 0);
    const seed = Math.max(1, seedBase % 997);
    const sin = (x: number) => Math.sin(x);

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    // Volume baseline: prefer positive dB. If negative (dBFS style), lift into a visual range around 40–70
    const rawVol = typeof audio?.volume_db === 'number' ? audio.volume_db : 50;
    const volBase = rawVol < 0 ? 60 + rawVol : rawVol; // e.g., -18 -> 42
    const volAmp = 6 + Math.min(14, (audio?.num_pauses || 0) / 2);

    // Pitch baseline and amplitude
    const meanPitch = typeof audio?.mean_pitch_hz === 'number' ? audio.mean_pitch_hz : 140;
    let minPitch = meanPitch * 0.85, maxPitch = meanPitch * 1.15;
    if (audio?.pitch_range) {
      const m = String(audio.pitch_range).match(/(\d+)\D+(\d+)/);
      if (m) { minPitch = parseFloat(m[1]); maxPitch = parseFloat(m[2]); }
    }
    const pitchAmp = Math.max(5, (maxPitch - minPitch) / 4);

    const volume: number[] = [];
    const pitch: number[] = [];
    const modulation: number[] = [];

    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const v = volBase + volAmp * (sin(2 * Math.PI * t + seed * 0.01) + 0.35 * sin(4 * Math.PI * t + seed * 0.02));
      const p = meanPitch + pitchAmp * (sin(2 * Math.PI * t + seed * 0.015) + 0.25 * sin(6 * Math.PI * t + seed * 0.01));
      volume.push(clamp(v, volBase - 2 * volAmp, volBase + 2 * volAmp));
      pitch.push(clamp(p, minPitch, maxPitch));
    }

    // Modulation: based on combined movement between consecutive pitch/volume points
    for (let i = 0; i < n; i++) {
      if (i === 0) { modulation.push(50); continue; }
      const dv = Math.abs(volume[i] - volume[i - 1]) / (volAmp || 1);
      const dp = Math.abs(pitch[i] - pitch[i - 1]) / (pitchAmp || 1);
      const mod = 45 + 20 * dv + 20 * dp; // 0..~85
      modulation.push(clamp(mod, 20, 95));
    }

    // Build axes/ticks helpers
    const niceRange = (minV: number, maxV: number, steps = 5) => {
      if (!isFinite(minV) || !isFinite(maxV) || minV === maxV) {
        minV = (minV || 0) - 1; maxV = (maxV || 100) + 1;
      }
      const span = maxV - minV;
      const step = Math.pow(10, Math.floor(Math.log10(span / (steps - 1))));
      const niceMin = Math.floor(minV / step) * step;
      const niceMax = Math.ceil(maxV / step) * step;
      const inc = (niceMax - niceMin) / (steps - 1);
      const ticks = Array.from({ length: steps }, (_, i) => Math.round((niceMin + i * inc) * 100) / 100);
      return { min: niceMin, max: niceMax, ticks };
    };

    const volScale = niceRange(Math.min(...volume), Math.max(...volume));
    const pitchScale = niceRange(Math.min(...pitch), Math.max(...pitch));
    const modScale = niceRange(Math.min(...modulation), Math.max(...modulation));

    const xTickIdx = [0, Math.round((n - 1) * 0.25), Math.round((n - 1) * 0.5), Math.round((n - 1) * 0.75), n - 1];
    const fmtTime = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, '0')}`;
    const xLabels = xTickIdx.map(i => fmtTime(times[i]));

    return { n, times, xTickIdx, xLabels, volume, pitch, modulation, scales: { volume: volScale, pitch: pitchScale, modulation: modScale } };
  };

  const voiceSeries = buildVoiceSeries();

  // Helper function to ensure exactly 6 speaking skills strengths and 6 weaknesses
  const getSpeakingSkillsPoints = () => {
    const strengths = [];
    const weaknesses = [];
    
    // Grammar and language analysis based on actual data
    if (analysisData?.corrected_transcript && analysisData?.original_transcript) {
      const corrections = analysisData.corrected_transcript !== analysisData.original_transcript;
      if (!corrections) {
        strengths.push('Demonstrated excellent grammar with no corrections needed');
      } else {
        weaknesses.push('Grammar and language structure could be improved');
      }
    }
    
    // Vocabulary and word power analysis
    if (analysisData?.content_assessment?.vocabulary_score) {
      if (analysisData.content_assessment.vocabulary_score >= 70) {
        strengths.push(`Strong vocabulary usage with ${analysisData.content_assessment.vocabulary_score}% effectiveness score`);
      } else {
        weaknesses.push(`Vocabulary usage needs improvement - current score ${analysisData.content_assessment.vocabulary_score}%`);
      }
    }
    
    // Fluency analysis based on filler words
    if (analysisData?.filler_words) {
      if (analysisData.filler_words.length === 0) {
        strengths.push('Excellent speech fluency with no filler words detected');
      } else {
        const totalFillers = analysisData.filler_words.reduce((sum, fw) => sum + fw.count, 0);
        weaknesses.push(`Reduce filler word usage - detected ${totalFillers} instances across ${analysisData.filler_words.length} different types`);
      }
    }
    
    // Content structure and organization
    if (analysisData?.content_assessment?.avg_words_per_sentence) {
      if (analysisData.content_assessment.avg_words_per_sentence >= 12 && analysisData.content_assessment.avg_words_per_sentence <= 20) {
        strengths.push(`Well-structured sentences averaging ${analysisData.content_assessment.avg_words_per_sentence} words each`);
      } else if (analysisData.content_assessment.avg_words_per_sentence < 8) {
        weaknesses.push(`Sentence structure too simple - average ${analysisData.content_assessment.avg_words_per_sentence} words per sentence`);
      } else if (analysisData.content_assessment.avg_words_per_sentence > 25) {
        weaknesses.push(`Sentences too complex - average ${analysisData.content_assessment.avg_words_per_sentence} words per sentence`);
      }
    }
    
    // Take exactly 6 points each, prioritizing most relevant
    const finalStrengths = strengths.slice(0, 6);
    const finalWeaknesses = weaknesses.slice(0, 6);
    
    // Fill remaining slots with additional analysis
    while (finalStrengths.length < 6) {
      const additionalStrengths = [];
      
      if (analysisData?.content_assessment?.word_count && analysisData.content_assessment.word_count >= 200) {
        additionalStrengths.push(`Comprehensive content delivery with ${analysisData.content_assessment.word_count} total words`);
      }
      if (analysisData?.keywords) {
        const keywordCount = analysisData.keywords.split(',').filter(k => k.trim()).length;
        if (keywordCount >= 5) {
          additionalStrengths.push(`Rich topic coverage with ${keywordCount} key themes identified`);
        }
      }
      if (analysisData?.sentiment_analysis?.confidence && analysisData.sentiment_analysis.confidence >= 70) {
        additionalStrengths.push(`Clear emotional expression with ${analysisData.sentiment_analysis.confidence}% confidence`);
      }
      if (analysisData?.repeated_words?.length === 0) {
        additionalStrengths.push('Excellent vocabulary variety with no significant word repetitions');
      }
      
      const nextStrength = additionalStrengths.find(s => !finalStrengths.some(existing => existing.toLowerCase().includes(s.toLowerCase().split(' ')[0])));
      if (nextStrength) {
        finalStrengths.push(nextStrength);
      } else {
        break;
      }
    }
    
    while (finalWeaknesses.length < 6) {
      const additionalWeaknesses = [];
      
      if (analysisData?.content_assessment?.word_count && analysisData.content_assessment.word_count < 200) {
        additionalWeaknesses.push(`Content depth needs expansion - only ${analysisData.content_assessment.word_count} words delivered`);
      }
      if (analysisData?.repeated_words && analysisData.repeated_words.length > 0) {
        const topRepeated = analysisData.repeated_words[0];
        additionalWeaknesses.push(`Avoid word repetition - "${topRepeated.word}" used ${topRepeated.count} times`);
      }
      if (analysisData?.content_assessment?.vocabulary_diversity && analysisData.content_assessment.vocabulary_diversity < 50) {
        additionalWeaknesses.push(`Limited vocabulary diversity at ${analysisData.content_assessment.vocabulary_diversity}% - expand word choice variety`);
      }
      if (analysisData?.sentiment_analysis?.confidence && analysisData.sentiment_analysis.confidence < 70) {
        additionalWeaknesses.push(`Emotional expression unclear - only ${analysisData.sentiment_analysis.confidence}% confidence detected`);
      }
      
      const nextWeakness = additionalWeaknesses.find(w => !finalWeaknesses.some(existing => existing.toLowerCase().includes(w.toLowerCase().split(' ')[0])));
      if (nextWeakness) {
        finalWeaknesses.push(nextWeakness);
      } else {
        break;
      }
    }
    
    return { strengths: finalStrengths, weaknesses: finalWeaknesses };
  };
  const getOverallScore = (): number => {
    if (!analysisData && !poseData) return 0;
    let score = 0;
    let count = 0;

    console.log('🔍 DEBUG - Computing Overall Score...');

    // Content Assessment Score (primary)
    if (analysisData?.content_assessment?.overall_strength) {
      score += analysisData.content_assessment.overall_strength;
      count++;
      console.log('🔍 DEBUG - Added content assessment:', analysisData.content_assessment.overall_strength);
    }

    // Word Power Score
    if (analysisData?.content_assessment?.word_power_percentage) {
      score += analysisData.content_assessment.word_power_percentage;
      count++;
      console.log('🔍 DEBUG - Added word power:', analysisData.content_assessment.word_power_percentage);
    }

    // Vocal score from audio data
    if (poseData?.audio) {
      const vocalScore = vocal.score100 || 0;
      score += vocalScore;
      count++;
      console.log('🔍 DEBUG - Added vocal score:', vocalScore);
    }

    // Body language score from pose data
    if (bodyLanguageMetrics.gauge.score100) {
      score += bodyLanguageMetrics.gauge.score100;
      count++;
      console.log('🔍 DEBUG - Added body language score:', bodyLanguageMetrics.gauge.score100);
    }

    // Sentiment Analysis Score
    if (analysisData?.sentiment_analysis?.confidence) {
      score += analysisData.sentiment_analysis.confidence;
      count++;
    }

    const finalScore = count > 0 ? Math.round(score / count) : 0;
    console.log('🔍 DEBUG - Final Overall Score:', finalScore, 'from total:', score, 'count:', count);
    return finalScore;
  };

  // Helper function to get performance summary details
  const getPerformanceSummary = () => {
    const overallScore = getOverallScore();
    const vocalScore = getVocalScore();
    const bodyScore = getBodyLanguageScore();
    const wordScore = getWordPowerScore();
    
    let title = "Performance Analysis";
    let message = "Analysis completed successfully.";
    let industryAverage = 65; // Default industry benchmark
    
    // Use actual industry average if available
    if (analysisData?.content_assessment?.industry_average) {
      industryAverage = analysisData.content_assessment.industry_average;
    }
    
    // Generate dynamic performance assessment
    if (overallScore >= 90) {
      title = "Outstanding Performance!";
      message = `Exceptional communication skills demonstrated across all areas. Your score of ${overallScore} significantly exceeds the industry average of ${industryAverage}.`;
    } else if (overallScore >= 80) {
      title = "Excellent Performance!";
      message = `Strong communication performance with ${overallScore}% effectiveness. You're performing ${overallScore > industryAverage ? 'above' : 'at'} industry standards.`;
    } else if (overallScore >= 70) {
      title = "Good Performance!";
      message = `Solid communication foundation with room for improvement. Your ${overallScore}% score shows good potential to reach the ${industryAverage}% industry benchmark.`;
    } else if (overallScore >= 60) {
      title = "Developing Performance";
      message = `You have a foundation to build upon. Focus on key improvement areas to reach the ${industryAverage}% industry average.`;
    } else if (overallScore > 0) {
      title = "Room for Improvement";
      message = `Significant opportunities for growth identified. With focused practice, you can work toward the ${industryAverage}% industry standard.`;
    } else {
      title = "Insufficient Data";
      message = "Unable to generate comprehensive performance metrics due to limited analysis data.";
    }

    // Add specific insights based on component scores
    const insights = [];
    if (vocalScore >= 80) insights.push("excellent vocal delivery");
    if (bodyScore >= 80) insights.push("strong body language");
    if (wordScore >= 80) insights.push("effective word usage");
    
    if (insights.length > 0) {
      message += ` Your strengths include ${insights.join(" and ")}.`;
    }

    return { title, message, industryAverage };
  };

  const getVocalScore = (): number => {
    const score = vocal.score100 || 0;
    console.log('🔍 DEBUG - getVocalScore:', score, 'vocal object:', vocal);
    return score;
  };

  const getBodyLanguageScore = (): number => {
    const score = bodyLanguageMetrics.gauge.score100;
    console.log('🔍 DEBUG - getBodyLanguageScore:', score, 'bodyLanguageMetrics:', bodyLanguageMetrics);
    return score;
  };

  const getWordPowerScore = (): number => {
    if (!analysisData?.keywords) return 0;
    const score = Math.min(analysisData.keywords.split(',').length * 10, 100);
    console.log('🔍 DEBUG - getWordPowerScore:', score, 'keywords:', analysisData.keywords);
    return score;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-400 to-emerald-500';
    if (score >= 70) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-rose-500';
  };

  // Helper function to ensure exactly 6 strengths and 6 weaknesses
  const getBodyLanguagePoints = () => {
    const strengths = [...bodyLanguageMetrics.topAreas];
    const weaknesses = [...bodyLanguageMetrics.improvements];
    
    // Generate additional strengths based on actual data if needed
    const additionalStrengths = [];
    if (poseData?.eye_contact && getPercentageValue(poseData.eye_contact) >= 60) {
      additionalStrengths.push('Maintained good eye contact during presentation');
    }
    if (poseData?.smiles && getPercentageValue(poseData.smiles) >= 30) {
      additionalStrengths.push('Showed positive facial expressions');
    }
    if (bodyLanguageMetrics.posture.straightPosturePct >= 70) {
      additionalStrengths.push('Demonstrated good posture and body alignment');
    }
    if (poseData?.hand_moves && getPercentageValue(poseData.hand_moves) >= 20) {
      additionalStrengths.push('Used appropriate hand gestures');
    }
    if (bodyLanguageMetrics.frequency.headPositionStablePct >= 60) {
      additionalStrengths.push('Maintained stable head positioning');
    }
    
    // Generate additional weaknesses based on actual data if needed
    const additionalWeaknesses = [];
    if (poseData?.hand_moves && getPercentageValue(poseData.hand_moves) < 20) {
      additionalWeaknesses.push('Could increase use of hand gestures for emphasis');
    }
    if (poseData?.eye_contact && getPercentageValue(poseData.eye_contact) < 60) {
      additionalWeaknesses.push('Needs improvement in maintaining eye contact');
    }
    if (bodyLanguageMetrics.posture.straightPosturePct < 70) {
      additionalWeaknesses.push('Could improve posture and body alignment');
    }
    if (poseData?.leg_moves && getPercentageValue(poseData.leg_moves) > 20) {
      additionalWeaknesses.push('Reduce excessive leg movement for better stability');
    }
    if (bodyLanguageMetrics.frequency.headPositionStablePct < 60) {
      additionalWeaknesses.push('Work on maintaining consistent head position');
    }
    if (poseData?.foot_moves && getPercentageValue(poseData.foot_moves) > 15) {
      additionalWeaknesses.push('Minimize foot movement to appear more grounded');
    }
    
    // Combine and ensure exactly 6 points each
    const allStrengths = [...strengths, ...additionalStrengths.filter(s => !strengths.some(existing => existing.toLowerCase().includes(s.toLowerCase().split(' ')[0])))];
    const allWeaknesses = [...weaknesses, ...additionalWeaknesses.filter(w => !weaknesses.some(existing => existing.toLowerCase().includes(w.toLowerCase().split(' ')[0])))];
    
    // Take exactly 6 points, or pad if not enough
    const finalStrengths = allStrengths.slice(0, 6);
    const finalWeaknesses = allWeaknesses.slice(0, 6);
    
    // If still not enough, generate contextual points based on available data
    while (finalStrengths.length < 6) {
      const dataBasedStrengths = [];
      if (poseData?.frames_processed && poseData.frames_processed > 0) {
        dataBasedStrengths.push(`Successfully processed ${poseData.frames_processed} frames of body language data`);
      }
      if (analysisData?.duration) {
        dataBasedStrengths.push(`Maintained consistent presence throughout ${analysisData.duration} duration`);
      }
      if (bodyLanguageMetrics.gauge.score100 >= 50) {
        dataBasedStrengths.push(`Achieved ${bodyLanguageMetrics.gauge.score100}% body language effectiveness score`);
      }
      if (analysisData?.emotion_analysis?.dominant_emotion && analysisData.emotion_analysis.dominant_emotion !== 'neutral') {
        dataBasedStrengths.push(`Expressed clear ${analysisData.emotion_analysis.dominant_emotion.toLowerCase()} emotional engagement`);
      }
      
      const nextDataBased = dataBasedStrengths.find(g => !finalStrengths.some(f => f.toLowerCase().includes(g.toLowerCase().split(' ')[1] || g.toLowerCase().split(' ')[0])));
      if (nextDataBased) {
        finalStrengths.push(nextDataBased);
      } else {
        break;
      }
    }
    
    while (finalWeaknesses.length < 6) {
      const dataBasedWeaknesses = [];
      if (bodyLanguageMetrics.gauge.score100 < 70) {
        dataBasedWeaknesses.push(`Current body language score of ${bodyLanguageMetrics.gauge.score100}% has room for improvement`);
      }
      if (poseData?.frames_processed && poseData.frames_processed < 30) {
        dataBasedWeaknesses.push(`Limited analysis data with only ${poseData.frames_processed} processed frames`);
      }
      if (analysisData?.emotion_analysis?.confidence && analysisData.emotion_analysis.confidence < 60) {
        dataBasedWeaknesses.push(`Low emotional expression confidence at ${analysisData.emotion_analysis.confidence}%`);
      }
      if (!poseData?.eye_contact || getPercentageValue(poseData.eye_contact) === 0) {
        dataBasedWeaknesses.push('No measurable eye contact data detected in analysis');
      }
      
      const nextDataBased = dataBasedWeaknesses.find(g => !finalWeaknesses.some(f => f.toLowerCase().includes(g.toLowerCase().split(' ')[1] || g.toLowerCase().split(' ')[0])));
      if (nextDataBased) {
        finalWeaknesses.push(nextDataBased);
      } else {
        break;
      }
    }
    
    return { strengths: finalStrengths, weaknesses: finalWeaknesses };
  };

  // Helper function to ensure exactly 6 vocal strengths and 6 weaknesses
  const getVoiceAnalysisPoints = () => {
    const strengths = [...vocal.topAreas];
    const weaknesses = [...vocal.improvements];
    
    // Generate additional strengths based on actual vocal data if needed
    const additionalStrengths = [];
    if (poseData?.audio?.volume_db && poseData.audio.volume_db >= -10) {
      additionalStrengths.push('Maintained appropriate volume levels throughout');
    }
    if (poseData?.audio?.mean_pitch_hz && poseData.audio.mean_pitch_hz >= 160 && poseData.audio.mean_pitch_hz <= 230) {
      additionalStrengths.push('Demonstrated good pitch control and clarity');
    }
    if (poseData?.audio?.num_pauses !== undefined && poseData.audio.num_pauses <= 3) {
      additionalStrengths.push('Used pauses effectively for emphasis');
    }
    if (vocal.wpm >= 120 && vocal.wpm <= 160) {
      additionalStrengths.push('Spoke at an optimal pace for comprehension');
    }
    if (poseData?.audio?.spoken_duration_sec && poseData.audio.duration_sec && 
        (poseData.audio.spoken_duration_sec / poseData.audio.duration_sec) >= 0.7) {
      additionalStrengths.push('Maintained consistent vocal engagement');
    }
    if (poseData?.audio?.pitch_range && /high|wide|good/i.test(poseData.audio.pitch_range)) {
      additionalStrengths.push('Showed good vocal variety and modulation');
    }
    
    // Generate additional weaknesses based on actual vocal data if needed
    const additionalWeaknesses = [];
    if (poseData?.audio?.volume_db && poseData.audio.volume_db < -20) {
      additionalWeaknesses.push('Could improve voice projection and volume');
    }
    if (poseData?.audio?.mean_pitch_hz && (poseData.audio.mean_pitch_hz < 160 || poseData.audio.mean_pitch_hz > 250)) {
      additionalWeaknesses.push('Work on achieving more optimal pitch range');
    }
    if (poseData?.audio?.num_pauses && poseData.audio.num_pauses > 5) {
      additionalWeaknesses.push('Reduce excessive pauses for better flow');
    }
    if (vocal.wpm < 100) {
      additionalWeaknesses.push('Consider increasing speaking pace for engagement');
    }
    if (vocal.wpm > 180) {
      additionalWeaknesses.push('Slow down speaking pace for better clarity');
    }
    if (poseData?.audio?.pitch_range && /low|narrow|limited/i.test(poseData.audio.pitch_range)) {
      additionalWeaknesses.push('Add more vocal variety and pitch modulation');
    }
    if (analysisData?.filler_words && analysisData.filler_words.length > 0) {
      additionalWeaknesses.push('Reduce filler words to improve speech clarity');
    }
    
    // Combine and ensure exactly 6 points each
    const allStrengths = [...strengths, ...additionalStrengths.filter(s => !strengths.some(existing => existing.toLowerCase().includes(s.toLowerCase().split(' ')[0])))];
    const allWeaknesses = [...weaknesses, ...additionalWeaknesses.filter(w => !weaknesses.some(existing => existing.toLowerCase().includes(w.toLowerCase().split(' ')[0])))];
    
    // Take exactly 6 points, or pad if not enough
    const finalStrengths = allStrengths.slice(0, 6);
    const finalWeaknesses = allWeaknesses.slice(0, 6);
    
    // If still not enough, generate contextual points based on available vocal data
    while (finalStrengths.length < 6) {
      const dataBasedStrengths = [];
      if (vocal.score100 >= 50) {
        dataBasedStrengths.push(`Achieved ${vocal.score100}% vocal effectiveness score`);
      }
      if (analysisData?.duration && poseData?.audio?.spoken_duration_sec) {
        const engagementRatio = (poseData.audio.spoken_duration_sec / parseFloat(analysisData.duration.replace(/[^0-9.]/g, '') || '1')) * 100;
        if (engagementRatio >= 70) {
          dataBasedStrengths.push(`Maintained ${engagementRatio.toFixed(0)}% vocal engagement throughout recording`);
        }
      }
      if (analysisData?.original_transcript && analysisData.original_transcript.length > 100) {
        dataBasedStrengths.push(`Delivered substantial content with ${analysisData.original_transcript.split(' ').length} words`);
      }
      if (vocal.verdict === 'Excellent' || vocal.verdict === 'Good') {
        dataBasedStrengths.push(`Received ${vocal.verdict.toLowerCase()} overall vocal assessment rating`);
      }
      
      const nextDataBased = dataBasedStrengths.find(g => !finalStrengths.some(f => f.toLowerCase().includes(g.toLowerCase().split(' ')[1] || g.toLowerCase().split(' ')[0])));
      if (nextDataBased) {
        finalStrengths.push(nextDataBased);
      } else {
        break;
      }
    }
    
    while (finalWeaknesses.length < 6) {
      const dataBasedWeaknesses = [];
      if (vocal.score100 < 70) {
        dataBasedWeaknesses.push(`Current vocal score of ${vocal.score100}% indicates need for improvement`);
      }
      if (analysisData?.original_transcript && analysisData.original_transcript.split(' ').length < 50) {
        dataBasedWeaknesses.push(`Limited content delivery with only ${analysisData.original_transcript.split(' ').length} words spoken`);
      }
      if (!poseData?.audio?.volume_db || poseData.audio.volume_db < -30) {
        dataBasedWeaknesses.push(`Very low volume detected at ${poseData?.audio?.volume_db?.toFixed(1) || 'unknown'} dB`);
      }
      if (vocal.wpm > 0 && (vocal.wpm < 80 || vocal.wpm > 200)) {
        dataBasedWeaknesses.push(`Speaking pace of ${vocal.wpm} words per minute needs adjustment`);
      }
      
      const nextDataBased = dataBasedWeaknesses.find(g => !finalWeaknesses.some(f => f.toLowerCase().includes(g.toLowerCase().split(' ')[1] || g.toLowerCase().split(' ')[0])));
      if (nextDataBased) {
        finalWeaknesses.push(nextDataBased);
      } else {
        break;
      }
    }
    
    return { strengths: finalStrengths, weaknesses: finalWeaknesses };
  };

  const CircularProgress = ({ score, size = 120, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

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
    <div className="space-y-12">
      {/* Video Title - Dynamic */}
      <div className="mb-12">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 animate-fade-in-down">
          {analysisData?.filename ? analysisData.filename.replace(/\.[^/.]+$/, "") : "Video Analysis"}
        </h1>
        <div className="flex items-center space-x-8 text-gray-500 animate-fade-in-up">
          <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <User className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-sm">{analysisData?.language?.toUpperCase() || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span className="text-sm">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
            <Clock className="w-4 h-4 text-green-500" />
            <span className="text-sm">{analysisData?.duration || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        {/* Video Player - Modern Minimalist */}
        <div className="xl:col-span-3">
          <Card className="overflow-hidden rounded-3xl shadow-xl border-0 bg-white/80 backdrop-blur-xl">
            <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Video Analysis</h3>
                  <p className="text-gray-500 text-sm mt-1">AI-powered communication insights</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Live Analysis</span>
                </div>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="relative bg-gradient-to-br from-gray-900 to-black aspect-video group">
                {analysisData?.videoUrl ? (
                  <video
                    ref={videoRef}
                    src={analysisData.videoUrl}
                    className="w-full h-full object-cover"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />
                ) : analysisData?.filename && uploadId ? (
                  <div className="relative w-full h-full">
                    {/* Show dynamic thumbnail with play button overlay */}
                    <DynamicVideoThumbnail
                      uploadId={uploadId}
                      className="w-full h-full object-cover"
                      alt={`Thumbnail for ${analysisData.filename}`}
                      fallbackImage=""
                      showPlayButton={true}
                      aspectRatio="video"
                    />
                    
                    {/* Video info overlay */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3">
                        <div className="text-white">
                          <div className="text-lg font-medium">{analysisData.filename}</div>
                          <div className="text-gray-300 text-sm">Click to analyze or upload new video</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : analysisData?.filename ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <div className="text-4xl">🎬</div>
                      </div>
                      <div className="text-lg font-medium">Video Analysis</div>
                      <div className="text-gray-400 text-sm">{analysisData.filename}</div>
                      <div className="text-xs text-gray-500 mt-2">Video file not available for playback</div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <div className="text-4xl">🎬</div>
                      </div>
                      <div className="text-xl font-medium">Video Analysis</div>
                      <div className="text-gray-400 text-sm">No video data available</div>
                    </div>
                  </div>
                )}
                
                {/* Modern Play Button Overlay */}
                {analysisData?.videoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Button
                      size="icon"
                      className="bg-white/90 hover:bg-white text-gray-900 border-0 rounded-full w-16 h-16 shadow-2xl transition-all duration-300 transform hover:scale-110"
                      onClick={handlePlayPause}
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6 ml-0.5" />
                      )}
                    </Button>
                  </div>
                )}

                {/* Floating Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePlayPause}
                      className="text-white hover:bg-white/20 backdrop-blur-sm rounded-full"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    
                    <div className="flex-1 space-y-1">
                      <div className="relative">
                        <Progress 
                          value={duration > 0 ? (currentTime / duration) * 100 : 0} 
                          className="h-1.5 bg-white/20 cursor-pointer" 
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const percentage = clickX / rect.width;
                            handleSeek(percentage * duration);
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-white/80">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Volume2 className="w-5 h-5 text-white" />
                      <div className="relative">
                        <Progress 
                          value={volume} 
                          className="w-20 h-1.5 bg-white/20 cursor-pointer" 
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const percentage = clickX / rect.width;
                            handleVolumeChange(percentage * 100);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card - Premium Minimalist */}
        <div className="xl:col-span-1">
          <Card className="h-full shadow-2xl border-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden rounded-3xl">
            {/* Subtle Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
            
            <CardContent className="p-8 relative z-10 h-full flex flex-col">
              <div className="text-center space-y-8 flex-1">
                {/* User Profile */}
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-xl">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-3 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/20">
                    <h3 className="font-bold text-xl text-gray-900 mb-1">
                      {userData?.name || 'Speaker'}
                    </h3>
                    <p className="text-gray-600 text-sm font-medium">
                      {userData?.isAdmin ? 'Administrator' : 
                       userData?.title || userData?.position || userData?.role || 
                       (userData?.department ? `${userData.department} Employee` : 'Employee')}
                    </p>
                    {userData?.department && (
                      <p className="text-gray-500 text-xs mt-1">
                        {userData.department} Department
                      </p>
                    )}
                  </div>
                </div>

                {/* Overall Score - Clean Design */}
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {getOverallScore() || 'N/A'}
                      </div>
                      <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Overall Score</div>
                    </div>
                    
                    {/* Progress Ring */}
                    <div className="flex justify-center">
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-200" />
                          <circle 
                            cx="32" 
                            cy="32" 
                            r="28" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="4" 
                            strokeDasharray="176"
                            strokeDashoffset={176 - ((getOverallScore() || 0) / 100) * 176}
                            className="text-blue-500 transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-600">{getOverallScore() || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats - Minimal Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/40 backdrop-blur-xl rounded-xl p-3 border border-white/20">
                    <div className="flex items-center justify-center space-x-2">
                      <Mic className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-medium text-gray-600">Vocal</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 mt-1">{getVocalScore()}</div>
                  </div>
                  <div className="bg-white/40 backdrop-blur-xl rounded-xl p-3 border border-white/20">
                    <div className="flex items-center justify-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-medium text-gray-600">Words</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 mt-1">{getWordPowerScore()}</div>
                  </div>
                  <div className="bg-white/40 backdrop-blur-xl rounded-xl p-3 border border-white/20">
                    <div className="flex items-center justify-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-medium text-gray-600">Body</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 mt-1">{getBodyLanguageScore() || 'N/A'}</div>
                  </div>
                  <div className="bg-white/40 backdrop-blur-xl rounded-xl p-3 border border-white/20">
                    <div className="flex items-center justify-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-medium text-gray-600">WPM</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 mt-1">
                      {vocal.wpm || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Options - Enhanced */}
              <div className="flex justify-center mt-6">
                <Button 
                  className="w-full max-w-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                  onClick={async () => {
                    if (isGeneratingPDF) return; // Prevent multiple clicks
                    
                    setIsGeneratingPDF(true);
                    console.log('🖱️ Export PDF button clicked (html2pdf client-side)');
                    
                    try {
                      // Generate PDF on the client using html2pdf with existing page data
                      await exportToPDF(analysisData, poseData, userData);
                      
                      console.log('✅ PDF generated via html2pdf');
                    } catch (error) {
                      console.error('❌ PDF export failed (html2pdf):', error);
                      alert('Failed to generate PDF report. Please try again.');
                    } finally {
                      setIsGeneratingPDF(false);
                    }
                  }}
                  disabled={isGeneratingPDF}
                >
                  {isGeneratingPDF ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Export PDF Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transcript Section */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">📝</span>
            <span className="font-semibold text-lg">Transcript</span>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 max-h-96 overflow-y-auto">
                <h4 className="font-semibold text-gray-800 mb-4">Full Transcript</h4>
                <div className="text-sm text-gray-700 leading-relaxed">
                  <p className="mb-4">
                    {analysisData?.original_transcript ? 
                      analysisData.original_transcript.split('\n').slice(0, 1).join('') : 
                      "N/A"
                    }
                  </p>
                  <p className="mb-4">
                    {analysisData?.original_transcript ? 
                      analysisData.original_transcript.split('\n').slice(1, 2).join('') : 
                      "N/A"
                    }
                  </p>
                  <p className="mb-4">
                    {analysisData?.original_transcript ? 
                      analysisData.original_transcript.split('\n').slice(2, 3).join('') : 
                      "N/A"
                    }
                  </p>
                </div>
              </div>

              {/* <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
                <h4 className="font-semibold text-gray-800 mb-4">🔍 Sentence Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start space-x-3">
                    <Badge variant="outline" className="mt-1">1</Badge>
                    <span className="text-gray-700">Opening greeting and presentation introduction</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="outline" className="mt-1">2</Badge>
                    <span className="text-gray-700">Performance results and achievement highlights</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="outline" className="mt-1">3</Badge>
                    <span className="text-gray-700">Future strategy and key focus areas</span>
                  </div>
                </div>
              </div> */}

              <div className="text-center">

              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grammar Corrected Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg border border-green-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <span className="text-2xl">📝</span>
            <span>Grammar Corrected</span>
          </h3>
          <div className="text-sm text-gray-500">AI Generated</div>
        </div>
        
        <div className="bg-white rounded-lg p-6 space-y-4">
          {analysisData?.corrected_transcript && analysisData?.original_transcript ? (
            <div className="space-y-4">
              {/* Show correction status */}
              <div className="text-sm">
                {analysisData.corrected_transcript.trim() === analysisData.original_transcript.trim() ? (
                  <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                    <span>✨</span>
                    <span>Great! No grammar corrections were needed - your transcript is well-structured.</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <span>📝</span>
                    <span>Grammar corrections applied - corrected text is highlighted in red below.</span>
                  </div>
                )}
              </div>
              
              {/* Show the corrected transcript with highlighting */}
              <div className="text-gray-800 leading-relaxed text-base">
                {highlightTextDifferences(analysisData.original_transcript, analysisData.corrected_transcript)}
              </div>
              
              {/* Show original transcript for comparison if there were corrections */}
              {analysisData.corrected_transcript.trim() !== analysisData.original_transcript.trim() && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    📄 Show original transcript for comparison
                  </summary>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg border text-gray-700 text-sm">
                    <div className="font-medium text-gray-800 mb-2">Original:</div>
                    {analysisData.original_transcript}
                  </div>
                </details>
              )}
            </div>
          ) : analysisData?.corrected_transcript ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <span>📝</span>
                <span>Grammar-corrected transcript processed by AI:</span>
              </div>
              <p className="text-gray-800 leading-relaxed text-base">
                {analysisData.corrected_transcript}
              </p>
            </div>
          ) : analysisData?.original_transcript ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <span>⚠️</span>
                <span>Original transcript available - grammar correction in progress...</span>
              </div>
              <p className="text-gray-800 leading-relaxed text-base">
                {analysisData.original_transcript}
              </p>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span>📄</span>
              <span>No transcript data available for grammar correction analysis.</span>
            </div>
          )}
        </div>
      </div>

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

      {/* Repeated Words Analysis */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">🔄</span>
            <span className="font-semibold text-lg">Repeated Words Analysis</span>
          </div>
          <p className="text-gray-600 mt-2">Words that appear frequently in your speech. Variety in vocabulary can make your message more engaging</p>
        </div>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700 italic">
                These words appear frequently in your speech. Consider using synonyms for variety.
              </p>
            </div>
            
            <div className="space-y-4">
              {analysisData?.repeated_words && analysisData.repeated_words.length > 0 ? 
                analysisData.repeated_words.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <span className="font-medium text-gray-800">{item.word}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{item.count}</span>
                      </div>
                    </div>
                  </div>
                )) : 
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="text-green-600 text-5xl mb-3">✅</div>
                  <h4 className="text-lg font-semibold text-green-800 mb-2">Great News!</h4>
                  <p className="text-green-700">No significant word repetitions detected. Your vocabulary usage shows good variety.</p>
                  <p className="text-sm text-green-600 mt-2">This indicates effective communication with diverse word choices.</p>
                </div>
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filler Words Detection */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">⚠️</span>
            <span className="font-semibold text-lg">Filler Words Detection</span>
          </div>
          <p className="text-gray-600 mt-2">Words that may reduce the clarity and impact of your message. Minimizing these can improve your delivery</p>
        </div>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="bg-orange-100 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700 italic">
                These are filler words that appear in your speech. Reducing them can make your delivery more impactful.
              </p>
            </div>
            
            <div className="space-y-4">
              {analysisData?.filler_words && analysisData.filler_words.length > 0 ? 
                analysisData.filler_words.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <span className="font-medium text-gray-800">"{item.word}"</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">{item.percentage}%</span>
                      <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{item.count}</span>
                      </div>
                    </div>
                  </div>
                )) : 
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="text-green-600 text-5xl mb-3">✅</div>
                  <h4 className="text-lg font-semibold text-green-800 mb-2">Excellent!</h4>
                  <p className="text-green-700">No filler words detected. Your speech is clear and concise.</p>
                  <p className="text-sm text-green-600 mt-2">This indicates confident and well-structured communication.</p>
                </div>
              }
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Sentiment Analysis */}
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
          </CardContent>
        </Card>
      </div>

      {/* Emotion Analysis */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">🎭</span>
            <span className="font-semibold text-lg">Emotion Analysis</span>
          </div>
          <p className="text-gray-600 mt-2">Detailed emotion categorization based on NLP & Social Media Models</p>
        </div>

        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-0 shadow-xl">
          <CardContent className="p-8">
            {/* Debug: Log emotion analysis data */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-3xl">{analysisData?.emotion_analysis?.emoji || "😊"}</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {analysisData?.emotion_analysis?.dominant_emotion || "N/A"}
                  </h3>
                  <p className="text-gray-600">
                    Confidence: {typeof analysisData?.emotion_analysis?.confidence === 'number' ? `${analysisData.emotion_analysis.confidence}%` : "N/A"}
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700">
                  The dominant emotion detected in your speech is <strong>{analysisData?.emotion_analysis?.dominant_emotion?.toLowerCase() || "unknown"}</strong>
                  {typeof analysisData?.emotion_analysis?.confidence === 'number' ? (
                    <>
                      {analysisData.emotion_analysis.confidence >= 60 ? ' with high confidence' : analysisData.emotion_analysis.confidence > 0 ? ' with moderate confidence' : ' (no clear emotion keywords matched; defaulting to neutral)'}.
                    </>
                  ) : '.'}
                </p>
              </div>
              
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Detected Keywords:</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisData?.emotion_analysis?.detected_keywords && analysisData.emotion_analysis.detected_keywords.length > 0 ? 
                    getDisplayKeywords(analysisData.emotion_analysis.detected_keywords).map((keyword: any, index: number) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800">{keyword}</Badge>
                    )) : 
                    <Badge className="bg-gray-100 text-gray-800">No specific keywords detected</Badge>
                  }
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Emotion Breakdown:</h4>
                <div className="space-y-3">
                  {analysisData?.emotion_analysis?.emotion_scores ? 
                    Object.entries(getNormalizedEmotionScores(analysisData.emotion_analysis.emotion_scores).percents).map(([emotion, percent]: [string, any]) => (
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
                              style={{ width: `${Number(percent).toFixed(0)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-gray-800 w-12 text-right">
                            {Number(percent).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )) : 
                    <div className="text-center py-4">
                      <Badge className="bg-gray-100 text-gray-800">No emotion breakdown available</Badge>
                    </div>
                  }
                </div>
              </div>

              {/* Diagnostic note */}
              <div className="mt-4 text-xs text-gray-600 bg-white/60 rounded-md p-3">
                {(() => {
                  const emotionScores = analysisData?.emotion_analysis?.emotion_scores as Record<string, number> | undefined;
                  const { total } = getNormalizedEmotionScores(emotionScores);
                  if (!emotionScores) return null;
                  if (total === 0) {
                    return (<span>No emotion-specific keywords were found in the transcript; no dominant emotion detected.</span>);
                  }
                  const topKeywords = getDisplayKeywords(analysisData?.emotion_analysis?.detected_keywords).slice(0, 5);
                  return (
                    <span>
                      Percentages are based on keyword matches per category. {topKeywords.length > 0 ? (
                        <>Top detected keywords: {topKeywords.join(', ')}.</>
                      ) : 'No specific keywords extracted.'}
                    </span>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Strength Progress */}
      <div className="space-y-8">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-xl">
          <CardContent className="p-8">
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

      {/* Content Analysis Summary */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">📊</span>
            <span className="font-semibold text-lg">Content Analysis Summary</span>
          </div>
          <p className="text-gray-600 mt-2">Based on vocabulary, fluency, sentence structure, and other metrics</p>
        </div>

        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-center">Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-500">😊</span>
                <span className="text-sm font-medium">Sentiment</span>
              </div>
              <Badge className="bg-green-100 text-green-800">
                {analysisData?.sentiment_analysis?.overall_sentiment || "N/A"} ({analysisData?.sentiment_analysis?.confidence ? `${analysisData.sentiment_analysis.confidence}%` : "N/A"} confidence)
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-500">😊</span>
                <span className="text-sm font-medium">Dominant Emotion</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {analysisData?.emotion_analysis?.dominant_emotion || "N/A"} ({typeof analysisData?.emotion_analysis?.confidence === 'number' ? `${analysisData.emotion_analysis.confidence}%` : "N/A"} confidence)
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-500">🌟</span>
                <span className="text-sm font-medium">Content Quality</span>
              </div>
              <Badge className="bg-green-100 text-green-800">
                {analysisData?.content_assessment?.quality_score ? `${analysisData.content_assessment.quality_score}%` : "N/A"} overall quality score
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-blue-500">📚</span>
                <span className="text-sm font-medium">Vocabulary Diversity</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {analysisData?.content_assessment?.vocabulary_diversity ? `${analysisData.content_assessment.vocabulary_diversity}%` : "N/A"} unique words
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-purple-500">🍭</span>
                <span className="text-sm font-medium">Complexity Level</span>
              </div>
              <Badge className="bg-purple-100 text-purple-800">
                {analysisData?.content_assessment?.complexity_level || "N/A"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-indigo-500">👌</span>
                <span className="text-sm font-medium">Overall Strength</span>
              </div>
              <Badge className="bg-indigo-100 text-indigo-800">
                {analysisData?.content_assessment?.overall_strength ? `${analysisData.content_assessment.overall_strength}%` : "N/A"} content strength
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-green-600">✅</span>
                <span className="text-sm font-medium">Top Strength</span>
              </div>
              <Badge className="bg-green-100 text-green-800">
                {analysisData?.content_assessment?.top_strength || "N/A"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-orange-600">🧑‍💻</span>
                <span className="text-sm font-medium">Key Improvement</span>
              </div>
              <Badge className="bg-orange-100 text-orange-800">
                {analysisData?.content_assessment?.key_improvement || "N/A"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-600">⚠️</span>
                <span className="text-sm font-medium">Speaking Fluency</span>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">
                {analysisData?.content_assessment?.filler_words_percentage !== undefined ? `${analysisData.content_assessment.filler_words_percentage}%` : "N/A"} filler words detected
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-blue-600">✏️</span>
                <span className="text-sm font-medium">Sentence Structure</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {analysisData?.content_assessment?.avg_words_per_sentence ? `Average ${analysisData.content_assessment.avg_words_per_sentence}` : "N/A"} words per sentence
              </Badge>
            </div>
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
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-500">📏</span>
                <span className="text-sm font-medium">Content Length</span>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">
                {analysisData?.content_assessment?.word_count ? `${analysisData.content_assessment.word_count}` : "N/A"} words total
              </Badge>
            </div>
          </CardContent>
        </Card>
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
                  {analysisData?.content_assessment?.vocabulary_description || "N/A"}
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
                  {analysisData?.content_assessment?.content_length_description || "N/A"}
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
                  {analysisData?.content_assessment?.fluency_description || "N/A"}
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
                  {analysisData?.content_assessment?.flow_description || "N/A"}
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
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Word Power</h3>
                </div>
                <div className="mb-6">
                  <div className="text-6xl font-bold text-pink-600 mb-2">
                    {analysisData?.content_assessment?.word_power_percentage ? ((analysisData.content_assessment.word_power_percentage / 100) * 5).toFixed(2) : "N/A"}
                  </div>
                  <div className="text-lg text-gray-600">out of 5</div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <CircularProgress score={analysisData?.content_assessment?.word_power_percentage || 0} size={100} strokeWidth={8} />
                </div>
                <div className="mt-4">
                  <Badge className={`inline-flex items-center rounded-full border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 px-4 py-2 ${getWordPowerStatus(analysisData?.content_assessment?.word_power_percentage || 0).className}`}>
                    {getWordPowerStatus(analysisData?.content_assessment?.word_power_percentage || 0).text}
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
                      {getWordPowerInsights(analysisData?.content_assessment?.word_power_percentage || 0)}
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
                        <Badge className={`px-3 py-1 ${getSentimentBadgeClass(analysisData?.sentiment_analysis?.positive_percentage || 0)}`}>
                          {getSentimentLabel(analysisData?.sentiment_analysis?.positive_percentage || 0)}
                        </Badge>
                      </div>
                      <Progress value={analysisData?.sentiment_analysis?.positive_percentage || 0} className="h-3" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-base flex items-center space-x-2">
                          <span className="w-4 h-4 bg-yellow-500 rounded-full"></span>
                          <span className="font-medium">Neutral</span>
                        </span>
                        <Badge className={`px-3 py-1 ${getSentimentBadgeClass(analysisData?.sentiment_analysis?.neutral_percentage || 0)}`}>
                          {getSentimentLabel(analysisData?.sentiment_analysis?.neutral_percentage || 0)}
                        </Badge>
                      </div>
                      <Progress value={analysisData?.sentiment_analysis?.neutral_percentage || 0} className="h-3" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-base flex items-center space-x-2">
                          <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                          <span className="font-medium">Negative</span>
                        </span>
                        <Badge className={`px-3 py-1 ${getSentimentBadgeClass(analysisData?.sentiment_analysis?.negative_percentage || 0)}`}>
                          {getSentimentLabel(analysisData?.sentiment_analysis?.negative_percentage || 0)}
                        </Badge>
                      </div>
                      <Progress value={analysisData?.sentiment_analysis?.negative_percentage || 0} className="h-3" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-base flex items-center space-x-2">
                          <span className="w-4 h-4 bg-purple-500 rounded-full"></span>
                          <span className="font-medium">Repetition</span>
                        </span>
                        <Badge className={`px-3 py-1 ${getRepetitionBadgeClass(analysisData?.repeated_words?.length || 0)}`}>
                          {getRepetitionLabel(analysisData?.repeated_words?.length || 0)}
                        </Badge>
                      </div>
                      <Progress value={Math.min((analysisData?.repeated_words?.length || 0) * 5, 100)} className="h-3" />
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
                    {analysisData?.strengths_improvements?.strengths?.map((strength: any, index: number) => (
                      <div key={index} className="text-sm">• {strength.description}</div>
                    )) || (
                      <>
                        <div className="text-sm">• Clear articulation</div>
                        <div className="text-sm">• Good vocabulary range</div>
                        <div className="text-sm">• Effective emphasis</div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-sm text-orange-800">⚠️ Areas to Improve</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysisData?.strengths_improvements?.improvements?.map((improvement: any, index: number) => (
                      <div key={index} className="text-sm">• {improvement.description}</div>
                    )) || (
                      <>
                        <div className="text-sm">• Reduce filler words</div>
                        <div className="text-sm">• Vary sentence structure</div>
                        <div className="text-sm">• Minimize repetition</div>
                      </>
                    )}
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
                {analysisData?.strengths_improvements?.detailed_metrics?.sentence_score ? `${analysisData.strengths_improvements.detailed_metrics.sentence_score}%` : "N/A"}
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

      {/* Score Overview */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">📊</span>
            <span className="font-semibold text-lg">Communication Scores</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Body Language */}
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-8 text-center flex flex-col items-center justify-center">
              <div className="mb-6">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Body Language
                </h3>
              </div>
              <div className="mb-6">
                <div className="text-6xl font-bold text-emerald-600 mb-2">{bodyLanguageMetrics.gauge.score5}</div>
                <div className="text-lg text-gray-600">out of 5</div>
              </div>
              <div className="relative flex flex-col items-center justify-center" style={{ width: 100, height: 100 }}>
                <CircularProgress score={bodyLanguageMetrics.gauge.score100} size={100} strokeWidth={8} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{bodyLanguageMetrics.gauge.score100}</div>
                    <div className="text-sm text-gray-500">out of 100</div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <div className={`bg-gradient-to-r ${
                  bodyLanguageMetrics.gauge.score100 >= 80 ? 'from-emerald-500 to-teal-600' :
                  bodyLanguageMetrics.gauge.score100 >= 70 ? 'from-yellow-500 to-orange-600' :
                  bodyLanguageMetrics.gauge.score100 >= 50 ? 'from-orange-500 to-red-600' :
                  'from-red-500 to-red-700'
                } text-white px-4 py-2 rounded-full text-sm font-semibold`}>
                  🎯 Body Language - {bodyLanguageMetrics.gauge.verdict}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Vocal Tone */}
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-0 shadow-xl h-full flex flex-col justify-center items-center">
            <CardContent className="p-8 text-center flex flex-col items-center justify-center">
              <div className="mb-6">
                <div className="text-4xl mb-4">🎤</div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Vocal Tone
                </h3>
              </div>
              <div className="mb-6">
                <div className="text-6xl font-bold text-purple-600 mb-2">{vocal.score5}</div>
                <div className="text-lg text-gray-600">out of 5</div>
              </div>
              <div className="relative flex flex-col items-center justify-center" style={{ width: 100, height: 100 }}>
                <CircularProgress score={vocal.score100} size={100} strokeWidth={8} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{vocal.score100}</div>
                    <div className="text-sm text-gray-500">out of 100</div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Badge className={`${vocal.score100>=80?'bg-green-100 text-green-800':vocal.score100>=70?'bg-yellow-100 text-yellow-800':vocal.score100>=50?'bg-orange-100 text-orange-800':'bg-red-100 text-red-800'} px-4 py-2`}>
                  {vocal.verdict}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Word Power */}
          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-8 text-center flex flex-col items-center justify-center">
              <div className="mb-6">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Word Power
                </h3>
              </div>
              <div className="mb-6">
                <div className="text-6xl font-bold text-pink-600 mb-2">
                  {analysisData?.content_assessment?.word_power_percentage ? ((analysisData.content_assessment.word_power_percentage / 100) * 5).toFixed(2) : "N/A"}
                </div>
                <div className="text-lg text-gray-600">out of 5</div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <CircularProgress score={analysisData?.content_assessment?.word_power_percentage || 0} size={100} strokeWidth={8} />
              </div>
              <div className="mt-6">
                <Badge className={`inline-flex items-center rounded-full border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 px-4 py-2 ${getWordPowerStatus(analysisData?.content_assessment?.word_power_percentage || 0).className}`}>
                  {getWordPowerStatus(analysisData?.content_assessment?.word_power_percentage || 0).text}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confidence Metrics */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">🎯</span>
            <span className="font-semibold text-lg">Confidence Analysis</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <div className="text-3xl mb-2">🧍</div>
                <h3 className="text-lg font-bold text-gray-800">
                  {analysisData?.confidence_analysis?.confidence_level || 'Needs Improvement'}
                </h3>
              </div>
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {analysisData?.confidence_analysis?.overall_confidence || 'N/A'}
              </div>
              <div className="text-gray-600 mb-4">out of 5</div>
              <Progress value={analysisData?.confidence_analysis?.confidence_score || 0} className="h-3 mb-2" />
              <div className="text-sm text-gray-500">
                {analysisData?.confidence_analysis?.confidence_score ? `${analysisData.confidence_analysis.confidence_score}% confidence level` : 'N/A confidence level'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="text-lg font-bold text-gray-800">
                  {analysisData?.confidence_analysis?.engagement_level || 'N/A'}
                </h3>
              </div>
              <div className="text-5xl font-bold text-yellow-600 mb-2">
                {analysisData?.confidence_analysis?.engagement_score ? 
                  `${Math.round(analysisData.confidence_analysis.engagement_score / 20)}.${Math.round((analysisData.confidence_analysis.engagement_score % 20) / 2)}` : 
                  'N/A'
                }
              </div>
              <div className="text-gray-600 mb-4">
                {analysisData?.confidence_analysis?.engagement_score ? 'out of 5' : 'N/A'}
              </div>
              <Progress value={analysisData?.confidence_analysis?.engagement_score || 0} className="h-3 mb-2" />
              <div className="text-sm text-gray-500">
                {analysisData?.confidence_analysis?.engagement_score ? 
                  `${analysisData.confidence_analysis.engagement_score}% engagement level` : 
                  'N/A engagement level'
                }
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <div className="text-3xl mb-2">😐</div>
                <h3 className="text-lg font-bold text-gray-800">
                  {analysisData?.confidence_analysis?.nervousness_level || 'N/A'}
                </h3>
              </div>
              <div className="text-5xl font-bold text-green-600 mb-2">
                {analysisData?.confidence_analysis?.nervousness_score || 'N/A'}
              </div>
              <div className="text-gray-600 mb-4">out of 5</div>
              <Progress value={analysisData?.confidence_analysis?.nervousness_score ? (analysisData.confidence_analysis.nervousness_score * 20) : 0} className="h-3 mb-2" />
              <div className="text-sm text-gray-500">
                {analysisData?.confidence_analysis?.nervousness_score ? 
                  (analysisData.confidence_analysis.nervousness_score <= 2 ? 'Low nervousness detected' : 
                   analysisData.confidence_analysis.nervousness_score <= 3 ? 'Moderate nervousness detected' :
                   'High nervousness detected') :
                  'N/A nervousness level'
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>



      {/* Body Language Analysis */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-8 shadow-lg border border-emerald-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">🤝</span>
            <span className="font-semibold text-lg">Body Language Analysis</span>
          </div>
        </div>

        {/*
        Debug Panel
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-bold mb-2 text-yellow-800">🔧 Debug Data (Raw Django Response)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <strong>Pose Data:</strong>
              <pre className="bg-white p-2 rounded mt-1 overflow-auto max-h-32">
                {JSON.stringify(poseData, null, 2)}
              </pre>
            </div>
            <div>
              <strong>Emotion Data:</strong>
              <pre className="bg-white p-2 rounded mt-1 overflow-auto max-h-32">
                {JSON.stringify(analysisData?.emotion_analysis, null, 2)}
              </pre>
            </div>
          </div>
          <div className="mt-2">
            <strong>Computed Metrics:</strong>
            <pre className="bg-white p-2 rounded mt-1 overflow-auto max-h-24">
              {JSON.stringify(bodyLanguageMetrics, null, 2)}
            </pre>
          </div>
        </div>
        */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-lg h-full flex flex-col justify-center items-center">
              <div className="mb-4">
                <div className="text-5xl font-bold text-emerald-600 mb-2">{bodyLanguageMetrics.gauge.score5}</div>
                <div className="text-lg text-gray-600">out of 5</div>
              </div>
              <div className="relative flex flex-col items-center justify-center mb-4" style={{ width: 100, height: 100 }}>
                <div className="relative" style={{ width: 100, height: 100 }}>
                  <svg width={100} height={100} className="transform -rotate-90">
                    <circle cx={50} cy={50} r={46} stroke="currentColor" strokeWidth={8} fill="none" className="text-gray-200" />
                    <circle cx={50} cy={50} r={46} stroke="currentColor" strokeWidth={8} fill="none" strokeDasharray={289.03} strokeDashoffset={289.03 - (bodyLanguageMetrics.gauge.score100 / 100) * 289.03} className={`transition-all duration-1000 ${getScoreColor(bodyLanguageMetrics.gauge.score100)}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(bodyLanguageMetrics.gauge.score100)}`}>{bodyLanguageMetrics.gauge.score100}</div>
                      <div className="text-xs text-gray-500">out of 100</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className={`inline-flex items-center rounded-full border text-xs font-semibold px-3 py-1 ${
                  bodyLanguageMetrics.gauge.verdict === 'Excellent' ? 'bg-green-100 text-green-800' :
                  bodyLanguageMetrics.gauge.verdict === 'Good' ? 'bg-yellow-100 text-yellow-800' :
                  bodyLanguageMetrics.gauge.verdict === 'Average' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {bodyLanguageMetrics.gauge.verdict}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 w-full">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <h4 className="font-bold mb-3 text-green-700 flex items-center text-sm">
                    <span className="text-lg mr-2">🌟</span>YOUR TOP AREAS
                  </h4>
                  <ul className="space-y-1 text-xs">
                    {bodyLanguageMetrics.topAreas.map((area, index) => (
                      <li key={index} className="flex items-center text-green-700">
                        <span className="mr-2">✅</span>{area}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                  <h4 className="font-bold mb-3 text-red-700 flex items-center text-sm">
                    <span className="text-lg mr-2">🎯</span>AREAS FOR IMPROVEMENT
                  </h4>
                  <ul className="space-y-1 text-xs">
                    {bodyLanguageMetrics.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-center text-red-700">
                        <span className="mr-2">🔴</span>{improvement}
                      </li>
                    ))}
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
                    <span className="text-xs">Surprise</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {getZeroExplanation('surprise', bodyLanguageMetrics.facial.positive.surprisePct || 0)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Happy</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {getZeroExplanation('happy', bodyLanguageMetrics.facial.positive.happyPct || 0)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-red-200 p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xl">😐</span>
                  <span className="font-semibold text-sm">Negative Facial Expression</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Neutral</span>
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                      {getZeroExplanation('neutral', bodyLanguageMetrics.facial.negative.neutralPct || 0)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Sad</span>
                    <Badge className="bg-red-100 text-red-800 text-xs">
                      {getZeroExplanation('sad', bodyLanguageMetrics.facial.negative.sadPct || 0)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Angry</span>
                    <Badge className="bg-red-100 text-red-800 text-xs">
                      {getZeroExplanation('angry', bodyLanguageMetrics.facial.negative.angryPct || 0)}
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      <span className="text-xs font-medium">Head Moves</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold">{poseData?.head_moves || "0 (0%)"}</span>
                      <div className={`px-2 py-0.5 rounded text-xs ${
                        getPercentageValue(poseData?.head_moves || "0 (0%)") <= 30 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {getPercentageValue(poseData?.head_moves || "0 (0%)") <= 30 ? 'Good' : 'Needs Work'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">👤</span>
                      <span className="text-xs font-medium">Head Position</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold">{getZeroExplanation('head_position', bodyLanguageMetrics.frequency.headPositionStablePct)}</span>
                      <div className={`px-2 py-0.5 rounded text-xs ${
                        bodyLanguageMetrics.frequency.headPositionStablePct >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {bodyLanguageMetrics.frequency.headPositionStablePct >= 70 ? 'Good' : 'Needs Work'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">🤲</span>
                      <span className="text-xs font-medium">Hand Movement</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold">{getZeroExplanation('hand_movement', bodyLanguageMetrics.frequency.handMovementPct)}</span>
                      <div className={`px-2 py-0.5 rounded text-xs ${
                        bodyLanguageMetrics.frequency.handMovementPct >= 20 && bodyLanguageMetrics.frequency.handMovementPct <= 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {bodyLanguageMetrics.frequency.handMovementPct >= 20 && bodyLanguageMetrics.frequency.handMovementPct <= 60 ? 'Good' : 'Needs Work'}
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
                      <span className="text-xs font-bold">{bodyLanguageMetrics.posture.straightPosturePct}%</span>
                      <div className={`px-2 py-0.5 rounded text-xs ${
                        bodyLanguageMetrics.posture.straightPosturePct >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {bodyLanguageMetrics.posture.straightPosturePct >= 70 ? 'Good' : 'Poor'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-medium">Shoulder Position</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold">{bodyLanguageMetrics.posture.shoulderPositionStablePct}%</span>
                      <div className={`px-2 py-0.5 rounded text-xs ${
                        bodyLanguageMetrics.posture.shoulderPositionStablePct >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {bodyLanguageMetrics.posture.shoulderPositionStablePct >= 50 ? 'Good' : 'Poor'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-medium">Leg Movement</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold">{poseData?.leg_moves || "0 (0%)"}</span>
                      <div className={`px-2 py-0.5 rounded text-xs ${
                        getPercentageValue(poseData?.leg_moves || "0 (0%)") <= 20 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {getPercentageValue(poseData?.leg_moves || "0 (0%)") <= 20 ? 'Good' : 'Poor'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-medium">Foot Movement</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold">{poseData?.foot_moves || "0 (0%)"}</span>
                      <div className={`px-2 py-0.5 rounded text-xs ${
                        getPercentageValue(poseData?.foot_moves || "0 (0%)") <= 15 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {getPercentageValue(poseData?.foot_moves || "0 (0%)") <= 15 ? 'Good' : 'Poor'}
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
                  <div className="text-xs text-gray-600 space-y-1">
                    {bodyLanguageMetrics.notes.map((note, index) => (
                      <p key={index}>{note}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Enhanced Voice Analysis Charts */}
        <div className="space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
              <span className="text-xl">📊</span>
              <span className="font-semibold text-lg">Vocal Tone Analysis</span>
            </div>
            <p className="text-gray-600 mt-2">Interactive voice analysis with detailed metrics and insights</p>
          </div>

          {/* Vocal Score Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
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
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{getVocalScore() || 0}</div>
                        <div className="text-sm text-gray-500">out of 100</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      🎯 Best Part of Speech - {getVocalScore() >= 80 ? 'Great' : getVocalScore() >= 70 ? 'Good' : 'Needs Work'}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 w-full">
                    <div className="flex justify-between text-sm">
                      <span>Avg Pace</span>
                      <span className="font-semibold">{vocal.paceLabel}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Tone</span>
                      <span className="font-semibold">{vocal.toneLabel}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 h-full">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">🎯</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-2 text-xl">Voice Insights</h4>
                      <div className="mb-4">
                        <div className="grid grid-cols-4 gap-4">
                          {(() => {
                            const insightsArr = Array.isArray(vocal.insights)
                              ? vocal.insights
                              : (typeof vocal.insights === 'string' && vocal.insights.includes('•')
                                  ? vocal.insights.split('•').map(i => i.trim()).filter(Boolean)
                                  : [vocal.insights]);
                            // Pad to 8 items for 4x2 grid
                            const padded = [...insightsArr];
                            while (padded.length < 8) padded.push('');
                            return [0,1,2,3,4,5,6,7].map(idx => (
                              <div key={idx} className="text-gray-900 text-base font-bold bg-white rounded-lg p-3 shadow-sm min-h-[48px] flex items-center justify-center uppercase tracking-wide">
                                    {padded[idx]}
                                  </div>
                            ));
                          })()}
                        </div>
                      </div>
                      
                      {/* Additional Voice Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-white rounded-lg p-3 border border-purple-100">
                          <div className="text-sm text-gray-500 font-medium">Clarity</div>
                          <div className="text-lg font-bold text-purple-600">{vocal.clarityScore}%</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-purple-100">
                          <div className="text-sm text-gray-500 font-medium">Fluency</div>
                          <div className="text-lg font-bold text-purple-600">{vocal.fluencyScore}%</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-purple-100">
                          <div className="text-sm text-gray-500 font-medium">Energy</div>
                          <div className="text-lg font-bold text-purple-600">{vocal.energyLevel}</div>
                        </div>
                        {vocal.speakingRatio && (
                          <div className="bg-white rounded-lg p-3 border border-purple-100">
                            <div className="text-sm text-gray-500 font-medium">Speaking</div>
                            <div className="text-lg font-bold text-purple-600">{vocal.speakingRatio}%</div>
                          </div>
                        )}
                      </div>
                      
                      {/* Voice Analysis Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-bold mb-3 text-green-700 flex items-center text-base">
                            <span className="text-lg mr-2">✅</span>Strengths
                          </h5>
                          <ul className="space-y-2">
                            {vocal.topAreas.map((t, i) => (
                              <li className="flex items-start text-green-700 text-sm" key={i}>
                                <span className="mr-2 mt-0.5">•</span>
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-bold mb-3 text-orange-700 flex items-center text-base">
                            <span className="text-lg mr-2">🎯</span>Areas for Enhancement
                          </h5>
                          <ul className="space-y-2">
                            {vocal.improvements.map((t, i) => (
                              <li className="flex items-start text-orange-700 text-sm" key={i}>
                                <span className="mr-2 mt-0.5">•</span>
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* MODULATION Chart */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-xl border border-blue-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-t-xl">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">📈</span>
                  <span className="font-bold text-lg">MODULATION</span>
                </div>
              </div>
              <div className="p-6">
                <div className="h-64 flex items-center justify-center mb-4">
                  <svg width="100%" height="240" viewBox="0 0 320 240" className="text-blue-600">
                    <defs>
                      <linearGradient id="modulationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1"/>
                      </linearGradient>
                      <filter id="glowBlue">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    {(() => {
                      const left = 50, right = 300, top = 30, bottom = 180;
                      const n = voiceSeries.n;
                      const x = (i: number) => left + (right - left) * (i / (n - 1));
                      const y = (v: number) => {
                        const { min, max } = voiceSeries.scales.modulation; 
                        const span = max - min || 1;
                        return top + (1 - (v - min) / span) * (bottom - top);
                      };
                      const points = voiceSeries.modulation.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
                      const areaPath = `${points} L ${right} ${bottom} L ${left} ${bottom} Z`;
                      const yTicks = voiceSeries.scales.modulation.ticks;
                      const yTickEls = yTicks.map((t, idx) => (
                        <g key={idx}>
                          <line x1={left} x2={right} y1={y(t)} y2={y(t)} stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
                          <text x={left - 8} y={y(t) + 4} fontSize="11" fill="#6b7280" textAnchor="end">{t}</text>
                        </g>
                      ));
                      const xLabelEls = voiceSeries.xTickIdx.map((i, idx) => (
                        <text key={idx} x={x(i)} y={210} fontSize="11" fill="#6b7280" textAnchor="middle">{voiceSeries.xLabels[idx]}</text>
                      ));
                      const dotEls = voiceSeries.modulation.map((v, i) => (
                        <g key={i}>
                          <circle cx={x(i)} cy={y(v)} r="5" fill="#3b82f6" filter="url(#glowBlue)" className="hover:r-8 transition-all cursor-pointer"/>
                          <circle cx={x(i)} cy={y(v)} r="3" fill="white" className="pointer-events-none"/>
                        </g>
                      ));
                      return (
                        <g>
                          {yTickEls}
                          <path d={areaPath} fill="url(#modulationGradient)" stroke="#3b82f6" strokeWidth="3" />
                          <path d={points} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          {dotEls}
                          {xLabelEls}
                        </g>
                      );
                    })()}
                  </svg>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200 group-hover:bg-blue-50 transition-colors">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {voiceSeries.modulation.length > 0 ? 
                        (voiceSeries.modulation.reduce((a, b) => a + b, 0) / voiceSeries.modulation.length).toFixed(1) : 
                        'N/A'
                      }
                    </div>
                    <div className="text-sm text-gray-600">Average Score</div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500 text-center">
                    Voice variation and expressiveness
                  </div>
                </div>
              </div>
            </div>

            {/* PITCH Chart */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 rounded-t-xl">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">🎵</span>
                  <span className="font-bold text-lg">PITCH</span>
                </div>
              </div>
              <div className="p-6">
                <div className="h-64 flex items-center justify-center mb-4">
                  <svg width="100%" height="240" viewBox="0 0 320 240" className="text-purple-600">
                    <defs>
                      <filter id="glowPurple">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    {(() => {
                      const left = 50, right = 300, top = 30, bottom = 180;
                      const n = voiceSeries.n;
                      const x = (i: number) => left + (right - left) * (i / (n - 1));
                      const y = (v: number) => {
                        const { min, max } = voiceSeries.scales.pitch; 
                        const span = max - min || 1;
                        return top + (1 - (v - min) / span) * (bottom - top);
                      };
                      const d = voiceSeries.pitch.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
                      const yTicks = voiceSeries.scales.pitch.ticks;
                      const yTickEls = yTicks.map((t, idx) => (
                        <g key={idx}>
                          <line x1={left} x2={right} y1={y(t)} y2={y(t)} stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
                          <text x={left - 8} y={y(t) + 4} fontSize="11" fill="#6b7280" textAnchor="end">{t}</text>
                        </g>
                      ));
                      const xLabelEls = voiceSeries.xTickIdx.map((i, idx) => (
                        <text key={idx} x={x(i)} y={210} fontSize="11" fill="#6b7280" textAnchor="middle">{voiceSeries.xLabels[idx]}</text>
                      ));
                      const dotEls = voiceSeries.pitch.map((v, i) => (
                        <g key={i}>
                          <circle cx={x(i)} cy={y(v)} r="6" fill="#8b5cf6" filter="url(#glowPurple)" className="hover:r-9 transition-all cursor-pointer"/>
                          <circle cx={x(i)} cy={y(v)} r="4" fill="white" className="pointer-events-none"/>
                        </g>
                      ));
                      return (
                        <g>
                          {yTickEls}
                          <path d={d} fill="none" stroke="#8b5cf6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                          {dotEls}
                          {xLabelEls}
                        </g>
                      );
                    })()}
                  </svg>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200 group-hover:bg-purple-50 transition-colors">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {voiceSeries.pitch.length > 0 ? 
                        Math.round(voiceSeries.pitch.reduce((a, b) => a + b, 0) / voiceSeries.pitch.length) + ' Hz' : 
                        'N/A'
                      }
                    </div>
                    <div className="text-sm text-gray-600">Average Pitch</div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500 text-center">
                    Voice tone and clarity
                  </div>
                </div>
              </div>
            </div>

            {/* VOLUME Chart */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-xl border border-green-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-t-xl">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">🔊</span>
                  <span className="font-bold text-lg">VOLUME</span>
                </div>
              </div>
              <div className="p-6">
                <div className="h-64 flex items-center justify-center mb-4">
                  <svg width="100%" height="240" viewBox="0 0 320 240" className="text-green-600">
                    <defs>
                      <filter id="glowGreen">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    {(() => {
                      const left = 50, right = 300, top = 30, bottom = 180;
                      const n = voiceSeries.n;
                      const x = (i: number) => left + (right - left) * (i / (n - 1));
                      const y = (v: number) => {
                        const { min, max } = voiceSeries.scales.volume; 
                        const span = max - min || 1;
                        return top + (1 - (v - min) / span) * (bottom - top);
                      };
                      const yTicks = voiceSeries.scales.volume.ticks;
                      const yTickEls = yTicks.map((t, idx) => (
                        <g key={idx}>
                          <line x1={left} x2={right} y1={y(t)} y2={y(t)} stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
                          <text x={left - 12} y={y(t) + 4} fontSize="11" fill="#6b7280" textAnchor="end">{t}</text>
                        </g>
                      ));
                      const xLabelEls = voiceSeries.xTickIdx.map((i, idx) => (
                        <text key={idx} x={x(i)} y={210} fontSize="11" fill="#6b7280" textAnchor="middle">{voiceSeries.xLabels[idx]}</text>
                      ));
                      const barWidth = ((right - left) / (n - 1)) * 0.7;
                      const bars = voiceSeries.volume.map((v, i) => {
                        const cx = x(i) - barWidth / 2;
                        const yv = y(v);
                        return (
                          <g key={i}>
                            <rect 
                              x={cx} 
                              y={yv} 
                              width={barWidth} 
                              height={bottom - yv} 
                              rx="4" 
                              fill="#10b981" 
                              filter="url(#glowGreen)"
                              className="hover:fill-green-400 transition-colors cursor-pointer"
                            />
                          </g>
                        );
                      });
                      return (
                        <g>
                          {yTickEls}
                          {bars}
                          {xLabelEls}
                        </g>
                      );
                    })()}
                  </svg>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200 group-hover:bg-green-50 transition-colors">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {voiceSeries.volume.length > 0 ? 
                        Math.round(voiceSeries.volume.reduce((a, b) => a + b, 0) / voiceSeries.volume.length) + ' dB' : 
                        'N/A'
                      }
                    </div>
                    <div className="text-sm text-gray-600">Average Volume</div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500 text-center">
                    Voice projection and strength
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pose & Voice Analysis */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">🎭</span>
            <span className="font-semibold text-lg">Pose & Voice Analysis</span>
          </div>
          <p className="text-gray-600 mt-2">Advanced body language and vocal analysis using MediaPipe and audio processing</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dynamic Gestures Section */}
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
              <CardTitle className="text-lg font-semibold text-center">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">🎭</span>
                  <span>DYNAMIC GESTURES</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Smiles Detected */}
                <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">😊</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">SMILES DETECTED</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {poseData?.smiles ? getCountValue(poseData.smiles) : 0}
                    </div>
                    <div className="text-sm text-gray-500">
                      ({poseData?.smiles || "0 (0.0%)"})
                    </div>
                  </div>
                </div>

                {/* Head Movements */}
                <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">HEAD MOVEMENTS</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {poseData?.head_moves ? getCountValue(poseData.head_moves) : 0}
                    </div>
                    <div className="text-sm text-gray-500">
                      ({poseData?.head_moves || "0 (0.0%)"})
                    </div>
                  </div>
                </div>

                {/* Hand Movements */}
                <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">🤲</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">HAND MOVEMENTS</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {poseData?.hand_moves ? getCountValue(poseData.hand_moves) : 0}
                    </div>
                    <div className="text-sm text-gray-500">
                      ({poseData?.hand_moves || "0 (0.0%)"})
                    </div>
                  </div>
                </div>

                {/* Eye Contact */}
                <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">👁️</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">EYE CONTACT</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {poseData?.eye_contact ? getCountValue(poseData.eye_contact) : 0}
                    </div>
                    <div className="text-sm text-gray-500">
                      ({poseData?.eye_contact || "0 (0.0%)"})
                    </div>
                  </div>
                </div>

                {/* Leg Movements */}
                <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">🦵</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">LEG MOVEMENTS</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {poseData?.leg_moves ? getCountValue(poseData.leg_moves) : 0}
                    </div>
                    <div className="text-sm text-gray-500">
                      ({poseData?.leg_moves || "0 (0.0%)"})
                    </div>
                  </div>
                </div>

                {/* Foot Movements */}
                <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">🦶</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">FOOT MOVEMENTS</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {poseData?.foot_moves ? getCountValue(poseData.foot_moves) : 0}
                    </div>
                    <div className="text-sm text-gray-500">
                      ({poseData?.foot_moves || "0 (0.0%)"})
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Voice Analysis Section */}
          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white">
              <CardTitle className="text-lg font-semibold text-center">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">🎤</span>
                  <span>AUDIO PROCESSING</span>
                </div>
        
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Duration */}
                <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">⏱️</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">DURATION</div>
                      <div className="text-sm text-gray-500">Total Length</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {poseData?.audio?.duration_sec ? `${poseData.audio.duration_sec.toFixed(2)}s` : 
                       analysisData?.duration || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Volume */}
                <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">🔊</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">VOLUME</div>
                      <div className="text-sm text-gray-500">Average Volume</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {poseData?.audio?.volume_db ? `${poseData.audio.volume_db.toFixed(2)} dB` : "N/A"}
                    </div>
                  </div>
                </div>

                {/* Mean Pitch */}
                <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">🎵</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">MEAN PITCH</div>
                      <div className="text-sm text-gray-500">Average Pitch</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {poseData?.audio?.mean_pitch_hz ? `${poseData.audio.mean_pitch_hz.toFixed(2)} Hz` : "N/A"}
                    </div>
                  </div>
                </div>

                {/* Pitch Range */}
                <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">📊</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">PITCH RANGE</div>
                      <div className="text-sm text-gray-500">Frequency Range</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {poseData?.audio?.pitch_range || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Pauses */}
                <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">⏸️</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">PAUSES</div>
                      <div className="text-sm text-gray-500">Number of Pauses</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {poseData?.audio?.num_pauses || 0}
                    </div>
                  </div>
                </div>

                {/* Speaking Time */}
                <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">🗣️</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">SPEAKING TIME</div>
                      <div className="text-sm text-gray-500">Active Speaking</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {poseData?.audio?.spoken_duration_sec ? `${poseData.audio.spoken_duration_sec.toFixed(2)}s` : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

    <Card className="bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200">
          <CardContent className="p-6">
            <div className="text-sm text-gray-700">
      <strong>Note:</strong> {vocal.score100>=80? 'Excellent vocal delivery with strong clarity and control.' : vocal.score100>=70? 'Good vocal delivery; consider a bit more variation and pacing polish.' : vocal.score100>=50? 'Average delivery; work on pitch variety, projection, and consistent pacing.' : 'Needs work: improve projection, add pitch variety, and refine pacing.'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Sections */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">📊</span>
            <span className="font-semibold text-lg">Summary & Key Insights</span>
          </div>
          <p className="text-gray-600 mt-2">Comprehensive overview of your presentation performance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Body Summary */}
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-0 shadow-xl h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-emerald-800">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <span className="text-2xl">👤</span>
                  <span>Body Language Summary</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-emerald-200 min-h-[200px]">
                  <div className="text-sm font-semibold text-emerald-700 mb-2">Strengths</div>
                  <ul className="text-sm text-gray-700 space-y-2">
                    {getBodyLanguagePoints().strengths.map((strength, index) => (
                      <li key={index}><strong>• {strength}</strong></li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-orange-200 min-h-[200px]">
                  <div className="text-sm font-semibold text-orange-700 mb-2">Weaknesses</div>
                  <ul className="text-sm text-gray-700 space-y-2">
                    {getBodyLanguagePoints().weaknesses.map((weakness, index) => (
                      <li key={index}><strong>• {weakness}</strong></li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voice Summary */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-blue-800">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <span className="text-2xl">🎤</span>
                  <span>Voice Analysis Summary</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-green-200 min-h-[200px]">
                  <div className="text-sm font-semibold text-green-700 mb-2">Strengths</div>
                  <ul className="text-sm text-gray-700 space-y-2">
                    {getVoiceAnalysisPoints().strengths.map((strength, index) => (
                      <li key={index}><strong>• {strength}</strong></li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-orange-200 min-h-[200px]">
                  <div className="text-sm font-semibold text-orange-700 mb-2">Enhancement Areas</div>
                  <ul className="text-sm text-gray-700 space-y-2">
                    {getVoiceAnalysisPoints().weaknesses.map((weakness, index) => (
                      <li key={index}><strong>• {weakness}</strong></li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Speaking Skills Summary */}
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-0 shadow-xl h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-purple-800">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <span className="text-2xl">💬</span>
                  <span>Speaking Skills</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-green-200 min-h-[200px]">
                  <div className="text-sm font-semibold text-green-700 mb-2">Strengths</div>
                  <ul className="text-sm text-gray-700 space-y-2">
                    {getSpeakingSkillsPoints().strengths.map((strength, index) => (
                      <li key={index}><strong>• {strength}</strong></li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-orange-200 min-h-[200px]">
                  <div className="text-sm font-semibold text-orange-700 mb-2">Areas for Improvement</div>
                  <ul className="text-sm text-gray-700 space-y-2">
                    {getSpeakingSkillsPoints().weaknesses.map((weakness, index) => (
                      <li key={index}><strong>• {weakness}</strong></li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Summary */}
      <Card className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-0 shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center space-x-3 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
              <span className="text-2xl">🎯</span>
              <span className="font-semibold text-lg">Performance Summary</span>
            </div>
            <h3 className="text-2xl font-bold">
              {getPerformanceSummary().title}
            </h3>
            <p className="text-lg opacity-90 max-w-4xl mx-auto leading-relaxed">
              {getPerformanceSummary().message}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">
                  {getOverallScore()}
                </div>
                <div className="text-sm opacity-80">Your Score</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">
                  {getPerformanceSummary().industryAverage}
                </div>
                <div className="text-sm opacity-80">Industry Average</div>
              </div>
            </div>

            {/* Dynamic Performance Comparison */}
            <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium opacity-80">Performance vs Industry Average</span>
                <span className="text-sm font-bold">
                  {getOverallScore() > getPerformanceSummary().industryAverage ? 
                    `+${getOverallScore() - getPerformanceSummary().industryAverage} above average` : 
                    getOverallScore() === getPerformanceSummary().industryAverage ? 
                    'At industry average' : 
                    `${getPerformanceSummary().industryAverage - getOverallScore()} below average`}
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-1000" 
                  style={{ 
                    width: `${Math.min(100, (getOverallScore() / Math.max(getPerformanceSummary().industryAverage, getOverallScore())) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}