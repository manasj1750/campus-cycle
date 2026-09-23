import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Shield,
  Users,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Tag,
  Trash2,
  Check,
  X,
  Sparkles,
  BarChart3,
  Search,
  Plus,
  TrendingUp,
  Leaf,
  KeyRound,
  Lock,
  Mail,
  AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const COLORS = ["#10b981", "#06b6d4", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];

export default function AdminDashboard() {
  const { user, refreshMe } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [conditionStats, setConditionStats] = useState([]);

  // Data states
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter in Admin
  const [userSearch, setUserSearch] = useState("");
  const [productFilter, setProductFilter] = useState("PENDING_REVIEW");

  // Rejection modal
  const [rejectModal, setRejectModal] = useState({ open: false, productId: null, reason: "" });

  // New Category state
  const [newCat, setNewCat] = useState({ name: "", icon: "Package", description: "", subcategories: "" });

  // Admin Custom Credentials state
  const [credForm, setCredForm] = useState({
    email: user?.email || "",
    password: "",
    confirmPassword: ""
  });
  const [credStatus, setCredStatus] = useState({ loading: false, success: "", error: "" });

  // Auto-Categorization state
  const [autoCategorizing, setAutoCategorizing] = useState(false);
  const [autoCatResult, setAutoCatResult] = useState(null);

  useEffect(() => {
    if (user?.email) {
      setCredForm((prev) => ({ ...prev, email: user.email }));
    }
  }, [user?.email]);

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    setCredStatus({ loading: true, success: "", error: "" });

    if (credForm.password && credForm.password.length < 6) {
      setCredStatus({ loading: false, success: "", error: "Password must be at least 6 characters." });
      return;
    }

    if (credForm.password && credForm.password !== credForm.confirmPassword) {
      setCredStatus({ loading: false, success: "", error: "New passwords do not match." });
      return;
    }

    try {
      const res = await api.patch("/admin/credentials", {
        email: credForm.email,
        password: credForm.password || undefined
      });
      if (res.data.success) {
        setCredStatus({
          loading: false,
          success: "Admin credentials successfully updated! Please use these credentials next time you log in.",
          error: ""
        });
        setCredForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
        refreshMe();
      }
    } catch (err) {
      setCredStatus({
        loading: false,
        success: "",
        error: err.response?.data?.message || "Failed to update admin credentials."
      });
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/stats");
      if (res.data.success) {
        setStats(res.data.stats);
        setTimeline(res.data.timeline || []);
        setCategoryStats(res.data.categoryStats || []);
        setConditionStats(res.data.conditionStats || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/admin/users?search=${userSearch}`);
      if (res.data.success) setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/admin/products?status=${productFilter}`);
      if (res.data.success) setProducts(res.data.products || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      if (res.data.success) setCategories(res.data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await api.get("/admin/reports");
      if (res.data.success) setReports(res.data.reports || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "products") fetchProducts();
    if (activeTab === "categories") fetchCategories();
    if (activeTab === "reports") fetchReports();
  }, [activeTab, productFilter, userSearch]);

  // Modal Escape key accessibility listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && rejectModal.open) {
        setRejectModal({ open: false, productId: null, reason: "" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rejectModal.open]);

  // Product Actions
  const handleApproveProduct = async (id) => {
    try {
      await api.patch(`/admin/products/${id}/approve`);
      fetchProducts();
      fetchStats();
    } catch (err) {
      alert("Failed to approve product");
    }
  };

  const handleRejectProduct = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/admin/products/${rejectModal.productId}/reject`, {
        reason: rejectModal.reason
      });
      setRejectModal({ open: false, productId: null, reason: "" });
      fetchProducts();
      fetchStats();
    } catch (err) {
      alert("Failed to reject product");
    }
  };

  const handleToggleFeature = async (id) => {
    try {
      await api.patch(`/admin/products/${id}/feature`);
      fetchProducts();
    } catch (err) {
      alert("Failed to update feature status");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Permanently delete this listing?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      fetchProducts();
      fetchStats();
    } catch (err) {
      alert("Failed to delete product");
    }
  };

  const handleAutoCategorizeAll = async () => {
    if (!window.confirm("Run automatic category filter across all products? Any miscategorized products will be automatically updated into their proper categories.")) {
      return;
    }
    try {
      setAutoCategorizing(true);
      const res = await api.post("/admin/products/auto-categorize-all");
      if (res.data.success) {
        setAutoCatResult(res.data.message);
        fetchProducts();
        fetchStats();
        setTimeout(() => setAutoCatResult(null), 8000);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Auto-categorization failed");
    } finally {
      setAutoCategorizing(false);
    }
  };

  // User Actions
  const handleToggleSuspendUser = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/suspend`, { reason: "Moderator intervention" });
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert("Failed to update user suspension state");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete user account and all their listings?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  // Category Actions
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const subcats = newCat.subcategories
        ? newCat.subcategories.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      await api.post("/categories", { ...newCat, subcategories: subcats });
      setNewCat({ name: "", icon: "Package", description: "", subcategories: "" });
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create category");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete category?")) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert("Failed to delete category");
    }
  };

  // Report Actions
  const handleUpdateReportStatus = async (id, status) => {
    try {
      await api.patch(`/admin/reports/${id}`, { status });
      fetchReports();
    } catch (err) {
      alert("Failed to update report");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Campus Administration & Moderation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            Social Responsibility Club Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor sustainability metrics, review pending student listings, verify users, and manage campus categories.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700 text-xs">
          <div>
            <p className="text-slate-400">Items Reused</p>
            <p className="text-base font-black text-emerald-400">{stats?.itemsReused || 0}</p>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div>
            <p className="text-slate-400">Est. Student Savings</p>
            <p className="text-base font-black text-amber-400">₹{stats?.estimatedSavings?.toLocaleString("en-IN") || 0}</p>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <nav aria-label="Admin console sections" className="border-b border-slate-200 dark:border-slate-800">
        <div
          role="tablist"
          aria-label="Admin sections"
          className="flex gap-4 sm:gap-6 overflow-x-auto text-sm font-bold no-scrollbar py-0.5"
        >
          {[
            { key: "overview", label: "Analytics & Overview", icon: BarChart3 },
            { key: "products", label: `Listing Moderation (${stats?.pendingListings || 0} Pending)`, icon: Package },
            { key: "users", label: `Student Accounts (${stats?.totalUsers || 0})`, icon: Users },
            { key: "categories", label: "Campus Categories", icon: Tag },
            { key: "reports", label: `Safety Reports (${stats?.totalReports || 0})`, icon: AlertTriangle },
            { key: "security", label: "Admin Credentials", icon: KeyRound }
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = activeTab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                id={`tab-${t.key}`}
                aria-selected={isSelected}
                aria-controls={`tabpanel-${t.key}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setSearchParams({ tab: t.key })}
                className={`pb-3.5 border-b-2 transition-all whitespace-nowrap flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-t-lg ${
                  isSelected
                    ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* TAB 1: OVERVIEW & RECHARTS */}
      {activeTab === "overview" && (
        <div
          role="tabpanel"
          id="tabpanel-overview"
          aria-labelledby="tab-overview"
          tabIndex={0}
          className="space-y-8 focus-visible:outline-none"
        >
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Total Students</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats?.totalUsers || 0}</div>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Active campus peers</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Active Listings</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats?.activeListings || 0}</div>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">Live on marketplace</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Pending Review</span>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">{stats?.pendingListings || 0}</div>
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">Awaiting club approval</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Items Reused (Sold)</span>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{stats?.itemsReused || 0}</div>
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">Diverted from waste</span>
            </div>

          </div>

          {/* Recharts Row: Timeline Area Chart & Popular Categories Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Timeline Trends Chart */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4" role="region" aria-label="Campus Activity Timeline">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Campus Platform Activity (Last 7 Days)
                </h3>
                <span className="text-xs text-slate-600 dark:text-slate-400">Listings vs Registrations</span>
              </div>

              {/* Screen reader accessible summary table */}
              <div className="sr-only">
                <table>
                  <caption>7-day platform activity summary</caption>
                  <thead>
                    <tr><th scope="col">Day</th><th scope="col">New Listings</th><th scope="col">New Students</th></tr>
                  </thead>
                  <tbody>
                    {timeline.map((item) => (
                      <tr key={item.name}>
                        <td>{item.name} ({item.date})</td>
                        <td>{item.listings} listings</td>
                        <td>{item.users} new students</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="h-72 w-full min-w-0" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline}>
                    <defs>
                      <linearGradient id="colorListings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="listings" name="New Listings" stroke="#10b981" fillOpacity={1} fill="url(#colorListings)" />
                    <Area type="monotone" dataKey="users" name="New Students" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Popular Categories Bar Chart */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4" role="region" aria-label="Popular Campus Categories">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Popular Campus Categories
              </h3>

              {/* Screen reader accessible summary */}
              <div className="sr-only">
                <ul>
                  {categoryStats.map((c) => (
                    <li key={c.name}>{c.name}: {c.count} items</li>
                  ))}
                </ul>
              </div>

              <div className="h-72 w-full min-w-0" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryStats}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} interval={0} angle={-25} textAnchor="end" height={60} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="count" name="Items" fill="#059669" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Condition Distribution Pie Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs max-w-xl" role="region" aria-label="Item Conditions Distribution">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-2">
              Item Conditions Distribution
            </h3>

            {/* Screen reader accessible summary */}
            <div className="sr-only">
              <ul>
                {conditionStats.map((cond) => (
                  <li key={cond.name}>{cond.name}: {cond.count} listings</li>
                ))}
              </ul>
            </div>

            <div className="h-64 w-full min-w-0" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={conditionStats}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {conditionStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: LISTING MODERATION */}
      {activeTab === "products" && (
        <div
          role="tabpanel"
          id="tabpanel-products"
          aria-labelledby="tab-products"
          tabIndex={0}
          className="space-y-6 focus-visible:outline-none"
        >
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div role="group" aria-label="Filter listings by status" className="flex items-center gap-2 overflow-x-auto pb-1">
              {["PENDING_REVIEW", "AVAILABLE", "SOLD", "REJECTED", "ALL"].map((st) => (
                <button
                  key={st}
                  aria-pressed={productFilter === st}
                  onClick={() => setProductFilter(st)}
                  className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none ${
                    productFilter === st
                      ? "bg-slate-900 dark:bg-emerald-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>

            <button
              onClick={handleAutoCategorizeAll}
              disabled={autoCategorizing}
              className="px-3.5 py-2 min-h-[40px] bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 disabled:opacity-50 flex-shrink-0"
              title="Audit and reclassify miscategorized products"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{autoCategorizing ? "Auto-Filtering..." : "Run Category Auto-Filter"}</span>
            </button>
          </div>

          {autoCatResult && (
            <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span>{autoCatResult}</span>
              </div>
              <button onClick={() => setAutoCatResult(null)} className="font-bold text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 px-1">✕</button>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
            {products.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No products found under status "{productFilter}".
              </div>
            ) : (
              products.map((p) => (
                <div key={p._id} className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={p.primaryImage || p.images?.[0]}
                      alt={p.title}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          {p.category}
                        </span>
                        {p.autoFiltered && (
                          <span
                            className="text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 flex items-center gap-1"
                            title={p.originalCategory ? `Auto-filtered from "${p.originalCategory}"` : "Category auto-corrected"}
                          >
                            <Sparkles className="w-2.5 h-2.5 text-teal-600 dark:text-teal-400" /> Auto-Filtered
                          </span>
                        )}
                        <span className="text-[10px] text-slate-600 dark:text-slate-400">
                          by {p.seller?.name} ({p.seller?.college})
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{p.title}</h4>
                      <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                        ₹{p.price?.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                    {p.status === "PENDING_REVIEW" && (
                      <>
                        <button
                          onClick={() => handleApproveProduct(p._id)}
                          aria-label={`Approve listing for ${p.title}`}
                          className="px-3.5 py-2 min-h-[40px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" aria-hidden="true" /> Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ open: true, productId: p._id, reason: "" })}
                          aria-label={`Reject listing for ${p.title}`}
                          className="px-3.5 py-2 min-h-[40px] bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold rounded-xl flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none active:scale-95"
                        >
                          <X className="w-3.5 h-3.5" aria-hidden="true" /> Reject
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleToggleFeature(p._id)}
                      aria-label={p.isFeatured ? `Remove ${p.title} from featured` : `Feature ${p.title} on homepage`}
                      className={`px-3 py-2 min-h-[40px] rounded-xl text-xs font-bold border transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                        p.isFeatured
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                      {p.isFeatured ? "Featured" : "Feature"}
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(p._id)}
                      aria-label={`Permanently delete listing ${p.title}`}
                      className="p-2 min-w-[40px] min-h-[40px] text-rose-600 hover:bg-rose-50 rounded-xl flex items-center justify-center focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === "users" && (
        <div
          role="tabpanel"
          id="tabpanel-users"
          aria-labelledby="tab-users"
          tabIndex={0}
          className="space-y-6 focus-visible:outline-none"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchUsers();
            }}
            role="search"
            aria-label="Student accounts search"
            className="flex items-center gap-2 max-w-md"
          >
            <label htmlFor="adminUserSearchInput" className="sr-only">
              Search students by name, email, or student roll number
            </label>
            <input
              id="adminUserSearchInput"
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search students by name, email, roll no..."
              className="w-full px-4 py-2.5 min-h-[44px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            />
            <button
              type="submit"
              aria-label="Search student accounts"
              className="px-4 py-2.5 min-h-[44px] bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
            >
              Search
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u) => (
              <div key={u._id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-sm flex items-center justify-center">
                    {u.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{u.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        u.role === "ADMIN" ? "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800" : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      }`}>
                        {u.role}
                      </span>
                      {u.isSuspended && (
                        <span className="text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-md">
                          Suspended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{u.email} • {u.college}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-500">{u.department} • {u.year}</p>
                  </div>
                </div>

                {u.role !== "ADMIN" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleSuspendUser(u._id)}
                      aria-label={u.isSuspended ? `Unsuspend student account for ${u.name}` : `Suspend student account for ${u.name}`}
                      className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold border transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none ${
                        u.isSuspended
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40"
                      }`}
                    >
                      {u.isSuspended ? "Unsuspend" : "Suspend Account"}
                    </button>

                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      aria-label={`Permanently delete student account for ${u.name}`}
                      className="p-2.5 min-w-[40px] min-h-[40px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center justify-center focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORY MANAGEMENT */}
      {activeTab === "categories" && (
        <div
          role="tabpanel"
          id="tabpanel-categories"
          aria-labelledby="tab-categories"
          tabIndex={0}
          className="space-y-8 focus-visible:outline-none"
        >
          {/* Add Category Form */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4 max-w-xl">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Add New Campus Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label htmlFor="adminNewCatName" className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Category Name
                </label>
                <input
                  id="adminNewCatName"
                  type="text"
                  required
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                  placeholder="e.g. Lab Equipment"
                  className="w-full px-3.5 py-2.5 min-h-[40px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                />
              </div>
              <div>
                <label htmlFor="adminNewCatSubcats" className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Subcategories (Comma separated)
                </label>
                <input
                  id="adminNewCatSubcats"
                  type="text"
                  value={newCat.subcategories}
                  onChange={(e) => setNewCat({ ...newCat, subcategories: e.target.value })}
                  placeholder="e.g. Microscopes, Pipettes, Aprons"
                  className="w-full px-3.5 py-2.5 min-h-[40px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 min-h-[40px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none transition-colors"
              >
                Create Category
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div key={c._id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{c.productCount || 0} items active</span>
                </div>
                <button
                  onClick={() => handleDeleteCategory(c._id)}
                  aria-label={`Delete category ${c.name}`}
                  className="p-2 min-w-[36px] min-h-[36px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center justify-center focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SAFETY REPORTS */}
      {activeTab === "reports" && (
        <div
          role="tabpanel"
          id="tabpanel-reports"
          aria-labelledby="tab-reports"
          tabIndex={0}
          className="space-y-4 focus-visible:outline-none"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
            {reports.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No safety reports currently pending review.
              </div>
            ) : (
              reports.map((rep) => (
                <div key={rep._id} className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                        {rep.reason}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        Status: <span className="font-bold text-slate-900 dark:text-white">{rep.status}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-900 dark:text-white font-semibold mt-1">
                      {rep.description}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Reported by: {rep.reporter?.name} ({rep.reporter?.email})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateReportStatus(rep._id, "Resolved")}
                      aria-label={`Mark report from ${rep.reporter?.name || "student"} as resolved`}
                      className="px-3.5 py-2 min-h-[38px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none shadow-xs transition active:scale-95"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleUpdateReportStatus(rep._id, "Dismissed")}
                      aria-label={`Dismiss report from ${rep.reporter?.name || "student"}`}
                      className="px-3.5 py-2 min-h-[38px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none transition"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: ADMIN SECURITY & CREDENTIALS */}
      {activeTab === "security" && (
        <div
          role="tabpanel"
          id="tabpanel-security"
          aria-labelledby="tab-security"
          tabIndex={0}
          className="space-y-6 max-w-2xl focus-visible:outline-none"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Administrator Credentials & Security
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Customize the email and password used to access the CampusCycle Admin Portal.
                </p>
              </div>
            </div>

            {credStatus.error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{credStatus.error}</span>
              </div>
            )}

            {credStatus.success && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{credStatus.success}</span>
              </div>
            )}

            <form onSubmit={handleUpdateCredentials} className="space-y-4">
              <div>
                <label htmlFor="adminCredEmail" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="adminCredEmail"
                    type="email"
                    required
                    value={credForm.email}
                    onChange={(e) => setCredForm({ ...credForm, email: e.target.value })}
                    placeholder="e.g. admin@campuscycle.edu or your custom email"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  This email will be used when logging into the Admin Portal.
                </p>
              </div>

              <div>
                <label htmlFor="adminCredPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  New Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="adminCredPassword"
                    type="password"
                    value={credForm.password}
                    onChange={(e) => setCredForm({ ...credForm, password: e.target.value })}
                    placeholder="Leave blank to keep existing password"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Must be at least 6 characters long. Leave empty if only changing the email address.
                </p>
              </div>

              {credForm.password && (
                <div>
                  <label htmlFor="adminCredConfirmPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Admin Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="adminCredConfirmPassword"
                      type="password"
                      required
                      value={credForm.confirmPassword}
                      onChange={(e) => setCredForm({ ...credForm, confirmPassword: e.target.value })}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={credStatus.loading}
                  className="px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{credStatus.loading ? "Saving Credentials..." : "Save Administrator Credentials"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rejectModalTitle"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="rejectModalTitle" className="font-bold text-slate-900 dark:text-white text-base">
                Reject Listing
              </h3>
              <button
                type="button"
                onClick={() => setRejectModal({ open: false, productId: null, reason: "" })}
                aria-label="Close rejection dialog"
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleRejectProduct} className="space-y-4">
              <div>
                <label htmlFor="rejectReasonTextarea" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for student feedback
                </label>
                <textarea
                  id="rejectReasonTextarea"
                  rows="3"
                  required
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                  placeholder="e.g. Please upload clear photos showing condition."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none outline-none"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, productId: null, reason: "" })}
                  className="px-4 py-2 min-h-[40px] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 min-h-[40px] bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none transition"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}