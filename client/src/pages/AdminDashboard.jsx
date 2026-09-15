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
  Leaf
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

const COLORS = ["#10b981", "#06b6d4", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];

export default function AdminDashboard() {
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
      <div className="flex border-b border-slate-200 gap-4 sm:gap-6 overflow-x-auto text-sm font-bold">
        {[
          { key: "overview", label: "Analytics & Overview", icon: BarChart3 },
          { key: "products", label: `Listing Moderation (${stats?.pendingListings || 0} Pending)`, icon: Package },
          { key: "users", label: `Student Accounts (${stats?.totalUsers || 0})`, icon: Users },
          { key: "categories", label: "Campus Categories", icon: Tag },
          { key: "reports", label: `Safety Reports (${stats?.totalReports || 0})`, icon: AlertTriangle }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setSearchParams({ tab: t.key })}
              className={`pb-3.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === t.key
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & RECHARTS */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Students</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats?.totalUsers || 0}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">Active campus peers</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Active Listings</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats?.activeListings || 0}</div>
              <span className="text-[11px] text-slate-500">Live on marketplace</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Pending Review</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{stats?.pendingListings || 0}</div>
              <span className="text-[11px] text-amber-600 font-semibold">Awaiting club approval</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Items Reused (Sold)</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{stats?.itemsReused || 0}</div>
              <span className="text-[11px] text-emerald-700 font-semibold">Diverted from waste</span>
            </div>

          </div>

          {/* Recharts Row: Timeline Area Chart & Popular Categories Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Timeline Trends Chart */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Campus Platform Activity (Last 7 Days)
                </h3>
                <span className="text-xs text-slate-400">Listings vs Registrations</span>
              </div>

              <div className="h-72 w-full">
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
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="listings" name="New Listings" stroke="#10b981" fillOpacity={1} fill="url(#colorListings)" />
                    <Area type="monotone" dataKey="users" name="New Students" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Popular Categories Bar Chart */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Popular Campus Categories
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryStats}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} interval={0} angle={-25} textAnchor="end" height={60} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="count" name="Items" fill="#059669" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Condition Distribution Pie Chart */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs max-w-xl">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-2">
              Item Conditions Distribution
            </h3>
            <div className="h-64 w-full">
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
        <div className="space-y-6">
          
          <div className="flex items-center gap-2">
            {["PENDING_REVIEW", "AVAILABLE", "SOLD", "REJECTED", "ALL"].map((st) => (
              <button
                key={st}
                onClick={() => setProductFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  productFilter === st
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            {products.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No products found under status "{productFilter}".
              </div>
            ) : (
              products.map((p) => (
                <div key={p._id} className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={p.primaryImage || p.images?.[0]}
                      alt={p.title}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {p.category}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          by {p.seller?.name} ({p.seller?.college})
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">{p.title}</h4>
                      <p className="text-sm font-black text-slate-900 mt-0.5">
                        ₹{p.price?.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    {p.status === "PENDING_REVIEW" && (
                      <>
                        <button
                          onClick={() => handleApproveProduct(p._id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ open: true, productId: p._id, reason: "" })}
                          className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleToggleFeature(p._id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        p.isFeatured
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                      {p.isFeatured ? "Featured" : "Feature"}
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(p._id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
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
        <div className="space-y-6">
          <div className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search students by name, email, roll no..."
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm"
            />
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
            >
              Search
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            {users.map((u) => (
              <div key={u._id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center">
                    {u.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{u.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        u.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-emerald-50 text-emerald-800"
                      }`}>
                        {u.role}
                      </span>
                      {u.isSuspended && (
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md">
                          Suspended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{u.email} • {u.college}</p>
                    <p className="text-[11px] text-slate-400">{u.department} • {u.year}</p>
                  </div>
                </div>

                {u.role !== "ADMIN" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleSuspendUser(u._id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        u.isSuspended
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                      }`}
                    >
                      {u.isSuspended ? "Unsuspend" : "Suspend Account"}
                    </button>

                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
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
        <div className="space-y-8">
          {/* Add Category Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 max-w-xl">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Add New Campus Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                  placeholder="e.g. Lab Equipment"
                  className="w-full px-3.5 py-2 border rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Subcategories (Comma separated)</label>
                <input
                  type="text"
                  value={newCat.subcategories}
                  onChange={(e) => setNewCat({ ...newCat, subcategories: e.target.value })}
                  placeholder="e.g. Microscopes, Pipettes, Aprons"
                  className="w-full px-3.5 py-2 border rounded-xl text-xs"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Create Category
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div key={c._id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                  <span className="text-xs text-slate-400">{c.productCount || 0} items active</span>
                </div>
                <button
                  onClick={() => handleDeleteCategory(c._id)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SAFETY REPORTS */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            {reports.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No safety reports currently pending review.
              </div>
            ) : (
              reports.map((rep) => (
                <div key={rep._id} className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        {rep.reason}
                      </span>
                      <span className="text-xs text-slate-500">
                        Status: <span className="font-bold">{rep.status}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-semibold mt-1">
                      {rep.description}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Reported by: {rep.reporter?.name} ({rep.reporter?.email})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateReportStatus(rep._id, "Resolved")}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleUpdateReportStatus(rep._id, "Dismissed")}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
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

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Reject Listing</h3>
            <form onSubmit={handleRejectProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Reason for student feedback
                </label>
                <textarea
                  rows="3"
                  required
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                  placeholder="e.g. Please upload clear photos showing condition."
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, productId: null, reason: "" })}
                  className="px-3.5 py-1.5 border rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold"
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