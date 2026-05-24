/**
 * Test Analytics API Route
 * Verifies that the user analytics API is working correctly
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const MONGODB_DB = process.env.MONGODB_DB || 'uspeak-pro';

async function getVideoAnalysisCollection() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  return db.collection('video_analysis');
}

async function testAnalyticsAPI() {
  try {
    console.log('🧪 Testing Analytics API...');
    
    // Connect to database
    const collection = await getVideoAnalysisCollection();
    
    // First, let's see what data we have
    console.log('📊 Checking available data...');
    const totalDocs = await collection.countDocuments();
    console.log(`Total video analysis documents: ${totalDocs}`);
    
    if (totalDocs === 0) {
      console.log('⚠️  No video analysis data found. Please upload and analyze some videos first.');
      return;
    }
    
    // Get a sample of user IDs
    const sampleUsers = await collection.aggregate([
      {
        $group: {
          _id: '$uploadInfo.userId',
          count: { $sum: 1 },
          latestUpload: { $max: '$uploadInfo.uploadDate' }
        }
      },
      { $limit: 5 },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('👥 Sample users with video data:');
    sampleUsers.forEach(user => {
      console.log(`  - User: ${user._id}, Videos: ${user.count}, Latest: ${user.latestUpload}`);
    });
    
    if (sampleUsers.length > 0) {
      const testUserId = sampleUsers[0]._id;
      console.log(`\n🎯 Testing analytics for user: ${testUserId}`);
      
      // Test the aggregation pipeline
      const pipeline = [
        {
          $match: {
            'uploadInfo.userId': testUserId
          }
        },
        {
          $sort: { 'uploadInfo.uploadDate': 1 }
        },
        {
          $facet: {
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
              }
            ],
            trend: [
              {
                $project: {
                  _id: 1,
                  date: '$uploadInfo.uploadDate',
                  overall: '$overallPerformance.totalScore'
                }
              },
              { $sort: { date: 1 } },
              { $limit: 10 }
            ]
          }
        }
      ];
      
      const result = await collection.aggregate(pipeline).toArray();
      
      if (result && result.length > 0) {
        const data = result[0];
        console.log('✅ Analytics aggregation successful!');
        console.log('📈 Results:');
        console.log('  Overall stats:', data.overall[0] || 'No data');
        console.log('  Trend points:', data.trend.length);
        
        if (data.trend.length > 0) {
          console.log('  Sample trend data:');
          data.trend.slice(0, 3).forEach((point, i) => {
            console.log(`    ${i+1}. Date: ${point.date}, Score: ${point.overall}`);
          });
        }
      } else {
        console.log('⚠️  Aggregation returned no results');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAnalyticsAPI().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
