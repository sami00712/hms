"use client";

import { useEffect, useState } from "react";

type DoctorAvailability = {
  id: string;
  doctor: { id: string; name: string; specialty: string | null };
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu",
  FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun"
};

export default function AdminDoctorAvailabilityPage() {
  const [availabilities, setAvailabilities] = useState<DoctorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<{ id: string; name: string; specialty: string | null }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ doctorId: "", day: "MONDAY", startTime: "09:00", endTime: "17:00" });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [availRes, docRes] = await Promise.all([
      fetch("/api/doctor-availability").then(r => r.json()),
      fetch("/api/users?role=DOCTOR").then(r => r.json())
    ]);
    if (availRes) setAvailabilities(availRes);
    if (docRes) setDoctors(docRes);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/doctor-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, startTime: `${form.startTime}:00`, endTime: `${form.endTime}:00` })
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ doctorId: "", day: "MONDAY", startTime: "09:00", endTime: "17:00" });
      fetchData();
    } else alert("Failed to save");
  }

  async function toggleAvailability(item: DoctorAvailability) {
    const res = await fetch(`/api/doctor-availability/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !item.isAvailable })
    });
    if (res.ok) fetchData();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/doctor-availability/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  }

  const grouped = DAYS.map(day => ({
    day,
    items: availabilities.filter(a => a.day === day)
  })).filter(g => g.items.length > 0);

  if (loading) return <div className="py-8 text-center">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Doctor Availability</h1>
          <p className="text-gray-500">Set consulting hours for each doctor per day</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm({ doctorId: "", day: "MONDAY", startTime: "09:00", endTime: "17:00" }); }} className="btn-primary">
          + Add Schedule
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add Schedule</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium">Doctor</label>
              <select className="input mt-1" value={form.doctorId} onChange={e => setForm({...form, doctorId: e.target.value})}>
                <option value="">Select doctor...</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Day</label>
              <select className="input mt-1" value={form.day} onChange={e => setForm({...form, day: e.target.value})}>
                {DAYS.map(d => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Start Time</label>
              <input type="time" className="input mt-1" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">End Time</label>
              <input type="time" className="input mt-1" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} />
            </div>
            <div className="md:col-span-4 flex gap-3">
              <button type="submit" className="btn-primary">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {grouped.map(group => (
        <div key={group.day} className="card mb-6">
          <h3 className="text-lg font-semibold p-4 border-b">{group.day}</h3>
          <div className="p-4">
            <table className="data-table w-full">
              <thead><tr><th>Doctor</th><th>Specialty</th><th>Hours</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {group.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.doctor.name}</td>
                    <td>{item.doctor.specialty || "-"}</td>
                    <td>{new Date(item.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — {new Date(item.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                    <td>
                      <button
                        onClick={() => toggleAvailability(item)}
                        className={`text-xs px-2 py-1 rounded-full ${item.isAvailable ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-600"}`}
                      >
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </button>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 text-sm hover:underline">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {grouped.length === 0 && <div className="card p-8 text-center text-gray-400">No schedules configured. Click "Add Schedule" to get started.</div>}
    </div>
  );
}