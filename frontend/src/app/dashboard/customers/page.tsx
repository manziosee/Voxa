"use client";

import React, { useState, useEffect } from "react";
import { Plus, Users, Star, Ban, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Customer } from "@/lib/api";
import { cn } from "@/lib/utils";

const BUSINESS_ID = "demo-business";

type CustomerStatus = "active" | "vip" | "blocked";

const FALLBACK: Customer[] = [
  { id: "c1", business_id: BUSINESS_ID, phone_number: "+250780123456", name: "Amina Uwimana", preferred_language: "rw", last_contact: "2026-05-20T08:12:00Z", status: "active", notes: "Regular customer, prefers morning appointments" },
  { id: "c2", business_id: BUSINESS_ID, phone_number: "+250788654321", name: "Jean Pierre Nkurunziza", preferred_language: "fr", last_contact: "2026-05-19T15:30:00Z", status: "vip", notes: "VIP client - priority service" },
  { id: "c3", business_id: BUSINESS_ID, phone_number: "+254701234567", name: "Sarah Akinyi", preferred_language: "en", last_contact: "2026-05-18T11:00:00Z", status: "active" },
  { id: "c4", business_id: BUSINESS_ID, phone_number: "+255713456789", name: "Hamisi Juma", preferred_language: "sw", last_contact: "2026-05-17T09:45:00Z", status: "active", notes: "Prefers Swahili" },
  { id: "c5", business_id: BUSINESS_ID, phone_number: "+250789012345", name: "Unknown", preferred_language: "rw", last_contact: "2026-05-15T14:20:00Z", status: "blocked", notes: "Repeated no-shows" },
  { id: "c6", business_id: BUSINESS_ID, phone_number: "+221778901234", name: "Amara Diallo", preferred_language: "fr", last_contact: "2026-05-14T10:00:00Z", status: "vip" },
  { id: "c7", business_id: BUSINESS_ID, phone_number: "+250782345678", name: "Claudine Mukamana", preferred_language: "rw", last_contact: "2026-05-20T09:00:00Z", status: "active" },
  { id: "c8", business_id: BUSINESS_ID, phone_number: "+254722345678", name: "Omar Shariff", preferred_language: "en", last_contact: "2026-05-13T16:00:00Z", status: "active", notes: "Corporate client" },
];

const statusColumns: CustomerStatus[] = ["active", "vip", "blocked"];

const columnConfig: Record<CustomerStatus, { label: string; icon: React.ElementType; color: string; headerClass: string }> = {
  active: { label: "Active", icon: Users, color: "text-green-600", headerClass: "bg-green-50 border-green-200" },
  vip: { label: "VIP", icon: Star, color: "text-yellow-600", headerClass: "bg-yellow-50 border-yellow-200" },
  blocked: { label: "Blocked", icon: Ban, color: "text-red-500", headerClass: "bg-red-50 border-red-200" },
};

const langLabel: Record<string, string> = { en: "English", fr: "French", sw: "Swahili", rw: "Kinyarwanda" };
const langColor: Record<string, string> = {
  en: "bg-blue-50 text-blue-600",
  fr: "bg-purple-50 text-purple-600",
  sw: "bg-green-50 text-green-600",
  rw: "bg-orange-50 text-orange-600",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    api.customers.list(BUSINESS_ID)
      .then((data) => { if (data?.length) setCustomers(data); })
      .catch(() => setApiError(true))
      .finally(() => setLoading(false));
  }, []);

  const total = customers.length;
  const active = customers.filter((c) => c.status === "active").length;
  const vip = customers.filter((c) => c.status === "vip").length;

  return (
    <div className="p-6">
      {/* Header */}
      <div
        className="nav-card rounded-2xl px-6 py-5 mb-6"
        style={{ background: "linear-gradient(135deg, #0B1D3A, #132042)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-white text-xl font-bold">Customers</h1>
            <p className="text-white/50 text-sm">All callers and registered customers</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Customers", val: total, color: "text-white", icon: Users },
            { label: "Active", val: active, color: "text-green-400", icon: Users },
            { label: "VIP", val: vip, color: "text-yellow-400", icon: Star },
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

      {/* Kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[780px]">
          {statusColumns.map((status) => {
            const cfg = columnConfig[status];
            const Icon = cfg.icon;
            const col = customers.filter((c) => (c.status ?? "active") === status);

            return (
              <div key={status} className="flex-1 min-w-[240px]">
                <div className={cn(
                  "flex items-center justify-between mb-3 px-3 py-2 rounded-xl border",
                  cfg.headerClass
                )}>
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", cfg.color)} />
                    <span className="text-sm font-semibold text-foreground">{cfg.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{col.length}</span>
                </div>

                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-28 rounded-xl animate-pulse bg-muted mb-3" />
                    ))
                  : (
                    <div className="flex flex-col gap-3">
                      {col.map((c) => (
                        <div
                          key={c.id}
                          className="bg-card border border-border rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                                <Phone className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{c.name ?? "Unknown"}</p>
                                <p className="text-xs text-muted-foreground font-mono truncate">{c.phone_number}</p>
                              </div>
                            </div>
                            {c.preferred_language && (
                              <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium shrink-0", langColor[c.preferred_language] ?? "bg-muted text-muted-foreground")}>
                                {langLabel[c.preferred_language] ?? c.preferred_language}
                              </span>
                            )}
                          </div>
                          {c.notes && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{c.notes}</p>
                          )}
                          {c.last_contact && (
                            <p className="text-xs text-muted-foreground">
                              Last contact: {fmtDate(c.last_contact)}
                            </p>
                          )}
                        </div>
                      ))}
                      {col.length === 0 && (
                        <div className="bg-muted/30 border border-dashed border-border rounded-xl p-4 text-center text-xs text-muted-foreground">
                          No {cfg.label.toLowerCase()} customers
                        </div>
                      )}
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
