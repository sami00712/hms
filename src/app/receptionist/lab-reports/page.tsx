"use client";

import { useEffect, useState } from "react";

type LabOrder = {
  id: string;
  patient: { name: string; mrNumber: string };
  doctor: { name: string };
  labTest: { name: string; price: number };
  status: string;
  result: string | null;
  orderedAt: string;
  completedAt: string | null;
};

export default function LabReportsPage() {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<LabOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState("COMPLETED");
  const [dateFilter, setDateFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/lab-orders?status=${statusFilter}`)
      .then(r => r.json())
      .then(data => {
        setOrders(data);
        applyFilters(data, dateFilter, search);
      });
  }, [statusFilter]);

  useEffect(() => {
    applyFilters(orders, dateFilter, search);
  }, [dateFilter, search]);

  function applyFilters(data: LabOrder[], date: string, query: string) {
    let result = [...data];

    if (date !== "all") {
      const now = new Date();
      let start: Date;
      let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      switch (date) {
        case "today":
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "yesterday":
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
          break;
        case "last7":
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
          break;
        case "thisMonth":
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "lastMonth":
          start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          break;
        default:
          start = new Date(0);
      }

      result = result.filter(o => {
        const d = new Date(o.completedAt || o.orderedAt);
        return d >= start && d <= end;
      });
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(o =>
        o.patient.name.toLowerCase().includes(q) ||
        o.patient.mrNumber.toLowerCase().includes(q) ||
        o.labTest.name.toLowerCase().includes(q) ||
        o.doctor.name.toLowerCase().includes(q) ||
        (o.result && o.result.toLowerCase().includes(q))
      );
    }

    setFilteredOrders(result);
  }

  function setQuickDate(d: string) {
    setDateFilter(d);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lab Reports</h1>
          <p className="text-gray-500">View completed lab test results</p>
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="COMPLETED">Completed</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="PENDING">Pending</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setQuickDate("today")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${dateFilter === "today" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          Today
        </button>
        <button onClick={() => setQuickDate("yesterday")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${dateFilter === "yesterday" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          Yesterday
        </button>
        <button onClick={() => setQuickDate("last7")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${dateFilter === "last7" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          Last 7 Days
        </button>
        <button onClick={() => setQuickDate("thisMonth")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${dateFilter === "thisMonth" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          This Month
        </button>
        <button onClick={() => setQuickDate("lastMonth")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${dateFilter === "lastMonth" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          Last Month
        </button>
        <button onClick={() => setQuickDate("all")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${dateFilter === "all" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          All
        </button>
      </div>

      <div className="mb-4">
        <input
          className="input"
          placeholder="Search by patient name, MR#, test, doctor, or result..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="data-table w-full">
          <thead><tr><th>Patient</th><th>Test</th><th>Doctor</th><th>Result</th><th>Date</th></tr></thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td>{order.patient.name} <span className="text-gray-400">({order.patient.mrNumber})</span></td>
                <td>{order.labTest.name}</td>
                <td>Dr. {order.doctor.name}</td>
                <td>{order.result || "—"}</td>
                <td>{order.completedAt ? new Date(order.completedAt).toLocaleString() : order.orderedAt ? new Date(order.orderedAt).toLocaleString() : "—"}</td>
              </tr>
            ))}
            {filteredOrders.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 py-6">No lab orders found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}