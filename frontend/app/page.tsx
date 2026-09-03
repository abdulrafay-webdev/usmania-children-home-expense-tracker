"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Wallet,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  PlusCircle,
  FileText,
  RefreshCw,
} from "lucide-react";
import { api, DashboardSummary, formatCurrency, formatDate } from "@/lib/api";
import PersonModal from "@/components/PersonModal";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-semibold tracking-wide uppercase text-emerald-300 mb-3">
            Financial Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Usmania Children Home
          </h1>
          <p className="mt-2 text-slate-200 text-sm sm:text-base leading-relaxed">
            Real-time donation management, transparent line-item expense tracking,
            and automatic remaining balance calculations.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              onClick={() => setIsAddPersonOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm rounded-xl transition-all shadow-md active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register New Person</span>
            </button>
            <Link
              href="/persons"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-xl transition-colors backdrop-blur border border-white/10"
            >
              <Users className="w-4 h-4" />
              <span>View All Persons</span>
            </Link>
            <button
              onClick={fetchSummary}
              title="Refresh data"
              className="self-end sm:self-auto p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors backdrop-blur border border-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 -bottom-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Failed to connect to backend</h4>
            <p className="text-xs mt-1">{error}</p>
            <button
              onClick={fetchSummary}
              className="mt-3 text-xs font-semibold text-red-700 underline hover:text-red-900"
            >
              Try reconnecting
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton / Metric Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-white rounded-2xl border border-slate-200 p-5 animate-pulse flex flex-col justify-between"
            >
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-7 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Persons */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Persons
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {summary.total_persons}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Active persons registered
              </p>
            </div>
          </div>

          {/* Card 2: Total Amount Collected */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Collected
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {formatCurrency(summary.total_amount_collected)}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Sum of all person allocations
              </p>
            </div>
          </div>

          {/* Card 3: Total Spent */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Spent
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {formatCurrency(summary.total_spent)}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Total itemized expenditures
              </p>
            </div>
          </div>

          {/* Card 4: Net Remaining Balance */}
          <div
            className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between ${
              summary.total_remaining >= 0
                ? "bg-emerald-50/50 border-emerald-200"
                : "bg-red-50/50 border-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  summary.total_remaining >= 0
                    ? "text-emerald-700"
                    : "text-red-700"
                }`}
              >
                Remaining Balance
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  summary.total_remaining >= 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span
                className={`text-2xl sm:text-3xl font-bold ${
                  summary.total_remaining >= 0
                    ? "text-emerald-800"
                    : "text-red-800"
                }`}
              >
                {formatCurrency(summary.total_remaining)}
              </span>
              <p
                className={`text-xs mt-1 ${
                  summary.total_remaining >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {summary.total_remaining >= 0
                  ? "Available funds in reserve"
                  : "Over-budget / deficit balance"}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Two Column Layout: Recent Persons + Recent Expense Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Recent Persons */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Recent Persons
              </h2>
              <p className="text-xs text-slate-500">
                Latest registered persons for Usmania Children Home
              </p>
            </div>
            <Link
              href="/persons"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 group"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : summary?.recent_persons && summary.recent_persons.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {summary.recent_persons.map((person) => (
                <Link
                  key={person.id}
                  href={`/persons/${person.id}`}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50/70 -mx-3 px-3 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm shrink-0">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {person.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {person.contact || "No contact"} • {person.entries_count} entries
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-800 block">
                      {formatCurrency(person.total_amount_given)}
                    </span>
                    <span
                      className={`text-[11px] font-medium ${
                        person.remaining_balance >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      Rem: {formatCurrency(person.remaining_balance)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm">No persons registered yet.</p>
              <button
                onClick={() => setIsAddPersonOpen(true)}
                className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                + Add your first person
              </button>
            </div>
          )}
        </div>

        {/* Recent Expense Entries */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Recent Expense Entries
              </h2>
              <p className="text-xs text-slate-500">
                Latest goods and services purchased
              </p>
            </div>
            <span className="text-xs font-medium text-slate-400">
              Live updates
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : summary?.recent_entries && summary.recent_entries.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {summary.recent_entries.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50/70 -mx-3 px-3 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {entry.item_name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        Person:{" "}
                        <Link
                          href={`/persons/${entry.person_id}`}
                          className="font-medium text-emerald-700 hover:underline"
                        >
                          {entry.person_name}
                        </Link>{" "}
                        • {formatDate(entry.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="text-sm font-bold text-slate-900 block">
                      {formatCurrency(entry.line_total)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {entry.quantity} @ {formatCurrency(entry.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm">No expenses recorded yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Open a person&apos;s page to log expenditures.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Person Modal */}
      <PersonModal
        isOpen={isAddPersonOpen}
        onClose={() => setIsAddPersonOpen(false)}
        onSuccess={() => {
          setIsAddPersonOpen(false);
          fetchSummary();
        }}
      />
    </div>
  );
}
