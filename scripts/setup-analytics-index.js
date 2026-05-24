/**
 * Setup MongoDB Index for Analytics Performance
 * Run this script to create the required index for user analytics queries
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const MONGODB_DB = process.env.MONGODB_DB || 'uspeak-pro';

async function setupAnalyticsIndex() {
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection('video_analysis');
    
    console.log('📊 Creating analytics index...');
    
    // Create compound index for user analytics queries
    const indexResult = await collection.createIndex(
      { 
        'uploadInfo.userId': 1, 
        'uploadInfo.accountId': 1, 
        'uploadInfo.uploadDate': -1 
      },
      {
        name: 'user_analytics_index',
        background: true
      }
    );
    
    console.log('✅ Analytics index created:', indexResult);
    
    // List all indexes to verify
    const indexes = await collection.listIndexes().toArray();
    console.log('📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up index:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Connection closed');
    }
  }
}

// Run the setup
if (require.main === module) {
  setupAnalyticsIndex();
}

module.exports = { setupAnalyticsIndex };
