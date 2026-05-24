/**
 * 🔍 Database Health Check API
 * Tests both Mongoose and Native MongoDB connections
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkConnection } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Running database health check...');
    
    const connectionStatus = await checkConnection();
    
    const healthCheck = {
      success: true,
      timestamp: new Date().toISOString(),
      connections: {
        mongoose: {
          status: connectionStatus.mongoose ? 'connected' : 'failed',
          healthy: connectionStatus.mongoose
        },
        nativeMongoDB: {
          status: connectionStatus.native ? 'connected' : 'failed', 
          healthy: connectionStatus.native
        }
      },
      overall: {
        status: connectionStatus.overall ? 'healthy' : 'degraded',
        healthy: connectionStatus.overall
      },
      environment: {
        mongodbUri: process.env.MONGODB_URI?.replace(/\/\/[^:]*:[^@]*@/, '//***:***@') || 'not set',
        nodeEnv: process.env.NODE_ENV || 'development'
      }
    };

    const statusCode = connectionStatus.overall ? 200 : 503;
    
    return NextResponse.json(healthCheck, { status: statusCode });

  } catch (error) {
    console.error('❌ Database health check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Database health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
