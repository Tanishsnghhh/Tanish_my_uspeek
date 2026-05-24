import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { parse } from 'csv-parse/sync';
import bcrypt from 'bcryptjs';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const DB_NAME = 'uspeak-pro';
const USERS_COLLECTION = 'users';

// POST - Bulk upload users from CSV file
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(USERS_COLLECTION);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read and parse CSV file
    const fileContent = await file.text();
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty or has no valid data' },
        { status: 400 }
      );
    }

    // Validate required columns
    const requiredColumns = [
      'EmailID*', 'LoginPassword*', 'FirstName*', 'LastName*', 
      'ContactNo*', 'IsCompany*', 'CompanyID*', 'PlanStartDate*', 
      'PlanExpiryDate*', 'AccountStatus*'
    ];

    const csvColumns = Object.keys(records[0]);
    const missingColumns = requiredColumns.filter(col => !csvColumns.includes(col));

    if (missingColumns.length > 0) {
      return NextResponse.json(
        { 
          error: `Missing required columns: ${missingColumns.join(', ')}`,
          details: `Required columns: ${requiredColumns.join(', ')}`
        },
        { status: 400 }
      );
    }

    const results = {
      successCount: 0,
      errorCount: 0,
      errors: [] as string[],
      createdUsers: [] as any[]
    };

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +2 because CSV is 1-indexed and has header

      try {
        // Validate required fields
        if (!record['EmailID*'] || !record['FirstName*'] || !record['LastName*'] || 
            !record['ContactNo*'] || !record['IsCompany*'] || !record['AccountStatus*']) {
          results.errors.push(`Row ${rowNumber}: Missing required fields`);
          results.errorCount++;
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(record['EmailID*'])) {
          results.errors.push(`Row ${rowNumber}: Invalid email format - ${record['EmailID*']}`);
          results.errorCount++;
          continue;
        }

        // Validate phone format (should be 10 digits)
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(record['ContactNo*'])) {
          results.errors.push(`Row ${rowNumber}: Invalid phone format - ${record['ContactNo*']}. Phone number must be 10 digits`);
          results.errorCount++;
          continue;
        }

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ 
          email: record['EmailID*'].toLowerCase() 
        });
        
        if (existingUser) {
          results.errors.push(`Row ${rowNumber}: User with email ${record['EmailID*']} already exists`);
          results.errorCount++;
          continue;
        }

        // Determine role based on IsCompany field
        const isCompany = record['IsCompany*'] === '1';
        const role = isCompany ? 'CORPORATE_ADMIN' : 'EMPLOYEE';

        // Validate CompanyID for employees
        if (!isCompany && !record['CompanyID*']) {
          results.errors.push(`Row ${rowNumber}: CompanyID is required when IsCompany is 0`);
          results.errorCount++;
          continue;
        }

        // Parse dates
        const parseDate = (dateStr: string) => {
          if (!dateStr) return null;
          const [day, month, year] = dateStr.split('/');
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        };

        const planStartDate = parseDate(record['PlanStartDate*']);
        const planExpiryDate = parseDate(record['PlanExpiryDate*']);

        // Validate dates
        if (planStartDate && isNaN(planStartDate.getTime())) {
          results.errors.push(`Row ${rowNumber}: Invalid PlanStartDate format - ${record['PlanStartDate*']}`);
          results.errorCount++;
          continue;
        }

        if (planExpiryDate && isNaN(planExpiryDate.getTime())) {
          results.errors.push(`Row ${rowNumber}: Invalid PlanExpiryDate format - ${record['PlanExpiryDate*']}`);
          results.errorCount++;
          continue;
        }

        // Generate temporary password
        const generateTempPassword = () => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
          let tempPassword = '';
          for (let i = 0; i < 12; i++) {
            tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return tempPassword;
        };

        const tempPassword = generateTempPassword();
        
        // Hash the temporary password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        // Create user object
        const newUser = {
          email: record['EmailID*'].toLowerCase(),
          password_hash: hashedPassword, // Use the hashed temp password as the actual password
          firstName: record['FirstName*'],
          lastName: record['LastName*'],
          first_name: record['FirstName*'],
          last_name: record['LastName*'],
          phone: record['ContactNo*'],
          role: role,
          status: record['AccountStatus*'] === '1' ? 'ACTIVE' : 'INACTIVE',
          account_id: !isCompany ? new ObjectId(record['CompanyID*']) : new ObjectId(),
          address: record['Address'] || null,
          city: record['City'] || null,
          state: record['State'] || null,
          country: record['Country'] || null,
          branch: record['branchs'] || null,
          department: record['departments'] || null,
          userRole: record['roles'] || null,
          planStartDate: planStartDate,
          planExpiryDate: planExpiryDate,
          created_at: new Date(),
          updated_at: new Date(),
          lastLoginAt: null,
          passwordChanged: false,
          tempPassword: tempPassword
        };

        // Insert user
        const result = await usersCollection.insertOne(newUser);
        
        results.createdUsers.push({
          id: result.insertedId.toString(),
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role
        });
        
        results.successCount++;

      } catch (error: any) {
        results.errors.push(`Row ${rowNumber}: ${error.message}`);
        results.errorCount++;
      }
    }

    console.log(`Bulk upload completed: ${results.successCount} successful, ${results.errorCount} errors`);

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error: any) {
    console.error('Error processing bulk upload:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process bulk upload',
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
