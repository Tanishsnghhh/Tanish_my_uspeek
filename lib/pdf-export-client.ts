'use client';

// Simplified interfaces for PDF generation
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
}

// Calculate scores from available data
function calculateOverallScore(data: SimplifiedReportData): number {
  let totalScore = 0;
  let scoreCount = 0;

  if (data.contentMetrics?.word_power_percentage) {
    totalScore += data.contentMetrics.word_power_percentage;
    scoreCount++;
  }

  if (data.vocalMetrics?.volume_db) {
    const vocalScore = Math.max(0, Math.min(100, data.vocalMetrics.volume_db + 60));
    totalScore += vocalScore;
    scoreCount++;
  }

  if (data.bodyLanguageMetrics?.smiles) {
    const match = data.bodyLanguageMetrics.smiles.match(/\((\d+(?:\.\d+)?)%\)/);
    if (match) {
      const bodyScore = Math.min(100, parseFloat(match[1]) * 3);
      totalScore += bodyScore;
      scoreCount++;
    }
  }

  return scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
}

function calculateWPM(data: SimplifiedReportData): number {
  if (!data.transcript || !data.vocalMetrics?.spoken_duration_sec) return 0;
  
  const wordCount = data.transcript.split(/\s+/).filter(word => word.length > 0).length;
  const minutes = data.vocalMetrics.spoken_duration_sec / 60;
  
  return minutes > 0 ? Math.round(wordCount / minutes) : 0;
}

function extractPercentage(value: string): number {
  const match = value.match(/\((\d+(?:\.\d+)?)%\)/);
  return match ? parseFloat(match[1]) : 0;
}

