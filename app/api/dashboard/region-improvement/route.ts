import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { checkAdminPermissions } from '@/lib/admin-permissions';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';

interface RegionImprovementData {
    region: string;
    improvementRate: number;
    totalEmployees: number;
    employeesWithVideos: number;
    averageScore: number;
    avgMaxOS: number;
    avgMinOS: number;
    avgBIR: number;
    avgMaxBL: number;
    avgMinBL: number;
    avgVIR: number;
    avgMaxVT: number;
    avgMinVT: number;
    avgWIR: number;
    avgMaxWP: number;
    avgMinWP: number;
}

export async function GET(request: NextRequest) {
    let client: MongoClient | null = null;

    try {
        // Check admin authentication and get corporate account ID
        const authResult = await checkAdminPermissions(request);
        
        if (!authResult.isAuthenticated || !authResult.isAdmin) {
            return NextResponse.json(
                { error: authResult.error || 'Admin authentication required' },
                { status: 401 }
            );
        }

        if (!authResult.corporateAccountId) {
            return NextResponse.json(
                { error: 'Corporate account ID not found' },
                { status: 400 }
            );
        }

        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db('uspeak-pro');

        // Get all employee profiles with their regions for this corporate account
        const employeeProfiles = db.collection('employeeprofiles');
        const videoAnalysis = db.collection('video_analysis');
        const videoActivities = db.collection('videouploadactivities');

        // Fetch employees with their region data for this corporate account only
        const employees = await employeeProfiles.find({
            $and: [
                { corporate_account_id: new ObjectId(authResult.corporateAccountId) },
                { 'custom_attributes.position_1': { $exists: true } },
                { 'custom_attributes.position_1': { $ne: null } },
                { 'custom_attributes.position_1': { $ne: '' } }
            ]
        }).toArray();

        console.log(`Found ${employees.length} employees with region data`);

        // Group employees by region and calculate improvement rates
        const regionData: { [key: string]: RegionImprovementData } = {};

        // Initialize data for ALL regions found in employee profiles
        const allRegions = [...new Set(employees.map(emp =>
            emp.custom_attributes?.position_1?.toUpperCase()
        ).filter(Boolean))];

        console.log('All regions found in employee profiles:', allRegions);

        // Initialize all regions with zero values
        allRegions.forEach(region => {
            regionData[region] = {
                region,
                improvementRate: 0,
                totalEmployees: 0,
                employeesWithVideos: 0,
                averageScore: 0,
                avgMaxOS: 0,
                avgMinOS: 0,
                avgBIR: 0,
                avgMaxBL: 0,
                avgMinBL: 0,
                avgVIR: 0,
                avgMaxVT: 0,
                avgMinVT: 0,
                avgWIR: 0,
                avgMaxWP: 0,
                avgMinWP: 0
            };
        });

        // Count employees per region (for ALL regions)
        for (const employee of employees) {
            const region = employee.custom_attributes?.position_1?.toUpperCase() || 'UNKNOWN';

            if (regionData[region]) {
                regionData[region].totalEmployees += 1;
            }
        }

        // Get video analysis data for this corporate account only
        const accountFilter = {
            $or: [
                { 'uploadInfo.corporate_account_id': new ObjectId(authResult.corporateAccountId) },
                { 'uploadInfo.accountId': authResult.corporateAccountId }
            ]
        };
        const videoAnalysisData = await videoAnalysis.find(accountFilter).toArray();
        console.log(`Found ${videoAnalysisData.length} video analysis records`);

        // Create a map of userId to region from employee profiles
        const userRegionMap: { [userId: string]: string } = {};
        employees.forEach(employee => {
            const userId = employee.user_id;
            const region = employee.custom_attributes?.position_1?.toUpperCase();
            if (userId && region && allRegions.includes(region)) {
                // Store both original and clean userId for matching
                userRegionMap[userId] = region;
                // Also handle EMPLOYEE: prefixed IDs
                userRegionMap[`EMPLOYEE:${userId}`] = region;
            }
        });

        console.log('User to region mapping:', userRegionMap);

        // Group video analysis by userId
        const userVideos: { [userId: string]: any[] } = {};
        videoAnalysisData.forEach(video => {
            const userId = video.uploadInfo?.userId;
            if (userId) {
                // Extract clean userId by removing EMPLOYEE: prefix if present
                const cleanUserId = userId.startsWith('EMPLOYEE:') ? userId.replace('EMPLOYEE:', '') : userId;

                // Use clean userId for grouping
                if (!userVideos[cleanUserId]) {
                    userVideos[cleanUserId] = [];
                }
                userVideos[cleanUserId].push(video);
            }
        });

        // Calculate improvement per user using video_analysis data
        const userImprovements: { [userId: string]: {
            improvementRate: number,
            averageScore: number,
            maxOS: number,
            minOS: number,
            bodyLanguageImprovement: number,
            maxBL: number,
            minBL: number,
            vocalToneImprovement: number,
            maxVT: number,
            minVT: number,
            wordPowerImprovement: number,
            maxWP: number,
            minWP: number
        } } = {};

        for (const [userId, videos] of Object.entries(userVideos)) {
            // Sort by uploadDate
            videos.sort((a, b) => new Date(a.uploadInfo?.uploadDate || 0).getTime() - new Date(b.uploadInfo?.uploadDate || 0).getTime());

            // Extract all scores
            const overallScores = videos.map(video => video.wordPowerAnalysis?.overallScore || 0).filter(score => score > 0);
            const bodyLanguageScores = videos.map(video => video.bodyLanguageAnalysis?.overallScore || 0).filter(score => score > 0);
            const vocalToneScores = videos.map(video => video.vocalAnalysis?.overallScore || 0).filter(score => score > 0);
            const wordPowerScores = videos.map(video => video.wordPowerAnalysis?.overallScore || 0).filter(score => score > 0);

            if (overallScores.length === 0) continue;

            // Calculate overall improvement
            let improvementRate = 0;
            let latestScore = overallScores[overallScores.length - 1];

            if (overallScores.length >= 2) {
                const firstScore = overallScores[0];
                improvementRate = firstScore > 0 ? ((latestScore - firstScore) / firstScore) * 100 : 0;
            } else {
                const baselineScore = 50;
                improvementRate = latestScore > baselineScore ? ((latestScore - baselineScore) / baselineScore) * 100 : 0;
            }

            // Calculate body language improvement
            let bodyLanguageImprovement = 0;
            if (bodyLanguageScores.length >= 2) {
                const firstBL = bodyLanguageScores[0];
                const latestBL = bodyLanguageScores[bodyLanguageScores.length - 1];
                bodyLanguageImprovement = firstBL > 0 ? ((latestBL - firstBL) / firstBL) * 100 : 0;
            } else if (bodyLanguageScores.length === 1) {
                const baselineScore = 50;
                bodyLanguageImprovement = bodyLanguageScores[0] > baselineScore ? ((bodyLanguageScores[0] - baselineScore) / baselineScore) * 100 : 0;
            }

            // Calculate vocal tone improvement
            let vocalToneImprovement = 0;
            if (vocalToneScores.length >= 2) {
                const firstVT = vocalToneScores[0];
                const latestVT = vocalToneScores[vocalToneScores.length - 1];
                vocalToneImprovement = firstVT > 0 ? ((latestVT - firstVT) / firstVT) * 100 : 0;
            } else if (vocalToneScores.length === 1) {
                const baselineScore = 50;
                vocalToneImprovement = vocalToneScores[0] > baselineScore ? ((vocalToneScores[0] - baselineScore) / baselineScore) * 100 : 0;
            }

            // Calculate word power improvement
            let wordPowerImprovement = 0;
            if (wordPowerScores.length >= 2) {
                const firstWP = wordPowerScores[0];
                const latestWP = wordPowerScores[wordPowerScores.length - 1];
                wordPowerImprovement = firstWP > 0 ? ((latestWP - firstWP) / firstWP) * 100 : 0;
            } else if (wordPowerScores.length === 1) {
                const baselineScore = 50;
                wordPowerImprovement = wordPowerScores[0] > baselineScore ? ((wordPowerScores[0] - baselineScore) / baselineScore) * 100 : 0;
            }

            userImprovements[userId] = {
                improvementRate,
                averageScore: latestScore,
                maxOS: overallScores.length > 0 ? Math.max(...overallScores) : 0,
                minOS: overallScores.length > 0 ? Math.min(...overallScores) : 0,
                bodyLanguageImprovement,
                maxBL: bodyLanguageScores.length > 0 ? Math.max(...bodyLanguageScores) : 0,
                minBL: bodyLanguageScores.length > 0 ? Math.min(...bodyLanguageScores) : 0,
                vocalToneImprovement,
                maxVT: vocalToneScores.length > 0 ? Math.max(...vocalToneScores) : 0,
                minVT: vocalToneScores.length > 0 ? Math.min(...vocalToneScores) : 0,
                wordPowerImprovement,
                maxWP: wordPowerScores.length > 0 ? Math.max(...wordPowerScores) : 0,
                minWP: wordPowerScores.length > 0 ? Math.min(...wordPowerScores) : 0
            };
        }

        // Add user improvements to regions using region mapping from employee profiles
        for (const [userId, improvement] of Object.entries(userImprovements)) {
            // Try to find region using clean userId first, then with EMPLOYEE: prefix
            const region = userRegionMap[userId] || userRegionMap[`EMPLOYEE:${userId}`];

            if (region && allRegions.includes(region)) {
                regionData[region].improvementRate += improvement.improvementRate;
                regionData[region].averageScore += improvement.averageScore;
                regionData[region].employeesWithVideos += 1;

                // Accumulate detailed metrics
                regionData[region].avgMaxOS += improvement.maxOS;
                regionData[region].avgMinOS += improvement.minOS;
                regionData[region].avgBIR += improvement.bodyLanguageImprovement;
                regionData[region].avgMaxBL += improvement.maxBL;
                regionData[region].avgMinBL += improvement.minBL;
                regionData[region].avgVIR += improvement.vocalToneImprovement;
                regionData[region].avgMaxVT += improvement.maxVT;
                regionData[region].avgMinVT += improvement.minVT;
                regionData[region].avgWIR += improvement.wordPowerImprovement;
                regionData[region].avgMaxWP += improvement.maxWP;
                regionData[region].avgMinWP += improvement.minWP;
            }
        }

        // Get all unique regions from employees
        const employeeRegions = [...new Set(employees.map(emp =>
            emp.custom_attributes?.position_1?.toUpperCase()
        ).filter(Boolean))];

        // Combine employee regions with standard regions
        const allRegionsCombined = [...new Set([...employeeRegions, ...allRegions])];

        console.log('Employee regions found:', employeeRegions);
        console.log('All regions (including standard):', allRegionsCombined);
        console.log('Regions with data:', Object.keys(regionData));

        // Include ALL regions from employee profiles, even those without video data
        const formattedData = allRegionsCombined.map(region => {
            const regionDataEntry = regionData[region];

            if (regionDataEntry) {
                if (regionDataEntry.employeesWithVideos > 0) {
                    // Region has video data - calculate averages based on employees with videos
                    return {
                        region: region,
                        improvementRate: Math.max(0, Math.round(regionDataEntry.improvementRate / regionDataEntry.employeesWithVideos)),
                        totalEmployees: regionDataEntry.totalEmployees,
                        averageScore: Math.round(regionDataEntry.averageScore / regionDataEntry.employeesWithVideos),
                        avgOIR: Math.max(0, Math.round(regionDataEntry.improvementRate / regionDataEntry.employeesWithVideos)),
                        avgMaxOS: Math.round(regionDataEntry.avgMaxOS / regionDataEntry.employeesWithVideos),
                        avgMinOS: Math.round(regionDataEntry.avgMinOS / regionDataEntry.employeesWithVideos),
                        avgBIR: Math.round(regionDataEntry.avgBIR / regionDataEntry.employeesWithVideos),
                        avgMaxBL: Math.round(regionDataEntry.avgMaxBL / regionDataEntry.employeesWithVideos),
                        avgMinBL: Math.round(regionDataEntry.avgMinBL / regionDataEntry.employeesWithVideos),
                        avgVIR: Math.round(regionDataEntry.avgVIR / regionDataEntry.employeesWithVideos),
                        avgMaxVT: Math.round(regionDataEntry.avgMaxVT / regionDataEntry.employeesWithVideos),
                        avgMinVT: Math.round(regionDataEntry.avgMinVT / regionDataEntry.employeesWithVideos),
                        avgWIR: Math.round(regionDataEntry.avgWIR / regionDataEntry.employeesWithVideos),
                        avgMaxWP: Math.round(regionDataEntry.avgMaxWP / regionDataEntry.employeesWithVideos),
                        avgMinWP: Math.round(regionDataEntry.avgMinWP / regionDataEntry.employeesWithVideos)
                    };
                } else {
                    // Region has employees but no video data - return zeros for scores
                    return {
                        region: region,
                        improvementRate: 0,
                        totalEmployees: regionDataEntry.totalEmployees,
                        averageScore: 0,
                        avgOIR: 0,
                        avgMaxOS: 0,
                        avgMinOS: 0,
                        avgBIR: 0,
                        avgMaxBL: 0,
                        avgMinBL: 0,
                        avgVIR: 0,
                        avgMaxVT: 0,
                        avgMinVT: 0,
                        avgWIR: 0,
                        avgMaxWP: 0,
                        avgMinWP: 0
                    };
                }
            } else {
                // This shouldn't happen since we initialize all regions
                return {
                    region: region,
                    improvementRate: 0,
                    totalEmployees: 0,
                    averageScore: 0,
                    avgOIR: 0,
                    avgMaxOS: 0,
                    avgMinOS: 0,
                    avgBIR: 0,
                    avgMaxBL: 0,
                    avgMinBL: 0,
                    avgVIR: 0,
                    avgMaxVT: 0,
                    avgMinVT: 0,
                    avgWIR: 0,
                    avgMaxWP: 0,
                    avgMinWP: 0
                };
            }
        });

        // Sort by region name for consistent display
        formattedData.sort((a, b) => a.region.localeCompare(b.region));

        console.log('Returning region data for all regions:', formattedData);
        return NextResponse.json(formattedData);

    } catch (error) {
        console.error('Error fetching region improvement data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch region improvement data' },
            { status: 500 }
        );
    } finally {
        if (client) {
            await client.close();
        }
    }
}