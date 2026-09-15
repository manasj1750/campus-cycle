import React from "react";
import { Star } from "lucide-react";

export default function RatingStars({ rating = 5, totalReviews = null, size = "sm" }) {
  const rounded = Math.round(Number(rating) || 5);
  const iconSize = size === "lg" ? "w-5 h-5" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${iconSize} ${
              star <= rounded ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-100"
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-bold text-slate-700">{Number(rating || 5).toFixed(1)}</span>
      {totalReviews !== null && (
        <span className="text-xs text-slate-400">({totalReviews})</span>
      )}
    </div>
  );
}