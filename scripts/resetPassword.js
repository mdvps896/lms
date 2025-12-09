const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function resetUserPassword() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        
        const MONGODB_URI = process.env.MONGODB_URI;
        
        if (!MONGODB_URI) {
            throw new Error('Please define the MONGODB_URI environment variable in .env.local');
        }

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const User = mongoose.connection.collection('users');

        const email = 'imkhabri68@gmail.com';
        const newPassword = 'admin123'; // New simple password
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.updateOne(
            { email: email },
            { $set: { password: hashedPassword } }
        );

        console.log('✅ Password updated successfully!');
        console.log('\n📧 Login Credentials:');
        console.log('Email:', email);
        console.log('Password:', newPassword);
        console.log('\n⚠️  Please change this password after login!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

resetUserPassword()
    .then(() => {
        console.log('👍 Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Failed:', error);
        process.exit(1);
    });
