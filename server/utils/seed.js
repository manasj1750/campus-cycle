import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Wishlist } from "../models/Wishlist.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Offer } from "../models/Offer.js";
import { Review } from "../models/Review.js";
import { Notification } from "../models/Notification.js";
import { Transaction } from "../models/Transaction.js";
import { categoriesData, SEED_PASSWORD, indianColleges, departments, years } from "./seedData.js";
import { sampleProducts } from "./seedProducts.js";

dotenv.config();

const firstNames = [
  "Aarav", "Diya", "Rohan", "Ananya", "Kabir", "Isha", "Aditya", "Tanvi",
  "Varun", "Riya", "Nikhil", "Pooja", "Siddharth", "Meera", "Karan", "Sneha",
  "Devansh", "Kavya", "Ayush", "Priyanka", "Dhruv", "Avni", "Harsh", "Zoya",
  "Gautam", "Sanya", "Tejas", "Rhea", "Yash", "Simran"
];
const lastNames = [
  "Sharma", "Patel", "Verma", "Iyer", "Mehta", "Nair", "Roy", "Deshmukh",
  "Kulkarni", "Sen", "Joshi", "Hegde", "Rao", "Menon", "Malhotra", "Reddy",
  "Gupta", "Pillai", "Saxena", "Bhatt", "Bansal", "Chopra", "Vardhan", "Khan",
  "Nambiar", "Kapoor", "Pandita", "Dubey", "Singhania", "Kaur"
];

