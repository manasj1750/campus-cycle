import React from "react";
import { Link } from "react-router-dom";
import { Recycle, Heart, ShieldCheck, Leaf, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-14 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
                <Recycle className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Campus<span className="text-emerald-400">Cycle</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              "Give Your Things a Second Life." A student-driven sustainable second-hand marketplace initiative by the College Social Responsibility Club.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1.5 rounded-lg w-fit">
              <Leaf className="w-3.5 h-3.5" />
              <span>Promoting campus circular economy & zero waste</span>
            </div>
          </div>

          {/* Marketplace Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Marketplace
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/products" className="hover:text-emerald-400 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/products?category=Electronics" className="hover:text-emerald-400 transition-colors">
                  Laptops & Electronics
                </Link>
              </li>
              <li>
                <Link to="/products?category=Books%20%26%20Education" className="hover:text-emerald-400 transition-colors">
                  Course Textbooks
                </Link>
              </li>
              <li>
                <Link to="/products?category=Vehicles" className="hover:text-emerald-400 transition-colors">
                  Campus Bicycles
                </Link>
              </li>
              <li>
                <Link to="/products?category=Hostel%20Essentials" className="hover:text-emerald-400 transition-colors">
                  Hostel Essentials
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/sell" className="hover:text-emerald-400 transition-colors">
                  Sell an Item
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-emerald-400 transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-emerald-400 transition-colors">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link to="/messages" className="hover:text-emerald-400 transition-colors">
                  In-App Messages
                </Link>
              </li>
            </ul>
          </div>

          {/* Safe Campus Guidelines */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Campus Safety
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Always conduct inspections and handovers in open campus areas:
            </p>
            <div className="mt-2 space-y-1 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Central Library Foyer
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Student Activity Center
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Main Cafeteria Plaza
              </div>
            </div>
          </div>
        </div>

        {/* Environmental Notice & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} CampusCycle. Built for College Social Responsibility Club.
          </p>
          <p className="italic text-center sm:text-right text-slate-400">
            *Environmental & student savings statistics are calculated estimates from peer-to-peer reuse.
          </p>
        </div>
      </div>
    </footer>
  );
}