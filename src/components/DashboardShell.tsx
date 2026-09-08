"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type NavItem = { label: string; href: string; icon?: string };

const NAV_ICONS: Record<string, string> = {
  "/admin": "📊",
  "/admin/users": "👥",
  "/admin/departments": "🏢",
  "/admin/nurses": "👩‍⚕️",
  "/admin/reports": "📈",
  "/admin/maintenance": "🔧",
  "/admin/maintenance/assets": "🏗️",
  "/admin/payroll": "💰",
  "/admin/rates": "📋",
  "/admin/lab-tests": "🧪",
  "/admin/wards": "🛏️",
  "/admin/doctor-availability": "📅",
  "/admin/patients": "🧑‍🏥",
  "/admin/appointments": "📆",
  "/doctor": "🩺",
  "/doctor/opd": "🏥",
  "/pharmacy": "💊",
  "/pharmacy/inventory": "📦",
  "/lab": "🔬",
  "/receptionist": "🏨",
  "/receptionist/patients": "🧑‍🏥",
  "/receptionist/appointments": "📆",
  "/receptionist/opd": "🎫",
  "/receptionist/admissions": "🛏️",
  "/receptionist/lab-billing": "🧾",
  "/receptionist/lab-reports": "📋",
  "/receptionist/billing": "💳"
};

export default function DashboardShell({
  role,
  userName,
  navItems,
  badgeCounts: initialBadgeCounts,
  children
}: {
  role: string;
  userName: string;
  navItems: NavItem[];
  badgeCounts?: Record<string, number>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>(initialBadgeCounts || {});

  const fetchBadgeCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/maintenance-requests/count");
      if (res.ok) {
        const data = await res.json();
        setBadgeCounts((prev) => ({
          ...prev,
          "/admin/maintenance": data.count || 0
        }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchBadgeCounts]);

  const roleColors: Record<string, string> = {
    Admin: "from-brand-600 to-indigo-600",
    Doctor: "from-emerald-500 to-teal-600",
    Pharmacy: "from-violet-500 to-purple-600",
    Lab: "from-amber-500 to-orange-600",
    Receptionist: "from-cyan-500 to-blue-600"
  };

  const gradientClass = roleColors[role] || "from-brand-600 to-brand-500";

  return (
    <div className="min-h-screen flex bg-gray-50/50">
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col shadow-sidebar relative">
        <div className={`px-5 py-5 bg-gradient-to-r ${gradientClass} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-40"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center font-bold text-lg shadow-sm">
              H
            </div>
            <div>
              <p className="font-bold text-sm text-white leading-tight">HMS</p>
              <p className="text-xs text-white/70 leading-tight">{role} Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const count = badgeCounts?.[item.href] || 0;
            const icon = NAV_ICONS[item.href] || "•";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  active
                    ? "bg-brand-50 text-brand-700 shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <span className={`text-base ${active ? "scale-110" : "group-hover:scale-105"} transition-transform`}>{icon}</span>
                <span className="flex-1">{item.label}</span>
                {count > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-sm">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100 space-y-3">
          <Link
            href="/maintenance/report"
            className="flex items-center justify-center gap-2 w-full text-xs text-brand-600 hover:text-brand-700 font-medium py-2 rounded-xl bg-brand-50/50 hover:bg-brand-50 transition-colors"
          >
            <span>🔧</span> Report an Issue
          </Link>
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
              <p className="text-[11px] text-gray-400">{role}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
            className="w-full text-xs text-gray-400 hover:text-red-500 font-medium py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
