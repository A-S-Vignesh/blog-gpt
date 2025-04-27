import mongoose from "mongoose";

let isConnect = false;

const uri = process.env.MONGODB_URI;
const options = {
  dbName: "blog",
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 5,
};

export const connectToDB = async () => {
  if (isConnect) {
    console.log("MongoDB is already connected!");
    return;
  }

  try {
    if (mongoose.connection.readyState === 1) {
      isConnect = true;
      console.log("Using existing MongoDB connection");
      return;
    }

    mongoose.set("strictQuery", true);
    
    // Set up connection event handlers before connecting
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
      isConnect = true;
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnect = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnect = false;
    });

    // Connect with a timeout
    const connectPromise = mongoose.connect(uri, options);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 10000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    console.log("MongoDB connected");
    isConnect = true;
  } catch (error) {
    console.error(`Unable to connect to database: ${error}`);
    isConnect = false;
    throw error;
  }
};
