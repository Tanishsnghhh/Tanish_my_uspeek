/**
 * 🖼️ Enhanced Video Thumbnail API
 * Serves dynamic thumbnail frames from MongoDB video analysis collection
 * Enhanced to serve embedded thumbnails directly from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat, readdir } from 'fs/promises';
import { join } from 'path';
import { connectDB } from '@/lib/mongodb';
import { enhancedVideoService } from '@/lib/video-analysis-mongodb-enhancement';

export async function GET(
  request: NextRequest,
  { params }: { params: { uploadId: string } }
) {
  try {
    const uploadId = params.uploadId;
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const frameIndex = parseInt(searchParams.get('frameIndex') || '-1'); // -1 for primary thumbnail
    
    console.log(`🖼️ Enhanced Thumbnail Request for uploadId: ${uploadId}, frameIndex: ${frameIndex}`);

    // First, try to get thumbnail from MongoDB (enhanced approach)
    try {
      const thumbnailData = await enhancedVideoService.getThumbnailFromMongoDB(
        uploadId,
        accountId || undefined,
        frameIndex
      );

      if (thumbnailData) {
        // Serve thumbnail directly from MongoDB
        const imageBuffer = Buffer.from(thumbnailData.imageData, 'base64');
        const imageUint8Array = new Uint8Array(imageBuffer);
        
        console.log(`✅ Serving embedded thumbnail from MongoDB: ${uploadId} (${imageBuffer.length} bytes)`);
        
        return new NextResponse(imageUint8Array, {
          headers: {
            'Content-Type': thumbnailData.mimeType,
            'Cache-Control': 'public, max-age=3600',
            'Content-Disposition': `inline; filename="thumbnail_${uploadId}_${frameIndex}.jpg"`,
            'X-Thumbnail-Source': 'mongodb-embedded'
          },
        });
      }
    } catch (mongoError) {
      console.log(`⚠️ MongoDB thumbnail access failed, falling back to filesystem: ${mongoError}`);
    }

    // Fallback: Legacy filesystem approach (for backwards compatibility)
    console.log(`🔄 Using legacy filesystem approach for ${uploadId}...`);
    
    let frameFile: string | null = null;
    let framePath = '';

    // Query MongoDB for video analysis data
    if (uploadId) {
      try {
        const { db } = await connectDB();
        const videoAnalysisCollection = db.collection('video_analysis');
        
        const query = { 'uploadInfo.uploadId': uploadId };
        const videoAnalysis = await videoAnalysisCollection.findOne(query);
        
        if (videoAnalysis) {
          console.log(`✅ Found video analysis for: ${videoAnalysis.uploadInfo?.filename || 'Unknown'}`);
          
          const framesDir = join(process.cwd(), 'main', 'media', 'output_frames');
          const filename = videoAnalysis.uploadInfo?.filename;
          
          try {
            const frameFiles = await readdir(framesDir);
            
            // Try to find frames that match the video filename
            let videoFrames = frameFiles.filter(file => {
              if (!file.includes('frame_') || !file.endsWith('.jpg')) return false;
              if (filename) {
                // Try to match based on filename patterns
                const baseName = filename.replace(/\.[^/.]+$/, '').toLowerCase();
                return file.toLowerCase().includes(baseName) || 
                       file.toLowerCase().includes(uploadId);
              }
              return true;
            }).sort();
            
            // If no specific frames found, use any available frame but prefer first ones
            if (videoFrames.length === 0) {
              videoFrames = frameFiles
                .filter(file => file.includes('frame_') && file.endsWith('.jpg'))
                .sort();
            }
            
            if (videoFrames.length > 0) {
              // Use a consistent frame for the same uploadId or specified index
              const selectedIndex = frameIndex >= 0 && frameIndex < videoFrames.length ? frameIndex : 0;
              frameFile = videoFrames[selectedIndex];
              framePath = join(framesDir, frameFile);
              console.log(`📸 Selected frame: ${frameFile} for ${filename} (index: ${selectedIndex})`);
            }
          } catch (dirError) {
            console.log(`⚠️ Could not read frames directory: ${dirError}`);
          }
        } else {
          console.log(`⚠️ No video analysis found for uploadId: ${uploadId}`);
        }
      } catch (dbError) {
        console.log(`⚠️ MongoDB query failed: ${dbError}`);
      }
    }

    // Fallback: try to find frames directly by uploadId pattern
    if (!frameFile && uploadId) {
      const framesDir = join(process.cwd(), 'main', 'media', 'output_frames');
      
      try {
        const frameFiles = await readdir(framesDir);
        const matchingFrames = frameFiles
          .filter(file => 
            file.includes('frame_') && 
            file.endsWith('.jpg') && 
            file.includes(uploadId)
          )
          .sort();
          
        if (matchingFrames.length > 0) {
          const selectedIndex = frameIndex >= 0 && frameIndex < matchingFrames.length ? frameIndex : 0;
          frameFile = matchingFrames[selectedIndex];
          framePath = join(framesDir, frameFile);
          console.log(`📸 Found direct match: ${frameFile} (index: ${selectedIndex})`);
        }
      } catch (error) {
        console.log(`⚠️ Direct frame search failed: ${error}`);
      }
    }

    // Last resort: return a frame based on uploadId hash to ensure different images
    if (!frameFile) {
      const framesDir = join(process.cwd(), 'main', 'media', 'output_frames');
      
      try {
        const frameFiles = await readdir(framesDir);
        const availableFrames = frameFiles
          .filter(file => file.includes('frame_') && file.endsWith('.jpg'))
          .sort();
        
        if (availableFrames.length > 0) {
          // Use uploadId hash to consistently select different frames for different uploadIds
          const hash = uploadId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0);
          
          const defaultIndex = Math.abs(hash) % availableFrames.length;
          const selectedIndex = frameIndex >= 0 && frameIndex < availableFrames.length ? frameIndex : defaultIndex;
          
          frameFile = availableFrames[selectedIndex];
          framePath = join(framesDir, frameFile);
          console.log(`📸 Using hash-selected frame: ${frameFile} (index ${selectedIndex}/${availableFrames.length}) for uploadId: ${uploadId}`);
        }
      } catch (error) {
        console.log(`⚠️ Could not read frames directory: ${error}`);
      }
    }

    // If still no frame found, return 404
    if (!frameFile) {
      console.log(`❌ No frame found for uploadId: ${uploadId}`);
      return new NextResponse('Thumbnail not found', { status: 404 });
    }

    // Read and serve the frame file
    const imageBuffer = await readFile(framePath);
    const imageUint8Array = new Uint8Array(imageBuffer);

    // Determine content type
    const contentType = frameFile.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    console.log(`✅ Serving filesystem frame: ${frameFile} (${imageBuffer.length} bytes) for uploadId: ${uploadId}`);

    return new NextResponse(imageUint8Array, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': `inline; filename="${frameFile}"`,
        'X-Thumbnail-Source': 'filesystem-fallback'
      },
    });

  } catch (error) {
    console.error('❌ Thumbnail API Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Enhanced helper function to generate thumbnail URL with options
export function generateThumbnailUrl(
  uploadId: string, 
  accountId?: string,
  frameIndex?: number
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const params = new URLSearchParams();
  
  if (accountId) {
    params.append('accountId', accountId);
  }
  
  if (frameIndex !== undefined && frameIndex >= 0) {
    params.append('frameIndex', frameIndex.toString());
  }
  
  const queryString = params.toString();
  return `${baseUrl}/api/video-analysis/thumbnail/${uploadId}${queryString ? `?${queryString}` : ''}`;
}

// Helper function to generate multiple thumbnail URLs for gallery/carousel
export function generateMultipleThumbnailUrls(
  uploadId: string,
  accountId?: string,
  frameCount: number = 5
): string[] {
  const urls: string[] = [];
  
  for (let i = 0; i < frameCount; i++) {
    urls.push(generateThumbnailUrl(uploadId, accountId, i));
  }
  
  return urls;
}
