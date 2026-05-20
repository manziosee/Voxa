"use client";

import React, { useState, useEffect } from "react";
import {
  Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing,
  CalendarCheck, TicketCheck, AlertTriangle, MessageSquare,
  Users, Bot, Filter, Bell, CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type NotifCategory = "call" | "appointment" | "ticket" | "escalation" | "message" | "customer" | "system";

interface Notification {
  id: string;
  category: NotifCategory;
  title: string;
  detail: string;
  time: string;       // ISO string
  read: boolean;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const seedNotifs: Notification[] = [
  { id: "1",  category: "call",        title: "New inbound call",            detail: "Caller +250780123456 connected — language: Kinyarwanda",     time: new Date(Date.now() - 2 * 60000).toISOString(),   read: false },
  { id: "2",  category: "escalation",  title: "Call escalated",              detail: "Frustrated caller +250788654321 forwarded to human agent",    time: new Date(Date.now() - 8 * 60000).toISOString(),   read: false },
  { id: "3",  category: "appointment", title: "Appointment booked",           detail: "Haircut — Friday 30 May at 10:00 AM via AI agent",           time: new Date(Date.now() - 15 * 60000).toISOString(),  read: false },
  { id: "4",  category: "ticket",      title: "Ticket created",              detail: "Billing complaint from +254701234567 — priority: High",       time: new Date(Date.now() - 32 * 60000).toISOString(),  read: true  },
  { id: "5",  category: "call",        title: "Missed call",                 detail: "Caller +250782345678 hung up after 10 s — no agent available", time: new Date(Date.now() - 45 * 60000).toISOString(),  read: true  },
  { id: "6",  category: "message",     title: "WhatsApp message received",   detail: "Customer Amara Diallo: 'When is my appointment?'",            time: new Date(Date.now() - 60 * 60000).toISOString(),  read: true  },
  { id: "7",  category: "customer",    title: "New customer registered",     detail: "Ines Muhoza (+250789012345) — first contact via WhatsApp",    time: new Date(Date.now() - 90 * 60000).toISOString(),  read: true  },
  { id: "8",  category: "appointment", title: "Appointment reminder sent",   detail: "SMS + WhatsApp reminder sent to +250780000001 for 10:00 AM",  time: new Date(Date.now() - 2 * 3600000).toISOString(), read: true  },
  { id: "9",  category: "system",      title: "AI call summary generated",   detail: "Call with +250788654321 — 4 min 12 s — outcome: info_given",  time: new Date(Date.now() - 3 * 3600000).toISOString(), read: true  },
  { id: "10", category: "ticket",      title: "Ticket resolved",             detail: "Ticket #1042 closed — resolution added by AI agent",          time: new Date(Date.now() - 4 * 3600000).toISOString(), read: true  },
  { id: "11", category: "call",        title: "Outbound call completed",     detail: "Callback to +254701234567 — duration: 3 min 05 s",            time: new Date(Date.now() - 5 * 3600000).toISOString(), read: true  },
  { id: "12", category: "escalation",  title: "Escalation resolved",        detail: "Human agent closed escalated ticket — customer satisfied",     time: new Date(Date.now() - 6 * 3600000).toISOString(), read: true  },
  { id: "13", category: "system",      title: "IVR menu updated",            detail: "Option 3 (Business Hours) added to IVR by admin",             time: new Date(Date.now() - 24 * 3600000).toISOString(), read: true  },
  { id: "14", category: "appointment", title: "Appointment cancelled",       detail: "Customer +250780111222 cancelled — Dental Checkup at 2:00 PM", time: new Date(Date.now() - 26 * 3600000).toISOString(), read: true  },
  { id: "15", category: "customer",    title: "Customer marked VIP",         detail: "James Kaberuka upgraded to VIP status after 10th visit",       time: new Date(Date.now() - 48 * 3600000).toISOString(), read: true  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const categoryMeta: Record<NotifCategory, {
  icon: React.FC<{ className?: string }>;
  bg: string;
  color: string;
  label: string;
}> = {
  call:        { icon: Phone,         bg: "bg-blue-50",    color: "text-blue-600",   label: "Calls"        },
  appointment: { icon: CalendarCheck, bg: "bg-green-50",   color: "text-green-600",  label: "Appointments" },
  ticket:      { icon: TicketCheck,   bg: "bg-orange-50",  color: "text-orange-600", label: "Tickets"      },
  escalation:  { icon: AlertTriangle, bg: "bg-red-50",     color: "text-red-500",    label: "Escalations"  },
  message:     { icon: MessageSquare, bg: "bg-purple-50",  color: "text-purple-600", label: "Messages"     },
  customer:    { icon: Users,         bg: "bg-cyan-50",    color: "text-cyan-600",   label: "Customers"    },
  system:      { icon: Bot,           bg: "bg-muted",      color: "text-muted-foreground", label: "System" },
};

const ALL_FILTERS: Array<NotifCategory | "all"> = [
  "all", "call", "appointment", "ticket", "escalation", "message", "customer", "system",
];

const filterLabel: Record<NotifCategory | "all", string> = {
  all:         "All",
  call:        "Calls",
  appointment: "Appointments",
  ticket:      "Tickets",
  escalation:  "Escalations",
  message:     "Messages",
  customer:    "Customers",
  system:      "System",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(seedNotifs);
  const [filter, setFilter] = useState<NotifCategory | "all">("all");
  const [ticking, setTicking] = useState(0);

  // Refresh relative timestamps every minute
  useEffect(() => {
    const t = setInterval(() => setTicking((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);
  void ticking;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  const filtered = filter === "all"
    ? notifications
    : notifications.filter((n) => n.category === filter);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-6">
      {/* Header */}
      <div
        className="nav-card rounded-2xl px-6 py-5 mb-6"
        style={{ background: "linear-gradient(135deg, #0B1D3A, #132042)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">Notifications</h1>
              <p className="text-white/50 text-sm">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "You're all caught up"}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {ALL_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                filter === f
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {filterLabel[f]}
              {f !== "all" && (
                <span className="ml-1 opacity-60">
                  ({notifications.filter((n) => n.category === f).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notification list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-foreground">No notifications</p>
            <p className="text-sm text-muted-foreground mt-1">
              Nothing in the {filterLabel[filter].toLowerCase()} category yet.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((notif) => {
              const meta = categoryMeta[notif.category];
              const Icon = meta.icon;
              return (
                <li
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={cn(
                    "flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors",
                    notif.read
                      ? "hover:bg-muted/20"
                      : "bg-primary/[0.03] hover:bg-primary/[0.06]"
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      meta.bg
                    )}
                  >
                    <Icon className={cn("w-5 h-5", meta.color)} />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          notif.read
                            ? "font-medium text-foreground"
                            : "font-semibold text-foreground"
                        )}
                      >
                        {notif.title}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {relativeTime(notif.time)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {notif.detail}
                    </p>
                    {!notif.read && (
                      <span className="inline-block mt-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
