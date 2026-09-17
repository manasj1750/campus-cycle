import React, { useState, useEffect } from "react";
import { Recycle, Sparkles, Zap, ShieldCheck, ArrowRight } from "lucide-react";

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [statusText, setStatusText] = useState("Connecting to Campus Network...");

  const statusMessages = [
    { threshold: 0, text: "Connecting to Campus Hub..." },
    { threshold: 28, text: "Discovering student listings..." },
    { threshold: 58, text: "Syncing eco-marketplace..." },
    { threshold: 85, text: "Preparing your college cycle..." },
    { threshold: 98, text: "Welcome to CampusCycle!" }
  ];

  const handleFinish = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 500);
  };

  useEffect(() => {
    // Keyboard shortcut to skip splash immediately
    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        handleFinish();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Progress counter over ~2.1 seconds
    const intervalTime = 22; // ms
    const increment = 1.05; // per tick

    const timer = setInterval(() => {
      setProgress((prev) => {
        const nextVal = prev + increment;
        if (nextVal >= 100) {
          clearInterval(timer);
          setTimeout(handleFinish, 200);
          return 100;
        }

        // Update status text based on progress
        const currentMsg = [...statusMessages].reverse().find((m) => nextVal >= m.threshold);
        if (currentMsg) {
          setStatusText(currentMsg.text);
        }

        return nextVal;
      });
    }, intervalTime);

    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#070d18] text-white flex flex-col items-center justify-center overflow-hidden select-none transition-all duration-500 ease-in-out ${
        isExiting
          ? "opacity-0 scale-105 pointer-events-none blur-sm"
          : "opacity-100 scale-100"
      }`}
      aria-label="CampusCycle Loading"
    >
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 sm:w-96 h-80 sm:h-96 bg-emerald-500/15 rounded-full blur-[100px] animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 sm:w-96 h-80 sm:h-96 bg-teal-500/15 rounded-full blur-[100px] animate-pulse-glow pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* Subtle Grid Accent */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }}
      />

      {/* Skip Button */}
      <button
        type="button"
        onClick={handleFinish}
        className="absolute top-5 right-5 sm:top-7 sm:right-7 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 backdrop-blur-md transition-all duration-200 cursor-pointer shadow-lg group"
      >
        <span>Skip</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-emerald-400" />
      </button>

      {/* Main Center Animation Container */}
      <div className="relative flex flex-col items-center justify-center z-10 px-4 max-w-md w-full text-center">
        
        {/* Orbital & Ripple Centerpiece */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center mb-6 animate-float-slow">
          
          {/* Expanding Pulsing Ripple Rings */}
          <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ripple pointer-events-none" />
          <div
            className="absolute inset-2 rounded-full border border-teal-500/20 animate-ripple pointer-events-none"
            style={{ animationDelay: "1.2s" }}
          />

          {/* Outer Rotating Dashed Ring */}
          <svg
            className="absolute inset-0 w-full h-full animate-spin-slow text-emerald-400/40"
            viewBox="0 0 200 200"
          >
            <circle
              cx="100"
              cy="100"
              r="86"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="8 12"
              strokeLinecap="round"
            />
          </svg>

          {/* Inner Counter-Rotating Ring with Accents */}
          <svg
            className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] animate-spin-reverse-slow text-teal-400/30"
            viewBox="0 0 160 160"
          >
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 8"
            />
          </svg>

          {/* Central 3D Glowing Brand Badge */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-[2.5px] shadow-[0_0_50px_rgba(16,185,129,0.4)] transition-transform duration-300 hover:scale-105">
            <div className="w-full h-full bg-[#0a1222]/95 backdrop-blur-xl rounded-[22px] flex flex-col items-center justify-center relative overflow-hidden group">
              {/* Inner ambient shine */}
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-emerald-400/30 rounded-full blur-xl" />
              
              <div className="relative flex items-center justify-center">
                <Recycle className="w-11 h-11 sm:w-12 sm:h-12 text-emerald-400 animate-spin-slow drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                <Sparkles className="w-4 h-4 text-teal-300 absolute -top-1 -right-2 animate-bounce drop-shadow" />
              </div>
            </div>
          </div>
        </div>

        {/* Brand Typography */}
        <div className="space-y-2 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 backdrop-blur-md shadow-inner mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-300">
              Campus Student Exchange
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
            Campus<span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">Cycle</span>
          </h1>

          <p className="text-sm sm:text-base font-medium text-slate-300/90 tracking-wide">
            Give Your Things a Second Life.
          </p>
        </div>

        {/* Progress Bar & Status */}
        <div className="w-full max-w-xs sm:max-w-sm space-y-2.5">
          {/* Glowing Track */}
          <div className="h-2 w-full bg-slate-900/90 rounded-full p-0.5 border border-slate-800/80 backdrop-blur-md shadow-inner overflow-hidden relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.9)] transition-all duration-100 ease-out relative"
              style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
            >
              {/* Shimmer light pass */}
              <div className="absolute inset-0 bg-white/25 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Micro Information */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-400 font-medium tracking-wide transition-all duration-200 truncate pr-2">
              {statusText}
            </span>
            <span className="text-emerald-400 font-mono font-bold tracking-tight">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Feature Badges Footer */}
        <div className="mt-10 flex items-center justify-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-1.5 bg-slate-900/50 px-2.5 py-1 rounded-lg border border-slate-800/60">
            <span className="text-emerald-400">🌱</span>
            <span>Zero Waste</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/50 px-2.5 py-1 rounded-lg border border-slate-800/60">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Peer to Peer</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/50 px-2.5 py-1 rounded-lg border border-slate-800/60">
            <ShieldCheck className="w-3 h-3 text-teal-400" />
            <span>Verified Students</span>
          </div>
        </div>

      </div>
    </div>
  );
}
