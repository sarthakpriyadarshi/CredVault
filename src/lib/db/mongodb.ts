import mongoose from "mongoose"

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Global cache for mongoose connection
// Use globalThis which works in both Node.js and browser environments
declare global {
  var mongooseCache: MongooseCache | undefined
}

// Safely access global object (works in both Node.js and Edge Runtime)
interface GlobalType {
  mongooseCache?: MongooseCache
}
const globalForMongoose: GlobalType = typeof global !== "undefined" ? global : (typeof globalThis !== "undefined" ? globalThis : {})

const cached: MongooseCache = globalForMongoose.mongooseCache || { conn: null, promise: null }

if (!globalForMongoose.mongooseCache) {
  globalForMongoose.mongooseCache = cached
}

async function connectDB(): Promise<typeof mongoose> {
  // Check for MONGODB_URI at connection time (not module load time)
  // This ensures Next.js has loaded .env.local
  const MONGODB_URI = process.env.MONGODB_URI

  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local\n" +
        "Example: MONGODB_URI=mongodb://localhost:27017/credvault"
    )
  }

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB

