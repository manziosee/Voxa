"use client";

import React, { useState, useEffect } from "react";
import { PhoneOutgoing, PhoneCall, Clock, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { Callback } from "@/lib/api";
import { cn } from "@/lib/utils";

const BUSINESS_ID = "demo-business";

const FALLBACK_CALLBACKS: Callback[] = [
  { id: "cb1", business_id: BUSINESS_ID, customer_phone: "+250780123456", scheduled_at: "2026-05-20T14:00:00Z", reason: "Follow-up on missed appointment", language: "rw", status: "pending", created_at: "2026-05-20T09:00:00Z" },
  { id: "cb2", business_id: BUSINESS_ID, customer_phone: "+254701234567", scheduled_at: "2026-05-20T15:30:00Z", reason: "Billing inquiry resolution", language: "en", status: "pending", created_at: "2026-05-20T10:00:00Z" },
  { id: "cb3", business_id: BUSINESS_ID, customer_phone: "+250788654321", scheduled_at: "2026-05-19T16:00:00Z", reason: "Appointment confirmation", language: "fr", status: "completed", created_at: "2026-05-19T08:00:00Z" },
  { id: "cb4", business_id: BUSINESS_ID, customer_phone: "+255713456789", scheduled_at: "2026-05-21T10:00:00Z", reason: "Service feedback", language: "sw", status: "pending", created_at: "2026-05-20T11:00:00Z" },
];

const cbStatusMap: Record<Callback["status"], string> = {
  pending: "badge-pending",
  completed: "badge-success",
  cancelled: "badge-destructive",
};

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const languages = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "sw", label: "Swahili" },
  { value: "rw", label: "Kinyarwanda" },
];

