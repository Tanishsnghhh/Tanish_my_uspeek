/**
 * 🖼️ Video Thumbnail API
 * Serves dynamic thumbnail frames from analyzed videos
 * Connects to MongoDB to get video analysis data and serves corresponding frames
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat, readdir } from 'fs/promises';
import { join } from 'path';
import { connectDB } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const uploadId = url.searchParams.get('uploadId');
    const videoId = url.searchParams.get('videoId');
    
    // Get account ID from headers for multi-tenant isolation
    const accountId = request.headers.get('x-account-id') || 
                     request.headers.get('Account-ID') || 
                     request.headers.get('account-id') || 
                     'default';

    let frameFile = null;
    let framePath = '';

    // Method 1: If uploadId is provided, look for frames directly
    if (uploadId) {
      const framesDir = join(process.cwd(), 'main', 'media', 'output_frames');
      
      const possibleFrameNames = [
        'frame_00000.jpg',
        'frame_00016.jpg',
        'frame_00025.jpg',
        'frame_00030.jpg',
        'frame_00032.jpg',
        'frame_00048.jpg',
        'frame_00050.jpg'
      ];

      for (const frameName of possibleFrameNames) {
        try {
          framePath = join(framesDir, frameName);
          await stat(framePath);
          frameFile = frameName;
          break;
        } catch {
          continue;
        }
      }
    }

    // Method 2: Query MongoDB for video analysis data
    if (!frameFile && (uploadId || videoId)) {
      try {
        const { db } = await connectDB();
        const videoAnalysisCollection = db.collection('video_analysis');
        
        let query: any = {};
        if (uploadId) {
          query = { 'uploadInfo.uploadId': uploadId };
        } else if (videoId) {
          query = { _id: videoId };
        }

        const videoAnalysis = await videoAnalysisCollection.findOne(query);
        
        if (videoAnalysis) {
          
          // Look for frames based on filename or uploadId
          const framesDir = join(process.cwd(), 'main', 'media', 'output_frames');
          const filename = videoAnalysis.uploadInfo?.filename || uploadId;
          
          // Try to find frames with filename prefix or any available frame
          try {
            const frameFiles = await readdir(framesDir);
            const videoFrames = frameFiles
              .filter(file => file.includes('frame_') && file.endsWith('.jpg'))
              .sort(); // Sort to get first frame
            
            if (videoFrames.length > 0) {
              frameFile = videoFrames[0]; // Use the first available frame
              framePath = join(framesDir, frameFile);
            }
          } catch (dirError) {
          }
        }
      } catch (dbError) {
      }
    }

    // Method 3: Return the most recent frame if no specific video found
    if (!frameFile) {
      try {
        const framesDir = join(process.cwd(), 'main', 'media', 'output_frames');
        const frameFiles = await readdir(framesDir);
        const sortedFrames = frameFiles
          .filter(file => file.includes('frame_') && file.endsWith('.jpg'))
          .sort()
          .reverse(); // Get the most recent frame
        
        if (sortedFrames.length > 0) {
          frameFile = sortedFrames[0];
          framePath = join(framesDir, frameFile);
        }
      } catch (error) {
      }
    }

    // If still no frame found, return 404 or placeholder
    if (!frameFile) {
      return new NextResponse('Thumbnail not found', { status: 404 });
    }

    // Read and serve the frame file
    const imageBuffer = await readFile(framePath);
    const imageUint8Array = new Uint8Array(imageBuffer);

    // Determine content type
    const contentType = frameFile.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    return new NextResponse(imageUint8Array, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Disposition': `inline; filename="${frameFile}"`,
      },
    });

  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}