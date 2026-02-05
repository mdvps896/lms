const mongoose = require('mongoose');

// MONGODB_URI should be in .env.local or similar, but I'll try to guess it or find it.
// Actually, I'll just use the one from lib/mongodb.js if I can find it.
async function debugData() {
    try {
        // Find MONGODB_URI
        const fs = require('fs');
        const path = require('path');
        const envPath = path.join(process.cwd(), '.env.local');
        let uri = 'mongodb+srv://mdvps896_db_user:SqN4eiayvFYfqC9k@cluster0.ese1cpi.mongodb.net/?appName=Cluster0'; // Fallback

        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/MONGODB_URI=(.*)/);
            if (match) uri = match[1].trim();
        }

        console.log('Connecting to:', uri);
        await mongoose.connect(uri);

        const submissionSchema = new mongoose.Schema({}, { strict: false });
        const ESignSubmission = mongoose.models.ESignSubmission || mongoose.model('ESignSubmission', submissionSchema, 'esignsubmissions');

        const submission = await ESignSubmission.findOne().sort({ createdAt: -1 });
        if (submission) {
            console.log('Last Submission Documents:', JSON.stringify(submission.documents, null, 2));
        } else {
            console.log('No submissions found');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

debugData();
