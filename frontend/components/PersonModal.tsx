"use client";

import { useState, useEffect } from "react";
import { X, Loader2, User, Phone, DollarSign } from "lucide-react";
import { api, Person } from "@/lib/api";

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (person: Person) => void;
  personToEdit?: Person | null;
}

export default function PersonModal({
  isOpen,
  onClose,
  onSuccess,
  personToEdit,
}: PersonModalProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [totalAmountGiven, setTotalAmountGiven] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (personToEdit) {
      setName(personToEdit.name);
      setContact(personToEdit.contact || "");
      setTotalAmountGiven(personToEdit.total_amount_given.toString());
    } else {
      setName("");
      setContact("");
      setTotalAmountGiven("");
    }
    setError(null);
  }, [personToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Person name is required.");
      return;
    }

    const parsedAmount = parseFloat(totalAmountGiven);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setError("Please provide a valid total amount given (must be 0 or higher).");
      return;
    }

    setIsSubmitting(true);
    try {
      if (personToEdit) {
        const updated = await api.updatePerson(personToEdit.id, {
          name: trimmedName,
          contact: contact.trim() || undefined,
          total_amount_given: parsedAmount,
        });
        onSuccess(updated);
      } else {
        const created = await api.createPerson({
          name: trimmedName,
          contact: contact.trim() || undefined,
          total_amount_given: parsedAmount,
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save person record");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-800">
              {personToEdit ? "Edit Person" : "Add New Person"}
            </h2>
            <p className="text-xs text-slate-500">
              {personToEdit
                ? "Update person details or total contribution amount"
                : "Register a person for Usmania Children Home"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Person Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. Haji Muhammad Rashid"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
              />
            </div>
          </div>

          {/* Contact */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Contact / Phone <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="e.g. 0300-1234567"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
              />
            </div>
          </div>

          {/* Total Amount Given */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Total Amount Given (Rs.) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="e.g. 50000"
                value={totalAmountGiven}
                onChange={(e) => setTotalAmountGiven(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Initial total budget / contribution given by this person.
            </p>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{personToEdit ? "Update Person" : "Save Person"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
