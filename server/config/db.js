import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.join(__dirname, "../.mongodb_data");

let mongoServer = null;

const ATLAS_URI =
  "mongodb+srv://manasmullayil2007_db_user:yEpueCUenHtVhG9V@campuscycle.fu1ikmu.mongodb.net/campuscycle?retryWrites=true&w=majority&appName=CampusCycle";

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGO_URI || ATLAS_URI;

  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(`[Database] Connected successfully to MongoDB at ${uri.includes("@") ? uri.split("@")[1] : uri}`);
    return mongoose.connection;
  } catch (err) {
    console.warn(`[Database] External MongoDB connection error: ${err.message}`);

    // On Vercel / serverless or production, do not attempt to start in-memory binary
    if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
      throw err;
    }

    console.log("[Database] Initializing local embedded MongoDB engine...");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      mongoServer = await MongoMemoryServer.create({
        instance: {
          dbPath: dbDir,
          storageEngine: "wiredTiger",
          launchTimeout: 120000
        }
      });
      const memUri = mongoServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[Database] Embedded persistent MongoDB connected at ${memUri}`);
      return mongoose.connection;
    } catch (memErr) {
      console.warn(`[Database] In-memory persistent failed (${memErr.message}), trying transient mode...`);
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      mongoServer = await MongoMemoryServer.create({
        instance: {
          launchTimeout: 120000
        }
      });
      const memUri = mongoServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[Database] Embedded in-memory MongoDB connected at ${memUri}`);
      return mongoose.connection;
    }
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};