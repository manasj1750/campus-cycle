import React from "react";
import { Filter, RotateCcw } from "lucide-react";

export default function FilterSidebar({
  categories = [],
  selectedCategory,
  onCategoryChange,
  selectedCondition,
  onConditionChange,
  selectedLocation,
  onLocationChange,
  priceRange,
  onPriceChange,
  onResetFilters
}) {
  const conditions = ["Like New", "Excellent", "Good", "Fair", "Needs Repair"];
  const campusLocations = [
    "All",
    "Hostel",
    "Main Campus",
    "Library",
    "Department",
    "Student Center",
    "Club Office",
    "Cafeteria",
    "Sports Complex"
  ];

  return (
    <aside className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          <h2 className="font-bold text-slate-900 dark:text-white text-base">Filters</h2>
        </div>
        <button
          onClick={onResetFilters}
          className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
          Category
        </label>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          <button
            onClick={() => onCategoryChange("All")}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !selectedCategory || selectedCategory.toLowerCase() === "all"
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory?.toLowerCase() === cat.name?.toLowerCase();
            return (
              <button
                key={cat._id || cat.name}
                onClick={() => onCategoryChange(cat.name)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                  isSelected
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className="truncate">{cat.name}</span>
                {cat.productCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-emerald-200/60 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold"
                      : "text-slate-400 bg-slate-100 dark:bg-slate-800"
                  }`}>
                    {cat.productCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          Condition
        </label>
        <div className="space-y-1.5">
          {conditions.map((cond) => (
            <label
              key={cond}
              className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
            >
              <input
                type="radio"
                name="condition"
                checked={selectedCondition === cond}
                onChange={() => onConditionChange(selectedCondition === cond ? "" : cond)}
                className="text-emerald-600 focus:ring-emerald-500 rounded"
              />
              <span>{cond}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Campus Location */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          Campus Location
        </label>
        <select
          value={selectedLocation}
          onChange={(e) => onLocationChange(e.target.value)}
          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:ring-emerald-500 focus:border-emerald-500"
        >
          {campusLocations.map((loc) => (
            <option key={loc} value={loc}>
              {loc === "All" ? "Everywhere on campus" : loc}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          Max Price: ₹{Number(priceRange).toLocaleString("en-IN")}
        </label>
        <input
          type="range"
          min="100"
          max="60000"
          step="200"
          value={priceRange}
          onChange={(e) => onPriceChange(e.target.value)}
          className="w-full accent-emerald-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>₹100</span>
          <span>₹60,000+</span>
        </div>
      </div>
    </aside>
  );
}