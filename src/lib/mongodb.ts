import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

let lastFailAt = 0;
const FAIL_COOLDOWN_MS = 20_000;

export function isDbConfigured() {
  const uri = process.env.MONGODB_URI ?? "";
  return uri.length > 0 && !uri.includes("127.0.0.1") && !uri.includes("localhost");
}

export function shouldAttemptMongo() {
  if (cached.conn) return true;
  if (!isDbConfigured()) return false;
  if (Date.now() - lastFailAt < FAIL_COOLDOWN_MS) return false;
  return true;
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Falta MONGODB_URI en .env.local");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 2500,
    });
  }

  try {
    cached.conn = await cached.promise;
    lastFailAt = 0;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    lastFailAt = Date.now();
    throw e;
  }
}

export async function withMongoOrDev<T>(mongo: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  if (!shouldAttemptMongo()) {
    return fallback();
  }

  try {
    await connectDB();
    return await mongo();
  } catch {
    lastFailAt = Date.now();
    return fallback();
  }
}
