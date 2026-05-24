/**
 * 🔍 MongoDB Integration Status API
 * Comprehensive health check for video analysis database
 * Verifies collections, indexes, and connection status
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB, { getDatabase } from '../../../../lib/database';
import { videoAnalysisService } from '../../../../lib/services/video-analysis-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking MongoDB integration status...');
    
    const accountId = request.headers.get('x-account-id') || 
                     request.headers.get('Account-ID') || 
                     request.headers.get('account-id') || 
                     'default';
    
    // Connect to MongoDB
    await connectDB();
    const db = await getDatabase();
    
    if (!db) {
      throw new Error('Failed to get database instance');
    }
    
    // Get collection info
    const collection = db.collection('videoAnalysis');
    
    // Get collection statistics using aggregation
    const stats = await collection.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalSize: { $sum: { $bsonSize: "$$ROOT" } },
          avgSize: { $avg: { $bsonSize: "$$ROOT" } }
        }
      }
    ]).toArray();
    
    const collectionStats = stats[0] || { count: 0, totalSize: 0, avgSize: 0 };
    const indexes = await collection.indexes();
    
    // Count documents by account
    const totalDocuments = await collection.countDocuments();
    const accountDocuments = await collection.countDocuments({ accountId });
    
    // Get recent documents for this account
    const recentAnalyses = await collection
      .find({ accountId })
      .sort({ 'metadata.createdAt': -1 })
      .limit(5)
      .project({
        uploadId: 1,
        'uploadInfo.filename': 1,
        'processingInfo.status': 1,
        'processingInfo.stage': 1,
        'metadata.createdAt': 1
      })
      .toArray();
    
    // Check processing status distribution
    const statusCounts = await collection.aggregate([
      { $match: { accountId } },
      { $group: { 
        _id: '$processingInfo.status', 
        count: { $sum: 1 } 
      }}
    ]).toArray();
    
    // Get sample analysis structure (if available)
    const sampleAnalysis = await collection.findOne(
      { accountId },
      { 
        projection: {
          uploadId: 1,
          'uploadInfo.filename': 1,
          'vocalAnalysis.overallScore': 1,
          'wordPowerAnalysis.overallScore': 1,
          'bodyLanguageAnalysis.overallScore': 1,
          'processingInfo.status': 1,
          'metadata.createdAt': 1
        }
      }
    );
    
    // Calculate storage usage
    const storageInfo = {
      totalSize: collectionStats.totalSize || 0,
      indexSize: 0, // Will be calculated differently
      documentCount: collectionStats.count || 0,
      avgDocumentSize: collectionStats.avgSize || 0
    };
    
    // Verify required indexes
    const expectedIndexes = [
      'uploadId_1_accountId_1',
      'accountId_1_metadata.createdAt_-1',
      'processingInfo.status_1_accountId_1',
      'uploadInfo.userId_1_accountId_1',
      'vocalAnalysis.overallScore_-1',
      'wordPowerAnalysis.overallScore_-1',
      'bodyLanguageAnalysis.overallScore_-1',
      'overallPerformance.totalScore_-1'
    ];
    
    const indexNames = indexes.map((idx: any) => idx.name);
    const missingIndexes = expectedIndexes.filter(idx => !indexNames.includes(idx));
    
    // Build comprehensive status
    const status = {
      success: true,
      timestamp: new Date().toISOString(),
      accountId: accountId,
      
      // Database Connection
      database: {
        connected: true,
        name: db.databaseName,
        collection: 'videoAnalysis'
      },
      
      // Collection Statistics
      collectionStats: {
        totalDocuments: totalDocuments,
        accountDocuments: accountDocuments,
        storageSize: formatBytes(storageInfo.totalSize),
        indexSize: formatBytes(storageInfo.indexSize),
        avgDocumentSize: formatBytes(storageInfo.avgDocumentSize),
        indexCount: indexes.length
      },
      
      // Processing Status Overview
      processingStatus: {
        statusDistribution: statusCounts.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentAnalyses: recentAnalyses.map((analysis: any) => ({
          uploadId: analysis.uploadId,
          filename: analysis.uploadInfo?.filename || 'Unknown',
          status: analysis.processingInfo?.status || 'unknown',
          stage: analysis.processingInfo?.stage || 'unknown',
          createdAt: analysis.metadata?.createdAt
        }))
      },
      
      // Index Health
      indexHealth: {
        totalIndexes: indexes.length,
        expectedIndexes: expectedIndexes.length,
        missingIndexes: missingIndexes,
        indexesPresent: indexNames,
        isOptimized: missingIndexes.length === 0
      },
      
      // Sample Data Structure
      ...(sampleAnalysis && {
        sampleStructure: {
          uploadId: sampleAnalysis.uploadId,
          filename: sampleAnalysis.uploadInfo?.filename,
          hasVocalAnalysis: !!sampleAnalysis.vocalAnalysis?.overallScore,
          hasWordPowerAnalysis: !!sampleAnalysis.wordPowerAnalysis?.overallScore,
          hasBodyLanguageAnalysis: !!sampleAnalysis.bodyLanguageAnalysis?.overallScore,
          processingStatus: sampleAnalysis.processingInfo?.status,
          createdAt: sampleAnalysis.metadata?.createdAt
        }
      }),
      
      // Schema Validation
      schemaValidation: {
        hasRequiredFields: !!sampleAnalysis,
        uploadInfoPresent: !!(sampleAnalysis?.uploadInfo),
        processingInfoPresent: !!(sampleAnalysis?.processingInfo),
        metadataPresent: !!(sampleAnalysis?.metadata)
      },
      
      // Service Status
      serviceStatus: {
        videoAnalysisServiceAvailable: !!videoAnalysisService,
        crudOperationsReady: true,
        indexingOptimized: missingIndexes.length === 0
      },
      
      // Overall Health Score
      healthScore: calculateHealthScore({
        connectionOk: true,
        hasDocuments: totalDocuments > 0,
        indexesOptimized: missingIndexes.length === 0,
        schemaValid: !!sampleAnalysis
      }),
      
      // Ready Status
      readyForProduction: {
        status: missingIndexes.length === 0 ? 'READY' : 'NEEDS_OPTIMIZATION',
        issues: missingIndexes.length > 0 ? [`Missing ${missingIndexes.length} indexes`] : [],
        recommendations: generateRecommendations(missingIndexes, totalDocuments)
      }
    };
    
    console.log(`✅ MongoDB status check complete - Health Score: ${status.healthScore}%`);
    return NextResponse.json(status);
    
  } catch (error) {
    console.error('❌ MongoDB status check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'MongoDB connection or query failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      healthScore: 0,
      readyForProduction: {
        status: 'ERROR',
        issues: ['Database connection failed'],
        recommendations: ['Check MongoDB connection string and database availability']
      }
    }, { status: 500 });
  }
}

/**
 * POST endpoint to optimize indexes
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'optimize-indexes') {
      console.log('🔧 Optimizing MongoDB indexes...');
      
      await connectDB();
      const db = await getDatabase();
      
      if (!db) {
        throw new Error('Failed to get database instance');
      }
      
      const collection = db.collection('videoAnalysis');
      
      // Create performance indexes with explicit typing
      const indexes: Array<Record<string, 1 | -1>> = [
        { uploadId: 1, accountId: 1 },
        { accountId: 1, 'metadata.createdAt': -1 },
        { 'processingInfo.status': 1, accountId: 1 },
        { 'uploadInfo.userId': 1, accountId: 1 },
        { 'vocalAnalysis.overallScore': -1 },
        { 'wordPowerAnalysis.overallScore': -1 },
        { 'bodyLanguageAnalysis.overallScore': -1 },
        { 'overallPerformance.totalScore': -1 }
      ];
      
      const results = [];
      for (const indexSpec of indexes) {
        try {
          const result = await collection.createIndex(indexSpec);
          results.push({ index: indexSpec, result, status: 'created' });
        } catch (error) {
          results.push({ 
            index: indexSpec, 
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'failed' 
          });
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Index optimization completed',
        results: results,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action',
      supportedActions: ['optimize-indexes']
    }, { status: 400 });
    
  } catch (error) {
    console.error('❌ Index optimization failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to optimize indexes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculate overall health score
 */
function calculateHealthScore(checks: {
  connectionOk: boolean;
  hasDocuments: boolean;
  indexesOptimized: boolean;
  schemaValid: boolean;
}): number {
  let score = 0;
  
  if (checks.connectionOk) score += 40;
  if (checks.indexesOptimized) score += 30;
  if (checks.schemaValid) score += 20;
  if (checks.hasDocuments) score += 10;
  
  return score;
}

/**
 * Generate recommendations based on status
 */
function generateRecommendations(missingIndexes: string[], documentCount: number): string[] {
  const recommendations = [];
  
  if (missingIndexes.length > 0) {
    recommendations.push(`Create ${missingIndexes.length} missing performance indexes`);
  }
  
  if (documentCount === 0) {
    recommendations.push('Upload and process sample videos to test the system');
  }
  
  if (documentCount > 1000) {
    recommendations.push('Consider implementing data archival for old analyses');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('System is optimally configured');
  }
  
  return recommendations;
}
