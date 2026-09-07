"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type OPDVisit = {
  id: string;
  tokenNumber: number;
  patient: { id: string; name: string; mrNumber: string };
  doctor: { name: string } | null;
  serviceRate: { name: string; price: number };
  status: string;
  visitDate: string;
};

type CurrentUser = { id: string; name: string; role: string; specialty: string | null };

export default function DoctorOPDPage() {
  const router = useRouter();
  const [visits, setVisits] = useState<OPDVisit[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(setCurrentUser);
    fetchOPDVisits();
  }, []);

  async function fetchOPDVisits() {
    const res = await fetch("/api/opd-visits");
    if (res.ok) setVisits(await res.json());
  }

  const activeVisits = visits.filter(v => v.status === "WAITING" || v.status === "IN_CONSULTATION");

  async function startConsultation(id: string) {
    if (!currentUser) return;
    const res = await fetch(`/api/opd-visits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_CONSULTATION", doctorId: currentUser.id })
    });
    if (res.ok) fetchOPDVisits();
  }

  async function completeConsultation(id: string) {
    const res = await fetch(`/api/opd-visits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" })
    });
    if (res.ok) fetchOPDVisits();
  }

  const statusColors: Record<string, string> = {
    WAITING: "bg-blue-50 text-blue-600",
    IN_CONSULTATION: "bg-amber-50 text-amber-600",
    COMPLETED: "bg-green-50 text-green-600",
    CANCELLED: "bg-red-50 text-red-600"
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">OPD Queue</h1>
          <p className="text-gray-500">Manage today's OPD patients</p>
        </div>
        <button onClick={fetchOPDVisits} className="btn-secondary">Refresh</button>
      </div>

      {activeVisits.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">No OPD patients in queue</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="data-table w-full">
            <thead><tr><th>Token</th><th>Patient</th><th>Service</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {activeVisits.map(v => (
                <tr key={v.id}>
                  <td className="font-bold">#{v.tokenNumber}</td>
                  <td>{v.patient.name} <span className="text-gray-400">({v.patient.mrNumber})</span></td>
                  <td>{v.serviceRate.name}</td>
                  <td><span className={`text-xs px-2 py-1 rounded-full ${statusColors[v.status]}`}>{v.status}</span></td>
                  <td>
                    <div className="flex gap-2">
                      {v.status === "WAITING" && (
                        <button onClick={() => startConsultation(v.id)} className="text-brand-600 text-sm hover:underline">Start</button>
                      )}
                      {v.status === "IN_CONSULTATION" && (
                        <button onClick={() => completeConsultation(v.id)} className="text-green-600 text-sm hover:underline">Complete</button>
                      )}
                      <a href={`/doctor/patients/${v.patient.id}?opdVisitId=${v.id}`} className="text-brand-600 text-sm hover:underline">Open Chart</a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}