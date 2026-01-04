// Script to seed test notifications for a user
// Run this script using: node scripts/seed-notifications.js <userEmail>

const mongoose = require('mongoose');
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
    role: String,
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['exam_created', 'exam_started', 'exam_ended', 'exam_updated', 'course_purchase', 'general'],
        required: true,
    },
    data: { type: mongoose.Schema.Types.Map, of: String },
    recipients: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        read: { type: Boolean, default: false },
        readAt: Date,
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

async function seedNotifications() {
    try {
        // Get user email from command line argument
        const userEmail = process.argv[2];

        if (!userEmail) {
            console.log('❌ Please provide a user email as argument');
            console.log('Usage: node scripts/seed-notifications.js <userEmail>');
            process.exit(1);
        }

        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        // Find the user
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            console.log(`❌ User not found with email: ${userEmail}`);
            await mongoose.connection.close();
            process.exit(1);
        }

        console.log(`✓ Found user: ${user.name} (${user.email})`);

        // Find admin user for createdBy
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('❌ No admin user found in database');
            await mongoose.connection.close();
            process.exit(1);
        }

        // Sample notifications
        const notifications = [
            {
                title: 'Welcome to God of Graphics! 🎉',
                message: 'Thank you for joining us. Start exploring our courses and exams to enhance your skills.',
                type: 'general',
                data: new Map(),
                recipients: [{ userId: user._id, read: false }],
                createdBy: admin._id,
                status: 'active',
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            },
            {
                title: 'New Course Available: Advanced Graphics Design',
                message: 'Check out our latest course on advanced graphics design techniques. Enroll now!',
                type: 'general',
                data: new Map([['courseId', 'sample-course-id']]),
                recipients: [{ userId: user._id, read: false }],
                createdBy: admin._id,
                status: 'active',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            },
            {
                title: 'Course Purchase Successful 💳',
                message: 'Your purchase of "Introduction to Photoshop" has been confirmed. Start learning now!',
                type: 'course_purchase',
                data: new Map([['courseId', 'photoshop-101'], ['amount', '999']]),
                recipients: [{ userId: user._id, read: true, readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }],
                createdBy: admin._id,
                status: 'active',
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
            },
            {
                title: 'New Exam Created: Graphics Fundamentals 📝',
                message: 'A new exam "Graphics Fundamentals" has been created. Test your knowledge!',
                type: 'exam_created',
                data: new Map([['examId', 'exam-graphics-101']]),
                recipients: [{ userId: user._id, read: false }],
                createdBy: admin._id,
                status: 'active',
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            },
            {
                title: 'Reminder: Complete Your Course',
                message: 'You have 3 pending lessons in "Advanced Illustrator". Continue your learning journey!',
                type: 'general',
                data: new Map([['courseId', 'illustrator-advanced']]),
                recipients: [{ userId: user._id, read: false }],
                createdBy: admin._id,
                status: 'active',
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            },
            {
                title: 'Special Offer: 50% Off on All Courses! 🎁',
                message: 'Limited time offer! Get 50% discount on all courses. Use code: GRAPHICS50',
                type: 'general',
                data: new Map([['couponCode', 'GRAPHICS50']]),
                recipients: [{ userId: user._id, read: false }],
                createdBy: admin._id,
                status: 'active',
                createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
            },
            {
                title: 'Live Session Tomorrow 🎥',
                message: 'Join our live session on "Color Theory in Design" tomorrow at 5 PM. Don\'t miss it!',
                type: 'general',
                data: new Map([['meetingId', 'live-session-001']]),
                recipients: [{ userId: user._id, read: false }],
                createdBy: admin._id,
                status: 'active',
                createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            },
            {
                title: 'Achievement Unlocked! 🏆',
                message: 'Congratulations! You have completed 5 courses. Keep up the great work!',
                type: 'general',
                data: new Map([['achievement', 'course-master']]),
                recipients: [{ userId: user._id, read: false }],
                createdBy: admin._id,
                status: 'active',
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            },
            {
                title: 'New Free Material Available 📚',
                message: 'Download our latest free resource: "Typography Best Practices Guide"',
                type: 'general',
                data: new Map([['materialId', 'typography-guide']]),
                recipients: [{ userId: user._id, read: false }],
                createdBy: admin._id,
                status: 'active',
                createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            },
            {
                title: 'System Update 🔧',
                message: 'We have updated our platform with new features. Check out what\'s new!',
                type: 'general',
                data: new Map(),
                recipients: [{ userId: user._id, read: false }],
                createdBy: admin._id,
                status: 'active',
                createdAt: new Date(), // Just now
            },
        ];

        // Insert notifications
        console.log(`\nCreating ${notifications.length} test notifications...`);
        await Notification.insertMany(notifications);

        console.log('✓ Successfully created test notifications!');
        console.log(`\nNotifications created for user: ${user.name} (${user.email})`);
        console.log(`Total notifications: ${notifications.length}`);
        console.log(`Unread notifications: ${notifications.filter(n => !n.recipients[0].read).length}`);

        // Close connection
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding notifications:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run the script
seedNotifications();