export const runSeed = async (isCli = false) => {
  try {
    console.log("🌱 CampusCycle Database Seeder Starting...");
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // Clean up
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Wishlist.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      Offer.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({}),
      Transaction.deleteMany({})
    ]);

    // Seed Categories
    await Category.insertMany(categoriesData);
    console.log(`✓ Seeded ${categoriesData.length} Categories.`);

    // Seed Admin, Student, and Seller dev accounts
    const admin = await User.create({
      name: "CampusCycle Admin",
      email: "admin@campuscycle.test",
      password: SEED_PASSWORD,
      college: "Campus Central Council",
      studentId: "ADM-2026-001",
      department: "Marketplace Moderation",
      year: "Postgraduate",
      role: "ADMIN",
      bio: "Official CampusCycle Social Responsibility Club Admin. Ensuring verified, safe campus exchanges.",
      profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
      location: "Club Office",
      isVerified: true
    });

    const student = await User.create({
      name: "Rohit Patel",
      email: "student@campuscycle.test",
      password: SEED_PASSWORD,
      college: "National Institute of Technology",
      studentId: "NIT-22-CS-104",
      department: "Computer Science & Engineering",
      year: "3rd Year",
      role: "USER",
      bio: "CS undergrad passionate about sustainable computing and robotics. Avid campus cyclist.",
      profilePhoto: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80",
      location: "Main Campus",
      isVerified: true
    });

    const seller = await User.create({
      name: "Priya Sundaram",
      email: "seller@campuscycle.test",
      password: SEED_PASSWORD,
      college: "National Institute of Technology",
      studentId: "NIT-21-EC-042",
      department: "Electronics & Communication",
      year: "4th Year",
      role: "USER",
      bio: "Final year student graduating soon! Selling well-maintained gear, textbooks & room accessories.",
      profilePhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
      location: "Hostel",
      isVerified: true
    });

    const usersList = [admin, student, seller];

    // Seed 30 more students
    for (let i = 0; i < 30; i++) {
      const fName = firstNames[i % firstNames.length];
      const lName = lastNames[i % lastNames.length];
      const gender = i % 2 === 0 ? "men" : "women";
      const u = await User.create({
        name: `${fName} ${lName}`,
        email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i + 1}@campuscycle.test`,
        password: SEED_PASSWORD,
        college: indianColleges[i % indianColleges.length],
        studentId: `STU-202${3 - (i % 4)}-${100 + i}`,
        department: departments[i % departments.length],
        year: years[i % years.length],
        role: "USER",
        bio: `Student at ${departments[i % departments.length]}. Believer in reuse, saving money, and reducing campus waste.`,
        profilePhoto: `https://randomuser.me/api/portraits/${gender}/${(i % 20) + 1}.jpg`,
        location: ["Hostel", "Main Campus", "Library", "Department", "Student Center"][i % 5],
        isVerified: true
      });
      usersList.push(u);
    }
    console.log(`✓ Seeded ${usersList.length} total users.`);

    // Prepare 55+ Products
    const products = [];
    const conditions = ["Like New", "Excellent", "Good", "Fair", "Needs Repair"];
    const statuses = ["AVAILABLE", "AVAILABLE", "AVAILABLE", "RESERVED", "SOLD"];

    // Base crafted items
    sampleProducts.forEach((sp, idx) => {
      const s = usersList[(idx % (usersList.length - 2)) + 2];
      products.push({
        ...sp,
        seller: s._id,
        status: idx === 1 ? "RESERVED" : (idx === 4 ? "SOLD" : "AVAILABLE"),
        views: Math.floor(Math.random() * 80) + 10
      });
    });

    // Expand to 55 items with variations
    const titles = [
      { t: "Dell 24-inch FHD IPS Monitor with Eye Comfort", c: "Electronics", sc: "Computer Accessories", p: 6800, op: 12500, b: "Dell" },
      { t: "Portronics SoundDrum 24W Bluetooth Speaker", c: "Electronics", sc: "Speakers", p: 1250, op: 2999, b: "Portronics" },
      { t: "Nikon D3500 with AF-P DX 18-55mm VR Lens", c: "Electronics", sc: "Cameras", p: 26000, op: 38990, b: "Nikon" },
      { t: "Atomic Habits by James Clear (Hardcover)", c: "Books & Education", sc: "Novels", p: 350, op: 799, b: "Penguin" },
      { t: "Nivia Storm Football (Size 5 FIFA Approved)", c: "Sports & Fitness", sc: "Football", p: 550, op: 1100, b: "Nivia" },
      { t: "Cosco CB-88 Carbon Badminton Racquet Set", c: "Sports & Fitness", sc: "Badminton", p: 950, op: 1990, b: "Cosco" },
      { t: "Pigeon 1800W Induction Cooktop with Touch Control", c: "Home Appliances", sc: "Microwaves", p: 1300, op: 3195, b: "Pigeon" },
      { t: "Milton Thermosteel 1000ml Hot & Cold Flask", c: "Hostel Essentials", sc: "Kitchen Items", p: 550, op: 1050, b: "Milton" },
      { t: "Cello 35L Sturdy Plastic Laundry Bucket with Lid", c: "Hostel Essentials", sc: "Buckets", p: 300, op: 750, b: "Cello" },
      { t: "Logitech C270 HD Webcam with Noise-Reducing Mic", c: "Electronics", sc: "Computer Accessories", p: 1400, op: 2595, b: "Logitech" },
      { t: "Xbox Wireless Controller (Robot White)", c: "Gaming", sc: "Controllers", p: 3800, op: 5990, b: "Microsoft" },
      { t: "Juarez 21-inch Soprano Ukulele with Case & Tuner", c: "Musical Instruments", sc: "Guitars", p: 1450, op: 2890, b: "Juarez" },
      { t: "Graphic Design & UI/UX Figma Portfolio Review", c: "Services", sc: "Graphic Design", p: 400, op: 1000, b: "Freelance" },
      { t: "Fastrack Reflex Play Smartwatch 1.3 AMOLED", c: "Electronics", sc: "Smart Watches", p: 1750, op: 4995, b: "Fastrack" },
      { t: "Quechua 20L Water-Resistant Hiking Daypack", c: "Clothing & Fashion", sc: "Bags", p: 650, op: 1499, b: "Decathlon" },
      { t: "Boat Airdopes 141 Bluetooth TWS Earbuds", c: "Electronics", sc: "Earphones", p: 850, op: 2490, b: "Boat" },
      { t: "Hostel Door Shoe Organizer & Hanging Pouch", c: "Hostel Essentials", sc: "Room Decor", p: 250, op: 600, b: "Generic" },
      { t: "Campus Vector Running Shoes (Size UK 9)", c: "Clothing & Fashion", sc: "Shoes", p: 799, op: 1699, b: "Campus" },
      { t: "Anker 65W GaN Fast Charger (Dual USB-C)", c: "Electronics", sc: "Chargers", p: 2200, op: 3999, b: "Anker" },
      { t: "Vector X 6mm Anti-Skid Yoga & Exercise Mat", c: "Sports & Fitness", sc: "Gym Equipment", p: 450, op: 999, b: "Vector X" },
      { t: "Discrete Mathematics & Its Applications by Rosen", c: "Books & Education", sc: "Textbooks", p: 650, op: 1550, b: "McGraw Hill" },
      { t: "SanDisk 1TB Portable External SSD (USB 3.2)", c: "Electronics", sc: "Computer Accessories", p: 5600, op: 9990, b: "SanDisk" },
      { t: "Stainless Steel Insulated 3-Tier Lunch Box / Tiffin", c: "Hostel Essentials", sc: "Kitchen Items", p: 480, op: 950, b: "Signoraware" },
      { t: "Wildcraft College Windcheater Jacket (Size L)", c: "Clothing & Fashion", sc: "Men's Clothing", p: 899, op: 2199, b: "Wildcraft" },
      { t: "Casio Vintage Digital Gold Dial Watch", c: "Clothing & Fashion", sc: "Watches", p: 1600, op: 3295, b: "Casio" },
      { t: "C++ & Python Data Science Complete Handwritten Notes", c: "Books & Education", sc: "Notes", p: 250, op: 600, b: "Student Prep" },
      { t: "Cosmic Byte Gaming Headset with Mic & RGB", c: "Gaming", sc: "Gaming Accessories", p: 850, op: 1899, b: "Cosmic Byte" },
      { t: "Electric Room Heater 1000W / 2000W Quartz", c: "Home Appliances", sc: "Appliances", p: 750, op: 1500, b: "Usha" },
      { t: "Full Size Foldable Wooden Clothes Drying Stand", c: "Hostel Essentials", sc: "Room Decor", p: 600, op: 1400, b: "Generic" },
      { t: "Speed Cube 3x3 Magnetic Smooth Speedcube", c: "Other", sc: "Stationery & Art", p: 350, op: 799, b: "MoYu" },
      { t: "Bicycle Helmet & Rechargeable LED Front Headlight", c: "Vehicles", sc: "Car Accessories", p: 700, op: 1500, b: "Btwin" },
      { t: "Python Machine Learning by Sebastian Raschka", c: "Books & Education", sc: "Textbooks", p: 699, op: 1800, b: "Packt" }
    ];

    titles.forEach((item, idx) => {
      const s = usersList[(idx % (usersList.length - 2)) + 2];
      const cond = conditions[idx % conditions.length];
      const stat = statuses[idx % statuses.length];
      products.push({
        title: item.t,
        description: `Authentic ${item.t} in very good condition. Used for 1 semester during college. Clean, well maintained, and tested. Available for safe campus meet-up.`,
        price: item.p,
        originalPrice: item.op,
        category: item.c,
        subcategory: item.sc,
        condition: cond,
        brand: item.b,
        model: "Student Verified",
        purchaseYear: 2022 + (idx % 2),
        seller: s._id,
        location: ["Hostel", "Main Campus", "Library", "Department", "Student Center"][idx % 5],
        tags: [item.b.toLowerCase(), item.sc.toLowerCase(), "campus"],
        isFeatured: idx % 5 === 0,
        status: stat,
        views: Math.floor(Math.random() * 50) + 12,
        images: [sampleProducts[idx % sampleProducts.length].images[0]]
      });
    });

    const insertedProducts = await Product.insertMany(products);
    console.log(`✓ Seeded ${insertedProducts.length} Products.`);

    // Seed Wishlist
    const wishlists = [];
    for (let i = 0; i < 6; i++) {
      wishlists.push({ user: student._id, product: insertedProducts[i]._id });
    }
    await Wishlist.insertMany(wishlists);
    console.log(`✓ Seeded ${wishlists.length} Wishlist items.`);

    // Seed Conversation & Messages
    const conv = await Conversation.create({
      participants: [student._id, seller._id],
      product: insertedProducts[0]._id,
      lastMessage: {
        text: "Sounds great! Let's meet tomorrow 4 PM at the library entrance.",
        sender: seller._id,
        createdAt: new Date()
      }
    });

    await Message.insertMany([
      {
        conversation: conv._id,
        sender: student._id,
        receiver: seller._id,
        text: "Hi Priya! Is the MacBook still available? Can we meet on campus to test it?"
      },
      {
        conversation: conv._id,
        sender: seller._id,
        receiver: student._id,
        text: "Hey Rohit! Yes, absolutely. It is completely clean and I have the original charger with me."
      },
      {
        conversation: conv._id,
        sender: student._id,
        receiver: seller._id,
        text: "Awesome! Would you accept ₹47,000 for it?"
      },
      {
        conversation: conv._id,
        sender: seller._id,
        receiver: student._id,
        text: "Sounds great! Let's meet tomorrow 4 PM at the library entrance."
      }
    ]);
    console.log("✓ Seeded Conversations and Messages.");

    // Seed Offers
    await Offer.create({
      product: insertedProducts[0]._id,
      buyer: student._id,
      seller: seller._id,
      amount: 47000,
      status: "Accepted",
      message: "Ready to inspect and pay via UPI on campus."
    });

    await Offer.create({
      product: insertedProducts[1]._id,
      buyer: usersList[4]._id,
      seller: usersList[5]._id,
      amount: 13500,
      status: "Pending",
      message: "Available for quick pickup at Hostel block."
    });
    console.log("✓ Seeded Offers.");

    // Seed Reviews
    await Review.insertMany([
      {
        seller: seller._id,
        buyer: usersList[3]._id,
        product: insertedProducts[2]._id,
        rating: 5,
        comment: "Excellent seller! Item was exactly as described and Priya gave me the original box and invoice."
      },
      {
        seller: seller._id,
        buyer: usersList[6]._id,
        product: insertedProducts[3]._id,
        rating: 5,
        comment: "Super friendly, met on time near the student center. Great experience."
      }
    ]);
    console.log("✓ Seeded Reviews.");

    // Seed Transactions
    await Transaction.create({
      product: insertedProducts[4]._id,
      buyer: student._id,
      seller: usersList[6]._id,
      agreedPrice: 1100,
      status: "Completed",
      exchangeLocation: "Student Center"
    });

    // Seed Notifications
    await Notification.insertMany([
      {
        recipient: student._id,
        sender: seller._id,
        type: "OFFER_ACCEPTED",
        title: "Offer Accepted! 🎉",
        message: `Priya Sundaram accepted your offer of ₹47,000 for "${insertedProducts[0].title}".`,
        link: "/messages",
        isRead: false
      },
      {
        recipient: seller._id,
        sender: student._id,
        type: "OFFER",
        title: "New Offer Received",
        message: `Rohit Patel offered ₹47,000 for your "${insertedProducts[0].title}".`,
        link: "/dashboard",
        isRead: true
      },
      {
        recipient: admin._id,
        sender: student._id,
        type: "SYSTEM",
        title: "Platform Health Good",
        message: "CampusCycle is monitoring 55+ active listings across NIT and IIT campuses.",
        link: "/admin",
        isRead: false
      }
    ]);
    console.log("✓ Seeded Notifications.");

    console.log("==================================================");
    console.log("✨ SEEDING COMPLETE!");
    console.log("🔑 Demo Accounts:");
    console.log("   Admin:   admin@campuscycle.test   / Password123!");
    console.log("   Student: student@campuscycle.test / Password123!");
    console.log("   Seller:  seller@campuscycle.test  / Password123!");
    console.log("==================================================");

    if (isCli) {
      await disconnectDB();
      process.exit(0);
    }
    return true;
  } catch (err) {
    console.error("Seeding failed:", err);
    if (isCli) process.exit(1);
    throw err;
  }
};

// If run directly from terminal
const isDirectRun = process.argv[1] && (process.argv[1].endsWith("seed.js") || process.argv[1].endsWith("seed"));
if (isDirectRun) {
  runSeed(true);
}