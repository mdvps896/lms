// Script to create an admin user in MongoDB
// Run this script using: node scripts/createAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
        }
    });
}

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String,
        enum: ['admin', 'teacher', 'student'],
        default: 'student'
    },
    phone: String,
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    profileImage: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createAdminUser() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        // Admin user details
        const adminEmail = 'admin@duralux.com';
        
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        
        if (existingAdmin) {
            console.log('❌ Admin user already exists with email:', adminEmail);
            console.log('Admin details:', {
                name: existingAdmin.name,
                email: existingAdmin.email,
                role: existingAdmin.role
            });
        } else {
            // Hash password
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            // Create admin user
            const adminUser = new User({
                name: 'Admin User',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                phone: '+1234567890',
                address: 'Admin Address',
                city: 'Admin City',
                state: 'Admin State',
                country: 'India',
                zipCode: '000000',
                isActive: true
            });

            await adminUser.save();
            
            console.log('✓ Admin user created successfully!');
            console.log('Admin credentials:');
            console.log('Email:', adminEmail);
            console.log('Password: admin123');
            console.log('\n⚠️  Please change the password after first login!');
        }

        // Close connection
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run the script
createAdminUser();
