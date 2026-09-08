"use client";

import { useEffect, useState } from "react";

type LabOrderWithInvoice = {
  id: string;
  status: string;
  orderedAt: string;
  patient: { id: string; name: string; mrNumber: string };
  doctor: { name: string };
  labTest: { name: string; price: number };
  invoice: {
    id: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
    items: { description: string; amount: number; quantity: number }[];
  } | null;
};

export default function LabBillingPage() {
  const [orders, setOrders] = useState<LabOrderWithInvoice[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [paidOrder, setPaidOrder] = useState<LabOrderWithInvoice | null>(null);

  function load() {
    fetch("/api/lab-orders?includeInvoice=true")
      .then(r => r.ok ? r.json() : [])
      .then(data => setOrders(data.filter((o: LabOrderWithInvoice) => o.invoice && o.invoice.status !== "PAID")))
      .catch(() => {});
  }
  useEffect(load, []);

  async function recordPayment(invoiceId: string, order: LabOrderWithInvoice) {
    if (!payAmount) return;
    await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paidAmount: Number(payAmount) })
    });
    setPayingId(null);
    setPayAmount("");
    setPaidOrder(order);
    load();
  }

  useEffect(() => {
    if (paidOrder) {
      const timer = setTimeout(() => {
        window.open(`/receptionist/lab-billing/${paidOrder.id}/print`, "_blank");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [paidOrder]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Lab Test Billing</h1>
        <p className="text-gray-500">Doctor-referred lab tests pending payment</p>
      </div>

      {paidOrder && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
          <span>Payment recorded for <strong>{paidOrder.patient.name}</strong> — Print slip opened in new tab.</span>
          <a href={`/receptionist/lab-billing/${paidOrder.id}/print`} target="_blank" className="underline font-medium ml-2 whitespace-nowrap">
            Open Slip
          </a>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr><th>Patient</th><th>Test</th><th>Doctor</th><th>Amount</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>{o.patient.name} <span className="text-gray-400">({o.patient.mrNumber})</span></td>
                <td>{o.labTest.name}</td>
                <td>Dr. {o.doctor.name}</td>
                <td>PKR {o.invoice?.totalAmount.toLocaleString() || o.labTest.price.toLocaleString()}</td>
                <td>
                  <span className={`text-xs px-2 py-1 rounded-full ${o.invoice?.status === "PAID" ? "bg-green-50 text-green-600" : o.invoice?.status === "PARTIAL" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"}`}>
                    {o.invoice?.status || "UNPAID"}
                  </span>
                </td>
                <td>
                  {o.invoice && o.invoice.status !== "PAID" && (
                    payingId === o.invoice.id ? (
                      <div className="flex gap-1 items-center">
                        <input type="number" className="input w-24 py-1 text-sm" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                        <button onClick={() => recordPayment(o.invoice!.id, o)} className="text-brand-600 text-sm font-medium">Save</button>
                        <button onClick={() => { setPayingId(null); setPayAmount(""); }} className="text-gray-400 text-sm">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => { setPayingId(o.invoice!.id); setPayAmount(String(o.invoice!.totalAmount)); }} className="text-brand-600 text-sm hover:underline font-medium">
                        Record Payment
                      </button>
                    )
                  )}
                  {o.invoice?.status === "PAID" && (
                    <a href={`/receptionist/lab-billing/${o.id}/print`} target="_blank" className="text-brand-600 text-sm hover:underline font-medium">
                      Print Slip
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={6} className="text-center text-gray-400 py-6">No pending lab billings</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
