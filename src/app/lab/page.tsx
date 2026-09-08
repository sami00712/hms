"use client";

import { useEffect, useState } from "react";

type LabOrder = {
  id: string;
  status: string;
  result?: string;
  orderedAt: string;
  completedAt?: string;
  patient: { name: string; mrNumber: string };
  doctor: { name: string };
  labTest: { name: string; price: number };
  invoice: { status: string; totalAmount: number; paidAmount: number } | null;
};

export default function LabPage() {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [resultDraft, setResultDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<Record<string, string>>({});
  const [dateFilter, setDateFilter] = useState("all");

  function loadOrders() {
    fetch(`/api/lab-orders?includeInvoice=true${showAll ? "" : "&pending=true"}`)
      .then((r) => r.json())
      .then(setOrders);
  }

  useEffect(loadOrders, [showAll]);

  function isToday(d: string): boolean {
    const date = new Date(d);
    const now = new Date();
    return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  function isDateMatch(d: string, filter: string): boolean {
    const date = new Date(d);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (filter) {
      case "today": return date >= startOfDay;
      case "yesterday": return date >= startOfYesterday && date <= endOfYesterday;
      case "week": return date >= startOfWeek;
      case "month": return date >= startOfMonth;
      default: return true;
    }
  }

  const filteredOrders = orders.filter(o => {
    if (dateFilter === "all") return true;
    return isDateMatch(o.orderedAt, dateFilter);
  });

  const todayOrders = orders.filter(o => isToday(o.orderedAt));
  const todayCompleted = todayOrders.filter(o => o.status === "COMPLETED").length;
  const todayPending = todayOrders.filter(o => o.status === "PENDING").length;
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.invoice?.totalAmount || 0), 0);

  async function updateStatus(id: string, status: string) {
    setError({});
    const res = await fetch(`/api/lab-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const data = await res.json();
      setError(prev => ({ ...prev, [id]: data.error || "Failed" }));
      return;
    }
    loadOrders();
  }

  async function submitResult(id: string) {
    setError({});
    const res = await fetch(`/api/lab-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED", result: resultDraft[id] || "" })
    });
    if (!res.ok) {
      const data = await res.json();
      setError(prev => ({ ...prev, [id]: data.error || "Failed" }));
      return;
    }
    loadOrders();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lab Orders</h1>
          <p className="text-gray-500">Process pending tests and record results</p>
        </div>
        <button onClick={() => setShowAll(!showAll)} className="btn-secondary">
          {showAll ? "Show Pending Only" : "Show All"}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Today's Orders</p>
          <p className="text-2xl font-bold">{todayOrders.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{todayPending}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Completed Today</p>
          <p className="text-2xl font-bold text-green-600">{todayCompleted}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Today's Revenue</p>
          <p className="text-2xl font-bold">PKR {todayRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {["today", "yesterday", "week", "month", "all"].map(f => (
          <button key={f} onClick={() => setDateFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${dateFilter === f ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {f === "today" ? "Today" : f === "yesterday" ? "Yesterday" : f === "week" ? "This Week" : f === "month" ? "This Month" : "All"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredOrders.map((o) => {
          const isPaid = o.invoice?.status === "PAID";
          return (
            <div key={o.id} className={`card ${!isPaid && o.status !== "COMPLETED" ? "border-l-4 border-l-red-400" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{o.labTest.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPaid ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                      {isPaid ? "PAID" : "UNPAID"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {o.patient.name} ({o.patient.mrNumber}) · Ordered by Dr. {o.doctor.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Ordered: {new Date(o.orderedAt).toLocaleString()}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  o.status === "COMPLETED" ? "bg-green-50 text-green-600" :
                  o.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-600" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {o.status.replace(/_/g, " ")}
                </span>
              </div>

              {error[o.id] && (
                <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-2">{error[o.id]}</div>
              )}

              {o.status === "PENDING" && (
                <button
                  onClick={() => updateStatus(o.id, "IN_PROGRESS")}
                  disabled={!isPaid}
                  className={`text-sm font-medium px-4 py-2 rounded-lg transition ${isPaid ? "btn-secondary" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                  title={isPaid ? "Start processing" : "Payment required — direct patient to Reception"}
                >
                  Start Processing
                </button>
              )}

              {o.status === "IN_PROGRESS" && (
                <div className="flex gap-2 mt-2">
                  <input
                    className="input flex-1"
                    placeholder="Enter result summary..."
                    value={resultDraft[o.id] ?? o.result ?? ""}
                    onChange={(e) => setResultDraft({ ...resultDraft, [o.id]: e.target.value })}
                  />
                  <button onClick={() => submitResult(o.id)} className="btn-primary text-sm whitespace-nowrap">
                    Submit Result
                  </button>
                </div>
              )}

              {o.status === "COMPLETED" && o.result && (
                <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">Result: {o.result}</p>
              )}
            </div>
          );
        })}
        {filteredOrders.length === 0 && <p className="text-gray-400 text-center py-6">No lab orders found</p>}
      </div>
    </div>
  );
}
