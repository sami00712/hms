"use client";

import { useEffect, useState } from "react";

type LabTest = { id: string; name: string; price: number; active: boolean };

export default function AdminLabTestsPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [error, setError] = useState("");

  function load() {
    fetch("/api/lab-tests").then(r => r.ok ? r.json() : []).then(setTests).catch(() => {});
  }
  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) { setError("Name and price required"); return; }
    setError("");
    const res = await fetch("/api/lab-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), price: Number(price) })
    });
    if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
    setName(""); setPrice("");
    load();
  }

  async function handleToggle(id: string, active: boolean) {
    await fetch(`/api/lab-tests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active })
    });
    load();
  }

  async function handleUpdatePrice(id: string) {
    if (!editPrice) return;
    await fetch(`/api/lab-tests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: Number(editPrice) })
    });
    setEditingId(null);
    setEditPrice("");
    load();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Lab Test Catalog</h1>
        <p className="text-gray-500">Manage lab tests available for doctors to order</p>
      </div>

      <form onSubmit={handleCreate} className="card mb-6 flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium">Test Name</label>
          <input className="input mt-1" placeholder="e.g. Blood Test, CBC" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="w-36">
          <label className="text-sm font-medium">Price (PKR)</label>
          <input type="number" className="input mt-1" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary whitespace-nowrap">Add Test</button>
        {error && <span className="text-red-500 text-sm">{error}</span>}
      </form>

      <div className="card p-0 overflow-hidden">
        <table className="data-table w-full">
          <thead><tr><th>Test Name</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {tests.map(t => (
              <tr key={t.id}>
                <td className="font-medium">{t.name}</td>
                <td>
                  {editingId === t.id ? (
                    <div className="flex gap-1">
                      <input type="number" className="input w-24 py-1 text-sm" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
                      <button onClick={() => handleUpdatePrice(t.id)} className="text-brand-600 text-sm">Save</button>
                      <button onClick={() => { setEditingId(null); setEditPrice(""); }} className="text-gray-400 text-sm">Cancel</button>
                    </div>
                  ) : (
                    <span onClick={() => { setEditingId(t.id); setEditPrice(String(t.price)); }} className="cursor-pointer hover:underline">PKR {t.price.toLocaleString()}</span>
                  )}
                </td>
                <td>
                  <span className={`text-xs px-2 py-1 rounded-full ${t.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                    {t.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleToggle(t.id, t.active)} className={`text-sm ${t.active ? "text-red-500 hover:underline" : "text-green-600 hover:underline"}`}>
                    {t.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {tests.length === 0 && <tr><td colSpan={4} className="text-center text-gray-400 py-6">No lab tests configured</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
