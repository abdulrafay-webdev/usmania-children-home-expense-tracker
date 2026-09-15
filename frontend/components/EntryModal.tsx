"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Loader2,
  Package,
  Tag,
  Calculator,
  FileText,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { api, Entry, formatCurrency } from "@/lib/api";

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (entry: Entry) => void;
  personId: number;
  entryToEdit?: Entry | null;
}

interface AttachedInvoice {
  id: string;
  url?: string;
  file?: File;
  previewUrl: string;
  name: string;
  size?: number;
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

  // Multiple invoice pictures state
  const [invoices, setInvoices] = useState<AttachedInvoice[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (entryToEdit) {
      setItemName(entryToEdit.item_name);
      setQuantity(entryToEdit.quantity.toString());
      setItemQuality(entryToEdit.item_quality || "");
      setPrice(entryToEdit.price.toString());
      setNote(entryToEdit.note || "");

      // Load existing invoice URLs
      let existing: AttachedInvoice[] = [];
      const urls =
        entryToEdit.invoice_urls && entryToEdit.invoice_urls.length > 0
          ? entryToEdit.invoice_urls
          : entryToEdit.invoice_url
          ? [entryToEdit.invoice_url]
          : [];

      existing = urls.map((u, idx) => ({
        id: `saved-${idx}-${u}`,
        url: u,
        previewUrl: u,
        name: `Invoice #${idx + 1}`,
      }));
      setInvoices(existing);
    } else {
      setItemName("");
      setQuantity("1");
      setItemQuality("");
      setPrice("");
      setNote("");
      setInvoices([]);
    }
    setError(null);
    setUploadStatusText(null);
  }, [entryToEdit, isOpen]);

  if (!isOpen) return null;

  const parsedQty = parseFloat(quantity) || 0;
  const parsedPrice = parseFloat(price) || 0;
  const lineTotal = parsedQty * parsedPrice;

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newItems: AttachedInvoice[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 20 * 1024 * 1024) {
          setError(`File "${file.name}" is too large (maximum 20MB allowed).`);
          return;
        }
        newItems.push({
          id: `new-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
        });
      }
      setInvoices((prev) => [...prev, ...newItems]);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((item) => item.id !== id));
  };

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
      // 1. Separate new files to upload vs existing URLs
      const newFiles = invoices.filter((item) => item.file && !item.url).map((item) => item.file!);
      const existingUrls = invoices.filter((item) => item.url).map((item) => item.url!);

      let uploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        setUploadStatusText(
          `Uploading ${newFiles.length} invoice image${newFiles.length > 1 ? "s" : ""} to ImageKit...`
        );
        const uploadResponses = await api.uploadInvoices(newFiles);
        uploadedUrls = uploadResponses.map((r) => r.url);
      }

      const finalInvoiceUrls = [...existingUrls, ...uploadedUrls];
      const primaryInvoiceUrl = finalInvoiceUrls.length > 0 ? finalInvoiceUrls[0] : null;

      setUploadStatusText("Saving expense entry...");

      if (entryToEdit) {
        const updated = await api.updateEntry(entryToEdit.id, {
          item_name: trimmedName,
          quantity: parsedQty,
          item_quality: itemQuality.trim() || undefined,
          price: parsedPrice,
          note: note.trim() || undefined,
          invoice_url: primaryInvoiceUrl,
          invoice_urls: finalInvoiceUrls,
        });
        onSuccess(updated);
      } else {
        const created = await api.createEntry(personId, {
          item_name: trimmedName,
          quantity: parsedQty,
          item_quality: itemQuality.trim() || undefined,
          price: parsedPrice,
          note: note.trim() || undefined,
          invoice_url: primaryInvoiceUrl,
          invoice_urls: finalInvoiceUrls,
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save expense entry");
    } finally {
      setIsSubmitting(false);
      setUploadStatusText(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-800">
              {entryToEdit ? "Edit Expense Entry" : "Add Expense Entry"}
            </h2>
            <p className="text-xs text-slate-500">
              Record an expenditure item under this person&apos;s funds
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
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

          {/* Quantity & Price */}
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

          {/* Additional Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Additional Note <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                placeholder="e.g. Purchased for junior boys hostel, receipt #884"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
              />
            </div>
          </div>

          {/* Invoice / Bill Picture Attachment (ImageKit) - Multiple Images Supported */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Invoice / Bill Pictures ({invoices.length})</span>
              </label>
              <span className="text-slate-400 font-normal text-[11px]">(Optional • Multiple allowed)</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleFilesChange}
              className="hidden"
            />

            {invoices.length > 0 ? (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {invoices.map((inv, idx) => (
                    <div
                      key={inv.id}
                      className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/80 flex items-center gap-2.5 relative group hover:border-emerald-300 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={inv.previewUrl}
                          alt={inv.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 pr-1">
                        <div className="text-xs font-semibold text-slate-800 truncate" title={inv.name}>
                          #{idx + 1}. {inv.name}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {inv.file
                            ? `${(inv.file.size / 1024).toFixed(1)} KB • New`
                            : "Saved on Cloud"}
                        </p>
                        {inv.url && (
                          <a
                            href={inv.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-700 hover:text-emerald-800 font-medium mt-0.5"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>View Original</span>
                          </a>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveInvoice(inv.id)}
                        title="Remove this invoice"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 border border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>+ Add More Invoice Pictures</span>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 rounded-xl p-4 cursor-pointer transition-all text-center group"
              >
                <UploadCloud className="w-8 h-8 mx-auto text-slate-400 group-hover:text-emerald-600 transition-colors mb-1" />
                <p className="text-xs font-medium text-slate-700 group-hover:text-emerald-800">
                  Click to attach invoice or bill receipt(s)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Attach one or multiple pictures (JPG, PNG, WEBP) • Each shows on its own dedicated PDF page
                </p>
              </div>
            )}
          </div>

          {/* Real-time Calculation Summary Box */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-emerald-800">
              <Calculator className="w-5 h-5 text-emerald-600 shrink-0" />
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
              <span className="text-base sm:text-lg font-bold text-emerald-900">
                {formatCurrency(lineTotal)}
              </span>
            </div>
          </div>

          {/* Footer */}
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
              <span>{uploadStatusText || (entryToEdit ? "Update Entry" : "Save Entry")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
