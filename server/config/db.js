import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.join(__dirname, "../.mongodb_data");

let mongoServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/campuscycle";
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[Database] Connected successfully to external MongoDB at ${uri}`);
  } catch (err) {
    console.warn(`[Database] External MongoDB connection to ${uri} not active (${err.message}).`);
    console.log("[Database] Initializing persistent embedded MongoDB engine...");

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    } else {
      // Clean up stale lock files from previous unclean shutdowns / restarts
      try {
        const lockPath = path.join(dbDir, "mongod.lock");
        if (fs.existsSync(lockPath)) {
          fs.unlinkSync(lockPath);
        }
        const wtLockPath = path.join(dbDir, "WiredTiger.lock");
        if (fs.existsSync(wtLockPath)) {
          fs.unlinkSync(wtLockPath);
        }
      } catch (lockErr) {
        // ignore
      }
    }

    try {
      mongoServer = await MongoMemoryServer.create({
        instance: {
          dbPath: dbDir,
          storageEngine: "wiredTiger",
          launchTimeout: 120000
        }
      });
      const memUri = mongoServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[Database] Embedded persistent MongoDB connected at ${memUri} (data stored in server/.mongodb_data)`);
    } catch (memErr) {
      console.warn(`[Database] Persistent storageEngine failed (${memErr.message}), falling back to in-memory mode...`);
      mongoServer = await MongoMemoryServer.create({
        instance: {
          launchTimeout: 120000
        }
      });
      const memUri = mongoServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[Database] Embedded in-memory MongoDB connected at ${memUri}`);
    }
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};