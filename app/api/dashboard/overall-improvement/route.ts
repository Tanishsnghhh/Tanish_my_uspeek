import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

interface OverallImprovementRow {
    region: string;
    zone: string;
    batch: string;
    branch: string;
    improvementRate: string; // Can be percentage or "Pending"
    overallScore: number;
    bodyLanguage: number;
    vocalTone: number;
    wordPower: number;
    originalScore: number;
    employeeCount: number;
}

interface OverallImprovementResponse {
    data: OverallImprovementRow[];
    summary: {
        baselineOverallScore: number;
        finalOverallScore: number;
        improvementRate: string;
        totalEmployees: number;
        totalVideos: number;
    };
}

export async function GET() {
    try {
        const { db } = await connectDB();

        // Dynamically determine data sources based on available collections
        const videoAnalysis = db.collection('video_analysis');
        const employeeProfiles = db.collection('employeeprofiles');

        // Check collection sizes dynamically
        const videoAnalysisCount = await videoAnalysis.countDocuments();
        const employeeCount = await employeeProfiles.countDocuments();

        console.log(`Dynamic collection analysis: videoAnalysis=${videoAnalysisCount}, employees=${employeeCount}`);

        // DIAGNOSTIC: Check if we have any data at all
        if (employeeCount === 0) {
            console.log('❌ CRITICAL: No employees found in employeeprofiles collection');
            return NextResponse.json({
                error: 'No employee data found',
                diagnostic: { employeeCount: 0, videoAnalysisCount }
            }, { status: 404 });
        }

        if (videoAnalysisCount === 0) {
            console.log('❌ CRITICAL: No video analysis data found');
            return NextResponse.json({
                error: 'No video analysis data found',
                diagnostic: { employeeCount, videoAnalysisCount: 0 }
            }, { status: 404 });
        }

        // Get all employees to ensure we show ALL organizational units, even without videos
        const allEmployees = await employeeProfiles.find({
            $and: [
                { 'custom_attributes': { $exists: true } },
                { 'custom_attributes': { $ne: null } }
            ]
        }).toArray();

        console.log(`📊 Found ${allEmployees.length} employees with custom_attributes`);

        // Create a comprehensive user ID mapping for better matching
        const userIdMap = new Map<string, any>();

        allEmployees.forEach(employee => {
            const userId = employee.user_id;
            const employeeId = employee.employeeId;

            // Store employee by various ID formats for flexible matching
            if (userId) {
                userIdMap.set(userId.toString(), employee);
                userIdMap.set(`EMPLOYEE:${userId}`, employee);
            }
            if (employeeId) {
                userIdMap.set(employeeId.toString(), employee);
                userIdMap.set(`EMPLOYEE:${employeeId}`, employee);
            }

            // Handle ObjectId format
            if (userId && typeof userId === 'object' && userId.toString) {
                userIdMap.set(userId.toString(), employee);
                userIdMap.set(`EMPLOYEE:${userId.toString()}`, employee);
            }
        });

        console.log(`🔗 Created user ID mapping for ${userIdMap.size} unique identifiers`);

        // Use video_analysis collection for video activities
        let activities: any[] = [];
        let dataSource = 'video_analysis';

        if (videoAnalysisCount > 0) {
            activities = await videoAnalysis.find({}).toArray();
        }

        console.log(`Using data source: ${dataSource} with ${activities.length} activities and ${allEmployees.length} employees`);

        // First, create groups from ALL employees (including those without videos)
        const groupedData: {
            [key: string]: {
                region: string;
                zone: string;
                batch: string;
                branch: string;
                activities: any[];
                employees: Set<string>;
                analyzedActivities: any[];
                totalEmployeesInGroup: number;
            }
        } = {};

        // Add all employees to their respective groups
        allEmployees.forEach(employee => {
            const attrs = employee.custom_attributes || {};
            const region = attrs.position_1 || 'Unknown';
            const zone = attrs.position_2 || 'Unknown';
            const batch = attrs.position_3 || 'Unknown';
            const branch = attrs.position_4 || 'Unknown';

            const groupKey = `${region}|${zone}|${batch}|${branch}`;

            if (!groupedData[groupKey]) {
                groupedData[groupKey] = {
                    region,
                    zone,
                    batch,
                    branch,
                    activities: [],
                    employees: new Set(),
                    analyzedActivities: [],
                    totalEmployeesInGroup: 0
                };
            }

            groupedData[groupKey].totalEmployeesInGroup++;
        });

        console.log(`🏗️  Created ${Object.keys(groupedData).length} employee groups`);

        // Now add video activities to existing groups with improved matching
        let matchedVideos = 0;
        let unmatchedVideos = 0;

        activities.forEach(activity => {
            const userId = activity.uploadInfo?.userId || '';
            let region: string = 'Unknown';
            let zone: string = 'Unknown';
            let batch: string = 'Unknown';
            let branch: string = 'Unknown';
            let isAnalyzed: boolean = false;

            // Try to find matching employee using the comprehensive mapping
            const matchingEmployee = userIdMap.get(userId) ||
                                   userIdMap.get(userId.replace('EMPLOYEE:', '')) ||
                                   userIdMap.get(`EMPLOYEE:${userId}`);

            if (matchingEmployee) {
                const attrs = matchingEmployee.custom_attributes || {};
                region = attrs.position_1 || 'Unknown';
                zone = attrs.position_2 || 'Unknown';
                batch = attrs.position_3 || 'Unknown';
                branch = attrs.position_4 || 'Unknown';
                matchedVideos++;
                console.log(`✅ Matched video userId "${userId}" to employee: ${matchingEmployee.first_name} ${matchingEmployee.last_name} in ${region}`);
            } else {
                // Fallback: try to extract from video metadata or use defaults
                region = activity.uploadInfo?.region || activity.organizationInfo?.region || 'Unknown';
                zone = activity.uploadInfo?.zone || activity.organizationInfo?.zone || 'Unknown';
                batch = activity.uploadInfo?.batch || activity.organizationInfo?.batch || 'Unknown';
                branch = activity.uploadInfo?.branch || activity.organizationInfo?.branch || 'Unknown';
                unmatchedVideos++;
                console.log(`❌ No employee match found for video userId "${userId}", using fallback: ${region}`);
            }

            isAnalyzed = !!(activity.bodyLanguageAnalysis || activity.vocalAnalysis || activity.wordPowerAnalysis);

            const groupKey = `${region}|${zone}|${batch}|${branch}`;

            // Only add to existing groups (groups that have employees)
            if (groupedData[groupKey]) {
                groupedData[groupKey].activities.push(activity);
                if (userId) groupedData[groupKey].employees.add(userId);

                if (isAnalyzed) {
                    groupedData[groupKey].analyzedActivities.push(activity);
                }
            }
        });

        console.log(`📊 Video matching results: ${matchedVideos} matched, ${unmatchedVideos} unmatched`);

        // Process grouped data into table rows with improved calculations
        const tableData: OverallImprovementRow[] = [];
        let totalEmployeesWithVideos = 0;
        let totalVideos = 0;
        let totalFinalScore = 0;
        let totalOriginalScore = 0;
        let groupsWithData = 0;

        const totalEmployeesInSystem = allEmployees.length;

        for (const [groupKey, group] of Object.entries(groupedData)) {
            const employeeCount = group.totalEmployeesInGroup;
            const videoCount = group.activities.length;
            const analyzedCount = group.analyzedActivities.length;

            totalVideos += videoCount;

            console.log(`Processing group: ${group.region}|${group.zone}|${group.batch}|${group.branch}`);
            console.log(`  Employees: ${employeeCount}, Videos: ${videoCount}, Analyzed: ${analyzedCount}`);

            if (analyzedCount > 0) {
                // Calculate improvement rates per employee with better error handling
                const employeeImprovements: { [userId: string]: any } = {};

                group.analyzedActivities.forEach(activity => {
                    const userId = activity.uploadInfo?.userId || 'unknown';
                    if (!employeeImprovements[userId]) {
                        employeeImprovements[userId] = {
                            scores: [],
                            employee: userId
                        };
                    }

                    // Extract scores with validation
                    const bodyLanguageScore = activity.bodyLanguageAnalysis?.overallScore;
                    const vocalToneScore = activity.vocalAnalysis?.overallScore;
                    const wordPowerScore = activity.wordPowerAnalysis?.overallScore;
                    const overallScore = activity.overallPerformance?.totalScore;
                    const uploadDate = activity.uploadInfo?.uploadDate;

                    // Validate all scores are present and valid
                    if (bodyLanguageScore > 0 && vocalToneScore > 0 && wordPowerScore > 0 && uploadDate) {
                        // Calculate overall score if missing
                        const calculatedOverall = overallScore ||
                            Math.round((bodyLanguageScore + vocalToneScore + wordPowerScore) / 3);

                        if (calculatedOverall > 0) {
                            employeeImprovements[userId].scores.push({
                                date: uploadDate,
                                bodyLanguage: bodyLanguageScore,
                                vocalTone: vocalToneScore,
                                wordPower: wordPowerScore,
                                overall: calculatedOverall
                            });
                            console.log(`📊 Added valid scores for ${userId}: BL=${bodyLanguageScore}, VT=${vocalToneScore}, WP=${wordPowerScore}, Overall=${calculatedOverall}`);
                        }
                    } else {
                        console.log(`⚠️  Skipped invalid/missing scores for ${userId}`);
                    }
                });

                // Calculate averages and improvement rates with better validation
                let groupBaselineSum = 0;
                let groupFinalSum = 0;
                let groupBodyLanguageSum = 0;
                let groupVocalToneSum = 0;
                let groupWordPowerSum = 0;
                let employeesWithData = 0;

                for (const [userId, data] of Object.entries(employeeImprovements)) {
                    if (data.scores.length === 0) continue;

                    // Sort scores by date
                    data.scores.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

                    const firstScore = data.scores[0];
                    const lastScore = data.scores[data.scores.length - 1];

                    let baselineScore, finalScore;

                    if (data.scores.length > 1) {
                        // Multiple videos: use first as baseline
                        baselineScore = firstScore.overall;
                        finalScore = lastScore.overall;
                    } else {
                        // Single video: use standard baseline of 50
                        baselineScore = 50;
                        finalScore = firstScore.overall;
                    }

                    // Only include if we have valid scores
                    if (baselineScore > 0 && finalScore > 0) {
                        groupBaselineSum += baselineScore;
                        groupFinalSum += finalScore;
                        groupBodyLanguageSum += lastScore.bodyLanguage;
                        groupVocalToneSum += lastScore.vocalTone;
                        groupWordPowerSum += lastScore.wordPower;
                        employeesWithData++;
                    }
                }

                if (employeesWithData > 0) {
                    const avgBaseline = groupBaselineSum / employeesWithData;
                    const avgFinal = groupFinalSum / employeesWithData;
                    const avgBodyLanguage = groupBodyLanguageSum / employeesWithData;
                    const avgVocalTone = groupVocalToneSum / employeesWithData;
                    const avgWordPower = groupWordPowerSum / employeesWithData;

                    const groupImprovementRate = avgBaseline > 0 ?
                        ((avgFinal - avgBaseline) / avgBaseline) * 100 : 0;

                    totalFinalScore += avgFinal;
                    totalOriginalScore += avgBaseline;
                    totalEmployeesWithVideos += employeesWithData;
                    groupsWithData++;

                    // Format improvement rate
                    const formattedRate = `${Math.round(groupImprovementRate)}%`;

                    tableData.push({
                        region: group.region,
                        zone: group.zone,
                        batch: group.batch,
                        branch: group.branch,
                        improvementRate: formattedRate,
                        overallScore: Math.round(avgFinal * 100) / 100,
                        bodyLanguage: Math.round(avgBodyLanguage * 100) / 100,
                        vocalTone: Math.round(avgVocalTone * 100) / 100,
                        wordPower: Math.round(avgWordPower * 100) / 100,
                        originalScore: Math.round(avgBaseline * 100) / 100,
                        employeeCount
                    });

                    console.log(`  ✅ Final result for ${group.region}: ${formattedRate} improvement (${employeesWithData} employees with data)`);
                }
            } else {
                // Groups without analyzed video data - show as pending
                console.log(`  No analyzed videos - showing as Pending`);

                tableData.push({
                    region: group.region,
                    zone: group.zone,
                    batch: group.batch,
                    branch: group.branch,
                    improvementRate: 'Pending',
                    overallScore: 0,
                    bodyLanguage: 0,
                    vocalTone: 0,
                    wordPower: 0,
                    originalScore: 0,
                    employeeCount
                });
            }
        }

        // Calculate summary statistics
        const avgFinalScore = groupsWithData > 0 ? totalFinalScore / groupsWithData : 0;
        const avgOriginalScore = groupsWithData > 0 ? totalOriginalScore / groupsWithData : 0;
        const overallImprovementRate = avgOriginalScore > 0
            ? ((avgFinalScore - avgOriginalScore) / avgOriginalScore) * 100
            : 0;

        // Sort data by region, then zone, then batch
        tableData.sort((a, b) => {
            if (a.region !== b.region) return a.region.localeCompare(b.region);
            if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
            return a.batch.localeCompare(b.batch);
        });

        const response: OverallImprovementResponse = {
            data: tableData,
            summary: {
                baselineOverallScore: Math.round(avgOriginalScore * 100) / 100,
                finalOverallScore: Math.round(avgFinalScore * 100) / 100,
                improvementRate: `${Math.round(overallImprovementRate)}%`,
                totalEmployees: totalEmployeesInSystem,
                totalVideos
            }
        };

        console.log(`Processed ${tableData.length} groups with ${totalEmployeesWithVideos} employees with videos out of ${totalEmployeesInSystem} total employees and ${totalVideos} videos`);
        console.log('Summary:', response.summary);

        // DIAGNOSTIC: Show final data structure
        console.log('📋 Final response data:', {
            totalGroups: tableData.length,
            groupsWithData: groupsWithData,
            matchedVideos,
            unmatchedVideos,
            sampleData: tableData.slice(0, 3).map(group => ({
                region: group.region,
                improvementRate: group.improvementRate,
                employeeCount: group.employeeCount,
                overallScore: group.overallScore
            }))
        });

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching overall improvement data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch overall improvement data' },
            { status: 500 }
        );
    }
}