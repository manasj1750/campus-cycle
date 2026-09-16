import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_URL !== "https://your-project.supabase.co" &&
  SUPABASE_KEY &&
  SUPABASE_KEY !== "your-supabase-service-role-key"
);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export const checkSupabaseConnection = async () => {
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not yet configured in server/.env."
    };
  }

  try {
    const { error } = await supabase.from("categories").select("id").limit(1);
    if (error) throw error;
    return { ok: true, message: "Connected to Supabase PostgreSQL database successfully!" };
  } catch (err) {
    return { ok: false, message: err.message };
  }
};
