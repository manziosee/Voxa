"use client";

import React, { useState, useEffect } from "react";
import { Plus, CalendarCheck, Download, ArrowUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { Appointment } from "@/lib/api";
import { cn } from "@/lib/utils";

const BUSINESS_ID = "demo-business";

type ApptStatus = Appointment["status"];
type FilterStatus = "All" | ApptStatus;

const FALLBACK: Appointment[] = [
  { id: "1", business_id: BUSINESS_ID, customer_id: "cust_001", service_name: "Hair & Beauty", scheduled_at: "2026-05-20T10:00:00Z", duration_minutes: 60, status: "confirmed", reminder_sent: true },
  { id: "2", business_id: BUSINESS_ID, customer_id: "cust_002", service_name: "Dental Checkup", scheduled_at: "2026-05-20T11:30:00Z", duration_minutes: 45, status: "scheduled", reminder_sent: false },
  { id: "3", business_id: BUSINESS_ID, customer_id: "cust_003", service_name: "Tech Consultation", scheduled_at: "2026-05-20T14:00:00Z", duration_minutes: 30, status: "confirmed", reminder_sent: true },
  { id: "4", business_id: BUSINESS_ID, customer_id: "cust_004", service_name: "Physiotherapy Session", scheduled_at: "2026-05-19T09:00:00Z", duration_minutes: 60, status: "completed", reminder_sent: true },
  { id: "5", business_id: BUSINESS_ID, customer_id: "cust_005", service_name: "Legal Advisory", scheduled_at: "2026-05-19T15:00:00Z", duration_minutes: 90, status: "cancelled", reminder_sent: false },
  { id: "6", business_id: BUSINESS_ID, customer_id: "cust_006", service_name: "Hair & Beauty", scheduled_at: "2026-05-18T10:30:00Z", duration_minutes: 60, status: "no_show", reminder_sent: true },
  { id: "7", business_id: BUSINESS_ID, customer_id: "cust_007", service_name: "Financial Planning", scheduled_at: "2026-05-21T13:00:00Z", duration_minutes: 60, status: "scheduled", reminder_sent: false },
  { id: "8", business_id: BUSINESS_ID, customer_id: "cust_008", service_name: "Dental Checkup", scheduled_at: "2026-05-21T16:00:00Z", duration_minutes: 45, status: "confirmed", reminder_sent: true },
];

const statusMap: Record<ApptStatus, string> = {
  scheduled: "badge-pending",
  confirmed: "badge-success",
  cancelled: "badge-destructive",
  completed: "bg-blue-50 text-blue-600",
  no_show: "bg-orange-50 text-orange-600",
};

function StatusBadge({ status }: { status: ApptStatus }) {
  return (
    <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", statusMap[status])}>
      {status.replace("_", " ")}
    </span>
  );
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function truncate(str: string, n = 10): string {
  return str.length > n ? str.slice(0, n) + "..." : str;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>("All");
  const [showModal, setShowModal] = useState(false);

  // New appointment form state
  const [form, setForm] = useState({
    service_name: "",
    scheduled_at: "",
    duration_minutes: "30",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    api.appointments.list(BUSINESS_ID)
      .then((data) => { if (data?.length) setAppointments(data); })
      .catch(() => setApiError(true))
      .finally(() => setLoading(false));
  }, []);

  const filters: FilterStatus[] = ["All", "scheduled", "confirmed", "completed", "cancelled", "no_show"];

  const filtered = appointments.filter(
    (a) => filter === "All" || a.status === filter
  );

  const total = appointments.length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;

  const handleBook = async () => {
    if (!form.service_name.trim() || !form.scheduled_at) {
      setFormError("Service name and scheduled time are required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await api.appointments.create({
        business_id: BUSINESS_ID,
        service_name: form.service_name,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        duration_minutes: parseInt(form.duration_minutes, 10),
        notes: form.notes || undefined,
      });
      setAppointments((prev) => [created, ...prev]);
      setShowModal(false);
      setForm({ service_name: "", scheduled_at: "", duration_minutes: "30", notes: "" });
    } catch {
      setFormError("Failed to book appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div
        className="nav-card rounded-2xl px-6 py-5 mb-6"
        style={{ background: "linear-gradient(135deg, #0B1D3A, #132042)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-xl font-bold">Appointments</h1>
            <p className="text-white/50 text-sm">Manage all booked appointments</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={api.analytics.exportAppointmentsUrl(BUSINESS_ID)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </a>
            <Button
              type="button"
              onClick={() => setShowModal(true)}
              className="bg-primary hover:bg-primary/90 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Book Appointment
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Booked", val: total, color: "text-white" },
            { label: "Confirmed", val: confirmed, color: "text-green-400" },
            { label: "Cancelled", val: cancelled, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.07] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CalendarCheck className={cn("w-4 h-4", s.color)} />
                <p className="text-white/50 text-xs">{s.label}</p>
              </div>
              <p className={cn("text-2xl font-bold", s.color)}>{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      {apiError && (
        <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
          Failed to load data. Using demo data.
        </div>
      )}

      {/* Filter pills */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors",
                filter === f ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {f.replace("_", " ")}
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
                {["Service", "Customer ID", "Scheduled At", "Duration", "Status", "Reminder Sent"].map((h) => (
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
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 rounded animate-pulse bg-muted" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((a) => (
                    <tr key={a.id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-foreground">{a.service_name}</td>
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                        {a.customer_id ? truncate(a.customer_id, 12) : "—"}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDateTime(a.scheduled_at)}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {a.duration_minutes ? `${a.duration_minutes} min` : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn(
                          "inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium",
                          a.reminder_sent ? "badge-success" : "bg-muted text-muted-foreground"
                        )}>
                          {a.reminder_sent ? "Sent" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground text-sm">
                    No appointments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground">Book Appointment</h3>
              <button
                type="button"
                title="Close"
                aria-label="Close"
                onClick={() => { setShowModal(false); setFormError(null); }}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Service Name</Label>
                <Input
                  value={form.service_name}
                  onChange={(e) => setForm((p) => ({ ...p, service_name: e.target.value }))}
                  placeholder="e.g. Hair & Beauty"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Scheduled At</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={form.duration_minutes}
                  onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))}
                  min="15"
                  step="15"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Notes (optional)</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Any special instructions..."
                />
              </div>
              {formError && <p className="text-xs text-destructive">{formError}</p>}
              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setShowModal(false); setFormError(null); }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleBook}
                  disabled={submitting}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                >
                  {submitting ? "Booking..." : "Book"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