export default function OutboundPage() {
  const [callbacks, setCallbacks] = useState<Callback[]>(FALLBACK_CALLBACKS);
  const [loadingCallbacks, setLoadingCallbacks] = useState(true);
  const [apiError, setApiError] = useState(false);

  // Initiate call form
  const [callForm, setCallForm] = useState({ to_number: "", language: "en", script_hint: "" });
  const [calling, setCalling] = useState(false);
  const [callResult, setCallResult] = useState<string | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  // Schedule callback form
  const [cbForm, setCbForm] = useState({ customer_phone: "", scheduled_at: "", reason: "", language: "en" });
  const [scheduling, setScheduling] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  useEffect(() => {
    api.outbound.getCallbacks(BUSINESS_ID)
      .then((data) => { if (data?.length) setCallbacks(data); })
      .catch(() => setApiError(true))
      .finally(() => setLoadingCallbacks(false));
  }, []);

  const handleCall = async () => {
    if (!callForm.to_number.trim()) {
      setCallError("Phone number is required.");
      return;
    }
    setCalling(true);
    setCallError(null);
    setCallResult(null);
    try {
      const result = await api.outbound.initiateCall({
        business_id: BUSINESS_ID,
        to_number: callForm.to_number,
        language: callForm.language,
        script_hint: callForm.script_hint || undefined,
      });
      setCallResult(`Call initiated. SID: ${result.call_sid ?? "N/A"}`);
      setCallForm({ to_number: "", language: "en", script_hint: "" });
    } catch {
      setCallError("Failed to initiate call. Please check the number and try again.");
    } finally {
      setCalling(false);
    }
  };

  const handleSchedule = async () => {
    if (!cbForm.customer_phone.trim() || !cbForm.scheduled_at) {
      setScheduleError("Phone number and scheduled time are required.");
      return;
    }
    setScheduling(true);
    setScheduleError(null);
    setScheduleResult(null);
    try {
      const created = await api.outbound.scheduleCallback({
        business_id: BUSINESS_ID,
        customer_phone: cbForm.customer_phone,
        scheduled_at: new Date(cbForm.scheduled_at).toISOString(),
        reason: cbForm.reason || undefined,
        language: cbForm.language,
      });
      setCallbacks((prev) => [created, ...prev]);
      setScheduleResult("Callback scheduled successfully.");
      setCbForm({ customer_phone: "", scheduled_at: "", reason: "", language: "en" });
    } catch {
      setScheduleError("Failed to schedule callback. Please try again.");
    } finally {
      setScheduling(false);
    }
  };

  const pending = callbacks.filter((c) => c.status === "pending").length;
  const initiated = callbacks.filter((c) => c.status === "completed").length;

  return (
    <div className="p-6">
      {/* Header */}
      <div
        className="nav-card rounded-2xl px-6 py-5 mb-6"
        style={{ background: "linear-gradient(135deg, #0B1D3A, #132042)" }}
      >
        <div className="mb-5">
          <h1 className="text-white text-xl font-bold">Outbound</h1>
          <p className="text-white/50 text-sm">Initiate outbound calls and schedule callbacks</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/[0.07] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <PhoneOutgoing className="w-4 h-4 text-blue-400" />
              <p className="text-white/50 text-xs">Calls Initiated</p>
            </div>
            <p className="text-blue-400 font-bold text-2xl">{initiated}</p>
          </div>
          <div className="bg-white/[0.07] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-400" />
              <p className="text-white/50 text-xs">Pending Callbacks</p>
            </div>
            <p className="text-yellow-400 font-bold text-2xl">{pending}</p>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
          Failed to load data. Using demo data.
        </div>
      )}

      {/* Forms row */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Initiate Call */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
              <PhoneCall className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">Initiate Call</h2>
              <p className="text-xs text-muted-foreground">Trigger an AI-powered outbound call</p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Phone Number</Label>
              <Input
                value={callForm.to_number}
                onChange={(e) => setCallForm((p) => ({ ...p, to_number: e.target.value }))}
                placeholder="+250780123456"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="call-language">Language</Label>
              <select
                id="call-language"
                title="Call language"
                value={callForm.language}
                onChange={(e) => setCallForm((p) => ({ ...p, language: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {languages.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Script Hint (optional)</Label>
              <Input
                value={callForm.script_hint}
                onChange={(e) => setCallForm((p) => ({ ...p, script_hint: e.target.value }))}
                placeholder="e.g. Remind about tomorrow appointment"
              />
            </div>
            {callError && <p className="text-xs text-destructive">{callError}</p>}
            {callResult && <p className="text-xs text-green-600">{callResult}</p>}
            <Button
              type="button"
              onClick={handleCall}
              disabled={calling}
              className="bg-primary hover:bg-primary/90 text-white gap-2 w-full"
            >
              <PhoneOutgoing className="w-4 h-4" />
              {calling ? "Initiating..." : "Initiate Call"}
            </Button>
          </div>
        </div>

        {/* Schedule Callback */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">Schedule Callback</h2>
              <p className="text-xs text-muted-foreground">Book a callback for a customer</p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Customer Phone</Label>
              <Input
                value={cbForm.customer_phone}
                onChange={(e) => setCbForm((p) => ({ ...p, customer_phone: e.target.value }))}
                placeholder="+250780123456"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Scheduled At</Label>
              <Input
                type="datetime-local"
                value={cbForm.scheduled_at}
                onChange={(e) => setCbForm((p) => ({ ...p, scheduled_at: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Reason (optional)</Label>
              <Input
                value={cbForm.reason}
                onChange={(e) => setCbForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="e.g. Follow-up on missed appointment"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cb-language">Language</Label>
              <select
                id="cb-language"
                title="Callback language"
                value={cbForm.language}
                onChange={(e) => setCbForm((p) => ({ ...p, language: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {languages.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            {scheduleError && <p className="text-xs text-destructive">{scheduleError}</p>}
            {scheduleResult && <p className="text-xs text-green-600">{scheduleResult}</p>}
            <Button
              type="button"
              onClick={handleSchedule}
              disabled={scheduling}
              className="bg-primary hover:bg-primary/90 text-white gap-2 w-full"
            >
              <Clock className="w-4 h-4" />
              {scheduling ? "Scheduling..." : "Schedule Callback"}
            </Button>
          </div>
        </div>
      </div>

      {/* Pending Callbacks table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground text-sm">Pending Callbacks</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Customer Phone", "Scheduled At", "Reason", "Language", "Status"].map((h) => (
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
              {loadingCallbacks
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/60">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 rounded animate-pulse bg-muted" />
                        </td>
                      ))}
                    </tr>
                  ))
                : callbacks.map((cb) => (
                    <tr key={cb.id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4 font-mono text-sm text-foreground">{cb.customer_phone}</td>
                      <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDateTime(cb.scheduled_at)}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{cb.reason ?? "—"}</td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 bg-muted rounded text-xs font-medium text-muted-foreground uppercase">
                          {cb.language ?? "en"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", cbStatusMap[cb.status])}>
                          {cb.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              {!loadingCallbacks && callbacks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground text-sm">
                    No callbacks scheduled.
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
