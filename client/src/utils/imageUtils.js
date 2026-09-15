// Curated high-resolution fallback placeholder images per category
export const CATEGORY_PLACEHOLDERS = {
  "Books & Education": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80",
  "Textbooks & Study Materials": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80",
  "Electronics & Tech": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80",
  "Electronics": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80",
  "Bicycles & Mobility": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80",
  "Hostel Essentials": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
  "Clothing & Fashion": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80",
  "Sports & Fitness": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80",
  "Furniture": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80",
  "Gaming": "https://images.unsplash.com/photo-1612287233282-3532729eec01?w=600&q=80",
  "Musical Instruments": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80",
  "Other": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80"
};

export const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80";

/**
 * Returns a suitable fallback image based on the product category.
 */
export const getCategoryPlaceholder = (category) => {
  if (!category) return DEFAULT_FALLBACK_IMAGE;
  return CATEGORY_PLACEHOLDERS[category] || DEFAULT_FALLBACK_IMAGE;
};

/**
 * Sanitizes and formats product image URL.
 * Handles local dev URLs like "http://localhost:5000/uploads/..." which cannot load on production.
 */
export const formatProductImage = (url, category) => {
  if (!url || typeof url !== "string") {
    return getCategoryPlaceholder(category);
  }

  // If URL starts with http://localhost or http://127.0.0.1 on a deployed non-localhost site
  const isLocalHostUrl = url.startsWith("http://localhost:") || url.startsWith("http://127.0.0.1:");
  const isRunningOnWeb = typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";

  if (isLocalHostUrl && isRunningOnWeb) {
    return getCategoryPlaceholder(category);
  }

  return url;
};

/**
 * Image error event handler that prevents infinite loops and sets fallback placeholder.
 */
export const handleImageError = (e, category) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = getCategoryPlaceholder(category);
};
