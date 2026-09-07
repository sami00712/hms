"use client";

import { useEffect, useState } from "react";

type Invoice = {
  id: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  createdAt: string;
  patient: { name: string; mrNumber: string };
  items: { description: string; amount: number; quantity: number }[];
};
type Patient = { id: string; name: string; mrNumber: string };

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientQuery, setPatientQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [items, setItems] = useState([{ description: "Consultation Fee", amount: 1000, quantity: 1 }]);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");

  function loadInvoices() {
    fetch("/api/invoices").then((r) => r.json()).then(setInvoices);
  }
  useEffect(loadInvoices, []);

  useEffect(() => {
    if (patientQuery.length < 2) return;
    const t = setTimeout(() => {
      fetch(`/api/patients?q=${encodeURIComponent(patientQuery)}`).then((r) => r.json()).then(setPatients);
    }, 300);
    return () => clearTimeout(t);
  }, [patientQuery]);

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatient) return;
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: selectedPatient.id, items })
    });
    setSelectedPatient(null);
    setPatientQuery("");
    setItems([{ description: "Consultation Fee", amount: 1000, quantity: 1 }]);
    loadInvoices();
  }

  async function recordPayment(id: string) {
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paidAmount: Number(payAmount) })
    });
    setPayingId(null);
    setPayAmount("");
    loadInvoices();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Billing</h1>
      <p className="text-gray-500 mb-6">Create invoices and record patient payments</p>

      <form onSubmit={createInvoice} className="card mb-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Patient</label>
          <input
            className="input mt-1"
            placeholder="Search patient..."
            value={patientQuery}
            onChange={(e) => setPatientQuery(e.target.value)}
          />
          {patients.length > 0 && !selectedPatient && (
            <div className="border rounded-lg mt-1 max-h-40 overflow-y-auto">
              {patients.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => { setSelectedPatient(p); setPatientQuery(`${p.name} (${p.mrNumber})`); setPatients([]); }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                >
                  {p.name} — {p.mrNumber}
                </button>
              ))}
            </div>
          )}
        </div>

        {items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-3">
            <input
              className="input"
              placeholder="Description"
              value={it.description}
              onChange={(e) => {
                const next = [...items];
                next[idx].description = e.target.value;
                setItems(next);
              }}
            />
            <input
              type="number"
              className="input"
              placeholder="Amount"
              value={it.amount}
              onChange={(e) => {
                const next = [...items];
                next[idx].amount = Number(e.target.value);
                setItems(next);
              }}
            />
            <input
              type="number"
              className="input"
              placeholder="Qty"
              value={it.quantity}
              onChange={(e) => {
                const next = [...items];
                next[idx].quantity = Number(e.target.value);
                setItems(next);
              }}
            />
          </div>
        ))}
        <button type="button" onClick={() => setItems([...items, { description: "", amount: 0, quantity: 1 }])} className="text-brand-600 text-sm hover:underline">
          + Add line item
        </button>

        <div>
          <button disabled={!selectedPatient} className="btn-primary">Create Invoice</button>
        </div>
      </form>

      <div className="card p-0 overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr><th>Patient</th><th>Total</th><th>Paid</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.patient.name} <span className="text-gray-400">({inv.patient.mrNumber})</span></td>
                <td>PKR {inv.totalAmount.toLocaleString()}</td>
                <td>PKR {inv.paidAmount.toLocaleString()}</td>
                <td>
                  <span className={`text-xs px-2 py-1 rounded-full ${inv.status === "PAID" ? "bg-green-50 text-green-600" : inv.status === "PARTIAL" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"}`}>
                    {inv.status}
                  </span>
                </td>
                <td>
                  {inv.status !== "PAID" && (
                    payingId === inv.id ? (
                      <div className="flex gap-1">
                        <input className="input w-24 py-1" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                        <button onClick={() => recordPayment(inv.id)} className="text-brand-600 text-sm">Save</button>
                      </div>
                    ) : (
                      <button onClick={() => { setPayingId(inv.id); setPayAmount(String(inv.totalAmount)); }} className="text-brand-600 text-sm hover:underline">
                        Record Payment
                      </button>
                    )
                  )}
                  <a href={`/receptionist/billing/${inv.id}/print`} target="_blank" className="text-brand-600 text-sm hover:underline ml-2">Print</a>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 py-6">No invoices yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
