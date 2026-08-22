import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) {
    console.log('[DB] Reusing existing MongoDB connection.');
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not defined. Please set it in your .env file.\n' +
      'Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/society-tracker'
    );
  }

  try {
    await mongoose.connect(uri, {
      dbName: 'society-tracker',
    });
    isConnected = true;
    console.log('[DB] Connected to MongoDB Atlas successfully.');

    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] MongoDB disconnected.');
      isConnected = false;
    });

    mongoose.connection.on('error', (err) => {
      console.error('[DB] MongoDB connection error:', err);
      isConnected = false;
    });
  } catch (err) {
    console.error('[DB] Failed to connect to MongoDB Atlas:', err);
    throw err;
  }
}

export default mongoose;
