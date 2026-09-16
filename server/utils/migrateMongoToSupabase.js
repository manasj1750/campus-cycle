import mongoose from "mongoose";
import dotenv from "dotenv";
import { supabase, isSupabaseConfigured } from "../config/supabase.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://manasmullayil2007_db_user:yEpueCUenHtVhG9V@campuscycle.fu1ikmu.mongodb.net/campuscycle?retryWrites=true&w=majority&appName=CampusCycle";

async function runMigration() {
  console.log("=================================================");
  console.log("   CampusCycle: MongoDB Atlas -> Supabase Sync    ");
  console.log("=================================================");

  if (!isSupabaseConfigured) {
    console.error("❌ Error: Supabase credentials are missing.");
    console.error("Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to server/.env first.");
    process.exit(1);
  }

  console.log("1. Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGO_URI);
  console.log("✔ Connected to MongoDB.");

  // Map to store old MongoDB ObjectId -> new Supabase UUID
  const userMap = new Map();
  const productMap = new Map();
  const convoMap = new Map();

  // A. Migrate Users
  console.log("\n2. Migrating Users...");
  const mongoUsers = await User.find({}).select("+password");
  console.log(`Found ${mongoUsers.length} users in MongoDB.`);

  for (const u of mongoUsers) {
    // Check if user already exists in Supabase by email
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", u.email.toLowerCase())
      .single();

    if (existing) {
      userMap.set(String(u._id), existing.id);
    } else {
      const { data: inserted, error } = await supabase
        .from("users")
        .insert({
          name: u.name,
          email: u.email.toLowerCase(),
          password: u.password,
          college: u.college || "Campus Institute of Technology",
          student_id: u.studentId || "",
          department: u.department || "BCA",
          year: u.year || "3rd Year",
          profile_photo: u.profilePhoto || "",
          bio: u.bio || "",
          location: u.location || "Main Campus",
          role: u.role || "USER",
          is_verified: u.isVerified || false,
          created_at: u.createdAt || new Date(),
          updated_at: u.updatedAt || new Date()
        })
        .select("id")
        .single();

      if (error) {
        console.warn(`Failed to insert user ${u.email}:`, error.message);
      } else if (inserted) {
        userMap.set(String(u._id), inserted.id);
      }
    }
  }
  console.log(`✔ Synced ${userMap.size} users.`);

  // B. Migrate Categories
  console.log("\n3. Migrating Categories...");
  const mongoCats = await Category.find({});
  for (const c of mongoCats) {
    await supabase.from("categories").upsert(
      {
        name: c.name,
        slug: c.slug,
        icon: c.icon || "Tag",
        description: c.description || "",
        subcategories: c.subcategories || []
      },
      { onConflict: "slug" }
    );
  }
  console.log(`✔ Categories synced.`);

  // C. Migrate Products
  console.log("\n4. Migrating Products...");
  const mongoProducts = await Product.find({});
  console.log(`Found ${mongoProducts.length} listings in MongoDB.`);

  for (const p of mongoProducts) {
    const supabaseSellerId = userMap.get(String(p.seller));
    if (!supabaseSellerId) {
      console.warn(`Skipping product "${p.title}": seller not found in Supabase user map.`);
      continue;
    }

    const { data: inserted, error } = await supabase
      .from("products")
      .insert({
        title: p.title,
        description: p.description,
        price: p.price,
        original_price: p.originalPrice || 0,
        category: typeof p.category === "string" ? p.category : p.category?.name || "Cycles & Mobility",
        subcategory: p.subcategory || "",
        condition: p.condition || "Good",
        brand: p.brand || "",
        model: p.model || "",
        purchase_year: p.purchaseYear || null,
        images: Array.isArray(p.images) ? p.images : [],
        primary_image: p.primaryImage || p.images?.[0] || "",
        seller_id: supabaseSellerId,
        location: p.location || "Main Campus",
        tags: Array.isArray(p.tags) ? p.tags : [],
        is_negotiable: p.isNegotiable !== undefined ? p.isNegotiable : true,
        status: p.status || "APPROVED",
        views_count: p.viewsCount || 0,
        favorites_count: p.favoritesCount || 0,
        created_at: p.createdAt || new Date(),
        updated_at: p.updatedAt || new Date()
      })
      .select("id")
      .single();

    if (error) {
      console.warn(`Failed to insert product "${p.title}":`, error.message);
    } else if (inserted) {
      productMap.set(String(p._id), inserted.id);
    }
  }
  console.log(`✔ Synced ${productMap.size} listings to Supabase.`);

  // D. Migrate Conversations & Messages
  console.log("\n5. Migrating Conversations & Chat Messages...");
  const mongoConvos = await Conversation.find({});
  for (const c of mongoConvos) {
    const supabaseProductId = c.product ? productMap.get(String(c.product)) : null;

    const { data: insertedConvo, error } = await supabase
      .from("conversations")
      .insert({
        product_id: supabaseProductId,
        last_message_text: c.lastMessage?.text || "",
        created_at: c.createdAt || new Date(),
        updated_at: c.updatedAt || new Date()
      })
      .select("id")
      .single();

    if (!error && insertedConvo) {
      convoMap.set(String(c._id), insertedConvo.id);

      // Add participants
      if (Array.isArray(c.participants)) {
        for (const partId of c.participants) {
          const sUserId = userMap.get(String(partId));
          if (sUserId) {
            await supabase
              .from("conversation_participants")
              .upsert(
                { conversation_id: insertedConvo.id, user_id: sUserId },
                { onConflict: "conversation_id,user_id" }
              );
          }
        }
      }
    }
  }

  const mongoMessages = await Message.find({});
  let msgCount = 0;
  for (const m of mongoMessages) {
    const sConvoId = convoMap.get(String(m.conversation));
    const sSender = userMap.get(String(m.sender));
    const sReceiver = userMap.get(String(m.receiver));

    if (sConvoId && sSender && sReceiver) {
      const { error } = await supabase.from("messages").insert({
        conversation_id: sConvoId,
        sender_id: sSender,
        receiver_id: sReceiver,
        text: m.text,
        is_read: m.isRead || false,
        created_at: m.createdAt || new Date()
      });
      if (!error) msgCount++;
    }
  }
  console.log(`✔ Synced ${msgCount} chat messages across ${convoMap.size} conversations.`);

  console.log("\n=================================================");
  console.log("   🎉 Migration Completed Successfully!        ");
  console.log("=================================================");
  await mongoose.disconnect();
  process.exit(0);
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
