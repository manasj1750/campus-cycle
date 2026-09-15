import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Recycle, Mail, Lock, ArrowRight, AlertCircle, Sparkles, UserCheck, Shield, KeyRound, CheckCircle, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Login({ defaultAdmin = false }) {
  const [searchParams] = useSearchParams();
  const isAdminParam = searchParams.get("mode") === "admin" || defaultAdmin;
  const [portalMode, setPortalMode] = useState(isAdminParam ? "admin" : "student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAdminParam) {
      setPortalMode("admin");
    }
  }, [isAdminParam]);

  // If already logged in as admin and on admin login page, redirect to /admin
  useEffect(() => {
    if (isAuthenticated && isAdmin && portalMode === "admin") {
      navigate("/admin");
    }
  }, [isAuthenticated, isAdmin, portalMode, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      setSubmitting(true);
      const res = await login(email, password);
      const userRole = res?.user?.role;

      if (portalMode === "admin") {
        if (userRole === "ADMIN") {
          navigate("/admin");
        } else {
          setInfo("Logged in as student account. Redirecting to your student dashboard...");
          setTimeout(() => {
            navigate(location.state?.from || "/dashboard");
          }, 1200);
        }
      } else {
        if (userRole === "ADMIN") {
          // If admin logged in via student form, take them to admin or dashboard
          navigate("/admin");
        } else {
          navigate(location.state?.from || "/dashboard");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password. Please verify credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xl space-y-6">
        
        {/* Tab Switcher: Student vs Admin */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setPortalMode("student");
              setError("");
              setInfo("");
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              portalMode === "student"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Recycle className="w-3.5 h-3.5" />
            <span>Student Login</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPortalMode("admin");
              setError("");
              setInfo("");
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              portalMode === "admin"
                ? "bg-slate-900 text-purple-300 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Brand / Header */}
        {portalMode === "admin" ? (
          <div className="text-center space-y-2 bg-gradient-to-b from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-inner border border-slate-700">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center mx-auto shadow-md shadow-purple-600/30">
              <Shield className="w-6 h-6 text-purple-100" />
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800">
                Staff & Club Access
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Admin Moderation Portal
            </h2>
            <p className="text-xs text-slate-300">
              Access platform data, verify student listings, and manage campus activity.
            </p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/30">
              <Recycle className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Welcome to CampusCycle
            </h2>
            <p className="text-xs text-slate-500">
              Log in to buy, sell, message peers, and manage campus listings
            </p>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{info}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {portalMode === "admin" ? "Admin Email Address" : "Email Address"}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={portalMode === "admin" ? "admin@campuscycle.edu" : "student@college.edu or gmail"}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
              {portalMode === "student" && (
                <Link to="/forgot-password" className="text-xs text-emerald-600 hover:underline">
                  Forgot?
                </Link>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 text-white font-bold text-sm rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md ${
              portalMode === "admin"
                ? "bg-slate-900 hover:bg-slate-800 shadow-slate-900/30"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
            }`}
          >
            {submitting ? (
              <span>Authenticating...</span>
            ) : portalMode === "admin" ? (
              <>
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Log In to Admin Console</span>
              </>
            ) : (
              <>
                <span>Log In to CampusCycle</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {portalMode === "student" ? (
          <div className="space-y-3 pt-2 border-t border-slate-100 text-center text-xs">
            <p className="text-slate-500">
              New to CampusCycle?{" "}
              <Link to="/register" className="font-bold text-emerald-600 hover:underline">
                Create an Account
              </Link>
            </p>
            <button
              type="button"
              onClick={() => {
                setPortalMode("admin");
                setError("");
                setInfo("");
              }}
              className="inline-flex items-center gap-1.5 font-semibold text-purple-700 hover:text-purple-900 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Campus Staff or Club Administrator? Switch to Admin Portal →</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-2 border-t border-slate-100 text-center text-xs text-slate-500">
            <p>
              Looking for student shopping or selling?{" "}
              <button
                type="button"
                onClick={() => {
                  setPortalMode("student");
                  setError("");
                  setInfo("");
                }}
                className="font-bold text-emerald-600 hover:underline"
              >
                Switch to Student Login
              </button>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    college: "National Institute of Technology",
    studentId: "",
    department: "Computer Science & Engineering",
    year: "1st Year"
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      await register(formData);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please check your details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl space-y-6">
        
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/30">
            <Recycle className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Create an Account
          </h2>
          <p className="text-xs text-slate-500">
            Join the campus second-hand community and start reusing
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Aarav Sharma"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g. name@gmail.com or student@college.edu"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                College / Institution *
              </label>
              <input
                type="text"
                name="college"
                required
                value={formData.college}
                onChange={handleInputChange}
                placeholder="National Institute of Technology"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Student ID / Roll No
              </label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                placeholder="NIT-23-CS-084"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="Computer Science"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Current Year
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password (min 6 chars) *
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/30 hover:shadow-lg transition-all active:scale-95"
          >
            {submitting ? "Registering..." : "Create Account & Join Club"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-emerald-600 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const handleForgot = (e) => {
    e.preventDefault();
    setMsg("If your email address is registered, password reset instructions have been dispatched.");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-slate-900 text-center">Reset Password</h2>
        <p className="text-xs text-slate-500 text-center">
          Enter your registered email address to receive a secure reset link.
        </p>
        {msg ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-semibold text-center">
            {msg}
          </div>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl"
            >
              Send Reset Link
            </button>
          </form>
        )}
        <div className="text-center pt-2">
          <Link to="/login" className="text-xs text-emerald-600 font-bold hover:underline">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}