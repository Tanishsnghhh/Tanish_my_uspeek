/**
 * Server-side PDF Generator using jsPDF
 * Generates PDF reports directly from data without DOM manipulation
 */

import { jsPDF } from 'jspdf';

// Type definitions
// Type definitions
interface ComprehensiveAnalysisReport {
  analysisData: {
    filename: string;
    file_size: string;
    language: string;
    duration: string;
    upload_date?: string;
    speaker?: string;
    original_transcript: string;
    corrected_transcript: string;
    summary: string;
    keywords: string;
    content_assessment?: {
      word_power_score: number;
      word_power_percentage: number;
      overall_strength: number | string;
      strength_level: string;
      strength_description: string;
      top_strength: string;
      vocabulary_diversity: number;
      clarity_score: number;
      fluency_score: number;
      word_count: number;
      avg_words_per_sentence: number;
      sentence_count: number;
    };
    sentiment_analysis?: any;
    emotion_analysis?: any;
    confidence_analysis?: any;
    repeated_words?: any;
    filler_words?: any;
    strengths_improvements?: any;
  };
  vocalData?: {
    audio?: {
      duration_sec: number;
      volume_db: number;
      mean_pitch_hz: number;
      pitch_range: string;
      num_pauses: number;
      spoken_duration_sec: number;
    };
    overallScore: number;
    scoreOutOfFive?: number;
    verdict: string;
    pace?: { wordsPerMinute: number; assessment: string };
    clarity?: { score: number; assessment: string };
    quality?: { energy: string; modulation: number; projection: string };
    strengths: string[];
    improvements: string[];
  };
  bodyLanguageData?: {
    frames_processed: number;
    smiles: string;
    head_moves: string;
    hand_moves: string;
    eye_contact: string;
    leg_moves: string;
    foot_moves: string;
    overallScore: number;
    scoreOutOfFive?: number;
    processingDuration?: number | string;
    positive_facial_emotions?: string;
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
  };
  coachingData?: {
    summary: string;
    bodyLanguageAnalysis: string;
    vocalAnalysis: string;
    recommendations: string;
    practiceExercises: string[];
    quickWins: string[];
  };
  userData?: {
    name: string;
    email?: string;
    role?: string;
    department?: string;
    employeeId?: string;
    position?: string;
  };
}

