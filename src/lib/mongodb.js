import mongoose from 'mongoose';
// Import all models in correct order to ensure they're registered before any database operations
import '../models/init.js';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
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
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 to avoid potential DNS issues with IPv6
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
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
