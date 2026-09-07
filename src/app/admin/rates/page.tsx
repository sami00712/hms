"use client";

import { useEffect, useState } from "react";

type ServiceRate = {
  id: string;
  name: string;
  category: string;
  price: number;
  active: boolean;
};

const categories = ["OPD_CONSULTATION", "FOLLOW_UP", "BED_CHARGE_PER_DAY", "PROCEDURE", "OTHER"];

export default function AdminRatesPage() {
  const [rates, setRates] = useState<ServiceRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "OPD_CONSULTATION", price: "", active: true });

  async function fetchRates() {
    const res = await fetch("/api/service-rates");
    if (res.ok) setRates(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchRates(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { name: form.name, category: form.category, price: Number(form.price), active: form.active };
    const url = editingId ? `/api/service-rates/${editingId}` : "/api/service-rates";
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      setShowForm(false);
      setEditingId(null);
      setForm({ name: "", category: "OPD_CONSULTATION", price: "", active: true });
      fetchRates();
    } else {
      alert("Failed to save");
    }
  }

  async function toggleActive(rate: ServiceRate) {
    const res = await fetch(`/api/service-rates/${rate.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !rate.active })
    });
    if (res.ok) fetchRates();
  }

  function startEdit(rate: ServiceRate) {
    setForm({ name: rate.name, category: rate.category, price: String(rate.price), active: rate.active });
    setEditingId(rate.id);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", category: "OPD_CONSULTATION", price: "", active: true });
  }

  if (loading) return <div className="py-8 text-center">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Service Rates</h1>
          <p className="text-gray-500">Manage consultation fees, bed charges, and procedure rates</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: "", category: "OPD_CONSULTATION", price: "", active: true }); }} className="btn-primary">
          + Add Rate
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? "Edit Rate" : "Add New Rate"}</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <input type="text" required className="input mt-1" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. OPD Consultation - General" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select className="input mt-1" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Price (PKR)</label>
              <input type="number" required step="0.01" className="input mt-1" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="1000" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Active</label>
              <select className="input mt-1" value={String(form.active)} onChange={e => setForm({...form, active: e.target.value === "true"})}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">{editingId ? "Update" : "Create"}</button>
              <button type="button" onClick={cancelForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr><th>Name</th><th>Category</th><th>Price</th><th>Active</th><th></th></tr>
          </thead>
          <tbody>
            {rates.map(rate => (
              <tr key={rate.id}>
                <td>{rate.name}</td>
                <td>{rate.category.replace(/_/g, " ")}</td>
                <td>PKR{rate.price.toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => toggleActive(rate)}
                    className={`text-xs px-2 py-1 rounded-full ${rate.active ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-600"}`}
                  >
                    {rate.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td>
                  <button onClick={() => startEdit(rate)} className="text-brand-600 text-sm hover:underline">Edit</button>
                </td>
              </tr>
            ))}
            {rates.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 py-6">No rates configured</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}