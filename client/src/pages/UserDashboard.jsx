import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Package,
  CheckCircle2,
  Clock,
  Heart,
  MessageSquare,
  Tag,
  Star,
  Settings,
  PlusCircle,
  AlertCircle,
  Check,
  X,
  ExternalLink,
  Trash2,
  Edit,
  Eye
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import RatingStars from "../components/RatingStars";
import EmptyState from "../components/EmptyState";

export default function UserDashboard() {
  const { user, updateProfile, refreshMe } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "listings";

  const [summary, setSummary] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [listingFilter, setListingFilter] = useState("ALL");
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    college: user?.college || "",
    department: user?.department || "",
    year: user?.year || "",
    location: user?.location || ""
  });
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsSubmitting, setSettingsSubmitting] = useState(false);

  // Counter offer modal state
  const [counterModal, setCounterModal] = useState({ open: false, offerId: null, amount: "" });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [sumRes, listRes, offRes] = await Promise.all([
        api.get("/users/dashboard/summary"),
        api.get(`/users/my-listings?status=${listingFilter}`),
        api.get("/offers")
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.summary);
      if (listRes.data.success) setMyListings(listRes.data.listings || []);
      if (offRes.data.success) setOffers(offRes.data.offers || []);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [listingFilter]);

  useEffect(() => {
    if (user) {
      setSettingsForm({
        name: user.name || "",
        bio: user.bio || "",
        college: user.college || "",
        department: user.department || "",
        year: user.year || "",
        location: user.location || ""
      });
    }
  }, [user]);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  // Status Change handler
  const handleStatusChange = async (productId, newStatus) => {
    try {
      await api.patch(`/products/${productId}/status`, { status: newStatus });
      fetchDashboard();
      refreshMe();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  // Delete Listing handler
  const handleDeleteListing = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      await api.delete(`/products/${productId}`);
      setMyListings((prev) => prev.filter((p) => p._id !== productId));
      fetchDashboard();
      refreshMe();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete listing");
    }
  };

  // Offer action handler
  const handleOfferAction = async (offerId, status, counterAmount = null) => {
    try {
      await api.patch(`/offers/${offerId}`, { status, counterAmount });
      fetchDashboard();
      setCounterModal({ open: false, offerId: null, amount: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    }
  };

  // Settings submit
  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      setSettingsSubmitting(true);
      await updateProfile(settingsForm);
      setSettingsSuccess("Profile updated successfully!");
      setTimeout(() => setSettingsSuccess(""), 3000);
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setSettingsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {user?.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/20"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 text-2xl font-black flex items-center justify-center">
              {user?.name?.charAt(0) || "U"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{user?.name}</h1>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Verified Student
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user?.department} • {user?.year} • {user?.college}
            </p>
          </div>
        </div>

        <Link
          to="/sell"
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-2xl shadow-sm flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Listing</span>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Active Listings</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {summary?.activeListings || 0}
          </div>
          <span className="text-[11px] text-slate-400">Available to campus buyers</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Items Sold</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {summary?.soldItems || 0}
          </div>
          <span className="text-[11px] text-teal-600 font-semibold">Given a second life</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Offers Received</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {summary?.offersReceived || 0}
          </div>
          <span className="text-[11px] text-slate-400">Pending buyer bids</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Saved Wishlist</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {summary?.wishlistCount || 0}
          </div>
          <span className="text-[11px] text-slate-400">Items watched</span>
        </div>

      </div>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto text-sm font-bold">
        <button
          onClick={() => handleTabChange("listings")}
          className={`pb-3.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === "listings"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Listings ({myListings.length})</span>
        </button>

        <button
          onClick={() => handleTabChange("offers")}
          className={`pb-3.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === "offers"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Offers ({offers.length})</span>
        </button>

        <button
          onClick={() => handleTabChange("settings")}
          className={`pb-3.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === "settings"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Profile Settings</span>
        </button>
      </div>

      {/* TAB 1: MY LISTINGS */}
      {activeTab === "listings" && (
        <div className="space-y-6">
          
          {/* Status Subfilters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {["ALL", "ACTIVE", "PENDING_REVIEW", "SOLD", "REJECTED"].map((f) => (
              <button
                key={f}
                onClick={() => setListingFilter(f)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  listingFilter === f
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>

          {myListings.length === 0 ? (
            <EmptyState
              title="No listings in this category"
              message="You haven't posted any items matching this filter yet."
              actionText="Post an Item to Sell"
              actionLink="/sell"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myListings.map((p) => (
                <div
                  key={p._id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col"
                >
                  <div className="relative aspect-[16/9] bg-slate-100">
                    <img
                      src={p.primaryImage || p.images?.[0]}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        p.status === "AVAILABLE" || p.status === "APPROVED"
                          ? "bg-emerald-600 text-white"
                          : p.status === "PENDING_REVIEW"
                          ? "bg-amber-500 text-white"
                          : p.status === "SOLD"
                          ? "bg-slate-900 text-white"
                          : "bg-rose-600 text-white"
                      }`}
                    >
                      {p.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{p.title}</h3>
                    <div className="text-lg font-black text-slate-900 mt-1">
                      ₹{p.price.toLocaleString("en-IN")}
                    </div>

                    {p.status === "REJECTED" && p.rejectionReason && (
                      <div className="mt-2 p-2 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                        Reason: {p.rejectionReason}
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        to={`/products/${p._id}`}
                        className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-xl"
                        title="View Public Page"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {p.status !== "SOLD" && (
                        <button
                          onClick={() => handleStatusChange(p._id, "SOLD")}
                          className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl"
                        >
                          Mark Sold
                        </button>
                      )}

                      {p.status === "SOLD" && (
                        <button
                          onClick={() => handleStatusChange(p._id, "AVAILABLE")}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                        >
                          Relist Item
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteListing(p._id)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OFFERS */}
      {activeTab === "offers" && (
        <div className="space-y-4">
          {offers.length === 0 ? (
            <EmptyState
              title="No offers yet"
              message="When buyers make offers on your listings or you bid on others, they will appear here."
              actionText="Browse Marketplace"
              actionLink="/products"
            />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
              {offers.map((off) => {
                const isSeller = String(off.seller?._id || off.seller) === String(user?._id);

                return (
                  <div key={off._id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={off.product?.primaryImage || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&q=80"}
                        alt={off.product?.title}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                      />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {isSeller ? "Offer from Buyer:" : "Your Offer to Seller:"}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{off.product?.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-base font-black text-emerald-700">
                            Offer: ₹{off.amount?.toLocaleString("en-IN")}
                          </span>
                          <span className="text-xs text-slate-400 line-through">
                            List: ₹{off.product?.price?.toLocaleString("en-IN")}
                          </span>
                        </div>
                        {off.message && (
                          <p className="text-xs text-slate-500 italic mt-0.5">"{off.message}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                          off.status === "Accepted"
                            ? "bg-emerald-100 text-emerald-800"
                            : off.status === "Rejected"
                            ? "bg-rose-100 text-rose-800"
                            : off.status === "Countered"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {off.status}
                      </span>

                      {/* Seller Action Controls */}
                      {isSeller && off.status === "Pending" && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOfferAction(off._id, "Accepted")}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => setCounterModal({ open: true, offerId: off._id, amount: off.amount })}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold"
                          >
                            Counter
                          </button>
                          <button
                            onClick={() => handleOfferAction(off._id, "Rejected")}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SETTINGS */}
      {activeTab === "settings" && (
        <div className="max-w-xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Profile & Campus Settings</h3>

          {settingsSuccess && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl mb-4">
              ✓ {settingsSuccess}
            </div>
          )}

          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={settingsForm.name}
                onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={settingsForm.department}
                onChange={(e) => setSettingsForm({ ...settingsForm, department: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Year
              </label>
              <input
                type="text"
                value={settingsForm.year}
                onChange={(e) => setSettingsForm({ ...settingsForm, year: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Bio
              </label>
              <textarea
                rows="3"
                value={settingsForm.bio}
                onChange={(e) => setSettingsForm({ ...settingsForm, bio: e.target.value })}
                placeholder="Share a short intro with your peers..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={settingsSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              {settingsSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {/* Counter Offer Modal */}
      {counterModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Make a Counter Offer</h3>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Counter Amount (₹)
              </label>
              <input
                type="number"
                value={counterModal.amount}
                onChange={(e) => setCounterModal({ ...counterModal, amount: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-bold text-base text-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCounterModal({ open: false, offerId: null, amount: "" })}
                className="px-3.5 py-2 border rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleOfferAction(counterModal.offerId, "Countered", counterModal.amount)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Send Counter
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}