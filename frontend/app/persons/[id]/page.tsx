"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  PlusCircle,
  Edit2,
  Trash2,
  Phone,
  Calendar,
  Wallet,
  TrendingDown,
  Search,
  Package,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  api,
  PersonDetail,
  Entry,
  formatCurrency,
  formatDate,
} from "@/lib/api";
import EntryModal from "@/components/EntryModal";
import PersonModal from "@/components/PersonModal";
import ConfirmModal from "@/components/ConfirmModal";

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const personId = Number(params.id);

  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<Entry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<Entry | null>(null);
  const [isDeletingEntry, setIsDeletingEntry] = useState(false);

  const [isEditPersonOpen, setIsEditPersonOpen] = useState(false);
  const [isDeletePersonOpen, setIsDeletePersonOpen] = useState(false);
  const [isDeletingPerson, setIsDeletingPerson] = useState(false);

  const fetchPersonDetail = useCallback(async () => {
    if (isNaN(personId)) {
      setError("Invalid person ID.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getPerson(personId);
      setPerson(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load person details");
    } finally {
      setIsLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    fetchPersonDetail();
  }, [fetchPersonDetail]);

  // Compute live values
  const totalSpent = useMemo(() => {
    if (!person?.entries) return 0;
    return person.entries.reduce((sum, e) => sum + e.quantity * e.price, 0);
  }, [person?.entries]);

  const remainingBalance = useMemo(() => {
    if (!person) return 0;
    return person.total_amount_given - totalSpent;
  }, [person, totalSpent]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    if (!person?.entries) return [];
    if (!searchQuery.trim()) return person.entries;
    const q = searchQuery.toLowerCase().trim();
    return person.entries.filter(
      (e) =>
        e.item_name.toLowerCase().includes(q) ||
        (e.item_quality && e.item_quality.toLowerCase().includes(q)) ||
        (e.note && e.note.toLowerCase().includes(q))
    );
  }, [person?.entries, searchQuery]);

  // Entry handlers
  const handleEntrySuccess = (savedEntry: Entry) => {
    setPerson((prev) => {
      if (!prev) return null;
      const exists = prev.entries.some((e) => e.id === savedEntry.id);
      let updatedEntries: Entry[];
      if (exists) {
        updatedEntries = prev.entries.map((e) =>
          e.id === savedEntry.id ? savedEntry : e
        );
      } else {
        updatedEntries = [savedEntry, ...prev.entries];
      }
      const newSpent = updatedEntries.reduce(
        (sum, e) => sum + e.quantity * e.price,
        0
      );
      return {
        ...prev,
        entries: updatedEntries,
        total_spent: newSpent,
        remaining_balance: prev.total_amount_given - newSpent,
        entries_count: updatedEntries.length,
      };
    });
  };

  const handleDeleteEntryConfirm = async () => {
    if (!entryToDelete) return;
    setIsDeletingEntry(true);
    try {
      await api.deleteEntry(entryToDelete.id);
      setPerson((prev) => {
        if (!prev) return null;
        const updatedEntries = prev.entries.filter(
          (e) => e.id !== entryToDelete.id
        );
        const newSpent = updatedEntries.reduce(
          (sum, e) => sum + e.quantity * e.price,
          0
        );
        return {
          ...prev,
          entries: updatedEntries,
          total_spent: newSpent,
          remaining_balance: prev.total_amount_given - newSpent,
          entries_count: updatedEntries.length,
        };
      });
      setEntryToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete entry");
    } finally {
      setIsDeletingEntry(false);
    }
  };

  // Person handlers
  const handleDeletePersonConfirm = async () => {
    if (!person) return;
    setIsDeletingPerson(true);
    try {
      await api.deletePerson(person.id);
      router.push("/persons");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete person record");
      setIsDeletingPerson(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!person) return;
    setIsDownloadingPdf(true);
    try {
      await api.downloadPdf(person.id, person.name);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to download PDF");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse" />
        <div className="h-44 bg-white rounded-2xl border border-slate-200 p-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 bg-white rounded-2xl border border-slate-200 p-5 animate-pulse"
            />
          ))}
        </div>
        <div className="h-96 bg-white rounded-2xl border border-slate-200 p-6 animate-pulse" />
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Person Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          {error || "The requested person account could not be found or has been removed."}
        </p>
        <Link
          href="/persons"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Persons List</span>
        </Link>
      </div>
    );
  }

  const isDeficit = remainingBalance < 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/persons"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Persons List</span>
        </Link>
        <span className="text-xs text-slate-400">Account #{person.id}</span>
      </div>

      {/* Main Person Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Person Details */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-md shadow-emerald-200">
              {person.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {person.name}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isDeficit
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {isDeficit ? "Over-budget" : "Active Person"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5">
                {person.contact ? (
                  <span className="flex items-center gap-1 text-slate-700 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {person.contact}
                  </span>
                ) : (
                  <span className="italic text-slate-400">No phone provided</span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Recorded on {formatDate(person.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 active:scale-95"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <Download className="w-4 h-4 text-slate-600" />
              )}
              <span>Download Balance Statement</span>
            </button>

            <button
              onClick={() => {
                setEntryToEdit(null);
                setIsEntryModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-200 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Expense Entry</span>
            </button>

            <button
              onClick={() => setIsEditPersonOpen(true)}
              title="Edit Person Profile"
              className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsDeletePersonOpen(true)}
              title="Delete Person Record"
              className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Financial Overview Cards (Auto-updates live!) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Amount Given */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Funds Contributed
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {formatCurrency(person.total_amount_given)}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Initial person allocation
            </p>
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
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
              {formatCurrency(totalSpent)}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Sum of {person.entries.length} recorded entries
            </p>
          </div>
        </div>

        {/* Live Remaining Balance */}
        <div
          className={`rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition-colors ${
            !isDeficit
              ? "bg-emerald-50/70 border-emerald-300"
              : "bg-red-50/70 border-red-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                !isDeficit ? "text-emerald-800" : "text-red-800"
              }`}
            >
              Remaining Balance (Live)
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                !isDeficit
                  ? "bg-emerald-200/70 text-emerald-800"
                  : "bg-red-200/70 text-red-800"
              }`}
            >
              {!isDeficit ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl sm:text-3xl font-bold ${
                !isDeficit ? "text-emerald-900" : "text-red-900"
              }`}
            >
              {formatCurrency(remainingBalance)}
            </span>
            <p
              className={`text-xs mt-1 ${
                !isDeficit ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {!isDeficit
                ? "Available to spend"
                : "Deficit! Expenses exceed contribution"}
            </p>
          </div>
        </div>
      </div>

      {/* Expense Entries Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <span>Expense Entries</span>
              <span className="text-xs font-normal text-slate-500 ml-1">
                ({person.entries.length} items logged)
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Line items paid from this person&apos;s allocated funds
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
              />
            </div>

            <button
              onClick={() => {
                setEntryToEdit(null);
                setIsEntryModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Entry</span>
            </button>
          </div>
        </div>

        {/* Entries Table */}
        {filteredEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Item &amp; Description</th>
                  <th className="py-3 px-4">Quality / Grade</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Line Total</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((entry, idx) => {
                  const lineTotal = entry.quantity * entry.price;
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Row Index */}
                      <td className="py-3.5 px-4 text-center text-xs font-mono text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Item Name & Note */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">
                          {entry.item_name}
                        </span>
                        {entry.note && (
                          <span className="text-xs text-slate-500 block mt-0.5 italic">
                            {entry.note}
                          </span>
                        )}
                      </td>

                      {/* Quality */}
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {entry.item_quality ? (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                            {entry.item_quality}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                        {entry.quantity}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-4 text-right text-slate-600">
                        {formatCurrency(entry.price)}
                      </td>

                      {/* Line Total */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(lineTotal)}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(entry.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEntryToEdit(entry);
                              setIsEntryModalOpen(true);
                            }}
                            title="Edit Entry"
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEntryToDelete(entry)}
                            title="Delete Entry"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Grand Total Footer */}
              <tfoot>
                <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                  <td colSpan={5} className="py-3.5 px-4 text-right text-slate-700">
                    Grand Total Spent:
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-900 font-bold text-base">
                    {formatCurrency(totalSpent)}
                  </td>
                  <td colSpan={2} className="py-3.5 px-4 text-xs text-slate-500">
                    Remaining:{" "}
                    <span
                      className={`font-bold ${
                        !isDeficit ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(remainingBalance)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">
              {searchQuery ? "No entries match your search" : "No expense entries recorded yet"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No expense items found matching "${searchQuery}".`
                : `Start logging items purchased with ${person.name}'s contribution.`}
            </p>
            <button
              onClick={() => {
                if (searchQuery) {
                  setSearchQuery("");
                } else {
                  setEntryToEdit(null);
                  setIsEntryModalOpen(true);
                }
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              {searchQuery ? "Clear Search" : "+ Add First Expense Entry"}
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Entry Modal */}
      <EntryModal
        isOpen={isEntryModalOpen}
        onClose={() => {
          setIsEntryModalOpen(false);
          setEntryToEdit(null);
        }}
        personId={person.id}
        entryToEdit={entryToEdit}
        onSuccess={handleEntrySuccess}
      />

      {/* Delete Entry Confirmation Modal */}
      <ConfirmModal
        isOpen={!!entryToDelete}
        onClose={() => setEntryToDelete(null)}
        onConfirm={handleDeleteEntryConfirm}
        isLoading={isDeletingEntry}
        title="Delete Expense Entry?"
        message={`Are you sure you want to delete "${entryToDelete?.item_name}" (${formatCurrency(
          (entryToDelete?.quantity || 0) * (entryToDelete?.price || 0)
        )})? This will automatically restore the remaining balance.`}
        confirmText="Delete Entry"
        isDestructive={true}
      />

      {/* Edit Person Modal */}
      <PersonModal
        isOpen={isEditPersonOpen}
        onClose={() => setIsEditPersonOpen(false)}
        personToEdit={person}
        onSuccess={(updated) => {
          setPerson((prev) =>
            prev
              ? {
                  ...prev,
                  name: updated.name,
                  contact: updated.contact,
                  total_amount_given: updated.total_amount_given,
                  remaining_balance: updated.total_amount_given - totalSpent,
                }
              : null
          );
          setIsEditPersonOpen(false);
        }}
      />

      {/* Delete Person Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeletePersonOpen}
        onClose={() => setIsDeletePersonOpen(false)}
        onConfirm={handleDeletePersonConfirm}
        isLoading={isDeletingPerson}
        title="Delete Person Record?"
        message={`Are you sure you want to delete ${person.name}? All ${person.entries.length} expense entries under this person will be permanently removed.`}
        confirmText="Delete Person & Entries"
        isDestructive={true}
      />
    </div>
  );
}
