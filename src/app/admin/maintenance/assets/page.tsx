"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type MaintenanceAsset = {
  id: string;
  name: string;
  category: string;
  location?: string;
  purchaseDate?: string;
  notes?: string;
};

export default function MaintenanceAssetsPage() {
  const [assets, setAssets] = useState<MaintenanceAsset[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("MEDICAL_EQUIPMENT");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/maintenance-assets");
    setAssets(await res.json());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name || !category) return;
    const res = await fetch("/api/maintenance-assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, location })
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error);
      return;
    }
    setName(""); setLocation("");
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Maintenance Assets</h1>
          <p className="text-gray-500">Track and manage maintenance assets</p>
        </div>
        <Link href="/admin/maintenance" className="btn-secondary">Back to Requests</Link>
      </div>

      <form onSubmit={handleSubmit} className="card mb-6 space-y-4 flex gap-2 flex-wrap">
        <input required className="input" placeholder="Asset name" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>MACHINE_ELECTRIC</option><option>BED</option><option>MEDICAL_EQUIPMENT</option>
          <option>FURNITURE</option><option>HVAC_AC</option><option>PLUMBING_WATER</option>
          <option>FIRE_SAFETY</option><option>BUILDING_CIVIL</option><option>LABORATORY</option><option>OTHER</option>
        </select>
        <input className="input" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <button type="submit" className="btn-primary">Add Asset</button>
      </form>
      {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}

      <div className="card p-0 overflow-hidden">
        <table className="data-table w-full">
          <thead><tr><th>Name</th><th>Category</th><th>Location</th><th></th></tr></thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id}>
                <td className="font-medium">{a.name}</td>
                <td>{a.category}</td>
                <td>{a.location || "-"}</td>
              </tr>
            ))}
            {assets.length === 0 && <tr><td colSpan={4} className="text-center text-gray-400 py-6">No assets found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
