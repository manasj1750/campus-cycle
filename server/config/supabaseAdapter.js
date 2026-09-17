/**
 * Supabase Data Formatter
 * Normalizes Supabase PostgreSQL snake_case columns to the exact shape expected
 * by the CampusCycle React frontend (including _id, camelCase aliases, and nested objects).
 */

export const formatUser = (u) => {
  if (!u) return null;
  return {
    _id: u.id,
    id: u.id,
    name: u.name,
    email: u.email,
    college: u.college || "Campus Institute of Technology",
    studentId: u.student_id || u.studentId || "",
    department: u.department || "BCA",
    year: u.year || "3rd Year",
    profilePhoto: u.profile_photo || u.profilePhoto || "",
    bio: u.bio || "",
    location: u.location || "Main Campus",
    role: u.role || "USER",
    isVerified: u.is_verified !== undefined ? u.is_verified : true,
    createdAt: u.created_at || u.createdAt,
    updatedAt: u.updated_at || u.updatedAt
  };
};

export const formatProduct = (p) => {
  if (!p) return null;
  const sellerObj = p.seller ? formatUser(p.seller) : null;

  return {
    _id: p.id,
    id: p.id,
    title: p.title,
    description: p.description,
    price: Number(p.price) || 0,
    originalPrice: Number(p.original_price || p.originalPrice || 0),
    category: p.category,
    subcategory: p.subcategory || "",
    condition: p.condition || "Good",
    brand: p.brand || "",
    model: p.model || "",
    purchaseYear: p.purchase_year || p.purchaseYear || null,
    images: Array.isArray(p.images) ? p.images : [],
    primaryImage: p.primary_image || p.primaryImage || (Array.isArray(p.images) ? p.images[0] : "") || "",
    seller: sellerObj || p.seller_id,
    location: p.location || "Main Campus",
    tags: Array.isArray(p.tags) ? p.tags : [],
    isNegotiable: p.is_negotiable !== undefined ? p.is_negotiable : true,
    contactPreference: p.contact_preference || p.contactPreference || "In-App Chat",
    status: p.status || "APPROVED",
    viewsCount: Number(p.views_count || p.viewsCount || 0),
    favoritesCount: Number(p.favorites_count || p.favoritesCount || 0),
    createdAt: p.created_at || p.createdAt,
    updatedAt: p.updated_at || p.updatedAt
  };
};

export const formatMessage = (m) => {
  if (!m) return null;
  return {
    _id: m.id,
    id: m.id,
    conversation: m.conversation_id || m.conversation,
    conversationId: m.conversation_id || m.conversation,
    sender: m.sender ? formatUser(m.sender) : m.sender_id,
    receiver: m.receiver ? formatUser(m.receiver) : m.receiver_id,
    text: m.text,
    isRead: m.is_read !== undefined ? m.is_read : false,
    createdAt: m.created_at || m.createdAt
  };
};

export const formatConversation = (c) => {
  if (!c) return null;
  const productObj = c.product ? formatProduct(c.product) : null;
  const participants = Array.isArray(c.participants) ? c.participants.map(formatUser) : [];

  return {
    _id: c.id,
    id: c.id,
    product: productObj || c.product_id,
    participants,
    lastMessage: {
      text: c.last_message_text || "",
      sender: c.last_message_sender_id,
      createdAt: c.last_message_at || c.updated_at
    },
    unreadCount: Number(c.unread_count || 0),
    createdAt: c.created_at,
    updatedAt: c.updated_at
  };
};

export const isUUID = (str) =>
  typeof str === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
