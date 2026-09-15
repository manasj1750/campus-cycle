import React from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";

export default function WishlistButton({ product, className = "" }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const toast = useToast();

  const isSaved = isInWishlist(product?._id || product);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await toggleWishlist(product);
      if (res.action === "added") {
        toast.success("Saved to your campus wishlist!");
      } else {
        toast.info("Removed from wishlist.");
      }
    } catch (err) {
      toast.error(err.message || "Please log in to save items.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
      className={`transition-colors flex items-center justify-center ${className}`}
    >
      <Heart className={`w-4 h-4 ${isSaved ? "fill-rose-500 text-rose-500" : "text-slate-400 hover:text-rose-500"}`} />
    </button>
  );
}