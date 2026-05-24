'use client';

// This file should only run in the browser environment

// Simplified interfaces for PDF generation - only essential fields
interface VideoInfo {
  filename: string;
  duration: string;
  file_size: string;
  language: string;
}

interface ContentMetrics {
  word_power_score?: number;
  word_power_percentage?: number;
  clarity_score?: number;
  fluency_score?: number;
  word_count?: number;
  vocabulary_diversity?: number;
}

interface VocalMetrics {
  volume_db?: number;
  mean_pitch_hz?: number;
  pitch_range?: string;
  num_pauses?: number;
  spoken_duration_sec?: number;
  duration_sec?: number;
}

interface BodyLanguageMetrics {
  frames_processed: number;
  smiles: string;
  eye_contact: string;
  hand_moves: string;
  head_moves: string;
}

interface UserInfo {
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  accountId?: string;
  userId?: string;
}

interface ExtendedReportFields {
  // Video details
  video_type?: string;
  talking_to?: string;
  hands_legs_visible?: string;
  created_date?: string;
  created_time?: string;

  // Overall scores
  overall_performance_score?: string | number;
  body_language_score?: string | number;
  vocal_tone_score?: string | number;
  word_power_score?: string | number;

  // Body language extended
  body_language_overall_score?: number;
  positive_facial_emotions?: string;
  calm_percent?: string;
  eye_contact_percent?: number;
  smile_count?: number;
  hands_used?: string;
  weight_balanced_on_both_leg_percent?: string;
  weight_on_one_leg_percent?: string;
  head_movement_percent?: number;
  leg_movement_percent?: number;
  hands_crossed_percent?: string;
  wrist_closed_percent?: string;
  anger_percent?: number;
  confused_percent?: number;
  fear_percent?: number;
  sad_percent?: number;
  body_language_top_areas?: string[];
  body_language_improvement_areas?: string[];

  // Vocal tone extended
  vocal_tone_overall_score?: number;
  rate_of_speech?: number;
  modulation_level?: string;
  average_pitch?: number;
  average_volume?: number;
  vocal_tone_top_areas?: string[];
  vocal_tone_improvement_areas?: string[];

  // Word power extended
  word_power_overall_score?: number;
  text_sentiment?: string;
  text_sentiment_percent?: number;
  unique_words_count?: number;
  i_usage_percent?: number;
  sentence_length_avg?: number;
  keywords_list?: Array<{ word: string; count: number }> | string[];
  pet_words?: Array<{ word: string; count: number }> | string[];
  filler_words_list?: Array<{ word: string; count: number; percentage?: number }> | string[];
  word_power_top_areas?: string[];
  word_power_improvement_areas?: string[];

  // Thumbnails
  primary_thumbnail?: { imageData: string; mimeType?: string } | string; // can be data URL or object
  key_frames?: Array<{ imageData: string; mimeType?: string } | string>;
  upload_id?: string;
  account_id?: string;
  accountId?: string;
  user_id?: string;
  userId?: string;
}

interface SimplifiedReportData {
  videoInfo: VideoInfo;
  contentMetrics?: ContentMetrics;
  vocalMetrics?: VocalMetrics;
  bodyLanguageMetrics?: BodyLanguageMetrics;
  userInfo?: UserInfo;
  transcript?: string;
  summary?: string;
  keywords?: string;
  extended?: ExtendedReportFields;
}

// Calculate scores from available data
function calculateOverallScore(data: SimplifiedReportData): number {
  let totalScore = 0;
  let scoreCount = 0;

  // Content score
  if (data.contentMetrics?.word_power_percentage) {
    totalScore += data.contentMetrics.word_power_percentage;
    scoreCount++;
  }

  // Vocal score (simple calculation)
  if (data.vocalMetrics?.volume_db) {
    const vocalScore = Math.max(0, Math.min(100, data.vocalMetrics.volume_db + 60));
    totalScore += vocalScore;
    scoreCount++;
  }

  // Body language score (from smiles percentage)
  if (data.bodyLanguageMetrics?.smiles) {
    const match = data.bodyLanguageMetrics.smiles.match(/\((\d+(?:\.\d+)?)%\)/);
    if (match) {
      const bodyScore = Math.min(100, parseFloat(match[1]) * 3); // Scale up smile percentage
      totalScore += bodyScore;
      scoreCount++;
    }
  }

  return scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
}

// Calculate speaking pace
function calculateWPM(data: SimplifiedReportData): number {
  if (!data.transcript || !data.vocalMetrics?.spoken_duration_sec) return 0;
  
  const wordCount = data.transcript.split(/\s+/).filter(word => word.length > 0).length;
  const minutes = data.vocalMetrics.spoken_duration_sec / 60;
  
  return minutes > 0 ? Math.round(wordCount / minutes) : 0;
}

// Extract percentage from string like "5 (23%)"
function extractPercentage(value: string): number {
  const match = value.match(/\((\d+(?:\.\d+)?)%\)/);
  return match ? parseFloat(match[1]) : 0;
}

