import React, { useState, useEffect } from "react";
import { Recycle, Sparkles, ArrowRight, Heart, Leaf, ShieldCheck } from "lucide-react";

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [statusText, setStatusText] = useState("Welcome to your campus marketplace...");

  const friendlyMessages = [
    { threshold: 0, text: "Welcome to your campus marketplace..." },
    { threshold: 25, text: "Finding textbooks, cycles & tech..." },
    { threshold: 55, text: "Connecting student buyers & sellers..." },
    { threshold: 82, text: "Giving things a second life..." },
    { threshold: 96, text: "Ready to explore! ✨" }
  ];

  const handleFinish = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 400);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        handleFinish();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Smooth ~1.9s duration
    const timer = setInterval(() => {
      setProgress((prev) => {
        const nextVal = prev + 1.25;
        if (nextVal >= 100) {
          clearInterval(timer);
          setTimeout(handleFinish, 150);
          return 100;
        }

        const msg = [...friendlyMessages].reverse().find((m) => nextVal >= m.threshold);
        if (msg) {
          setStatusText(msg.text);
        }

        return nextVal;
      });
    }, 22);

    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 select-none bg-gradient-to-b from-emerald-50/95 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 transition-all duration-400 ease-out ${
        isExiting ? "opacity-0 scale-98 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Soft Friendly Ambient Blobs */}
      <div className="absolute top-12 left-12 w-64 h-64 bg-emerald-200/40 dark:bg-emerald-900/20 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-12 right-12 w-72 h-72 bg-teal-200/40 dark:bg-teal-900/20 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />

      {/* Floating Campus Item Bubbles (Playful, student-friendly) */}
      <div className="absolute top-[18%] left-[15%] hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-sm border border-emerald-100 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 animate-float-slow">
        <span>🚲</span> Bicycles
      </div>
      <div
        className="absolute bottom-[22%] left-[18%] hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-sm border border-emerald-100 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 animate-float-slow"
        style={{ animationDelay: "1.5s" }}
      >
        <span>📚</span> Textbooks
      </div>
      <div
        className="absolute top-[22%] right-[16%] hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-sm border border-emerald-100 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 animate-float-slow"
        style={{ animationDelay: "0.8s" }}
      >
        <span>💻</span> Electronics
      </div>
      <div
        className="absolute bottom-[20%] right-[15%] hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-sm border border-emerald-100 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 animate-float-slow"
        style={{ animationDelay: "2.2s" }}
      >
        <span>🌱</span> Eco Reused
      </div>

      {/* Skip Button */}
      <button
        type="button"
        onClick={handleFinish}
        className="absolute top-5 right-5 sm:top-7 sm:right-7 z-20 flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300 bg-white/80 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 shadow-sm transition-all cursor-pointer group"
      >
        <span>Skip</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Main Friendly Card */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl shadow-emerald-950/5 border border-emerald-100/80 dark:border-slate-800 flex flex-col items-center text-center z-10 transition-transform">
        
        {/* Logo Badge (Exact match with website Navbar style) */}
        <div className="relative mb-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 animate-float-slow">
            <Recycle className="w-9 h-9 sm:w-11 sm:h-11 animate-spin-slow" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center shadow-md animate-bounce">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1 mb-6">
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Campus<span className="text-emerald-600">Cycle</span>
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
              Club
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Give Your Things a Second Life
          </p>
        </div>

        {/* Friendly Progress Bar */}
        <div className="w-full space-y-2 mb-6">
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-100 ease-out"
              style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs px-0.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium truncate">
              {statusText}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Campus Feature Pills */}
        <div className="grid grid-cols-3 gap-2 w-full pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-medium text-slate-600 dark:text-slate-400">
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <Leaf className="w-4 h-4 text-emerald-600" />
            <span>Zero Waste</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Student Only</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Campus Resale</span>
          </div>
        </div>

      </div>

      {/* Bottom Campus Tagline */}
      <div className="mt-6 text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">
        Asian School of Business • Student Marketplace
      </div>
    </div>
  );
}
