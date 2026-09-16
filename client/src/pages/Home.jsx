import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Recycle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  Leaf,
  Users,
  CheckCircle2,
  Search as SearchIcon,
  MessageCircle,
  MapPin,
  SlidersHorizontal,
  Plus,
  Minus,
  Calculator,
  Lock,
  UserCheck,
  Shield,
  Tag,
  Heart,
  Info,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap
} from "lucide-react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import CategoryCard from "../components/CategoryCard";
import SearchBar from "../components/SearchBar";
import { ProductGridSkeleton } from "../components/LoadingSkeleton";
import SafeCampusExchangeBanner from "../components/SafeCampusExchangeBanner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatProductImage, handleImageError } from "../utils/imageUtils";

// Campus Resale Valuation Matrix
const VALUATION_DATA = {
  Bicycles: {
    icon: "🚲",
    label: "Bicycles",
    min: 2200,
    max: 4800,
    avgDays: "1-2 days",
    demand: "High Demand 🔥",
    demandColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
    popularExamples: "Hero, Btwin, Roadeo, Montra",
    tips: "Cycles with functioning gear shifters & brakes sell fastest on campus."
  },
  "Laptops & Tech": {
    icon: "💻",
    label: "Laptops & Tech",
    min: 16000,
    max: 42000,
    avgDays: "2-3 days",
    demand: "Surging Demand ⚡",
    demandColor: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
    popularExamples: "HP Victus, ThinkPad, Dell, MacBooks, iPads",
    tips: "Provide charger condition & battery cycle info to get quick offers."
  },
  "Textbooks": {
    icon: "📚",
    label: "Textbooks",
    min: 250,
    max: 750,
    avgDays: "24 Hours 🚀",
    demand: "Peak Season 📈",
    demandColor: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800",
    popularExamples: "Sem 1-8 guides, GATE prep, standard authors",
    tips: "Bundles of 2-3 semester subjects sell within 24 hours."
  },
  "Hostel & Room": {
    icon: "🛋️",
    label: "Hostel & Room",
    min: 450,
    max: 2000,
    avgDays: "2-4 days",
    demand: "Steady 👍",
    demandColor: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800",
    popularExamples: "Electric kettle, study table/chair, mattress, table lamp",
    tips: "Clean hostel appliances get snapped up by juniors immediately."
  },
  "Calculators & Lab": {
    icon: "🔬",
    label: "Lab & Calc",
    min: 500,
    max: 1800,
    avgDays: "1 day ⚡",
    demand: "High Demand 🔥",
    demandColor: "text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800",
    popularExamples: "Casio fx-991EX, Arduino kits, drafter, lab coat",
    tips: "Scientific calculators are in 100% active demand before midterms."
  }
};

const CONDITION_MULTIPLIER = {
  "Like New": 1.0,
  Good: 0.82,
  Fair: 0.65
};

const FALLBACK_SPOTLIGHT_ITEMS = [
  {
    _id: "demo-1",
    title: "Hercules Roadeo A21 Gear Cycle (Recently Serviced)",
    price: 3200,
    originalPrice: 7999,
    category: "Bicycles & Mobility",
    condition: "Like New",
    location: "Hostel Block C",
    seller: { name: "Aarav Sharma" },
    primaryImage: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80"
  },
  {
    _id: "demo-2",
    title: "HP Victus Gaming Laptop (Ryzen 5, 16GB RAM, RTX 3050)",
    price: 48000,
    originalPrice: 72000,
    category: "Electronics",
    condition: "Excellent",
    location: "Tech Campus Block B",
    seller: { name: "Rohan Patel" },
    primaryImage: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80"
  },
  {
    _id: "demo-3",
    title: "Casio fx-991EX Classwiz Scientific Calculator",
    price: 850,
    originalPrice: 1600,
    category: "Electronics",
    condition: "Like New",
    location: "Tech Campus Cafeteria",
    seller: { name: "Rohan Nair" },
    primaryImage: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800&q=80"
  },
  {
    _id: "demo-4",
    title: "Engineering Mathematics Sem 3 & 4 (H.K. Dass)",
    price: 450,
    originalPrice: 1100,
    category: "Books & Education",
    condition: "Good",
    location: "Central Library Desk",
    seller: { name: "Pooja Verma" },
    primaryImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80"
  }
];

