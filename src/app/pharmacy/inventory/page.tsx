"use client";

import { useEffect, useState } from "react";

type Medicine = {
  id: string;
  name: string;
  category?: string;
  unit: string;
  unitPrice: number;
  stock: number;
  reorderLevel: number;
};

export default function InventoryPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", unit: "tablet", unitPrice: "", stock: "", reorderLevel: "10" });
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState("");

  function loadMedicines() {
    fetch("/api/medicines").then((r) => r.json()).then(setMedicines);
  }
  useEffect(loadMedicines, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/medicines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setForm({ name: "", category: "", unit: "tablet", unitPrice: "", stock: "", reorderLevel: "10" });
    setShowForm(false);
    loadMedicines();
  }

  async function handleAdjust(id: string) {
    await fetch(`/api/medicines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adjustQuantity: Number(adjustQty), reason: "Manual stock adjustment" })
    });
    setAdjusting(null);
    setAdjustQty("");
    loadMedicines();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Medicine Inventory</h1>
          <p className="text-gray-500">Manage stock levels and add new medicines</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancel" : "+ Add Medicine"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input required className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <input className="input mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Unit</label>
            <input className="input mt-1" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Unit Price (PKR)</label>
            <input required type="number" className="input mt-1" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Initial Stock</label>
            <input type="number" className="input mt-1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Reorder Level</label>
            <input type="number" className="input mt-1" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
          </div>
          <div className="md:col-span-3">
            <button className="btn-primary">Add Medicine</button>
          </div>
        </form>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr><th>Medicine</th><th>Category</th><th>Stock</th><th>Unit Price</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {medicines.map((m) => (
              <tr key={m.id}>
                <td className="font-medium">{m.name}</td>
                <td>{m.category || "-"}</td>
                <td>{m.stock} {m.unit}</td>
                <td>PKR {m.unitPrice}</td>
                <td>
                  {m.stock <= m.reorderLevel ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-500">Low Stock</span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600">OK</span>
                  )}
                </td>
                <td>
                  {adjusting === m.id ? (
                    <div className="flex gap-1">
                      <input
                        className="input w-24 py-1"
                        type="number"
                        placeholder="+/- qty"
                        value={adjustQty}
                        onChange={(e) => setAdjustQty(e.target.value)}
                      />
                      <button onClick={() => handleAdjust(m.id)} className="text-brand-600 text-sm">Save</button>
                    </div>
                  ) : (
                    <button onClick={() => setAdjusting(m.id)} className="text-brand-600 text-sm hover:underline">
                      Adjust Stock
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {medicines.length === 0 && <tr><td colSpan={6} className="text-center text-gray-400 py-6">No medicines yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
