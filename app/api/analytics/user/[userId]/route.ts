/**
 * Analytics API Route - User-specific Analytics Dashboard
 * GET /api/analytics/user/[userId]
 * 
 * Returns dynamic analytics data for a specific employee user:
 * - Body Language Score (user-level aggregate)
 * - Vocal Tone Score (user-level aggregate) 
 * - Word Power Score (user-level aggregate)
 * - Overall Communication Score (user-level aggregate)
 * - Overall Score Trend (time series across user's videos)
 * - User's uploaded videos list
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVideoAnalysisCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';

// TypeScript interfaces for the response
interface UserAnalyticsResponse {
  userId: string;
  counts: {
    videos: number;
  };
  scores: {
    bodyLanguageAvg: number | null;
    vocalAvg: number | null;
    wordPowerAvg: number | null;
    overallCommunicationAvg: number | null;
  };
  strengths: Array<{
    area: string;
    score: number;
    description: string;
    category: 'vocal' | 'body' | 'word' | 'overall';
  }>;
  weaknesses: Array<{
    area: string;
    score: number;
    description: string;
    category: 'vocal' | 'body' | 'word' | 'overall';
  }>;
  trend: Array<{
    date: string;
    overall: number | null;
    _id: string;
  }>;
  videos: Array<{
    _id: string;
    filename: string;
    uploadDate: string;
  }>;
  topPerformingVideos: Array<{
    _id: string;
    filename: string;
    uploadDate: string;
    score: number;
    rank: number;
  }>;
  lowPerformingVideos: Array<{
    _id: string;
    filename: string;
    uploadDate: string;
    score: number;
    rank: number;
  }>;
}

interface TrendDataPoint {
  _id: ObjectId;
  date: Date;
  overall: number | null;
  bodyLanguage: number | null;
  vocal: number | null;
  wordPower: number | null;
}

interface VideoData {
  _id: ObjectId;
  filename: string;
  uploadDate: Date;
  overallScore: number | null;
  vocalAnalysis?: any;
  bodyLanguageAnalysis?: any;
  wordPowerAnalysis?: any;
  overallPerformance?: any;
}

// Helper functions to extract strengths and weaknesses
function extractTopStrengths(videos: any[]): Array<{area: string, score: number, description: string, category: 'vocal' | 'body' | 'word' | 'overall'}> {
  const strengthMap = new Map<string, {score: number, descriptions: string[], category: 'vocal' | 'body' | 'word' | 'overall', count: number}>();

  videos.forEach(video => {
    // Extract vocal strengths directly from database
    if (video.vocalAnalysis?.strengths && Array.isArray(video.vocalAnalysis.strengths)) {
      video.vocalAnalysis.strengths.forEach((strength: string) => {
        const key = `vocal_${strength}`;
        if (!strengthMap.has(key)) {
          strengthMap.set(key, {score: video.vocalAnalysis.overallScore || 80, descriptions: [], category: 'vocal', count: 0});
        }
        const entry = strengthMap.get(key)!;
        entry.descriptions.push(strength);
        entry.count++;
        entry.score = Math.max(entry.score, video.vocalAnalysis.overallScore || 80);
      });
    }

    // Extract body language strengths directly from database
    if (video.bodyLanguageAnalysis?.topAreas && Array.isArray(video.bodyLanguageAnalysis.topAreas)) {
      video.bodyLanguageAnalysis.topAreas.forEach((strength: string) => {
        const key = `body_${strength}`;
        if (!strengthMap.has(key)) {
          strengthMap.set(key, {score: video.bodyLanguageAnalysis.overallScore || 95, descriptions: [], category: 'body', count: 0});
        }
        const entry = strengthMap.get(key)!;
        entry.descriptions.push(strength);
        entry.count++;
        entry.score = Math.max(entry.score, video.bodyLanguageAnalysis.overallScore || 95);
      });
    }

    // Extract word power strengths directly from database
    if (video.wordPowerAnalysis?.strengths && Array.isArray(video.wordPowerAnalysis.strengths)) {
      video.wordPowerAnalysis.strengths.forEach((strength: string) => {
        const key = `word_${strength}`;
        if (!strengthMap.has(key)) {
          strengthMap.set(key, {score: video.wordPowerAnalysis.overallScore || 78, descriptions: [], category: 'word', count: 0});
        }
        const entry = strengthMap.get(key)!;
        entry.descriptions.push(strength);
        entry.count++;
        entry.score = Math.max(entry.score, video.wordPowerAnalysis.overallScore || 78);
      });
    }

    // Extract overall strengths directly from database
    if (video.overallPerformance?.strengths && Array.isArray(video.overallPerformance.strengths)) {
      video.overallPerformance.strengths.forEach((strength: string) => {
        const key = `overall_${strength}`;
        if (!strengthMap.has(key)) {
          strengthMap.set(key, {score: video.overallPerformance.totalScore || 84, descriptions: [], category: 'overall', count: 0});
        }
        const entry = strengthMap.get(key)!;
        entry.descriptions.push(strength);
        entry.count++;
        entry.score = Math.max(entry.score, video.overallPerformance.totalScore || 84);
      });
    }
  });

  // Convert to array and sort by score and frequency
  const strengths = Array.from(strengthMap.entries())
    .map(([key, data]) => ({
      area: key.split('_').slice(1).join(' '),
      score: Math.round(data.score),
      description: data.descriptions[0] || 'Strong performance in this area',
      category: data.category
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5

  return strengths;
}

function extractTopWeaknesses(videos: any[]): Array<{area: string, score: number, description: string, category: 'vocal' | 'body' | 'word' | 'overall'}> {
  const weaknessMap = new Map<string, {score: number, descriptions: string[], category: 'vocal' | 'body' | 'word' | 'overall', count: number}>();

  videos.forEach(video => {
    // Extract vocal improvements directly from database
    if (video.vocalAnalysis?.improvements && Array.isArray(video.vocalAnalysis.improvements)) {
      video.vocalAnalysis.improvements.forEach((improvement: string) => {
        const key = `vocal_${improvement}`;
        if (!weaknessMap.has(key)) {
          weaknessMap.set(key, {score: Math.max(0, (video.vocalAnalysis.overallScore || 80) - 30), descriptions: [], category: 'vocal', count: 0});
        }
        const entry = weaknessMap.get(key)!;
        entry.descriptions.push(improvement);
        entry.count++;
        entry.score = Math.min(entry.score, Math.max(0, (video.vocalAnalysis.overallScore || 80) - 30));
      });
    }

    // Extract body language improvements directly from database
    if (video.bodyLanguageAnalysis?.improvements && Array.isArray(video.bodyLanguageAnalysis.improvements)) {
      video.bodyLanguageAnalysis.improvements.forEach((improvement: string) => {
        const key = `body_${improvement}`;
        if (!weaknessMap.has(key)) {
          weaknessMap.set(key, {score: Math.max(0, (video.bodyLanguageAnalysis.overallScore || 95) - 30), descriptions: [], category: 'body', count: 0});
        }
        const entry = weaknessMap.get(key)!;
        entry.descriptions.push(improvement);
        entry.count++;
        entry.score = Math.min(entry.score, Math.max(0, (video.bodyLanguageAnalysis.overallScore || 95) - 30));
      });
    }

    // Extract word power improvements directly from database
    if (video.wordPowerAnalysis?.improvements && Array.isArray(video.wordPowerAnalysis.improvements)) {
      video.wordPowerAnalysis.improvements.forEach((improvement: string) => {
        const key = `word_${improvement}`;
        if (!weaknessMap.has(key)) {
          weaknessMap.set(key, {score: Math.max(0, (video.wordPowerAnalysis.overallScore || 78) - 30), descriptions: [], category: 'word', count: 0});
        }
        const entry = weaknessMap.get(key)!;
        entry.descriptions.push(improvement);
        entry.count++;
        entry.score = Math.min(entry.score, Math.max(0, (video.wordPowerAnalysis.overallScore || 78) - 30));
      });
    }

    // Extract overall improvements directly from database
    if (video.overallPerformance?.improvements && Array.isArray(video.overallPerformance.improvements)) {
      video.overallPerformance.improvements.forEach((improvement: string) => {
        const key = `overall_${improvement}`;
        if (!weaknessMap.has(key)) {
          weaknessMap.set(key, {score: Math.max(0, (video.overallPerformance.totalScore || 84) - 30), descriptions: [], category: 'overall', count: 0});
        }
        const entry = weaknessMap.get(key)!;
        entry.descriptions.push(improvement);
        entry.count++;
        entry.score = Math.min(entry.score, Math.max(0, (video.overallPerformance.totalScore || 84) - 30));
      });
    }
  });

  // Convert to array and sort by lowest score first (most significant weaknesses)
  const weaknesses = Array.from(weaknessMap.entries())
    .map(([key, data]) => ({
      area: key.split('_').slice(1).join(' '),
      score: Math.round(data.score),
      description: data.descriptions[0] || 'Area needing improvement',
      category: data.category
    }))
    .sort((a, b) => a.score - b.score) // Sort by lowest score first
    .slice(0, 5); // Top 5 weaknesses

  return weaknesses;
}

function extractTopPerformingVideos(videos: any[]): Array<{ _id: string; filename: string; uploadDate: string; score: number; rank: number; }> {
  const INDUSTRY_LEVEL_THRESHOLD = 75; // Industry standard threshold
  
  return videos
    .filter(video => video.overallScore !== null && video.overallScore !== undefined && video.overallScore >= INDUSTRY_LEVEL_THRESHOLD)
    .map(video => ({
      _id: video._id.toString(),
      filename: video.filename,
      uploadDate: video.uploadDate.toISOString(),
      score: Math.round(video.overallScore),
      rank: 0 // Will be set after sorting
    }))
    .sort((a, b) => b.score - a.score) // Sort by highest score first
    .slice(0, 3) // Take top 3
    .map((video, index) => ({ ...video, rank: index + 1 }));
}

function extractLowPerformingVideos(videos: any[]): Array<{ _id: string; filename: string; uploadDate: string; score: number; rank: number; }> {
  const INDUSTRY_LEVEL_THRESHOLD = 75; // Industry standard threshold
  
  return videos
    .filter(video => video.overallScore !== null && video.overallScore !== undefined && video.overallScore < INDUSTRY_LEVEL_THRESHOLD)
    .map(video => ({
      _id: video._id.toString(),
      filename: video.filename,
      uploadDate: video.uploadDate.toISOString(),
      score: Math.round(video.overallScore),
      rank: 0 // Will be set after sorting
    }))
    .sort((a, b) => a.score - b.score) // Sort by lowest score first (most significant issues)
    .slice(0, 3) // Take bottom 3
    .map((video, index) => ({ ...video, rank: index + 1 }));
}

interface OverallData {
  videos: number;
  bodyLanguageAvg: number | null;
  vocalAvg: number | null;
  wordPowerAvg: number | null;
  overallCommunicationAvg: number | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Extract JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Decode and verify the JWT token
    const decoded = await verifyToken(token);
    
    if (!decoded || !decoded.userId || !decoded.corporateAccountId) {
      return NextResponse.json(
        { error: 'Invalid token or missing corporate account ID' },
        { status: 401 }
      );
    }

    // Verify that the user is requesting their own data or is an admin
    const cleanUserId = userId.startsWith('EMPLOYEE:') ? userId.replace('EMPLOYEE:', '') : userId;
    const isOwnData = decoded.userId === cleanUserId;
    const isAdmin = decoded.role === 'CORPORATE_ADMIN' || decoded.role === 'ADMIN';

    if (!isOwnData && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied: Can only view own analytics data' },
        { status: 403 }
      );
    }

    // Get the video analysis collection
    const collection = await getVideoAnalysisCollection();

    // Create the aggregation pipeline with corporate account filtering
    const pipeline = [
      {
        $match: {
          'uploadInfo.userId': userId,
          $or: [
            { 'uploadInfo.corporate_account_id': new ObjectId(decoded.corporateAccountId) },
            { 'uploadInfo.accountId': decoded.corporateAccountId }
          ]
        }
      },
      {
        $sort: { 'uploadInfo.uploadDate': 1 } // For stable trend order
      },
      {
        $facet: {
          // Overall aggregates for the user
          overall: [
            {
              $group: {
                _id: '$uploadInfo.userId',
                videos: { $sum: 1 },
                bodyLanguageAvg: { 
                  $avg: {
                    $cond: [
                      { $and: [
                        { $ne: ['$bodyLanguageAnalysis.overallScore', null] },
                        { $gte: ['$bodyLanguageAnalysis.overallScore', 0] }
                      ]},
                      '$bodyLanguageAnalysis.overallScore',
                      '$$REMOVE'
                    ]
                  }
                },
                vocalAvg: { 
                  $avg: {
                    $cond: [
                      { $and: [
                        { $ne: ['$vocalAnalysis.overallScore', null] },
                        { $gte: ['$vocalAnalysis.overallScore', 0] }
                      ]},
                      '$vocalAnalysis.overallScore',
                      '$$REMOVE'
                    ]
                  }
                },
                wordPowerAvg: { 
                  $avg: {
                    $cond: [
                      { $and: [
                        { $ne: ['$wordPowerAnalysis.overallScore', null] },
                        { $gte: ['$wordPowerAnalysis.overallScore', 0] }
                      ]},
                      '$wordPowerAnalysis.overallScore',
                      '$$REMOVE'
                    ]
                  }
                },
                overallCommunicationAvg: { 
                  $avg: {
                    $cond: [
                      { $and: [
                        { $ne: ['$overallPerformance.totalScore', null] },
                        { $gte: ['$overallPerformance.totalScore', 0] }
                      ]},
                      '$overallPerformance.totalScore',
                      '$$REMOVE'
                    ]
                  }
                }
              }
            },
            {
              $project: {
                _id: 0,
                videos: 1,
                bodyLanguageAvg: { 
                  $cond: [
                    { $ne: ['$bodyLanguageAvg', null] },
                    { $round: ['$bodyLanguageAvg', 2] },
                    null
                  ]
                },
                vocalAvg: { 
                  $cond: [
                    { $ne: ['$vocalAvg', null] },
                    { $round: ['$vocalAvg', 2] },
                    null
                  ]
                },
                wordPowerAvg: { 
                  $cond: [
                    { $ne: ['$wordPowerAvg', null] },
                    { $round: ['$wordPowerAvg', 2] },
                    null
                  ]
                },
                overallCommunicationAvg: { 
                  $cond: [
                    { $ne: ['$overallCommunicationAvg', null] },
                    { $round: ['$overallCommunicationAvg', 2] },
                    null
                  ]
                }
              }
            }
          ],
          // Per-video trend series for each metric
          trend: [
            {
              $project: {
                _id: 1,
                date: '$uploadInfo.uploadDate',
                // Per-video overall = prefer totalScore, else mean of available components in THIS doc
                perVideoOverall: {
                  $ifNull: [
                    '$overallPerformance.totalScore',
                    {
                      $let: {
                        vars: {
                          validScores: {
                            $filter: {
                              input: [
                                '$vocalAnalysis.overallScore',
                                '$wordPowerAnalysis.overallScore',
                                '$bodyLanguageAnalysis.overallScore'
                              ],
                              cond: { 
                                $and: [
                                  { $ne: ['$$this', null] },
                                  { $gte: ['$$this', 0] }
                                ]
                              }
                            }
                          }
                        },
                        in: {
                          $cond: [
                            { $gt: [{ $size: '$$validScores' }, 0] },
                            { $avg: '$$validScores' },
                            null
                          ]
                        }
                      }
                    }
                  ]
                },
                bodyLanguage: '$bodyLanguageAnalysis.overallScore',
                vocal: '$vocalAnalysis.overallScore',
                wordPower: '$wordPowerAnalysis.overallScore'
              }
            },
            {
              $project: {
                _id: 1,
                date: 1,
                overall: {
                  $cond: [
                    { $and: [
                      { $ne: ['$perVideoOverall', null] },
                      { $gte: ['$perVideoOverall', 0] }
                    ]},
                    { $round: ['$perVideoOverall', 2] },
                    null
                  ]
                },
                bodyLanguage: {
                  $cond: [
                    { $and: [
                      { $ne: ['$bodyLanguage', null] },
                      { $gte: ['$bodyLanguage', 0] }
                    ]},
                    { $round: ['$bodyLanguage', 2] },
                    null
                  ]
                },
                vocal: {
                  $cond: [
                    { $and: [
                      { $ne: ['$vocal', null] },
                      { $gte: ['$vocal', 0] }
                    ]},
                    { $round: ['$vocal', 2] },
                    null
                  ]
                },
                wordPower: {
                  $cond: [
                    { $and: [
                      { $ne: ['$wordPower', null] },
                      { $gte: ['$wordPower', 0] }
                    ]},
                    { $round: ['$wordPower', 2] },
                    null
                  ]
                }
              }
            },
            { $sort: { date: 1 } }
          ],
          // Minimal video list for the user section
          videos: [
            {
              $project: {
                _id: 1,
                filename: '$uploadInfo.filename',
                uploadDate: '$uploadInfo.uploadDate',
                overallScore: {
                  $ifNull: [
                    '$overallPerformance.totalScore',
                    {
                      $let: {
                        vars: {
                          validScores: {
                            $filter: {
                              input: [
                                '$vocalAnalysis.overallScore',
                                '$wordPowerAnalysis.overallScore',
                                '$bodyLanguageAnalysis.overallScore'
                              ],
                              cond: { 
                                $and: [
                                  { $ne: ['$$this', null] },
                                  { $gte: ['$$this', 0] }
                                ]
                              }
                            }
                          }
                        },
                        in: {
                          $cond: [
                            { $gt: [{ $size: '$$validScores' }, 0] },
                            { $avg: '$$validScores' },
                            null
                          ]
                        }
                      }
                    }
                  ]
                },
                // Include analysis data for strengths/weaknesses extraction
                vocalAnalysis: {
                  overallScore: 1,
                  strengths: 1,
                  improvements: 1
                },
                bodyLanguageAnalysis: {
                  overallScore: 1,
                  topAreas: 1,
                  improvements: 1
                },
                wordPowerAnalysis: {
                  overallScore: 1,
                  strengths: 1,
                  improvements: 1
                },
                overallPerformance: {
                  totalScore: 1,
                  strengths: 1,
                  improvements: 1
                }
              }
            },
            { $sort: { 'uploadInfo.uploadDate': -1 } }
          ]
        }
      }
    ];

    console.log('🔍 Executing analytics aggregation for userId:', userId);

    // Execute the aggregation
    const result = await collection.aggregate(pipeline).toArray();

    if (!result || result.length === 0) {
      console.log('❌ No aggregation results found for userId:', userId);
      
      // Return empty response structure
      const emptyResponse: UserAnalyticsResponse = {
        userId,
        counts: { videos: 0 },
        scores: {
          bodyLanguageAvg: null,
          vocalAvg: null,
          wordPowerAvg: null,
          overallCommunicationAvg: null
        },
        strengths: [],
        weaknesses: [],
        trend: [],
        videos: [],
        topPerformingVideos: [],
        lowPerformingVideos: []
      };

      return NextResponse.json({
        success: true,
        data: emptyResponse
      });
    }

    const aggregationResult = result[0];
    
    // Extract results from facets
    const overallData: OverallData = aggregationResult.overall[0] || {
      videos: 0,
      bodyLanguageAvg: null,
      vocalAvg: null,
      wordPowerAvg: null,
      overallCommunicationAvg: null
    };

    const trendData: TrendDataPoint[] = aggregationResult.trend || [];
    const videoData: VideoData[] = aggregationResult.videos || [];

    // Format the response
    const response: UserAnalyticsResponse = {
      userId,
      counts: {
        videos: overallData.videos
      },
      scores: {
        bodyLanguageAvg: overallData.bodyLanguageAvg,
        vocalAvg: overallData.vocalAvg,
        wordPowerAvg: overallData.wordPowerAvg,
        overallCommunicationAvg: overallData.overallCommunicationAvg
      },
      strengths: extractTopStrengths(videoData),
      weaknesses: extractTopWeaknesses(videoData),
      trend: trendData.map(item => ({
        date: item.date.toISOString(),
        overall: item.overall,
        bodyLanguage: item.bodyLanguage,
        vocal: item.vocal,
        wordPower: item.wordPower,
        _id: item._id.toString()
      })),
      videos: videoData.map(video => ({
        _id: video._id.toString(),
        filename: video.filename,
        uploadDate: video.uploadDate.toISOString()
      })),
      topPerformingVideos: extractTopPerformingVideos(videoData),
      lowPerformingVideos: extractLowPerformingVideos(videoData)
    };

    console.log('✅ Analytics data retrieved successfully for userId:', userId);
    console.log('📊 Data summary:', {
      videoCount: response.counts.videos,
      scores: response.scores,
      trendPoints: response.trend.length
    });

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ Error fetching user analytics:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
