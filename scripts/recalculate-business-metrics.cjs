const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';

async function recalculateBusinessMetrics() {
    let client;
    
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db('uspeak-pro');
        
        console.log('=== RECALCULATING BUSINESS METRICS ===\n');
        
        // Clear existing business metrics
        const businessMetrics = db.collection('businessmetrics');
        await businessMetrics.deleteMany({});
        console.log('Cleared existing business metrics');
        
        // Get all video upload activities
        const videoUploadActivities = db.collection('videouploadactivities');
        const activities = await videoUploadActivities.find({}).toArray();
        
        console.log(`Found ${activities.length} video upload activities`);
        
        // Get all employee profiles for mapping
        const employeeProfiles = db.collection('employeeprofiles');
        const employees = await employeeProfiles.find({}).toArray();
        const employeeMap = {};
        employees.forEach(emp => {
            employeeMap[emp.user_id] = emp;
            employeeMap[`EMPLOYEE:${emp.user_id}`] = emp;
        });
        
        // Get all business units from businessunits collection
        const businessUnitsCollection = db.collection('businessunits');
        const businessUnitDocs = await businessUnitsCollection.find({ isActive: true }).toArray();
        
        console.log(`Found ${businessUnitDocs.length} active business units`);
        
        // Create a map of businessCode to business unit details
        const businessUnitMap = {};
        businessUnitDocs.forEach(bu => {
            businessUnitMap[bu.businessCode] = {
                _id: bu._id,
                businessName: bu.businessName,
                businessCategory: bu.businessCategory || 'General',
                assignedEmployees: bu.assignedEmployees || []
            };
        });
        
        // Group activities by corporate account
        const activitiesByCorporateAccount = {};
        activities.forEach(activity => {
            const corpAcctId = activity.corporate_account_id?.toString() || 'unknown';
            if (!activitiesByCorporateAccount[corpAcctId]) {
                activitiesByCorporateAccount[corpAcctId] = [];
            }
            activitiesByCorporateAccount[corpAcctId].push(activity);
        });
        
        console.log(`Activities grouped into ${Object.keys(activitiesByCorporateAccount).length} corporate accounts`);
        
        // Process each corporate account separately
        for (const [corporateAccountId, corpActivities] of Object.entries(activitiesByCorporateAccount)) {
            if (corporateAccountId === 'unknown') {
                console.log(`Skipping ${corpActivities.length} activities without corporate_account_id`);
                continue;
            }
            
            console.log(`\n=== Processing Corporate Account: ${corporateAccountId} (${corpActivities.length} activities) ===`);
            
            // Prepare business units with activities for this corporate account
            const allBusinessUnits = {};
            const unassignedActivities = [];
        
        corpActivities.forEach(activity => {
            // Try multiple ways to get business code
            let businessCode = activity.businessInfo?.businessCode || activity.businessId;
            
            // Extract employee ID from userId (remove EMPLOYEE: prefix)
            const employeeId = activity.userId?.replace('EMPLOYEE:', '') || activity.employeeId;
            
            let assignedBusinessCode = null;
            
            // Check if this employee is assigned to any business unit
            if (employeeId) {
                for (const [code, unit] of Object.entries(businessUnitMap)) {
                    if (unit.assignedEmployees.includes(employeeId)) {
                        assignedBusinessCode = code;
                        break;
                    }
                }
            }
            
            // Use assigned business code if found, otherwise check if activity business code matches employee assignment
            if (assignedBusinessCode) {
                businessCode = assignedBusinessCode;
                console.log(`Employee ${employeeId} assigned to business ${businessCode}`);
            } else if (businessCode && businessCode !== 'GENERAL' && businessUnitMap[businessCode]?.assignedEmployees.includes(employeeId)) {
                // Activity business code exists and employee is assigned to it
                console.log(`Employee ${employeeId} matches activity business code ${businessCode}`);
            } else {
                // Create a more specific business code from organizational info
                const org = activity.organizationInfo || {};
                const region = org.region || 'Unknown';
                const batch = org.batch || 'Unknown';
                businessCode = `${region}_${batch}`.replace(/\s+/g, '_').toUpperCase();
                
                // Log that we're using a derived business code
                console.log(`Using derived business code '${businessCode}' for activity ${activity.uploadId} (employee ${employeeId} not assigned to any business)`);
            }
            
            // Use business name from businessunits collection if available, otherwise from activity or derived
            let businessName, businessCategory, businessUnitId;
            
            if (assignedBusinessCode) {
                // Employee is assigned to a business unit
                const unit = businessUnitMap[assignedBusinessCode];
                businessName = unit.businessName;
                businessCategory = unit.businessCategory;
                businessUnitId = unit._id;
            } else if (businessCode && businessCode !== 'GENERAL' && businessUnitMap[businessCode]) {
                // Activity business code exists in business units and employee is assigned
                const unit = businessUnitMap[businessCode];
                businessName = unit.businessName;
                businessCategory = unit.businessCategory;
                businessUnitId = unit._id;
            } else {
                // Derived business code - use derived name, NOT from activity businessInfo
                businessName = `${activity.organizationInfo?.region || 'Unknown'} ${activity.organizationInfo?.batch || 'Business'}`;
                businessCategory = 'Banking'; // Default category for derived businesses
                businessUnitId = null;
            }
            
            if (!allBusinessUnits[businessCode]) {
                allBusinessUnits[businessCode] = {
                    businessName,
                    businessCode,
                    businessCategory,
                    businessUnitId,
                    activities: []
                };
            }
            
            allBusinessUnits[businessCode].activities.push(activity);
        });
        
        // Log summary of business assignments
        const assignedCount = activities.length - unassignedActivities.length;
        console.log(`Business assignment summary: ${assignedCount}/${activities.length} activities have business assignments`);
        if (unassignedActivities.length > 0) {
            console.log(`⚠️  ${unassignedActivities.length} activities used derived business codes`);
        }
        
        
        const businessUnits = allBusinessUnits;
        
        console.log(`Found ${Object.keys(businessUnits).length} business units for corporate account ${corporateAccountId}`);
        
        // Recalculate metrics for each business unit
        for (const [key, unit] of Object.entries(businessUnits)) {
            console.log(`\nRecalculating metrics for: ${unit.businessName} (${unit.businessCode})`);
            
            try {
                const response = await fetch('http://localhost:3000/api/business-metrics', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        businessName: unit.businessName,
                        businessCode: unit.businessCode,
                        businessCategory: unit.businessCategory,
                        businessUnitId: unit.businessUnitId,
                        periodType: 'all-time',
                        accountId: corporateAccountId,
                        activities: unit.activities
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log(`✅ Success: ${result.message}`);
                } else {
                    const error = await response.json();
                    console.log(`❌ Error: ${error.error}`);
                }
            } catch (error) {
                console.log(`❌ Network Error: ${error.message}`);
            }
        }
        
        } // End of corporate account loop
        
        // Verify the recalculated metrics
        console.log('\n=== VERIFICATION OF RECALCULATED METRICS ===');
        const newMetrics = await businessMetrics.find({}).toArray();
        
        console.log(`New business metrics records: ${newMetrics.length}`);
        
        newMetrics.forEach((metric, index) => {
            console.log(`\n${index + 1}. ${metric.businessName || metric.businessUnit}`);
            console.log(`   Region: ${metric.region}, Zone: ${metric.zone || 'N/A'}, Batch: ${metric.batch || 'N/A'}`);
            console.log(`   Participants: ${metric.participants?.totalParticipants || 0}`);
            console.log(`   Videos: ${metric.participants?.totalVideos || 0} (Analyzed: ${metric.participants?.analyzedVideos || 0})`);
            console.log(`   Overall Improvement Rate: ${metric.overall?.avgOverallImprovementRate || 0}%`);
            console.log(`   Body Language Improvement: ${metric.overall?.avgBodyLanguageImprovementRate || 0}%`);
            console.log(`   Vocal Tone Improvement: ${metric.overall?.avgVocalToneImprovementRate || 0}%`);
            console.log(`   Word Power Improvement: ${metric.overall?.avgWordPowerImprovementRate || 0}%`);
            console.log(`   Avg Overall Score: ${metric.overall?.avgMaxOverallScore || 0} (Min: ${metric.overall?.avgMinOverallScore || 0})`);
        });
        
        console.log('\n=== RECALCULATION COMPLETE ===');
        
    } catch (error) {
        console.error('Error recalculating business metrics:', error);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

recalculateBusinessMetrics();