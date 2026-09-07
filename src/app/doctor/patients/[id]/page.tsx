"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type Medicine = { id: string; name: string; unit: string };
type LabTest = { id: string; name: string; price: number };

export default function PatientChartPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId") || undefined;
  const opdVisitId = searchParams.get("opdVisitId") || undefined;

  const [patient, setPatient] = useState<any>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);

  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [rxItems, setRxItems] = useState([{ medicineId: "", dosage: "", duration: "", quantity: 1 }]);
  const [rxSaving, setRxSaving] = useState(false);
  const [rxSuccess, setRxSuccess] = useState(false);

  const [selectedLabTest, setSelectedLabTest] = useState("");
  const [labSaving, setLabSaving] = useState(false);
  const [labSuccess, setLabSuccess] = useState(false);

  function loadPatient() {
    fetch(`/api/patients/${params.id}`).then(r => r.json()).then(data => {
      if (data.error) {
        setPatient(null);
      } else {
        setPatient(data);
      }
    });
  }

  useEffect(() => {
    loadPatient();
    fetch("/api/medicines").then((r) => r.json()).then(setMedicines);
    fetch("/api/lab-tests").then((r) => r.json()).then(setLabTests);
  }, [params.id]);

  async function savePrescription(e: React.FormEvent) {
    e.preventDefault();
    setRxSaving(true);
    setRxSuccess(false);
    await fetch("/api/prescriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: params.id,
        appointmentId,
        diagnosis,
        notes,
        items: rxItems.filter((i) => i.medicineId)
      })
    });
    setRxSaving(false);
    setRxSuccess(true);
    setDiagnosis("");
    setNotes("");
    setRxItems([{ medicineId: "", dosage: "", duration: "", quantity: 1 }]);
    loadPatient();
  }

  async function orderLabTest(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLabTest) return;
    setLabSaving(true);
    setLabSuccess(false);
    await fetch("/api/lab-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: params.id, labTestId: selectedLabTest })
    });
    setLabSaving(false);
    setLabSuccess(true);
    setSelectedLabTest("");
    loadPatient();
  }

  if (!patient) return <p className="text-red-500">Access denied. You can only view patients assigned to you for OPD consultation.</p>;

  return (
    <div>
      <div className="card mb-6">
        <h1 className="text-xl font-bold">{patient.name}</h1>
        <p className="text-gray-500 text-sm">{patient.mrNumber} · {patient.gender} · {patient.phone}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Write Prescription</h2>
          <form onSubmit={savePrescription} className="space-y-3">
            {rxSuccess && <div className="bg-green-50 text-green-600 text-sm px-3 py-2 rounded-lg">Prescription saved</div>}
            <div>
              <label className="text-sm font-medium">Diagnosis</label>
              <input className="input mt-1" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
            </div>

            {rxItems.map((it, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2">
                <select
                  className="input col-span-2"
                  value={it.medicineId}
                  onChange={(e) => {
                    const next = [...rxItems];
                    next[idx].medicineId = e.target.value;
                    setRxItems(next);
                  }}
                >
                  <option value="">Medicine</option>
                  {medicines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <input
                  className="input"
                  placeholder="Dosage"
                  value={it.dosage}
                  onChange={(e) => { const next = [...rxItems]; next[idx].dosage = e.target.value; setRxItems(next); }}
                />
                <input
                  className="input"
                  placeholder="Duration"
                  value={it.duration}
                  onChange={(e) => { const next = [...rxItems]; next[idx].duration = e.target.value; setRxItems(next); }}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRxItems([...rxItems, { medicineId: "", dosage: "", duration: "", quantity: 1 }])}
              className="text-brand-600 text-sm hover:underline"
            >
              + Add medicine
            </button>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea className="input mt-1" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <button disabled={rxSaving} className="btn-primary">{rxSaving ? "Saving..." : "Save Prescription"}</button>
          </form>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Order Lab Test</h2>
          <form onSubmit={orderLabTest} className="space-y-3">
            {labSuccess && <div className="bg-green-50 text-green-600 text-sm px-3 py-2 rounded-lg">Lab test ordered</div>}
            <select className="input" value={selectedLabTest} onChange={(e) => setSelectedLabTest(e.target.value)}>
              <option value="">Select test</option>
              {labTests.map((t) => <option key={t.id} value={t.id}>{t.name} — PKR {t.price}</option>)}
            </select>
            <button disabled={labSaving || !selectedLabTest} className="btn-primary">{labSaving ? "Ordering..." : "Order Test"}</button>
          </form>

          <h3 className="font-semibold mt-6 mb-2 text-sm">Previous Lab Orders</h3>
          <ul className="space-y-2">
            {patient.labOrders?.map((l: any) => (
              <li key={l.id} className="text-sm border-b pb-2">
                {l.labTest.name} — <span className="text-gray-400">{l.status}</span>
                {l.result && <div className="text-gray-500 text-xs mt-1">Result: {l.result}</div>}
              </li>
            ))}
            {(patient.labOrders?.length ?? 0) === 0 && <p className="text-gray-400 text-sm">None yet</p>}
          </ul>
        </div>

        <div className="card md:col-span-2">
          <h2 className="font-semibold mb-3">Prescription History</h2>
          <ul className="space-y-2">
            {patient.prescriptions?.map((p: any) => (
              <li key={p.id} className="text-sm border-b pb-2">
                <span className="text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</span> — {p.diagnosis || "No diagnosis noted"}
                <div className="text-gray-500 text-xs mt-1">
                  {p.items?.map((it: any) => `${it.medicine?.name} (${it.dosage})`).join(", ")}
                </div>
              </li>
            ))}
            {(patient.prescriptions?.length ?? 0) === 0 && <p className="text-gray-400 text-sm">No prescriptions yet</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
