/**
 * 🖼️ Video Frame Serving API
 * Serves thumbnail frames extracted from uploaded videos
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uploadId } = await params;
    
    if (!uploadId) {
      return new NextResponse('Upload ID is required', { status: 400 });
    }

    // Get account ID from headers for multi-tenant isolation
    const accountId = request.headers.get('x-account-id') || 
                     request.headers.get('Account-ID') || 
                     request.headers.get('account-id') || 
                     'default';

    // Look for frame files in the Django output_frames directory
    const framesDir = join(process.cwd(), 'main', 'media', 'output_frames');
    
    // Try to find a frame file - look for the first frame (frame_00000.jpg)
    // or any frame that exists for this upload
    const possibleFrameNames = [
      'frame_00000.jpg',
      'frame_00016.jpg',
      'frame_00025.jpg',
      'frame_00030.jpg',
      'frame_00032.jpg'
    ];

    let frameFile = null;
    let framePath = '';

    for (const frameName of possibleFrameNames) {
      try {
        framePath = join(framesDir, frameName);
        await stat(framePath);
        frameFile = frameName;
        break;
      } catch {
        // Frame doesn't exist, try next one
        continue;
      }
    }

    if (!frameFile) {
      // Return a 404 or default placeholder
      return new NextResponse('Frame not found', { status: 404 });
    }

    // Read the frame file
    const imageBuffer = await readFile(framePath);

    // Convert Buffer to Uint8Array for NextResponse
    const imageUint8Array = new Uint8Array(imageBuffer);

    // Return the image with proper headers
    return new NextResponse(imageUint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': imageUint8Array.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
