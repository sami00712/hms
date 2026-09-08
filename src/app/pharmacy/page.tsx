"use client";

import { useEffect, useState } from "react";

type Prescription = {
  id: string;
  dispensed: boolean;
  dispensedAt?: string;
  createdAt: string;
  diagnosis?: string;
  notes?: string;
  patient: { name: string; mrNumber: string; phone: string };
  doctor: { name: string; specialty?: string };
  items: { dosage: string; duration: string; quantity: number; medicine: { name: string; stock: number; unitPrice: number } }[];
};

export default function PharmacyPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [dispensingId, setDispensingId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("today");

  function loadPrescriptions() {
    fetch(`/api/prescriptions${showAll ? "" : "?pending=true"}`).then((r) => r.json()).then(setPrescriptions);
  }
  useEffect(loadPrescriptions, [showAll]);

  async function dispense(id: string) {
    setDispensingId(id);
    const res = await fetch(`/api/prescriptions/${id}/dispense`, { method: "POST" });
    setDispensingId(null);
    if (res.ok) loadPrescriptions();
  }

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

  const filteredPrescriptions = prescriptions.filter(p => {
    if (dateFilter === "all") return true;
    const dateToCheck = p.dispensed ? p.dispensedAt : p.createdAt;
    return isDateMatch(dateToCheck || p.createdAt, dateFilter);
  });

  const pendingCount = prescriptions.filter(p => !p.dispensed).length;
  const todayDispensed = prescriptions.filter(p => p.dispensed && p.dispensedAt && isToday(p.dispensedAt)).length;
  const pendingBill = prescriptions
    .filter(p => !p.dispensed)
    .reduce((sum, p) => sum + p.items.reduce((s, it) => s + (it.medicine.unitPrice * it.quantity), 0), 0);
  const todayEarnings = prescriptions
    .filter(p => p.dispensed && p.dispensedAt && isToday(p.dispensedAt))
    .reduce((sum, p) => sum + p.items.reduce((s, it) => s + (it.medicine.unitPrice * it.quantity), 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>
          <p className="text-gray-500">Doctor prescriptions — dispense medicines and billing</p>
        </div>
        <button onClick={() => setShowAll(!showAll)} className="btn-secondary">
          {showAll ? "Show Pending Only" : "Show All"}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Dispensed Today</p>
          <p className="text-2xl font-bold text-green-600">{todayDispensed}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Today's Earnings</p>
          <p className="text-2xl font-bold">PKR {todayEarnings.toLocaleString()}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Pending Bill</p>
          <p className="text-2xl font-bold text-red-600">PKR {pendingBill.toLocaleString()}</p>
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
        {filteredPrescriptions.map((p) => {
          const billAmount = p.items.reduce((sum, it) => sum + (it.medicine.unitPrice * it.quantity), 0);
          return (
            <div key={p.id} className={`card ${!p.dispensed ? "border-l-4 border-l-amber-400" : "border-l-4 border-l-green-400"}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-lg">{p.patient.name} <span className="text-gray-400 font-normal text-sm">({p.patient.mrNumber})</span></p>
                  <p className="text-sm text-gray-500">Phone: {p.patient.phone}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${p.dispensed ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                    {p.dispensed ? "DISPENSED" : "PENDING"}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{new Date(p.createdAt).toLocaleString()}</p>
                  {p.dispensedAt && <p className="text-xs text-green-500 mt-0.5">Dispensed: {new Date(p.dispensedAt).toLocaleString()}</p>}
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-3">
                <span>Dr. {p.doctor.name}</span>
                {p.doctor.specialty && <span className="text-gray-400"> — {p.doctor.specialty}</span>}
                {p.diagnosis && <span className="ml-2">· Diagnosis: <strong>{p.diagnosis}</strong></span>}
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500">
                      <th className="text-left pb-1">Medicine</th>
                      <th className="text-left pb-1">Dosage Instructions</th>
                      <th className="text-center pb-1">Qty</th>
                      <th className="text-right pb-1">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.items.map((it, idx) => (
                      <tr key={idx} className="border-t border-gray-200">
                        <td className="py-1.5 font-medium">{it.medicine.name}</td>
                        <td className="py-1.5 text-gray-600">{it.dosage}</td>
                        <td className="py-1.5 text-center">{it.quantity}</td>
                        <td className="py-1.5 text-right">
                          PKR {(it.medicine.unitPrice * it.quantity).toLocaleString()}
                          {it.medicine.stock < it.quantity && <span className="text-red-500 text-xs ml-1">(Low)</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {p.notes && <p className="text-xs text-gray-500 mb-3">Notes: {p.notes}</p>}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-800">Bill: PKR {billAmount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Patient will pay at pharmacy counter</p>
                </div>
                {!p.dispensed && (
                  <button
                    onClick={() => dispense(p.id)}
                    disabled={dispensingId === p.id || p.items.some(it => it.medicine.stock < it.quantity)}
                    className={`text-sm font-medium px-5 py-2.5 rounded-lg transition ${
                      p.items.some(it => it.medicine.stock < it.quantity)
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {dispensingId === p.id ? "Dispensing..." : "Dispense & Print Bill"}
                  </button>
                )}
                {p.dispensed && (
                  <span className="text-green-600 text-sm font-medium">✓ Medicines given</span>
                )}
              </div>
            </div>
          );
        })}
        {filteredPrescriptions.length === 0 && <p className="text-gray-400 text-center py-6">No prescriptions found</p>}
      </div>
    </div>
  );
}
