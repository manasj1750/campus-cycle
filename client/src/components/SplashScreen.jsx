import React, { useState, useEffect } from "react";
import { Recycle, Sparkles, ArrowRight, Leaf, ShieldCheck, Heart, BookOpen, Laptop, Bike, ShoppingBag } from "lucide-react";

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [statusText, setStatusText] = useState("Welcome to your campus marketplace...");

  const friendlyMessages = [
    { threshold: 0, text: "Welcome to your campus marketplace..." },
    { threshold: 22, text: "Finding textbooks, cycles & student gear..." },
    { threshold: 52, text: "Connecting campus buyers & sellers..." },
    { threshold: 78, text: "Giving things a second life sustainably..." },
    { threshold: 95, text: "Ready to explore! ✨" }
  ];

  const handleFinish = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 450);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        handleFinish();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Smooth ~2.0s duration
    const timer = setInterval(() => {
      setProgress((prev) => {
        const nextVal = prev + 1.15;
        if (nextVal >= 100) {
          clearInterval(timer);
          setTimeout(handleFinish, 180);
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
      className={`fixed inset-0 z-[9999] flex flex-col justify-between items-center p-6 sm:p-12 select-none bg-gradient-to-b from-emerald-50/90 via-white to-teal-50/70 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/30 transition-all duration-500 ease-out ${
        isExiting ? "opacity-0 scale-102 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Expansive Ambient Background Glows (fills and blends with entire viewport) */}
      <div className="absolute -top-24 -left-24 w-96 sm:w-[550px] h-96 sm:h-[550px] bg-emerald-200/50 dark:bg-emerald-900/25 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute -bottom-24 -right-24 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-teal-200/45 dark:bg-teal-900/25 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-100/30 dark:bg-emerald-950/20 rounded-full blur-[160px] pointer-events-none" />

      {/* Decorative Floating Campus Badges (Left & Right Margins on Medium/Large Screens) */}
      <div className="absolute left-8 lg:left-16 top-1/3 hidden md:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg shadow-emerald-950/5 border border-emerald-100 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 animate-float-slow">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center">
          <Bike className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-normal">Campus Transit</div>
          <div>Bicycles & Rides</div>
        </div>
      </div>

      <div
        className="absolute left-10 lg:left-20 bottom-1/4 hidden md:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg shadow-emerald-950/5 border border-emerald-100 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 animate-float-slow"
        style={{ animationDelay: "1.8s" }}
      >
        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center">
          <BookOpen className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-normal">Semester Prep</div>
          <div>Books & Guides</div>
        </div>
      </div>

      <div
        className="absolute right-8 lg:right-16 top-1/3 hidden md:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg shadow-emerald-950/5 border border-emerald-100 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 animate-float-slow"
        style={{ animationDelay: "1s" }}
      >
        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center">
          <Laptop className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-normal">Tech & Devices</div>
          <div>Electronics & Calc</div>
        </div>
      </div>

      <div
        className="absolute right-10 lg:right-20 bottom-1/4 hidden md:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg shadow-emerald-950/5 border border-emerald-100 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 animate-float-slow"
        style={{ animationDelay: "2.4s" }}
      >
        <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 flex items-center justify-center">
          <Leaf className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-normal">Zero Waste</div>
          <div>Eco Reused</div>
        </div>
      </div>

      {/* Top Bar: Campus Badge + Skip Button */}
      <div className="w-full max-w-6xl flex items-center justify-between z-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-emerald-100 dark:border-slate-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Asian School of Business • Student Exchange</span>
        </div>

        <button
          type="button"
          onClick={handleFinish}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 bg-white/85 dark:bg-slate-900/85 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition-all cursor-pointer group"
        >
          <span>Skip</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Centerpiece Hero (Grand, Welcoming, Blends with Full Viewport) */}
      <div className="flex flex-col items-center justify-center text-center z-10 my-auto px-4 max-w-2xl w-full">
        
        {/* Large Brand Icon with Glowing Aura */}
        <div className="relative mb-6 sm:mb-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl sm:rounded-[36px] bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/35 animate-float-slow">
            <Recycle className="w-12 h-12 sm:w-16 sm:h-16 animate-spin-slow drop-shadow-md" />
          </div>

          {/* Sparkle Badge */}
          <div className="absolute -top-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center shadow-lg shadow-amber-400/40 animate-bounce">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </div>
        </div>

        {/* Brand Name Title */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white">
            Campus<span className="text-emerald-600 dark:text-emerald-400">Cycle</span>
          </h1>
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 sm:px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800">
            Club
          </span>
        </div>

        {/* Tagline */}
        <p className="text-base sm:text-xl font-medium text-slate-600 dark:text-slate-300 tracking-wide max-w-md sm:max-w-lg mb-8 sm:mb-10">
          Give Your Things a Second Life.
        </p>

        {/* Expansive Progress Bar */}
        <div className="w-full max-w-md sm:max-w-lg space-y-2.5">
          <div className="h-2.5 sm:h-3 w-full bg-emerald-100/70 dark:bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-emerald-200/50 dark:border-slate-700/50 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 transition-all duration-100 ease-out shadow-sm"
              style={{ width: `${Math.min(100, Math.max(6, progress))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm px-1 font-medium">
            <span className="text-slate-500 dark:text-slate-400 truncate pr-2">
              {statusText}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

      </div>

      {/* Bottom Footer Bar: Feature Highlights Across the Screen */}
      <div className="w-full max-w-4xl z-10 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/75 dark:bg-slate-900/75 backdrop-blur-sm border border-emerald-100 dark:border-slate-800 shadow-sm">
          <Leaf className="w-4 h-4 text-emerald-600" />
          <span>Zero Waste Community</span>
        </div>
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/75 dark:bg-slate-900/75 backdrop-blur-sm border border-emerald-100 dark:border-slate-800 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Student Verified Only</span>
        </div>
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/75 dark:bg-slate-900/75 backdrop-blur-sm border border-emerald-100 dark:border-slate-800 shadow-sm">
          <Heart className="w-4 h-4 text-rose-500" />
          <span>Campus Resale & Bargains</span>
        </div>
      </div>

    </div>
  );
}
