import React from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, CheckCircle2, Star, Sparkles } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { formatProductImage, handleImageError } from "../utils/imageUtils";

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

  const rawImage =
    product.primaryImage || (product.images && product.images[0]);
  const displayImage = formatProductImage(rawImage, product.category);

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 shadow-sm hover:shadow-card transition-all duration-300 flex flex-col overflow-hidden">
      
      {/* Top Image Container */}
      <div className="relative aspect-square sm:aspect-[4/3] bg-slate-100 overflow-hidden">
        {getStatusBadge(product.status)}

        {/* Featured ribbon */}
        {product.isFeatured && (
          <span className="absolute bottom-2 left-2 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Featured
          </span>
        )}

        <img
          src={displayImage}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => handleImageError(e, product.category)}
        />

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
            isSaved
              ? "bg-rose-50 text-rose-500 shadow-xs"
              : "bg-white/85 backdrop-blur-md text-slate-500 hover:text-rose-500 hover:bg-white"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSaved ? "fill-current text-rose-500" : ""}`} />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1">
        
        {/* Badges row */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-md truncate max-w-[90px] sm:max-w-[130px]">
            {product.category}
          </span>
          <span className={`text-[9px] sm:text-[10px] font-medium border px-1 sm:px-1.5 py-0.5 rounded-md whitespace-nowrap ${getConditionBadge(product.condition)}`}>
            {product.condition}
          </span>
        </div>

        {/* Product Title */}
        <Link to={`/products/${product._id}`} className="block">
          <h3 className="font-semibold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 hover:text-emerald-600 transition-colors">
            {product.title}
          </h3>
        </Link>

        {/* Pricing */}
        <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
          <span className="text-sm sm:text-base md:text-lg font-black text-slate-900">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-[10px] sm:text-xs text-slate-400 line-through">
              ₹{product.originalPrice.toLocaleString("en-IN")}
            </span>
          )}
          {discount && (
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 sm:px-1.5 py-0.5 rounded">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Footer info: Campus Location & Seller */}
        <div className="mt-auto pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs text-slate-500">
          <div className="flex items-center gap-1 truncate max-w-[75px] sm:max-w-[120px]">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{product.location || "Campus"}</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {product.seller?.profilePhoto ? (
              <img
                src={product.seller.profilePhoto}
                alt={product.seller?.name || "Seller"}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-cover"
              />
            ) : null}
            <span className="font-medium text-slate-700 max-w-[60px] sm:max-w-[80px] truncate">
              {product.seller?.name?.split(" ")[0] || "Student"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}