"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

type MaintenanceRequest = {
  id: string;
  asset?: { name: string; category: string };
  customLocation?: string;
  category: string;
  customCategory?: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  reportedBy: { name: string };
  assignedTo?: { id: string; name: string };
  reportedAt: string;
};

type MaintenanceAsset = {
  id: string;
  name: string;
  category: string;
  location?: string;
};

const PRIORITY_COLORS: Record<string, string> = {
  NORMAL: "bg-gray-100 text-gray-600",
  URGENT: "bg-amber-50 text-amber-600",
  MOST_URGENT: "bg-red-50 text-red-600"
};

const STATUS_COLORS: Record<string, string> = {
  REPORTED: "bg-gray-100 text-gray-600",
  SCHEDULED: "bg-blue-50 text-blue-600",
  IN_PROGRESS: "bg-amber-50 text-amber-600",
  RESOLVED: "bg-green-50 text-green-600",
  CANCELLED: "bg-red-50 text-red-600"
};

export default function MaintenancePage() {
  const router = useRouter();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [assets, setAssets] = useState<MaintenanceAsset[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "MEDICAL_EQUIPMENT", title: "", description: "", priority: "NORMAL" as string });
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  useEffect(() => { load(); loadAssets(); loadUsers(); }, []);

  async function load() {
    let url = "/api/maintenance-requests?";
    if (filterStatus) url += `status=${filterStatus}&`;
    if (filterPriority) url += `priority=${filterPriority}&`;
    const res = await fetch(url);
    const data = await res.json();
    setRequests(data);
  }

  async function loadAssets() {
    const res = await fetch("/api/maintenance-assets");
    setAssets(await res.json());
  }

  async function loadUsers() {
    const res = await fetch("/api/users?role=RECEPTIONIST");
    const data = await res.json();
    const maRes = await fetch("/api/users?role=MAINTENANCE");
    const maData = await maRes.json();
    setUsers([...data, ...maData]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category || !form.title) return;
    const res = await fetch("/api/maintenance-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ category: "MEDICAL_EQUIPMENT", title: "", description: "", priority: "NORMAL" });
      load();
    }
  }

  async function handleAssign(id: string, userId: string) {
    await fetch(`/api/maintenance-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToId: userId })
    });
    load();
    router.refresh();
  }

  async function handleStatus(id: string, status: string) {
    await fetch(`/api/maintenance-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    load();
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Maintenance Requests</h1>
          <p className="text-gray-500">Track and manage maintenance issues</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ New Request</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select className="input mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option>MACHINE_ELECTRIC</option><option>BED</option><option>MEDICAL_EQUIPMENT</option>
                <option>FURNITURE</option><option>HVAC_AC</option><option>PLUMBING_WATER</option>
                <option>FIRE_SAFETY</option><option>BUILDING_CIVIL</option><option>LABORATORY</option><option>OTHER</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <select className="input mt-1" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option>NORMAL</option><option>URGENT</option><option>MOST_URGENT</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Title</label>
            <input required className="input mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea className="input mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <button type="submit" className="btn-primary">Submit Request</button>
        </form>
      )}

      <div className="flex gap-2 mb-4">
        <select className="input" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); load(); }}>
          <option value="">All Status</option>
          <option>REPORTED</option><option>SCHEDULED</option><option>IN_PROGRESS</option><option>RESOLVED</option><option>CANCELLED</option>
        </select>
        <select className="input" value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); load(); }}>
          <option value="">All Priority</option>
          <option>NORMAL</option><option>URGENT</option><option>MOST_URGENT</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="data-table w-full">
          <thead><tr><th>Location</th><th>Category</th><th>Title</th><th>Priority</th><th>Status</th><th>Reported By</th><th>Assigned To</th><th></th></tr></thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.asset?.name || r.customLocation || "-"}</td>
                <td>{r.category === "OTHER" ? r.customCategory || "Other" : r.category.replace(/_/g, " ")}</td>
                <td className="font-medium">{r.title}</td>
                <td><span className={`text-xs px-2 py-1 rounded-full ${PRIORITY_COLORS[r.priority] || ""}`}>{r.priority}</span></td>
                <td><span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[r.status] || ""}`}>{r.status}</span></td>
                <td>{r.reportedBy.name}</td>
                <td>{r.assignedTo?.name || "-"}</td>
                <td>
                  <div className="flex gap-1">
                    <select className="input text-xs py-1" onChange={(e) => { if (e.target.value) handleAssign(r.id, e.target.value); e.target.value = ""; }}>
                      <option value="">Assign</option>
                      {users.filter(u => u.id !== r.assignedTo?.id).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    {r.status !== "IN_PROGRESS" && <button onClick={() => handleStatus(r.id, "IN_PROGRESS")} className="btn-secondary text-xs py-1">In Progress</button>}
                    {r.status !== "RESOLVED" && <button onClick={() => handleStatus(r.id, "RESOLVED")} className="btn-secondary text-xs py-1 bg-green-50 text-green-600">Resolve</button>}
                  </div>
                </td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={8} className="text-center text-gray-400 py-6">No maintenance requests found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
