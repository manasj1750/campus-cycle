import React from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2, ArrowRight } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";
import EmptyState from "../components/EmptyState";

export default function WishlistPage() {
  const { wishlist, loading } = useWishlist();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-rose-600">
          <Heart className="w-5 h-5 fill-current" />
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
            Saved Listings
          </span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
          Your Campus Wishlist
        </h1>
        <p className="text-sm text-slate-500">
          Keep track of items you are considering before someone else gets them.
        </p>
      </div>

      {wishlist.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          message="Save items while browsing the campus marketplace so you can quickly review them later."
          actionText="Browse Marketplace"
          actionLink="/products"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {wishlist.map((item) => (
            <ProductCard key={item._id || item.product?._id} product={item.product} />
          ))}
        </div>
      )}
    </div>
  );
}