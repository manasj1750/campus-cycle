import React from "react";
import { Link } from "react-router-dom";
import { Recycle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
        <Recycle className="w-8 h-8" />
      </div>
      <h1 className="text-5xl font-black text-slate-900">404</h1>
      <h2 className="text-lg font-bold text-slate-700 mt-2">Campus Page Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
        The second-hand item or campus page you're searching for might have found a new home.
      </p>
      <Link
        to="/"
        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
      >
        Back to CampusCycle Home
      </Link>
    </div>
  );
}