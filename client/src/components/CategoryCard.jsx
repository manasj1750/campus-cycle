import React from "react";
import { Link } from "react-router-dom";
import {
  Laptop,
  BookOpen,
  Shirt,
  Armchair,
  Bike,
  Home,
  Activity,
  Music,
  Tv,
  Gamepad2,
  Briefcase,
  Package
} from "lucide-react";

const iconMap = {
  Laptop,
  BookOpen,
  Shirt,
  Armchair,
  Bike,
  Home,
  Activity,
  Music,
  Tv,
  Gamepad2,
  Briefcase,
  Package
};

export default function CategoryCard({ category }) {
  const IconComponent = iconMap[category.icon] || Package;

  return (
    <Link
      to={`/products?category=${encodeURIComponent(category.name)}`}
      className="group relative bg-white hover:bg-emerald-50/40 rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-card transition-all duration-300 flex flex-col items-center text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mb-3.5 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
        <IconComponent className="w-7 h-7" />
      </div>
      <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
        {category.name}
      </h3>
      <p className="text-xs text-slate-500 mt-1">
        {category.productCount || 0} {category.productCount === 1 ? "item" : "items"}
      </p>
    </Link>
  );
}