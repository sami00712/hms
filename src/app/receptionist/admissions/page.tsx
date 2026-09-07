"use client";

import { useEffect, useState } from "react";

type Patient = { id: string; name: string; mrNumber: string; phone: string; gender: string };
type Ward = { id: string; name: string; beds: { id: string; bedNumber: string; status: string; admissions: { patient: { name: string } }[] }[] };
type Doctor = { id: string; name: string };
type Admission = { id: string; patient: { name: string; mrNumber: string }; bed: { ward: { name: string }; bedNumber: string }; doctor: { name: string }; admittedAt: string };

export default function AdmissionsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [query, setQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedBed, setSelectedBed] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/patients").then(r => r.json()).then(setPatients);
    fetch("/api/wards").then(r => r.json()).then(setWards);
    fetch("/api/users?role=DOCTOR").then(r => r.json()).then(setDoctors);
    fetchAdmissions();
  }, []);

  async function fetchAdmissions() {
    const res = await fetch("/api/admissions");
    if (res.ok) setAdmissions(await res.json());
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.length < 2) return;
    fetch(`/api/patients?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(setPatients);
  }

  async function handleAdmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(false);
    setError("");
    if (!selectedPatient || !selectedBed || !selectedDoctor) {
      setError("Select patient, bed, and doctor");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/admissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: selectedPatient.id, bedId: selectedBed, doctorId: selectedDoctor })
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to admit patient");
      return;
    }
    setSelectedPatient(null);
    setSelectedBed("");
    setSelectedDoctor("");
    setQuery("");
    fetchAdmissions();
  }

  async function handleDischarge(id: string) {
    const res = await fetch(`/api/admissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discharge: true })
    });
    if (res.ok) fetchAdmissions();
    else {
      const data = await res.json();
      alert(data.error || "Discharge failed");
    }
  }

  const availableBeds = wards.flatMap(w => w.beds.filter(b => b.status === "AVAILABLE").map(b => ({ ...b, wardName: w.name })));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admissions</h1>
          <p className="text-gray-500">Admit patients to beds and manage discharges</p>
        </div>
        <button onClick={fetchAdmissions} className="btn-secondary">Refresh</button>
      </div>

      <form onSubmit={handleAdmit} className="card mb-6 space-y-4">
        <h2 className="text-lg font-semibold">New Admission</h2>
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
            {selectedPatient && <span className="text-sm mt-1">{selectedPatient.name} ({selectedPatient.mrNumber})</span>}
          </div>
          <div>
            <label className="text-sm font-medium">Bed</label>
            <select className="input mt-1" value={selectedBed} onChange={e => setSelectedBed(e.target.value)}>
              <option value="">Select bed...</option>
              {availableBeds.map(b => (
                <option key={b.id} value={b.id}>{b.wardName} - Bed {b.bedNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Doctor</label>
            <select className="input mt-1" value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)}>
              <option value="">Select doctor...</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">Admit Patient</button>
      </form>

      <div className="card p-0 overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b">Currently Admitted</h2>
        <table className="data-table w-full">
          <thead><tr><th>Patient</th><th>Bed</th><th>Ward</th><th>Doctor</th><th>Admitted</th><th></th></tr></thead>
          <tbody>
            {admissions.map(a => (
              <tr key={a.id}>
                <td>{a.patient.name} ({a.patient.mrNumber})</td>
                <td>{a.bed.bedNumber}</td>
                <td>{a.bed.ward.name}</td>
                <td>{a.doctor.name}</td>
                <td>{new Date(a.admittedAt).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleDischarge(a.id)} className="text-red-600 text-sm hover:underline">Discharge</button>
                </td>
              </tr>
            ))}
            {admissions.length === 0 && <tr><td colSpan={6} className="text-center text-gray-400 py-6">No active admissions</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}