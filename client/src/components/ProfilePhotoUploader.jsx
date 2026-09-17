import React, { useState, useRef } from "react";
import { Camera, Trash2, Upload, Sparkles, Check, Loader2 } from "lucide-react";
import { compressImage } from "../utils/imageCompressor";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

// Curated playful campus student avatar presets
const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80"
];

export default function ProfilePhotoUploader({
  currentPhoto,
  userName = "Student",
  onPhotoChange,
  autoSave = true,
  className = ""
}) {
  const { updateProfile } = useAuth();
  const { toast } = useToast ? useToast() : { toast: null };
  const [photo, setPhoto] = useState(currentPhoto || "");
  const [loading, setLoading] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const fileInputRef = useRef(null);

  const applyPhoto = async (newPhotoUrl) => {
    setPhoto(newPhotoUrl);
    if (onPhotoChange) {
      onPhotoChange(newPhotoUrl);
    }
    if (autoSave && updateProfile) {
      try {
        setLoading(true);
        await updateProfile({ profilePhoto: newPhotoUrl });
        if (toast) {
          toast.success(newPhotoUrl ? "Profile picture updated!" : "Profile picture removed.");
        }
      } catch (err) {
        if (toast) {
          toast.error("Failed to save profile picture.");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    try {
      setLoading(true);
      // Compress to lightweight 400x400 avatar
      const compressed = await compressImage(file, 400, 400, 0.82);
      await applyPhoto(compressed);
    } catch (err) {
      console.error("Photo upload error:", err);
      alert("Failed to process image. Please try another photo.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    if (window.confirm("Remove your profile picture?")) {
      await applyPhoto("");
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Avatar Display with Camera Button */}
        <div className="relative group flex-shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-500/30 shadow-md relative flex items-center justify-center">
            {photo ? (
              <img
                src={photo}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl sm:text-3xl font-black text-emerald-800 dark:text-emerald-200">
                {userName?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}

            {/* Loading Spinner Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white z-10">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
            )}
          </div>

          {/* Quick Camera Trigger */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            title="Upload new photo"
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 transition-transform active:scale-90 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="space-y-2 text-center sm:text-left flex-1">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Profile Picture
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              PNG, JPG, or WebP. Automatically optimized for your campus profile.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{photo ? "Change Photo" : "Upload Photo"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Choose Avatar</span>
            </button>

            {photo && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={loading}
                className="px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preset Avatars Drawer */}
      {showPresets && (
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Student Avatars
            </span>
            <button
              type="button"
              onClick={() => setShowPresets(false)}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {AVATAR_PRESETS.map((presetUrl, idx) => {
              const isSelected = photo === presetUrl;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    applyPhoto(presetUrl);
                    setShowPresets(false);
                  }}
                  className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-transform hover:scale-105 ${
                    isSelected
                      ? "border-emerald-500 ring-2 ring-emerald-500/30 scale-105"
                      : "border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                  }`}
                >
                  <img
                    src={presetUrl}
                    alt={`Avatar ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-emerald-600/40 flex items-center justify-center text-white">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
