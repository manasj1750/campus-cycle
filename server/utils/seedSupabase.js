import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { supabase, isSupabaseConfigured } from "../config/supabase.js";

dotenv.config();

const INITIAL_CATEGORIES = [
  {
    name: "Cycles & Mobility",
    slug: "cycles-mobility",
    icon: "Bike",
    description: "Bicycles, campus scooters, locks, and riding accessories",
    subcategories: ["Geared Bicycles", "Single-Speed Bicycles", "E-Scooters", "Helmets & Accessories"]
  },
  {
    name: "Laptops & Tech",
    slug: "laptops-tech",
    icon: "Laptop",
    description: "Laptops, calculators, chargers, keyboards, monitors",
    subcategories: ["Laptops", "Scientific Calculators", "Chargers & Cables", "Audio & Headphones", "Keyboards & Mice"]
  },
  {
    name: "Books & Education",
    slug: "books-education",
    icon: "BookOpen",
    description: "Semester textbooks, course notes, reference guides, exam prep",
    subcategories: ["Engineering Textbooks", "Management & Commerce", "Computer Science Notes", "Entrance Exam Prep"]
  },
  {
    name: "Hostel & Room",
    slug: "hostel-room",
    icon: "Home",
    description: "Mattresses, study lamps, storage racks, mini-kettles",
    subcategories: ["Bedding & Mattresses", "Study Lamps", "Kettles & Appliances", "Storage Organizers"]
  },
  {
    name: "Fashion & Wear",
    slug: "fashion-wear",
    icon: "Shirt",
    description: "College hoodies, lab coats, sports gear, watches",
    subcategories: ["Lab Coats", "College Merchandise", "Sportswear", "Watches & Bags"]
  },
  {
    name: "Lab & Stationery",
    slug: "lab-stationery",
    icon: "Wrench",
    description: "Drafters, drawing boards, lab kits, components",
    subcategories: ["Engineering Drafters", "Arduino & Sensors", "Stationery Bundles", "Lab Uniforms"]
  }
];

const INITIAL_USERS = [
  {
    name: "Aarav Sharma",
    email: "aarav.bca@campus.edu",
    password: "Password@123",
    department: "BCA",
    year: "3rd Year",
    college: "Campus Institute of Technology",
    location: "Hostel Block A",
    role: "USER"
  },
  {
    name: "Priya Patel",
    email: "priya.bcom@campus.edu",
    password: "Password@123",
    department: "BCOM",
    year: "2nd Year",
    college: "Campus Institute of Technology",
    location: "Main Campus",
    role: "USER"
  },
  {
    name: "Rohan Varma",
    email: "rohan.bba@campus.edu",
    password: "Password@123",
    department: "BBA",
    year: "1st Year",
    college: "Campus Institute of Technology",
    location: "Library",
    role: "USER"
  },
  {
    name: "Ananya Iyer",
    email: "ananya.mba@campus.edu",
    password: "Password@123",
    department: "MBA",
    year: "Final Year",
    college: "Campus Institute of Technology",
    location: "Student Center",
    role: "ADMIN"
  }
];

async function seedSupabase() {
  console.log("================================================");
  console.log("   CampusCycle: Supabase Seeding Script        ");
  console.log("================================================");

  if (!isSupabaseConfigured) {
    console.error("❌ Supabase environment variables are missing.");
    console.error("Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to server/.env.");
    process.exit(1);
  }

  // 1. Seed Categories
  console.log("\n1. Seeding Categories...");
  for (const cat of INITIAL_CATEGORIES) {
    const { error } = await supabase.from("categories").upsert(cat, { onConflict: "slug" });
    if (error) console.warn(`Category ${cat.name} error:`, error.message);
  }
  console.log("✔ Categories seeded.");

  // 2. Seed Users
  console.log("\n2. Seeding Student Users...");
  const userMap = {};
  for (const u of INITIAL_USERS) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          name: u.name,
          email: u.email.toLowerCase(),
          password: hashedPassword,
          department: u.department,
          year: u.year,
          college: u.college,
          location: u.location,
          role: u.role,
          is_verified: true
        },
        { onConflict: "email" }
      )
      .select("id, email")
      .single();

    if (error) {
      console.warn(`User ${u.email} error:`, error.message);
    } else if (data) {
      userMap[data.email] = data.id;
    }
  }
  console.log(`✔ Users seeded: ${Object.keys(userMap).length}`);

  // 3. Seed Sample Products
  console.log("\n3. Seeding Sample Campus Listings...");
  const sampleProducts = [
    {
      title: "Hero Sprint Pro 21-Speed Geared Bicycle",
      description: "Well maintained 21-gear cycle used for 2 semesters. Brand new dual disc brake pads and front suspension. Includes heavy metal cable lock and bottle cage.",
      price: 3400,
      original_price: 8500,
      category: "Cycles & Mobility",
      condition: "Excellent",
      brand: "Hero",
      model: "Sprint Pro",
      purchase_year: 2024,
      seller_id: userMap["aarav.bca@campus.edu"] || Object.values(userMap)[0],
      location: "Hostel",
      images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80"],
      primary_image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80",
      status: "APPROVED",
      is_negotiable: true,
      tags: ["cycle", "hero", "geared", "hostel"]
    },
    {
      title: "Casio FX-991CW Advanced Scientific Calculator",
      description: "Official model permitted in university semester exams. High-definition natural textbook display, 540+ functions. Original box and warranty slip included.",
      price: 850,
      original_price: 1595,
      category: "Laptops & Tech",
      condition: "Like New",
      brand: "Casio",
      model: "FX-991CW",
      purchase_year: 2025,
      seller_id: userMap["priya.bcom@campus.edu"] || Object.values(userMap)[0],
      location: "Library",
      images: ["https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80"],
      primary_image: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80",
      status: "APPROVED",
      is_negotiable: false,
      tags: ["casio", "calculator", "exam", "tech"]
    },
    {
      title: "Core Java & DSA Complete Semester Textbook Bundle",
      description: "Complete semester reference book with marked previous year questions, diagrams, and code snippets. Clean pages with zero ink markings.",
      price: 420,
      original_price: 950,
      category: "Books & Education",
      condition: "Good",
      brand: "Pearson",
      model: "12th Edition",
      purchase_year: 2024,
      seller_id: userMap["aarav.bca@campus.edu"] || Object.values(userMap)[0],
      location: "Department",
      images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80"],
      primary_image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
      status: "APPROVED",
      is_negotiable: true,
      tags: ["textbook", "java", "dsa", "bca"]
    }
  ];

  for (const prod of sampleProducts) {
    if (prod.seller_id) {
      await supabase.from("products").insert(prod);
    }
  }
  console.log("✔ Sample listings seeded.");

  console.log("\n================================================");
  console.log("   🎉 Supabase Seeding Complete!               ");
  console.log("================================================");
  process.exit(0);
}

seedSupabase().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
