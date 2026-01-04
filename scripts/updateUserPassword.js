// Script to update password for a specific user
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
    name: String,
    email: String,
    password: String,
    role: String,
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function updateUserPassword() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const userEmail = 'jagirdarjd890@gmail.com';
        const newPassword = 'admin@jd';

        // Find user
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            console.log(`❌ User not found with email: ${userEmail}`);
            await mongoose.connection.close();
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.name} (${user.email})`);

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await User.updateOne(
            { email: userEmail },
            { $set: { password: hashedPassword } }
        );

        console.log('✅ Password updated successfully!');
        console.log(`\nNew Login Credentials:`);
        console.log(`Email: ${userEmail}`);
        console.log(`Password: ${newPassword}`);

        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error updating password:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run the script
updateUserPassword();
