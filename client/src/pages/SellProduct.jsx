import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { compressImage } from "../utils/imageCompressor";

export default function SellProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [selectedCategoryObj, setSelectedCategoryObj] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    price: "",
    originalPrice: "",
    condition: "Good",
    brand: "",
    model: "",
    purchaseYear: new Date().getFullYear() - 1,
    location: "Main Campus",
    tags: "",
    isNegotiable: true,
    contactPreference: "In-App Chat"
  });

  const [images, setImages] = useState([]);
  const [primaryImageIdx, setPrimaryImageIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    api.get("/categories").then((res) => {
      if (res.data.success && res.data.categories.length > 0) {
        setCategories(res.data.categories);
        setFormData((prev) => ({ ...prev, category: res.data.categories[0].name }));
        setSelectedCategoryObj(res.data.categories[0]);
      }
    });
  }, []);

  const handleCategoryChange = (e) => {
    const catName = e.target.value;
    const catObj = categories.find((c) => c.name === catName);
    setSelectedCategoryObj(catObj);
    setFormData((prev) => ({
      ...prev,
      category: catName,
      subcategory: catObj?.subcategories?.[0] || ""
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Image Upload Handling (compress to lightweight base64 preview & storage)
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (images.length + files.length > 5) {
      alert("You can upload a maximum of 5 photos per listing.");
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        try {
          const compressed = await compressImage(file, 900, 900, 0.7);
          setImages((prev) => [...prev, compressed]);
        } catch (compErr) {
          console.warn("Canvas compression failed, using reader fallback:", compErr);
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            setImages((prev) => [...prev, uploadEvent.target.result]);
          };
          reader.readAsDataURL(file);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (primaryImageIdx === index) {
      setPrimaryImageIdx(0);
    } else if (primaryImageIdx > index) {
      setPrimaryImageIdx(primaryImageIdx - 1);
    }
  };

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Please provide a product title.");
      return;
    }

    if (!formData.description.trim()) {
      setError("Please provide a product description.");
      return;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      setError("Please enter a valid selling price.");
      return;
    }

    if (images.length === 0) {
      setError("Please upload at least one photo of the item.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        ...formData,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : 0,
        purchaseYear: formData.purchaseYear ? Number(formData.purchaseYear) : undefined,
        images: images,
        primaryImage: images[primaryImageIdx] || images[0],
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
          : []
      };

      const res = await api.post("/products", payload);
      if (res.data.success) {
        setSuccessMessage(res.data.message);
        setTimeout(() => {
          navigate("/dashboard");
        }, 2200);
      }
    } catch (err) {
      console.error("Listing creation error:", err);
      let errorText = "Failed to create listing.";
      if (err.response) {
        if (err.response.status === 413) {
          errorText = "Photos payload is too large. Please select fewer or smaller photos.";
        } else if (err.response.data?.message) {
          errorText = err.response.data.message;
        } else if (typeof err.response.data === "string" && err.response.data.includes("FUNCTION_PAYLOAD_TOO_LARGE")) {
          errorText = "Image upload exceeded server limit. Please reduce photo count.";
        } else {
          errorText = `Error (${err.response.status}): ${err.response.statusText || "Server error occurred. Please check required fields."}`;
        }
      } else if (err.request) {
        errorText = "Network connection timed out while uploading. Please check your internet connection.";
      } else {
        errorText = err.message || "Failed to create listing. Please check required fields.";
      }
      setError(errorText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
          Sell to Campus Community
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
          Create a New Listing
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Give unused textbooks, electronics, cycles, and hostel items a second life.
        </p>
      </div>

      {/* Moderation notice */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 mb-8 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 leading-relaxed">
          <span className="font-bold text-slate-900">Campus Verification Policy:</span>{" "}
          To keep our college marketplace clean and scam-free, listings are automatically reviewed by the Social Responsibility Club moderation team before becoming publicly visible.
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-5 bg-emerald-600 text-white rounded-2xl text-sm font-bold mb-6 text-center shadow-lg">
          ✓ {successMessage}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
        
        {/* Photos Upload Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Product Photos</h2>
              <p className="text-xs text-slate-500">Upload up to 5 genuine photos of the item</p>
            </div>
            <span className="text-xs font-bold text-emerald-700">{images.length}/5 uploaded</span>
          </div>

          {/* Upload Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 group bg-slate-100"
              >
                <img src={img} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                
                {/* Primary Badge */}
                {primaryImageIdx === idx && (
                  <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                    Cover
                  </span>
                )}

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPrimaryImageIdx(idx)}
                    className="p-1.5 bg-white/90 text-slate-800 rounded-lg text-[10px] font-bold hover:bg-white"
                  >
                    Set Cover
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {images.length < 5 && (
              <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors flex flex-col items-center justify-center cursor-pointer p-3 text-center">
                <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-700">Add Photo</span>
                <span className="text-[10px] text-slate-400">PNG, JPG, WEBP</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Basic Details */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Item Details
          </h2>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. Casio FX-991EX Scientific Calculator with Case"
              required
              maxLength={100}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleCategoryChange}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat._id || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Subcategory
              </label>
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="">General</option>
                {selectedCategoryObj?.subcategories?.map((sc) => (
                  <option key={sc} value={sc}>
                    {sc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Condition *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {["Like New", "Excellent", "Good", "Fair", "Needs Repair"].map((cond) => (
                <button
                  type="button"
                  key={cond}
                  onClick={() => setFormData((p) => ({ ...p, condition: cond }))}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    formData.condition === cond
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Description *
            </label>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe condition, battery health, semester course relevance, accessories included, reason for selling..."
              required
              maxLength={3000}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            ></textarea>
          </div>

          {/* Brand, Model, Purchase Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="e.g. Apple, Casio, Hero"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Model
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                placeholder="e.g. Classwiz 991EX"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Purchase Year
              </label>
              <input
                type="number"
                name="purchaseYear"
                min="2015"
                max={new Date().getFullYear()}
                value={formData.purchaseYear}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Campus Handover */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Pricing & Handover
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                min="1"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="e.g. 1200"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Original Retail Price (₹)
              </label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleInputChange}
                placeholder="e.g. 2500 (shows discount %)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Preferred Campus Handover Location
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium"
              >
                <option value="Main Campus">Main Campus</option>
                <option value="Hostel">Hostel Block</option>
                <option value="Library">Central Library</option>
                <option value="Department">Academic Department</option>
                <option value="Student Center">Student Center / Union</option>
                <option value="Club Office">Social Responsibility Club Office</option>
                <option value="Cafeteria">Cafeteria Plaza</option>
                <option value="Sports Complex">Sports Complex</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="textbook, cse, first-year, electronics"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
              />
            </div>
          </div>

          {/* Negotiable toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isNegotiable"
                checked={formData.isNegotiable}
                onChange={handleInputChange}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <div>
                <span className="text-sm font-bold text-slate-800">Allow Price Negotiation</span>
                <p className="text-xs text-slate-500">
                  Allows students to submit price offers via in-app bidding
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-emerald-600/30 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <span>Optimizing Photos...</span>
            ) : submitting ? (
              <span>Publishing Listing...</span>
            ) : (
              <>
                <span>Publish Campus Listing</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}