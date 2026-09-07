"use client";

import { useEffect, useState } from "react";

type Doctor = { id: string; name: string; specialty?: string };
type Patient = { id: string; name: string; mrNumber: string };
type Appointment = {
  id: string;
  date: string;
  status: string;
  patient: { name: string; mrNumber: string };
  doctor: { name: string };
};

export default function AppointmentsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientQuery, setPatientQuery] = useState("");
  const [form, setForm] = useState({ patientId: "", doctorId: "", date: "", time: "", reason: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((users) => {
      setDoctors(users.filter((u: any) => u.role === "DOCTOR" && u.active));
    }).catch(() => setDoctors([]));
    loadAppointments();
  }, []);

  function loadAppointments() {
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/api/appointments?date=${today}`).then((r) => r.json()).then(setAppointments);
  }

  useEffect(() => {
    if (patientQuery.length < 2) return;
    const t = setTimeout(() => {
      fetch(`/api/patients?q=${encodeURIComponent(patientQuery)}`).then((r) => r.json()).then(setPatients);
    }, 300);
    return () => clearTimeout(t);
  }, [patientQuery]);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const dateTime = `${form.date}T${form.time}`;
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: form.patientId, doctorId: form.doctorId, date: dateTime, reason: form.reason })
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to book appointment");
      return;
    }
    setForm({ patientId: "", doctorId: "", date: "", time: "", reason: "" });
    setPatientQuery("");
    loadAppointments();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Appointments</h1>
      <p className="text-gray-500 mb-6">Book a new appointment with any available doctor</p>

      <form onSubmit={handleBook} className="card mb-6 space-y-4">
        {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

        <div>
          <label className="text-sm font-medium">Search Patient</label>
          <input
            className="input mt-1"
            placeholder="Type patient name, MR number or phone..."
            value={patientQuery}
            onChange={(e) => setPatientQuery(e.target.value)}
          />
          {patients.length > 0 && (
            <div className="border rounded-lg mt-1 max-h-40 overflow-y-auto">
              {patients.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    setForm({ ...form, patientId: p.id });
                    setPatientQuery(`${p.name} (${p.mrNumber})`);
                    setPatients([]);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                >
                  {p.name} — {p.mrNumber}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Doctor</label>
            <select required className="input mt-1" value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}{d.specialty ? ` — ${d.specialty}` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Date</label>
            <input required type="date" className="input mt-1" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Time</label>
            <input required type="time" className="input mt-1" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Reason (optional)</label>
          <input className="input mt-1" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </div>

        <button disabled={loading || !form.patientId} className="btn-primary">
          {loading ? "Booking..." : "Book Appointment"}
        </button>
      </form>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b font-semibold text-sm">Today's Appointments</div>
        <table className="data-table w-full">
          <thead>
            <tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Status</th></tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                <td>{a.patient.name} <span className="text-gray-400">({a.patient.mrNumber})</span></td>
                <td>{a.doctor.name}</td>
                <td><span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">{a.status}</span></td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr><td colSpan={4} className="text-center text-gray-400 py-6">No appointments today</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
