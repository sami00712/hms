"use client";

import { useEffect, useState } from "react";

type Bed = {
  id: string;
  wardId: string;
  ward: { id: string; name: string };
  bedNumber: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  admissions: { patient: { name: string; mrNumber: string } }[];
};

type Ward = {
  id: string;
  name: string;
  beds: Bed[];
};

export default function AdminWardsPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWardForm, setShowWardForm] = useState(false);
  const [showBedForm, setShowBedForm] = useState(false);
  const [selectedWardId, setSelectedWardId] = useState("");
  const [wardName, setWardName] = useState("");
  const [bedNumber, setBedNumber] = useState("");

  async function fetchWards() {
    const res = await fetch("/api/wards");
    if (res.ok) setWards(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchWards(); }, []);

  async function createWard() {
    if (!wardName.trim()) return;
    const res = await fetch("/api/wards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: wardName.trim() })
    });
    if (res.ok) {
      setWardName("");
      setShowWardForm(false);
      fetchWards();
    } else alert("Failed to create ward");
  }

  async function addBed() {
    if (!selectedWardId || !bedNumber.trim()) return;
    const res = await fetch("/api/beds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wardId: selectedWardId, bedNumber: bedNumber.trim() })
    });
    if (res.ok) {
      setBedNumber("");
      setShowBedForm(false);
      setSelectedWardId("");
      fetchWards();
    } else alert("Failed to add bed");
  }

  async function changeBedStatus(bed: Bed, newStatus: Bed["status"]) {
    const res = await fetch(`/api/beds/${bed.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) fetchWards();
  }

  const statusColors: Record<string, string> = {
    AVAILABLE: "bg-green-50 text-green-600",
    OCCUPIED: "bg-red-50 text-red-600",
    MAINTENANCE: "bg-yellow-50 text-yellow-600"
  };

  if (loading) return <div className="py-8 text-center">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Wards & Beds</h1>
          <p className="text-gray-500">Manage wards, beds, and their availability</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowWardForm(true)} className="btn-primary">+ Add Ward</button>
          <button onClick={() => setShowBedForm(true)} className="btn-secondary">+ Add Bed</button>
        </div>
      </div>

      {showWardForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Ward</h2>
          <div className="flex gap-3 max-w-md">
            <input type="text" className="input flex-1" placeholder="Ward name (e.g. General Ward, ICU)" value={wardName} onChange={e => setWardName(e.target.value)} />
            <button onClick={createWard} className="btn-primary">Create</button>
            <button onClick={() => setShowWardForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {showBedForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Bed</h2>
          <div className="flex gap-3 max-w-xl flex-wrap">
            <select className="input" value={selectedWardId} onChange={e => setSelectedWardId(e.target.value)}>
              <option value="">Select Ward</option>
              {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <input type="text" className="input w-40" placeholder="Bed number (e.g. 1, A-1)" value={bedNumber} onChange={e => setBedNumber(e.target.value)} />
            <button onClick={addBed} className="btn-primary">Add</button>
            <button onClick={() => { setShowBedForm(false); setSelectedWardId(""); setBedNumber(""); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {wards.map(ward => (
        <div key={ward.id} className="card mb-6">
          <h3 className="text-lg font-semibold p-4 border-b">{ward.name} ({ward.beds.length} beds)</h3>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr><th>Bed #</th><th>Status</th><th>Current Patient</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {ward.beds.map(bed => {
                    const currentAdmission = bed.admissions?.[0];
                    return (
                      <tr key={bed.id}>
                        <td>{bed.bedNumber}</td>
                        <td>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[bed.status]}`}>
                            {bed.status}
                          </span>
                        </td>
                        <td>
                          {currentAdmission ? (
                            <span>{currentAdmission.patient.name} ({currentAdmission.patient.mrNumber})</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            {bed.status !== "AVAILABLE" && (
                              <button
                                onClick={() => changeBedStatus(bed, "AVAILABLE")}
                                className="text-xs btn-secondary"
                              >
                                Available
                              </button>
                            )}
                            {bed.status !== "MAINTENANCE" && (
                              <button
                                onClick={() => changeBedStatus(bed, "MAINTENANCE")}
                                className="text-xs btn-secondary"
                              >
                                Maintenance
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {ward.beds.length === 0 && <tr><td colSpan={4} className="text-center text-gray-400 py-4">No beds in this ward</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {wards.length === 0 && <div className="card p-8 text-center text-gray-400">No wards configured. Click "Add Ward" to get started.</div>}
    </div>
  );
}