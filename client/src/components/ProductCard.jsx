import React from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, CheckCircle2, Star, Sparkles } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";

export default function ProductCard({ product }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  if (!product) return null;

  const isSaved = isInWishlist(product._id);

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleWishlist(product);
    } catch (err) {
      alert(err.message);
    }
  };

  // Condition Badge Color Helper
  const getConditionBadge = (condition) => {
    switch (condition) {
      case "Like New":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Excellent":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "Good":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Fair":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Needs Repair":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    if (status === "SOLD") {
      return (
        <span className="absolute top-2.5 left-2.5 z-10 bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider backdrop-blur-sm">
          Sold
        </span>
      );
    }
    if (status === "RESERVED") {
      return (
        <span className="absolute top-2.5 left-2.5 z-10 bg-amber-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider backdrop-blur-sm">
          Reserved
        </span>
      );
    }
    return null;
  };

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const displayImage =
    product.primaryImage || (product.images && product.images[0]) || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80";

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 shadow-sm hover:shadow-card transition-all duration-300 flex flex-col overflow-hidden">
      
      {/* Top Image Container */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {getStatusBadge(product.status)}

        {/* Featured ribbon */}
        {product.isFeatured && (
          <span className="absolute bottom-2.5 left-2.5 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3 h-3" /> Featured
          </span>
        )}

        <img
          src={displayImage}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-2.5 right-2.5 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            isSaved
              ? "bg-rose-50 text-rose-500 shadow-sm"
              : "bg-white/80 backdrop-blur-md text-slate-500 hover:text-rose-500 hover:bg-white"
          }`}
        >
          <Heart className={`w-4 h-4 ${isSaved ? "fill-current text-rose-500" : ""}`} />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1">
        
        {/* Badges row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md truncate">
            {product.category}
          </span>
          <span className={`text-[10px] font-medium border px-1.5 py-0.5 rounded-md ${getConditionBadge(product.condition)}`}>
            {product.condition}
          </span>
        </div>

        {/* Product Title */}
        <Link to={`/products/${product._id}`} className="block">
          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-emerald-600 transition-colors">
            {product.title}
          </h3>
        </Link>

        {/* Pricing */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-black text-slate-900">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-xs text-slate-400 line-through">
              ₹{product.originalPrice.toLocaleString("en-IN")}
            </span>
          )}
          {discount && (
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Footer info: Campus Location & Seller */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 truncate max-w-[140px]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{product.location || "Main Campus"}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {product.seller?.profilePhoto ? (
              <img
                src={product.seller.profilePhoto}
                alt={product.seller?.name || "Seller"}
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : null}
            <span className="font-medium text-slate-700 max-w-[80px] truncate">
              {product.seller?.name?.split(" ")[0] || "Student"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}