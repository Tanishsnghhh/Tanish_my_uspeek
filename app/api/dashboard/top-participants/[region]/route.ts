import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { checkAdminPermissions } from '@/lib/admin-permissions';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface TopParticipant {
  employeeId: string;
  phoneNumber: string;
  circle: string;
  supervisor: string;
  videos: number;
  aos: number;
  abl: number;
  avt: number;
  awp: number;
  maxOS: number;
  minOS: number;
  oir: string;
}

interface TopVideoUpload {
  department: string;
  name: string;
  employeeId: string;
  phoneNumber: string;
  circle: string;
  supervisor: string;
  uploads: number;
}

interface SummaryStats {
  totalActiveParticipants: number;
  videoUploadRate: number;
  averageImprovement: number;
}

async function generateKeyTakeaways(
  db: any,
  summaryStats: SummaryStats,
  topImprovementParticipants: TopParticipant[],
  topVideoUploads: TopVideoUpload[],
  region: string,
  participantsWithVideos: number
): Promise<string[]> {
  // Check cache first
  const hashInput = { summaryStats, topImprovementParticipants, topVideoUploads, region, participantsWithVideos };
  const hash = crypto.createHash('sha256').update(JSON.stringify(hashInput)).digest('hex');
  const cacheKey = `top-${region.toLowerCase()}-${hash}`;
  const cacheCollection = db.collection('ai_cache');

  const cached = await cacheCollection.findOne({ key: cacheKey, type: 'takeaways' });
  if (cached && (new Date().getTime() - new Date(cached.timestamp).getTime()) < 24 * 60 * 60 * 1000) {
    return cached.takeaways;
  }

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required in environment variables to generate dynamic key takeaways');
  }

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `
You are an expert business analyst and communication skills program consultant. Based on the following data from a communication skills training program in the ${region} region, generate 5 key strategic takeaways and next steps.

Program Data:
- Total Active Participants: ${summaryStats.totalActiveParticipants}
- Video Upload Rate: ${summaryStats.videoUploadRate}%
- Average Improvement Rate: ${summaryStats.averageImprovement}%
- Participants with 5+ videos uploaded: ${participantsWithVideos}
- Top 10 Improvement Participants: ${topImprovementParticipants.slice(0, 5).map(p => `${p.employeeId} (${p.oir} improvement)`).join(', ')}
- Top Video Uploaders: ${topVideoUploads.slice(0, 5).map(p => `${p.name} (${p.uploads} videos)`).join(', ')}

Please generate 5 concise, actionable key takeaways that:
1. Highlight achievements and momentum
2. Identify opportunities for improvement
3. Suggest recognition strategies
4. Propose next program phases
5. Include leadership development recommendations

Each takeaway should be a complete sentence, professional, and specific to the data provided. Focus on communication skills development and employee engagement.

Return only the 5 takeaways as a JSON array of strings, no additional text.
`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Try to parse as JSON
      try {
        const takeaways = JSON.parse(text);
        if (Array.isArray(takeaways) && takeaways.length === 5) {
          // Cache the result
          await cacheCollection.updateOne(
            { key: cacheKey, type: 'takeaways' },
            { $set: { takeaways, timestamp: new Date() } },
            { upsert: true }
          );
          return takeaways;
        }
      } catch (parseError) {
        // If parsing fails, extract lines that look like takeaways
        const lines = text.split('\n').filter(line => 
          line.trim().length > 10 && 
          !line.includes('```') && 
          !line.includes('JSON') &&
          !line.includes('[') &&
          !line.includes(']') &&
          !line.startsWith('1.') &&
          !line.startsWith('2.') &&
          !line.startsWith('3.') &&
          !line.startsWith('4.') &&
          !line.startsWith('5.')
        );
        if (lines.length >= 5) {
          const takeaways = lines.slice(0, 5).map(line => line.replace(/^[•\-*]\s*/, '').trim());
          // Cache the result
          await cacheCollection.updateOne(
            { key: cacheKey, type: 'takeaways' },
            { $set: { takeaways, timestamp: new Date() } },
            { upsert: true }
          );
          return takeaways;
        }
      }

      throw new Error('Failed to generate valid key takeaways from Gemini API response');

    } catch (error: any) {
      console.error(`Error generating key takeaways with Gemini (attempt ${retryCount + 1}):`, error);

      // Check if it's a rate limit error (429)
      if (error?.status === 429 && retryCount < maxRetries) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 60000); // Exponential backoff, max 60s
        console.log(`Rate limit hit, retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryCount++;
        continue;
      }

      // If not a rate limit error or max retries reached, throw the error
      throw error;
    }
  }

  throw new Error('Max retries exceeded for Gemini API');
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ region: string }> }) {
  let client: MongoClient | null = null;

  try {
    // Check admin authentication and get corporate account ID
    const authResult = await checkAdminPermissions(request);
    
    if (!authResult.isAuthenticated || !authResult.isAdmin) {
      return NextResponse.json(
        { error: authResult.error || 'Admin authentication required' },
        { status: 401 }
      );
    }

    if (!authResult.corporateAccountId) {
      return NextResponse.json(
        { error: 'Corporate account ID not found' },
        { status: 400 }
      );
    }

    const { region } = await params;
    const regionUpper = region?.toUpperCase() || 'SOUTH';

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('uspeak-pro');

    const videoActivities = db.collection('videouploadactivities');
    const videoAnalysis = db.collection('video_analysis');
    const employeeProfiles = db.collection('employeeprofiles');

    // Get all video activities for the region within the corporate account
    const regionActivities = await videoActivities.find({
      $and: [
        { corporate_account_id: new ObjectId(authResult.corporateAccountId) },
        { 'organizationInfo.region': regionUpper }
      ]
    }).toArray();

    console.log(`Found ${regionActivities.length} activities from ${regionUpper} region`);

    if (regionActivities.length === 0) {
      return NextResponse.json({
        topImprovementParticipants: [],
        topVideoUploads: [],
        summaryStats: {
          totalActiveParticipants: 0,
          videoUploadRate: 0,
          averageImprovement: 0
        },
        keyTakeaways: []
      });
    }

    // Get unique userIds
    const userIds = [...new Set(regionActivities.map(activity => activity.userId))];

    // Get video analysis data for these users within the corporate account
    const analysisData = await videoAnalysis.find({
      $and: [
        { 'uploadInfo.userId': { $in: userIds } },
        {
          $or: [
            { 'uploadInfo.corporate_account_id': new ObjectId(authResult.corporateAccountId) },
            { 'uploadInfo.accountId': authResult.corporateAccountId }
          ]
        }
      ]
    }).toArray();

    console.log(`Found ${analysisData.length} analysis records`);

    // Group analysis by userId
    const userAnalysis: { [userId: string]: any[] } = {};
    analysisData.forEach(analysis => {
      const userId = analysis.uploadInfo?.userId;
      if (userId) {
        if (!userAnalysis[userId]) {
          userAnalysis[userId] = [];
        }
        userAnalysis[userId].push(analysis);
      }
    });

    // Calculate improvement data for each user
    const participantImprovements: TopParticipant[] = [];

    for (const userId of userIds) {
      const activities = regionActivities.filter(act => act.userId === userId);
      const analyses = userAnalysis[userId] || [];

      if (analyses.length === 0) continue;

      // Sort analyses by upload date
      analyses.sort((a, b) => new Date(a.uploadInfo?.uploadDate || 0).getTime() - new Date(b.uploadInfo?.uploadDate || 0).getTime());

      // Get employee info from first activity
      const activity = activities[0];
      const employeeInfo = activity.employeeInfo || {};
      const organizationInfo = activity.organizationInfo || {};

      // Calculate scores
      const overallScores = analyses.map(a => a.wordPowerAnalysis?.overallScore || 0).filter(s => s > 0);
      const bodyLanguageScores = analyses.map(a => a.bodyLanguageAnalysis?.overallScore || 0).filter(s => s > 0);
      const vocalToneScores = analyses.map(a => a.vocalAnalysis?.overallScore || 0).filter(s => s > 0);
      const wordPowerScores = analyses.map(a => a.wordPowerAnalysis?.overallScore || 0).filter(s => s > 0);

      if (overallScores.length === 0) continue;

      // Calculate improvement rate
      let improvementRate = 0;
      const latestScore = overallScores[overallScores.length - 1];

      if (overallScores.length >= 2) {
        const firstScore = overallScores[0];
        improvementRate = firstScore > 0 ? ((latestScore - firstScore) / firstScore) * 100 : 0;
      } else {
        const baselineScore = 50;
        improvementRate = latestScore > baselineScore ? ((latestScore - baselineScore) / baselineScore) * 100 : 0;
      }

      // Calculate averages
      const aos = overallScores.reduce((sum, score) => sum + score, 0) / overallScores.length;
      const abl = bodyLanguageScores.length > 0 ? bodyLanguageScores.reduce((sum, score) => sum + score, 0) / bodyLanguageScores.length : 0;
      const avt = vocalToneScores.length > 0 ? vocalToneScores.reduce((sum, score) => sum + score, 0) / vocalToneScores.length : 0;
      const awp = wordPowerScores.length > 0 ? wordPowerScores.reduce((sum, score) => sum + score, 0) / wordPowerScores.length : 0;

      const maxOS = overallScores.length > 0 ? Math.max(...overallScores) : 0;
      const minOS = overallScores.length > 0 ? Math.min(...overallScores) : 0;

      participantImprovements.push({
        employeeId: employeeInfo.employeeId || employeeInfo.id || 'Unknown',
        phoneNumber: employeeInfo.phoneNumber || employeeInfo.phone || 'Unknown',
        circle: organizationInfo.circle || organizationInfo.branch || 'Unknown',
        supervisor: employeeInfo.supervisor || employeeInfo.manager || 'Unknown',
        videos: analyses.length,
        aos: Math.round(aos * 100) / 100,
        abl: Math.round(abl * 100) / 100,
        avt: Math.round(avt * 100) / 100,
        awp: Math.round(awp * 100) / 100,
        maxOS: Math.round(maxOS * 100) / 100,
        minOS: Math.round(minOS * 100) / 100,
        oir: `${Math.round(improvementRate)}%`
      });
    }

    // Sort by improvement rate descending and take top 10
    participantImprovements.sort((a, b) => parseInt(b.oir) - parseInt(a.oir));
    const topImprovementParticipants = participantImprovements.slice(0, 10);

    // Calculate top video uploads
    const videoUploadCounts: { [userId: string]: number } = {};
    regionActivities.forEach(activity => {
      const userId = activity.userId;
      videoUploadCounts[userId] = (videoUploadCounts[userId] || 0) + 1;
    });

    const topVideoUploadsData: TopVideoUpload[] = [];

    // Sort users by upload count descending
    const sortedByUploads = Object.entries(videoUploadCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    for (const [userId, uploads] of sortedByUploads) {
      const activity = regionActivities.find(act => act.userId === userId);
      if (activity) {
        const employeeInfo = activity.employeeInfo || {};
        const organizationInfo = activity.organizationInfo || {};

        topVideoUploadsData.push({
          department: employeeInfo.department || 'Unknown',
          name: employeeInfo.fullName || employeeInfo.name || 'Unknown',
          employeeId: employeeInfo.employeeId || employeeInfo.id || userId,
          phoneNumber: employeeInfo.phoneNumber || employeeInfo.phone || 'Unknown',
          circle: organizationInfo.circle || organizationInfo.branch || 'Unknown',
          supervisor: employeeInfo.supervisor || employeeInfo.manager || 'Unknown',
          uploads
        });
      }
    }

    // Calculate summary stats
    const totalActiveParticipants = userIds.length;
    const participantsWithVideos = Object.keys(videoUploadCounts).length;
    const videoUploadRate = totalActiveParticipants > 0 ? Math.round((participantsWithVideos / totalActiveParticipants) * 100) : 0;
    const averageImprovement = participantImprovements.length > 0
      ? Math.round(participantImprovements.reduce((sum, p) => sum + parseInt(p.oir), 0) / participantImprovements.length)
      : 0;

    const summaryStats: SummaryStats = {
      totalActiveParticipants,
      videoUploadRate,
      averageImprovement
    };

    // Generate dynamic key takeaways using Gemini AI
    let keyTakeaways: string[];
    if (!GEMINI_API_KEY) {
      keyTakeaways = [];
    } else {
      try {
        keyTakeaways = await generateKeyTakeaways(
          db,
          summaryStats,
          topImprovementParticipants,
          topVideoUploadsData,
          regionUpper,
          participantsWithVideos
        );
      } catch (error) {
        console.error('Failed to generate key takeaways:', error);
        keyTakeaways = [];
      }
    }

    return NextResponse.json({
      topImprovementParticipants,
      topVideoUploads: topVideoUploadsData,
      summaryStats,
      keyTakeaways,
      participantsWithVideos
    });

  } catch (error) {
    console.error('Error fetching top participants data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top participants data' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
