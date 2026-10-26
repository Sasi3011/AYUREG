import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileCheck2, FileText, RefreshCw, UploadCloud, XCircle } from "lucide-react";
import api from "../api/client";
import { Spinner } from "./ui";

const STATUS_CONFIG = {
  valid: { label: "AI verified", card: "border-emerald-200 bg-emerald-50/50", badge: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, iconCls: "bg-emerald-100 text-emerald-600" },
  uploaded: { label: "Uploaded · officer review", card: "border-sky-200 bg-sky-50/50", badge: "bg-sky-100 text-sky-700", icon: FileCheck2, iconCls: "bg-sky-100 text-sky-600" },
  verified: { label: "Verified", card: "border-emerald-200 bg-emerald-50/50", badge: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, iconCls: "bg-emerald-100 text-emerald-600" },
  missing_info: { label: "Missing information", card: "border-accent-200 bg-accent-50/60", badge: "bg-accent-100 text-accent-800", icon: AlertTriangle, iconCls: "bg-accent-100 text-accent-600" },
  incorrect: { label: "Incorrect document", card: "border-rose-200 bg-rose-50/60", badge: "bg-rose-100 text-rose-700", icon: XCircle, iconCls: "bg-rose-100 text-rose-600" },
  unreadable: { label: "Unreadable", card: "border-rose-200 bg-rose-50/60", badge: "bg-rose-100 text-rose-700", icon: XCircle, iconCls: "bg-rose-100 text-rose-600" },
  inconsistent: { label: "Inconsistency found", card: "border-orange-200 bg-orange-50/60", badge: "bg-orange-100 text-orange-700", icon: AlertTriangle, iconCls: "bg-orange-100 text-orange-600" },
  rejected: { label: "Needs re-upload", card: "border-rose-200 bg-rose-50/60", badge: "bg-rose-100 text-rose-700", icon: XCircle, iconCls: "bg-rose-100 text-rose-600" },
};

const NEEDS_REUPLOAD = ["unreadable", "incorrect", "missing_info", "inconsistent", "rejected"];
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.docx,.doc";

export default function DocumentUploader({ applicationId, checklistItem, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const verif = result?.verification;
  // Latest upload wins; a null AI verdict means "accepted for officer review".
  const status = result ? verif?.ai_status || "uploaded" : checklistItem.status !== "pending" ? checklistItem.status : null;
  const cfg = status ? STATUS_CONFIG[status] : null;
  const hasFile = !!status;
  const needsReupload = NEEDS_REUPLOAD.includes(status);
  const Icon = cfg?.icon || FileText;

  async function uploadFile(file) {
    setError("");
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10 MB.");
      return;
    }
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("applicationId", applicationId);
    formData.append("checklistItemId", checklistItem.id);

    try {
      const res = await api.post("/documents/upload", formData, { isForm: true });
      setResult(res);
      onUploaded?.();
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  const openPicker = () => !uploading && fileRef.current?.click();

  return (
    <div className={`rounded-2xl border p-4 transition sm:p-5 ${cfg?.card || "border-slate-200 bg-white"}`}>
      <input ref={fileRef} type="file" accept={ACCEPT} onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} className="hidden" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg?.iconCls || "bg-primary-50 text-primary-600"}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-ink">{checklistItem.label}</p>
              {!!checklistItem.required && <span className="badge bg-rose-50 text-rose-600 ring-rose-200">Required</span>}
              {cfg && <span className={`badge ring-0 ${cfg.badge}`}>{cfg.label}</span>}
            </div>
            {result?.document?.original_name && (
              <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                <FileText className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{result.document.original_name}</span>
              </p>
            )}
            {verif?.ai_explanation && (
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {verif.ai_explanation}
                {verif.confidence_score != null && <span className="ml-1 font-semibold text-slate-500">({verif.confidence_score}% confidence)</span>}
              </p>
            )}
          </div>
        </div>

        {hasFile && !uploading && (
          <button type="button" onClick={openPicker} className={`${needsReupload ? "btn-primary" : "btn-outline"} btn-sm shrink-0 self-start`}>
            <RefreshCw className="h-3.5 w-3.5" /> Re-upload
          </button>
        )}
      </div>

      {(!hasFile || uploading) && (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openPicker()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={openPicker}
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-7 text-center transition ${
            dragOver ? "border-primary-400 bg-primary-50" : uploading ? "cursor-wait border-slate-200 bg-slate-50" : "border-slate-200 bg-slate-50/50 hover:border-primary-300 hover:bg-primary-50/40"
          }`}
        >
          {uploading ? (
            <>
              <Spinner className="h-7 w-7" />
              <p className="mt-2 text-sm font-medium text-primary-700">Uploading & checking the document…</p>
            </>
          ) : (
            <>
              <UploadCloud className="h-7 w-7 text-primary-500" />
              <p className="mt-2 text-sm font-semibold text-slate-700">
                Drop a file or <span className="text-primary-600 underline underline-offset-2">browse</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-400">PDF, JPG, PNG or DOCX · up to 10 MB</p>
            </>
          )}
        </div>
      )}

      {needsReupload && !uploading && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-rose-600">
          <AlertTriangle className="h-4 w-4 shrink-0" /> This document needs to be replaced before you can submit.
        </p>
      )}

      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-rose-600">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
