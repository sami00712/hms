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
  const [statusFilter, setStatusFilter] = useState("COMPLETED");

  useEffect(() => {
    fetch(`/api/lab-orders?status=${statusFilter}`)
      .then(r => r.json())
      .then(setOrders);
  }, [statusFilter]);

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

      <div className="card p-0 overflow-hidden">
        <table className="data-table w-full">
          <thead><tr><th>Patient</th><th>Test</th><th>Doctor</th><th>Result</th><th>Completed</th></tr></thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.patient.name} <span className="text-gray-400">({order.patient.mrNumber})</span></td>
                <td>{order.labTest.name}</td>
                <td>{order.doctor.name}</td>
                <td>{order.result || "—"}</td>
                <td>{order.completedAt ? new Date(order.completedAt).toLocaleString() : "—"}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 py-6">No lab orders found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}