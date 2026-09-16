-- ====================================================================
-- CampusCycle: Supabase PostgreSQL Complete Database Schema
-- Run this SQL in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  college TEXT NOT NULL DEFAULT 'Campus Institute of Technology',
  student_id TEXT DEFAULT '',
  department TEXT DEFAULT 'BCA',
  year TEXT DEFAULT '3rd Year',
  profile_photo TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  location TEXT DEFAULT 'Main Campus',
  role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'MODERATOR')),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT DEFAULT 'Tag',
  description TEXT DEFAULT '',
  subcategories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  original_price NUMERIC DEFAULT 0 CHECK (original_price >= 0),
  category TEXT NOT NULL,
  subcategory TEXT DEFAULT '',
  condition TEXT NOT NULL CHECK (condition IN ('Like New', 'Excellent', 'Good', 'Fair', 'Needs Repair')),
  brand TEXT DEFAULT '',
  model TEXT DEFAULT '',
  purchase_year INT,
  images TEXT[] NOT NULL DEFAULT '{}',
  primary_image TEXT DEFAULT '',
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  location TEXT DEFAULT 'Main Campus',
  tags TEXT[] DEFAULT '{}',
  is_negotiable BOOLEAN DEFAULT TRUE,
  contact_preference TEXT DEFAULT 'In-App Chat',
  status TEXT DEFAULT 'APPROVED' CHECK (status IN ('AVAILABLE', 'RESERVED', 'SOLD', 'PENDING_REVIEW', 'APPROVED', 'REJECTED')),
  views_count INT DEFAULT 0,
  favorites_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- 4. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  last_message_text TEXT DEFAULT '',
  last_message_sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_product ON public.conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations(updated_at DESC);

-- 5. CONVERSATION PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_convo_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_convo_participants_convo ON public.conversation_participants(conversation_id);

-- 6. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(receiver_id, is_read);

-- 7. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT DEFAULT '/messages',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read, created_at DESC);

-- 8. WISHLISTS TABLE
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);

-- 9. OFFERS TABLE
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  offer_price NUMERIC NOT NULL CHECK (offer_price >= 0),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'COUNTERED')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('PRODUCT', 'USER')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESOLVED', 'DISMISSED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. INITIAL CATEGORIES SEED
INSERT INTO public.categories (name, slug, icon, description, subcategories)
VALUES
  ('Cycles & Mobility', 'cycles-mobility', 'Bike', 'Bicycles, campus scooters, locks, and riding accessories', ARRAY['Geared Bicycles', 'Single-Speed Bicycles', 'E-Scooters', 'Helmets & Accessories']),
  ('Laptops & Tech', 'laptops-tech', 'Laptop', 'Laptops, calculators, chargers, keyboards, monitors', ARRAY['Laptops', 'Scientific Calculators', 'Chargers & Cables', 'Audio & Headphones', 'Keyboards & Mice']),
  ('Books & Education', 'books-education', 'BookOpen', 'Semester textbooks, course notes, reference guides, exam prep', ARRAY['Engineering Textbooks', 'Management & Commerce', 'Computer Science Notes', 'Entrance Exam Prep']),
  ('Hostel & Room', 'hostel-room', 'Home', 'Mattresses, study lamps, storage racks, mini-kettles', ARRAY['Bedding & Mattresses', 'Study Lamps', 'Kettles & Appliances', 'Storage Organizers']),
  ('Fashion & Wear', 'fashion-wear', 'Shirt', 'College hoodies, lab coats, sports gear, watches', ARRAY['Lab Coats', 'College Merchandise', 'Sportswear', 'Watches & Bags']),
  ('Lab & Stationery', 'lab-stationery', 'Wrench', 'Drafters, drawing boards, lab kits, components', ARRAY['Engineering Drafters', 'Arduino & Sensors', 'Stationery Bundles', 'Lab Uniforms'])
ON CONFLICT (slug) DO NOTHING;
