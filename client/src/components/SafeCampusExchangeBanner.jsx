import React from "react";
import { ShieldAlert, MapPin, CheckCircle } from "lucide-react";

export default function SafeCampusExchangeBanner() {
  return (
    <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm sm:text-base">
            CampusCycle Safe Exchange Protocol
          </h4>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            All exchanges happen peer-to-peer on campus. Inspect electronics and course materials in person before payment (Cash or UPI).
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs font-semibold text-emerald-800 bg-white border border-emerald-200 px-3 py-2 rounded-xl shadow-xs flex-shrink-0">
        <MapPin className="w-4 h-4 text-emerald-600" />
        <span>Designated Safe Zones: Central Library & Student Union</span>
      </div>
    </div>
  );
}