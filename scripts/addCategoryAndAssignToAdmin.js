const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Category Schema
const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
    },
    status: String,
}, {
    timestamps: true
});

async function addCategoryAndAssignToAdmin() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        
        const MONGODB_URI = process.env.MONGODB_URI;
        
        if (!MONGODB_URI) {
            throw new Error('Please define the MONGODB_URI environment variable in .env.local');
        }

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get or create models
        const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
        const User = mongoose.models.User || mongoose.model('User', userSchema);

        // Create default categories
        const defaultCategories = [
            {
                name: 'General',
                description: 'General category for all users',
                status: 'active'
            },
            {
                name: 'Engineering',
                description: 'Engineering and technical courses',
                status: 'active'
            },
            {
                name: 'Medical',
                description: 'Medical and healthcare courses',
                status: 'active'
            },
            {
                name: 'Business',
                description: 'Business and management courses',
                status: 'active'
            }
        ];

        console.log('🔄 Creating categories...');
        
        const createdCategories = [];
        for (const categoryData of defaultCategories) {
            const existingCategory = await Category.findOne({ name: categoryData.name });
            
            if (existingCategory) {
                console.log(`⚠️  Category "${categoryData.name}" already exists`);
                createdCategories.push(existingCategory);
            } else {
                const newCategory = await Category.create(categoryData);
                console.log(`✅ Created category: ${newCategory.name} (ID: ${newCategory._id})`);
                createdCategories.push(newCategory);
            }
        }

        // Find admin user and assign General category
        console.log('🔄 Finding admin user...');
        const adminUser = await User.findOne({ email: 'admin@duralux.com' });

        if (!adminUser) {
            console.log('❌ Admin user with email admin@duralux.com not found');
            console.log('💡 Creating admin user...');
            
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            const newAdmin = await User.create({
                name: 'Admin',
                email: 'admin@duralux.com',
                password: hashedPassword,
                role: 'admin',
                category: createdCategories[0]._id, // Assign General category
                status: 'active'
            });
            
            console.log(`✅ Admin user created and assigned to category: ${createdCategories[0].name}`);
            console.log(`📧 Email: admin@duralux.com`);
            console.log(`🔑 Password: admin123`);
        } else {
            // Update admin user with General category
            adminUser.category = createdCategories[0]._id;
            await adminUser.save();
            console.log(`✅ Admin user found and assigned to category: ${createdCategories[0].name}`);
        }

        console.log('\n📊 Summary:');
        console.log(`Total categories: ${createdCategories.length}`);
        createdCategories.forEach(cat => {
            console.log(`  - ${cat.name} (ID: ${cat._id})`);
        });

        console.log('\n✅ Script completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

// Run the script
addCategoryAndAssignToAdmin()
    .then(() => {
        console.log('👍 All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });
