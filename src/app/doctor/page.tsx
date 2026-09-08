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
  const [referModalPatientId, setReferModalPatientId] = useState<string | null>(null);
  const [referModalPatientName, setReferModalPatientName] = useState("");
  const [referTestSelection, setReferTestSelection] = useState("");
  const [referSaving, setReferSaving] = useState(false);
  const [referSuccess, setReferSuccess] = useState(false);

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

  function openReferModal(patientId: string, patientName: string) {
    setReferModalPatientId(patientId);
    setReferModalPatientName(patientName);
    setReferTestSelection("");
    setReferSuccess(false);
  }

  function closeReferModal() {
    setReferModalPatientId(null);
    setReferModalPatientName("");
    setReferTestSelection("");
    setReferSuccess(false);
  }

  async function handleReferLabTest(e: React.FormEvent) {
    e.preventDefault();
    if (!referTestSelection || !referModalPatientId) return;
    setReferSaving(true);
    setReferSuccess(false);
    const res = await fetch("/api/lab-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: referModalPatientId, labTestId: referTestSelection })
    });
    setReferSaving(false);
    if (res.ok) {
      setReferSuccess(true);
      setReferTestSelection("");
    } else {
      alert("Failed to order lab test");
    }
  }

  async function handleAppointmentStatus(id: string, status: string) {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
  }

  function setQuickDate(offset: number) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    setDate(d.toISOString().slice(0, 10));
  }

  const isToday = date === new Date().toISOString().slice(0, 10);
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date === yesterday.toISOString().slice(0, 10);
  const lastWeek = new Date(); lastWeek.setDate(lastWeek.getDate() - 7);
  const isLastWeek = date === lastWeek.toISOString().slice(0, 10);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.length < 2) return;
    fetch(`/api/patients?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(setPatients);
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const completedCount = appointments.filter(a => a.status === "COMPLETED").length;
  const cancelledCount = appointments.filter(a => a.status === "CANCELLED").length;
  const scheduledCount = appointments.filter(a => a.status === "SCHEDULED").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Appointments</h1>
          <p className="text-gray-500">Patients scheduled with you</p>
        </div>
        <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold">{appointments.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Scheduled</p>
          <p className="text-2xl font-bold text-blue-600">{scheduledCount}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{completedCount}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Cancelled</p>
          <p className="text-2xl font-bold text-red-600">{cancelledCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setQuickDate(0)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${isToday ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          Today
        </button>
        <button onClick={() => setQuickDate(-1)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${isYesterday ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          Yesterday
        </button>
        <button onClick={() => setQuickDate(1)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${date === new Date(Date.now() + 86400000).toISOString().slice(0, 10) ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          Tomorrow
        </button>
        <button onClick={() => setQuickDate(-7)} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
          Last 7 Days
        </button>
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

      {referModalPatientId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-1">Refer Lab Test</h2>
            <p className="text-sm text-gray-500 mb-4">Patient: <strong>{referModalPatientName}</strong></p>
            {referSuccess && (
              <div className="bg-green-50 text-green-600 text-sm px-3 py-2 rounded-lg mb-3">
                Lab test ordered! Patient should go to Reception for billing, then to Lab for testing.
              </div>
            )}
            <form onSubmit={handleReferLabTest} className="space-y-3">
              <select className="input" value={referTestSelection} onChange={e => setReferTestSelection(e.target.value)}>
                <option value="">Select test...</option>
                {labTests.map(t => <option key={t.id} value={t.id}>{t.name} — PKR {t.price}</option>)}
              </select>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={closeReferModal} className="btn-secondary">Close</button>
                <button type="submit" disabled={referSaving || !referTestSelection} className="btn-primary">
                  {referSaving ? "Ordering..." : "Order Test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr><th>Time</th><th>Patient</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                <td>{a.patient.name} <span className="text-gray-400">({a.patient.mrNumber})</span></td>
                <td>{a.reason || "-"}</td>
                <td>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    a.status === "COMPLETED" ? "bg-green-50 text-green-600" :
                    a.status === "CANCELLED" ? "bg-red-50 text-red-600" :
                    "bg-blue-50 text-blue-600"
                  }`}>
                    {a.status}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2 items-center">
                    {a.status === "SCHEDULED" && (
                      <>
                        <button
                          onClick={() => handleAppointmentStatus(a.id, "COMPLETED")}
                          className="text-green-600 text-sm hover:underline font-medium"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleAppointmentStatus(a.id, "CANCELLED")}
                          className="text-red-500 text-sm hover:underline font-medium"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    <Link href={`/doctor/patients/${a.patient.id}?appointmentId=${a.id}`} className="text-brand-600 text-sm hover:underline font-medium">
                      Give Medicine
                    </Link>
                    <button
                      onClick={() => openReferModal(a.patient.id, a.patient.name)}
                      className="text-purple-600 text-sm hover:underline font-medium"
                    >
                      Refer Test
                    </button>
                  </div>
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