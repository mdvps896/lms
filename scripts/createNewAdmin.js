const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function createOrUpdateAdmin() {
    try {
        console.log('🔄 Connecting to MongoDB...');

        const MONGODB_URI = process.env.MONGODB_URI;

        if (!MONGODB_URI) {
            throw new Error('Please define the MONGODB_URI environment variable in .env.local');
        }

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const User = mongoose.connection.collection('users');
        const Category = mongoose.connection.collection('categories');

        // Get General category
        const generalCategory = await Category.findOne({ name: 'General' });

        if (!generalCategory) {
            console.log('❌ General category not found. Please run: npm run add:category');
            return;
        }

        console.log('✅ General category found:', generalCategory._id);

        // Create new admin with known password
        const newAdminEmail = 'admin@gmail.com';
        const newAdminPassword = 'admin123';

        const hashedPassword = await bcrypt.hash(newAdminPassword, 10);

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: newAdminEmail });

        if (existingAdmin) {
            console.log('⚠️  Admin with email admin@gmail.com already exists');
            console.log('Updating password...');

            await User.updateOne(
                { email: newAdminEmail },
                {
                    $set: {
                        password: hashedPassword,
                        category: generalCategory._id,
                        role: 'admin',
                        status: 'active'
                    }
                }
            );

            console.log('✅ Admin password updated!');
        } else {
            console.log('Creating new admin user...');

            await User.insertOne({
                name: 'Admin',
                email: newAdminEmail,
                password: hashedPassword,
                role: 'admin',
                category: generalCategory._id,
                status: 'active',
                isGoogleAuth: false,
                authProvider: 'local',
                emailVerified: true,
                twoFactorEnabled: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log('✅ New admin user created!');
        }

        console.log('\n📧 Login Credentials:');
        console.log('Email: admin@duralux.com');
        console.log('Password: admin123');
        console.log('\n⚠️  Please change this password after first login!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

createOrUpdateAdmin()
    .then(() => {
        console.log('👍 Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Failed:', error);
        process.exit(1);
    });
