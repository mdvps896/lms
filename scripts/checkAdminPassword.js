const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
}, {
    timestamps: true
});

async function checkAdminPassword() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        
        const MONGODB_URI = process.env.MONGODB_URI;
        
        if (!MONGODB_URI) {
            throw new Error('Please define the MONGODB_URI environment variable in .env.local');
        }

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const User = mongoose.models.User || mongoose.model('User', userSchema);

        const admin = await User.findOne({ email: 'admin@duralux.com' });

        if (admin) {
            console.log('✅ Admin found:');
            console.log('Email:', admin.email);
            console.log('Name:', admin.name);
            console.log('Role:', admin.role);
            console.log('Password (hashed):', admin.password);
            console.log('Password length:', admin.password.length);
            console.log('Is BCrypt hash?', admin.password.startsWith('$2'));
        } else {
            console.log('❌ Admin not found');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

checkAdminPassword()
    .then(() => {
        console.log('👍 Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Failed:', error);
        process.exit(1);
    });
