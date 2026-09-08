"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type Medicine = { id: string; name: string; unit: string; unitPrice: number };
type LabTest = { id: string; name: string; price: number };

type RxItem = {
  medicineId: string;
  dosage: string;
  timing: string;
  food: string;
  duration: string;
  quantity: number;
};

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
  const [rxItems, setRxItems] = useState<RxItem[]>([
    { medicineId: "", dosage: "1", timing: "Morning", food: "After Food", duration: "7 days", quantity: 1 }
  ]);
  const [rxSaving, setRxSaving] = useState(false);
  const [rxSuccess, setRxSuccess] = useState(false);
  const [lastPrescriptionId, setLastPrescriptionId] = useState<string | null>(null);
  const [medicineSearch, setMedicineSearch] = useState<Record<number, string>>({});
  const [openMedicineIdx, setOpenMedicineIdx] = useState<number | null>(null);

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
    fetch("/api/lab-tests?active=true").then((r) => r.json()).then(setLabTests);
  }, [params.id]);

  function buildDosageString(item: RxItem): string {
    const parts: string[] = [];
    parts.push(`${item.dosage} tablet`);
    if (item.timing) parts.push(item.timing);
    if (item.food) parts.push(item.food);
    if (item.duration) parts.push(`for ${item.duration}`);
    return parts.join(", ");
  }

  async function savePrescription(e: React.FormEvent) {
    e.preventDefault();
    setRxSaving(true);
    setRxSuccess(false);
    setLastPrescriptionId(null);
    const res = await fetch("/api/prescriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: params.id,
        appointmentId,
        diagnosis,
        notes,
        items: rxItems.filter((i) => i.medicineId).map((i) => ({
          medicineId: i.medicineId,
          dosage: buildDosageString(i),
          duration: i.duration,
          quantity: i.quantity
        }))
      })
    });
    const data = await res.json();
    setRxSaving(false);
    setRxSuccess(true);
    setLastPrescriptionId(data.id);
    setDiagnosis("");
    setNotes("");
    setRxItems([{ medicineId: "", dosage: "1", timing: "Morning", food: "After Food", duration: "7 days", quantity: 1 }]);
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

  function updateRxItem(idx: number, field: keyof RxItem, value: string | number) {
    const next = [...rxItems];
    (next[idx] as any)[field] = value;
    setRxItems(next);
  }

  function addRxItem() {
    setRxItems([...rxItems, { medicineId: "", dosage: "1", timing: "Morning", food: "After Food", duration: "7 days", quantity: 1 }]);
  }

  function removeRxItem(idx: number) {
    setRxItems(rxItems.filter((_, i) => i !== idx));
  }

  function getFilteredMedicines(idx: number) {
    const q = (medicineSearch[idx] || "").toLowerCase();
    if (!q) return medicines.slice(0, 20);
    return medicines.filter(m => m.name.toLowerCase().includes(q)).slice(0, 20);
  }

  function selectMedicine(idx: number, medicineId: string, medicineName: string) {
    updateRxItem(idx, "medicineId", medicineId);
    setMedicineSearch({ ...medicineSearch, [idx]: medicineName });
    setOpenMedicineIdx(null);
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
            {rxSuccess && (
              <div className="bg-green-50 text-green-600 text-sm px-3 py-2 rounded-lg flex items-center justify-between">
                <span>Prescription saved!</span>
                {lastPrescriptionId && (
                  <a href={`/doctor/patients/${params.id}/prescription/${lastPrescriptionId}/print`} target="_blank" className="underline font-medium">
                    Print Prescription
                  </a>
                )}
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Diagnosis</label>
              <input className="input mt-1" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
            </div>

            {rxItems.map((it, idx) => (
              <div key={idx} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Medicine {idx + 1}</span>
                  {rxItems.length > 1 && (
                    <button type="button" onClick={() => removeRxItem(idx)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                  )}
                </div>
                <div className="relative">
                  <label className="text-xs text-gray-500">Medicine</label>
                  <input
                    className="input text-sm mt-1"
                    placeholder="Search medicine..."
                    value={medicineSearch[idx] !== undefined ? medicineSearch[idx] : (it.medicineId ? medicines.find(m => m.id === it.medicineId)?.name || "" : "")}
                    onChange={(e) => {
                      setMedicineSearch({ ...medicineSearch, [idx]: e.target.value });
                      updateRxItem(idx, "medicineId", "");
                      setOpenMedicineIdx(idx);
                    }}
                    onFocus={() => setOpenMedicineIdx(idx)}
                    onBlur={() => setTimeout(() => setOpenMedicineIdx(null), 200)}
                  />
                  {openMedicineIdx === idx && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {getFilteredMedicines(idx).length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-400">No medicines found</div>
                      )}
                      {getFilteredMedicines(idx).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectMedicine(idx, m.id, m.name)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50 flex items-center justify-between"
                        >
                          <span className="font-medium">{m.name}</span>
                          <span className="text-gray-400 text-xs">{m.unit} · PKR {m.unitPrice}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Tablets</label>
                    <input className="input text-sm" placeholder="e.g. 1" value={it.dosage} onChange={(e) => updateRxItem(idx, "dosage", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Duration</label>
                    <input className="input text-sm" placeholder="e.g. 7 days" value={it.duration} onChange={(e) => updateRxItem(idx, "duration", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Timing</label>
                    <select className="input text-sm" value={it.timing} onChange={(e) => updateRxItem(idx, "timing", e.target.value)}>
                      <option>Morning</option>
                      <option>Afternoon</option>
                      <option>Evening</option>
                      <option>Night</option>
                      <option>Morning + Evening</option>
                      <option>Morning + Night</option>
                      <option>Evening + Night</option>
                      <option>Morning + Afternoon + Night</option>
                      <option>3 times daily</option>
                      <option>As needed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Food</label>
                    <select className="input text-sm" value={it.food} onChange={(e) => updateRxItem(idx, "food", e.target.value)}>
                      <option>After Food</option>
                      <option>Before Food</option>
                      <option>With Food</option>
                      <option>No restriction</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Quantity (total tablets)</label>
                  <input type="number" min="1" className="input text-sm" value={it.quantity} onChange={(e) => updateRxItem(idx, "quantity", parseInt(e.target.value) || 1)} />
                </div>
              </div>
            ))}
            <button type="button" onClick={addRxItem} className="text-brand-600 text-sm hover:underline">
              + Add medicine
            </button>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea className="input mt-1" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions..." />
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
              <li key={p.id} className="text-sm border-b pb-2 flex items-start justify-between">
                <div>
                  <span className="text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</span> — {p.diagnosis || "No diagnosis noted"}
                  <div className="text-gray-500 text-xs mt-1">
                    {p.items?.map((it: any) => `${it.medicine?.name} (${it.dosage})`).join(", ")}
                  </div>
                </div>
                <a href={`/doctor/patients/${params.id}/prescription/${p.id}/print`} target="_blank" className="text-brand-600 text-xs hover:underline whitespace-nowrap ml-2">
                  Print
                </a>
              </li>
            ))}
            {(patient.prescriptions?.length ?? 0) === 0 && <p className="text-gray-400 text-sm">No prescriptions yet</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
