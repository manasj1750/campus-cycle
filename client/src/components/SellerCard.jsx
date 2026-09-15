import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Star } from "lucide-react";
import RatingStars from "./RatingStars";

export default function SellerCard({ seller }) {
  if (!seller) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        {seller.profilePhoto ? (
          <img
            src={seller.profilePhoto}
            alt={seller.name}
            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/20"
          />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-base flex items-center justify-center">
            {seller.name?.charAt(0) || "U"}
          </div>
        )}
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-slate-900 text-sm">{seller.name}</h4>
            {seller.isVerified && (
              <ShieldCheck className="w-4 h-4 text-emerald-600" title="Verified College Student" />
            )}
          </div>
          <p className="text-xs text-slate-500">{seller.department} • {seller.college}</p>
          <div className="mt-1">
            <RatingStars rating={seller.avgRating || 5.0} totalReviews={seller.totalReviews || 1} />
          </div>
        </div>
      </div>

      <Link
        to={`/profile/${seller._id}`}
        className="px-3.5 py-1.5 bg-slate-50 hover:bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-slate-200 hover:border-emerald-200 transition-colors flex-shrink-0"
      >
        View Profile
      </Link>
    </div>
  );
}