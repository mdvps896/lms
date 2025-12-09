// This file runs once when the server starts (including serverless cold starts)
// Perfect for ensuring models are registered before any requests

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Import all models to ensure they're registered
        await import('./models/init.js');
        console.log('✅ Models registered via instrumentation');
    }
}
