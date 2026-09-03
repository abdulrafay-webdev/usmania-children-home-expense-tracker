"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Package, Tag, Calculator, FileText } from "lucide-react";
import { api, Entry, formatCurrency } from "@/lib/api";

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (entry: Entry) => void;
  personId: number;
  entryToEdit?: Entry | null;
}

export default function EntryModal({
  isOpen,
  onClose,
  onSuccess,
  personId,
  entryToEdit,
}: EntryModalProps) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState<string>("1");
  const [itemQuality, setItemQuality] = useState("");
  const [price, setPrice] = useState<string>("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (entryToEdit) {
      setItemName(entryToEdit.item_name);
      setQuantity(entryToEdit.quantity.toString());
      setItemQuality(entryToEdit.item_quality || "");
      setPrice(entryToEdit.price.toString());
      setNote(entryToEdit.note || "");
    } else {
      setItemName("");
      setQuantity("1");
      setItemQuality("");
      setPrice("");
      setNote("");
    }
    setError(null);
  }, [entryToEdit, isOpen]);

  if (!isOpen) return null;

  const parsedQty = parseFloat(quantity) || 0;
  const parsedPrice = parseFloat(price) || 0;
  const lineTotal = parsedQty * parsedPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = itemName.trim();
    if (!trimmedName) {
      setError("Item name / description is required.");
      return;
    }

    if (parsedQty <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    if (parsedPrice < 0) {
      setError("Unit price cannot be negative.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (entryToEdit) {
        const updated = await api.updateEntry(entryToEdit.id, {
          item_name: trimmedName,
          quantity: parsedQty,
          item_quality: itemQuality.trim() || undefined,
          price: parsedPrice,
          note: note.trim() || undefined,
        });
        onSuccess(updated);
      } else {
        const created = await api.createEntry(personId, {
          item_name: trimmedName,
          quantity: parsedQty,
          item_quality: itemQuality.trim() || undefined,
          price: parsedPrice,
          note: note.trim() || undefined,
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save expense entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {entryToEdit ? "Edit Expense Entry" : "Add Expense Entry"}
            </h2>
            <p className="text-xs text-slate-500">
              Record an expenditure item under this donor&apos;s funds
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Item Name / Description <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Package className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. Rice Bags (50kg), School Uniforms, Medicines"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
              />
            </div>
          </div>

          {/* Quality & Note in row or grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
              />
            </div>

            {/* Price Per Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Unit Price (Rs. / unit) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="e.g. 2500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
              />
            </div>
          </div>

          {/* Item Quality */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Item Quality / Grade <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="e.g. Branded, Super Basmati, Local, Grade A"
                value={itemQuality}
                onChange={(e) => setItemQuality(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Additional Note <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                placeholder="e.g. Purchased for junior boys hostel, invoice #884"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
              />
            </div>
          </div>

          {/* Real-time Calculation Summary Box */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-emerald-800">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Calculated Line Total
                </p>
                <p className="text-xs text-emerald-600">
                  {parsedQty || 0} qty × {formatCurrency(parsedPrice || 0)} / unit
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-emerald-900">
                {formatCurrency(lineTotal)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{entryToEdit ? "Update Entry" : "Save Entry"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
