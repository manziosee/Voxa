"use client";

import React, { useState, useEffect } from "react";
import { Plus, TicketCheck, X, AlertTriangle, ArrowUp, Minus, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { Ticket } from "@/lib/api";
import { cn } from "@/lib/utils";

const BUSINESS_ID = "demo-business";

type TicketStatus = Ticket["status"];
type TicketPriority = Ticket["priority"];

const FALLBACK: Ticket[] = [
  { id: "t1", business_id: BUSINESS_ID, customer_id: "c3", subject: "Billing discrepancy on last appointment", priority: "high", status: "open", created_at: "2026-05-20T07:00:00Z" },
  { id: "t2", business_id: BUSINESS_ID, customer_id: "c1", subject: "Could not reach agent during peak hours", priority: "urgent", status: "open", created_at: "2026-05-20T09:15:00Z" },
  { id: "t3", business_id: BUSINESS_ID, customer_id: "c5", subject: "Appointment rescheduled without notice", priority: "medium", status: "in_progress", created_at: "2026-05-19T14:00:00Z" },
  { id: "t4", business_id: BUSINESS_ID, customer_id: "c7", subject: "WhatsApp confirmation not received", priority: "low", status: "in_progress", created_at: "2026-05-19T10:30:00Z" },
  { id: "t5", business_id: BUSINESS_ID, customer_id: "c2", subject: "Wrong service booked via IVR", priority: "high", status: "resolved", created_at: "2026-05-18T16:00:00Z" },
  { id: "t6", business_id: BUSINESS_ID, customer_id: "c4", subject: "Language preference not saved", priority: "low", status: "resolved", created_at: "2026-05-17T11:00:00Z" },
  { id: "t7", business_id: BUSINESS_ID, customer_id: "c8", subject: "Callback never received after IVR", priority: "urgent", status: "closed", created_at: "2026-05-16T08:00:00Z" },
  { id: "t8", business_id: BUSINESS_ID, customer_id: "c6", subject: "Duplicate appointment created", priority: "medium", status: "closed", created_at: "2026-05-15T13:00:00Z" },
];

const COLUMNS: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];

const columnLabel: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const columnHeaderClass: Record<TicketStatus, string> = {
  open: "bg-red-50 border-red-200",
  in_progress: "bg-yellow-50 border-yellow-200",
  resolved: "bg-green-50 border-green-200",
  closed: "bg-muted border-border",
};

const columnLabelColor: Record<TicketStatus, string> = {
  open: "text-red-600",
  in_progress: "text-yellow-600",
  resolved: "text-green-600",
  closed: "text-muted-foreground",
};

const priorityMap: Record<TicketPriority, { class: string; icon: React.ElementType }> = {
  urgent: { class: "badge-destructive", icon: AlertTriangle },
  high: { class: "badge-pending", icon: ArrowUp },
  medium: { class: "bg-blue-50 text-blue-600", icon: Minus },
  low: { class: "bg-muted text-muted-foreground", icon: ArrowDown },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function truncate(str: string, n = 10): string {
  return str.length > n ? str.slice(0, n) + "..." : str;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", priority: "medium" as TicketPriority });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    api.tickets.list(BUSINESS_ID)
      .then((data) => { if (data?.length) setTickets(data); })
      .catch(() => setApiError(true))
      .finally(() => setLoading(false));
  }, []);

  const open = tickets.filter((t) => t.status === "open").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;
  const resolved = tickets.filter((t) => t.status === "resolved").length;

  const handleCreate = async () => {
    if (!form.subject.trim()) {
      setFormError("Subject is required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await api.tickets.create(BUSINESS_ID, {
        business_id: BUSINESS_ID,
        subject: form.subject,
        description: form.description || undefined,
        priority: form.priority,
      });
      setTickets((prev) => [created, ...prev]);
      setShowModal(false);
      setForm({ subject: "", description: "", priority: "medium" });
    } catch {
      setFormError("Failed to create ticket. Please try again.");
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
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-white text-xl font-bold">Tickets</h1>
            <p className="text-white/50 text-sm">Support tickets raised via calls and AI agent</p>
          </div>
          <Button
            type="button"
            onClick={() => setShowModal(true)}
            className="bg-primary hover:bg-primary/90 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Ticket
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Open", val: open, color: "text-red-400", icon: TicketCheck },
            { label: "In Progress", val: inProgress, color: "text-yellow-400", icon: TicketCheck },
            { label: "Resolved", val: resolved, color: "text-green-400", icon: TicketCheck },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white/[0.07] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn("w-4 h-4", s.color)} />
                  <p className="text-white/50 text-xs">{s.label}</p>
                </div>
                <p className={cn("text-2xl font-bold", s.color)}>{s.val}</p>
              </div>
            );
          })}
        </div>
      </div>

      {apiError && (
        <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
          Failed to load data. Using demo data.
        </div>
      )}

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[900px]">
          {COLUMNS.map((status) => {
            const col = tickets.filter((t) => t.status === status);
            return (
              <div key={status} className="flex-1 min-w-[210px]">
                <div className={cn(
                  "flex items-center justify-between mb-3 px-3 py-2 rounded-xl border",
                  columnHeaderClass[status]
                )}>
                  <span className={cn("text-sm font-semibold", columnLabelColor[status])}>
                    {columnLabel[status]}
                  </span>
                  <span className="text-xs text-muted-foreground">{col.length}</span>
                </div>

                {loading
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="h-24 rounded-xl animate-pulse bg-muted mb-3" />
                    ))
                  : (
                    <div className="flex flex-col gap-3">
                      {col.map((ticket) => {
                        const p = priorityMap[ticket.priority];
                        const PrIcon = p.icon;
                        return (
                          <div
                            key={ticket.id}
                            className="bg-card border border-border rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 flex-1">
                                {ticket.subject}
                              </p>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                                p.class
                              )}>
                                <PrIcon className="w-3 h-3" />
                                {ticket.priority}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {ticket.customer_id ? truncate(ticket.customer_id, 8) : "—"}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2">
                              {fmtDate(ticket.created_at)}
                            </p>
                          </div>
                        );
                      })}
                      {col.length === 0 && (
                        <div className="bg-muted/30 border border-dashed border-border rounded-xl p-4 text-center text-xs text-muted-foreground">
                          Empty
                        </div>
                      )}
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground">Create Ticket</h3>
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
                <Label>Subject</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="Describe the issue..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Description (optional)</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Additional details..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ticket-priority">Priority</Label>
                <select
                  id="ticket-priority"
                  title="Ticket priority"
                  value={form.priority}
                  onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as TicketPriority }))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
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
                  onClick={handleCreate}
                  disabled={submitting}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                >
                  {submitting ? "Creating..." : "Create Ticket"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
