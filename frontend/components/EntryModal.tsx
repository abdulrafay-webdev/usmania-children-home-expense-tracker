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

  // Invoice picture state
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [invoiceFileId, setInvoiceFileId] = useState<string | null>(null);

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
      setInvoiceUrl(entryToEdit.invoice_url || null);
      setInvoiceFileId(entryToEdit.invoice_file_id || null);
      setInvoicePreview(entryToEdit.invoice_url || null);
      setInvoiceFile(null);
    } else {
      setItemName("");
      setQuantity("1");
      setItemQuality("");
      setPrice("");
      setNote("");
      setInvoiceFile(null);
      setInvoicePreview(null);
      setInvoiceUrl(null);
      setInvoiceFileId(null);
    }
    setError(null);
    setUploadStatusText(null);
  }, [entryToEdit, isOpen]);

  if (!isOpen) return null;

  const parsedQty = parseFloat(quantity) || 0;
  const parsedPrice = parseFloat(price) || 0;
  const lineTotal = parsedQty * parsedPrice;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        setError("Invoice file must be smaller than 15MB.");
        return;
      }
      setInvoiceFile(file);
      setInvoicePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleRemoveInvoice = () => {
    setInvoiceFile(null);
    setInvoicePreview(null);
    setInvoiceUrl(null);
    setInvoiceFileId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
      let finalInvoiceUrl = invoiceUrl;
      let finalInvoiceFileId = invoiceFileId;

      // Upload invoice file if a new file was chosen
      if (invoiceFile) {
        setUploadStatusText("Uploading invoice to ImageKit...");
        const uploadRes = await api.uploadInvoice(invoiceFile);
        finalInvoiceUrl = uploadRes.url;
        finalInvoiceFileId = uploadRes.file_id;
      }

      setUploadStatusText("Saving expense entry...");

      if (entryToEdit) {
        const updated = await api.updateEntry(entryToEdit.id, {
          item_name: trimmedName,
          quantity: parsedQty,
          item_quality: itemQuality.trim() || undefined,
          price: parsedPrice,
          note: note.trim() || undefined,
          invoice_url: finalInvoiceUrl,
          invoice_file_id: finalInvoiceFileId,
        });
        onSuccess(updated);
      } else {
        const created = await api.createEntry(personId, {
          item_name: trimmedName,
          quantity: parsedQty,
          item_quality: itemQuality.trim() || undefined,
          price: parsedPrice,
          note: note.trim() || undefined,
          invoice_url: finalInvoiceUrl,
          invoice_file_id: finalInvoiceFileId,
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

          {/* Invoice / Bill Picture Attachment (ImageKit) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Invoice / Bill Picture (ImageKit)</span>
              <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {invoicePreview ? (
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={invoicePreview}
                    alt="Invoice Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 truncate">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      {invoiceFile ? invoiceFile.name : "Attached Invoice Image"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {invoiceFile
                      ? `${(invoiceFile.size / 1024).toFixed(1)} KB • Ready to upload`
                      : "Saved on Cloud Storage"}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {invoiceUrl && (
                      <a
                        href={invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View Original</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] text-slate-600 hover:text-slate-800 underline"
                    >
                      Change
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveInvoice}
                  title="Remove Invoice"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 rounded-xl p-4 cursor-pointer transition-all text-center group"
              >
                <UploadCloud className="w-8 h-8 mx-auto text-slate-400 group-hover:text-emerald-600 transition-colors mb-1" />
                <p className="text-xs font-medium text-slate-700 group-hover:text-emerald-800">
                  Click to attach invoice or bill receipt
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supports JPG, PNG, WEBP up to 15MB • Shows on dedicated PDF page
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
