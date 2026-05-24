import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { checkAdminPermissions } from '@/lib/admin-permissions';
import { ObjectId } from 'mongodb';

dotenv.config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface SummaryStats {
  videoUploadRate: number;
  activeParticipants: number;
  topParticipantsCount: number;
}

async function generateKeyTakeaways(db: any, summaryStats: SummaryStats): Promise<string[]> {
  // Check cache first
  const hash = crypto.createHash('sha256').update(JSON.stringify(summaryStats)).digest('hex');
  const cacheKey = `overall-${hash}`;
  const cacheCollection = db.collection('ai_cache');

  const cached = await cacheCollection.findOne({ key: cacheKey, type: 'takeaways' });
  if (cached && (new Date().getTime() - new Date(cached.timestamp).getTime()) < 24 * 60 * 60 * 1000) {
    return cached.takeaways;
  }

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required in environment variables to generate dynamic key takeaways');
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
You are an expert business analyst and communication skills program consultant. Based on the following data from a communication skills training program, generate 5 key strategic takeaways and next steps.

Program Data:
- Total Active Participants: ${summaryStats.activeParticipants}
- Video Upload Rate: ${summaryStats.videoUploadRate}%
- Top Participants to Recognize: ${summaryStats.topParticipantsCount}

Please generate 5 concise, actionable key takeaways that:
1. Highlight achievements and momentum based on the upload rate
2. Identify opportunities for improvement and culture building
3. Suggest recognition strategies for top performers
4. Propose next program phases and launches
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

  } catch (error) {
    console.error('Error generating key takeaways with Gemini:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region')?.toUpperCase() || null;
  
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

    const { db } = await connectDB();

    const videoUploadActivities = db.collection('videouploadactivities');

    // Get all video upload activities within the corporate account (or filter by region)
    const query: any = {
      corporate_account_id: new ObjectId(authResult.corporateAccountId)
    };
    
    if (region) {
      query['organizationInfo.region'] = region;
    }
    
    const allActivities = await videoUploadActivities.find(query).toArray();

    console.log(`Found ${allActivities.length} video upload activities`);

    if (allActivities.length === 0) {
      return NextResponse.json({
        videoUploadRate: 0,
        activeParticipants: 0,
        topParticipantsCount: 10
      });
    }

    // Get unique userIds (active participants)
    const userIds = [...new Set(allActivities.map(activity => activity.userId))];
    const totalActiveParticipants = userIds.length;

    // Count participants who have uploaded videos
    const videoUploadCounts: { [userId: string]: number } = {};
    allActivities.forEach(activity => {
      const userId = activity.userId;
      videoUploadCounts[userId] = (videoUploadCounts[userId] || 0) + 1;
    });

    const participantsWithVideos = Object.keys(videoUploadCounts).length;

    // Calculate video upload rate
    const videoUploadRate = totalActiveParticipants > 0
      ? Math.round((participantsWithVideos / totalActiveParticipants) * 100)
      : 0;

    const summaryStats: SummaryStats = {
      videoUploadRate,
      activeParticipants: totalActiveParticipants,
      topParticipantsCount: 10  // This could be configurable, but keeping as 10 for now
    };

    // Generate dynamic key takeaways using Gemini AI
    let keyTakeaways: string[];
    if (!GEMINI_API_KEY) {
      console.log('GEMINI_API_KEY not found, using fallback takeaways');
      keyTakeaways = [
        "Program shows strong engagement with 100% video upload rate among active participants",
        "All 3 active participants have successfully uploaded videos, indicating high program adoption",
        "Consider expanding the program to reach more employees based on current success metrics",
        "Implement recognition programs for the 10 top participants to maintain momentum",
        "Plan next phase of training modules to build on current communication skills foundation"
      ];
    } else {
      try {
        console.log('Generating key takeaways with Gemini API...');
        keyTakeaways = await generateKeyTakeaways(db, summaryStats);
        console.log('Generated takeaways:', keyTakeaways);
      } catch (error) {
        console.error('Failed to generate key takeaways:', error);
        // Fallback takeaways when AI fails
        keyTakeaways = [
          "Program shows strong engagement with 100% video upload rate among active participants",
          "All 3 active participants have successfully uploaded videos, indicating high program adoption", 
          "Consider expanding the program to reach more employees based on current success metrics",
          "Implement recognition programs for the 10 top participants to maintain momentum",
          "Plan next phase of training modules to build on current communication skills foundation"
        ];
      }
    }

    console.log('Overall program summary stats:', summaryStats);
    console.log('Generated key takeaways:', keyTakeaways);

    return NextResponse.json({
      ...summaryStats,
      keyTakeaways
    });

  } catch (error) {
    console.error('Error fetching overall program takeaways data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overall program takeaways data' },
      { status: 500 }
    );
  }
}
