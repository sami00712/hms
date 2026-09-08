"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SalaryRecord = {
  id: string;
  userId: string;
  user: { id: string; name: string; role: string; department: { name: string } | null };
  month: number;
  year: number;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netPay: number;
  status: string;
  paidAt?: string;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function PayrollPage() {
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [baseSalary, setBaseSalary] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { load(); loadUsers(); }, [month, year]);

  async function load() {
    const res = await fetch(`/api/salary-records?month=${month}&year=${year}`);
    const data = await res.json();
    setRecords(data);
  }

  async function loadUsers() {
    const res = await fetch("/api/users?role=DOCTOR");
    const docData = await res.json();
    const recRes = await fetch("/api/users?role=RECEPTIONIST");
    const recData = await recRes.json();
    const labRes = await fetch("/api/users?role=LAB");
    const labData = await labRes.json();
    const phRes = await fetch("/api/users?role=PHARMACIST");
    const phData = await phRes.json();
    setUsers([...docData, ...recData, ...labData, ...phData]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!userId || !baseSalary) return;
    const res = await fetch("/api/salary-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, month, year, baseSalary, bonus, deductions })
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error);
      return;
    }
    setUserId(""); setBaseSalary(0); setBonus(0); setDeductions(0);
    load();
  }

  async function handleMarkPaid(id: string) {
    await fetch(`/api/salary-records/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID", paidAt: new Date().toISOString() })
    });
    load();
  }

  function setQuickMonth(offset: number) {
    const now = new Date();
    let m = now.getMonth() + 1 + offset;
    let y = now.getFullYear();
    while (m < 1) { m += 12; y--; }
    while (m > 12) { m -= 12; y++; }
    setMonth(m);
    setYear(y);
  }

  const totalPayroll = records.reduce((sum: number, r: SalaryRecord) => sum + r.netPay, 0);
  const unpaidCount = records.filter((r: SalaryRecord) => r.status === "UNPAID").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Payroll</h1>
          <p className="text-gray-500">Manage staff salaries</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setQuickMonth(0)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${month === new Date().getMonth() + 1 && year === new Date().getFullYear() ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          This Month
        </button>
        <button onClick={() => setQuickMonth(-1)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${month === ((new Date().getMonth()) % 12) + 1 && year === (new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()) ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          Last Month
        </button>
        <button onClick={() => setQuickMonth(-2)} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
          2 Months Ago
        </button>
        <button onClick={() => setQuickMonth(-3)} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
          3 Months Ago
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Total Payroll</p>
          <p className="text-2xl font-bold">PKR {totalPayroll.toLocaleString()}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Month</p>
          <p className="text-2xl font-bold">{MONTHS[month - 1]} {year}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Unpaid Records</p>
          <p className="text-2xl font-bold text-amber-600">{unpaidCount}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
        <h2 className="font-semibold">Generate Salary Record</h2>
        <div className="grid md:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium">Staff</label>
            <select className="input mt-1" value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">Select staff...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Month</label>
            <input type="number" min="1" max="12" className="input mt-1" value={month} onChange={(e) => setMonth(parseInt(e.target.value))} />
          </div>
          <div>
            <label className="text-sm font-medium">Year</label>
            <input type="number" className="input mt-1" value={year} onChange={(e) => setYear(parseInt(e.target.value))} />
          </div>
          <div>
            <label className="text-sm font-medium">Base Salary</label>
            <input type="number" required className="input mt-1" value={baseSalary} onChange={(e) => setBaseSalary(parseFloat(e.target.value))} />
          </div>
          <div>
            <label className="text-sm font-medium">Bonus</label>
            <input type="number" className="input mt-1" value={bonus} onChange={(e) => setBonus(parseFloat(e.target.value))} />
          </div>
          <div>
            <label className="text-sm font-medium">Deductions</label>
            <input type="number" className="input mt-1" value={deductions} onChange={(e) => setDeductions(parseFloat(e.target.value))} />
          </div>
        </div>
        <button type="submit" className="btn-primary">Generate Salary</button>
        {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
      </form>

      <div className="card p-0 overflow-hidden">
        <table className="data-table w-full">
          <thead><tr><th>Staff</th><th>Month/Year</th><th>Base</th><th>Bonus</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{r.user.name} ({r.user.role})</td>
                <td>{MONTHS[r.month - 1]} {r.year}</td>
                <td>PKR {r.baseSalary}</td>
                <td>PKR {r.bonus}</td>
                <td>PKR {r.deductions}</td>
                <td className="font-semibold">PKR {r.netPay}</td>
                <td><span className={`text-xs px-2 py-1 rounded-full ${r.status === "PAID" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>{r.status}</span></td>
                <td>
                  {r.status !== "PAID" && <button onClick={() => handleMarkPaid(r.id)} className="btn-secondary text-xs py-1 bg-green-50 text-green-600">Mark Paid</button>}
                </td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={8} className="text-center text-gray-400 py-6">No salary records found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
