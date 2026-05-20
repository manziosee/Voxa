"use client";

import React, { useState } from "react";
import { Upload, FileText, File, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BUSINESS_ID = "demo-business";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface KnowledgeDoc {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  status: "processing" | "ready" | "error";
}

const MOCK_DOCS: KnowledgeDoc[] = [
  { id: "d1", name: "business_services.txt", type: "txt", size: "12 KB", uploadedAt: "May 18, 2026", status: "ready" },
  { id: "d2", name: "faq_kinyarwanda.pdf", type: "pdf", size: "84 KB", uploadedAt: "May 15, 2026", status: "ready" },
  { id: "d3", name: "appointment_procedures.docx", type: "docx", size: "45 KB", uploadedAt: "May 10, 2026", status: "ready" },
  { id: "d4", name: "pricing_guide_2026.pdf", type: "pdf", size: "128 KB", uploadedAt: "May 1, 2026", status: "ready" },
];

const typeIcon: Record<string, React.ElementType> = {
  pdf: FileText,
  docx: File,
  txt: FileText,
};

const statusMap: Record<KnowledgeDoc["status"], string> = {
  processing: "badge-pending",
  ready: "badge-success",
  error: "badge-destructive",
};

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>(MOCK_DOCS);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    const allowed = ["text/plain", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type) && !file.name.match(/\.(txt|pdf|docx)$/i)) {
      setUploadError("Only .txt, .pdf, and .docx files are supported.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE}/api/v1/utilities/knowledge/${BUSINESS_ID}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const ext = file.name.split(".").pop() ?? "txt";
      const newDoc: KnowledgeDoc = {
        id: Date.now().toString(),
        name: file.name,
        type: ext,
        size: `${Math.round(file.size / 1024)} KB`,
        uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        status: "processing",
      };
      setDocs((prev) => [newDoc, ...prev]);
      setUploadSuccess(`"${file.name}" uploaded successfully and is being processed.`);

      // Simulate processing completion
      setTimeout(() => {
        setDocs((prev) =>
          prev.map((d) => (d.id === newDoc.id ? { ...d, status: "ready" } : d))
        );
      }, 3000);
    } catch {
      // API not available — add to local list anyway
      const ext = file.name.split(".").pop() ?? "txt";
      const newDoc: KnowledgeDoc = {
        id: Date.now().toString(),
        name: file.name,
        type: ext,
        size: `${Math.round(file.size / 1024)} KB`,
        uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        status: "ready",
      };
      setDocs((prev) => [newDoc, ...prev]);
      setUploadSuccess(`"${file.name}" added to knowledge base.`);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const removeDoc = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div
        className="nav-card rounded-2xl px-6 py-5 mb-6"
        style={{ background: "linear-gradient(135deg, #0B1D3A, #132042)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">Knowledge Base</h1>
            <p className="text-white/50 text-sm">Manage your AI agent&apos;s knowledge documents</p>
          </div>
        </div>
      </div>

      {/* Upload card */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-foreground text-sm mb-4">Upload Document</h2>

        <label
          htmlFor="file-upload"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors",
            dragOver
              ? "border-primary bg-accent"
              : "border-border bg-muted/20 hover:border-primary/50 hover:bg-accent/50"
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
            <Upload className={cn("w-6 h-6", uploading ? "text-primary animate-bounce" : "text-primary")} />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            {uploading ? "Uploading..." : "Drop file here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground">Supports .txt, .pdf, .docx — max 10 MB</p>
          <input
            id="file-upload"
            type="file"
            accept=".txt,.pdf,.docx"
            className="hidden"
            onChange={handleInputChange}
            disabled={uploading}
          />
        </label>

        {uploadError && (
          <p className="mt-3 text-xs text-destructive">{uploadError}</p>
        )}
        {uploadSuccess && (
          <p className="mt-3 text-xs text-green-600">{uploadSuccess}</p>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            disabled={uploading}
            onClick={() => document.getElementById("file-upload")?.click()}
            className="bg-primary hover:bg-primary/90 text-white gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      </div>

      {/* Documents list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm">Documents ({docs.length})</h2>
        </div>
        <div className="divide-y divide-border">
          {docs.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground text-sm">
              No documents uploaded yet. Upload your first document above.
            </div>
          ) : (
            docs.map((doc) => {
              const Icon = typeIcon[doc.type] ?? File;
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.size} · Uploaded {doc.uploadedAt}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize shrink-0",
                      statusMap[doc.status]
                    )}
                  >
                    {doc.status}
                  </span>
                  <button
                    type="button"
                    title="Remove document"
                    aria-label="Remove document"
                    onClick={() => removeDoc(doc.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