// Generate clean, professional HTML for PDF
function generatePDFHTML(data: SimplifiedReportData): string {
  console.log('🎨 Starting HTML generation with data:', data);
  
  const overallScore = calculateOverallScore(data);
  const wpm = calculateWPM(data);
  const smilesPercent = data.bodyLanguageMetrics ? extractPercentage(data.bodyLanguageMetrics.smiles) : 0;
  const eyeContactPercent = data.bodyLanguageMetrics ? extractPercentage(data.bodyLanguageMetrics.eye_contact) : 0;

  // Helper to normalize list-like inputs (array | comma string | object map)
  const normalizeList = (input: any): any[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') {
      return input
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    if (typeof input === 'object') {
      return Object.entries(input as Record<string, any>).map(([word, count]) => ({ word, count }));
    }
    return [];
  };

  const kwList = normalizeList(data.extended?.keywords_list);
  const petList = normalizeList(data.extended?.pet_words);
  const fillerList = normalizeList(data.extended?.filler_words_list);

  // Resolve displayed values strictly from provided fields (no computed fallbacks)
  const pillBody = data.extended?.body_language_score ?? '-';
  const pillVocal = data.extended?.vocal_tone_score ?? '-';
  const pillWord = data.extended?.word_power_score ?? '-';

  console.log('📊 Calculated metrics:', {
    overallScore,
    wpm,
    smilesPercent,
    eyeContactPercent
  });

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Video Analysis Report</title>
      <link rel="stylesheet" href="/pdf-report.css" />
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="brand-row">
          <img src="/logo.png" alt="Logo" class="brand-logo" />
        </div>
        <div class="title">Video Analysis Report</div>
        <div class="subtitle">Communication Performance Assessment</div>
        <div class="date">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
        ${data.userInfo?.name ? `<div style="margin-top: 10px; font-weight: bold;">Prepared for: ${data.userInfo.name}</div>` : ''}
        ${(() => {
          const pt = data.extended?.primary_thumbnail;
          if (!pt) return '';
          const src = typeof pt === 'string' ? pt : `data:${pt.mimeType || 'image/jpeg'};base64,${pt.imageData}`;
          return `<img class=\"hero-thumb\" src=\"${src}\" alt=\"Thumbnail\" />`;
        })()}
        ${(() => {
          const frames = (data.extended?.key_frames || []).slice(0,5);
          if (!frames || frames.length === 0) return '';
          const imgs = frames.map((f: any) => {
            const src = typeof f === 'string' ? f : `data:${f.mimeType || 'image/jpeg'};base64,${f.imageData}`;
            return `<img src=\"${src}\" alt=\"frame\" />`;
          }).join('');
          return `<div class=\"filmstrip\">${imgs}</div>`;
        })()}
      </div>
    <!-- Video Information -->
<div class="section">
  <div class="section-title">📹 Video Information</div>

  <div class="video-info-column">
   

    <!-- Video Details -->
    <div class="video-info-item">
      <div class="video-info-label"><strong>Filename:</strong></div>
      <div class="video-info-value">${data.videoInfo.filename || 'N/A'}</div>
    </div>

    <div class="video-info-item">
      <div class="video-info-label"><strong>File Size:</strong></div>
      <div class="video-info-value">${data.videoInfo.file_size || 'N/A'}</div>
    </div>

    <div class="video-info-item">
      <div class="video-info-label"><strong>Language:</strong></div>
      <div class="video-info-value">${data.videoInfo.language || 'N/A'}</div>
        </div>
      </div>

      <!-- Hero Summary with Score Pills -->
      <div class="section" style="margin-top: 6px;">
        <div class="score-card" style="margin: 10px 0 12px 0;">
          <div class="score-value">${overallScore}/100</div>
          <div class="score-label">Overall Score</div>
        </div>
        <div class="score-band">
          <div class="score-pill pill-blue">
            <div class="label">Body Language</div>
            <div class="value">${pillBody}</div>
          </div>
          <div class="score-pill pill-purple">
            <div class="label">Vocal Tone</div>
            <div class="value">${pillVocal}</div>
          </div>
          <div class="score-pill pill-pink">
            <div class="label">Word Power</div>
            <div class="value">${pillWord}</div>
        </div>
      </div>
      </div>


      <!-- Performance Metrics -->
      <div class="section">
        <div class="section-title">📈 Key Metrics</div>
        <div class="metrics-grid">
          ${data.contentMetrics?.word_power_percentage ? `
          <div class="metric-card">
            <div class="metric-value ${data.contentMetrics.word_power_percentage >= 70 ? 'status-good' : data.contentMetrics.word_power_percentage >= 50 ? 'status-warning' : 'status-poor'}">${data.contentMetrics.word_power_percentage}%</div>
            <div class="metric-label">Word Power</div>
          </div>
          ` : ''}
          
          ${wpm > 0 ? `
          <div class="metric-card">
            <div class="metric-value ${wpm >= 120 && wpm <= 160 ? 'status-good' : 'status-warning'}">${wpm}</div>
            <div class="metric-label">Words per Minute</div>
          </div>
          ` : ''}
          
          ${data.bodyLanguageMetrics ? `
          <div class="metric-card">
            <div class="metric-value ${smilesPercent >= 15 ? 'status-good' : smilesPercent >= 5 ? 'status-warning' : 'status-poor'}">${smilesPercent.toFixed(1)}%</div>
            <div class="metric-label">Positive Expressions</div>
          </div>
          ` : ''}
          
          ${data.bodyLanguageMetrics ? `
          <div class="metric-card">
            <div class="metric-value ${eyeContactPercent >= 60 ? 'status-good' : eyeContactPercent >= 40 ? 'status-warning' : 'status-poor'}">${eyeContactPercent.toFixed(1)}%</div>
            <div class="metric-label">Eye Contact</div>
          </div>
          ` : ''}
          
          ${data.vocalMetrics?.num_pauses !== undefined ? `
          <div class="metric-card">
            <div class="metric-value ${data.vocalMetrics.num_pauses >= 2 && data.vocalMetrics.num_pauses <= 8 ? 'status-good' : data.vocalMetrics.num_pauses <= 1 || data.vocalMetrics.num_pauses >= 12 ? 'status-poor' : 'status-warning'}">${data.vocalMetrics.num_pauses}</div>
            <div class="metric-label">Pauses</div>
          </div>
          ` : ''}
          
          ${data.contentMetrics?.vocabulary_diversity ? `
          <div class="metric-card">
            <div class="metric-value ${data.contentMetrics.vocabulary_diversity >= 70 ? 'status-good' : data.contentMetrics.vocabulary_diversity >= 50 ? 'status-warning' : 'status-poor'}">${data.contentMetrics.vocabulary_diversity}%</div>
            <div class="metric-label">Vocabulary Diversity</div>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Vocal Analysis -->
      ${data.vocalMetrics || data.extended?.vocal_tone_overall_score ? `
      <div class="section">
        <div class="section-title">🎤 Vocal Analysis</div>
        <div class="grid">
          ${data.vocalMetrics?.volume_db ? `
          <div class="card">
            <div class="card-label">Volume Level</div>
            <div class="card-value">${data.vocalMetrics.volume_db.toFixed(1)} dB</div>
          </div>
          ` : ''}
          
          ${data.vocalMetrics?.mean_pitch_hz ? `
          <div class="card">
            <div class="card-label">Average Pitch</div>
            <div class="card-value">${data.vocalMetrics.mean_pitch_hz.toFixed(0)} Hz</div>
          </div>
          ` : ''}
          
          ${data.vocalMetrics && data.vocalMetrics.num_pauses !== undefined ? `
          <div class="card">
            <div class="card-label">Pauses</div>
            <div class="card-value">${data.vocalMetrics.num_pauses} times</div>
          </div>
          ` : ''}
          
          ${data.vocalMetrics?.spoken_duration_sec ? `
          <div class="card">
            <div class="card-label">Speaking Time</div>
            <div class="card-value">${Math.round(data.vocalMetrics.spoken_duration_sec)}s</div>
          </div>
          ` : ''}

          ${data.extended?.rate_of_speech ? `
          <div class="card">
            <div class="card-label">Rate of Speech</div>
            <div class="card-value">${data.extended.rate_of_speech} wpm</div>
          </div>` : ''}

          ${data.extended?.modulation_level ? `
          <div class="card">
            <div class="card-label">Modulation</div>
            <div class="card-value">${data.extended.modulation_level}</div>
          </div>` : ''}

          ${data.extended?.average_pitch ? `
          <div class="card">
            <div class="card-label">Average Pitch</div>
            <div class="card-value">${Math.round(data.extended.average_pitch)} Hz</div>
          </div>` : ''}

          ${data.extended?.average_volume ? `
          <div class="card">
            <div class="card-label">Average Volume</div>
            <div class="card-value">${Math.round(data.extended.average_volume)} dB</div>
          </div>` : ''}

          ${data.vocalMetrics?.pitch_range ? `
          <div class="card">
            <div class="card-label">Pitch Range</div>
            <div class="card-value">${data.vocalMetrics.pitch_range}</div>
          </div>` : ''}

          ${data.vocalMetrics?.duration_sec ? `
          <div class="card">
            <div class="card-label">Total Duration</div>
            <div class="card-value">${Math.round(data.vocalMetrics.duration_sec)}s</div>
          </div>` : ''}
        </div>
        
        <!-- Vocal Analysis Graph -->
        <div class="graph-card" style="margin: 20px 0;">
          <div class="graph-title">🎤 Vocal Analysis</div>
          <div class="chart-container">
            <svg width="320" height="240" class="line-chart">
              <!-- Background -->
              <rect width="100%" height="100%" fill="#f8fafc" stroke="#e5e7eb" stroke-width="2" rx="12"/>
              
              <!-- Title Background -->
              <rect x="0" y="0" width="100%" height="30" fill="#f1f5f9" rx="12"/>
              <text x="160" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#1f2937">Vocal Performance Metrics</text>
              
              ${(() => {
                const volumeScore = data.vocalMetrics?.volume_db ? Math.min(100, Math.max(0, data.vocalMetrics.volume_db + 60)) : 0;
                const pitchScore = data.vocalMetrics?.mean_pitch_hz ? Math.min(100, (data.vocalMetrics.mean_pitch_hz / 300) * 100) : 0;
                const paceScore = wpm > 0 ? Math.min(100, (wpm / 200) * 100) : 0;
                
                return `
                <!-- Circular progress indicators -->
                <g transform="translate(80, 130)">
                  <circle cx="0" cy="0" r="40" fill="none" stroke="#e5e7eb" stroke-width="8"/>
                  <circle cx="0" cy="0" r="40" fill="none" stroke="#3b82f6" stroke-width="8" 
                          stroke-dasharray="${(volumeScore / 100) * 251} 251" 
                          stroke-dashoffset="63" transform="rotate(-90)"/>
                  <text x="0" y="-8" text-anchor="middle" font-size="14" font-weight="bold" fill="#1f2937">${volumeScore.toFixed(0)}</text>
                  <text x="0" y="6" text-anchor="middle" font-size="10" font-weight="600" fill="#3b82f6">Volume</text>
                  <text x="0" y="18" text-anchor="middle" font-size="8" fill="#6b7280">Score</text>
                </g>
                
                <g transform="translate(160, 130)">
                  <circle cx="0" cy="0" r="40" fill="none" stroke="#e5e7eb" stroke-width="8"/>
                  <circle cx="0" cy="0" r="40" fill="none" stroke="#10b981" stroke-width="8" 
                          stroke-dasharray="${(pitchScore / 100) * 251} 251" 
                          stroke-dashoffset="63" transform="rotate(-90)"/>
                  <text x="0" y="-8" text-anchor="middle" font-size="14" font-weight="bold" fill="#1f2937">${pitchScore.toFixed(0)}</text>
                  <text x="0" y="6" text-anchor="middle" font-size="10" font-weight="600" fill="#10b981">Pitch</text>
                  <text x="0" y="18" text-anchor="middle" font-size="8" fill="#6b7280">Quality</text>
                </g>
                
                <g transform="translate(240, 130)">
                  <circle cx="0" cy="0" r="40" fill="none" stroke="#e5e7eb" stroke-width="8"/>
                  <circle cx="0" cy="0" r="40" fill="none" stroke="#f59e0b" stroke-width="8" 
                          stroke-dasharray="${(paceScore / 100) * 251} 251" 
                          stroke-dashoffset="63" transform="rotate(-90)"/>
                  <text x="0" y="-8" text-anchor="middle" font-size="14" font-weight="bold" fill="#1f2937">${wpm}</text>
                  <text x="0" y="6" text-anchor="middle" font-size="10" font-weight="600" fill="#f59e0b">WPM</text>
                  <text x="0" y="18" text-anchor="middle" font-size="8" fill="#6b7280">Pace</text>
                </g>`;
              })()}
            </svg>
          </div>
        </div>
        
        ${data.extended?.vocal_tone_top_areas && data.extended.vocal_tone_top_areas.length ? `
          <div class="content-box"><strong>Top Areas:</strong><br>${data.extended.vocal_tone_top_areas.map(a=>`<div class=\"list-item strength\">${a}</div>`).join('')}</div>` : ''}
        ${data.extended?.vocal_tone_improvement_areas && data.extended.vocal_tone_improvement_areas.length ? `
          <div class="content-box"><strong>Improvement Areas:</strong><br>${data.extended.vocal_tone_improvement_areas.map(a=>`<div class=\"list-item improvement\">${a}</div>`).join('')}</div>` : ''}
      </div>
      ` : ''}

      <!-- Body Language Analysis -->
      ${data.bodyLanguageMetrics || data.extended?.body_language_overall_score ? `
      <div class="section">
        <div class="section-title">🤝 Body Language Analysis</div>
        <div class="grid">
          <div class="card">
            <div class="card-label">Frames Analyzed</div>
            <div class="card-value">${data.bodyLanguageMetrics ? data.bodyLanguageMetrics.frames_processed : ''}</div>
          </div>
          ${data.bodyLanguageMetrics ? `
          <div class="card">
            <div class="card-label">Smiles Detected</div>
            <div class="card-value">${data.bodyLanguageMetrics.smiles}</div>
          </div>
          <div class="card">
            <div class="card-label">Eye Contact</div>
            <div class="card-value">${data.bodyLanguageMetrics.eye_contact}</div>
          </div>
          <div class="card">
            <div class="card-label">Hand Gestures</div>
            <div class="card-value">${data.bodyLanguageMetrics.hand_moves}</div>
          </div>` : ''}

          ${data.extended?.positive_facial_emotions ? `<div class="card"><div class="card-label">Positive Facial Emotions</div><div class="card-value">${data.extended.positive_facial_emotions}</div></div>` : ''}
          ${data.extended?.calm_percent ? `<div class="card"><div class="card-label">Calm</div><div class="card-value">${data.extended.calm_percent}</div></div>` : ''}
          ${typeof data.extended?.eye_contact_percent === 'number' ? `<div class="card"><div class="card-label">Eye Contact %</div><div class="card-value">${data.extended.eye_contact_percent}%</div></div>` : ''}
          ${typeof data.extended?.smile_count === 'number' ? `<div class="card"><div class="card-label">Smile Count</div><div class="card-value">${data.extended.smile_count}</div></div>` : ''}
          ${data.extended?.hands_used ? `<div class="card"><div class="card-label">Hands Used</div><div class="card-value">${data.extended.hands_used}</div></div>` : ''}
          ${data.extended?.weight_balanced_on_both_leg_percent ? `<div class="card"><div class="card-label">Weight Balanced</div><div class="card-value">${data.extended.weight_balanced_on_both_leg_percent}</div></div>` : ''}
          ${data.extended?.weight_on_one_leg_percent ? `<div class="card"><div class="card-label">Weight One Leg</div><div class="card-value">${data.extended.weight_on_one_leg_percent}</div></div>` : ''}
          ${typeof data.extended?.head_movement_percent === 'number' ? `<div class="card"><div class="card-label">Head Movement</div><div class="card-value">${data.extended.head_movement_percent}%</div></div>` : ''}
          ${typeof data.extended?.leg_movement_percent === 'number' ? `<div class="card"><div class="card-label">Leg Movement</div><div class="card-value">${data.extended.leg_movement_percent}%</div></div>` : ''}
          ${data.extended?.hands_crossed_percent ? `<div class="card"><div class="card-label">Hands Crossed</div><div class="card-value">${data.extended.hands_crossed_percent}</div></div>` : ''}
          ${data.extended?.wrist_closed_percent ? `<div class="card"><div class="card-label">Wrist Closed</div><div class="card-value">${data.extended.wrist_closed_percent}</div></div>` : ''}
          ${typeof data.extended?.anger_percent === 'number' ? `<div class="card"><div class="card-label">Anger</div><div class="card-value">${data.extended.anger_percent}%</div></div>` : ''}
          ${typeof data.extended?.confused_percent === 'number' ? `<div class="card"><div class="card-label">Confused</div><div class="card-value">${data.extended.confused_percent}%</div></div>` : ''}
          ${typeof data.extended?.fear_percent === 'number' ? `<div class="card"><div class="card-label">Fear</div><div class="card-value">${data.extended.fear_percent}%</div></div>` : ''}
          ${typeof data.extended?.sad_percent === 'number' ? `<div class="card"><div class="card-label">Sad</div><div class="card-value">${data.extended.sad_percent}%</div></div>` : ''}

          ${data.bodyLanguageMetrics?.head_moves ? `
          <div class="card">
            <div class="card-label">Head Movements</div>
            <div class="card-value">${data.bodyLanguageMetrics.head_moves}</div>
          </div>` : ''}

          ${typeof data.extended?.body_language_overall_score === 'number' ? `
          <div class="card">
            <div class="card-label">Overall Body Score</div>
            <div class="card-value">${data.extended.body_language_overall_score}/100</div>
          </div>` : ''}
        </div>
        
        <!-- Body Language Graph -->
        <div class="graph-card" style="margin: 20px 0;">
          <div class="graph-title">🎭 Body Language Analysis</div>
          <div class="chart-container">
            <svg width="320" height="240" class="bar-chart">
              <!-- Background grid -->
              <defs>
                <pattern id="grid" width="32" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 24" fill="none" stroke="#e5e7eb" stroke-width="1" opacity="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              <!-- Title Background -->
              <rect x="0" y="0" width="100%" height="30" fill="#f8fafc" opacity="0.8"/>
              <text x="160" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#1f2937">Body Language Metrics</text>
              
              <!-- Bars -->
              <rect x="50" y="${190 - (smilesPercent * 1.5)}" width="50" height="${smilesPercent * 1.5}" fill="#3b82f6" rx="6"/>
              <rect x="120" y="${190 - (eyeContactPercent * 1.5)}" width="50" height="${eyeContactPercent * 1.5}" fill="#10b981" rx="6"/>
              ${typeof data.extended?.head_movement_percent === 'number' ? `
              <rect x="190" y="${190 - (data.extended.head_movement_percent * 1.5)}" width="50" height="${data.extended.head_movement_percent * 1.5}" fill="#f59e0b" rx="6"/>` : ''}
              ${typeof data.extended?.leg_movement_percent === 'number' ? `
              <rect x="260" y="${190 - (data.extended.leg_movement_percent * 1.5)}" width="50" height="${data.extended.leg_movement_percent * 1.5}" fill="#ef4444" rx="6"/>` : ''}
              
              <!-- Labels -->
              <text x="75" y="210" text-anchor="middle" font-size="11" font-weight="600" fill="#374151">Smiles</text>
              <text x="145" y="210" text-anchor="middle" font-size="11" font-weight="600" fill="#374151">Eye Contact</text>
              ${typeof data.extended?.head_movement_percent === 'number' ? `
              <text x="215" y="210" text-anchor="middle" font-size="11" font-weight="600" fill="#374151">Head Mvmt</text>` : ''}
              ${typeof data.extended?.leg_movement_percent === 'number' ? `
              <text x="285" y="210" text-anchor="middle" font-size="11" font-weight="600" fill="#374151">Leg Mvmt</text>` : ''}
              
              <!-- Values -->
              <text x="75" y="${185 - (smilesPercent * 1.5)}" text-anchor="middle" font-size="10" font-weight="bold" fill="#fff">${smilesPercent.toFixed(0)}%</text>
              <text x="145" y="${185 - (eyeContactPercent * 1.5)}" text-anchor="middle" font-size="10" font-weight="bold" fill="#fff">${eyeContactPercent.toFixed(0)}%</text>
              ${typeof data.extended?.head_movement_percent === 'number' ? `
              <text x="215" y="${185 - (data.extended.head_movement_percent * 1.5)}" text-anchor="middle" font-size="10" font-weight="bold" fill="#fff">${data.extended.head_movement_percent}%</text>` : ''}
              ${typeof data.extended?.leg_movement_percent === 'number' ? `
              <text x="285" y="${185 - (data.extended.leg_movement_percent * 1.5)}" text-anchor="middle" font-size="10" font-weight="bold" fill="#fff">${data.extended.leg_movement_percent}%</text>` : ''}
              
              <!-- Y-axis labels -->
              <text x="20" y="195" font-size="10" font-weight="500" fill="#6b7280">0%</text>
              <text x="20" y="115" font-size="10" font-weight="500" fill="#6b7280">50%</text>
              <text x="20" y="40" font-size="10" font-weight="500" fill="#6b7280">100%</text>
            </svg>
          </div>
        </div>
        
        ${data.extended?.body_language_top_areas && data.extended.body_language_top_areas.length ? `
          <div class="content-box"><strong>Top Areas:</strong><br>${data.extended.body_language_top_areas.map(a=>`<div class=\"list-item strength\">${a}</div>`).join('')}</div>` : ''}
        ${data.extended?.body_language_improvement_areas && data.extended.body_language_improvement_areas.length ? `
          <div class="content-box"><strong>Improvement Areas:</strong><br>${data.extended.body_language_improvement_areas.map(a=>`<div class=\"list-item improvement\">${a}</div>`).join('')}</div>` : ''}
      </div>
      ` : ''}

      <!-- Content Analysis -->
      ${data.contentMetrics || data.extended ? `
      <div class="section">
        <div class="section-title">📝 Content Analysis</div>
        <div class="grid">
          ${data.contentMetrics && data.contentMetrics.word_count ? `
          <div class="card">
            <div class="card-label">Total Words</div>
            <div class="card-value">${data.contentMetrics.word_count}</div>
          </div>
          ` : ''}
          
          ${data.contentMetrics && data.contentMetrics.vocabulary_diversity ? `
          <div class="card">
            <div class="card-label">Vocabulary Diversity</div>
            <div class="card-value">${data.contentMetrics.vocabulary_diversity}%</div>
          </div>
          ` : ''}
          
          ${data.contentMetrics && data.contentMetrics.clarity_score ? `
          <div class="card">
            <div class="card-label">Clarity Score</div>
            <div class="card-value">${data.contentMetrics.clarity_score}%</div>
          </div>
          ` : ''}
          
          ${data.contentMetrics && data.contentMetrics.fluency_score ? `
          <div class="card">
            <div class="card-label">Fluency Score</div>
            <div class="card-value">${data.contentMetrics.fluency_score}%</div>
          </div>
          ` : ''}
          
          ${data.contentMetrics && data.contentMetrics.word_power_score ? `
          <div class="card">
            <div class="card-label">Word Power Score</div>
            <div class="card-value">${data.contentMetrics.word_power_score}/5</div>
          </div>
          ` : ''}
          
          ${data.contentMetrics && data.contentMetrics.word_power_percentage ? `
          <div class="card">
            <div class="card-label">Word Power Percentage</div>
            <div class="card-value">${data.contentMetrics.word_power_percentage}%</div>
          </div>
          ` : ''}

          ${data.extended?.text_sentiment ? `
          <div class="card">
            <div class="card-label">Text Sentiment</div>
            <div class="card-value">${data.extended.text_sentiment}${typeof data.extended.text_sentiment_percent === 'number' ? ` (${data.extended.text_sentiment_percent}%)` : ''}</div>
          </div>` : ''}

          ${typeof data.extended?.unique_words_count === 'number' ? `
          <div class="card">
            <div class="card-label">Unique Words</div>
            <div class="card-value">${data.extended.unique_words_count}</div>
          </div>` : ''}

          ${typeof data.extended?.i_usage_percent === 'number' ? `
          <div class="card">
            <div class="card-label">“I” Usage</div>
            <div class="card-value">${data.extended.i_usage_percent}%</div>
          </div>` : ''}

          ${typeof data.extended?.sentence_length_avg === 'number' ? `
          <div class="card">
            <div class="card-label">Sentence Length Avg</div>
            <div class="card-value">${data.extended.sentence_length_avg} wps</div>
          </div>` : ''}
        </div>
        
        <!-- Content Metrics Graph -->
        <div class="graph-card" style="margin: 20px 0;">
          <div class="graph-title">📝 Content Metrics</div>
          <div class="chart-container">
            <svg width="320" height="240" class="donut-chart">
              <!-- Background -->
              <rect width="100%" height="100%" fill="#f8fafc" stroke="#e5e7eb" stroke-width="2" rx="12"/>
              
              <!-- Title Background -->
              <rect x="0" y="0" width="100%" height="30" fill="#f1f5f9" rx="12"/>
              <text x="160" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#1f2937">Content Analysis Overview</text>
              
              ${(() => {
                const wordPowerScore = data.contentMetrics?.word_power_percentage || 0;
                const clarityScore = data.contentMetrics?.clarity_score || 0;
                const fluencyScore = data.contentMetrics?.fluency_score || 0;
                const vocabularyScore = data.contentMetrics?.vocabulary_diversity || 0;
                
                const radius = 65;
                const centerX = 160;
                const centerY = 130;
                
                // Calculate segments
                const total = wordPowerScore + clarityScore + fluencyScore + vocabularyScore || 1;
                const wordPowerAngle = (wordPowerScore / total) * 360;
                const clarityAngle = (clarityScore / total) * 360;
                const fluencyAngle = (fluencyScore / total) * 360;
                const vocabularyAngle = (vocabularyScore / total) * 360;
                
                let currentAngle = 0;
                
                const createArc = (startAngle: number, endAngle: number, color: string) => {
                  const start = (startAngle - 90) * Math.PI / 180;
                  const end = (endAngle - 90) * Math.PI / 180;
                  
                  const x1 = centerX + radius * Math.cos(start);
                  const y1 = centerY + radius * Math.sin(start);
                  const x2 = centerX + radius * Math.cos(end);
                  const y2 = centerY + radius * Math.sin(end);
                  
                  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                  
                  return `
                  <path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" 
                        fill="${color}" stroke="#fff" stroke-width="3" opacity="0.9"/>`;
                };
                
                let arcs = '';
                if (wordPowerScore > 0) {
                  arcs += createArc(currentAngle, currentAngle + wordPowerAngle, '#3b82f6');
                  currentAngle += wordPowerAngle;
                }
                if (clarityScore > 0) {
                  arcs += createArc(currentAngle, currentAngle + clarityAngle, '#10b981');
                  currentAngle += clarityAngle;
                }
                if (fluencyScore > 0) {
                  arcs += createArc(currentAngle, currentAngle + fluencyAngle, '#f59e0b');
                  currentAngle += fluencyAngle;
                }
                if (vocabularyScore > 0) {
                  arcs += createArc(currentAngle, currentAngle + vocabularyAngle, '#ef4444');
                }
                
                return `
                ${arcs}
                
                <!-- Center circle -->
                <circle cx="${centerX}" cy="${centerY}" r="30" fill="#fff" stroke="#e5e7eb" stroke-width="3"/>
                <text x="${centerX}" y="${centerY - 8}" text-anchor="middle" font-size="16" font-weight="bold" fill="#1f2937">${wordPowerScore}%</text>
                <text x="${centerX}" y="${centerY + 6}" text-anchor="middle" font-size="10" font-weight="600" fill="#3b82f6">Word Power</text>
                <text x="${centerX}" y="${centerY + 18}" text-anchor="middle" font-size="8" fill="#6b7280">Primary Score</text>
                
                <!-- Legend -->
                <g transform="translate(25, 45)">
                  <rect x="0" y="0" width="10" height="10" fill="#3b82f6" rx="2"/>
                  <text x="15" y="9" font-size="9" font-weight="500" fill="#374151">Word Power (${wordPowerScore}%)</text>
                  <rect x="0" y="18" width="10" height="10" fill="#10b981" rx="2"/>
                  <text x="15" y="27" font-size="9" font-weight="500" fill="#374151">Clarity (${clarityScore}%)</text>
                  <rect x="0" y="36" width="10" height="10" fill="#f59e0b" rx="2"/>
                  <text x="15" y="45" font-size="9" font-weight="500" fill="#374151">Fluency (${fluencyScore}%)</text>
                  <rect x="0" y="54" width="10" height="10" fill="#ef4444" rx="2"/>
                  <text x="15" y="63" font-size="9" font-weight="500" fill="#374151">Vocabulary (${vocabularyScore}%)</text>
                </g>`;
              })()}
            </svg>
          </div>
        </div>

        ${kwList.length ? `
        <div class="content-box">
          <strong>Keywords:</strong>
          ${kwList.map((k: any) => typeof k === 'string' ? `<div class=\"list-item\">${k}</div>` : `<div class=\"list-item\">${k.word}: ${k.count}</div>`).join('')}
        </div>` : ''}

        ${petList.length ? `
        <div class="content-box">
          <strong>Pet Words:</strong>
          ${petList.map((k: any) => typeof k === 'string' ? `<div class=\"list-item\">${k}</div>` : `<div class=\"list-item\">${k.word}: ${k.count}</div>`).join('')}
        </div>` : ''}

        ${fillerList.length ? `
        <div class="content-box">
          <strong>Filler Words:</strong>
          ${fillerList.map((k: any) => typeof k === 'string' ? `<div class=\"list-item\">${k}</div>` : `<div class=\"list-item\">${k.word}: ${k.count}${k.percentage ? ` (${k.percentage}%)` : ''}</div>`).join('')}
        </div>` : ''}

        ${data.extended?.word_power_top_areas && data.extended.word_power_top_areas.length ? `
          <div class="content-box"><strong>Word Power - Top Areas:</strong><br>${data.extended.word_power_top_areas.map(a=>`<div class=\"list-item strength\">${a}</div>`).join('')}</div>` : ''}
        ${data.extended?.word_power_improvement_areas && data.extended.word_power_improvement_areas.length ? `
          <div class="content-box"><strong>Word Power - Improvement Areas:</strong><br>${data.extended.word_power_improvement_areas.map(a=>`<div class=\"list-item improvement\">${a}</div>`).join('')}</div>` : ''}
      </div>
      ` : ''}

      <!-- Summary -->
      ${data.summary ? `
      <div class="section">
        <div class="section-title">📋 Summary</div>
        <div class="content-box">
          ${data.summary}
        </div>
      </div>
      ` : ''}

      <!-- Keywords -->
      ${data.keywords ? `
      <div class="section">
        <div class="section-title">🔑 Key Topics</div>
        <div class="content-box">
          ${data.keywords}
        </div>
      </div>
      ` : ''}

      <!-- Transcript -->
      ${data.transcript ? `
      <div class="section">
        <div class="section-title">📜 Transcript</div>
        <div class="transcript">${data.transcript}</div>
      </div>
      ` : ''}

      <!-- Footer -->
      <div class="footer">
        <div><strong>U-Speak Pro</strong> - Video Analysis Platform</div>
        <div>Report generated automatically from video analysis data</div>
        ${data.userInfo?.email ? `<div>Contact: ${data.userInfo.email}</div>` : ''}
      </div>
    </body>
    </html>
  `;

  console.log('✅ HTML generation completed, length:', html.length);
  return html;
}

// Main export function - clean and simple
export async function downloadVideoReportPDF(
  analysisData: any,
  poseData: any,
  userData?: any
): Promise<void> {
  try {
    console.log('🚀 PDF Export Started');
    console.log('📊 analysisData:', analysisData);
    console.log('🎭 poseData:', poseData);
    console.log('👤 userData:', userData);

    // Validate we have actual data to export
    if (!analysisData && !poseData) {
      console.error('❌ No data available for PDF export');
      throw new Error('No analysis data available for PDF export');
    }

    console.log('📦 Loading html2pdf library...');
    
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('PDF export can only be used in the browser');
    }
    
    // Dynamic import of html2pdf for browser compatibility
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;
    console.log('✅ html2pdf loaded:', typeof html2pdf);
    
    // Transform data to simplified format - only include real values
    // Derive 5-scale strings for top pills when not provided
    const deriveBodyFiveStr = () => {
      const smiles = analysisData?.smiles || poseData?.smiles;
      const eye = analysisData?.eye_contact || poseData?.eye_contact;
      if (!smiles && !eye) return undefined;
      const s = smiles ? extractPercentage(smiles) : 0;
      const e = eye ? extractPercentage(eye) : 0;
      if (s === 0 && e === 0) return undefined;
      const smileScore = Math.min(100, s * 3);
      const avg = (smileScore + e) / 2;
      return `${(avg / 20).toFixed(1)} / 5`;
    };

    const deriveVocalFiveStr = () => {
      const audio = poseData?.audio;
      if (!audio) return undefined;
      let s100 = 65;
      if (typeof audio.volume_db === 'number') {
        if (audio.volume_db > -12) s100 += 10; else if (audio.volume_db < -22) s100 -= 10;
      }
      const words = analysisData?.content_assessment?.word_count;
      if (typeof words === 'number' && typeof audio.spoken_duration_sec === 'number' && audio.spoken_duration_sec > 0) {
        const wpmLocal = Math.round((words / audio.spoken_duration_sec) * 60);
        if (wpmLocal >= 120 && wpmLocal <= 160) s100 += 10; else if (wpmLocal < 100 || wpmLocal > 180) s100 -= 10;
      }
      if (typeof audio.num_pauses === 'number') {
        if (audio.num_pauses >= 2 && audio.num_pauses <= 10) s100 += 5;
        if (audio.num_pauses > 15) s100 -= 10;
      }
      s100 = Math.max(0, Math.min(100, s100));
      return `${(s100 / 20).toFixed(1)} / 5`;
    };

    const reportData: SimplifiedReportData = {
      videoInfo: {
        filename: analysisData?.filename || 'Unknown Video',
        duration: analysisData?.duration || 'Unknown',
        file_size: analysisData?.file_size || 'Unknown',
        language: analysisData?.language || 'Unknown'
      },
      contentMetrics: analysisData?.content_assessment && Object.keys(analysisData.content_assessment).length > 0 ? {
        word_power_score: analysisData.content_assessment.word_power_score,
        word_power_percentage: analysisData.content_assessment.word_power_percentage,
        clarity_score: analysisData.content_assessment.clarity_score,
        fluency_score: analysisData.content_assessment.fluency_score,
        word_count: analysisData.content_assessment.word_count,
        vocabulary_diversity: analysisData.content_assessment.vocabulary_diversity
      } : undefined,
      vocalMetrics: poseData?.audio && Object.keys(poseData.audio).length > 0 ? {
        volume_db: poseData.audio.volume_db,
        mean_pitch_hz: poseData.audio.mean_pitch_hz,
        pitch_range: poseData.audio.pitch_range,
        num_pauses: poseData.audio.num_pauses,
        spoken_duration_sec: poseData.audio.spoken_duration_sec,
        duration_sec: poseData.audio.duration_sec
      } : undefined,
      bodyLanguageMetrics: poseData && (poseData.frames_processed > 0 || poseData.smiles || poseData.eye_contact) ? {
        frames_processed: poseData.frames_processed || 0,
        smiles: poseData.smiles || '0 (0%)',
        eye_contact: poseData.eye_contact || '0 (0%)',
        hand_moves: poseData.hand_moves || '0 (0%)',
        head_moves: poseData.head_moves || '0 (0%)'
      } : undefined,
      userInfo: userData && (userData.name || userData.email) ? {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        accountId: userData.accountId,
        userId: userData.userId
      } : undefined,
      transcript: analysisData?.corrected_transcript || analysisData?.original_transcript,
      summary: analysisData?.summary,
      keywords: analysisData?.keywords,
      extended: {
        video_type: analysisData?.video_type,
        talking_to: analysisData?.talking_to,
        hands_legs_visible: analysisData?.hands_legs_visible,
        created_date: analysisData?.created_date,
        created_time: analysisData?.created_time,
        upload_id: analysisData?.uploadId || analysisData?.upload_id,
        account_id: analysisData?.accountId || analysisData?.account_id || userData?.accountId,
        user_id: analysisData?.userId || analysisData?.user_id || userData?.userId,

        overall_performance_score: analysisData?.overall_performance_score,
        body_language_score: analysisData?.body_language_score ?? deriveBodyFiveStr(),
        vocal_tone_score: analysisData?.vocal_tone_score ?? deriveVocalFiveStr(),
        // Ensure top pill shows Word Power if only percentage is available
        word_power_score: analysisData?.word_power_score ?? (
          analysisData?.content_assessment?.word_power_percentage != null
            ? `${(analysisData.content_assessment.word_power_percentage / 20).toFixed(1)} / 5`
            : undefined
        ),

        body_language_overall_score: analysisData?.body_language_overall_score,
        positive_facial_emotions: analysisData?.positive_facial_emotions,
        calm_percent: analysisData?.calm_percent,
        eye_contact_percent: analysisData?.eye_contact_percent,
        smile_count: analysisData?.smile_count,
        hands_used: analysisData?.hands_used,
        weight_balanced_on_both_leg_percent: analysisData?.weight_balanced_on_both_leg_percent,
        weight_on_one_leg_percent: analysisData?.weight_on_one_leg_percent,
        head_movement_percent: analysisData?.head_movement_percent,
        leg_movement_percent: analysisData?.leg_movement_percent,
        hands_crossed_percent: analysisData?.hands_crossed_percent,
        wrist_closed_percent: analysisData?.wrist_closed_percent,
        anger_percent: analysisData?.anger_percent,
        confused_percent: analysisData?.confused_percent,
        fear_percent: analysisData?.fear_percent,
        sad_percent: analysisData?.sad_percent,
        body_language_top_areas: analysisData?.body_language_top_areas,
        body_language_improvement_areas: analysisData?.body_language_improvement_areas,

        vocal_tone_overall_score: analysisData?.vocal_tone_overall_score,
        rate_of_speech: analysisData?.rate_of_speech,
        modulation_level: analysisData?.modulation_level,
        average_pitch: analysisData?.average_pitch,
        average_volume: analysisData?.average_volume,
        vocal_tone_top_areas: analysisData?.vocal_tone_top_areas,
        vocal_tone_improvement_areas: analysisData?.vocal_tone_improvement_areas,

        word_power_overall_score: analysisData?.word_power_overall_score,
        text_sentiment: analysisData?.text_sentiment,
        text_sentiment_percent: analysisData?.text_sentiment_percent,
        unique_words_count: analysisData?.unique_words_count,
        i_usage_percent: analysisData?.i_usage_percent,
        sentence_length_avg: analysisData?.sentence_length_avg,
        keywords_list: analysisData?.keywords_list || analysisData?.keywords,
        pet_words: analysisData?.pet_words,
        filler_words_list: analysisData?.filler_words_list || analysisData?.filler_words,
        word_power_top_areas: analysisData?.word_power_top_areas,
        word_power_improvement_areas: analysisData?.word_power_improvement_areas
      }
    };

    console.log('📋 Report data prepared:', reportData);
    console.log('🔍 Content metrics exists:', !!reportData.contentMetrics);
    console.log('🔍 Vocal metrics exists:', !!reportData.vocalMetrics);
    console.log('🔍 Body language metrics exists:', !!reportData.bodyLanguageMetrics);
    console.log('🔍 User info exists:', !!reportData.userInfo);
    console.log('🔍 Transcript exists:', !!reportData.transcript);

    // Generate HTML content
    console.log('🏗️ Generating HTML content...');
    const htmlContent = generatePDFHTML(reportData);
    console.log('📄 HTML content length:', htmlContent.length);
    console.log('📄 HTML preview (first 500 chars):', htmlContent.substring(0, 500));

    // Configure html2pdf options
    const options = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `video-analysis-${reportData.videoInfo.filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}.pdf`,
      image: { 
        type: 'jpeg', 
        quality: 0.98 
      },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true
      },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: 'portrait'
      }
    };

    console.log('🔄 Starting PDF generation (string input)...', { htmlLength: htmlContent.length, options });

    // Generate and download PDF using the HTML string to avoid DOM interference
    await html2pdf()
      .set(options)
      .from(htmlContent)
      .save();
        console.log('💾 PDF downloaded successfully');
    console.log('💾 Save completed');

    // No DOM cleanup needed when using string input

    console.log('✅ PDF generated and downloaded successfully');

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available');
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
    
    // Clean up element if it exists
    try {
      const existingElement = document.querySelector('div[style*="position: absolute"]');
      if (existingElement) {
        document.body.removeChild(existingElement);
        console.log('🧹 Emergency cleanup completed');
      }
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup failed:', cleanupError);
    }
    
    alert(`Failed to generate PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

// Simple export function for the "Export PDF" button
export async function exportToPDF(
  analysisData: any,
  poseData: any,
  userData?: any
): Promise<void> {
  await downloadVideoReportPDF(analysisData, poseData, userData);
}

export default downloadVideoReportPDF;
