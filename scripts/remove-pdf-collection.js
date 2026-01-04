// Script to remove PDF collection from database
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
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

async function removePDFCollection() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;

        // Check if PDF collection exists
        const collections = await db.listCollections({ name: 'pdfs' }).toArray();

        if (collections.length > 0) {
            console.log('📄 Found PDF collection, removing...');
            await db.collection('pdfs').drop();
            console.log('✅ PDF collection removed successfully!');
        } else {
            console.log('ℹ️  PDF collection does not exist');
        }

        // Also check for payments related to PDFs and clean them up
        const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
        const pdfPayments = await Payment.find({ 'metadata.type': 'pdf_purchase' });

        if (pdfPayments.length > 0) {
            console.log(`📋 Found ${pdfPayments.length} PDF-related payments, removing...`);
            await Payment.deleteMany({ 'metadata.type': 'pdf_purchase' });
            console.log('✅ PDF-related payments removed!');
        } else {
            console.log('ℹ️  No PDF-related payments found');
        }

        await mongoose.connection.close();
        console.log('\n✅ Database cleanup complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run the script
removePDFCollection();
