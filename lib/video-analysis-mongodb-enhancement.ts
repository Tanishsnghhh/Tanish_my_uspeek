/**
 * 🎬 Video Analysis MongoDB Enhancement
 * Enhanced schema and service to store video frame thumbnails directly in MongoDB
 * Eliminates dependency on localStorage and filesystem storage
 */

import { ObjectId } from 'mongodb';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { getVideoAnalysisCollection } from './database';

// Enhanced interfaces for thumbnail storage
export interface ThumbnailData {
  frameNumber: number;
  timestamp: number; // Time in seconds
  imageData: string; // Base64 encoded image
  mimeType: string; // image/jpeg, image/png
  width: number;
  height: number;
  fileSize: number; // Size in bytes
  quality: number; // 1-100
  isKeyFrame?: boolean; // True for important frames
}

export interface VideoFrameAnalysis {
  totalFrames: number;
  keyFrames: ThumbnailData[]; // Important frames (3-5 thumbnails)
  primaryThumbnail: ThumbnailData; // Main thumbnail for display
  frameExtractionInfo: {
    extractionDate: Date;
    framesDirectory: string;
    originalFrameCount: number;
    selectedFrameCount: number;
    selectionCriteria: string;
  };
}

export interface EnhancedVideoAnalysisDocument {
  _id?: ObjectId;
  uploadInfo: {
    uploadId: string;
    filename: string;
    fileSize: number;
    duration: string;
    durationSeconds: number;
    uploadDate: Date;
    language: string;
    userId?: string;
    accountId: string;
    filePath?: string;
  };
  
  // Enhanced with embedded thumbnails
  videoFrames: VideoFrameAnalysis;
  
  // Existing analysis data
  transcript?: any;
  vocalAnalysis?: any;
  wordPowerAnalysis?: any;
  bodyLanguageAnalysis?: any;
  sentimentAnalysis?: any;
  emotionAnalysis?: any;
  confidenceAnalysis?: any;
  overallPerformance?: any;
  processingInfo?: any;
  coachingFeedback?: any;
  progressData?: any;
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
  };
}

export class EnhancedVideoAnalysisService {
  /**
   * Convert image file to base64 with metadata
   */
  async imageToBase64(imagePath: string): Promise<ThumbnailData | null> {
    try {
      const imageBuffer = await readFile(imagePath);
      const base64Data = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);
      
      // Extract frame info from filename (e.g., frame_00025.jpg)
      const filename = imagePath.split('/').pop() || '';
      const frameMatch = filename.match(/frame_(\d+)/);
      const frameNumber = frameMatch ? parseInt(frameMatch[1]) : 0;
      
      // Calculate approximate timestamp (assuming 30fps for now)
      const timestamp = frameNumber / 30;
      
      return {
        frameNumber,
        timestamp,
        imageData: base64Data,
        mimeType,
        width: 0, // Could be extracted using image libraries
        height: 0,
        fileSize: imageBuffer.length,
        quality: 85, // Default quality
        isKeyFrame: false
      };
    } catch (error) {
      console.error(`❌ Error converting image to base64: ${imagePath}`, error);
      return null;
    }
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }

  /**
   * Extract and store thumbnails from frames directory
   */
  async extractAndStoreThumbnails(
    uploadId: string,
    accountId: string,
    framesDirectory: string,
    maxThumbnails: number = 5
  ): Promise<boolean> {
    try {
      const collection = await getVideoAnalysisCollection();
      
      // Find available frame files with creation time for upload matching
      const fs = require('fs');
      const path = require('path');
      const frameFilesWithStats = fs.readdirSync(framesDirectory)
        .filter((file: string) => file.includes('frame_') && (file.endsWith('.jpg') || file.endsWith('.png')))
        .map((file: string) => {
          const filePath = path.join(framesDirectory, file);
          const stats = fs.statSync(filePath);
          return { file, mtime: stats.mtime, filePath };
        })
        .sort((a: any, b: any) => b.mtime - a.mtime); // Sort by newest first

      // Get upload date to match frames created around that time
      const videoDoc = await collection.findOne({ 'uploadInfo.uploadId': uploadId });
      const uploadDate = videoDoc?.uploadInfo?.uploadDate;
      
      let frameFiles: string[] = [];
      
      if (uploadDate && frameFilesWithStats.length > 0) {
        // Find frames created within 10 minutes of upload
        const uploadTime = new Date(uploadDate).getTime();
        const matchingFrames = frameFilesWithStats.filter((item: any) => {
          const frameTime = new Date(item.mtime).getTime();
          const timeDiff = Math.abs(frameTime - uploadTime);
          return timeDiff < 10 * 60 * 1000; // 10 minutes tolerance
        });
        
        if (matchingFrames.length > 0) {
          frameFiles = matchingFrames.map((item: any) => item.file).sort();
          console.log(`📸 Found ${frameFiles.length} frames matching upload time for ${uploadId}`);
        } else {
          // Fallback: use most recent frames if no time match
          frameFiles = frameFilesWithStats.slice(0, Math.min(20, frameFilesWithStats.length)).map((item: any) => item.file).sort();
          console.log(`⏰ Using ${frameFiles.length} most recent frames for ${uploadId} (no time match)`);
        }
      } else {
        // Final fallback: use all available frames
        frameFiles = frameFilesWithStats.map((item: any) => item.file).sort();
        console.log(`📁 Using all ${frameFiles.length} available frames for ${uploadId}`);
      }

      if (frameFiles.length === 0) {
        console.log(`⚠️ No frame files found in ${framesDirectory}`);
        return false;
      }

      console.log(`📸 Found ${frameFiles.length} frame files for ${uploadId}`);

      // Select key frames strategically
      const keyFrameIndices = this.selectKeyFrames(frameFiles.length, maxThumbnails);
      const thumbnails: ThumbnailData[] = [];
      
      for (const index of keyFrameIndices) {
        const framePath = join(framesDirectory, frameFiles[index]);
        const thumbnail = await this.imageToBase64(framePath);
        
        if (thumbnail) {
          thumbnail.isKeyFrame = true;
          thumbnails.push(thumbnail);
        }
      }

      if (thumbnails.length === 0) {
        console.log(`❌ No thumbnails could be extracted for ${uploadId}`);
        return false;
      }

      // Create primary thumbnail (usually the middle frame)
      const primaryThumbnail = thumbnails[Math.floor(thumbnails.length / 2)] || thumbnails[0];

      // Create video frames data
      const videoFrames: VideoFrameAnalysis = {
        totalFrames: frameFiles.length,
        keyFrames: thumbnails,
        primaryThumbnail,
        frameExtractionInfo: {
          extractionDate: new Date(),
          framesDirectory,
          originalFrameCount: frameFiles.length,
          selectedFrameCount: thumbnails.length,
          selectionCriteria: 'strategic_key_frames'
        }
      };

      // Update MongoDB document
      const result = await collection.updateOne(
        {
          'uploadInfo.uploadId': uploadId,
          'uploadInfo.accountId': accountId
        },
        {
          $set: {
            videoFrames,
            'metadata.updatedAt': new Date()
          }
        }
      );

      console.log(`✅ Stored ${thumbnails.length} thumbnails for ${uploadId} in MongoDB`);
      return result.modifiedCount > 0;

    } catch (error) {
      console.error('❌ Error extracting and storing thumbnails:', error);
      return false;
    }
  }

  /**
   * Select strategic key frames from available frames
   */
  private selectKeyFrames(totalFrames: number, maxThumbnails: number): number[] {
    if (totalFrames <= maxThumbnails) {
      return Array.from({ length: totalFrames }, (_, i) => i);
    }

    const keyFrames: number[] = [];
    
    // Always include first frame
    keyFrames.push(0);
    
    // Add frames at strategic intervals
    if (maxThumbnails > 2) {
      const interval = Math.floor(totalFrames / (maxThumbnails - 1));
      for (let i = 1; i < maxThumbnails - 1; i++) {
        keyFrames.push(Math.min(i * interval, totalFrames - 1));
      }
    }
    
    // Always include last frame (if different from first)
    if (totalFrames > 1) {
      keyFrames.push(totalFrames - 1);
    }

    return [...new Set(keyFrames)].sort((a, b) => a - b);
  }

  /**
   * Get thumbnail from MongoDB (replaces filesystem access)
   */
  async getThumbnailFromMongoDB(
    uploadId: string,
    accountId?: string,
    frameIndex: number = 0
  ): Promise<{ imageData: string; mimeType: string } | null> {
    try {
      const collection = await getVideoAnalysisCollection();
      
      const query: any = { 'uploadInfo.uploadId': uploadId };
      if (accountId) {
        query['uploadInfo.accountId'] = accountId;
      }

      const document = await collection.findOne(query, {
        projection: { videoFrames: 1 }
      });

      if (!document?.videoFrames) {
        console.log(`❌ No video frames data found for ${uploadId}`);
        return null;
      }

      // Get the requested frame or primary thumbnail
      let thumbnail: ThumbnailData;
      
      if (frameIndex === -1 || !document.videoFrames.keyFrames[frameIndex]) {
        // Return primary thumbnail
        thumbnail = document.videoFrames.primaryThumbnail;
      } else {
        // Return specific key frame
        thumbnail = document.videoFrames.keyFrames[frameIndex];
      }

      if (!thumbnail) {
        console.log(`❌ No thumbnail available for ${uploadId} at index ${frameIndex}`);
        return null;
      }

      return {
        imageData: thumbnail.imageData,
        mimeType: thumbnail.mimeType
      };

    } catch (error) {
      console.error('❌ Error getting thumbnail from MongoDB:', error);
      return null;
    }
  }

  /**
   * Migration utility: Convert existing filesystem thumbnails to MongoDB
   */
  async migrateExistingThumbnails(framesDirectory?: string): Promise<void> {
    try {
      console.log('🔄 Starting thumbnail migration to MongoDB...');
      
      const collection = await getVideoAnalysisCollection();
      const documents = await collection.find({
        'bodyLanguageAnalysis.framesProcessed': { $gt: 0 },
        'videoFrames': { $exists: false } // Only migrate documents without embedded thumbnails
      }).toArray();

      console.log(`📊 Found ${documents.length} documents to migrate`);

      const defaultFramesDir = framesDirectory || join(process.cwd(), 'main', 'media', 'output_frames');

      let migratedCount = 0;
      for (const doc of documents) {
        const uploadId = doc.uploadInfo?.uploadId;
        const accountId = doc.uploadInfo?.accountId;

        if (!uploadId || !accountId) {
          console.log(`⚠️ Skipping document with missing uploadId or accountId`);
          continue;
        }

        console.log(`📸 Migrating thumbnails for ${uploadId}...`);
        
        const success = await this.extractAndStoreThumbnails(
          uploadId,
          accountId,
          defaultFramesDir,
          5 // Store 5 key frames
        );

        if (success) {
          migratedCount++;
          console.log(`✅ Migrated thumbnails for ${uploadId}`);
        } else {
          console.log(`❌ Failed to migrate thumbnails for ${uploadId}`);
        }
      }

      console.log(`🎉 Migration complete! Migrated ${migratedCount}/${documents.length} documents`);

    } catch (error) {
      console.error('❌ Error during thumbnail migration:', error);
      throw error;
    }
  }

  /**
   * Get video analysis with embedded thumbnails
   */
  async getEnhancedVideoAnalysis(
    uploadId: string,
    accountId: string
  ): Promise<EnhancedVideoAnalysisDocument | null> {
    try {
      const collection = await getVideoAnalysisCollection();
      
      const document = await collection.findOne({
        'uploadInfo.uploadId': uploadId,
        'uploadInfo.accountId': accountId
      });

      return document as EnhancedVideoAnalysisDocument | null;
    } catch (error) {
      console.error('❌ Error getting enhanced video analysis:', error);
      throw error;
    }
  }

  /**
   * Clean up filesystem frames after successful migration
   */
  async cleanupFilesystemFrames(uploadId: string, framesDirectory?: string): Promise<boolean> {
    try {
      // First verify the thumbnails are safely stored in MongoDB
      const collection = await getVideoAnalysisCollection();
      const document = await collection.findOne({
        'uploadInfo.uploadId': uploadId,
        'videoFrames.keyFrames': { $exists: true, $ne: [] }
      });

      if (!document) {
        console.log(`❌ Cannot cleanup: No thumbnails found in MongoDB for ${uploadId}`);
        return false;
      }

      const defaultFramesDir = framesDirectory || join(process.cwd(), 'main', 'media', 'output_frames');
      const fs = require('fs');
      
      // Find and remove frame files for this video
      const frameFiles = fs.readdirSync(defaultFramesDir)
        .filter((file: string) => file.includes('frame_') && file.includes(uploadId));

      for (const file of frameFiles) {
        const filePath = join(defaultFramesDir, file);
        fs.unlinkSync(filePath);
      }

      console.log(`🧹 Cleaned up ${frameFiles.length} frame files for ${uploadId}`);
      return true;

    } catch (error) {
      console.error('❌ Error cleaning up filesystem frames:', error);
      return false;
    }
  }
}

// Export enhanced service instance
export const enhancedVideoService = new EnhancedVideoAnalysisService();

// Usage Example:
/*
// 1. Migrate existing thumbnails to MongoDB
await enhancedVideoService.migrateExistingThumbnails();

// 2. For new uploads, extract and store thumbnails
await enhancedVideoService.extractAndStoreThumbnails(uploadId, accountId, framesDir);

// 3. Get thumbnails from MongoDB (no filesystem access)
const thumbnail = await enhancedVideoService.getThumbnailFromMongoDB(uploadId, accountId);

// 4. Clean up filesystem after successful migration
await enhancedVideoService.cleanupFilesystemFrames(uploadId);
*/
