import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const DB_NAME = 'uspeak-pro';
const VIDEO_ANALYSIS_COLLECTION = 'video_analysis';
const USERS_COLLECTION = 'users';
const EMPLOYEE_PROFILES_COLLECTION = 'employeeprofiles';

// GET - Fetch video analysis data for super admin
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const videoAnalysisCollection = db.collection(VIDEO_ANALYSIS_COLLECTION);
    const usersCollection = db.collection(USERS_COLLECTION);

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const email = searchParams.get('email') || '';
    const phone = searchParams.get('phone') || '';

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build post-lookup filter for email and phone
    const postLookupFilter: any = {};
    
    if (email) {
      postLookupFilter['userInfo.email'] = { $regex: email, $options: 'i' };
    }

    if (phone) {
      postLookupFilter.$or = [
        { 'userInfo.phone': { $regex: phone, $options: 'i' } },
        { 'employeeProfile.phoneNumber': { $regex: phone, $options: 'i' } }
      ];
    }

    // Fetch videos with user information using aggregation
    const videos = await videoAnalysisCollection.aggregate([
      {
        $lookup: {
          from: 'users',
          let: { 
            userId: { 
              $cond: {
                if: { $regexMatch: { input: '$uploadInfo.userId', regex: '^EMPLOYEE:' } },
                then: { $substr: ['$uploadInfo.userId', 9, -1] }, // Extract ObjectId from "EMPLOYEE:68d16f1bf7e35a47723c0540"
                else: '$uploadInfo.userId' // Use as-is if not in EMPLOYEE: format
              }
            }
          },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', { $toObjectId: '$$userId' }] } } }
          ],
          as: 'userInfo'
        }
      },
      {
        $lookup: {
          from: 'employeeprofiles',
          let: { 
            userId: { 
              $cond: {
                if: { $regexMatch: { input: '$uploadInfo.userId', regex: '^EMPLOYEE:' } },
                then: { $substr: ['$uploadInfo.userId', 9, -1] }, // Extract ObjectId from "EMPLOYEE:68d16f1bf7e35a47723c0540"
                else: '$uploadInfo.userId' // Use as-is if not in EMPLOYEE: format
              }
            }
          },
          pipeline: [
            { $match: { $expr: { $eq: ['$user_id', { $toObjectId: '$$userId' }] } } }
          ],
          as: 'employeeProfile'
        }
      },
      {
        $addFields: {
          userInfo: { $arrayElemAt: ['$userInfo', 0] },
          employeeProfile: { $arrayElemAt: ['$employeeProfile', 0] }
        }
      },
      {
        $addFields: {
          // Add computed fields after userInfo and employeeProfile are set
          userName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ['$employeeProfile.first_name', { $ifNull: ['$userInfo.firstName', ''] }] },
                  ' ',
                  { $ifNull: ['$employeeProfile.last_name', { $ifNull: ['$userInfo.lastName', ''] }] }
                ]
              }
            }
          },
          userEmail: '$userInfo.email',
          userPhone: {
            $ifNull: ['$employeeProfile.phoneNumber', '$userInfo.phone']
          },
          userContactNumber: {
            $ifNull: ['$employeeProfile.phoneNumber', '$userInfo.phone']
          }
        }
      },
      // Apply post-lookup filters for email and phone
      ...(Object.keys(postLookupFilter).length > 0 ? [{ $match: postLookupFilter }] : []),
      { $sort: { 'uploadInfo.uploadDate': -1 } },
      { $skip: skip },
      { $limit: limit }
    ]).toArray();

    // Get total count for pagination using the same aggregation pipeline
    const countPipeline = [
      {
        $lookup: {
          from: 'users',
          let: { 
            userId: { 
              $cond: {
                if: { $regexMatch: { input: '$uploadInfo.userId', regex: '^EMPLOYEE:' } },
                then: { $substr: ['$uploadInfo.userId', 9, -1] },
                else: '$uploadInfo.userId'
              }
            }
          },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', { $toObjectId: '$$userId' }] } } }
          ],
          as: 'userInfo'
        }
      },
      {
        $lookup: {
          from: 'employeeprofiles',
          let: { 
            userId: { 
              $cond: {
                if: { $regexMatch: { input: '$uploadInfo.userId', regex: '^EMPLOYEE:' } },
                then: { $substr: ['$uploadInfo.userId', 9, -1] },
                else: '$uploadInfo.userId'
              }
            }
          },
          pipeline: [
            { $match: { $expr: { $eq: ['$user_id', { $toObjectId: '$$userId' }] } } }
          ],
          as: 'employeeProfile'
        }
      },
      {
        $addFields: {
          userInfo: { $arrayElemAt: ['$userInfo', 0] },
          employeeProfile: { $arrayElemAt: ['$employeeProfile', 0] }
        }
      },
      // Apply post-lookup filters for email and phone
      ...(Object.keys(postLookupFilter).length > 0 ? [{ $match: postLookupFilter }] : []),
      { $count: 'total' }
    ];
    
    const countResult = await videoAnalysisCollection.aggregate(countPipeline).toArray();
    const totalCount = countResult.length > 0 ? countResult[0].total : 0;

    // Transform the data to match frontend expectations
    const transformedVideos = videos.map(video => {
      const uploadInfo = video.uploadInfo || {};
      const overallPerformance = video.overallPerformance || {};
      const vocalAnalysis = video.vocalAnalysis || {};
      const wordPowerAnalysis = video.wordPowerAnalysis || {};
      // Extract body language analysis - gestures are nested inside bodyLanguageAnalysis.gestures
      const bodyLanguageAnalysis = video.bodyLanguageAnalysis?.gestures || {};
      const confidenceAnalysis = video.confidenceAnalysis || {};
      const sentimentAnalysis = video.sentimentAnalysis || {};
      const transcript = video.transcript || {};
      const processingInfo = video.processingInfo || {};

      return {
        id: video._id.toString(),
        _id: video._id.toString(),
        userName: video.userName?.trim() || 'Unknown User',
        emailId: video.userEmail || 'N/A',
        contactNumber: video.userContactNumber || 'N/A',
        videoType: 'General', // Default value
        videoName: uploadInfo.filename || 'Unknown Video',
        overallScore: overallPerformance.totalScore || 0,
        bodyLangScore: video.bodyLanguageAnalysis?.overallScore || 0,
        wordPowerScore: wordPowerAnalysis.overallScore || 0,
        vocalToneScore: vocalAnalysis.overallScore || 0,
        processingStatus: processingInfo.status || 'unknown',
        uploadDate: uploadInfo.uploadDate ? new Date(uploadInfo.uploadDate).toLocaleDateString('en-GB') : 'N/A',
        lastUpdateDate: video.metadata?.updatedAt ? new Date(video.metadata.updatedAt).toLocaleDateString('en-GB') : 'N/A',
        duration: uploadInfo.durationSeconds || 0,
        fileSize: uploadInfo.fileSize || 0,
        language: uploadInfo.language || 'en',
        confidenceScore: confidenceAnalysis.overallConfidence || 0,
        engagementScore: confidenceAnalysis.engagementScore || 0,
        anxietyScore: confidenceAnalysis.nervousnessScore || 0,
        positiveEmotion: sentimentAnalysis.positiveScore || 0,
        negativeEmotion: sentimentAnalysis.negativeScore || 0,
        textSentiment: sentimentAnalysis.overallSentiment || 'neutral',
        speechRate: vocalAnalysis.audio?.meanPitchHz || 0,
        averageVolume: vocalAnalysis.audio?.volumeDb || 0,
        modulation: vocalAnalysis.quality?.modulation || 0,
        wordCount: transcript.wordCount || 0,
        keywords: transcript.keywords || '',
        summary: transcript.summary || '',
        originalTranscript: transcript.originalTranscript || '',
        correctedTranscript: transcript.correctedTranscript || '',
         // Body language scores - extract count values from nested bodyLanguageAnalysis structure
         eyeContact: bodyLanguageAnalysis?.eyeContact?.count || 0,
         smile: bodyLanguageAnalysis?.smiles?.count || 0,
         hands: bodyLanguageAnalysis?.handMovement?.count || 0,
         headMovement: bodyLanguageAnalysis?.headMovement?.count || 0,
         legsBalanced: bodyLanguageAnalysis?.legMovement?.count || 0,
         handCrossed: 0, // Not available in current data structure
         wristClosed: 0, // Not available in current data structure
         legsMovement: bodyLanguageAnalysis?.legMovement?.count || 0,
         weightOneLeg: bodyLanguageAnalysis?.footMovement?.count || 0,
        // Additional fields for compatibility
        questionOne: 'N/A',
        questionTwo: 'N/A',
        questionThree: 'N/A',
        questionFive: 'N/A',
        questionSix: 'N/A',
        questionSeven: 'N/A',
        jobRole: 'N/A',
        whatKind: 'General',
        video: uploadInfo.filePath || '',
        textEmotions: sentimentAnalysis.overallSentiment || 'neutral',
        dataUsed: `${Math.round((uploadInfo.fileSize || 0) / 1024 / 1024 * 100) / 100}MB`,
        uniqueWords: wordPowerAnalysis.contentAssessment?.vocabularyDiversity || 0,
        sentLen: wordPowerAnalysis.sentenceStructure?.avgWordsPerSentence || 0,
        lused: 0,
        petWords: '',
        fillers: wordPowerAnalysis.fluency?.fillerWordsPercentage || 0,
        type: 'General'
      };
    });

    // Get video upload trends (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const videoUploadTrends = await videoAnalysisCollection.aggregate([
      {
        $match: {
          'uploadInfo.uploadDate': { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$uploadInfo.uploadDate' },
            month: { $month: '$uploadInfo.uploadDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]).toArray();

    // Format the trends data
    const formattedTrends = videoUploadTrends.map(trend => ({
      month: `${new Date(trend._id.year, trend._id.month - 1).toLocaleDateString('en-US', { month: 'short' })} ${trend._id.year.toString().slice(-2)}`,
      count: trend.count,
      formattedMonth: `${new Date(trend._id.year, trend._id.month - 1).toLocaleDateString('en-US', { month: 'short' })} '${trend._id.year.toString().slice(-2)}`
    }));

    console.log('Video analysis stats:', { 
      totalVideos: totalCount, 
      currentPage: page,
      videosReturned: transformedVideos.length, 
      trendsCount: formattedTrends.length 
    });

    // Debug: Log first video's body language data
    if (videos.length > 0) {
      console.log('Video body language debug:', {
        videoName: videos[0].uploadInfo?.filename,
        hasBodyLanguageAnalysis: !!videos[0].bodyLanguageAnalysis,
        bodyLanguageAnalysisFull: JSON.stringify(videos[0].bodyLanguageAnalysis),
        allVideoKeys: Object.keys(videos[0]).sort(),
        uploadInfo: videos[0].uploadInfo,
        processingInfo: videos[0].processingInfo
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        videos: transformedVideos,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit,
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        },
        videoUploadTrends: formattedTrends
      }
    });

  } catch (error: any) {
    console.error('Error fetching video analysis data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch video analysis data',
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
