"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  specialty?: string;
};

const ROLES = ["ADMIN", "RECEPTIONIST", "DOCTOR", "LAB", "PHARMACIST"];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "RECEPTIONIST", specialty: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function loadUsers() {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers);
  }

  useEffect(loadUsers, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create user");
      return;
    }
    setForm({ name: "", email: "", password: "", role: "RECEPTIONIST", specialty: "" });
    setShowForm(false);
    loadUsers();
  }

  async function toggleActive(user: User) {
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active })
    });
    loadUsers();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users & Staff</h1>
          <p className="text-gray-500">Manage admin, receptionist, doctor, lab & pharmacy accounts</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancel" : "+ Add Staff"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <input required className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input required type="email" className="input mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <input required type="password" className="input mt-1" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <select className="input mt-1" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            {form.role === "DOCTOR" && (
              <div>
                <label className="text-sm font-medium">Specialty</label>
                <input className="input mt-1" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
              </div>
            )}
          </div>
          <button disabled={loading} className="btn-primary">{loading ? "Creating..." : "Create Account"}</button>
        </form>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.name}{u.specialty ? <span className="text-gray-400"> — {u.specialty}</span> : ""}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <span className={`text-xs px-2 py-1 rounded-full ${u.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                    {u.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <button onClick={() => toggleActive(u)} className="text-brand-600 text-sm hover:underline">
                    {u.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="text-center text-gray-400 py-6">No staff yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
