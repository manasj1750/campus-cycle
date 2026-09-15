import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";

export default function SearchBar({
  initialSearch = "",
  initialCategory = "",
  categories = [],
  placeholder = "Search books, laptops, bicycles, furniture...",
  onSearchSubmit = null
}) {
  const [query, setQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit({ search: query, category: selectedCategory });
    } else {
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      if (selectedCategory && selectedCategory !== "All") params.set("category", selectedCategory);
      navigate(`/products?${params.toString()}`);
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="w-full bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 p-1.5 sm:p-2 flex flex-col sm:flex-row items-center gap-2"
    >
      {/* Search Input */}
      <div className="relative flex-1 w-full flex items-center">
        <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-9 py-2.5 sm:py-3 bg-transparent text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="p-1 text-slate-400 hover:text-slate-600 mr-2"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category selector */}
      <div className="w-full sm:w-48 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-2">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full py-2.5 px-3 bg-transparent text-xs sm:text-sm text-slate-700 font-medium focus:outline-none cursor-pointer"
        >
          <option value="All">All Categories</option>
          {categories.map((c) => (
            <option key={c._id || c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Search Button */}
      <button
        type="submit"
        className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/30 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        <Search className="w-4 h-4" />
        <span>Search</span>
      </button>
    </form>
  );
}