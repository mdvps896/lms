// Script to seed admin user in MongoDB
// Run with: node scripts/seed-admin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    profileImage: String,
    username: String,
    phone: String,
    password: String,
    role: String,
    category: mongoose.Schema.Types.ObjectId,
    status: String,
    isGoogleAuth: Boolean,
    authProvider: String,
    googleId: String,
    emailVerified: Boolean,
    registrationOtp: String,
    registrationOtpExpiry: Date,
    resetOtp: String,
    resetOtpExpiry: Date,
    twoFactorEnabled: Boolean,
    twoFactorOtp: String,
    twoFactorOtpExpiry: Date,
    rollNumber: String,
    enrolledCourses: Array,
    fcmToken: String,
    notificationsEnabled: Boolean,
    address: String,
    city: String,
    state: String,
    pincode: String,
    failedLoginAttempts: Number,
    lockUntil: Date,
    activeDeviceId: String,
    deviceChangeCount: Number,
    deviceChangeWindowStart: Date,
    registerSource: String,
    lastActiveAt: Date,
    dob: Date,
    admissionDate: Date,
    gender: String,
    secondaryEmail: String,
    education: String,
    createdAt: Date
}, {
    timestamps: true,
    strict: false
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedAdmin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected successfully!');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@mdconsultancy.in' });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log('Email:', existingAdmin.email);
            console.log('Name:', existingAdmin.name);
            console.log('Role:', existingAdmin.role);

            // Ask if user wants to update password
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            readline.question('Do you want to reset the admin password? (yes/no): ', async (answer) => {
                if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                    const hashedPassword = await bcrypt.hash('admin123', 10);
                    existingAdmin.password = hashedPassword;
                    await existingAdmin.save();
                    console.log('✅ Admin password has been reset to: admin123');
                } else {
                    console.log('No changes made.');
                }
                readline.close();
                await mongoose.connection.close();
                process.exit(0);
            });
            return;
        }

        // Create new admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const adminUser = await User.create({
            name: 'Admin',
            email: 'admin@mdconsultancy.in',
            password: hashedPassword,
            role: 'admin',
            status: 'active',
            authProvider: 'local',
            emailVerified: true,
            notificationsEnabled: true,
            registerSource: 'web',
            createdAt: new Date(),
            admissionDate: new Date()
        });

        console.log('\n✅ Admin user created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:', adminUser.email);
        console.log('🔑 Password: admin123');
        console.log('👤 Name:', adminUser.name);
        console.log('🎭 Role:', adminUser.role);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  Please change the password after first login!');

        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seedAdmin();
