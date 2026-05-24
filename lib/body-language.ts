// Utility to map Django MediaPipe pose_voice_analysis and optional emotion_analysis
// into a UI-friendly Body Language view model used by React components.

export interface PoseAnalysisData {
  frames_processed: number;
  smiles: string; // "45 (37.5%)"
  head_moves: string; // count + percentage
  hand_moves: string;
  eye_contact: string;
  leg_moves: string;
  foot_moves: string;
  audio?: {
    duration_sec: number;
    volume_db: number;
    mean_pitch_hz: number;
    pitch_range: string;
    avg_pitch_range?: number;
    num_pauses: number;
    spoken_duration_sec: number;
  };
}

export interface EmotionAnalysisData {
  dominant_emotion?: string;
  confidence?: number; // already percent 0-100
  emotion_scores?: Record<string, number>; // raw counts
  detected_keywords?: Array<any>;
}

export interface BodyLanguageMetrics {
  overallScore: number; // 0-100
  gauge: {
    score5: number; // 0-5 scaled
    score100: number; // 0-100
    verdict: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';
  };
  frequency: {
    gazePct: number; // eye contact
    headPositionStablePct: number; // derived from inverse of head moves
    handMovementPct: number; // movement frequency
  };
  posture: {
    straightPosturePct: number; // derived from leg/foot movement
    shoulderPositionStablePct: number; // proxy from inverse of hand movement
  };
  facial: {
    positive: {
      surprisePct: number | null;
      happyPct: number | null; // from smiles
    };
    negative: {
      neutralPct: number | null;
      sadPct: number | null;
      angryPct: number | null;
    };
  };
  topAreas: string[];
  improvements: string[];
  notes: string[]; // disclaimers about proxies
}

export function parsePercentFromCombined(value?: string): number {
  // Expected formats: "45 (37.5%)" or "0 (0%)" or undefined/null
  if (!value) {
    console.log('🔍 DEBUG parsePercentFromCombined - empty value:', value);
    return 0;
  }
  const m = value.match(/\((\d+(?:\.\d+)?)%\)/);
  const result = m ? Math.max(0, Math.min(100, parseFloat(m[1]))) : 0;
  console.log('🔍 DEBUG parsePercentFromCombined - input:', value, 'output:', result);
  return result;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function verdict(score100: number): BodyLanguageMetrics['gauge']['verdict'] {
  if (score100 >= 80) return 'Excellent';
  if (score100 >= 60) return 'Good';
  if (score100 >= 40) return 'Average';
  return 'Needs Improvement';
}

function getEmotionPercent(scores: Record<string, number> | undefined, key: string): number | null {
  if (!scores) return null;
  const total = Object.values(scores).reduce((a, b) => a + (typeof b === 'number' ? b : Number(b) || 0), 0);
  if (total <= 0) return 0;
  const value = scores[key] ?? 0;
  const num = typeof value === 'number' ? value : Number(value) || 0;
  return (num / total) * 100;
}

export function computeBodyLanguageMetrics(
  pose?: PoseAnalysisData | null,
  emotion?: EmotionAnalysisData | null
): BodyLanguageMetrics {
  console.log('🔍 DEBUG computeBodyLanguageMetrics - pose input:', pose);
  console.log('🔍 DEBUG computeBodyLanguageMetrics - emotion input:', emotion);
  
  const eye = parsePercentFromCombined(pose?.eye_contact);
  const headMove = parsePercentFromCombined(pose?.head_moves);
  const handMove = parsePercentFromCombined(pose?.hand_moves);
  const legMove = parsePercentFromCombined(pose?.leg_moves);
  const footMove = parsePercentFromCombined(pose?.foot_moves);
  const smilesPct = parsePercentFromCombined(pose?.smiles);

  console.log('🔍 DEBUG parsed percentages:', { eye, headMove, handMove, legMove, footMove, smilesPct });

  // Derived metrics
  const headStable = Math.max(0, 100 - headMove); // less head movement implies stability
  const straightPosture = Math.max(0, 100 - (legMove + footMove) / 2); // more leg/foot movement -> worse posture
  const shoulderStable = Math.max(0, 100 - handMove); // proxy: more hand movement -> less shoulder stability

  // Overall weighted score: gaze (30%), head stability (30%), hand movement balance (20%), posture (20%)
  // Hand movement: prefer moderate movement (20-60% => 100 score); else linearly decrease
  const handBalanceScore = (() => {
    const x = handMove;
    if (x >= 20 && x <= 60) return 100;
    if (x < 20) return (x / 20) * 100; // too little
    // x > 60
    return Math.max(0, (100 - (x - 60) * (100 / 40))); // too much
  })();

  const weighted = clamp01(0.3 * (eye / 100) + 0.3 * (headStable / 100) + 0.2 * (handBalanceScore / 100) + 0.2 * (straightPosture / 100));
  const overallScore100 = Math.round(weighted * 100);

  // Facial expression percentages from available signals
  const surprisePct = getEmotionPercent(emotion?.emotion_scores, 'Surprise');
  const neutralPct = getEmotionPercent(emotion?.emotion_scores, 'Neutral');
  const sadPct = getEmotionPercent(emotion?.emotion_scores, 'Sadness');
  const angryPct = getEmotionPercent(emotion?.emotion_scores, 'Anger');

  // Top areas and improvements
  const topAreas: string[] = [];
  if (straightPosture >= 70) topAreas.push('Your posture looks good');
  if (handBalanceScore >= 70) topAreas.push('Your hand movements are good');
  if (headStable >= 60) topAreas.push('Your head movements look fine');

  const improvements: string[] = [];
  if (eye < 60) improvements.push('Increase eye contact to engage your audience');
  if (headStable < 60) improvements.push('Reduce head movement for a steadier presence');
  if (!(handMove >= 20 && handMove <= 60)) improvements.push('Use natural hand gestures (aim for 20–60% of time)');

  const notes: string[] = [
    'Head/shoulder stability and posture are derived proxies from movement frequencies (no direct MediaPipe posture classifier available).',
  ];

  return {
    overallScore: overallScore100,
    gauge: {
      score5: Math.round((overallScore100 / 100) * 5 * 10) / 10, // one decimal
      score100: overallScore100,
      verdict: verdict(overallScore100),
    },
    frequency: {
      gazePct: eye,
      headPositionStablePct: headStable,
      handMovementPct: handMove,
    },
    posture: {
      straightPosturePct: Math.round(straightPosture),
      shoulderPositionStablePct: Math.round(shoulderStable),
    },
    facial: {
      positive: {
        surprisePct: surprisePct === null ? null : Math.round(surprisePct),
        happyPct: smilesPct || smilesPct === 0 ? Math.round(smilesPct) : null,
      },
      negative: {
        neutralPct: neutralPct === null ? null : Math.round(neutralPct),
        sadPct: sadPct === null ? null : Math.round(sadPct),
        angryPct: angryPct === null ? null : Math.round(angryPct),
      },
    },
    topAreas,
    improvements: improvements.length ? improvements : ['N/A'],
    notes,
  };
}
