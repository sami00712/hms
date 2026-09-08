"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type LabOrderData = {
  id: string;
  orderedAt: string;
  status: string;
  patient: { name: string; mrNumber: string; phone: string };
  doctor: { name: string };
  labTest: { name: string; price: number };
  invoice: { status: string; paidAmount: number; totalAmount: number } | null;
};

export default function LabSlipPrintPage() {
  const { labOrderId } = useParams();
  const [order, setOrder] = useState<LabOrderData | null>(null);

  useEffect(() => {
    fetch(`/api/lab-orders?includeInvoice=true`)
      .then(r => r.json())
      .then(data => {
        const found = data.find((o: LabOrderData) => o.id === labOrderId);
        if (found) {
          setOrder(found);
          setTimeout(() => window.print(), 400);
        }
      });
  }, [labOrderId]);

  if (!order) return <div className="py-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <div className="w-full max-w-sm border-2 border-gray-800 rounded-lg p-6">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold">HMS</h1>
          <p className="text-xs text-gray-500">Hospital Management System</p>
        </div>

        <div className="text-center mb-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold border-t border-b border-gray-300 py-1">Lab Test Slip</p>
        </div>

        <div className="space-y-2 border-b border-gray-300 pb-3 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Patient</span>
            <span className="font-medium">{order.patient.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">MR #</span>
            <span>{order.patient.mrNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Phone</span>
            <span>{order.patient.phone}</span>
          </div>
        </div>

        <div className="space-y-2 border-b border-gray-300 pb-3 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Test Name</span>
            <span className="font-semibold">{order.labTest.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Referring Doctor</span>
            <span className="font-medium">Dr. {order.doctor.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date</span>
            <span>{new Date(order.orderedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Time</span>
            <span>{new Date(order.orderedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Amount</span>
            <span className="font-bold">PKR {order.invoice?.totalAmount.toLocaleString() || order.labTest.price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Paid Amount</span>
            <span className="font-bold text-green-600">PKR {order.invoice?.paidAmount.toLocaleString() || 0}</span>
          </div>
          {order.invoice && order.invoice.totalAmount > order.invoice.paidAmount && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Balance Due</span>
              <span className="font-bold text-red-600">PKR {(order.invoice.totalAmount - order.invoice.paidAmount).toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="text-center mb-4">
          <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${order.invoice?.status === "PAID" ? "bg-green-100 text-green-700 border border-green-300" : "bg-red-100 text-red-700 border border-red-300"}`}>
            {order.invoice?.status === "PAID" ? "PAID" : order.invoice?.status === "PARTIAL" ? "PARTIAL" : "UNPAID"}
          </span>
        </div>

        <p className="text-center text-xs text-gray-500 border-t pt-3">
          Please bring this slip to the Laboratory
        </p>

        <div className="mt-4 text-center no-print">
          <button onClick={() => window.print()} className="btn-primary">Print Slip</button>
        </div>
      </div>
    </div>
  );
}
