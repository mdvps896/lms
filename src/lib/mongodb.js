import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Pre-register all models to prevent "Schema hasn't been registered" errors
function registerModels() {
  if (mongoose.models.Category) {
    return; // Already registered
  }
  
  try {
    // Import models in dependency order
    require('@/models/Category');
    require('@/models/Subject');
    require('@/models/Question');
    require('@/models/QuestionGroup');
    require('@/models/User');
    require('@/models/Exam');
    require('@/models/ExamAttempt');
    require('@/models/Notification');
    require('@/models/Settings');
  } catch (error) {
    console.error('Error registering models:', error);
  }
}

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  // During build time, skip the connection
  if (!MONGODB_URI) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Please define the MONGODB_URI environment variable');
    }
    console.warn('MONGODB_URI not defined, skipping database connection');
    return null;
  }

  if (cached.conn) {
    // Ensure models are registered even if connection is cached
    registerModels();
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      // Register all models after connection
      registerModels();
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
