"use client";

import { useEffect, useState } from "react";

type Invoice = {
  id: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  createdAt: string;
  patient: { name: string; mrNumber: string };
  sourceType?: string;
};

type Medicine = {
  id: string;
  name: string;
  stock: number;
  reorderLevel: number;
  unitPrice: number;
};

type Appointment = {
  id: string;
  date: string;
  status: string;
  patient: { id: string; name: string };
};

type Patient = {
  id: string;
  mrNumber: string;
};

type LabOrder = {
  id: string;
  status: string;
  patient: { name: string };
  doctor: { name: string };
  labTest: { name: string };
};

export default function ReportsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [tab, setTab] = useState<"overview" | "billing" | "inventory">("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/invoices").then(r => r.json()),
      fetch("/api/medicines").then(r => r.json()),
      fetch("/api/patients").then(r => r.json()),
      fetch("/api/lab-orders").then(r => r.json()),
    ]).then(([inv, med, pat, labs]) => {
      setInvoices(inv); setMedicines(med); setPatients(pat); setLabOrders(labs);
      setLoading(false);
    });
  }, []);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayInvoices = invoices.filter(i => i.createdAt.slice(0, 10) === todayStr);
  const todayRevenue = todayInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const todayBills = todayInvoices.length;
  const todayOutstanding = todayInvoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);

  const weekInvoices = invoices.filter(i => new Date(i.createdAt) >= weekStart && new Date(i.createdAt) < now);
  const weekRevenue = weekInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const weekBills = weekInvoices.length;

  const monthInvoices = invoices.filter(i => new Date(i.createdAt) >= monthStart && new Date(i.createdAt) < now);
  const monthRevenue = monthInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const monthBills = monthInvoices.length;
  const monthOutstanding = monthInvoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);

  const totalRevenue = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalOutstanding = invoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);
  const lowStockItems = medicines.filter(m => m.stock <= m.reorderLevel);
  const inventoryValue = medicines.reduce((s, m) => s + m.stock * m.unitPrice, 0);
  const pendingLabCount = labOrders.filter(l => l.status === "PENDING" || l.status === "IN_PROGRESS").length;
  const completedLabCount = labOrders.filter(l => l.status === "COMPLETED").length;

  const kpiCards = [
    { label: "Today's Revenue", value: `PKR ${todayRevenue.toLocaleString()}`, sub: `${todayBills} bills • Outstanding: PKR ${todayOutstanding.toLocaleString()}`, color: "from-green-400 to-green-600", bg: "bg-green-50", icon: "💰" },
    { label: "Week Revenue", value: `PKR ${weekRevenue.toLocaleString()}`, sub: `${weekBills} bills this week`, color: "from-blue-400 to-blue-600", bg: "bg-blue-50", icon: "📅" },
    { label: "Month Revenue", value: `PKR ${monthRevenue.toLocaleString()}`, sub: `${monthBills} bills • Outstanding: PKR ${monthOutstanding.toLocaleString()}`, color: "from-purple-400 to-purple-600", bg: "bg-purple-50", icon: "📊" },
    { label: "Total Collected", value: `PKR ${totalRevenue.toLocaleString()}`, sub: `${invoices.length} total invoices`, color: "from-brand-400 to-brand-600", bg: "bg-brand-50", icon: "🏦" },
  ];

  const secondaryCards = [
    { label: "Total Outstanding", value: `PKR ${totalOutstanding.toLocaleString()}`, sub: "Unpaid bills", color: "from-red-400 to-red-500", bg: "bg-red-50", icon: "⚠️" },
    { label: "Total Patients", value: `${patients.length}`, sub: "Registered", color: "from-teal-400 to-teal-600", bg: "bg-teal-50", icon: "👥" },
    { label: "Pending Labs", value: `${pendingLabCount}`, sub: `${completedLabCount} completed`, color: "from-amber-400 to-amber-600", bg: "bg-amber-50", icon: "🔬" },
    { label: "Low Stock", value: `${lowStockItems.length}`, sub: "Need reorder", color: "from-orange-400 to-orange-500", bg: "bg-orange-50", icon: "📦" },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400 text-lg">Loading reports...</div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">Reports & Dashboard</h1>
          <p className="text-gray-500 mt-1">Business metrics and financial overview</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab("overview")} className={tab === "overview" ? "btn-primary" : "btn-secondary"}>Overview</button>
          <button onClick={() => setTab("billing")} className={tab === "billing" ? "btn-primary" : "btn-secondary"}>Billing</button>
          <button onClick={() => setTab("inventory")} className={tab === "inventory" ? "btn-primary" : "btn-secondary"}>Inventory</button>
        </div>
      </div>

      {tab === "overview" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {kpiCards.map((card, i) => (
              <div key={i} className={`${card.bg} rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{card.icon}</span>
                  <span className={`text-2xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>{card.value}</span>
                </div>
                <p className="text-sm font-semibold text-gray-700">{card.label}</p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Secondary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {secondaryCards.map((card, i) => (
              <div key={i} className={`${card.bg} rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{card.icon}</span>
                  <span className={`text-2xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>{card.value}</span>
                </div>
                <p className="text-sm font-semibold text-gray-700">{card.label}</p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-4">📈 Revenue Trend</h3>
              <div className="space-y-4">
                {[
                  { label: "Today", amount: todayRevenue, max: monthRevenue, pct: monthRevenue > 0 ? Math.min((todayRevenue / (monthRevenue / 30)) * 100, 100) : 0, color: "bg-green-500" },
                  { label: "This Week", amount: weekRevenue, max: monthRevenue, pct: monthRevenue > 0 ? Math.min((weekRevenue / monthRevenue) * 100, 100) : 0, color: "bg-blue-500" },
                  { label: "This Month", amount: monthRevenue, max: monthRevenue, pct: 100, color: "bg-brand-500" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-bold">PKR {item.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div className={`${item.color} h-3 rounded-full transition-all duration-700 ease-out`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-4">📋 Recent Invoices</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {invoices.slice(0, 8).map(inv => (
                  <div key={inv.id} className="flex justify-between items-center text-sm p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-700">{inv.patient.name}</p>
                      <p className="text-xs text-gray-400">{inv.sourceType || "Manual"} • {new Date(inv.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">PKR {inv.paidAmount.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${inv.status === "PAID" ? "bg-green-100 text-green-600" : inv.status === "PARTIAL" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
                {invoices.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No invoices yet</p>}
              </div>
            </div>
          </div>

          {/* Today Summary Strip */}
          <div className="card p-6 bg-gradient-to-r from-brand-500 to-brand-700 text-white">
            <h3 className="font-semibold text-lg mb-4">📆 Today's Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-3xl font-bold">{todayBills}</p>
                <p className="text-sm opacity-80">Bills</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-3xl font-bold">PKR {todayRevenue.toLocaleString()}</p>
                <p className="text-sm opacity-80">Collected</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-3xl font-bold">PKR {todayOutstanding.toLocaleString()}</p>
                <p className="text-sm opacity-80">Outstanding</p>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "billing" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Collected", value: `PKR ${totalRevenue.toLocaleString()}`, color: "text-green-600", icon: "✅" },
              { label: "Outstanding", value: `PKR ${totalOutstanding.toLocaleString()}`, color: "text-red-500", icon: "⚠️" },
              { label: "Today's Revenue", value: `PKR ${todayRevenue.toLocaleString()}`, color: "text-blue-600", icon: "📊" },
              { label: "Total Bills", value: `${invoices.length}`, color: "text-purple-600", icon: "📄" },
            ].map((card, i) => (
              <div key={i} className="card p-5 border-l-4 border-brand-500">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{card.icon}</span>
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="data-table w-full">
              <thead><tr><th>Patient</th><th>Total</th><th>Paid</th><th>Status</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="font-medium">{inv.patient.name} <span className="text-gray-400 text-sm">({inv.patient.mrNumber})</span></td>
                    <td>PKR {inv.totalAmount.toLocaleString()}</td>
                    <td>PKR {inv.paidAmount.toLocaleString()}</td>
                    <td>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${inv.status === "PAID" ? "bg-green-100 text-green-600" : inv.status === "PARTIAL" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="text-sm text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td><a href={`/receptionist/billing/${inv.id}/print`} target="_blank" className="text-brand-600 text-sm hover:underline font-medium">Print</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "inventory" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Inventory Value", value: `PKR ${inventoryValue.toLocaleString()}`, color: "text-brand-600", icon: "🏪" },
              { label: "Low Stock Items", value: `${lowStockItems.length}`, color: "text-red-500", icon: "🔴" },
              { label: "Total Medicines", value: `${medicines.length}`, color: "text-green-600", icon: "💊" },
              { label: "Pending Labs", value: `${pendingLabCount}`, color: "text-amber-600", icon: "🔬" },
            ].map((card, i) => (
              <div key={i} className="card p-5 border-l-4 border-brand-500">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{card.icon}</span>
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="data-table w-full">
              <thead><tr><th>Medicine</th><th>Stock</th><th>Reorder Level</th><th>Unit Price</th><th>Status</th></tr></thead>
              <tbody>
                {medicines.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="font-medium">{m.name}</td>
                    <td>{m.stock}</td>
                    <td>{m.reorderLevel}</td>
                    <td>PKR {m.unitPrice}</td>
                    <td>
                      {m.stock <= m.reorderLevel ? (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-600">Low Stock</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-600">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}