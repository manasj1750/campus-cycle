import React from "react";
import { X } from "lucide-react";
import FilterSidebar from "./FilterSidebar";

export default function MobileFilterDrawer({ isOpen, onClose, ...sidebarProps }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm lg:hidden flex justify-end">
      <div className="w-full max-w-xs bg-white h-full shadow-2xl flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Filter Marketplace</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <FilterSidebar {...sidebarProps} />
        </div>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}