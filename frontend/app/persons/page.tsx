"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  PlusCircle,
  Download,
  Edit2,
  Trash2,
  ArrowRight,
  Phone,
  Calendar,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { api, Person, formatCurrency, formatDate } from "@/lib/api";
import PersonModal from "@/components/PersonModal";
import ConfirmModal from "@/components/ConfirmModal";

export default function PersonsPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchPersons = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getPersons();
      setPersons(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load donors");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, []);

  // Filter & sort
  const filteredAndSortedPersons = useMemo(() => {
    let result = [...persons];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.contact && p.contact.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "highest_amount") {
        return b.total_amount_given - a.total_amount_given;
      }
      if (sortBy === "lowest_amount") {
        return a.total_amount_given - b.total_amount_given;
      }
      if (sortBy === "highest_spent") {
        return b.total_spent - a.total_spent;
      }
      if (sortBy === "lowest_balance") {
        return a.remaining_balance - b.remaining_balance;
      }
      if (sortBy === "name_asc") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return result;
  }, [persons, searchQuery, sortBy]);

  const handleDeleteConfirm = async () => {
    if (!personToDelete) return;
    setIsDeleting(true);
    try {
      await api.deletePerson(personToDelete.id);
      setPersons((prev) => prev.filter((p) => p.id !== personToDelete.id));
      setPersonToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete donor");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPdf = async (person: Person) => {
    setDownloadingId(person.id);
    try {
      await api.downloadPdf(person.id, person.name);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-600" />
            <span>Donors &amp; Contributor Accounts</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage donors, record their total funds, and oversee individual expense balances.
          </p>
        </div>

        <button
          onClick={() => {
            setPersonToEdit(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition-all shadow-sm active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Donor</span>
        </button>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by donor name or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-500 hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_amount">Highest Given</option>
            <option value="lowest_amount">Lowest Given</option>
            <option value="highest_spent">Most Spent</option>
            <option value="lowest_balance">Lowest Balance</option>
            <option value="name_asc">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Failed to load donors</h4>
            <p className="text-xs mt-1">{error}</p>
            <button
              onClick={fetchPersons}
              className="mt-2 text-xs font-semibold text-red-700 underline hover:text-red-900"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Donors Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-9 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredAndSortedPersons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAndSortedPersons.map((person) => {
            const isDeficit = person.remaining_balance < 0;
            return (
              <div
                key={person.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5">
                  {/* Top Bar: Avatar, Name & Options */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base shrink-0 shadow-inner">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Link
                          href={`/persons/${person.id}`}
                          className="font-semibold text-slate-900 hover:text-emerald-700 transition-colors line-clamp-1 text-base"
                        >
                          {person.name}
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          {person.contact ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {person.contact}
                            </span>
                          ) : (
                            <span className="italic text-slate-400">No phone</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formatDate(person.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setPersonToEdit(person);
                          setIsAddModalOpen(true);
                        }}
                        title="Edit Donor"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPersonToDelete(person)}
                        title="Delete Donor"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Financial Metrics Strip */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Given
                      </span>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5">
                        {formatCurrency(person.total_amount_given)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Spent
                      </span>
                      <span className="text-xs font-bold text-amber-700 block mt-0.5">
                        {formatCurrency(person.total_spent)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Remaining
                      </span>
                      <span
                        className={`text-xs font-bold block mt-0.5 ${
                          isDeficit ? "text-red-600" : "text-emerald-700"
                        }`}
                      >
                        {formatCurrency(person.remaining_balance)}
                      </span>
                    </div>
                  </div>

                  {/* Entry Count pill */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {person.entries_count} expense {person.entries_count === 1 ? "entry" : "entries"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${
                        isDeficit
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {isDeficit ? "Over-budget" : "Balance in Hand"}
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="bg-slate-50/70 border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleDownloadPdf(person)}
                    disabled={downloadingId === person.id}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700 hover:bg-white px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                  >
                    {downloadingId === person.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>PDF Statement</span>
                  </button>

                  <Link
                    href={`/persons/${person.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 group"
                  >
                    <span>Manage Expenses</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">
            {searchQuery ? "No matching donors found" : "No donors registered yet"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {searchQuery
              ? `We couldn't find any donors matching "${searchQuery}". Try a different name or phone number.`
              : "Start by registering your first donor to track funds and itemized expenses."}
          </p>
          <button
            onClick={() => {
              if (searchQuery) {
                setSearchQuery("");
              } else {
                setPersonToEdit(null);
                setIsAddModalOpen(true);
              }
            }}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            {searchQuery ? "Clear Search" : "+ Add First Donor"}
          </button>
        </div>
      )}

      {/* Add / Edit Person Modal */}
      <PersonModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setPersonToEdit(null);
        }}
        personToEdit={personToEdit}
        onSuccess={() => {
          setIsAddModalOpen(false);
          setPersonToEdit(null);
          fetchPersons();
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!personToDelete}
        onClose={() => setPersonToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Donor Record?"
        message={`Are you sure you want to delete ${personToDelete?.name}? This action is irreversible and will permanently delete all associated expense entries.`}
        confirmText="Delete Donor"
        isDestructive={true}
      />
    </div>
  );
}
