const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

const settingsSchema = new mongoose.Schema({
    authSettings: {
        app: {
            enableMobileOTP: Boolean
        }
    }
}, { strict: false });

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

async function enableMobileOTP() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await Settings.findOneAndUpdate(
            {},
            { $set: { "authSettings.app.enableMobileOTP": true } },
            { new: true, upsert: true }
        );

        console.log('Updated Settings:', JSON.stringify(result.authSettings.app, null, 2));
        console.log('Mobile OTP enabled successfully');
    } catch (error) {
        console.error('Error enabling Mobile OTP:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

enableMobileOTP();
