// Script to delete all support messages from the database
// Run with: node scripts/delete-all-chats.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const SupportMessageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        default: ''
    },
    images: [{
        type: String
    }],
    isAdmin: {
        type: Boolean,
        default: false
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const SupportMessage = mongoose.models.SupportMessage || mongoose.model('SupportMessage', SupportMessageSchema);

async function deleteAllChats() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully!');

        console.log('Deleting all support messages...');
        const result = await SupportMessage.deleteMany({});

        console.log(`✅ Successfully deleted ${result.deletedCount} messages`);

        await mongoose.connection.close();
        console.log('Database connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

deleteAllChats();
