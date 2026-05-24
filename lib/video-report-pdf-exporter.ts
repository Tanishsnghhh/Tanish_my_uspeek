import html2pdf from 'html2pdf.js';

// Type definitions for the report data
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
      overall_strength: string;
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
    audio: {
      duration_sec: number;
      volume_db: number;
      mean_pitch_hz: number;
      pitch_range: string;
      num_pauses: number;
      spoken_duration_sec: number;
    };
    overallScore: number;
    verdict: string;
    pace: { wordsPerMinute: number; assessment: string };
    clarity: { score: number; assessment: string };
    quality: { energy: string; modulation: number; projection: string };
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
    processingDuration?: number;
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
    email: string;
    role: string;
    department: string;
    employeeId: string;
  };
}

// Function to generate HTML content for the PDF dynamically
function generatePDFHTML(report: ComprehensiveAnalysisReport): string {
  const { analysisData, vocalData, bodyLanguageData, coachingData, userData } = report;

  // Helper function to safely get values
  const safeValue = (value: any, fallback: string = 'N/A') => value || fallback;

  // Helper to format scores
  const formatScore = (score: number) => isNaN(score) ? 'N/A' : score.toFixed(1);

  // Dynamic HTML generation
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Video Analysis Report</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          line-height: 1.6;
          background: #ffffff;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #1e40af;
          margin: 10px 0;
        }
        .subtitle {
          font-size: 16px;
          color: #6b7280;
          margin-bottom: 20px;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #1e40af;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 8px;
          margin-bottom: 15px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        .info-item {
          background: #f8fafc;
          padding: 12px;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
        }
        .info-label {
          font-weight: bold;
          color: #374151;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-value {
          font-size: 14px;
          color: #1f2937;
          margin-top: 4px;
        }
        .score-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          margin: 20px 0;
        }
        .score-value {
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .score-label {
          font-size: 14px;
          opacity: 0.9;
        }
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        .metric-item {
          text-align: center;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
        }
        .metric-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 5px;
        }
        .content-box {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #10b981;
          margin: 15px 0;
        }
        .transcript {
          background: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #e5e7eb;
        }
        .list-item {
          margin: 8px 0;
          padding: 8px 12px;
          background: #f8fafc;
          border-radius: 6px;
          border-left: 3px solid #2563eb;
        }
        .strength {
          border-left-color: #10b981 !important;
        }
        .improvement {
          border-left-color: #f59e0b !important;
        }
        .recommendation {
          background: #fef3c7;
          border-left-color: #f59e0b;
          padding: 12px;
          margin: 10px 0;
          border-radius: 6px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
        @media print {
          body { margin: 0; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">Video Analysis Report</div>
        <div class="subtitle">Comprehensive Performance Assessment</div>
        ${userData ? `<div style="font-size: 14px; color: #4b5563;">Generated for: ${safeValue(userData.name)} | ${safeValue(userData.role)}</div>` : ''}
      </div>

      <div class="section">
        <div class="section-title">Video Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Filename</div>
            <div class="info-value">${safeValue(analysisData.filename)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">File Size</div>
            <div class="info-value">${safeValue(analysisData.file_size)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Duration</div>
            <div class="info-value">${safeValue(analysisData.duration)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Language</div>
            <div class="info-value">${safeValue(analysisData.language)}</div>
          </div>
          ${analysisData.upload_date ? `
          <div class="info-item">
            <div class="info-label">Upload Date</div>
            <div class="info-value">${new Date(analysisData.upload_date).toLocaleDateString()}</div>
          </div>
          ` : ''}
          ${analysisData.speaker ? `
          <div class="info-item">
            <div class="info-label">Speaker</div>
            <div class="info-value">${safeValue(analysisData.speaker)}</div>
          </div>
          ` : ''}
        </div>
      </div>`;

  // Content Assessment Section
  if (analysisData.content_assessment) {
    html += `
      <div class="section">
        <div class="section-title">Content Assessment</div>
        <div class="score-card">
          <div class="score-value">${formatScore(analysisData.content_assessment.word_power_score)}</div>
          <div class="score-label">Word Power Score</div>
        </div>
        <div class="metric-grid">
          <div class="metric-item">
            <div class="metric-value">${formatScore(analysisData.content_assessment.clarity_score)}</div>
            <div class="metric-label">Clarity</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">${formatScore(analysisData.content_assessment.fluency_score)}</div>
            <div class="metric-label">Fluency</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">${formatScore(analysisData.content_assessment.vocabulary_diversity)}</div>
            <div class="metric-label">Vocabulary Diversity</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">${analysisData.content_assessment.word_count}</div>
            <div class="metric-label">Word Count</div>
          </div>
        </div>
        <div class="content-box">
          <strong>Overall Strength:</strong> ${safeValue(analysisData.content_assessment.overall_strength)}<br>
          <strong>Top Strength:</strong> ${safeValue(analysisData.content_assessment.top_strength)}
        </div>
      </div>`;
  }

  // Summary Section
  if (analysisData.summary) {
    html += `
      <div class="section">
        <div class="section-title">Summary</div>
        <div class="content-box">
          ${safeValue(analysisData.summary)}
        </div>
      </div>`;
  }

  // Keywords Section
  if (analysisData.keywords) {
    html += `
      <div class="section">
        <div class="section-title">Keywords</div>
        <div class="content-box">
          ${safeValue(analysisData.keywords)}
        </div>
      </div>`;
  }

  // Transcript Section
  if (analysisData.corrected_transcript) {
    html += `
      <div class="section">
        <div class="section-title">Transcript</div>
        <div class="transcript">
          ${safeValue(analysisData.corrected_transcript)}
        </div>
      </div>`;
  }

  // Vocal Analysis Section
  if (vocalData) {
    html += `
      <div class="section">
        <div class="section-title">Vocal Analysis</div>
        <div class="score-card">
          <div class="score-value">${formatScore(vocalData.overallScore)}</div>
          <div class="score-label">${safeValue(vocalData.verdict)}</div>
        </div>
        <div class="metric-grid">
          <div class="metric-item">
            <div class="metric-value">${vocalData.pace.wordsPerMinute}</div>
            <div class="metric-label">Words/Min (${safeValue(vocalData.pace.assessment)})</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">${formatScore(vocalData.clarity.score)}</div>
            <div class="metric-label">Clarity (${safeValue(vocalData.clarity.assessment)})</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">${vocalData.quality.modulation}%</div>
            <div class="metric-label">Modulation</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">${safeValue(vocalData.quality.energy)}</div>
            <div class="metric-label">Energy Level</div>
          </div>
        </div>`;

    if (vocalData.strengths && vocalData.strengths.length > 0) {
      html += `
        <div style="margin-top: 20px;">
          <strong style="color: #10b981;">Strengths:</strong>
          ${vocalData.strengths.map(strength => `<div class="list-item strength">${safeValue(strength)}</div>`).join('')}
        </div>`;
    }

    if (vocalData.improvements && vocalData.improvements.length > 0) {
      html += `
        <div style="margin-top: 20px;">
          <strong style="color: #f59e0b;">Areas for Improvement:</strong>
          ${vocalData.improvements.map(improvement => `<div class="list-item improvement">${safeValue(improvement)}</div>`).join('')}
        </div>`;
    }

    html += `</div>`;
  }

  // Body Language Analysis Section
  if (bodyLanguageData) {
    html += `
      <div class="section">
        <div class="section-title">Body Language Analysis</div>
        <div class="score-card">
          <div class="score-value">${formatScore(bodyLanguageData.overallScore)}</div>
          <div class="score-label">Overall Body Language Score</div>
        </div>
        <div class="metric-grid">
          <div class="metric-item">
            <div class="metric-value">${safeValue(bodyLanguageData.smiles)}</div>
            <div class="metric-label">Smiles</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">${safeValue(bodyLanguageData.eye_contact)}</div>
            <div class="metric-label">Eye Contact</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">${safeValue(bodyLanguageData.hand_moves)}</div>
            <div class="metric-label">Hand Movements</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">${safeValue(bodyLanguageData.head_moves)}</div>
            <div class="metric-label">Head Movements</div>
          </div>
        </div>
        <div style="margin-top: 15px; font-size: 12px; color: #6b7280;">
          Frames Processed: ${bodyLanguageData.frames_processed}
          ${bodyLanguageData.processingDuration ? ` | Processing Time: ${bodyLanguageData.processingDuration}ms` : ''}
        </div>
      </div>`;
  }

  // Coaching Recommendations Section
  if (coachingData) {
    html += `
      <div class="section">
        <div class="section-title">Coaching Recommendations</div>`;

    if (coachingData.summary) {
      html += `
        <div class="content-box">
          <strong>Summary:</strong><br>
          ${safeValue(coachingData.summary)}
        </div>`;
    }

    if (coachingData.bodyLanguageAnalysis) {
      html += `
        <div class="content-box">
          <strong>Body Language Analysis:</strong><br>
          ${safeValue(coachingData.bodyLanguageAnalysis)}
        </div>`;
    }

    if (coachingData.vocalAnalysis) {
      html += `
        <div class="content-box">
          <strong>Vocal Analysis:</strong><br>
          ${safeValue(coachingData.vocalAnalysis)}
        </div>`;
    }

    if (coachingData.recommendations) {
      html += `
        <div class="recommendation">
          <strong>Recommendations:</strong><br>
          ${safeValue(coachingData.recommendations)}
        </div>`;
    }

    if (coachingData.quickWins && coachingData.quickWins.length > 0) {
      html += `
        <div style="margin-top: 20px;">
          <strong style="color: #10b981;">Quick Wins:</strong>
          ${coachingData.quickWins.map(win => `<div class="list-item strength">${safeValue(win)}</div>`).join('')}
        </div>`;
    }

    if (coachingData.practiceExercises && coachingData.practiceExercises.length > 0) {
      html += `
        <div style="margin-top: 20px;">
          <strong style="color: #2563eb;">Practice Exercises:</strong>
          ${coachingData.practiceExercises.map(exercise => `<div class="list-item">${safeValue(exercise)}</div>`).join('')}
        </div>`;
    }

    html += `</div>`;
  }

  // Footer
  html += `
      <div class="footer">
        <div>Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
        <div style="margin-top: 5px;">Powered by Video Analysis Platform</div>
      </div>
    </body>
    </html>`;

  return html;
}

// Function to generate PDF using html2pdf.js
async function generateVideoAnalysisPDFWithHtml2Pdf(report: ComprehensiveAnalysisReport): Promise<void> {
  try {
    // Generate HTML content
    const htmlContent = generatePDFHTML(report);

    // Create a temporary element to hold the HTML
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    document.body.appendChild(element);

    // Configure html2pdf options
    const options = {
      margin: [0.5, 0.5, 0.5, 0.5], // top, right, bottom, left in inches
      filename: `video-analysis-report-${report.analysisData.filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: 'portrait'
      }
    };

    // Generate and download the PDF
    await html2pdf().set(options).from(element).save();

    // Clean up
    document.body.removeChild(element);

  } catch (error) {
    console.error('Error generating PDF with html2pdf.js:', error);
    throw new Error('Failed to generate PDF report');
  }
}

// Enhanced export function that works with the existing VideoReport component data
export async function exportVideoReportToPDF(
  analysisData: any,
  poseData: any,
  coachingData: any,
  userData: any = null
): Promise<void> {
  
  // Transform the existing data structure to match our comprehensive report format
  const comprehensiveReport: ComprehensiveAnalysisReport = {
    analysisData: {
      filename: analysisData?.filename || 'Unknown Video',
      file_size: analysisData?.file_size || 'Unknown',
      language: analysisData?.language || 'English',
      duration: analysisData?.duration || '00:00:00',
      upload_date: analysisData?.upload_date,
      speaker: userData?.name || analysisData?.speaker,
      
      original_transcript: analysisData?.original_transcript || '',
      corrected_transcript: analysisData?.corrected_transcript || '',
      summary: analysisData?.summary || '',
      keywords: analysisData?.keywords || '',
      
      content_assessment: analysisData?.content_assessment ? {
        word_power_score: analysisData.content_assessment.word_power_score,
        word_power_percentage: analysisData.content_assessment.word_power_percentage,
        overall_strength: analysisData.content_assessment.overall_strength,
        strength_level: analysisData.content_assessment.strength_level,
        strength_description: analysisData.content_assessment.strength_description,
        top_strength: analysisData.content_assessment.top_strength,
        vocabulary_diversity: analysisData.content_assessment.vocabulary_diversity,
        clarity_score: analysisData.content_assessment.clarity_score,
        fluency_score: analysisData.content_assessment.fluency_score,
        word_count: analysisData.content_assessment.word_count,
        avg_words_per_sentence: analysisData.content_assessment.avg_words_per_sentence,
        sentence_count: analysisData.content_assessment.sentence_count,
      } : undefined,
      
      sentiment_analysis: analysisData?.sentiment_analysis,
      emotion_analysis: analysisData?.emotion_analysis,
      confidence_analysis: analysisData?.confidence_analysis,
      repeated_words: analysisData?.repeated_words,
      filler_words: analysisData?.filler_words,
      strengths_improvements: analysisData?.strengths_improvements,
    },
    
    vocalData: poseData?.audio ? {
      audio: {
        duration_sec: poseData.audio.duration_sec,
        volume_db: poseData.audio.volume_db,
        mean_pitch_hz: poseData.audio.mean_pitch_hz,
        pitch_range: poseData.audio.pitch_range,
        num_pauses: poseData.audio.num_pauses,
        spoken_duration_sec: poseData.audio.spoken_duration_sec,
      },
      // Calculate vocal scores from available data
      overallScore: calculateVocalScore(poseData.audio),
      verdict: getVocalVerdict(poseData.audio),
      pace: calculatePace(poseData.audio, analysisData),
      clarity: calculateClarity(analysisData),
      quality: calculateQuality(poseData.audio),
      strengths: generateVocalStrengths(poseData.audio, analysisData),
      improvements: generateVocalImprovements(poseData.audio, analysisData),
    } : undefined,
    
    bodyLanguageData: poseData ? {
      frames_processed: poseData.frames_processed || 0,
      smiles: poseData.smiles || '0 (0%)',
      head_moves: poseData.head_moves || '0 (0%)',
      hand_moves: poseData.hand_moves || '0 (0%)',
      eye_contact: poseData.eye_contact || '0 (0%)',
      leg_moves: poseData.leg_moves || '0 (0%)',
      foot_moves: poseData.foot_moves || '0 (0%)',
      overallScore: calculateBodyLanguageScore(poseData),
      processingDuration: poseData.processing_duration,
    } : undefined,
    
    coachingData: coachingData ? {
      summary: coachingData.summary || '',
      bodyLanguageAnalysis: coachingData.interpretation || coachingData.bodyLanguageAnalysis || '',
      vocalAnalysis: coachingData.vocalAnalysis || '',
      recommendations: coachingData.suggestions || coachingData.recommendations || '',
      practiceExercises: coachingData.practiceExercises || [],
      quickWins: coachingData.quickWins || [],
    } : undefined,
    
    userData: userData ? {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      department: userData.department,
      employeeId: userData.employeeId,
    } : undefined,
  };
  
  // Generate the PDF using html2pdf.js
  await generateVideoAnalysisPDFWithHtml2Pdf(comprehensiveReport);
}

// Helper functions to calculate scores and metrics from existing data

function calculateVocalScore(audioData: any): number {
  if (!audioData) return 0;
  
  let score = 70; // Base score
  
  // Adjust based on speaking pace
  const totalWords = audioData.spoken_duration_sec * 2.5; // Rough estimate
  const wordsPerMinute = (totalWords / audioData.spoken_duration_sec) * 60;
  
  if (wordsPerMinute >= 120 && wordsPerMinute <= 160) {
    score += 10; // Good pace
  } else if (wordsPerMinute < 100 || wordsPerMinute > 180) {
    score -= 15; // Too slow or too fast
  }
  
  // Adjust based on pauses
  const pauseRate = audioData.num_pauses / (audioData.duration_sec / 60);
  if (pauseRate >= 2 && pauseRate <= 6) {
    score += 10; // Good pause distribution
  } else if (pauseRate > 10) {
    score -= 10; // Too many pauses
  }
  
  // Adjust based on pitch variation
  if (audioData.pitch_range && audioData.pitch_range !== 'N/A') {
    const range = parseFloat(audioData.pitch_range.split('-')[1]) - parseFloat(audioData.pitch_range.split('-')[0]);
    if (range > 50) {
      score += 10; // Good pitch variation
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

function getVocalVerdict(audioData: any): string {
  const score = calculateVocalScore(audioData);
  
  if (score >= 85) return 'Excellent vocal delivery';
  if (score >= 75) return 'Good vocal performance';
  if (score >= 65) return 'Satisfactory vocal quality';
  if (score >= 50) return 'Needs improvement';
  return 'Significant vocal coaching needed';
}

function calculatePace(audioData: any, analysisData: any): { wordsPerMinute: number; assessment: string } {
  if (!audioData || !analysisData?.content_assessment?.word_count) {
    return { wordsPerMinute: 0, assessment: 'Unable to calculate' };
  }
  
  const wordsPerMinute = Math.round((analysisData.content_assessment.word_count / audioData.spoken_duration_sec) * 60);
  
  let assessment = 'Normal';
  if (wordsPerMinute < 100) assessment = 'Slow';
  else if (wordsPerMinute > 180) assessment = 'Fast';
  else if (wordsPerMinute >= 120 && wordsPerMinute <= 160) assessment = 'Optimal';
  
  return { wordsPerMinute, assessment };
}

function calculateClarity(analysisData: any): { score: number; assessment: string } {
  const clarityScore = analysisData?.content_assessment?.clarity_score || 70;
  
  let assessment = 'Good';
  if (clarityScore >= 85) assessment = 'Excellent';
  else if (clarityScore >= 75) assessment = 'Good';
  else if (clarityScore >= 65) assessment = 'Fair';
  else assessment = 'Needs Improvement';
  
  return { score: clarityScore, assessment };
}

function calculateQuality(audioData: any): { energy: string; modulation: number; projection: string } {
  if (!audioData) {
    return { energy: 'Unknown', modulation: 0, projection: 'Unknown' };
  }
  
  // Estimate energy from volume
  let energy = 'Medium';
  if (audioData.volume_db > -10) energy = 'High';
  else if (audioData.volume_db < -20) energy = 'Low';
  
  // Estimate modulation from pitch range
  let modulation = 50;
  if (audioData.pitch_range && audioData.pitch_range !== 'N/A') {
    const range = parseFloat(audioData.pitch_range.split('-')[1]) - parseFloat(audioData.pitch_range.split('-')[0]);
    modulation = Math.min(100, Math.max(0, (range / 100) * 100));
  }
  
  // Estimate projection
  let projection = 'Good';
  if (audioData.volume_db > -8) projection = 'Strong';
  else if (audioData.volume_db < -25) projection = 'Weak';
  
  return { energy, modulation: Math.round(modulation), projection };
}

function generateVocalStrengths(audioData: any, analysisData: any): string[] {
  const strengths: string[] = [];
  
  if (!audioData) return strengths;
  
  // Check volume
  if (audioData.volume_db > -15) {
    strengths.push('Strong voice projection and volume');
  }
  
  // Check pace
  const pace = calculatePace(audioData, analysisData);
  if (pace.wordsPerMinute >= 120 && pace.wordsPerMinute <= 160) {
    strengths.push('Optimal speaking pace for audience engagement');
  }
  
  // Check pauses
  const pauseRate = audioData.num_pauses / (audioData.duration_sec / 60);
  if (pauseRate >= 2 && pauseRate <= 6) {
    strengths.push('Effective use of pauses for emphasis');
  }
  
  // Check speaking time
  const speakingPercentage = (audioData.spoken_duration_sec / audioData.duration_sec) * 100;
  if (speakingPercentage >= 70) {
    strengths.push('Good utilization of speaking time');
  }
  
  if (strengths.length === 0) {
    strengths.push('Basic vocal delivery established');
  }
  
  return strengths;
}

function generateVocalImprovements(audioData: any, analysisData: any): string[] {
  const improvements: string[] = [];
  
  if (!audioData) return ['Unable to analyze vocal performance from available data'];
  
  // Check volume
  if (audioData.volume_db < -20) {
    improvements.push('Increase voice volume and projection');
  }
  
  // Check pace
  const pace = calculatePace(audioData, analysisData);
  if (pace.wordsPerMinute < 100) {
    improvements.push('Increase speaking pace to maintain audience engagement');
  } else if (pace.wordsPerMinute > 180) {
    improvements.push('Slow down speaking pace for better comprehension');
  }
  
  // Check pauses
  const pauseRate = audioData.num_pauses / (audioData.duration_sec / 60);
  if (pauseRate < 2) {
    improvements.push('Use more strategic pauses for emphasis and breath control');
  } else if (pauseRate > 10) {
    improvements.push('Reduce excessive pauses to maintain flow');
  }
  
  // Check pitch variation
  if (audioData.pitch_range && audioData.pitch_range !== 'N/A') {
    const range = parseFloat(audioData.pitch_range.split('-')[1]) - parseFloat(audioData.pitch_range.split('-')[0]);
    if (range < 30) {
      improvements.push('Increase vocal variety and pitch modulation');
    }
  }
  
  if (improvements.length === 0) {
    improvements.push('Continue practicing to refine vocal delivery techniques');
  }
  
  return improvements;
}

function calculateBodyLanguageScore(poseData: any): number {
  if (!poseData) return 0;
  
  let score = 60; // Base score
  
  // Calculate based on gesture percentages
  const getPercentage = (gestureString: string): number => {
    const match = gestureString.match(/\((\d+(?:\.\d+)?)%\)/);
    return match ? parseFloat(match[1]) : 0;
  };
  
  // Positive gestures
  const smilePercentage = getPercentage(poseData.smiles || '0%');
  const eyeContactPercentage = getPercentage(poseData.eye_contact || '0%');
  const handMovementPercentage = getPercentage(poseData.hand_moves || '0%');
  
  // Score adjustments
  if (smilePercentage >= 15) score += 10;
  if (eyeContactPercentage >= 50) score += 15;
  if (handMovementPercentage >= 20 && handMovementPercentage <= 50) score += 10;
  
  // Negative adjustments for excessive movements
  const legMovementPercentage = getPercentage(poseData.leg_moves || '0%');
  const footMovementPercentage = getPercentage(poseData.foot_moves || '0%');
  
  if (legMovementPercentage > 20) score -= 10;
  if (footMovementPercentage > 15) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}

// Function to be used directly in the VideoReport component
export async function handleExportToPDF(analysisData: any, poseData: any, coachingData: any, userData?: any): Promise<void> {
  try {
    await exportVideoReportToPDF(analysisData, poseData, coachingData, userData);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    alert('Failed to generate PDF report. Please try again.');
  }
}

// Function to export PDF via API (when we have upload ID)
export async function exportVideoAnalysisPDFViaAPI(uploadId: string, token: string): Promise<void> {
  try {
    const response = await fetch('/api/video-analysis/export-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        uploadId,
        format: 'pdf'
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to export PDF');
    }

    const result = await response.json();
    
    if (result.success && result.reportData) {
      // Use the comprehensive data to generate PDF
      await generateVideoAnalysisPDFWithHtml2Pdf(result.reportData);
    } else {
      throw new Error(result.error || 'Failed to export PDF');
    }
  } catch (error) {
    console.error('Error exporting PDF via API:', error);
    alert('Failed to export PDF report. Please try again.');
  }
}

export default exportVideoReportToPDF;
