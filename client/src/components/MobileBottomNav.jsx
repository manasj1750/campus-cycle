import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Plus, MessageSquare, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

export default function MobileBottomNav() {
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav aria-label="Mobile navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1 safe-area-bottom w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Home */}
        <Link
          to="/"
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            isActive("/") && location.pathname === "/"
              ? "text-emerald-600 font-bold"
              : "text-slate-500 hover:text-slate-900 font-medium"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </Link>

        {/* Explore / Browse */}
        <Link
          to="/products"
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            isActive("/products")
              ? "text-emerald-600 font-bold"
              : "text-slate-500 hover:text-slate-900 font-medium"
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Browse</span>
        </Link>

        {/* Sell Button (Floating Center Action) */}
        <Link
          to={isAuthenticated ? "/sell" : "/login"}
          className="flex flex-col items-center -mt-5 group"
          title="Sell an Item"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/40 group-active:scale-95 transition-transform border-4 border-white">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-emerald-700 mt-0.5">Sell</span>
        </Link>

        {/* Chats */}
        <Link
          to={isAuthenticated ? "/messages" : "/login"}
          className={`relative flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            isActive("/messages")
              ? "text-emerald-600 font-bold"
              : "text-slate-500 hover:text-slate-900 font-medium"
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
          )}
          <span className="text-[10px] mt-0.5">Chats</span>
        </Link>

        {/* Account / Dashboard */}
        <Link
          to={isAuthenticated ? "/dashboard" : "/login"}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            isActive("/dashboard") || isActive("/login") || isActive("/register")
              ? "text-emerald-600 font-bold"
              : "text-slate-500 hover:text-slate-900 font-medium"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{isAuthenticated ? "Account" : "Log In"}</span>
        </Link>

      </div>
    </nav>
  );
}