export class ServerSidePDFGenerator {
  private generateHTML(report: ComprehensiveAnalysisReport): string {
    const overallScore = this.calculateOverallScore(report);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Video Analysis Report</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            font-size: 12px;
          }

          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
          }

          .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
          }

          .header .subtitle {
            font-size: 14px;
            opacity: 0.9;
          }

          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20px;
          }

          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }

          .section-header {
            background: #f8f9fa;
            padding: 15px 20px;
            border-left: 4px solid #667eea;
            margin-bottom: 20px;
            border-radius: 0 8px 8px 0;
          }

          .section-header h2 {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
          }

          .section-header .emoji {
            font-size: 20px;
            margin-right: 10px;
          }

          .score-card {
            background: #667eea;
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }

          .score-card .score {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 5px;
          }

          .score-card .label {
            font-size: 14px;
            opacity: 0.9;
          }

          .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
          }

          .metric-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
          }

          .metric-card .label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }

          .metric-card .value {
            font-size: 16px;
            font-weight: 600;
            color: #333;
          }

          .metric-card .sub-value {
            font-size: 10px;
            color: #888;
            margin-top: 2px;
          }

          .progress-bar {
            background: #e9ecef;
            border-radius: 10px;
            height: 8px;
            margin: 8px 0;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 10px;
            transition: width 0.3s ease;
          }

          .list-section {
            margin: 15px 0;
          }

          .list-section h3 {
            font-size: 14px;
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 2px solid #667eea;
          }

          .list-item {
            background: #f8f9fa;
            padding: 8px 12px;
            margin: 5px 0;
            border-radius: 6px;
            border-left: 3px solid #667eea;
          }

          .strengths-list {
            background: #d4edda;
            border-left-color: #28a745;
          }

          .improvements-list {
            background: #f8d7da;
            border-left-color: #dc3545;
          }

          .transcript-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #e9ecef;
          }

          .transcript-section h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #333;
          }

          .transcript-text {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.5;
            color: #555;
            background: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #dee2e6;
            max-height: 200px;
            overflow-y: auto;
          }

          .footer {
            text-align: center;
            padding: 30px 20px;
            color: #666;
            font-size: 10px;
            border-top: 1px solid #e9ecef;
            margin-top: 40px;
          }

          .footer .logo {
            font-weight: 600;
            color: #667eea;
            margin-bottom: 5px;
          }

          @media print {
            body {
              font-size: 11px;
            }

            .container {
              max-width: none;
              padding: 0 15px;
            }

            .section {
              page-break-inside: avoid;
              margin-bottom: 20px;
            }
          }

          .emotion-scores {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
            margin-top: 10px;
          }

          .emotion-item {
            background: #f8f9fa;
            padding: 8px;
            border-radius: 6px;
            text-align: center;
          }

          .emotion-item .emotion {
            font-weight: 600;
            color: #333;
          }

          .emotion-item .score {
            color: #667eea;
            font-size: 14px;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎬 Video Analysis Report</h1>
          <div class="subtitle">Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
          ${report.userData?.name ? `<div class="subtitle">Prepared for: ${report.userData.name}</div>` : ''}
        </div>

        <div class="container">
          <!-- Overall Performance Score -->
          <div class="score-card">
            <div class="score">${overallScore}/100</div>
            <div class="label">Overall Performance Score</div>
          </div>

          <!-- Video Information -->
          <div class="section">
            <div class="section-header">
              <h2><span class="emoji">📹</span>Video Information</h2>
            </div>
            <div class="metric-grid">
              <div class="metric-card">
                <div class="label">Filename</div>
                <div class="value">${report.analysisData.filename}</div>
              </div>
              <div class="metric-card">
                <div class="label">Duration</div>
                <div class="value">${report.analysisData.duration}</div>
              </div>
              <div class="metric-card">
                <div class="label">File Size</div>
                <div class="value">${report.analysisData.file_size}</div>
              </div>
              <div class="metric-card">
                <div class="label">Language</div>
                <div class="value">${report.analysisData.language}</div>
              </div>
              ${report.analysisData.upload_date ? `
              <div class="metric-card">
                <div class="label">Upload Date</div>
                <div class="value">${new Date(report.analysisData.upload_date).toLocaleDateString()}</div>
              </div>
              ` : ''}
              ${report.analysisData.speaker ? `
              <div class="metric-card">
                <div class="label">Speaker</div>
                <div class="value">${report.analysisData.speaker}</div>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Content Assessment -->
          ${report.analysisData.content_assessment ? `
          <div class="section">
            <div class="section-header">
              <h2><span class="emoji">📈</span>Content Assessment</h2>
            </div>
            <div class="metric-grid">
              <div class="metric-card">
                <div class="label">Word Power</div>
                <div class="value">${report.analysisData.content_assessment.word_power_percentage}%</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${report.analysisData.content_assessment.word_power_percentage}%"></div>
                </div>
              </div>
              <div class="metric-card">
                <div class="label">Vocabulary Diversity</div>
                <div class="value">${report.analysisData.content_assessment.vocabulary_diversity}%</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${report.analysisData.content_assessment.vocabulary_diversity}%"></div>
                </div>
              </div>
              <div class="metric-card">
                <div class="label">Clarity Score</div>
                <div class="value">${report.analysisData.content_assessment.clarity_score}%</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${report.analysisData.content_assessment.clarity_score}%"></div>
                </div>
              </div>
              <div class="metric-card">
                <div class="label">Fluency Score</div>
                <div class="value">${report.analysisData.content_assessment.fluency_score}%</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${report.analysisData.content_assessment.fluency_score}%"></div>
                </div>
              </div>
              <div class="metric-card">
                <div class="label">Total Words</div>
                <div class="value">${report.analysisData.content_assessment.word_count}</div>
              </div>
              <div class="metric-card">
                <div class="label">Avg Words/Sentence</div>
                <div class="value">${report.analysisData.content_assessment.avg_words_per_sentence.toFixed(1)}</div>
              </div>
              ${report.analysisData.content_assessment.strength_level ? `
              <div class="metric-card">
                <div class="label">Strength Level</div>
                <div class="value">${report.analysisData.content_assessment.strength_level}</div>
              </div>
              ` : ''}
              ${report.analysisData.content_assessment.top_strength ? `
              <div class="metric-card">
                <div class="label">Top Strength</div>
                <div class="value">${report.analysisData.content_assessment.top_strength}</div>
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          <!-- Vocal Analysis -->
          ${report.vocalData ? `
          <div class="section">
            <div class="section-header">
              <h2><span class="emoji">🎤</span>Vocal Analysis</h2>
            </div>
            <div class="metric-grid">
              <div class="metric-card">
                <div class="label">Overall Score</div>
                <div class="value">${report.vocalData.overallScore}/100</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${report.vocalData.overallScore}%"></div>
                </div>
              </div>
              <div class="metric-card">
                <div class="label">Verdict</div>
                <div class="value">${report.vocalData.verdict}</div>
              </div>
              <div class="metric-card">
                <div class="label">Volume</div>
                <div class="value">${report.vocalData.audio ? `${report.vocalData.audio.volume_db.toFixed(1)} dB` : 'N/A'}</div>
              </div>
              <div class="metric-card">
                <div class="label">Pitch</div>
                <div class="value">${report.vocalData.audio ? `${report.vocalData.audio.mean_pitch_hz.toFixed(0)} Hz` : 'N/A'}</div>
              </div>
              <div class="metric-card">
                <div class="label">Pitch Range</div>
                <div class="value">${report.vocalData.audio ? report.vocalData.audio.pitch_range : 'N/A'}</div>
              </div>
              <div class="metric-card">
                <div class="label">Speaking Pace</div>
                <div class="value">${report.vocalData.pace ? `${report.vocalData.pace.wordsPerMinute} WPM` : 'N/A'}</div>
                <div class="sub-value">${report.vocalData.pace ? report.vocalData.pace.assessment : 'N/A'}</div>
              </div>
              <div class="metric-card">
                <div class="label">Clarity Score</div>
                <div class="value">${report.vocalData.clarity ? `${report.vocalData.clarity.score}/100` : 'N/A'}</div>
                <div class="sub-value">${report.vocalData.clarity ? report.vocalData.clarity.assessment : 'N/A'}</div>
              </div>
              <div class="metric-card">
                <div class="label">Energy Level</div>
                <div class="value">${report.vocalData.quality ? report.vocalData.quality.energy : 'N/A'}</div>
              </div>
              <div class="metric-card">
                <div class="label">Modulation</div>
                <div class="value">${report.vocalData.quality ? `${report.vocalData.quality.modulation}%` : 'N/A'}</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${report.vocalData.quality ? `${report.vocalData.quality.modulation}%` : '0%'}"></div>
                </div>
              </div>
              <div class="metric-card">
                <div class="label">Projection</div>
                <div class="value">${report.vocalData.quality ? report.vocalData.quality.projection : 'N/A'}</div>
              </div>
              <div class="metric-card">
                <div class="label">Pauses</div>
                <div class="value">${report.vocalData.audio ? report.vocalData.audio.num_pauses : 0}</div>
              </div>
            </div>

            ${report.vocalData.strengths && report.vocalData.strengths.length > 0 ? `
            <div class="list-section">
              <h3>🎯 Strengths</h3>
              ${report.vocalData.strengths.map(strength => `<div class="list-item strengths-list">• ${strength}</div>`).join('')}
            </div>
            ` : ''}

            ${report.vocalData.improvements && report.vocalData.improvements.length > 0 ? `
            <div class="list-section">
              <h3>📈 Areas for Improvement</h3>
              ${report.vocalData.improvements.map(improvement => `<div class="list-item improvements-list">• ${improvement}</div>`).join('')}
            </div>
            ` : ''}
          </div>
          ` : ''}

          <!-- Body Language -->
          ${report.bodyLanguageData ? `
          <div class="section">
            <div class="section-header">
              <h2><span class="emoji">🤝</span>Body Language</h2>
            </div>
            <div class="metric-grid">
              <div class="metric-card">
                <div class="label">Overall Score</div>
                <div class="value">${report.bodyLanguageData.overallScore}/100</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${report.bodyLanguageData.overallScore}%"></div>
                </div>
              </div>
              <div class="metric-card">
                <div class="label">Frames Processed</div>
                <div class="value">${report.bodyLanguageData.frames_processed}</div>
              </div>
              <div class="metric-card">
                <div class="label">Processing Duration</div>
                <div class="value">${report.bodyLanguageData.processingDuration || 'N/A'}</div>
              </div>
              <div class="metric-card">
                <div class="label">Positive Expressions</div>
                <div class="value">${report.bodyLanguageData.smiles}</div>
              </div>
              <div class="metric-card">
                <div class="label">Eye Contact</div>
                <div class="value">${report.bodyLanguageData.eye_contact}</div>
              </div>
              <div class="metric-card">
                <div class="label">Hand Gestures</div>
                <div class="value">${report.bodyLanguageData.hand_moves}</div>
              </div>
              <div class="metric-card">
                <div class="label">Head Movement</div>
                <div class="value">${report.bodyLanguageData.head_moves}</div>
              </div>
              <div class="metric-card">
                <div class="label">Leg Movement</div>
                <div class="value">${report.bodyLanguageData.leg_moves}</div>
              </div>
              <div class="metric-card">
                <div class="label">Foot Movement</div>
                <div class="value">${report.bodyLanguageData.foot_moves}</div>
              </div>

              ${report.bodyLanguageData.positive_facial_emotions ? `
              <div class="metric-card">
                <div class="label">Positive Facial Emotions</div>
                <div class="value">${report.bodyLanguageData.positive_facial_emotions}</div>
              </div>
              ` : ''}

              ${report.bodyLanguageData.eye_contact_percent !== undefined ? `
              <div class="metric-card">
                <div class="label">Eye Contact %</div>
                <div class="value">${report.bodyLanguageData.eye_contact_percent}%</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${report.bodyLanguageData.eye_contact_percent}%"></div>
                </div>
              </div>
              ` : ''}

              ${report.bodyLanguageData.smile_count !== undefined ? `
              <div class="metric-card">
                <div class="label">Smile Count</div>
                <div class="value">${report.bodyLanguageData.smile_count}</div>
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          <!-- Sentiment Analysis -->
          ${report.analysisData.sentiment_analysis ? `
          <div class="section">
            <div class="section-header">
              <h2><span class="emoji">😊</span>Sentiment Analysis</h2>
            </div>
            <div class="metric-grid">
              <div class="metric-card">
                <div class="label">Overall Sentiment</div>
                <div class="value">${report.analysisData.sentiment_analysis.overall_sentiment || 'N/A'}</div>
              </div>
              <div class="metric-card">
                <div class="label">Confidence</div>
                <div class="value">${report.analysisData.sentiment_analysis.confidence ? `${report.analysisData.sentiment_analysis.confidence}%` : 'N/A'}</div>
                ${report.analysisData.sentiment_analysis.confidence ? `
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${report.analysisData.sentiment_analysis.confidence}%"></div>
                </div>
                ` : ''}
              </div>
              <div class="metric-card">
                <div class="label">Positive Score</div>
                <div class="value">${report.analysisData.sentiment_analysis.positive_score || 0}%</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${report.analysisData.sentiment_analysis.positive_score || 0}%"></div>
                </div>
              </div>
              <div class="metric-card">
                <div class="label">Negative Score</div>
                <div class="value">${report.analysisData.sentiment_analysis.negative_score || 0}%</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${report.analysisData.sentiment_analysis.negative_score || 0}%"></div>
                </div>
              </div>
              <div class="metric-card">
                <div class="label">Neutral Score</div>
                <div class="value">${report.analysisData.sentiment_analysis.neutral_score || 0}%</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${report.analysisData.sentiment_analysis.neutral_score || 0}%"></div>
                </div>
              </div>
              ${report.analysisData.sentiment_analysis.label ? `
              <div class="metric-card">
                <div class="label">Label</div>
                <div class="value">${report.analysisData.sentiment_analysis.label}</div>
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          <!-- Emotion Analysis -->
          ${report.analysisData.emotion_analysis ? `
          <div class="section">
            <div class="section-header">
              <h2><span class="emoji">🎭</span>Emotion Analysis</h2>
            </div>
            <div class="metric-grid">
              <div class="metric-card">
                <div class="label">Dominant Emotion</div>
                <div class="value">${report.analysisData.emotion_analysis.dominant_emotion || 'N/A'}</div>
              </div>
              <div class="metric-card">
                <div class="label">Confidence</div>
                <div class="value">${report.analysisData.emotion_analysis.confidence ? `${report.analysisData.emotion_analysis.confidence}%` : 'N/A'}</div>
                ${report.analysisData.emotion_analysis.confidence ? `
                <div class="progress-fill" style="width: ${report.analysisData.emotion_analysis.confidence}%"></div>
                </div>
                ` : ''}
              </div>
            </div>

            ${report.analysisData.emotion_analysis.emotion_scores ? `
            <div class="emotion-scores">
              ${Object.entries(report.analysisData.emotion_analysis.emotion_scores).map(([emotion, score]) => `
                <div class="emotion-item">
                  <div class="emotion">${emotion}</div>
                  <div class="score">${score}%</div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${report.analysisData.emotion_analysis.detected_keywords && report.analysisData.emotion_analysis.detected_keywords.length > 0 ? `
            <div class="list-section">
              <h3>🔍 Detected Keywords</h3>
              <div class="list-item">${report.analysisData.emotion_analysis.detected_keywords.join(', ')}</div>
            </div>
            ` : ''}
          </div>
          ` : ''}

          <!-- Confidence Analysis -->
          ${report.analysisData.confidence_analysis ? `
          <div class="section">
            <div class="section-header">
              <h2><span class="emoji">💪</span>Confidence Analysis</h2>
            </div>
            <div class="metric-grid">
              <div class="metric-card">
                <div class="label">Overall Confidence</div>
                <div class="value">${report.analysisData.confidence_analysis.overall_confidence || 'N/A'}</div>
              </div>
              <div class="metric-card">
                <div class="label">Confidence Level</div>
                <div class="value">${report.analysisData.confidence_analysis.confidence_level || 'N/A'}</div>
              </div>
              <div class="metric-card">
                <div class="label">Confidence Score</div>
                <div class="value">${report.analysisData.confidence_analysis.confidence_score}%</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${report.analysisData.confidence_analysis.confidence_score}%"></div>
                </div>
              </div>
              <div class="metric-card">
                <div class="label">Engagement Level</div>
                <div class="value">${report.analysisData.confidence_analysis.engagement_level || 'N/A'}</div>
              </div>
              <div class="metric-card">
                <div class="label">Engagement Score</div>
                <div class="value">${report.analysisData.confidence_analysis.engagement_score}%</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${report.analysisData.confidence_analysis.engagement_score}%"></div>
                </div>
              </div>
              <div class="metric-card">
                <div class="label">Nervousness Level</div>
                <div class="value">${report.analysisData.confidence_analysis.nervousness_level || 'N/A'}</div>
              </div>
              <div class="metric-card">
                <div class="label">Nervousness Score</div>
                <div class="value">${report.analysisData.confidence_analysis.nervousness_score}%</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${report.analysisData.confidence_analysis.nervousness_score}%"></div>
                </div>
              </div>
              <div class="metric-card">
                <div class="label">Positive Indicators</div>
                <div class="value">${report.analysisData.confidence_analysis.positive_indicators}</div>
              </div>
              <div class="metric-card">
                <div class="label">Negative Indicators</div>
                <div class="value">${report.analysisData.confidence_analysis.negative_indicators}</div>
              </div>
              <div class="metric-card">
                <div class="label">Confidence Ratio</div>
                <div class="value">${report.analysisData.confidence_analysis.confidence_ratio}%</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${report.analysisData.confidence_analysis.confidence_ratio}%"></div>
                </div>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Word Analysis -->
          ${(report.analysisData.repeated_words && report.analysisData.repeated_words.length > 0) ||
           (report.analysisData.filler_words && report.analysisData.filler_words.length > 0) ? `
          <div class="section">
            <div class="section-header">
              <h2><span class="emoji">📝</span>Word Analysis</h2>
            </div>

            ${report.analysisData.repeated_words && report.analysisData.repeated_words.length > 0 ? `
            <div class="list-section">
              <h3>🔄 Repeated Words</h3>
              ${report.analysisData.repeated_words.slice(0, 5).map((word: any) =>
                `<div class="list-item">• ${word.word || word}: ${word.count || 0} times</div>`
              ).join('')}
            </div>
            ` : ''}

            ${report.analysisData.filler_words && report.analysisData.filler_words.length > 0 ? `
            <div class="list-section">
              <h3>🗣️ Filler Words</h3>
              ${report.analysisData.filler_words.slice(0, 5).map((word: any) =>
                `<div class="list-item">• ${word.word || word}: ${word.percentage || 0}%</div>`
              ).join('')}
            </div>
            ` : ''}
          </div>
          ` : ''}

          <!-- Overall Strengths & Improvements -->
          ${report.analysisData.strengths_improvements ? `
          <div class="section">
            <div class="section-header">
              <h2><span class="emoji">🎯</span>Overall Strengths & Improvements</h2>
            </div>

            ${report.analysisData.strengths_improvements.strengths && report.analysisData.strengths_improvements.strengths.length > 0 ? `
            <div class="list-section">
              <h3>✅ Strengths</h3>
              ${report.analysisData.strengths_improvements.strengths.map((strength: string) =>
                `<div class="list-item strengths-list">• ${strength}</div>`
              ).join('')}
            </div>
            ` : ''}

            ${report.analysisData.strengths_improvements.improvements && report.analysisData.strengths_improvements.improvements.length > 0 ? `
            <div class="list-section">
              <h3>📈 Areas for Improvement</h3>
              ${report.analysisData.strengths_improvements.improvements.map((improvement: string) =>
                `<div class="list-item improvements-list">• ${improvement}</div>`
              ).join('')}
            </div>
            ` : ''}
          </div>
          ` : ''}

          <!-- Coaching Feedback -->
          ${report.coachingData ? `
          <div class="section">
            <div class="section-header">
              <h2><span class="emoji">🎓</span>Coaching Feedback</h2>
            </div>

            ${report.coachingData.summary ? `
            <div class="list-section">
              <h3>📋 Summary</h3>
              <div class="list-item">${report.coachingData.summary}</div>
            </div>
            ` : ''}

            ${report.coachingData.bodyLanguageAnalysis ? `
            <div class="list-section">
              <h3>🤝 Body Language Analysis</h3>
              <div class="list-item">${report.coachingData.bodyLanguageAnalysis}</div>
            </div>
            ` : ''}

            ${report.coachingData.vocalAnalysis ? `
            <div class="list-section">
              <h3>🎤 Vocal Analysis</h3>
              <div class="list-item">${report.coachingData.vocalAnalysis}</div>
            </div>
            ` : ''}

            ${report.coachingData.recommendations ? `
            <div class="list-section">
              <h3>💡 Recommendations</h3>
              <div class="list-item">${report.coachingData.recommendations}</div>
            </div>
            ` : ''}

            ${report.coachingData.practiceExercises && report.coachingData.practiceExercises.length > 0 ? `
            <div class="list-section">
              <h3>🏃 Practice Exercises</h3>
              ${report.coachingData.practiceExercises.map((exercise: string) =>
                `<div class="list-item">• ${exercise}</div>`
              ).join('')}
            </div>
            ` : ''}

            ${report.coachingData.quickWins && report.coachingData.quickWins.length > 0 ? `
            <div class="list-section">
              <h3>⚡ Quick Wins</h3>
              ${report.coachingData.quickWins.map((win: string) =>
                `<div class="list-item strengths-list">• ${win}</div>`
              ).join('')}
            </div>
            ` : ''}
          </div>
          ` : ''}

          <!-- Summary -->
          ${report.analysisData.summary ? `
          <div class="section">
            <div class="section-header">
              <h2><span class="emoji">📋</span>Summary</h2>
            </div>
            <div class="transcript-section">
              <div class="transcript-text">${report.analysisData.summary}</div>
            </div>
          </div>
          ` : ''}

          <!-- Keywords -->
          ${report.analysisData.keywords ? `
          <div class="section">
            <div class="section-header">
              <h2><span class="emoji">🔑</span>Keywords</h2>
            </div>
            <div class="list-item">${report.analysisData.keywords}</div>
          </div>
          ` : ''}

          <!-- Transcript Preview -->
          ${report.analysisData.original_transcript ? `
          <div class="section">
            <div class="section-header">
              <h2><span class="emoji">📜</span>Transcript Preview</h2>
            </div>
            <div class="transcript-section">
              <div class="transcript-text">${report.analysisData.original_transcript.length > 500 ?
                report.analysisData.original_transcript.substring(0, 500) + '...' :
                report.analysisData.original_transcript}</div>
            </div>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <div class="logo">Generated by U-Speak Pro - Video Analysis Platform</div>
          <div>Report generated on ${new Date().toLocaleString()}</div>
        </div>
      </body>
      </html>
    `;
  }

  public generatePDF(report: ComprehensiveAnalysisReport): Buffer {
    const doc = new jsPDF();
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    const addPageIfNeeded = (spaceNeeded: number = 30): void => {
      if (yPosition + spaceNeeded > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    const addTitle = (text: string, size: number = 16): void => {
      doc.setFontSize(size);
      doc.setFont('helvetica', 'bold');
      doc.text(text, margin, yPosition);
      yPosition += 10;
    };

    const addText = (text: string, fontSize: number = 10): void => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'normal');

      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 5;
    };

    const addKeyValue = (key: string, value: string): void => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${key}:`, margin, yPosition);

      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 60, yPosition);
      yPosition += 8;
    };

    // Header
    addTitle('Video Analysis Report', 20);
    addText(`Generated on: ${new Date().toLocaleDateString()}`, 10);
    if (report.userData?.name) {
      addText(`Prepared for: ${report.userData.name}`, 10);
    }
    yPosition += 10;

    // Overall Performance
    addPageIfNeeded(20);
    addTitle('📊 Overall Performance', 14);
    const overallScore = this.calculateOverallScore(report);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Overall Score: ${overallScore}/100`, margin, yPosition);
    yPosition += 15;

    // Video Information
    addPageIfNeeded(20);
    addTitle('📹 Video Information', 14);
    addKeyValue('Filename', report.analysisData.filename);
    addKeyValue('Duration', report.analysisData.duration);
    addKeyValue('File Size', report.analysisData.file_size);
    addKeyValue('Language', report.analysisData.language);
    if (report.analysisData.upload_date) {
      addKeyValue('Upload Date', new Date(report.analysisData.upload_date).toLocaleDateString());
    }
    if (report.analysisData.speaker) {
      addKeyValue('Speaker', report.analysisData.speaker);
    }
    yPosition += 10;

    // Content Assessment
    if (report.analysisData.content_assessment) {
      addPageIfNeeded(20);
      addTitle('📈 Content Assessment', 14);
      const ca = report.analysisData.content_assessment;
      addKeyValue('Word Power', `${ca.word_power_percentage}%`);
      addKeyValue('Vocabulary Diversity', `${ca.vocabulary_diversity}%`);
      addKeyValue('Clarity Score', `${ca.clarity_score}%`);
      addKeyValue('Fluency Score', `${ca.fluency_score}%`);
      addKeyValue('Total Words', ca.word_count.toString());
      addKeyValue('Avg Words/Sentence', ca.avg_words_per_sentence.toFixed(1));
      if (ca.strength_level) {
        addKeyValue('Strength Level', ca.strength_level);
      }
      if (ca.top_strength) {
        addKeyValue('Top Strength', ca.top_strength);
      }
      yPosition += 10;
    }

    // Vocal Analysis
    if (report.vocalData) {
      addPageIfNeeded(20);
      addTitle('🎤 Vocal Analysis', 14);
      const va = report.vocalData;
      addKeyValue('Overall Score', `${va.overallScore}/100`);
      addKeyValue('Verdict', va.verdict);
      if (va.audio) {
        addKeyValue('Volume', `${va.audio.volume_db.toFixed(1)} dB`);
        addKeyValue('Pitch', `${va.audio.mean_pitch_hz.toFixed(0)} Hz`);
        addKeyValue('Pitch Range', va.audio.pitch_range);
        if (va.pace) {
          addKeyValue('Speaking Pace', `${va.pace.wordsPerMinute} WPM`);
        }
        addKeyValue('Pauses', va.audio.num_pauses.toString());
      }
      if (va.clarity) {
        addKeyValue('Clarity Score', `${va.clarity.score}/100`);
      }
      if (va.quality) {
        addKeyValue('Energy Level', va.quality.energy);
        addKeyValue('Modulation', `${va.quality.modulation}%`);
        addKeyValue('Projection', va.quality.projection);
      }

      if (va.strengths && va.strengths.length > 0) {
        addPageIfNeeded(20);
        addTitle('Strengths:', 12);
        va.strengths.forEach(strength => {
          addText(`• ${strength}`, 9);
        });
      }

      if (va.improvements && va.improvements.length > 0) {
        addPageIfNeeded(20);
        addTitle('Areas for Improvement:', 12);
        va.improvements.forEach(improvement => {
          addText(`• ${improvement}`, 9);
        });
      }
      yPosition += 10;
    }

    // Body Language
    if (report.bodyLanguageData) {
      addPageIfNeeded(20);
      addTitle('🤝 Body Language', 14);
      const bl = report.bodyLanguageData;
      addKeyValue('Frames Processed', bl.frames_processed.toString());
      addKeyValue('Overall Score', `${bl.overallScore}/100`);
      addKeyValue('Processing Duration', bl.processingDuration?.toString() || 'N/A');
      addKeyValue('Positive Expressions', bl.smiles);
      addKeyValue('Eye Contact', bl.eye_contact);
      addKeyValue('Hand Gestures', bl.hand_moves);
      addKeyValue('Head Movement', bl.head_moves);
      addKeyValue('Leg Movement', bl.leg_moves);
      addKeyValue('Foot Movement', bl.foot_moves);

      if (bl.positive_facial_emotions) {
        addKeyValue('Positive Facial Emotions', bl.positive_facial_emotions);
      }
      if (bl.eye_contact_percent !== undefined) {
        addKeyValue('Eye Contact %', `${bl.eye_contact_percent}%`);
      }
      if (bl.smile_count !== undefined) {
        addKeyValue('Smile Count', bl.smile_count.toString());
      }
      yPosition += 10;
    }

    // Sentiment Analysis
    if (report.analysisData.sentiment_analysis) {
      addPageIfNeeded(20);
      addTitle('😊 Sentiment Analysis', 14);
      const sa = report.analysisData.sentiment_analysis;
      addKeyValue('Overall Sentiment', sa.overall_sentiment || 'N/A');
      addKeyValue('Confidence', sa.confidence ? `${sa.confidence}%` : 'N/A');
      addKeyValue('Positive Score', `${sa.positive_score || 0}%`);
      addKeyValue('Negative Score', `${sa.negative_score || 0}%`);
      addKeyValue('Neutral Score', `${sa.neutral_score || 0}%`);
      if (sa.label) {
        addKeyValue('Label', sa.label);
      }
      yPosition += 10;
    }

    // Summary
    if (report.analysisData.summary) {
      addPageIfNeeded(20);
      addTitle('📋 Summary', 14);
      addText(report.analysisData.summary);
      yPosition += 10;
    }

    // Keywords
    if (report.analysisData.keywords) {
      addPageIfNeeded(20);
      addTitle('🔑 Keywords', 14);
      addText(report.analysisData.keywords);
      yPosition += 10;
    }

    // Transcript (truncated for PDF)
    if (report.analysisData.original_transcript) {
      addPageIfNeeded(20);
      addTitle('📜 Transcript Preview', 14);
      const transcript = report.analysisData.original_transcript;
      const preview = transcript.length > 500 ?
        transcript.substring(0, 500) + '...' :
        transcript;
      addText(preview);
      yPosition += 10;
    }

    // Footer
    addPageIfNeeded(20);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      'Generated by U-Speak Pro - Video Analysis Platform',
      margin,
      pageHeight - 10
    );

    return Buffer.from(doc.output('arraybuffer'));
  }

  private calculateOverallScore(report: ComprehensiveAnalysisReport): number {
    let totalScore = 0;
    let count = 0;

    // Content assessment
    if (report.analysisData.content_assessment?.word_power_percentage) {
      totalScore += report.analysisData.content_assessment.word_power_percentage;
      count++;
    }

    // Vocal score
    if (report.vocalData?.overallScore) {
      totalScore += report.vocalData.overallScore;
      count++;
    }

    // Body language score
    if (report.bodyLanguageData?.overallScore) {
      totalScore += report.bodyLanguageData.overallScore;
      count++;
    }

    // Sentiment confidence
    if (report.analysisData.sentiment_analysis?.confidence) {
      totalScore += report.analysisData.sentiment_analysis.confidence;
      count++;
    }

    return count > 0 ? Math.round(totalScore / count) : 0;
  }
}

export function generateVideoAnalysisPDF(report: ComprehensiveAnalysisReport): Buffer {
  const generator = new ServerSidePDFGenerator();
  return generator.generatePDF(report);
}

// Export the type for use in other modules
export type { ComprehensiveAnalysisReport };
