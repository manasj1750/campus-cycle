import React from "react";
import { PackageOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function EmptyState({
  title = "No products found",
  message = "Try clearing some filters or searching for something else.",
  actionText = "Explore All Products",
  actionLink = "/products"
}) {
  return (
    <div className="py-16 px-4 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
      <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
        <PackageOpen className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6 leading-relaxed">
        {message}
      </p>
      {actionLink && (
        <Link
          to={actionLink}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
}