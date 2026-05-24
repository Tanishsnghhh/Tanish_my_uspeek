import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const DB_NAME = 'uspeak-pro';
const SUPER_ADMIN_COLLECTION = 'superadmins';

async function seedSuperAdmin() {
  let client = null;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const superAdminCollection = db.collection(SUPER_ADMIN_COLLECTION);

    console.log('📊 Checking existing super admin accounts...');
    
    // Check if super admin already exists
    const existingAdmin = await superAdminCollection.findOne({ 
      emailId: 'superadmin@uspeek.com' 
    });
    
    if (existingAdmin) {
      console.log('✅ Super admin account already exists:', existingAdmin.emailId);
      console.log('📋 Account details:');
      console.log('   - ID:', existingAdmin._id.toString());
      console.log('   - Name:', existingAdmin.fullName);
      console.log('   - Email:', existingAdmin.emailId);
      console.log('   - Type:', existingAdmin.userType);
      console.log('   - Password:', existingAdmin.openPass);
      console.log('   - Status:', existingAdmin.status);
      return;
    }

    console.log('🔐 Creating super admin account...');
    
    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash('super@123', salt);

    // Create the super admin account
    const superAdminData = {
      fullName: 'Super Admin',
      emailId: 'superadmin@uspeek.com',
      userType: 'Super Administrator',
      openPass: 'super@123', // Plain text password for display
      password_hash: password_hash, // Hashed password for authentication
      contactNo: '+1-555-0123',
      pictureLocation: '/images/superadmin.jpg',
      status: 'ACTIVE',
      administrator: true,
      lastLoginAt: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await superAdminCollection.insertOne(superAdminData);
    
    console.log('✅ Super admin account created successfully!');
    console.log('📋 Account details:');
    console.log('   - ID:', result.insertedId.toString());
    console.log('   - Name:', superAdminData.fullName);
    console.log('   - Email:', superAdminData.emailId);
    console.log('   - Type:', superAdminData.userType);
    console.log('   - Password:', superAdminData.openPass);
    console.log('   - Status:', superAdminData.status);
    console.log('   - Contact:', superAdminData.contactNo);
    
    console.log('\n🎉 Super admin seeding completed successfully!');
    console.log('🔑 Login credentials:');
    console.log('   Email: superadmin@uspeek.com');
    console.log('   Password: super@123');

  } catch (error) {
    console.error('❌ Error seeding super admin:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the seeding function
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSuperAdmin()
    .then(() => {
      console.log('✅ Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding process failed:', error);
      process.exit(1);
    });
}

export { seedSuperAdmin };
