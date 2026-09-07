"use client";

import { useEffect, useState } from "react";

type LabOrder = {
  id: string;
  status: string;
  result?: string;
  orderedAt: string;
  patient: { name: string; mrNumber: string };
  doctor: { name: string };
  labTest: { name: string; price: number };
};

export default function LabPage() {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [resultDraft, setResultDraft] = useState<Record<string, string>>({});

  function loadOrders() {
    fetch(`/api/lab-orders${showAll ? "" : "?pending=true"}`).then((r) => r.json()).then(setOrders);
  }

  useEffect(loadOrders, [showAll]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/lab-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    loadOrders();
  }

  async function submitResult(id: string) {
    await fetch(`/api/lab-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED", result: resultDraft[id] || "" })
    });
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

      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="card">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold">{o.labTest.name}</p>
                <p className="text-sm text-gray-500">
                  {o.patient.name} ({o.patient.mrNumber}) · Ordered by Dr. {o.doctor.name}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  o.status === "COMPLETED"
                    ? "bg-green-50 text-green-600"
                    : o.status === "IN_PROGRESS"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {o.status}
              </span>
            </div>

            {o.status === "PENDING" && (
              <button onClick={() => updateStatus(o.id, "IN_PROGRESS")} className="btn-secondary text-sm">
                Start Processing
              </button>
            )}

            {o.status === "IN_PROGRESS" && (
              <div className="flex gap-2 mt-2">
                <input
                  className="input"
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
        ))}
        {orders.length === 0 && <p className="text-gray-400 text-center py-6">No lab orders found</p>}
      </div>
    </div>
  );
}
