"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type OPDVisit = {
  id: string;
  tokenNumber: number;
  patient: { name: string; mrNumber: string };
  doctor: { name: string } | null;
  serviceRate: { name: string; price: number };
  status: string;
  visitDate: string;
};

export default function PrintOPDPage() {
  const { id } = useParams();
  const [visit, setVisit] = useState<OPDVisit | null>(null);

  useEffect(() => {
    fetch(`/api/opd-visits/${id}`)
      .then(r => r.json())
      .then(setVisit);
  }, [id]);

  if (!visit) return <div className="py-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <div className="w-full max-w-md border-2 border-gray-800 rounded-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">HMS</h1>
          <p className="text-gray-500">Hospital Management System</p>
        </div>

        <div className="border-t border-b border-gray-300 py-6 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">OPD Token</p>
            <p className="text-6xl font-bold text-brand-600">#{visit.tokenNumber}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-500">Patient</span>
            <span className="font-medium">{visit.patient.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">MR Number</span>
            <span>{visit.patient.mrNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Service</span>
            <span>{visit.serviceRate.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Doctor</span>
            <span>{visit.doctor?.name || "Unassigned"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span>{new Date(visit.visitDate).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Time</span>
            <span>{new Date(visit.visitDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span>{visit.status}</span>
          </div>
          <div className="flex justify-between border-t pt-4 mt-4">
            <span className="font-semibold">Amount</span>
            <span className="font-bold">PKR{visit.serviceRate.price.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button onClick={() => window.print()} className="btn-primary">Print Token</button>
        </div>
      </div>
    </div>
  );
}