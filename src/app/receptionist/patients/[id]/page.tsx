"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PatientDetailPage() {
  const params = useParams();
  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/patients/${params.id}`).then((r) => r.json()).then(setPatient);
  }, [params.id]);

  if (!patient) return <p className="text-gray-400">Loading...</p>;

  return (
    <div>
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{patient.name}</h1>
            <p className="text-gray-500 text-sm">{patient.mrNumber} · {patient.gender} · {patient.phone}</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100">{patient.bloodGroup || "Blood group N/A"}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Appointments</h2>
          <ul className="space-y-2">
            {patient.appointments.map((a: any) => (
              <li key={a.id} className="text-sm border-b pb-2">
                {new Date(a.date).toLocaleString()} — Dr. {a.doctor.name}{" "}
                <span className="text-gray-400">({a.status})</span>
              </li>
            ))}
            {patient.appointments.length === 0 && <p className="text-gray-400 text-sm">No appointments yet</p>}
          </ul>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Prescriptions</h2>
          <ul className="space-y-2">
            {patient.prescriptions.map((p: any) => (
              <li key={p.id} className="text-sm border-b pb-2">
                {new Date(p.createdAt).toLocaleDateString()} — Dr. {p.doctor.name}
                <div className="text-gray-500 text-xs mt-1">
                  {p.items.map((it: any) => it.medicine.name).join(", ")}
                </div>
              </li>
            ))}
            {patient.prescriptions.length === 0 && <p className="text-gray-400 text-sm">No prescriptions yet</p>}
          </ul>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Lab Orders</h2>
          <ul className="space-y-2">
            {patient.labOrders.map((l: any) => (
              <li key={l.id} className="text-sm border-b pb-2">
                {l.labTest.name} — <span className="text-gray-400">{l.status}</span>
                {l.result && <div className="text-gray-500 text-xs mt-1">Result: {l.result}</div>}
              </li>
            ))}
            {patient.labOrders.length === 0 && <p className="text-gray-400 text-sm">No lab orders yet</p>}
          </ul>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Invoices</h2>
          <ul className="space-y-2">
            {patient.invoices.map((inv: any) => (
              <li key={inv.id} className="text-sm border-b pb-2 flex justify-between">
                <span>{new Date(inv.createdAt).toLocaleDateString()}</span>
                <span>PKR {inv.totalAmount.toLocaleString()} — {inv.status}</span>
              </li>
            ))}
            {patient.invoices.length === 0 && <p className="text-gray-400 text-sm">No invoices yet</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
