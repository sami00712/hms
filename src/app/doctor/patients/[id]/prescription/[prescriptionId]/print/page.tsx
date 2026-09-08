"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type PrescriptionData = {
  id: string;
  diagnosis: string | null;
  notes: string | null;
  createdAt: string;
  dispensed: boolean;
  patient: { name: string; mrNumber: string; gender: string; phone: string; dob: string | null };
  doctor: { name: string; specialty: string | null };
  items: { medicine: { name: string }; dosage: string; duration: string; quantity: number }[];
};

export default function PrescriptionPrintPage() {
  const params = useParams();
  const [rx, setRx] = useState<PrescriptionData | null>(null);

  useEffect(() => {
    fetch(`/api/prescriptions`)
      .then(r => r.json())
      .then((data: PrescriptionData[]) => {
        const found = data.find(p => p.id === params.prescriptionId);
        if (found) {
          setRx(found);
          setTimeout(() => window.print(), 400);
        }
      });
  }, [params.prescriptionId]);

  if (!rx) return <div className="py-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <div className="w-full max-w-sm border-2 border-gray-800 rounded-lg p-6">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold">HMS</h1>
          <p className="text-xs text-gray-500">Hospital Management System</p>
        </div>

        <div className="text-center mb-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold border-t border-b border-gray-300 py-1">Prescription</p>
        </div>

        <div className="space-y-1 border-b border-gray-300 pb-3 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Patient</span>
            <span className="font-medium">{rx.patient.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">MR #</span>
            <span>{rx.patient.mrNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Gender</span>
            <span>{rx.patient.gender}</span>
          </div>
          {rx.patient.dob && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Age</span>
              <span>{new Date().getFullYear() - new Date(rx.patient.dob).getFullYear()} years</span>
            </div>
          )}
        </div>

        <div className="space-y-1 border-b border-gray-300 pb-3 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Doctor</span>
            <span className="font-medium">Dr. {rx.doctor.name}</span>
          </div>
          {rx.doctor.specialty && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Specialty</span>
              <span>{rx.doctor.specialty}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date</span>
            <span>{new Date(rx.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {rx.diagnosis && (
          <div className="mb-3 border-b border-gray-300 pb-3">
            <p className="text-xs text-gray-500 uppercase mb-1">Diagnosis</p>
            <p className="text-sm font-medium">{rx.diagnosis}</p>
          </div>
        )}

        <div className="mb-3">
          <p className="text-xs text-gray-500 uppercase mb-2">Medicines</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1 text-xs text-gray-500">#</th>
                <th className="text-left py-1 text-xs text-gray-500">Medicine</th>
                <th className="text-left py-1 text-xs text-gray-500">Dosage</th>
                <th className="text-right py-1 text-xs text-gray-500">Qty</th>
              </tr>
            </thead>
            <tbody>
              {rx.items.map((it, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-1.5">{idx + 1}</td>
                  <td className="py-1.5 font-medium">{it.medicine.name}</td>
                  <td className="py-1.5 text-gray-600">{it.dosage}</td>
                  <td className="py-1.5 text-right">{it.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rx.notes && (
          <div className="mb-3 border-t border-gray-300 pt-3">
            <p className="text-xs text-gray-500 uppercase mb-1">Notes</p>
            <p className="text-sm text-gray-600">{rx.notes}</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-300">
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-gray-500">Doctor's Signature</p>
              <div className="mt-4 border-b border-gray-400 w-32"></div>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Date: {new Date(rx.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4 border-t pt-3">
          Please bring this prescription to the Pharmacy
        </p>

        <div className="mt-4 text-center no-print">
          <button onClick={() => window.print()} className="btn-primary">Print Prescription</button>
        </div>
      </div>
    </div>
  );
}
