import { NextRequest, NextResponse } from 'next/server';
import { AuditLog } from '@/lib/models';
import connectDB from '@/lib/database';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// POST /api/reports/export
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { format, level, params } = body;

    // Validate parameters
    if (!format || !level || !params) {
      return NextResponse.json(
        { success: false, error: 'Format, level, and params are required' },
        { status: 400 }
      );
    }

    if (!['csv', 'pdf'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Format must be csv or pdf' },
        { status: 400 }
      );
    }

    if (!['individual', 'aggregate'].includes(level)) {
      return NextResponse.json(
        { success: false, error: 'Level must be individual or aggregate' },
        { status: 400 }
      );
    }

    // Extract account_id from JWT token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    let accountId: string;
    let userId: string;
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded?.corporateAccountId || !decoded?.userId) {
        return NextResponse.json(
          { success: false, error: 'Invalid token: missing account or user ID' },
          { status: 401 }
        );
      }
      accountId = decoded.corporateAccountId;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Generate data based on level
    let data: any;
    let filename: string;
    
    if (level === 'individual') {
      // Fetch individual employee data using the same logic as the summary endpoint
      const employeeId = params.employeeId;
      if (!employeeId) {
        return NextResponse.json(
          { success: false, error: 'Employee ID required for individual export' },
          { status: 400 }
        );
      }

      // Make internal API call to get employee summary
      const summaryUrl = new URL(`${request.nextUrl.origin}/api/reports/employee/${employeeId}/summary`);
      summaryUrl.searchParams.set('start', params.start);
      summaryUrl.searchParams.set('end', params.end);
      summaryUrl.searchParams.set('includeTrend', 'true');
      summaryUrl.searchParams.set('includeAssignments', 'true');

      const summaryResponse = await fetch(summaryUrl.toString(), {
        headers: { authorization: `Bearer ${token}` }
      });

      if (!summaryResponse.ok) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch employee data for export' },
          { status: 500 }
        );
      }

      const summaryData = await summaryResponse.json();
      data = summaryData.data;
      filename = `employee-report-${employeeId}-${Date.now()}`;
    } else {
      // Fetch aggregate data using the same logic as the aggregate endpoint
      const aggregateResponse = await fetch(`${request.nextUrl.origin}/api/reports/aggregate`, {
        method: 'POST',
        headers: { 
          authorization: `Bearer ${token}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          ...params,
          pagination: { page: 1, pageSize: 10000 } // Get all data for export
        })
      });

      if (!aggregateResponse.ok) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch aggregate data for export' },
          { status: 500 }
        );
      }

      const aggregateData = await aggregateResponse.json();
      data = aggregateData.data;
      filename = `aggregate-report-${Date.now()}`;
    }

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(process.cwd(), 'public', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    let downloadUrl: string;
    let rowCount = 0;

    if (format === 'csv') {
      downloadUrl = await generateCSV(data, level, filename, exportsDir);
      rowCount = level === 'individual' ? 1 : data.rows?.length || 0;
    } else {
      downloadUrl = await generatePDF(data, level, filename, exportsDir);
      rowCount = level === 'individual' ? 1 : data.rows?.length || 0;
    }

    // Log the export action for audit
    try {
      await AuditLog.create({
        account_id: accountId,
        user_id: userId,
        action_type: 'REPORT_EXPORT',
        details: {
          level,
          format,
          params,
          rowCount,
          filename: `${filename}.${format}`
        },
        timestamp: new Date()
      });
    } catch (auditError) {
      console.error('Failed to log export action:', auditError);
      // Continue despite audit logging failure
    }

    // Set expiration time (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return NextResponse.json({
      success: true,
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
      filename: `${filename}.${format}`,
      rowCount
    });

  } catch (error) {
    console.error('Error creating export:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateCSV(data: any, level: string, filename: string, exportsDir: string): Promise<string> {
  let csvContent = '';
  
  if (level === 'individual') {
    // Add metadata header
    csvContent += `# Employee Report Export\n`;
    csvContent += `# Generated: ${new Date().toISOString()}\n`;
    csvContent += `# Window: ${data.window.start} to ${data.window.end}\n`;
    csvContent += `# Employee: ${data.profile.name}\n\n`;
    
    // Basic metrics
    csvContent += 'Metric,Value\n';
    csvContent += `Employee Name,"${data.profile.name}"\n`;
    csvContent += `Department,"${data.profile.department}"\n`;
    csvContent += `Job Title,"${data.profile.jobTitle}"\n`;
    csvContent += `Average Score,${data.metrics.avgScore || 'N/A'}\n`;
    csvContent += `Lessons Completed,${data.metrics.lessonsCompleted}\n`;
    csvContent += `Time Spent (minutes),${data.metrics.timeSpentMinutes}\n`;
    csvContent += `Videos Uploaded,${data.metrics.videosUploaded}\n`;
    
    if (data.metrics.improvement) {
      csvContent += `Score Improvement,${data.metrics.improvement.delta}\n`;
      csvContent += `Improvement Percentage,${data.metrics.improvement.deltaPct}%\n`;
    }

    // Attributes
    if (data.attributes && data.attributes.length > 0) {
      csvContent += '\nCustom Attributes\n';
      csvContent += 'Attribute,Value\n';
      data.attributes.forEach((attr: any) => {
        csvContent += `"${attr.name}","${attr.value}"\n`;
      });
    }

    // Assignments if available
    if (data.assignments && data.assignments.length > 0) {
      csvContent += '\nAssignments\n';
      csvContent += 'Title,Status,Videos Uploaded,Lessons,Score,Completed At\n';
      data.assignments.forEach((assignment: any) => {
        csvContent += `"${assignment.title}","${assignment.status}",${assignment.videosUploaded},${assignment.lessons},"${assignment.score || 'N/A'}","${assignment.completedAt || 'N/A'}"\n`;
      });
    }
  } else {
    // Aggregate report
    csvContent += `# Aggregate Report Export\n`;
    csvContent += `# Generated: ${new Date().toISOString()}\n`;
    csvContent += `# Window: ${data.window.start} to ${data.window.end}\n`;
    csvContent += `# Grouped By: ${data.groupBy.attributeName}\n\n`;
    
    csvContent += 'Group Value,Headcount,Average Score,Lessons Completed,Time Spent (minutes),Videos Uploaded,Improvement Delta\n';
    
    data.rows.forEach((row: any) => {
      csvContent += `"${row.groupValue}",${row.headcount},"${row.avgScore || 'N/A'}",${row.lessons},${row.timeSpentMinutes},${row.videos},"${row.improvementDelta || 'N/A'}"\n`;
    });
  }

  const filePath = path.join(exportsDir, `${filename}.csv`);
  fs.writeFileSync(filePath, csvContent);
  
  return `/exports/${filename}.csv`;
}

async function generatePDF(data: any, level: string, filename: string, exportsDir: string): Promise<string> {
  // For now, create a simple text-based PDF content
  // In a production environment, you would use a library like puppeteer or jsPDF
  
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>USpeak Pro Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .metric { margin: 10px 0; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .chart-placeholder { 
          background-color: #f9f9f9; 
          padding: 20px; 
          margin: 20px 0; 
          text-align: center; 
          border: 1px solid #ddd; 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>USpeak Pro - ${level === 'individual' ? 'Employee' : 'Aggregate'} Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <p>Report Period: ${data.window.start} to ${data.window.end}</p>
        ${level === 'aggregate' ? `<p>Grouped By: ${data.groupBy.attributeName}</p>` : ''}
      </div>
  `;

  if (level === 'individual') {
    htmlContent += `
      <h2>Employee: ${data.profile.name}</h2>
      <div class="metric"><strong>Department:</strong> ${data.profile.department}</div>
      <div class="metric"><strong>Job Title:</strong> ${data.profile.jobTitle}</div>
      
      <h3>Key Performance Indicators</h3>
      <table>
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Average Score</td><td>${data.metrics.avgScore || 'N/A'}</td></tr>
        <tr><td>Lessons Completed</td><td>${data.metrics.lessonsCompleted}</td></tr>
        <tr><td>Time Spent (minutes)</td><td>${data.metrics.timeSpentMinutes}</td></tr>
        <tr><td>Videos Uploaded</td><td>${data.metrics.videosUploaded}</td></tr>
        ${data.metrics.improvement ? `<tr><td>Score Improvement</td><td>${data.metrics.improvement.delta} (${data.metrics.improvement.deltaPct}%)</td></tr>` : ''}
      </table>

      ${data.attributes && data.attributes.length > 0 ? `
        <h3>Custom Attributes</h3>
        <table>
          <tr><th>Attribute</th><th>Value</th></tr>
          ${data.attributes.map((attr: any) => `<tr><td>${attr.name}</td><td>${attr.value}</td></tr>`).join('')}
        </table>
      ` : ''}

      <div class="chart-placeholder">
        <p><em>Charts would be rendered here in a production implementation</em></p>
        <p>Score Trend • Time Spent by Day • Videos per Week</p>
      </div>
    `;
  } else {
    htmlContent += `
      <h3>Summary</h3>
      <table>
        <tr>
          <th>Group Value</th>
          <th>Headcount</th>
          <th>Avg Score</th>
          <th>Lessons</th>
          <th>Time Spent</th>
          <th>Videos</th>
          <th>Improvement</th>
        </tr>
        ${data.rows.map((row: any) => `
          <tr>
            <td>${row.groupValue}</td>
            <td>${row.headcount}</td>
            <td>${row.avgScore || 'N/A'}</td>
            <td>${row.lessons}</td>
            <td>${row.timeSpentMinutes}</td>
            <td>${row.videos}</td>
            <td>${row.improvementDelta || 'N/A'}</td>
          </tr>
        `).join('')}
      </table>

      <div class="chart-placeholder">
        <p><em>Charts would be rendered here in a production implementation</em></p>
        <p>Distribution Chart • Frequency Analysis</p>
      </div>
    `;
  }

  htmlContent += `
    </body>
    </html>
  `;

  // For now, save as HTML file (in production, convert to PDF using puppeteer or similar)
  const filePath = path.join(exportsDir, `${filename}.pdf`);
  fs.writeFileSync(filePath, htmlContent);
  
  return `/exports/${filename}.pdf`;
}