function generatePDFHTML(data: SimplifiedReportData): string {
  const overallScore = calculateOverallScore(data);
  const wpm = calculateWPM(data);
  const smilesPercent = data.bodyLanguageMetrics ? extractPercentage(data.bodyLanguageMetrics.smiles) : 0;
  const eyeContactPercent = data.bodyLanguageMetrics ? extractPercentage(data.bodyLanguageMetrics.eye_contact) : 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Video Analysis Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 8px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 18px; font-weight: bold; color: #1e40af; margin-bottom: 15px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
        .card { background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb; }
        .card-label { font-size: 12px; font-weight: bold; color: #6b7280; text-transform: uppercase; }
        .card-value { font-size: 16px; font-weight: bold; color: #1f2937; margin-top: 5px; }
        .score-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 25px; border-radius: 10px; margin: 20px 0; }
        .score-value { font-size: 36px; font-weight: bold; margin-bottom: 5px; }
        .score-label { font-size: 14px; opacity: 0.9; }
        .content-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0; }
        .status-good { color: #10b981; }
        .status-warning { color: #f59e0b; }
        .status-poor { color: #ef4444; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">Video Analysis Report</div>
        <div>Generated on ${new Date().toLocaleDateString()}</div>
        ${data.userInfo?.name ? `<div>Prepared for: ${data.userInfo.name}</div>` : ''}
      </div>

      <div class="section">
        <div class="section-title">📹 Video Information</div>
        <div class="grid">
          <div class="card">
            <div class="card-label">Filename</div>
            <div class="card-value">${data.videoInfo.filename}</div>
          </div>
          <div class="card">
            <div class="card-label">Duration</div>
            <div class="card-value">${data.videoInfo.duration}</div>
          </div>
          <div class="card">
            <div class="card-label">File Size</div>
            <div class="card-value">${data.videoInfo.file_size}</div>
          </div>
          <div class="card">
            <div class="card-label">Language</div>
            <div class="card-value">${data.videoInfo.language}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📊 Overall Performance</div>
        <div class="score-card">
          <div class="score-value">${overallScore}</div>
          <div class="score-label">Overall Communication Score</div>
        </div>
      </div>

      ${data.contentMetrics ? `
      <div class="section">
        <div class="section-title">📈 Content Metrics</div>
        <div class="grid">
          ${data.contentMetrics.word_power_percentage ? `
          <div class="card">
            <div class="card-label">Word Power</div>
            <div class="card-value ${data.contentMetrics.word_power_percentage >= 70 ? 'status-good' : data.contentMetrics.word_power_percentage >= 50 ? 'status-warning' : 'status-poor'}">${data.contentMetrics.word_power_percentage}%</div>
          </div>
          ` : ''}
          ${data.contentMetrics.word_count ? `
          <div class="card">
            <div class="card-label">Total Words</div>
            <div class="card-value">${data.contentMetrics.word_count}</div>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      ${data.vocalMetrics ? `
      <div class="section">
        <div class="section-title">🎤 Vocal Analysis</div>
        <div class="grid">
          ${data.vocalMetrics.volume_db ? `
          <div class="card">
            <div class="card-label">Volume Level</div>
            <div class="card-value">${data.vocalMetrics.volume_db.toFixed(1)} dB</div>
          </div>
          ` : ''}
          ${data.vocalMetrics.mean_pitch_hz ? `
          <div class="card">
            <div class="card-label">Average Pitch</div>
            <div class="card-value">${data.vocalMetrics.mean_pitch_hz.toFixed(0)} Hz</div>
          </div>
          ` : ''}
        </div>
        ${wpm > 0 ? `
        <div class="content-box">
          Speaking Pace: ${wpm} words per minute
        </div>
        ` : ''}
      </div>
      ` : ''}

      ${data.bodyLanguageMetrics ? `
      <div class="section">
        <div class="section-title">🤝 Body Language</div>
        <div class="grid">
          <div class="card">
            <div class="card-label">Frames Analyzed</div>
            <div class="card-value">${data.bodyLanguageMetrics.frames_processed}</div>
          </div>
          <div class="card">
            <div class="card-label">Positive Expressions</div>
            <div class="card-value ${smilesPercent >= 15 ? 'status-good' : smilesPercent >= 5 ? 'status-warning' : 'status-poor'}">${smilesPercent.toFixed(1)}%</div>
          </div>
          <div class="card">
            <div class="card-label">Eye Contact</div>
            <div class="card-value ${eyeContactPercent >= 60 ? 'status-good' : eyeContactPercent >= 40 ? 'status-warning' : 'status-poor'}">${eyeContactPercent.toFixed(1)}%</div>
          </div>
          <div class="card">
            <div class="card-label">Hand Gestures</div>
            <div class="card-value">${data.bodyLanguageMetrics.hand_moves}</div>
          </div>
        </div>
      </div>
      ` : ''}

      ${data.summary ? `
      <div class="section">
        <div class="section-title">📋 Summary</div>
        <div class="content-box">${data.summary}</div>
      </div>
      ` : ''}

      ${data.keywords ? `
      <div class="section">
        <div class="section-title">🔑 Key Topics</div>
        <div class="content-box">${data.keywords}</div>
      </div>
      ` : ''}

      ${data.transcript ? `
      <div class="section">
        <div class="section-title">📜 Transcript</div>
        <div class="content-box" style="font-family: monospace; white-space: pre-wrap; max-height: 200px; overflow-y: auto;">${data.transcript}</div>
      </div>
      ` : ''}

      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
        <strong>U-Speak Pro</strong> - Video Analysis Platform<br>
        Report generated automatically from video analysis data
      </div>
    </body>
    </html>
  `;
}

// Browser-only PDF export function
export async function exportToPDF(
  analysisData: any,
  poseData: any,
  userData?: any
): Promise<void> {
  try {
    console.log('🚀 PDF Export Started (Client-side)');
    console.log('📊 Analysis Data:', analysisData);
    console.log('🎭 Pose Data:', poseData);
    console.log('👤 User Data:', userData);
    
    // Ensure we're in browser environment
    if (typeof window === 'undefined') {
      console.error('❌ Not in browser environment');
      throw new Error('PDF export can only be used in the browser');
    }

    // Validate data - be more specific about what's missing
    if (!analysisData && !poseData) {
      console.error('❌ No data available');
      console.log('Analysis data exists:', !!analysisData);
      console.log('Pose data exists:', !!poseData);
      throw new Error('No analysis data available for PDF export');
    }

    console.log('📦 Loading html2pdf library...');
    
    // Dynamic import that works better with Next.js
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default;
    
    console.log('✅ html2pdf loaded successfully');

    // Transform data
    const reportData: SimplifiedReportData = {
      videoInfo: {
        filename: analysisData?.filename || 'Unknown Video',
        duration: analysisData?.duration || 'Unknown',
        file_size: analysisData?.file_size || 'Unknown',
        language: analysisData?.language || 'Unknown'
      },
      contentMetrics: analysisData?.content_assessment ? {
        word_power_score: analysisData.content_assessment.word_power_score,
        word_power_percentage: analysisData.content_assessment.word_power_percentage,
        clarity_score: analysisData.content_assessment.clarity_score,
        fluency_score: analysisData.content_assessment.fluency_score,
        word_count: analysisData.content_assessment.word_count,
        vocabulary_diversity: analysisData.content_assessment.vocabulary_diversity
      } : undefined,
      vocalMetrics: poseData?.audio ? {
        volume_db: poseData.audio.volume_db,
        mean_pitch_hz: poseData.audio.mean_pitch_hz,
        pitch_range: poseData.audio.pitch_range,
        num_pauses: poseData.audio.num_pauses,
        spoken_duration_sec: poseData.audio.spoken_duration_sec,
        duration_sec: poseData.audio.duration_sec
      } : undefined,
      bodyLanguageMetrics: poseData && poseData.frames_processed > 0 ? {
        frames_processed: poseData.frames_processed,
        smiles: poseData.smiles || '0 (0%)',
        eye_contact: poseData.eye_contact || '0 (0%)',
        hand_moves: poseData.hand_moves || '0 (0%)',
        head_moves: poseData.head_moves || '0 (0%)'
      } : undefined,
      userInfo: userData?.name ? {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department
      } : undefined,
      transcript: analysisData?.corrected_transcript || analysisData?.original_transcript,
      summary: analysisData?.summary,
      keywords: analysisData?.keywords
    };

    console.log('📋 Report data prepared');
    console.log('📋 Final report data:', JSON.stringify(reportData, null, 2));

    // Generate HTML
    const htmlContent = generatePDFHTML(reportData);
    console.log('📄 HTML generated, length:', htmlContent.length);
    console.log('📄 HTML preview (first 1000 chars):', htmlContent.substring(0, 1000));

    // Validate HTML has actual content
    if (htmlContent.length < 1000) {
      console.error('❌ Generated HTML is too short:', htmlContent.length);
      console.log('HTML content:', htmlContent);
      throw new Error('Generated HTML content is insufficient');
    }

    // Create element in a completely isolated container
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute !important;
      left: -9999px !important;
      top: -9999px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
      z-index: -9999 !important;
      transform: translateZ(0) !important;
      will-change: auto !important;
      clip: rect(0, 0, 0, 0) !important;
      clip-path: inset(50%) !important;
    `;
    
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    element.style.cssText = `
      width: 800px !important;
      min-height: 1000px !important;
      background-color: white !important;
      color: #333 !important;
      font-family: Arial, sans-serif !important;
      padding: 20px !important;
      box-sizing: border-box !important;
      overflow: visible !important;
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      visibility: hidden !important;
      opacity: 0 !important;
    `;
    
    container.appendChild(element);
    document.body.appendChild(container);
    console.log('📦 Element added to DOM (completely isolated)');
    
    // Force layout calculation
    element.offsetHeight;
    element.offsetWidth;
    
    // Wait for DOM to settle
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('📏 Element dimensions:', {
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
      offsetHeight: element.offsetHeight,
      offsetWidth: element.offsetWidth,
      hasContent: element.innerHTML.length > 0
    });
    
    console.log('📏 Element dimensions after settling:', {
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
      offsetHeight: element.offsetHeight,
      offsetWidth: element.offsetWidth,
      clientHeight: element.clientHeight,
      clientWidth: element.clientWidth,
      hasContent: element.innerHTML.length > 0,
      computedStyle: window.getComputedStyle(element).display,
      visibility: window.getComputedStyle(element).visibility,
      opacity: window.getComputedStyle(element).opacity,
      position: window.getComputedStyle(element).position
    });

    // Check if element is actually visible to html2canvas
    const rect = element.getBoundingClientRect();
    console.log('📐 Element bounding rect:', rect);
    
    if (rect.width === 0 || rect.height === 0) {
      console.error('❌ Element has zero dimensions, html2canvas cannot capture it');
      throw new Error('Element has zero dimensions and cannot be captured');
    }

    // Configure options for better PDF generation
    const options = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `video-analysis-${reportData.videoInfo.filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
      image: { 
        type: 'jpeg', 
        quality: 0.95 
      },
      html2canvas: { 
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true,
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      }
    };

    console.log('🔄 Starting PDF generation...');
    console.log('📏 Element dimensions:', {
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
      offsetHeight: element.offsetHeight,
      offsetWidth: element.offsetWidth,
      hasContent: element.innerHTML.length > 0
    });

    // Generate PDF using html2pdf
    console.log('🏭 Starting html2pdf generation...');
    
    try {
      await html2pdf().set(options).from(element).save();
      console.log('✅ PDF generated and downloaded successfully');
    } catch (pdfError) {
      console.error('❌ PDF generation failed:', pdfError);
      throw pdfError;
    }
    
    // Cleanup - ensure complete removal
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    console.log('🧹 Cleanup completed');

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default exportToPDF;
