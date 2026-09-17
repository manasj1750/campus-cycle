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

export const formatOffer = (o) => {
  if (!o) return null;
  const productObj = o.product ? formatProduct(o.product) : o.product_id;
  const buyerObj = o.buyer ? formatUser(o.buyer) : o.buyer_id;
  const sellerObj = o.seller ? formatUser(o.seller) : o.seller_id;

  let status = o.status || "Pending";
  if (status === "PENDING") status = "Pending";
  else if (status === "ACCEPTED") status = "Accepted";
  else if (status === "DECLINED") status = "Rejected";
  else if (status === "COUNTERED") status = "Countered";

  return {
    _id: o.id,
    id: o.id,
    product: productObj,
    buyer: buyerObj,
    seller: sellerObj,
    amount: Number(o.offer_price || o.amount || 0),
    counterAmount: Number(o.counter_amount || o.counterAmount || 0),
    status,
    message: o.notes || o.message || "",
    createdAt: o.created_at || o.createdAt,
    updatedAt: o.updated_at || o.updatedAt
  };
};

export const formatNotification = (n) => {
  if (!n) return null;
  return {
    _id: n.id,
    id: n.id,
    recipient: n.recipient ? formatUser(n.recipient) : n.recipient_id,
    sender: n.sender ? formatUser(n.sender) : n.sender_id,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link || "/messages",
    isRead: Boolean(n.is_read !== undefined ? n.is_read : n.isRead),
    createdAt: n.created_at || n.createdAt
  };
};

export const formatReport = (r) => {
  if (!r) return null;
  return {
    _id: r.id,
    id: r.id,
    reporter: r.reporter ? formatUser(r.reporter) : r.reporter_id,
    targetType: r.target_type || r.targetType || "PRODUCT",
    targetId: r.target_id || r.targetId,
    reason: r.reason || "",
    description: r.details || r.description || "",
    details: r.details || r.description || "",
    status: r.status || "PENDING",
    createdAt: r.created_at || r.createdAt
  };
};

export const isUUID = (str) =>
  typeof str === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

