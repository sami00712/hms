"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Department = { id: string; name: string; staff: { id: string; name: string; specialty: string | null }[] };

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/departments");
    const data = await res.json();
    setDepartments(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error);
      return;
    }
    setName("");
    load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/departments/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-gray-500">Manage hospital departments</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card mb-6 space-y-4 flex gap-2">
        <input className="input flex-1" placeholder="Department name" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit" className="btn-primary">Add Department</button>
      </form>
      {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}

      <div className="card p-0 overflow-hidden">
        <table className="data-table w-full">
          <thead><tr><th>Department</th><th>Assigned Doctors</th><th></th></tr></thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.id}>
                <td className="font-medium">{d.name}</td>
                <td>{d.staff.length > 0 ? d.staff.map(s => s.name).join(", ") : "-"}</td>
                <td>
                  <button onClick={() => handleDelete(d.id)} className="text-red-600 text-sm hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {departments.length === 0 && <tr><td colSpan={3} className="text-center text-gray-400 py-6">No departments found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
