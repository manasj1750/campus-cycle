import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Heart,
  Share2,
  Flag,
  MessageCircle,
  Tag,
  ShieldCheck,
  Calendar,
  Eye,
  MapPin,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  ArrowLeft,
  X,
  Shield,
  Trash2,
  Sparkles,
  Check,
  Clock
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import RatingStars from "../components/RatingStars";
import ProductCard from "../components/ProductCard";
import { formatProductImage, handleImageError } from "../utils/imageUtils";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Offer Modal State
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState("");

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Scam");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState("");

  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/products/${id}`);
        if (res.data.success) {
          setProduct(res.data.product);
          setSimilarProducts(res.data.similarProducts || []);
          const firstImg =
            res.data.product.primaryImage ||
            (res.data.product.images && res.data.product.images[0]) ||
            "";
          setSelectedImage(firstImg);
          setOfferAmount(Math.round(res.data.product.price * 0.9)); // suggest 10% lower
        }
      } catch (err) {
        setError(err.response?.data?.message || "Product not found or removed.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 mt-3">Loading campus listing...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Listing Unavailable</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">{error || "This listing may have been sold or removed."}</p>
        <Link
          to="/products"
          className="px-6 py-2.5 bg-emerald-600 text-white font-semibold text-sm rounded-xl"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const isSaved = isInWishlist(product._id);
  const isSeller = user && String(user._id) === String(product.seller?._id);

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  // Contact Seller
  const handleContactSeller = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (isSeller) {
      showToast("You are the seller of this product.");
      return;
    }
    try {
      const res = await api.post("/messages/start", { productId: product._id });
      if (res.data.success) {
        navigate(`/messages?conversation=${res.data.conversation._id}`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Could not open chat.");
    }
  };

  // Submit Offer
  const handleSendOffer = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      setOfferSubmitting(true);
      const res = await api.post("/offers", {
        productId: product._id,
        amount: offerAmount,
        message: offerMessage
      });
      if (res.data.success) {
        setOfferSuccess("Offer submitted to seller! Check your dashboard for replies.");
        setTimeout(() => {
          setOfferModalOpen(false);
          setOfferSuccess("");
        }, 2000);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to make offer.");
    } finally {
      setOfferSubmitting(false);
    }
  };

  // Submit Report
  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      setReportSubmitting(true);
      const res = await api.post("/reports", {
        reportedProduct: product._id,
        reportedUser: product.seller?._id,
        reason: reportReason,
        description: reportDesc
      });
      if (res.data.success) {
        setReportSuccess("Report submitted to CampusCycle moderation team.");
        setTimeout(() => {
          setReportModalOpen(false);
          setReportSuccess("");
        }, 2000);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit report.");
    } finally {
      setReportSubmitting(false);
    }
  };

  // Copy share link
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Product link copied to clipboard!");
  };

  // Admin Actions
  const handleAdminApprove = async () => {
    try {
      await api.patch(`/admin/products/${product._id}/approve`);
      setProduct((prev) => ({ ...prev, status: "AVAILABLE" }));
      showToast("Listing approved & published to marketplace!");
    } catch (err) {
      showToast("Failed to approve listing.");
    }
  };

  const handleAdminFeature = async () => {
    try {
      const res = await api.patch(`/admin/products/${product._id}/feature`);
      setProduct((prev) => ({ ...prev, isFeatured: res.data.isFeatured }));
      showToast(res.data.isFeatured ? "Marked as featured on homepage!" : "Removed from featured.");
    } catch (err) {
      showToast("Failed to update featured status.");
    }
  };

  const handleAdminDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this listing as administrator?")) return;
    try {
      await api.delete(`/admin/products/${product._id}`);
      alert("Listing successfully deleted by administrator.");
      navigate("/products");
    } catch (err) {
      alert("Failed to delete listing.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xl animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Admin Moderation Bar */}
      {isAdmin && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  Admin Moderation
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Status: {product.status}
                </span>
                {product.isFeatured && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    ★ Featured
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Seller: {product.seller?.name} • College: {product.seller?.college || "N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {product.status !== "AVAILABLE" && (
              <button
                onClick={handleAdminApprove}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all active:scale-95"
              >
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
            )}
            <button
              onClick={handleAdminFeature}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center gap-1 ${
                product.isFeatured
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {product.isFeatured ? "Unfeature" : "Feature"}
            </button>
            <button
              onClick={handleAdminDelete}
              className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <Link
              to="/admin"
              className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold rounded-xl flex items-center gap-1"
            >
              Console →
            </Link>
          </div>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to listings
      </button>

      {/* Seller Pending Review Notice */}
      {isSeller && product.status === "PENDING_REVIEW" && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 text-amber-800 dark:text-amber-300 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-bold">Your listing is currently Pending Review</p>
            <p className="text-amber-700 dark:text-amber-400 mt-0.5">
              This preview is visible to you. Our campus moderation team will review and approve your item shortly.
            </p>
          </div>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Col: Image Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Large Image */}
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm">
            <img
              src={formatProductImage(selectedImage, product.category)}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => handleImageError(e, product.category)}
            />
            {product.status === "SOLD" && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                <span className="text-white text-lg font-black uppercase tracking-widest px-6 py-2 border-2 border-white rounded-xl">
                  Item Sold
                </span>
              </div>
            )}
            {product.status === "RESERVED" && (
              <span className="absolute top-4 left-4 bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider">
                Reserved
              </span>
            )}
          </div>

          {/* Thumbnails Row */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === img
                      ? "border-emerald-600 shadow-md ring-2 ring-emerald-500/20"
                      : "border-slate-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={formatProductImage(img, product.category)}
                    alt={`Thumb ${idx}`}
                    className="w-full h-full object-cover"
                    onError={(e) => handleImageError(e, product.category)}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Description Block */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 mt-8">
            <h3 className="font-bold text-slate-900 text-lg">Product Description</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                {product.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Safety Recommendation Banner */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3.5">
            <ShieldCheck className="w-6 h-6 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">
                Campus Safety Protocol
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                "Safety Tip: Meet sellers in a public campus location (Central Library, Student Center, Cafeteria) and inspect the product in person before completing the exchange."
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Details, Price & Seller (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
            
            {/* Category & Condition tags */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                {product.category} {product.subcategory ? `• ${product.subcategory}` : ""}
              </span>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md">
                Condition: {product.condition}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              {product.title}
            </h1>

            {/* Pricing Section */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-slate-900">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-sm text-slate-400 line-through ml-2.5 font-medium">
                    ₹{product.originalPrice.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              {discount && (
                <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">
                  {discount}% SAVED
                </span>
              )}
            </div>

            {/* Meta specs list */}
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 border-y border-slate-100 py-4">
              <div>
                <span className="text-slate-400 block">Campus Location</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {product.location || "Main Campus"}
                </span>
              </div>
              {product.brand && (
                <div>
                  <span className="text-slate-400 block">Brand</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{product.brand}</span>
                </div>
              )}
              {product.purchaseYear && (
                <div>
                  <span className="text-slate-400 block">Purchase Year</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{product.purchaseYear}</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block">Listed On</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {new Date(product.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="space-y-3 pt-2">
              {product.status === "SOLD" ? (
                <div className="w-full py-3.5 bg-slate-100 text-slate-500 font-bold text-center rounded-2xl text-sm">
                  This item has already been sold
                </div>
              ) : (
                <>
                  <button
                    onClick={handleContactSeller}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-md shadow-emerald-600/30 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contact Seller</span>
                  </button>

                  {product.isNegotiable && (
                    <button
                      onClick={() => setOfferModalOpen(true)}
                      className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm rounded-2xl border border-emerald-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Tag className="w-4 h-4" />
                      <span>Make an Offer</span>
                    </button>
                  )}
                </>
              )}

              {/* Utility Row: Wishlist, Share, Report */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    isSaved
                      ? "border-rose-300 bg-rose-50 text-rose-600"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
                  <span>{isSaved ? "Saved" : "Save Wishlist"}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>

                <button
                  onClick={() => setReportModalOpen(true)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs transition-colors"
                  title="Report Listing"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Seller Profile Card */}
          {product.seller && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Seller Information
                </span>
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Campus Verified
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                {product.seller.profilePhoto ? (
                  <img
                    src={product.seller.profilePhoto}
                    alt={product.seller.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-black text-base flex items-center justify-center">
                    {product.seller.name?.charAt(0) || "S"}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    {product.seller.name}
                  </h4>
                  <p className="text-xs text-slate-500 truncate max-w-[220px]">
                    {product.seller.department} • {product.seller.year}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                    {product.seller.college}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <RatingStars
                  rating={product.seller.avgRating || 5.0}
                  totalReviews={product.seller.totalReviews || 1}
                />
                <span className="text-slate-500">
                  {product.seller.listingCount || 1} active listings
                </span>
              </div>

              <Link
                to={`/profile/${product.seller._id}`}
                className="block text-center text-xs font-bold text-emerald-600 hover:text-emerald-700 pt-2 hover:underline"
              >
                View Seller's Full Profile →
              </Link>
            </div>
          )}

        </div>

      </div>

      {/* SIMILAR PRODUCTS SECTION */}
      {similarProducts.length > 0 && (
        <section className="pt-8 border-t border-slate-200">
          <h3 className="text-xl font-black text-slate-900 mb-6">
            Similar Items in {product.category}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {similarProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* MAKE OFFER MODAL */}
      {offerModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setOfferModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-600">
              <Tag className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 text-lg">Make an Offer</h3>
            </div>

            <p className="text-xs text-slate-500">
              Listing Price: <span className="font-bold text-slate-900">₹{product.price}</span>.
              Send a fair offer to the student seller.
            </p>

            {offerSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-sm font-semibold text-center">
                {offerSuccess}
              </div>
            ) : (
              <form onSubmit={handleSendOffer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Your Offer Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={product.price}
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-base focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Note for Seller (Optional)
                  </label>
                  <textarea
                    rows="3"
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    placeholder="e.g. Can meet tomorrow at the library and pay cash/UPI."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOfferModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={offerSubmitting}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    {offerSubmitting ? "Sending..." : "Submit Offer"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setReportModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-rose-600">
              <Flag className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 text-lg">Report Listing</h3>
            </div>

            <p className="text-xs text-slate-500">
              Help keep CampusCycle safe. Reports are audited by the Social Responsibility Club administrators.
            </p>

            {reportSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-sm font-semibold text-center">
                {reportSuccess}
              </div>
            ) : (
              <form onSubmit={handleSendReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Reason
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold"
                  >
                    <option value="Scam">Scam or Fraudulent Claim</option>
                    <option value="Fake Product">Counterfeit / Fake Product</option>
                    <option value="Inappropriate Content">Inappropriate Content / Photos</option>
                    <option value="Wrong Category">Wrong Category</option>
                    <option value="Prohibited Product">Prohibited Campus Item</option>
                    <option value="Duplicate Listing">Duplicate Listing</option>
                    <option value="Suspicious Activity">Suspicious Seller Activity</option>
                    <option value="Other">Other Reason</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Details
                  </label>
                  <textarea
                    rows="3"
                    required
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    placeholder="Provide details for campus moderators..."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-rose-500"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    {reportSubmitting ? "Submitting..." : "Send Report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}