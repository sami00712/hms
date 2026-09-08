"use client";

import { useEffect, useState } from "react";

type Patient = { id: string; name: string; mrNumber: string; phone: string; gender: string };
type ServiceRate = { id: string; name: string; category: string; price: number; active: boolean };
type Doctor = { id: string; name: string };
type OPDVisit = { id: string; tokenNumber: number; patient: { name: string; mrNumber: string }; doctor: { name: string } | null; serviceRate: { name: string; price: number }; status: string; visitDate: string };

export default function OPDPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [rates, setRates] = useState<ServiceRate[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [visits, setVisits] = useState<OPDVisit[]>([]);
  const [query, setQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedRate, setSelectedRate] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/service-rates").then(r => r.ok ? r.json() : []).then(data => {
      setRates(data.filter((r: ServiceRate) => r.active && (r.category === "OPD_CONSULTATION" || r.category === "FOLLOW_UP")));
    }).catch(() => {});
    fetch("/api/patients").then(r => r.ok ? r.json() : []).then(setPatients).catch(() => {});
    fetch("/api/users?role=DOCTOR").then(r => r.ok ? r.json() : []).then(setDoctors).catch(() => {});
    fetchOPDVisits();
  }, []);

  async function fetchOPDVisits() {
    const res = await fetch("/api/opd-visits");
    if (res.ok) setVisits(await res.json());
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.length < 2) return;
    fetch(`/api/patients?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(setPatients);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!selectedPatient || !selectedRate) {
      setError("Select patient and service rate");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/opd-visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: selectedPatient.id, serviceRateId: selectedRate, doctorId: selectedDoctor || null })
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create OPD token");
      return;
    }
    const visit = await res.json();
    setSelectedPatient(null);
    setSelectedRate("");
    setSelectedDoctor("");
    setQuery("");
    fetchOPDVisits();
  }

  const statusColors: Record<string, string> = {
    WAITING: "bg-blue-50 text-blue-600",
    IN_CONSULTATION: "bg-amber-50 text-amber-600",
    COMPLETED: "bg-green-50 text-green-600",
    CANCELLED: "bg-red-50 text-red-600"
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">OPD Token Generation</h1>
          <p className="text-gray-500">Generate OPD tokens and manage the queue</p>
        </div>
        <button onClick={fetchOPDVisits} className="btn-secondary">Refresh Queue</button>
      </div>

      <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
        <h2 className="text-lg font-semibold">New OPD Token</h2>
        {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Patient</label>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Search patient..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleSearch} />
              <button type="button" onClick={handleSearch} className="btn-secondary">Search</button>
            </div>
            {patients.length > 0 && !selectedPatient && (
              <div className="border rounded-lg mt-1 max-h-40 overflow-y-auto">
                {patients.map(p => (
                  <button key={p.id} type="button" onClick={() => { setSelectedPatient(p); setQuery(`${p.name} (${p.mrNumber})`); setPatients([]); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                    {p.name} — {p.mrNumber}
                  </button>
                ))}
              </div>
            )}
            {selectedPatient && <span className="text-sm mt-1">Selected: {selectedPatient.name} ({selectedPatient.mrNumber})</span>}
          </div>
          <div>
            <label className="text-sm font-medium">Service Rate</label>
            <select className="input mt-1" value={selectedRate} onChange={e => setSelectedRate(e.target.value)}>
              <option value="">Select rate...</option>
              {rates.map(r => <option key={r.id} value={r.id}>{r.name} — PKR{r.price.toLocaleString()}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Doctor (optional)</label>
            <select className="input mt-1" value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)}>
              <option value="">Unassigned</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">Generate Token</button>
      </form>

      <div className="card p-0 overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b">Today's OPD Queue</h2>
        <table className="data-table w-full">
          <thead><tr><th>Token</th><th>Patient</th><th>Service</th><th>Doctor</th><th>Status</th><th>Print</th></tr></thead>
          <tbody>
            {visits.map(v => (
              <tr key={v.id}>
                <td className="font-bold">#{v.tokenNumber}</td>
                <td>{v.patient.name} <span className="text-gray-400">({v.patient.mrNumber})</span></td>
                <td>{v.serviceRate.name}</td>
                <td>{v.doctor?.name || "—"}</td>
                <td><span className={`text-xs px-2 py-1 rounded-full ${statusColors[v.status] || "bg-gray-50 text-gray-600"}`}>{v.status}</span></td>
                <td><button onClick={() => window.open(`/receptionist/opd/${v.id}/print`, "_blank")} className="text-sm text-brand-600 hover:underline">Print</button></td>
              </tr>
            ))}
            {visits.length === 0 && <tr><td colSpan={6} className="text-center text-gray-400 py-6">No OPD visits today</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}