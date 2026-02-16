const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
console.log(`Loading env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Error loading .env.local:', result.error);
}

async function testCategories() {
    try {
        console.log('🔄 Connecting to MongoDB...');

        const MONGODB_URI = process.env.MONGODB_URI;

        if (!MONGODB_URI) {
            throw new Error('Please define the MONGODB_URI environment variable in .env.local');
        }

        console.log(`URI found (starts with): ${MONGODB_URI.substring(0, 15)}...`);

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Category = mongoose.connection.collection('categories');
        const categories = await Category.find({}).toArray();

        console.log(`\n📊 Total categories found: ${categories.length}\n`);
        categories.forEach(c => console.log(` - ${c.name} (${c.status})`));

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('🔌 MongoDB connection closed');
        }
    }
}

testCategories();
