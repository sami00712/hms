"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Stats = {
  patients: number;
  doctors: number;
  todayAppointments: number;
  outstanding: number;
  pendingLab: number;
  revenueByDay: { date: string; amount: number }[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard-stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  const cards = stats
    ? [
        { label: "Total Patients", value: stats.patients },
        { label: "Doctors on Staff", value: stats.doctors },
        { label: "Today's Appointments", value: stats.todayAppointments },
        { label: "Pending Lab Orders", value: stats.pendingLab },
        { label: "Outstanding Bills", value: `PKR ${stats.outstanding.toLocaleString()}` }
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
      <p className="text-gray-500 mb-6">Overview of hospital operations</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
        {!stats && <p className="text-gray-400 col-span-5">Loading stats...</p>}
      </div>

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
