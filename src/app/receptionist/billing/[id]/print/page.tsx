"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Invoice = {
  id: string;
  patient: { name: string; mrNumber: string };
  totalAmount: number;
  paidAmount: number;
  status: string;
  createdAt: string;
  sourceType?: string;
  sourceId?: string;
  items: { description: string; quantity: number; amount: number }[];
};

export default function PrintInvoicePage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetch(`/api/invoices?id=${id}`)
      .then(r => r.json())
      .then(setInvoice);
  }, [id]);

  if (!invoice) return <div className="py-8 text-center">Loading...</div>;

  const balanceDue = invoice.totalAmount - invoice.paidAmount;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <div className="w-full max-w-md border-2 border-gray-800 rounded-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">HMS</h1>
          <p className="text-gray-500">Hospital Management System</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-500">Invoice #</span>
            <span className="font-medium">{invoice.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Patient</span>
            <span className="font-medium">{invoice.patient.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">MR Number</span>
            <span>{invoice.patient.mrNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span>{new Date(invoice.createdAt).toLocaleString()}</span>
          </div>
          {invoice.sourceType && (
            <div className="flex justify-between">
              <span className="text-gray-500">Source</span>
              <span>{invoice.sourceType}</span>
            </div>
          )}
        </div>

        <h3 className="font-semibold mb-2">Items</h3>
        <table className="data-table w-full mb-6">
          <thead><tr><th>Description</th><th>Qty</th><th>Amount</th></tr></thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i}>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>PKR{(item.amount * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-gray-300 pt-4 space-y-2">
          <div className="flex justify-between">
            <span>Total</span>
            <span className="font-bold">PKR{invoice.totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid</span>
            <span className="font-bold text-green-600">PKR{invoice.paidAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Balance Due</span>
            <span className={`font-bold ${balanceDue > 0 ? "text-red-600" : "text-green-600"}`}>
              PKR{balanceDue.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-semibold">Status</span>
            <span className={`text-xs px-2 py-1 rounded-full ${invoice.status === "PAID" ? "bg-green-50 text-green-600" : invoice.status === "PARTIAL" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
              {invoice.status}
            </span>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button onClick={() => window.print()} className="btn-primary">Print Invoice</button>
        </div>
      </div>
    </div>
  );
}