import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, ArrowUpDown, RefreshCw, Search } from "lucide-react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "../components/FilterSidebar";
import MobileFilterDrawer from "../components/MobileFilterDrawer";
import Pagination from "../components/Pagination";
import { ProductGridSkeleton } from "../components/LoadingSkeleton";
import EmptyState from "../components/EmptyState";
import SafeCampusExchangeBanner from "../components/SafeCampusExchangeBanner";

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter states derived from URL
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "All";
  const condition = searchParams.get("condition") || "";
  const location = searchParams.get("location") || "All";
  const maxPrice = searchParams.get("maxPrice") || 60000;
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Local state for search input on this page
  const [searchInput, setSearchInput] = useState(search);

  // Fetch categories once
  useEffect(() => {
    api.get("/categories").then((res) => {
      if (res.data.success) setCategories(res.data.categories || []);
    });
  }, []);

  // Sync search input with URL
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Fetch products whenever params change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (search) params.set("search", search);
        if (category && category !== "All") params.set("category", category);
        if (condition) params.set("condition", condition);
        if (location && location !== "All") params.set("location", location);
        if (maxPrice && Number(maxPrice) < 60000) params.set("maxPrice", maxPrice);
        if (sort) params.set("sort", sort);
        params.set("page", page);
        params.set("limit", 12);

        const res = await api.get(`/products?${params.toString()}`);
        if (res.data.success) {
          setProducts(res.data.products || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalCount(res.data.total || 0);
        }
      } catch (err) {
        console.error("Marketplace fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [search, category, condition, location, maxPrice, sort, page]);

  // Handlers to update URL searchParams
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (!value || value === "All") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    newParams.set("page", "1"); // Reset to page 1
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilter("search", searchInput.trim());
  };

  const resetFilters = () => {
    setSearchParams({});
    setSearchInput("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Title & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Campus Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Showing {totalCount} verified items available on campus
          </p>
        </div>

        {/* Quick Search form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search in marketplace..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs"
          >
            Search
          </button>
        </form>
      </div>

      <SafeCampusExchangeBanner />

      {/* Main Grid with Sidebar Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Desktop Sidebar (3 cols) */}
        <div className="hidden lg:block lg:col-span-3 sticky top-24">
          <FilterSidebar
            categories={categories}
            selectedCategory={category}
            onCategoryChange={(val) => updateFilter("category", val)}
            selectedCondition={condition}
            onConditionChange={(val) => updateFilter("condition", val)}
            selectedLocation={location}
            onLocationChange={(val) => updateFilter("location", val)}
            priceRange={maxPrice}
            onPriceChange={(val) => updateFilter("maxPrice", val)}
            onResetFilters={resetFilters}
          />
        </div>

        {/* Products Column (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Controls Bar: Mobile filter trigger & Sort dropdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between shadow-xs">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              <span>Filters & Categories</span>
            </button>

            <span className="text-xs text-slate-500 hidden sm:inline">
              Page {page} of {totalPages}
            </span>

            {/* Sorting Select */}
            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <label htmlFor="sortSelect" className="text-xs text-slate-500 font-medium">Sort:</label>
              <select
                id="sortSelect"
                value={sort}
                onChange={(e) => updateFilter("sort", e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="popular">Most Viewed</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {(category !== "All" || condition || location !== "All" || search) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Active filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Search: "{search}"
                  <button onClick={() => updateFilter("search", "")} className="hover:text-rose-600">×</button>
                </span>
              )}
              {category !== "All" && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Category: {category}
                  <button onClick={() => updateFilter("category", "")} className="hover:text-rose-600">×</button>
                </span>
              )}
              {condition && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Condition: {condition}
                  <button onClick={() => updateFilter("condition", "")} className="hover:text-rose-600">×</button>
                </span>
              )}
              {location !== "All" && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Location: {location}
                  <button onClick={() => updateFilter("location", "")} className="hover:text-rose-600">×</button>
                </span>
              )}
              <button
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:underline font-medium ml-2"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <ProductGridSkeleton count={9} />
          ) : products.length === 0 ? (
            <EmptyState
              title={totalCount === 0 && !search && category === "All" && !condition ? "No items listed yet" : "No items found"}
              message={
                totalCount === 0 && !search && category === "All" && !condition
                  ? "Be the first to list an item on campus! Give your textbooks, cycles, or electronics a second life."
                  : "No products match your selected filters. Try broadening your criteria or search query."
              }
              actionText={totalCount === 0 && !search && category === "All" && !condition ? "Post an Item for Sale" : "Reset All Filters"}
              actionLink={totalCount === 0 && !search && category === "All" && !condition ? "/sell" : "/products"}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => updateFilter("page", p)}
          />

        </div>

      </div>

      {/* Mobile Drawer */}
      <MobileFilterDrawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        categories={categories}
        selectedCategory={category}
        onCategoryChange={(val) => updateFilter("category", val)}
        selectedCondition={condition}
        onConditionChange={(val) => updateFilter("condition", val)}
        selectedLocation={location}
        onLocationChange={(val) => updateFilter("location", val)}
        priceRange={maxPrice}
        onPriceChange={(val) => updateFilter("maxPrice", val)}
        onResetFilters={resetFilters}
      />

    </div>
  );
}