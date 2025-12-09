const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

// Define Category schema
const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

// Define User schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'teacher', 'student'], default: 'student' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
}, { timestamps: true });

// Register models
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function testCategoryRegistration() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected successfully');
        
        console.log('\nRegistered models:', Object.keys(mongoose.models));
        
        // Test Category model
        console.log('\n--- Testing Category Model ---');
        const categories = await Category.find();
        console.log(`Found ${categories.length} categories:`, categories.map(c => c.name));
        
        // Test User model with populate
        console.log('\n--- Testing User Model with populate ---');
        const users = await User.find().limit(2).populate('category', 'name');
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`  - ${u.email} (category: ${u.category?.name || 'none'})`);
        });
        
        console.log('\n✅ All tests passed!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        await mongoose.disconnect();
        process.exit(1);
    }
}

testCategoryRegistration();
