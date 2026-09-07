"use client";

import { useEffect, useState } from "react";

type Prescription = {
  id: string;
  dispensed: boolean;
  createdAt: string;
  diagnosis?: string;
  patient: { name: string; mrNumber: string };
  doctor: { name: string };
  items: { dosage: string; duration: string; quantity: number; medicine: { name: string; stock: number } }[];
};

export default function PharmacyPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [dispensingId, setDispensingId] = useState<string | null>(null);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Prescriptions to Dispense</h1>
          <p className="text-gray-500">Fulfil doctor prescriptions and deduct stock automatically</p>
        </div>
        <button onClick={() => setShowAll(!showAll)} className="btn-secondary">
          {showAll ? "Show Pending Only" : "Show All"}
        </button>
      </div>

      <div className="space-y-4">
        {prescriptions.map((p) => (
          <div key={p.id} className="card">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold">{p.patient.name} <span className="text-gray-400 font-normal">({p.patient.mrNumber})</span></p>
                <p className="text-sm text-gray-500">Dr. {p.doctor.name} · {new Date(p.createdAt).toLocaleDateString()} {p.diagnosis ? `· ${p.diagnosis}` : ""}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${p.dispensed ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                {p.dispensed ? "Dispensed" : "Pending"}
              </span>
            </div>

            <ul className="text-sm text-gray-600 space-y-1 mb-3">
              {p.items.map((it, idx) => (
                <li key={idx}>
                  {it.medicine.name} — {it.dosage}, {it.duration} × {it.quantity}
                  {it.medicine.stock < it.quantity && <span className="text-red-500 ml-2">(Insufficient stock: {it.medicine.stock} left)</span>}
                </li>
              ))}
            </ul>

            {!p.dispensed && (
              <button
                onClick={() => dispense(p.id)}
                disabled={dispensingId === p.id}
                className="btn-primary text-sm"
              >
                {dispensingId === p.id ? "Dispensing..." : "Dispense & Bill"}
              </button>
            )}
          </div>
        ))}
        {prescriptions.length === 0 && <p className="text-gray-400 text-center py-6">No prescriptions found</p>}
      </div>
    </div>
  );
}
