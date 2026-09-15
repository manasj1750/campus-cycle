import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  User,
  ShieldCheck,
  Package,
  CheckCircle2,
  Calendar,
  MapPin,
  Star
} from "lucide-react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import RatingStars from "../components/RatingStars";

export default function UserProfile() {
  const { id } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/users/${id}`);
        if (res.data.success) {
          setProfileData(res.data);
        }
      } catch (err) {
        console.error("Failed to load user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profileData || !profileData.user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900">User Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">This profile does not exist.</p>
        <Link to="/products" className="text-xs text-emerald-600 font-bold hover:underline">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const { user, activeProducts, soldProducts, reviews } = profileData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {user.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={user.name}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-emerald-500/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-800 text-3xl font-black flex items-center justify-center">
              {user.name?.charAt(0) || "U"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{user.name}</h1>
              {user.isVerified && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {user.department} • {user.year} • {user.college}
            </p>
            {user.bio && (
              <p className="text-xs text-slate-700 mt-2 max-w-lg leading-relaxed">
                "{user.bio}"
              </p>
            )}
          </div>
        </div>

        {/* Stats on Profile */}
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
          <div className="text-center">
            <span className="text-xl font-black text-slate-900">{user.stats?.activeCount || 0}</span>
            <p className="text-[11px] text-slate-400 font-medium">Active Items</p>
          </div>
          <div className="text-center">
            <span className="text-xl font-black text-emerald-700">{user.stats?.soldCount || 0}</span>
            <p className="text-[11px] text-slate-400 font-medium">Items Reused</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-amber-500 font-black text-xl">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{user.stats?.avgRating || 5.0}</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {user.stats?.reviewsCount || 0} reviews
            </p>
          </div>
        </div>
      </div>

      {/* Active Listings by User */}
      <div>
        <h2 className="text-xl font-black text-slate-900 mb-4">
          Active Listings by {user.name.split(" ")[0]} ({activeProducts?.length || 0})
        </h2>
        {activeProducts?.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No active listings currently available.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {activeProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* Reviews by peers */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-xl font-black text-slate-900">
          Campus Reviews ({reviews?.length || 0})
        </h2>
        {reviews?.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No reviews yet for this student.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((rev) => (
              <div key={rev._id} className="py-3.5 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{rev.buyer?.name}</span>
                  <RatingStars rating={rev.rating} />
                </div>
                <p className="text-slate-600">{rev.comment}</p>
                <span className="text-[10px] text-slate-400 block">
                  {new Date(rev.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}