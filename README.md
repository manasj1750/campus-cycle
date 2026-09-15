# CampusCycle — College Second-Hand Marketplace 🚀🌱

> **"Give Your Things a Second Life."**  
> A full-stack, sustainable second-hand marketplace developed for the **College Social Responsibility Club**.

CampusCycle enables college students and campus members to buy and sell pre-loved textbooks, electronics, cycles, hostel furniture, and sports equipment within their trusted campus community. By promoting reuse and circular economy, CampusCycle helps students save money, reduces campus landfill waste, and keeps items in active circulation.

---

## 🌟 Key Features

### 🛒 Marketplace & Browsing
- **Peer-to-Peer Campus Marketplace**: Real listings from students across hostels and academic departments.
- **Dynamic Search & Multi-Filters**: Instant text search across title, description, brand, and tags, with filtering by Category, Subcategory, Condition (`Like New`, `Excellent`, `Good`, `Fair`, `Needs Repair`), Max Price slider, and Campus Locations.
- **Smart Sorting**: Newest first, Oldest, Price Low → High, Price High → Low, and Most Popular.
- **Mobile Responsive Experience**: Adaptive layouts, mobile bottom navigation, and slide-over filter drawers designed for smartphones and tablets.

### 📦 Sell & Listing Moderation
- **Listing Submission Form**: Multi-photo upload with primary image selection, original price vs selling price discount display, condition tagging, and campus meet-up preference.
- **Campus Moderation Queue**: New listings automatically enter `PENDING_REVIEW` status and require Social Responsibility Club administrator verification before going live to the campus.
- **Seller Inventory Control**: Mark items as `AVAILABLE`, `RESERVED`, or `SOLD`, or edit/delete listings directly from the personal dashboard.

### 💬 Real-Time Messaging & Negotiation
- **In-App Messaging**: Instant buyer-to-seller chat with attached product header for clarity.
- **Real-Time Engine**: Built with Socket.IO for immediate message delivery and live typing indicators.
- **Make an Offer**: Buyers can make monetary counter-offers on listings marked as negotiable. Sellers can **Accept**, **Decline**, or **Counter**.
- **Campus Safe Exchange Zones**: Safety tips and suggested safe on-campus meeting spots (Central Library, Student Union, Main Cafeteria).

### 💚 Club Sustainability Dashboard
- **Impact Metrics**: Real-time counter of Items Reused, Students Helped, Estimated Rupees Saved, and Waste Avoided (kg).
- **Interactive Analytics**: Recharts-powered graphs showing user signups over time, listing volumes, condition distribution, and popular categories.

### 🔐 Authentication & Security
- **Role-Based Access Control**: `USER` and `ADMIN` roles.
- **Security Best Practices**: Bcrypt password hashing, JWT authentication via HTTP-only cookies and Authorization headers, Helmet HTTP headers, CORS whitelisting, and rate-limiting.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router DOM v6, Lucide React, Axios, Recharts, Socket.IO Client |
| **Backend** | Node.js, Express.js, Socket.IO, Multer, Cloudinary SDK, Cookie-Parser, Helmet, CORS |
| **Database** | MongoDB, Mongoose ODM (with embedded persistent MongoMemoryServer zero-config fallback) |
| **Auth** | JSON Web Tokens (JWT), Bcrypt.js |

---

## 📁 Project Structure

```
campus-cycle/
├── client/                     # Frontend React + Vite SPA
│   ├── src/
│   │   ├── assets/             # Brand logos & static assets
│   │   ├── components/         # Reusable UI (Navbar, Footer, ProductCard, Skeletons, etc.)
│   │   ├── context/            # Auth, Wishlist, Notification & Socket Contexts
│   │   ├── pages/              # Home, Marketplace, ProductDetails, Sell, Dashboard, etc.
│   │   ├── services/           # Axios REST API client
│   │   ├── App.jsx             # React Router routing configuration
│   │   ├── main.jsx            # React root mount
│   │   └── index.css           # Tailwind base & custom styles
│   ├── index.html              # HTML shell & SEO meta tags
│   ├── tailwind.config.js      # CampusCycle custom theme colors & shadows
│   ├── vite.config.js          # Vite config & API/Socket proxy
│   └── package.json
│
├── server/                     # Backend Express REST API & Socket Server
│   ├── config/                 # MongoDB database connector (db.js)
│   ├── controllers/            # Auth, Product, Offer, Message, Admin, User controllers
│   ├── middleware/             # Auth, upload, and error middlewares
│   ├── models/                 # Mongoose models (User, Product, Category, Offer, etc.)
│   ├── routes/                 # REST endpoints routing
│   ├── services/               # Image storage (Cloudinary + local static fallback)
│   ├── utils/                  # seed.js, seedData.js, seedProducts.js
│   ├── server.js               # Express & Socket.IO entrypoint
│   └── package.json
│
├── .env.example                # Environment configuration template
├── .gitignore
├── test-e2e.mjs                # Full-stack automated integration test suite
└── README.md
```

---

## 🔑 Demo Accounts

The database comes pre-seeded with 33 verified students, 55 campus products, active offers, reviews, and messages:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@campuscycle.test` | `Password123!` | Moderation Queue, Category Management, User Control, Analytics |
| **Student (Buyer)** | `student@campuscycle.test` | `Password123!` | Full Marketplace, Bidding, Messaging, Wishlist, Dashboard |
| **Student (Seller)** | `seller@campuscycle.test` | `Password123!` | Active Listings, Received Offers, Sales History, Reviews |

> **Tip**: On the `/login` page, you can click any of the **1-Click Demo Account** buttons to instantly autofill and log in!

---

## ⚙️ Environment Variables

Copy `.env.example` to `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/campuscycle
JWT_SECRET=campuscycle_production_grade_secret_key_2026
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

# Cloudinary (Optional - If omitted, automatically uses local static storage)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 🚀 Running Locally

### 1. Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 2. Backend Setup
```bash
cd server
npm install
node server.js
```
*Note: If an external MongoDB service is not running on port 27017, the server automatically starts an embedded persistent MongoDB instance stored in `server/.mongodb_data` and seeds 55+ products automatically!*

To re-seed the database at any time:
```bash
cd server
npm run seed
```

### 3. Frontend Setup
In a new terminal window:
```bash
cd client
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Automated Testing

Run the end-to-end integration test verifying authentication, product creation, moderation approval, wishlist, and offers:
```bash
node test-e2e.mjs
```

---

## 📦 Production Build

To build the client for production deployment:
```bash
cd client
npm run build
```
The optimized production bundle will be generated in `client/dist/`.

---

## 🛡️ Campus Safety Guidelines
1. **Meet on Campus**: Handover transactions must occur in well-lit public campus locations (e.g., Central Library, Student Center, Department Corridors).
2. **Inspect in Person**: Test electronics, verify textbook editions, and check bicycle brakes before making payment.
3. **No Upfront Payments**: Do not wire money before inspecting the product.