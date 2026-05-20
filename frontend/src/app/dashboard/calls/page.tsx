"use client";

import React, { useState, useEffect } from "react";
import { Search, Download, ArrowUpDown, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { Call } from "@/lib/api";
import { cn } from "@/lib/utils";

const BUSINESS_ID = "demo-business";

const emotionEmoji: Record<string, string> = {
  neutral: "😐",
  happy: "😊",
  frustrated: "😤",
  angry: "😠",
  confused: "😕",
};

const FALLBACK_CALLS: Call[] = [
  { id: "1", business_id: BUSINESS_ID, caller_number: "+250780123456", direction: "inbound", started_at: "2026-05-20T08:12:00Z", duration_seconds: 142, language: "rw", emotion: "neutral", status: "completed", outcome: "appointment_booked" },
  { id: "2", business_id: BUSINESS_ID, caller_number: "+250788654321", direction: "inbound", started_at: "2026-05-20T09:05:00Z", duration_seconds: 87, language: "fr", emotion: "happy", status: "completed", outcome: "information_provided" },
  { id: "3", business_id: BUSINESS_ID, caller_number: "+254701234567", direction: "outbound", started_at: "2026-05-20T09:45:00Z", duration_seconds: 203, language: "en", emotion: "frustrated", status: "escalated", outcome: "escalated" },
  { id: "4", business_id: BUSINESS_ID, caller_number: "+250789012345", direction: "inbound", started_at: "2026-05-20T10:20:00Z", duration_seconds: 0, language: "rw", emotion: "neutral", status: "missed", outcome: "no_action" },
  { id: "5", business_id: BUSINESS_ID, caller_number: "+255713456789", direction: "inbound", started_at: "2026-05-20T11:00:00Z", duration_seconds: 315, language: "sw", emotion: "happy", status: "completed", outcome: "appointment_booked" },
  { id: "6", business_id: BUSINESS_ID, caller_number: "+250782345678", direction: "outbound", started_at: "2026-05-20T11:30:00Z", duration_seconds: 178, language: "en", emotion: "neutral", status: "completed", outcome: "callback_scheduled" },
  { id: "7", business_id: BUSINESS_ID, caller_number: "+250783901234", direction: "inbound", started_at: "2026-05-20T12:15:00Z", duration_seconds: 95, language: "rw", emotion: "confused", status: "completed", outcome: "information_provided" },
  { id: "8", business_id: BUSINESS_ID, caller_number: "+254722345678", direction: "inbound", started_at: "2026-05-20T13:00:00Z", duration_seconds: 0, language: "en", emotion: "angry", status: "missed", outcome: "no_action" },
  { id: "9", business_id: BUSINESS_ID, caller_number: "+250786543210", direction: "outbound", started_at: "2026-05-20T13:45:00Z", duration_seconds: 267, language: "fr", emotion: "happy", status: "completed", outcome: "appointment_booked" },
  { id: "10", business_id: BUSINESS_ID, caller_number: "+255712345670", direction: "inbound", started_at: "2026-05-20T14:20:00Z", duration_seconds: 432, language: "sw", emotion: "neutral", status: "escalated", outcome: "escalated" },
];

type FilterType = "All" | "Inbound" | "Outbound" | "Escalated" | "Missed";

function fmtDuration(s: number | undefined): string {
  if (!s) return "—";
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: Call["status"] }) {
  const map: Record<Call["status"], string> = {
    completed: "badge-success",
    escalated: "badge-pending",
    missed: "badge-destructive",
    in_progress: "bg-blue-50 text-blue-600",
  };
  return (
    <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", map[status])}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>(FALLBACK_CALLS);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");

  useEffect(() => {
    api.calls.list(BUSINESS_ID, 50)
      .then((data) => { if (data?.length) setCalls(data); })
      .catch(() => setApiError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = calls.filter((c) => {
    const matchSearch = c.caller_number.toLowerCase().includes(search.toLowerCase()) ||
      (c.outcome ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All" ||
      (filter === "Inbound" && c.direction === "inbound") ||
      (filter === "Outbound" && c.direction === "outbound") ||
      (filter === "Escalated" && c.status === "escalated") ||
      (filter === "Missed" && c.status === "missed");
    return matchSearch && matchFilter;
  });

  const totalCalls = filtered.length;
  const avgDuration = filtered.length
    ? Math.round(filtered.filter((c) => c.duration_seconds).reduce((s, c) => s + (c.duration_seconds ?? 0), 0) / filtered.filter((c) => c.duration_seconds).length)
    : 0;

  const filters: FilterType[] = ["All", "Inbound", "Outbound", "Escalated", "Missed"];

  return (
    <div className="p-6">
      {/* Header */}
      <div
        className="nav-card rounded-2xl px-6 py-5 mb-6"
        style={{ background: "linear-gradient(135deg, #0B1D3A, #132042)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-xl font-bold">Calls</h1>
            <p className="text-white/50 text-sm">All inbound and outbound call activity</p>
          </div>
          <a
            href={api.analytics.exportCallsUrl(BUSINESS_ID)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/[0.07] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="w-4 h-4 text-blue-400" />
              <p className="text-white/50 text-xs">Total Calls</p>
            </div>
            <p className="text-blue-400 font-bold text-2xl">{totalCalls}</p>
          </div>
          <div className="bg-white/[0.07] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="w-4 h-4 text-green-400" />
              <p className="text-white/50 text-xs">Avg Duration</p>
            </div>
            <p className="text-green-400 font-bold text-2xl">{fmtDuration(avgDuration)}</p>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
          Failed to load data. Using demo data.
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by phone number or outcome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                filter === f ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Caller", "Direction", "Started At", "Duration", "Language", "Emotion", "Status", "Outcome"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left">
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      {h}
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/60">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 rounded animate-pulse bg-muted" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((call) => (
                    <tr key={call.id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                            {call.direction === "inbound"
                              ? <PhoneIncoming className="w-3.5 h-3.5 text-primary" />
                              : <PhoneOutgoing className="w-3.5 h-3.5 text-blue-500" />
                            }
                          </div>
                          <span className="text-sm font-medium text-foreground font-mono">{call.caller_number}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-medium",
                          call.direction === "inbound" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                        )}>
                          {call.direction}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">{fmtTime(call.started_at)}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{fmtDuration(call.duration_seconds)}</td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 bg-muted rounded text-xs font-medium text-muted-foreground uppercase">
                          {call.language ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {call.emotion
                          ? `${emotionEmoji[call.emotion] ?? ""} ${call.emotion}`
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={call.status} />
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {call.outcome ? call.outcome.replace(/_/g, " ") : "—"}
                      </td>
                    </tr>
                  ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground text-sm">
                    No calls found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
