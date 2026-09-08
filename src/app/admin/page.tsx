"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Stats = {
  patients: number;
  doctors: number;
  todayAppointments: number;
  outstanding: number;
  pendingLab: number;
  todayDispensed: number;
  todayEarnings: number;
  todayRevenue: number;
  todayPending: number;
  lowStock: number;
  revenueByDay: { date: string; amount: number }[];
};

type IssueAlert = {
  id: string;
  title: string;
  description?: string;
  priority: string;
  resolved: boolean;
  raisedBy: { name: string };
  createdAt: string;
  department?: { name: string };
};

type MaintenanceRequest = {
  id: string;
  title: string;
  category: string;
  customCategory?: string;
  customLocation?: string;
  asset?: { name: string };
  priority: string;
  status: string;
  reportedBy: { name: string };
  reportedAt: string;
};

const PRIORITY_STYLES: Record<string, string> = {
  MOST_URGENT: "bg-red-100 text-red-700 border-red-300",
  URGENT: "bg-amber-100 text-amber-700 border-amber-300",
  NORMAL: "bg-gray-100 text-gray-600 border-gray-300"
};

const MAINTENANCE_PRIORITY_STYLES: Record<string, string> = {
  MOST_URGENT: "border-l-red-500",
  URGENT: "border-l-amber-500",
  NORMAL: "border-l-gray-300"
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<IssueAlert[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);

  useEffect(() => {
    fetch("/api/dashboard-stats")
      .then((r) => r.json())
      .then(setStats);
    fetch("/api/issue-alerts?resolved=false")
      .then((r) => r.json())
      .then(setAlerts);
    fetch("/api/maintenance-requests?status=REPORTED")
      .then((r) => r.ok ? r.json() : [])
      .then(setMaintenanceRequests)
      .catch(() => {});
  }, []);

  async function handleResolve(id: string) {
    await fetch(`/api/issue-alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved: true })
    });
    setAlerts(alerts.filter((a) => a.id !== id));
    router.refresh();
  }

  const cards = stats
    ? [
        { label: "Today's Appointments", value: stats.todayAppointments },
        { label: "Today's Revenue", value: `PKR ${stats.todayRevenue.toLocaleString()}` },
        { label: "Today's Earnings", value: `PKR ${stats.todayEarnings.toLocaleString()}` },
        { label: "Dispensed Today", value: stats.todayDispensed },
        { label: "Pending Bills", value: stats.todayPending },
        { label: "Pending Lab Orders", value: stats.pendingLab },
        { label: "Low Stock Medicines", value: stats.lowStock },
        { label: "Outstanding", value: `PKR ${stats.outstanding.toLocaleString()}` }
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
      <p className="text-gray-500 mb-6">Overview of hospital operations</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
        {!stats && <p className="text-gray-400 col-span-5">Loading stats...</p>}
      </div>

      {alerts.length > 0 && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Active Alerts ({alerts.length})</h2>
          </div>
          <div className="space-y-3">
            {alerts.map((a) => (
              <div key={a.id} className={`border rounded-lg p-3 flex items-center justify-between ${PRIORITY_STYLES[a.priority] || PRIORITY_STYLES.NORMAL}`}>
                <div>
                  <p className="font-semibold text-sm">{a.title}</p>
                  <p className="text-xs mt-1">
                    {a.department?.name && <span>{a.department.name} · </span>}
                    Raised by {a.raisedBy.name} · {new Date(a.createdAt).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => handleResolve(a.id)} className="btn-secondary text-xs whitespace-nowrap">Resolve</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {maintenanceRequests.length > 0 && (
        <div className="card mb-8 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">New Maintenance Reports ({maintenanceRequests.length})</h2>
            <a href="/admin/maintenance" className="text-sm text-brand-600 hover:underline">View all</a>
          </div>
          <div className="space-y-3">
            {maintenanceRequests.slice(0, 5).map((r) => (
              <div key={r.id} className={`border rounded-lg p-3 border-l-4 ${MAINTENANCE_PRIORITY_STYLES[r.priority] || MAINTENANCE_PRIORITY_STYLES.NORMAL}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{r.title}</p>
                    <p className="text-xs mt-1">
                      <span className="inline-block bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 mr-2">{r.category === "OTHER" ? r.customCategory || "Other" : r.category.replace(/_/g, " ")}</span>
                      {r.asset?.name || r.customLocation || "No location"} · Reported by {r.reportedBy.name}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${PRIORITY_STYLES[r.priority] || PRIORITY_STYLES.NORMAL}`}>{r.priority.replace(/_/g, " ")}</span>
                </div>
              </div>
            ))}
            {maintenanceRequests.length > 5 && (
              <p className="text-xs text-gray-400 text-center">+ {maintenanceRequests.length - 5} more reports</p>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-4">Revenue - Last 14 Days</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={stats?.revenueByDay || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <a href="/admin/users" className="card hover:shadow-md transition block">
          <p className="font-semibold">Manage Users & Staff</p>
          <p className="text-sm text-gray-500 mt-1">Add doctors, receptionists, lab & pharmacy staff</p>
        </a>
        <a href="/admin/reports" className="card hover:shadow-md transition block">
          <p className="font-semibold">View Reports</p>
          <p className="text-sm text-gray-500 mt-1">Billing, inventory & operational reports</p>
        </a>
      </div>
    </div>
  );
}