export default function Home() {
  const { user, isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Core Data States
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    itemsReused: 7,
    studentsHelped: 32,
    estimatedSavings: 8750,
    wasteAvoidedKg: 24
  });

  // Hero Interactive Widget State
  const [heroTab, setHeroTab] = useState("spotlight"); // 'spotlight' | 'valuator'
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const [valuatorCategory, setValuatorCategory] = useState("Bicycles");
  const [valuatorCondition, setValuatorCondition] = useState("Good");

  // All-in-one Catalog States
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCondition, setCatalogCondition] = useState("All");
  const [catalogSort, setCatalogSort] = useState("newest");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Interactive Calculator State
  const [calcItems, setCalcItems] = useState({
    laptops: 1,
    textbooks: 3,
    bicycles: 1,
    furniture: 1
  });

  // Fetch Initial Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingProducts(true);
        const [prodRes, catRes, statsRes] = await Promise.all([
          api.get("/products?limit=30"),
          api.get("/categories"),
          api.get("/admin/stats").catch(() => null)
        ]);

        if (prodRes.data.success) {
          setAllProducts(prodRes.data.products || []);
        }
        if (catRes.data.success) {
          setCategories(catRes.data.categories || []);
        }
        if (statsRes?.data?.success) {
          const s = statsRes.data.stats;
          setStats({
            itemsReused: s.itemsReused || 7,
            studentsHelped: s.totalUsers || 32,
            estimatedSavings: s.estimatedSavings || 8750,
            wasteAvoidedKg: s.wasteAvoidedKg || 24
          });
        }
      } catch (err) {
        console.error("Home load error:", err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchData();
  }, []);

  // Filtered Products for Live In-Page Catalog
  const filteredProducts = allProducts.filter((p) => {
    const pCat = typeof p.category === "object" && p.category !== null
      ? (p.category.name || p.category._id || "")
      : (p.category || "");
    const matchesCategory =
      activeCategory === "All" ||
      pCat.toLowerCase() === activeCategory.toLowerCase();
    
    const matchesCondition =
      catalogCondition === "All" ||
      p.condition?.toLowerCase() === catalogCondition.toLowerCase();

    const matchesSearch =
      !catalogSearch.trim() ||
      p.title?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.description?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.location?.toLowerCase().includes(catalogSearch.toLowerCase());

    return matchesCategory && matchesCondition && matchesSearch;
  }).sort((a, b) => {
    if (catalogSort === "price_asc") return (a.price || 0) - (b.price || 0);
    if (catalogSort === "price_desc") return (b.price || 0) - (a.price || 0);
    if (catalogSort === "featured") return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Calculate Personal Sustainability Impact
  const calcCo2 = calcItems.laptops * 280 + calcItems.textbooks * 12 + calcItems.bicycles * 145 + calcItems.furniture * 45;
  const calcSavings = calcItems.laptops * 24000 + calcItems.textbooks * 650 + calcItems.bicycles * 3800 + calcItems.furniture * 1900;
  const calcTrees = Math.round(calcCo2 / 21);
  const calcWasteKg = calcItems.laptops * 3.5 + calcItems.textbooks * 2 + calcItems.bicycles * 15 + calcItems.furniture * 18;

  const updateCalc = (key, delta) => {
    setCalcItems((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta)
    }));
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Hero Spotlight Auto-Timer & Interaction
  const liveSpotlightItems = allProducts.length > 0 ? allProducts.slice(0, 8) : FALLBACK_SPOTLIGHT_ITEMS;
  const currentSpotlight = liveSpotlightItems[spotlightIndex % liveSpotlightItems.length] || liveSpotlightItems[0];

  useEffect(() => {
    if (heroTab !== "spotlight" || isHeroHovered || liveSpotlightItems.length <= 1) return;
    const timer = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % liveSpotlightItems.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroTab, isHeroHovered, liveSpotlightItems.length]);

  const handlePrevSpotlight = (e) => {
    e?.stopPropagation();
    setSpotlightIndex((prev) => (prev === 0 ? liveSpotlightItems.length - 1 : prev - 1));
  };

  const handleNextSpotlight = (e) => {
    e?.stopPropagation();
    setSpotlightIndex((prev) => (prev + 1) % liveSpotlightItems.length);
  };

  const handleSpotlightClick = () => {
    if (currentSpotlight?._id && !String(currentSpotlight._id).startsWith("demo")) {
      navigate(`/products/${currentSpotlight._id}`);
    } else {
      scrollToSection("marketplace");
    }
  };

  // Resale Valuator Calculations
  const currentValuation = VALUATION_DATA[valuatorCategory] || VALUATION_DATA["Bicycles"];
  const valMultiplier = CONDITION_MULTIPLIER[valuatorCondition] || 0.82;
  const estimatedMin = Math.round(currentValuation.min * valMultiplier);
  const estimatedMax = Math.round(currentValuation.max * valMultiplier);

  const handleValuatorListCTA = () => {
    if (isAuthenticated) {
      navigate("/sell");
    } else {
      navigate("/login?redirect=/sell");
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-20 w-full max-w-full overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/80 via-white to-slate-50 pt-8 pb-16 md:pt-14 md:pb-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-xs">
                <Leaf className="w-3.5 h-3.5" />
                <span>College Social Responsibility Club Initiative</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
                Give Your Things <br className="hidden sm:block" />
                a <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Second Life.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Everything in one college marketplace. Buy affordable textbooks, laptops, bikes, and dorm gear from verified campus peers, or sell what you no longer need.
              </p>

              {/* Action Buttons & Fast Anchors */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
                <button
                  onClick={() => scrollToSection("marketplace")}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                  <Tag className="w-4 h-4" />
                  <span>Explore Marketplace</span>
                </button>
                <Link
                  to={isAuthenticated ? "/sell" : "/login"}
                  className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm shadow-xs transition-all active:scale-95 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Sell an Item</span>
                </Link>
                <button
                  onClick={() => scrollToSection("calculator")}
                  className="px-5 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-sm border border-emerald-200 transition-all flex items-center gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Impact Calculator</span>
                </button>
              </div>

              {/* Campus Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Verified College Students
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Zero Platform Commission
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Safe On-Campus Handover
                </span>
              </div>
            </div>

            {/* Right Hero Visual: Interactive Campus Model */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                
                {/* Live Pulse Indicator Badge */}
                <div className="absolute -top-3.5 -left-2 sm:-left-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl px-3 sm:px-3.5 py-2 shadow-xl border border-slate-200/90 dark:border-slate-800 flex items-center gap-2 sm:gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider leading-none">Live Campus Deals</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                      {allProducts.length > 0 ? `${allProducts.length} Listings Active` : `${stats.itemsReused}+ Campus Drops`}
                    </p>
                  </div>
                </div>

                {/* Main Interactive Card */}
                <div
                  className="relative rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col transition-all"
                  onMouseEnter={() => setIsHeroHovered(true)}
                  onMouseLeave={() => setIsHeroHovered(false)}
                >
                  {/* Header Mode Switcher Tabs */}
                  <div className="p-2 sm:p-2.5 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setHeroTab("spotlight")}
                      className={`flex-1 py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        heroTab === "spotlight"
                          ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span className="truncate">Live Campus Drops</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroTab("valuator")}
                      className={`flex-1 py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        heroTab === "valuator"
                          ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span className="truncate">Resale Valuator</span>
                    </button>
                  </div>

                  {/* TAB 1: SPOTLIGHT */}
                  {heroTab === "spotlight" && (
                    <div className="flex flex-col">
                      {/* Spotlight Subheader */}
                      <div className="px-4 py-2 flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/40">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                            Live Spotlight
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {(spotlightIndex % liveSpotlightItems.length) + 1} of {liveSpotlightItems.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handlePrevSpotlight}
                            aria-label="Previous Spotlight Item"
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={handleNextSpotlight}
                            aria-label="Next Spotlight Item"
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Image Display */}
                      <div
                        onClick={handleSpotlightClick}
                        className="relative h-48 sm:h-52 bg-slate-900 overflow-hidden cursor-pointer group"
                      >
                        <img
                          src={formatProductImage(
                            currentSpotlight.primaryImage || (currentSpotlight.images && currentSpotlight.images[0]),
                            typeof currentSpotlight.category === "object" ? currentSpotlight.category?.name : currentSpotlight.category
                          )}
                          alt={currentSpotlight.title}
                          onError={(e) =>
                            handleImageError(
                              e,
                              typeof currentSpotlight.category === "object" ? currentSpotlight.category?.name : currentSpotlight.category
                            )
                          }
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent pointer-events-none" />

                        {/* Category & Condition Tags */}
                        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 backdrop-blur-md shadow-xs">
                            {typeof currentSpotlight.category === "object" ? currentSpotlight.category?.name : currentSpotlight.category}
                          </span>
                          {currentSpotlight.condition && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-600/90 text-white backdrop-blur-md">
                              {currentSpotlight.condition}
                            </span>
                          )}
                        </div>

                        {/* Price & Discount on bottom of image */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                          <div className="text-white drop-shadow-md">
                            <p className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">Campus Asking Price</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl sm:text-2xl font-black text-white">
                                ₹{Number(currentSpotlight.price || 0).toLocaleString("en-IN")}
                              </span>
                              {currentSpotlight.originalPrice > currentSpotlight.price && (
                                <span className="text-xs text-slate-300 line-through">
                                  ₹{Number(currentSpotlight.originalPrice).toLocaleString("en-IN")}
                                </span>
                              )}
                            </div>
                          </div>
                          {currentSpotlight.originalPrice > currentSpotlight.price && (
                            <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-md shadow-xs">
                              {Math.round(((currentSpotlight.originalPrice - currentSpotlight.price) / currentSpotlight.originalPrice) * 100)}% OFF
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Item Details and Actions */}
                      <div className="p-4 space-y-3 bg-white dark:bg-slate-900">
                        <div>
                          <h3
                            onClick={handleSpotlightClick}
                            className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-1 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors"
                          >
                            {currentSpotlight.title}
                          </h3>
                          <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1 truncate max-w-[160px]">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{currentSpotlight.location || "Campus Handover"}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{currentSpotlight.seller?.name || "Verified Peer"}</span>
                            </div>
                          </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={handleSpotlightClick}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>View Deal & Chat</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => scrollToSection("marketplace")}
                            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors whitespace-nowrap"
                            title="Browse full marketplace catalog"
                          >
                            Browse All
                          </button>
                        </div>

                        {/* Carousel Dots */}
                        <div className="flex items-center justify-center gap-1 pt-0.5">
                          {liveSpotlightItems.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSpotlightIndex(idx)}
                              aria-label={`Go to item ${idx + 1}`}
                              className={`h-1.5 rounded-full transition-all ${
                                spotlightIndex % liveSpotlightItems.length === idx
                                  ? "w-5 bg-emerald-600"
                                  : "w-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: VALUATOR */}
                  {heroTab === "valuator" && (
                    <div className="p-4 sm:p-5 flex flex-col space-y-3 bg-white dark:bg-slate-900">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Quick Resale Valuator
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">Zero Commission</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          Check realistic campus resale value before listing:
                        </p>
                      </div>

                      {/* Category Selection Pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {Object.keys(VALUATION_DATA).map((catKey) => {
                          const item = VALUATION_DATA[catKey];
                          const isSelected = valuatorCategory === catKey;
                          return (
                            <button
                              key={catKey}
                              type="button"
                              onClick={() => setValuatorCategory(catKey)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                isSelected
                                  ? "bg-slate-900 text-white dark:bg-emerald-600 shadow-xs"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                              }`}
                            >
                              <span>{item.icon}</span>
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Condition Selector */}
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Condition:</span>
                        <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                          {["Like New", "Good", "Fair"].map((cond) => (
                            <button
                              key={cond}
                              type="button"
                              onClick={() => setValuatorCondition(cond)}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                valuatorCondition === cond
                                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                              }`}
                            >
                              {cond}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dynamic Value Display Box */}
                      <div className="rounded-2xl p-3.5 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-slate-50 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 border border-emerald-200/80 dark:border-slate-700">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Estimated Campus Value:</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${currentValuation.demandColor}`}>
                            {currentValuation.demand}
                          </span>
                        </div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            ₹{estimatedMin.toLocaleString("en-IN")} – ₹{estimatedMax.toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* Quick Metrics */}
                        <div className="mt-2.5 pt-2 border-t border-emerald-200/60 dark:border-slate-700/80 grid grid-cols-2 gap-2 text-[11px]">
                          <div className="text-slate-600 dark:text-slate-400">
                            <span className="font-semibold text-slate-900 dark:text-white">⏱️ Resale Time:</span>
                            <p>{currentValuation.avgDays}</p>
                          </div>
                          <div className="text-slate-600 dark:text-slate-400">
                            <span className="font-semibold text-slate-900 dark:text-white">💰 Direct Payout:</span>
                            <p className="text-emerald-600 dark:text-emerald-400 font-bold">100% to You (₹0 cut)</p>
                          </div>
                        </div>

                        <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 italic">
                          💡 {currentValuation.tips}
                        </p>
                      </div>

                      {/* List CTA Button */}
                      <button
                        type="button"
                        onClick={handleValuatorListCTA}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>List My Item for Free in 30s</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Savings Stat Badge */}
                <div className="absolute -bottom-3.5 -right-2 sm:-right-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl px-3 sm:px-3.5 py-2 shadow-xl border border-slate-200/90 dark:border-slate-800 hidden xs:flex items-center gap-2 sm:gap-2.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider leading-none">Student Savings</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5">₹{stats.estimatedSavings.toLocaleString("en-IN")}+</p>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Quick Anchor Navigation Bar */}
          <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs font-bold text-slate-600">
            <span className="text-slate-400 uppercase tracking-wider hidden sm:inline whitespace-nowrap">Jump To Section:</span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto py-1 min-w-0">
              <button
                onClick={() => scrollToSection("marketplace")}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors whitespace-nowrap"
              >
                🛍️ Live Marketplace
              </button>
              <button
                onClick={() => scrollToSection("calculator")}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                🌿 Impact Calculator
              </button>
              <button
                onClick={() => scrollToSection("safe-zones")}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                🛡️ Safe Campus Zones
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                ⚡ How It Works
              </button>
              <button
                onClick={() => scrollToSection("club")}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                🤝 About Club
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 2. FAST ACCESS / 1-CLICK AUTH BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                {user?.name?.[0] || "U"}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Welcome back, {user?.name}! ({user?.email})
                </p>
                <p className="text-xs text-slate-500">
                  Campus Member • {user?.college || "Campus Institute"} • {user?.role || "USER"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Recycle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Ready to sell or buy on campus?
                </p>
                <p className="text-xs text-slate-500">
                  Join verified college peers to buy, sell, or reuse pre-owned campus essentials.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {isAuthenticated ? (
              <>
                <Link
                  to="/sell"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Post Listing
                </Link>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
                >
                  My Dashboard
                </Link>
                <Link
                  to="/messages"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
                >
                  Messages
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/products"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
                >
                  Browse Marketplace
                </Link>
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Join CampusClub
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 3. LIVE ALL-IN-ONE MARKETPLACE EXPLORER */}
      <section id="marketplace" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 scroll-mt-20">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Complete Campus Marketplace</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Browse & Filter All Items
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Real-time campus listings with instant category filtering and search
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">
              Showing <span className="text-emerald-700 font-bold">{filteredProducts.length}</span> items
            </span>
            <Link
              to={isAuthenticated ? "/sell" : "/login"}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Post an Item
            </Link>
          </div>
        </div>

        {/* Live Filter Controls Bar */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm space-y-4 mb-6 w-full max-w-full overflow-hidden">
          
          {/* Search + Sort + Condition Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search laptops, books, bikes, furniture, calculators..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
              />
              {catalogSearch && (
                <button
                  onClick={() => setCatalogSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Condition Filter */}
            <div className="sm:col-span-3">
              <select
                value={catalogCondition}
                onChange={(e) => setCatalogCondition(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Conditions</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good Condition</option>
                <option value="Fair">Fair / Usable</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="sm:col-span-3">
              <select
                value={catalogSort}
                onChange={(e) => setCatalogSort(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="featured">Featured First</option>
              </select>
            </div>

          </div>

          {/* Interactive Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1 w-full max-w-full min-w-0">
            <button
              onClick={() => setActiveCategory("All")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === "All"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              All Items
            </button>
            {categories.map((c) => (
              <button
                key={c._id || c.name}
                onClick={() => setActiveCategory(c.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeCategory === c.name
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <span>{c.name}</span>
              </button>
            ))}
          </div>

        </div>

        {/* Live Product Grid */}
        {loadingProducts ? (
          <ProductGridSkeleton count={8} />
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <Recycle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {allProducts.length === 0 ? "No Items Listed Yet" : "No matching items found"}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {allProducts.length === 0
                  ? "Be the first on campus to list your books, cycles, electronics, or dorm essentials for sale!"
                  : "Try clearing search terms or selecting a different category."}
              </p>
            </div>
            {allProducts.length === 0 ? (
              <Link
                to="/sell"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                List the First Item for Sale
              </Link>
            ) : (
              <button
                onClick={() => {
                  setActiveCategory("All");
                  setCatalogSearch("");
                  setCatalogCondition("All");
                }}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}

      </section>

      {/* 4. INTERACTIVE CAMPUS SUSTAINABILITY & SAVINGS CALCULATOR */}
      <section id="calculator" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Calculator className="w-3.5 h-3.5" />
              <span>Interactive Sustainability Calculator</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              Calculate Your Environmental & Financial Impact
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1">
              Select what you plan to reuse or pass down this academic year to see real metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Interactive Steppers */}
            <div className="lg:col-span-6 space-y-3.5">
              
              {/* Laptops */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">💻 Laptops & Tablets</p>
                  <p className="text-[11px] text-slate-300">~280 kg CO2 & ₹24,000 avg savings each</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => updateCalc("laptops", -1)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-sm"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center font-black text-emerald-300">{calcItems.laptops}</span>
                  <button
                    onClick={() => updateCalc("laptops", 1)}
                    className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center font-bold text-sm text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Textbooks */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">📚 Semester Textbooks & Notes</p>
                  <p className="text-[11px] text-slate-300">~12 kg CO2 & ₹650 saved each</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => updateCalc("textbooks", -1)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-sm"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center font-black text-emerald-300">{calcItems.textbooks}</span>
                  <button
                    onClick={() => updateCalc("textbooks", 1)}
                    className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center font-bold text-sm text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bicycles */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">🚲 Bicycles & Campus Mobility</p>
                  <p className="text-[11px] text-slate-300">~145 kg CO2 & ₹3,800 saved each</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => updateCalc("bicycles", -1)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-sm"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center font-black text-emerald-300">{calcItems.bicycles}</span>
                  <button
                    onClick={() => updateCalc("bicycles", 1)}
                    className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center font-bold text-sm text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dorm Furniture */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">🪑 Dorm Desks & Chairs</p>
                  <p className="text-[11px] text-slate-300">~45 kg CO2 & ₹1,900 saved each</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => updateCalc("furniture", -1)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-sm"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center font-black text-emerald-300">{calcItems.furniture}</span>
                  <button
                    onClick={() => updateCalc("furniture", 1)}
                    className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center font-bold text-sm text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* Right: Calculated Metrics Summary */}
            <div className="lg:col-span-6 bg-slate-950/60 rounded-3xl p-6 border border-emerald-500/30 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Total Calculated Impact</span>
                <span className="text-[11px] text-slate-400">Live Campus Formula</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="text-3xl font-black text-emerald-400">
                    {calcCo2} <span className="text-sm font-semibold">kg</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">CO₂ Footprint Prevented</p>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="text-3xl font-black text-amber-300">
                    ₹{calcSavings.toLocaleString("en-IN")}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">Money Kept in Pockets</p>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="text-3xl font-black text-teal-300">
                    {calcTrees}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">Trees Equivalent Grown</p>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="text-3xl font-black text-emerald-300">
                    {calcWasteKg} <span className="text-sm font-semibold">kg</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">Landfill Waste Diverted</p>
                </div>

              </div>

              <div className="pt-2">
                <button
                  onClick={() => scrollToSection("marketplace")}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Recycle className="w-4 h-4" />
                  <span>Start Reusing Items on Campus Now</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. SAFE CAMPUS PROTOCOL & VERIFIED ZONES */}
      <section id="safe-zones" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <SafeCampusExchangeBanner />
      </section>

      {/* 6. HOW IT WORKS */}
      <section id="how-it-works" className="bg-slate-100/70 py-16 border-y border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              Easy & Safe Campus Flow
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">
              How CampusCycle Works
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Four simple steps to give and receive within your campus community
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative">
              <span className="text-4xl font-black text-emerald-100 absolute top-4 right-4">
                01
              </span>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <SearchIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">1. Find</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Search books, electronics, bikes, or furniture posted by verified college peers.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative">
              <span className="text-4xl font-black text-emerald-100 absolute top-4 right-4">
                02
              </span>
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">2. Connect</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Chat with the student seller in real-time, negotiate price, and agree on an offer.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative">
              <span className="text-4xl font-black text-emerald-100 absolute top-4 right-4">
                03
              </span>
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">3. Meet</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Meet safely at the central library or student cafeteria to inspect the item in person.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative">
              <span className="text-4xl font-black text-emerald-100 absolute top-4 right-4">
                04
              </span>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Recycle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">4. Reuse</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Complete the exchange, save money, and give the product a second life!
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 7. CLUB MISSION & CALL TO ACTION BANNER */}
      <section id="club" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="bg-emerald-600 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-emerald-600/20">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700 text-emerald-100 text-xs font-bold uppercase tracking-wider">
              <Leaf className="w-3.5 h-3.5" />
              <span>Social Responsibility Club Mission</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              Graduating or Moving Dorms?
            </h2>
            <p className="text-emerald-100 text-sm max-w-lg">
              Don&apos;t throw away good gear. Pass it down to juniors, save landfill space, and put extra cash in your pocket.
            </p>
          </div>
          <Link
            to={isAuthenticated ? "/sell" : "/register"}
            className="px-8 py-4 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95 flex-shrink-0"
          >
            Post a Listing Now →
          </Link>
        </div>
      </section>

    </div>
  );
}