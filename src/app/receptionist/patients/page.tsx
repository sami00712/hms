"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Patient = {
  id: string;
  mrNumber: string;
  name: string;
  gender: string;
  phone: string;
  bloodGroup?: string;
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", gender: "Male", dob: "", phone: "", address: "", bloodGroup: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function loadPatients(q = "") {
    fetch(`/api/patients${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then((r) => r.json())
      .then(setPatients);
  }

  useEffect(() => loadPatients(), []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadPatients(query);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to register patient");
      return;
    }
    setForm({ name: "", gender: "Male", dob: "", phone: "", address: "", bloodGroup: "" });
    setShowForm(false);
    loadPatients();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-gray-500">Register new patients or search existing records</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancel" : "+ Register Patient"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <input required className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Gender</label>
              <select className="input mt-1" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Date of Birth</label>
              <input type="date" className="input mt-1" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input required className="input mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Blood Group</label>
              <input className="input mt-1" placeholder="O+" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium">Address</label>
              <input className="input mt-1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <button disabled={loading} className="btn-primary">{loading ? "Registering..." : "Register Patient"}</button>
        </form>
      )}

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          className="input"
          placeholder="Search by name, MR number or phone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn-secondary">Search</button>
      </form>

      <div className="card p-0 overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr><th>MR #</th><th>Name</th><th>Gender</th><th>Phone</th><th>Blood Group</th><th></th></tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id}>
                <td>{p.mrNumber}</td>
                <td className="font-medium">{p.name}</td>
                <td>{p.gender}</td>
                <td>{p.phone}</td>
                <td>{p.bloodGroup || "-"}</td>
                <td>
                  <Link href={`/receptionist/patients/${p.id}`} className="text-brand-600 text-sm hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-400 py-6">No patients found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
