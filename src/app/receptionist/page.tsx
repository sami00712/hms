"use client";

import { useEffect, useState } from "react";

type Appointment = {
  id: string;
  date: string;
  status: string;
  patient: { name: string; mrNumber: string };
  doctor: { name: string; specialty?: string };
};

export default function ReceptionistDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/api/appointments?date=${today}`).then((r) => r.json()).then(setAppointments);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Front Desk</h1>
      <p className="text-gray-500 mb-6">Register patients, book appointments and manage billing</p>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <a href="/receptionist/patients" className="card hover:shadow-md transition block">
          <p className="font-semibold">Register / Search Patients</p>
          <p className="text-sm text-gray-500 mt-1">Add new patients or search existing records</p>
        </a>
        <a href="/receptionist/appointments" className="card hover:shadow-md transition block">
          <p className="font-semibold">Book Appointment</p>
          <p className="text-sm text-gray-500 mt-1">Schedule patients with available doctors</p>
        </a>
        <a href="/receptionist/billing" className="card hover:shadow-md transition block">
          <p className="font-semibold">Billing</p>
          <p className="text-sm text-gray-500 mt-1">Create invoices and record payments</p>
        </a>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b font-semibold text-sm">Today's Appointments</div>
        <table className="data-table w-full">
          <thead>
            <tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Status</th></tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                <td>{a.patient.name} <span className="text-gray-400">({a.patient.mrNumber})</span></td>
                <td>{a.doctor.name}</td>
                <td>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">{a.status}</span>
                </td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr><td colSpan={4} className="text-center text-gray-400 py-6">No appointments today</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
