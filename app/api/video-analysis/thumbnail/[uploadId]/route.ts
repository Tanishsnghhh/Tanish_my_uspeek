/**
 * 🖼️ Enhanced Video Thumbnail API
 * Serves dynamic t      if (doc && !doc.videoFrames) {
        const framesDir = join(process.cwd(), 'main', 'media', 'output_frames');
        
        const extractionOk = await enhancedVideoService.extractAndStoreThumbnails(
          uploadId,
          (accountId as string) || doc.uploadInfo?.accountId || 'default',
          framesDir,
          5
        );
        
      }from MongoDB video analysis collection
 * Enhanced to serve embedded thumbnails directly from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat, readdir } from 'fs/promises';
import { join } from 'path';
import { connectDB } from '@/lib/mongodb';
import { enhancedVideoService } from '@/lib/video-analysis-mongodb-enhancement';

// Note: In newer Next.js versions (e.g., 15 canary), `params` may be a Promise.
// We normalize by always awaiting it so the handler works across versions.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const resolvedParams = await params;
    const uploadId = resolvedParams.uploadId;
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const userId = searchParams.get('userId');
    const frameIndex = parseInt(searchParams.get('frameIndex') || '-1'); // -1 for primary thumbnail
    
  // First, try to get thumbnail from MongoDB (enhanced approach)
    try {
      const thumbnailData = await enhancedVideoService.getThumbnailFromMongoDB(
        uploadId,
        accountId || userId || undefined,
        frameIndex
      );

      if (thumbnailData) {
        // Serve thumbnail directly from MongoDB
        const imageBuffer = Buffer.from(thumbnailData.imageData, 'base64');
        const imageUint8Array = new Uint8Array(imageBuffer);
        
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
    }

    // Auto-extraction: if no thumbnail present yet, attempt to extract & store on-demand
    try {
      const { db } = await connectDB();
      const videoAnalysisCollection = db.collection('video_analysis');
      const doc = await videoAnalysisCollection.findOne({ 'uploadInfo.uploadId': uploadId });
      
      if (doc) {
      }
      
      if (doc && !doc.videoFrames) {
        console.log(`🛠️ On-demand thumbnail embedding for ${uploadId} (no videoFrames in MongoDB)`);
        const framesDir = join(process.cwd(), 'main', 'media', 'output_frames');
        
        console.log(`📂 Checking frames directory: ${framesDir}`);
        
        const extractionOk = await enhancedVideoService.extractAndStoreThumbnails(
          uploadId,
          (accountId as string) || (userId as string) || doc.uploadInfo?.accountId || doc.uploadInfo?.userId || 'default',
          framesDir,
          5
        );
        
        console.log(`🎯 Extraction result: ${extractionOk ? 'SUCCESS' : 'FAILED'}`);
        
        if (extractionOk) {
          // Re-attempt fetch from Mongo now that we've extracted
            const newlyEmbedded = await enhancedVideoService.getThumbnailFromMongoDB(
              uploadId,
              accountId || userId || undefined,
              frameIndex
            );
            if (newlyEmbedded) {
              const imgBuf = Buffer.from(newlyEmbedded.imageData, 'base64');
              console.log(`✅ On-demand embedded thumbnail served for ${uploadId} (${imgBuf.length} bytes)`);
              return new NextResponse(new Uint8Array(imgBuf), {
                headers: {
                  'Content-Type': newlyEmbedded.mimeType,
                  'Cache-Control': 'public, max-age=3600',
                  'Content-Disposition': `inline; filename="thumbnail_${uploadId}_${frameIndex}.jpg"`,
                  'X-Thumbnail-Source': 'mongodb-embedded-auto'
                }
              });
            } else {
            }
        } else {
        }
      } else {
      }
    } catch (autoError) {
    }

    // Fallback: Legacy filesystem approach (for backwards compatibility)
    
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
          const hash = uploadId.split('').reduce((a: number, b: string) => {
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
