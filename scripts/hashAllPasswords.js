const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function hashAllPlainTextPasswords() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        
        const MONGODB_URI = process.env.MONGODB_URI;
        
        if (!MONGODB_URI) {
            throw new Error('Please define the MONGODB_URI environment variable in .env.local');
        }

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const User = mongoose.connection.collection('users');

        // Find all users
        const users = await User.find({}).toArray();
        
        console.log(`\n📊 Total users found: ${users.length}\n`);

        let updatedCount = 0;
        
        for (const user of users) {
            // Check if password is plain text (not hashed)
            if (user.password && !user.password.startsWith('$2')) {
                console.log(`🔄 Hashing password for: ${user.email}`);
                
                const hashedPassword = await bcrypt.hash(user.password, 10);
                
                await User.updateOne(
                    { _id: user._id },
                    { $set: { password: hashedPassword } }
                );
                
                console.log(`✅ Password hashed for: ${user.email}`);
                updatedCount++;
            } else {
                console.log(`⏭️  Skipping ${user.email} - Already hashed`);
            }
        }

        console.log(`\n✅ Successfully hashed ${updatedCount} passwords!`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

hashAllPlainTextPasswords()
    .then(() => {
        console.log('👍 Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Failed:', error);
        process.exit(1);
    });
