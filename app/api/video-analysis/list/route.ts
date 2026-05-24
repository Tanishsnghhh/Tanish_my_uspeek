/**
 * 📋 Video Analysis List API - MongoDB Integration
 * Retrieves all video analyses for an account from MongoDB
 * Account-based isolation for multi-tenant security
 */

import { NextRequest, NextResponse } from 'next/server';
import { videoAnalysisService } from '@/lib/services/video-analysis-service';
import connectDB from '@/lib/database';
import { User } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    // Get account ID from headers or query params
    const accountId = request.headers.get('x-account-id') || 
                     request.headers.get('Account-ID') || 
                     request.headers.get('account-id') || 
                     request.nextUrl.searchParams.get('accountId') ||
                     'default';
    
    // Get user information from headers
    const userIdHeader = request.headers.get('x-user-id') || 'guest:unknown';
    const [userRole, userId] = userIdHeader.split(':');
    const isAdmin = userRole === 'ADMIN' || userRole === 'CORPORATE_ADMIN';
    
    // Get query parameters for filtering
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const skip = parseInt(request.nextUrl.searchParams.get('skip') || '0');
    const sortBy = request.nextUrl.searchParams.get('sortBy') || 'uploadDate';
    const sortOrder = request.nextUrl.searchParams.get('sortOrder') || 'desc';
    const search = request.nextUrl.searchParams.get('search') || '';
    const dateFrom = request.nextUrl.searchParams.get('dateFrom');
    const dateTo = request.nextUrl.searchParams.get('dateTo');
    const status = request.nextUrl.searchParams.get('status');
    const performanceLevel = request.nextUrl.searchParams.get('performanceLevel');
    const language = request.nextUrl.searchParams.get('language');
    const minDuration = request.nextUrl.searchParams.get('minDuration');
    const maxDuration = request.nextUrl.searchParams.get('maxDuration');
    
    console.log(`📋 Getting video analysis list for Account: ${accountId}, User: ${userRole}:${userId}, IsAdmin: ${isAdmin}`);
    
    // Get video analyses from MongoDB with user filtering (without search for now)
    let videoAnalyses = await videoAnalysisService.listVideoAnalyses(accountId, {
      limit: 1000, // Get more results to filter client-side
      skip: 0,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
      search: '', // Remove search from DB query
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      status: status || undefined,
      performanceLevel: performanceLevel || undefined,
      language: language || undefined,
      minDuration: minDuration ? parseFloat(minDuration) : undefined,
      maxDuration: maxDuration ? parseFloat(maxDuration) : undefined,
      userId: isAdmin ? undefined : userIdHeader, // Pass full userId header for filtering
      userRole: isAdmin ? undefined : userRole
    });
    
    // If no videos found and account is not 'default', also search default account for legacy videos
    if (videoAnalyses.length === 0 && accountId !== 'default') {
      console.log(`🔍 No videos found for account ${accountId}, searching default account for legacy videos...`);
      videoAnalyses = await videoAnalysisService.listVideoAnalyses('default', {
        limit: 1000,
        skip: 0,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
        search: '',
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        userId: isAdmin ? undefined : userId,
        userRole: isAdmin ? undefined : userRole
      });
    }
    
    // Fetch employee names for userIds
    const userIdMap = new Map<string, { name: string; email: string; role: string }>();
    const uniqueUserIds = new Set<string>();
    
    videoAnalyses.forEach(analysis => {
      if (analysis.uploadInfo.userId && analysis.uploadInfo.userId.startsWith('EMPLOYEE:')) {
        uniqueUserIds.add(analysis.uploadInfo.userId);
      }
    });
    
    if (uniqueUserIds.size > 0) {
      try {
        await connectDB();
        const userIds = Array.from(uniqueUserIds).map(uid => uid.replace('EMPLOYEE:', ''));
        const users = await User!.find({ _id: { $in: userIds } }).select('_id firstName lastName email role').lean();
        
        users.forEach(user => {
          const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
          userIdMap.set(`EMPLOYEE:${user._id}`, {
            name: fullName || 'Unknown Employee',
            email: user.email,
            role: user.role
          });
        });
      } catch (error) {
        console.warn('Failed to fetch employee names:', error);
      }
    }
    
    // Apply client-side search filtering if search term is provided
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      videoAnalyses = videoAnalyses.filter(analysis => {
        // Search in filename
        if (analysis.uploadInfo.filename.toLowerCase().includes(searchLower)) return true;
        
        // Search in employee name
        const employeeInfo = userIdMap.get(analysis.uploadInfo.userId || '');
        if (employeeInfo && employeeInfo.name.toLowerCase().includes(searchLower)) return true;
        
        // Search in transcript summary
        if (analysis.transcript?.summary && analysis.transcript.summary.toLowerCase().includes(searchLower)) return true;
        
        // Search in transcript keywords
        if (analysis.transcript?.keywords && analysis.transcript.keywords.toLowerCase().includes(searchLower)) return true;
        
        // Search in userId (for backward compatibility)
        if (analysis.uploadInfo.userId && analysis.uploadInfo.userId.toLowerCase().includes(searchLower)) return true;
        
        return false;
      });
    }
    
    // Apply pagination after filtering
    const totalCount = videoAnalyses.length;
    const paginatedAnalyses = videoAnalyses.slice(skip, skip + limit);
    
    // Transform MongoDB data to frontend-friendly format
    const transformedAnalyses = paginatedAnalyses.map(analysis => ({
      id: analysis.uploadInfo.uploadId,
      _id: analysis._id,
      uploadId: analysis.uploadInfo.uploadId, // Add uploadId for dynamic thumbnails
      title: analysis.uploadInfo.filename.replace(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i, ''),
      filename: analysis.uploadInfo.filename,
      speaker: analysis.uploadInfo.userId 
        ? (analysis.uploadInfo.userId.startsWith('EMPLOYEE:') 
            ? `${analysis.uploadInfo.userId} - ${userIdMap.get(analysis.uploadInfo.userId)?.name || 'Unknown Employee'}` 
            : analysis.uploadInfo.userId)
        : 'Unknown Speaker',
      userInfo: userIdMap.get(analysis.uploadInfo.userId || '') || null,
      uploadDate: analysis.uploadInfo.uploadDate,
      duration: analysis.uploadInfo.duration,
      durationSeconds: analysis.uploadInfo.durationSeconds,
      fileSize: analysis.uploadInfo.fileSize,
      language: analysis.uploadInfo.language,
      
      // Scores from analysis
      overallScore: analysis.overallPerformance?.totalScore || 0,
      bodyLanguageScore: analysis.bodyLanguageAnalysis?.overallScore || 0,
      vocalToneScore: analysis.vocalAnalysis?.overallScore || 0,
      wordPowerScore: analysis.wordPowerAnalysis?.overallScore || 0,
      
      // Performance level and insights
      performanceLevel: analysis.overallPerformance?.performanceLevel || 'Beginner',
      title_analysis: analysis.overallPerformance?.title || 'Analysis Complete',
      message: analysis.overallPerformance?.message || 'Analysis completed successfully',
      
      // Processing info
      status: analysis.processingInfo.status,
      stage: analysis.processingInfo.stage,
      progress: analysis.processingInfo.progress,
      processingTime: analysis.processingInfo.processingTime,
      
      // Quality flags
      audioQuality: analysis.processingInfo.qualityFlags?.audioQuality || 'Unknown',
      videoQuality: analysis.processingInfo.qualityFlags?.videoQuality || 'Unknown',
      transcriptionAccuracy: analysis.processingInfo.qualityFlags?.transcriptionAccuracy || 'Unknown',
      
      // Metadata
      version: analysis.metadata?.version || '1.0.0',
      createdAt: analysis.metadata?.createdAt,
      updatedAt: analysis.metadata?.updatedAt,
      
      // Preview data for quick insights
      summary: analysis.transcript?.summary?.slice(0, 150) + (analysis.transcript?.summary?.length > 150 ? '...' : ''),
      keywords: analysis.transcript?.keywords?.split(',') || [],
      wordCount: analysis.transcript?.wordCount,
      sentences: analysis.transcript?.sentences,
      transcript: analysis.transcript?.correctedTranscript || analysis.transcript?.originalTranscript,
      dominantEmotion: analysis.emotionAnalysis?.dominantEmotion,
      confidenceLevel: analysis.confidenceAnalysis?.confidenceLevel,
      strengths: analysis.overallPerformance?.strengths || [],
      improvements: analysis.overallPerformance?.improvements || [],
      
      // Frame metadata for dynamic thumbnails
      framesProcessed: analysis.bodyLanguageAnalysis?.framesProcessed || 0,
      hasFrames: (analysis.bodyLanguageAnalysis?.framesProcessed || 0) > 0,
      
      // Thumbnail with fallback
      thumbnail: getThumbnailForVideo(analysis.uploadInfo.filename, analysis.uploadInfo.uploadId)
    }));
    
    return NextResponse.json({
      success: true,
      data: transformedAnalyses,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: (skip + limit) < totalCount,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(totalCount / limit)
      },
      accountId: accountId
    });

  } catch (error) {
    console.error('❌ Video analysis list error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get video analysis list',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Get appropriate thumbnail for video based on filename or content
 */
function getThumbnailForVideo(filename: string, uploadId?: string): string {
  // If we have frames available, use the dynamic thumbnail API
  if (uploadId) {
    // Return null so the frontend will use the uploadId for dynamic thumbnails
    return '';
  }
  
  // Default thumbnails based on video type/content (fallback only)
  const thumbnails = [
    'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/3184294/pexels-photo-3184294.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/3184295/pexels-photo-3184295.jpeg?auto=compress&cs=tinysrgb&w=400'
  ];
  
  // Use filename hash to consistently pick the same thumbnail
  const hash = filename.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return thumbnails[Math.abs(hash) % thumbnails.length];
}
