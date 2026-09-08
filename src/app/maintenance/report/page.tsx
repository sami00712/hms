"use client";

import { useEffect, useState } from "react";

type Asset = { id: string; name: string; category: string; location?: string };
type Ward = { id: string; name: string };
type Department = { id: string; name: string };

const CATEGORIES = [
  { value: "MACHINE_ELECTRIC", label: "Machine / Electric" },
  { value: "BED", label: "Bed" },
  { value: "MEDICAL_EQUIPMENT", label: "Medical Equipment" },
  { value: "FURNITURE", label: "Furniture" },
  { value: "HVAC_AC", label: "HVAC / AC" },
  { value: "PLUMBING_WATER", label: "Plumbing / Water" },
  { value: "FIRE_SAFETY", label: "Fire Safety" },
  { value: "BUILDING_CIVIL", label: "Building / Civil" },
  { value: "LABORATORY", label: "Laboratory" },
  { value: "OTHER", label: "Other" }
];

export default function ReportIssuePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [locationType, setLocationType] = useState<"asset" | "ward" | "department" | "other" | "">("");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedWardId, setSelectedWardId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [customLocation, setCustomLocation] = useState("");

  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("NORMAL");

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/maintenance-assets").then(r => r.ok ? r.json() : []).then(setAssets).catch(() => {});
    fetch("/api/wards").then(r => r.ok ? r.json() : []).then(setWards).catch(() => {});
    fetch("/api/departments").then(r => r.ok ? r.json() : []).then(setDepartments).catch(() => {});
  }, []);

  function resetForm() {
    setLocationType("");
    setSelectedAssetId("");
    setSelectedWardId("");
    setSelectedDepartmentId("");
    setCustomLocation("");
    setCategory("");
    setCustomCategory("");
    setTitle("");
    setDescription("");
    setPriority("NORMAL");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !title) {
      setError("Category and title are required");
      return;
    }
    if (category === "OTHER" && !customCategory.trim()) {
      setError("Please specify the custom category");
      return;
    }

    setLoading(true);
    setError("");

    let assetId: string | null = null;
    let finalCustomLocation: string | null = null;

    if (locationType === "asset" && selectedAssetId) {
      assetId = selectedAssetId;
    } else if (locationType === "ward" && selectedWardId) {
      finalCustomLocation = wards.find(w => w.id === selectedWardId)?.name || null;
    } else if (locationType === "department" && selectedDepartmentId) {
      finalCustomLocation = departments.find(d => d.id === selectedDepartmentId)?.name || null;
    } else if (locationType === "other" && customLocation.trim()) {
      finalCustomLocation = customLocation.trim();
    }

    const res = await fetch("/api/maintenance-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId,
        customLocation: finalCustomLocation,
        category,
        customCategory: category === "OTHER" ? customCategory.trim() : null,
        title,
        description: description.trim() || null,
        priority
      })
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to submit");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-2">Issue Reported Successfully</h2>
          <p className="text-gray-500 mb-6">The maintenance team has been notified and will address this issue.</p>
          <button
            onClick={() => { setSubmitted(false); resetForm(); }}
            className="btn-primary"
          >
            Report Another Issue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Report an Issue</h1>
        <p className="text-gray-500">Let us know what&apos;s wrong and where</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

        {/* 1. Where is the problem? */}
        <div>
          <label className="text-sm font-semibold block mb-2">Where is the problem? *</label>
          <select
            className="input"
            value={locationType}
            onChange={e => {
              setLocationType(e.target.value as any);
              setSelectedAssetId("");
              setSelectedWardId("");
              setSelectedDepartmentId("");
              setCustomLocation("");
            }}
          >
            <option value="">Select location type...</option>
            {assets.length > 0 && <optgroup label="Assets">{assets.map(a => <option key={a.id} value="asset">Asset: {a.name}{a.location ? ` (${a.location})` : ""}</option>)}</optgroup>}
            {wards.length > 0 && <optgroup label="Wards">{wards.map(w => <option key={w.id} value="ward">Ward: {w.name}</option>)}</optgroup>}
            {departments.length > 0 && <optgroup label="Departments">{departments.map(d => <option key={d.id} value="department">Department: {d.name}</option>)}</optgroup>}
            <option value="other">Other (type manually)</option>
          </select>

          {locationType === "asset" && (
            <select className="input mt-2" value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)}>
              <option value="">Select asset...</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.name}{a.location ? ` — ${a.location}` : ""}</option>)}
            </select>
          )}
          {locationType === "ward" && (
            <select className="input mt-2" value={selectedWardId} onChange={e => setSelectedWardId(e.target.value)}>
              <option value="">Select ward...</option>
              {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          )}
          {locationType === "department" && (
            <select className="input mt-2" value={selectedDepartmentId} onChange={e => setSelectedDepartmentId(e.target.value)}>
              <option value="">Select department...</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          {locationType === "other" && (
            <input
              className="input mt-2"
              placeholder="e.g. 2nd Floor Corridor near Room 12"
              value={customLocation}
              onChange={e => setCustomLocation(e.target.value)}
            />
          )}
        </div>

        {/* 2. What category is this? */}
        <div>
          <label className="text-sm font-semibold block mb-2">What category is this? *</label>
          <select
            className="input"
            value={category}
            onChange={e => { setCategory(e.target.value); setCustomCategory(""); }}
          >
            <option value="">Select category...</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {category === "OTHER" && (
            <input
              className="input mt-2"
              placeholder="Specify category..."
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value)}
            />
          )}
        </div>

        {/* 3. What's the issue? */}
        <div>
          <label className="text-sm font-semibold block mb-2">What&apos;s the issue? *</label>
          <input
            className="input"
            placeholder="e.g. AC not cooling, Bed motor broken"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* 4. Details */}
        <div>
          <label className="text-sm font-semibold block mb-2">Details (optional)</label>
          <textarea
            className="input"
            rows={3}
            placeholder="Any additional details..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* 5. Priority */}
        <div>
          <label className="text-sm font-semibold block mb-2">Priority</label>
          <div className="flex gap-3">
            {[
              { value: "NORMAL", label: "Normal", color: "border-gray-300 hover:bg-gray-50" },
              { value: "URGENT", label: "Urgent", color: "border-amber-400 hover:bg-amber-50" },
              { value: "MOST_URGENT", label: "Most Urgent", color: "border-red-400 hover:bg-red-50" }
            ].map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-semibold transition ${
                  priority === p.value
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : p.color + " text-gray-600"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Submit */}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
}
