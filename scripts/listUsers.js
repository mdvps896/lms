const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function listAllUsers() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        
        const MONGODB_URI = process.env.MONGODB_URI;
        
        if (!MONGODB_URI) {
            throw new Error('Please define the MONGODB_URI environment variable in .env.local');
        }

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const User = mongoose.connection.collection('users');

        const users = await User.find({}).toArray();

        console.log(`\n📊 Total users: ${users.length}\n`);

        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name || 'No name'}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role || 'No role'}`);
            console.log(`   Password: ${user.password ? user.password.substring(0, 20) + '...' : 'No password'}`);
            console.log(`   ID: ${user._id}\n`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

listAllUsers()
    .then(() => {
        console.log('👍 Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Failed:', error);
        process.exit(1);
    });
