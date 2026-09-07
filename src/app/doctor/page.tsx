"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Appointment = {
  id: string;
  date: string;
  status: string;
  reason?: string;
  patient: { id: string; name: string; mrNumber: string };
};

type Patient = { id: string; name: string; mrNumber: string; phone: string; gender: string; bloodGroup?: string };
type LabTest = { id: string; name: string; price: number };

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [patientForm, setPatientForm] = useState({ name: "", gender: "Male", dob: "", phone: "", address: "", bloodGroup: "" });
  const [patientError, setPatientError] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [selectedLabTest, setSelectedLabTest] = useState("");
  const [showLabTestSection, setShowLabTestSection] = useState(false);
  const [labOrderPatientId, setLabOrderPatientId] = useState("");
  const [labSaving, setLabSaving] = useState(false);
  const [labSuccess, setLabSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/appointments?date=${date}`).then(r => r.json()).then(setAppointments);
    fetch("/api/lab-tests").then(r => r.json()).then(setLabTests);
  }, [date]);

  async function handleCreatePatient(e: React.FormEvent) {
    e.preventDefault();
    setPatientError("");
    if (!patientForm.name || !patientForm.phone) {
      setPatientError("Name and phone are required");
      return;
    }
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patientForm)
    });
    if (!res.ok) {
      const data = await res.json();
      setPatientError(data.error || "Failed to register patient");
      return;
    }
    const newPatient = await res.json();
    setShowPatientForm(false);
    setPatientForm({ name: "", gender: "Male", dob: "", phone: "", address: "", bloodGroup: "" });
    setLabOrderPatientId(newPatient.id);
    setShowLabTestSection(true);
  }

  async function orderLabTest(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLabTest || !labOrderPatientId) return;
    setLabSaving(true);
    setLabSuccess(false);
    const res = await fetch("/api/lab-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: labOrderPatientId, labTestId: selectedLabTest })
    });
    setLabSaving(false);
    if (res.ok) {
      setLabSuccess(true);
      setSelectedLabTest("");
    } else {
      alert("Failed to order lab test");
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.length < 2) return;
    fetch(`/api/patients?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(setPatients);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Appointments</h1>
          <p className="text-gray-500">Patients scheduled with you</p>
        </div>
        <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={() => setShowPatientForm(!showPatientForm)} className="btn-primary">+ New Patient</button>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input className="input" placeholder="Search existing patient..." value={query} onChange={e => setQuery(e.target.value)} />
          <button type="submit" className="btn-secondary">Search</button>
        </form>
        {patients.length > 0 && (
          <div className="border rounded-lg mt-1 max-h-40 overflow-y-auto w-64">
            {patients.map(p => (
              <a key={p.id} href={`/doctor/patients/${p.id}`} className="block px-3 py-2 text-sm hover:bg-gray-50">
                {p.name} ({p.mrNumber})
              </a>
            ))}
          </div>
        )}
      </div>

      {showPatientForm && (
        <form onSubmit={handleCreatePatient} className="card mb-6 space-y-4">
          <h2 className="text-lg font-semibold">Register New Patient</h2>
          {patientError && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{patientError}</div>}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <input required className="input mt-1" value={patientForm.name} onChange={e => setPatientForm({...patientForm, name: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Gender</label>
              <select className="input mt-1" value={patientForm.gender} onChange={e => setPatientForm({...patientForm, gender: e.target.value})}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">DOB</label>
              <input type="date" className="input mt-1" value={patientForm.dob} onChange={e => setPatientForm({...patientForm, dob: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input required className="input mt-1" value={patientForm.phone} onChange={e => setPatientForm({...patientForm, phone: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Blood Group</label>
              <input className="input mt-1" placeholder="O+" value={patientForm.bloodGroup} onChange={e => setPatientForm({...patientForm, bloodGroup: e.target.value})} />
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium">Address</label>
              <input className="input mt-1" value={patientForm.address} onChange={e => setPatientForm({...patientForm, address: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="btn-primary">Register Patient</button>
        </form>
      )}

      {showLabTestSection && labTests.length > 0 && (
        <form onSubmit={orderLabTest} className="card mb-6 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Order Lab Test for New Patient</h2>
          {labSuccess && <div className="bg-green-50 text-green-600 text-sm px-3 py-2 rounded-lg">Lab test ordered successfully!</div>}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Select Test</label>
              <select className="input mt-1" value={selectedLabTest} onChange={e => setSelectedLabTest(e.target.value)}>
                <option value="">Choose lab test...</option>
                {labTests.map(t => <option key={t.id} value={t.id}>{t.name} — PKR {t.price}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Note</label>
              <p className="text-sm text-gray-500 mt-2">Lab order will be placed and result will notify you when ready.</p>
            </div>
          </div>
          <button type="submit" disabled={labSaving} className="btn-primary">{labSaving ? "Ordering..." : "Order Lab Test"}</button>
        </form>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr><th>Time</th><th>Patient</th><th>Reason</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                <td>{a.patient.name} <span className="text-gray-400">({a.patient.mrNumber})</span></td>
                <td>{a.reason || "-"}</td>
                <td>
                  <span className={`text-xs px-2 py-1 rounded-full ${a.status === "COMPLETED" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"}`}>
                    {a.status}
                  </span>
                </td>
                <td>
                  <Link href={`/doctor/patients/${a.patient.id}?appointmentId=${a.id}`} className="text-brand-600 text-sm hover:underline">
                    Open Chart
                  </Link>
                </td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr><td colSpan={5} className="text-center text-gray-400 py-6">No appointments for this date</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}