import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { calculateBusinessWiseData } from '@/lib/services/business-wise-data-calculator';

export async function GET(request: Request) {
    try {
        const { db } = await connectDB();

        // Get all active business units
        const businessUnits = db.collection('businessunits');
        const units = await businessUnits.find({ isActive: true }).toArray();

        if (units.length === 0) {
            return NextResponse.json({
                success: true,
                count: 0,
                data: [],
                businessData: [],
                summary: {
                    totalBusinessUnits: 0,
                    totalParticipants: 0,
                    totalVideos: 0
                }
            });
        }

        // Get all employee profiles for region lookup
        const allEmployeeIds = units.flatMap(unit => unit.assignedEmployees || []);
        const employeeProfiles = await db.collection('employeeprofiles').find({
            _id: { $in: allEmployeeIds.map((id: string) => new ObjectId(id)) }
        }).toArray();

        // First try to get data from businessmetrics collection
        const businessMetricsCollection = db.collection('businessmetrics');
        const storedMetrics = await businessMetricsCollection.find({
            'metadata.isActive': true,
            'periodInfo.periodType': 'all-time'
        }).toArray();

        let businessData;

        if (storedMetrics.length > 0) {
            // Use stored data from businessmetrics collection
            businessData = storedMetrics.map(metric => {
                // Get regions for this business unit
                const businessUnit = units.find(u => u.businessCode === metric.businessCode);
                const regions = businessUnit && businessUnit.assignedEmployees ?
                    [...new Set(businessUnit.assignedEmployees
                        .map((empId: string) => {
                            const employee = employeeProfiles.find(emp => emp._id.toString() === empId);
                            return employee?.custom_attributes?.position_1;
                        })
                        .filter(Boolean)
                    )] : [];

                return {
                    businessName: metric.businessName,
                    businessCode: metric.businessCode,
                    businessCategory: metric.businessCategory,
                    avgOIR: metric.overall.avgOverallImprovementRate,
                    avgMaxOS: metric.overall.avgMaxOverallScore,
                    avgMinOS: metric.overall.avgMinOverallScore,
                    avgBIR: metric.bodyLanguage.bodyLanguageImprovementRate,
                    avgMaxBL: metric.bodyLanguage.maximumBodyLanguage,
                    avgMinBL: metric.bodyLanguage.minimumBodyLanguage,
                    avgVIR: metric.vocalTone.vocalToneImprovementRate,
                    avgMaxVT: metric.vocalTone.maximumVocalTone,
                    avgMinVT: metric.vocalTone.minimumVocalTone,
                    avgWIR: metric.wordPower.wordPowerImprovementRate,
                    avgMaxWP: metric.wordPower.maximumWordPower,
                    avgMinWP: metric.wordPower.minimumWordPower,
                    totalParticipants: metric.participants.totalParticipants,
                    totalVideos: metric.participants.totalVideos,
                    totalAnalyzedVideos: metric.participants.analyzedVideos,
                    analysisRate: metric.participants.totalVideos > 0 ? 100 : 0,
                    regionsCount: regions.length,
                    regions: regions,
                    lastCalculated: metric.metadata.calculatedAt.toISOString()
                };
            });
        } else {
            // Fall back to calculation if no stored data
            const calculationResult = await calculateBusinessWiseData();

            if (!calculationResult.success) {
                return NextResponse.json({
                    success: false,
                    error: calculationResult.error,
                    count: 0,
                    data: [],
                    businessData: [],
                    summary: {
                        totalBusinessUnits: 0,
                        totalParticipants: 0,
                        totalVideos: 0
                    }
                });
            }

            // At this point, calculationResult.success is true, so data and summary are guaranteed to exist
            businessData = calculationResult.data!.map(business => {
                // Get regions for this business unit
                const businessUnit = units.find(u => u.businessCode === business.businessCode);
                const regions = businessUnit && businessUnit.assignedEmployees ?
                    [...new Set(businessUnit.assignedEmployees
                        .map((empId: string) => {
                            const employee = employeeProfiles.find(emp => emp._id.toString() === empId);
                            return employee?.custom_attributes?.position_1;
                        })
                        .filter(Boolean)
                    )] : [];

                return {
                    businessName: business.rowLabels,
                    businessCode: business.businessCode,
                    businessCategory: business.businessCategory,
                    avgOIR: business.avgOIRPercent,
                    avgMaxOS: business.avgMaxOS,
                    avgMinOS: business.avgMinOS,
                    avgBIR: business.avgBIRPercent,
                    avgMaxBL: business.avgMaxBL,
                    avgMinBL: business.avgMinBL,
                    avgVIR: business.avgVIRPercent,
                    avgMaxVT: business.avgMaxVT,
                    avgMinVT: business.avgMinVT,
                    avgWIR: business.avgWIRPercent,
                    avgMaxWP: business.avgMaxWP,
                    avgMinWP: business.avgMinWP,
                    totalParticipants: business.totalParticipants,
                    totalVideos: business.totalVideos,
                    totalAnalyzedVideos: business.totalVideos, // Assuming all videos are analyzed
                    analysisRate: business.totalVideos > 0 ? 100 : 0,
                    regionsCount: regions.length,
                    regions: regions,
                    lastCalculated: new Date().toISOString()
                };
            });
        }

        // Calculate summary
        const summary = {
            totalBusinessUnits: businessData.length,
            totalParticipants: businessData.reduce((sum, b) => sum + b.totalParticipants, 0),
            totalVideos: businessData.reduce((sum, b) => sum + b.totalVideos, 0)
        };

        return NextResponse.json({
            success: true,
            count: businessData.length,
            data: businessData,
            businessData: businessData,
            summary
        });

    } catch (error) {
        console.error('Error calculating business metrics by units:', error);
        return NextResponse.json(
            { error: 'Failed to calculate business metrics by units' },
            { status: 500 }
        );
    }
}