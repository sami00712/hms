"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Nurse = { id: string; name: string; phone: string | null; department: { id: string; name: string } | null; active: boolean };

export default function NursesPage() {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => { load(); loadDepartments(); }, []);

  async function load() {
    const res = await fetch("/api/nurses");
    const data = await res.json();
    setNurses(data);
  }

  async function loadDepartments() {
    const res = await fetch("/api/departments");
    const data = await res.json();
    setDepartments(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/nurses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, departmentId: departmentId || undefined })
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error);
      return;
    }
    setName(""); setPhone(""); setDepartmentId("");
    load();
  }

  async function handleToggle(id: string, active: boolean) {
    await fetch(`/api/nurses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active })
    });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Nurses</h1>
          <p className="text-gray-500">Manage nurse records</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input required className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input className="input mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Department</label>
            <select className="input mt-1" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">None</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" className="btn-primary">Add Nurse</button>
        {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
      </form>

      <div className="card p-0 overflow-hidden">
        <table className="data-table w-full">
          <thead><tr><th>Name</th><th>Phone</th><th>Department</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {nurses.map((n) => (
              <tr key={n.id}>
                <td className="font-medium">{n.name}</td>
                <td>{n.phone || "-"}</td>
                <td>{n.department?.name || "-"}</td>
                <td>
                  <button onClick={() => handleToggle(n.id, n.active)} className={`text-xs px-2 py-1 rounded-full ${n.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-600"}`}>
                    {n.active ? "Active" : "Inactive"}
                  </button>
                </td>
              </tr>
            ))}
            {nurses.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 py-6">No nurses found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
