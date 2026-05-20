"use client";

import React, { useState, useEffect } from "react";
import {
  Phone,
  ArrowUpRight,
  TrendingUp,
  Filter,
  MoreHorizontal,
  ArrowUpDown,
  Download,
  CalendarCheck,
  TicketIcon,
  Search,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useLiveNotifications } from "@/lib/hooks/useRealtime";
import { api } from "@/lib/api";
import type { AnalyticsDashboard, Call, Appointment } from "@/lib/api";
import { cn } from "@/lib/utils";

const BUSINESS_ID = "demo-business";

const chartConfig = {
  calls: { label: "Calls", color: "#6C5DD3" },
  appointments: { label: "Appointments", color: "#4CA3FF" },
};

const outcomesConfig = {
  value: { label: "Count", color: "#6C5DD3" },
};

// Fallback demo data
const FALLBACK_DAILY: Array<{ date: string; calls: number }> = [
  { date: "Mon", calls: 24 },
  { date: "Tue", calls: 31 },
  { date: "Wed", calls: 18 },
  { date: "Thu", calls: 42 },
  { date: "Fri", calls: 37 },
  { date: "Sat", calls: 15 },
  { date: "Sun", calls: 9 },
];

const FALLBACK_CALLS: Call[] = [
  { id: "1", business_id: BUSINESS_ID, caller_number: "+250780123456", direction: "inbound", started_at: "2026-05-20T08:12:00Z", duration_seconds: 142, language: "rw", emotion: "neutral", status: "completed", outcome: "appointment_booked" },
  { id: "2", business_id: BUSINESS_ID, caller_number: "+250788654321", direction: "inbound", started_at: "2026-05-20T09:05:00Z", duration_seconds: 87, language: "fr", emotion: "happy", status: "completed", outcome: "information_provided" },
  { id: "3", business_id: BUSINESS_ID, caller_number: "+254701234567", direction: "outbound", started_at: "2026-05-20T09:45:00Z", duration_seconds: 203, language: "en", emotion: "frustrated", status: "escalated", outcome: "escalated" },
  { id: "4", business_id: BUSINESS_ID, caller_number: "+250789012345", direction: "inbound", started_at: "2026-05-20T10:20:00Z", duration_seconds: 0, language: "rw", emotion: "neutral", status: "missed", outcome: "no_action" },
  { id: "5", business_id: BUSINESS_ID, caller_number: "+255713456789", direction: "inbound", started_at: "2026-05-20T11:00:00Z", duration_seconds: 315, language: "sw", emotion: "happy", status: "completed", outcome: "appointment_booked" },
  { id: "6", business_id: BUSINESS_ID, caller_number: "+250782345678", direction: "outbound", started_at: "2026-05-20T11:30:00Z", duration_seconds: 178, language: "en", emotion: "neutral", status: "completed", outcome: "callback_scheduled" },
];

const UPCOMING_APPOINTMENTS = [
  { service: "Hair & Beauty", time: "10:00 AM", status: "confirmed" },
  { service: "Dental Checkup", time: "11:30 AM", status: "scheduled" },
  { service: "Tech Consultation", time: "2:00 PM", status: "confirmed" },
];

const FALLBACK_APPOINTMENTS: Appointment[] = [
  { id: "1", business_id: BUSINESS_ID, service_name: "Hair & Beauty", scheduled_at: "2026-05-20T10:00:00Z", duration_minutes: 45, status: "confirmed", reminder_sent: true },
  { id: "2", business_id: BUSINESS_ID, service_name: "Dental Checkup", scheduled_at: "2026-05-20T11:30:00Z", duration_minutes: 30, status: "scheduled", reminder_sent: false },
  { id: "3", business_id: BUSINESS_ID, service_name: "Tech Consultation", scheduled_at: "2026-05-20T14:00:00Z", duration_minutes: 60, status: "confirmed", reminder_sent: true },
  { id: "4", business_id: BUSINESS_ID, service_name: "Eye Examination", scheduled_at: "2026-05-20T15:00:00Z", duration_minutes: 30, status: "scheduled", reminder_sent: false },
  { id: "5", business_id: BUSINESS_ID, service_name: "Massage Therapy", scheduled_at: "2026-05-19T09:00:00Z", duration_minutes: 60, status: "completed", reminder_sent: true },
  { id: "6", business_id: BUSINESS_ID, service_name: "Legal Advisory", scheduled_at: "2026-05-19T10:30:00Z", duration_minutes: 45, status: "cancelled", reminder_sent: false },
  { id: "7", business_id: BUSINESS_ID, service_name: "Physiotherapy", scheduled_at: "2026-05-18T08:00:00Z", duration_minutes: 60, status: "completed", reminder_sent: true },
];

const emotionEmoji: Record<string, string> = {
  neutral: "😐",
  happy: "😊",
  frustrated: "😤",
  angry: "😠",
  confused: "😕",
};

function fmtDuration(seconds: number | undefined): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function CallStatusBadge({ status }: { status: Call["status"] }) {
  const map: Record<Call["status"], string> = {
    completed: "badge-success",
    escalated: "badge-pending",
    missed: "badge-destructive",
    in_progress: "bg-blue-50 text-blue-600",
  };
  return (
    <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium", map[status])}>
      {status.replace("_", " ")}
    </span>
  );
}

function AppointmentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: "badge-success",
    scheduled: "badge-pending",
    cancelled: "badge-destructive",
  };
  return (
    <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium", map[status] ?? "bg-muted text-muted-foreground")}>
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const { notifications } = useLiveNotifications();
  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [dailyCalls, setDailyCalls] = useState(FALLBACK_DAILY);
  const [calls, setCalls] = useState<Call[]>(FALLBACK_CALLS);
  const [appointments, setAppointments] = useState<Appointment[]>(FALLBACK_APPOINTMENTS);
  const [apiError, setApiError] = useState(false);
  const [callSearch, setCallSearch] = useState("");
  const [callFilter, setCallFilter] = useState<"all" | "inbound" | "outbound" | "escalated" | "missed">("all");
  const [apptFilter, setApptFilter] = useState<"all" | "scheduled" | "confirmed" | "completed" | "cancelled">("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [dash, daily, callList, apptList] = await Promise.all([
          api.analytics.getDashboard(BUSINESS_ID),
          api.analytics.getDailyCalls(BUSINESS_ID),
          api.calls.list(BUSINESS_ID, 50),
          api.appointments.list(BUSINESS_ID),
        ]);
        if (!cancelled) {
          setAnalytics(dash);
          if (daily.data?.length) setDailyCalls(daily.data);
          if (callList?.length) setCalls(callList);
          if (apptList?.length) setAppointments(apptList);
        }
      } catch {
        if (!cancelled) setApiError(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const totalCalls = analytics?.calls.total_calls ?? 148;
  const appointmentsBooked = analytics?.appointments.total_booked ?? 34;
  const openTickets = 12;
  const escalationRate = analytics?.calls.escalation_rate_pct ?? 8.4;

  // Calls tab filtered list
  const filteredCalls = calls.filter((c) => {
    const matchSearch = callSearch === "" || c.caller_number.includes(callSearch);
    const matchFilter =
      callFilter === "all" ||
      (callFilter === "inbound" && c.direction === "inbound") ||
      (callFilter === "outbound" && c.direction === "outbound") ||
      (callFilter === "escalated" && c.status === "escalated") ||
      (callFilter === "missed" && c.status === "missed");
    return matchSearch && matchFilter;
  });

  // Appointments tab filtered list
  const filteredAppts = appointments.filter((a) =>
    apptFilter === "all" || a.status === apptFilter
  );

  // Analytics tab data
  const languageData = analytics
    ? [
        { name: "English", value: analytics.languages.en, color: "#6C5DD3" },
        { name: "French", value: analytics.languages.fr, color: "#4CA3FF" },
        { name: "Swahili", value: analytics.languages.sw, color: "#12B76A" },
        { name: "Kinyarwanda", value: analytics.languages.rw, color: "#F79009" },
      ]
    : [
        { name: "English", value: 62, color: "#6C5DD3" },
        { name: "French", value: 28, color: "#4CA3FF" },
        { name: "Swahili", value: 35, color: "#12B76A" },
        { name: "Kinyarwanda", value: 23, color: "#F79009" },
      ];

  const emotionData = analytics
    ? [
        { name: "Neutral", value: analytics.emotions.neutral, color: "#667085" },
        { name: "Happy", value: analytics.emotions.happy, color: "#12B76A" },
        { name: "Frustrated", value: analytics.emotions.frustrated, color: "#F79009" },
        { name: "Angry", value: analytics.emotions.angry, color: "#F04438" },
        { name: "Confused", value: analytics.emotions.confused, color: "#4CA3FF" },
      ]
    : [
        { name: "Neutral", value: 78, color: "#667085" },
        { name: "Happy", value: 34, color: "#12B76A" },
        { name: "Frustrated", value: 22, color: "#F79009" },
        { name: "Angry", value: 8, color: "#F04438" },
        { name: "Confused", value: 6, color: "#4CA3FF" },
      ];

  const outcomesData = analytics
    ? [
        { name: "Appt Booked", value: analytics.outcomes.appointment_booked },
        { name: "Info Provided", value: analytics.outcomes.information_provided },
        { name: "Escalated", value: analytics.outcomes.escalated },
        { name: "Callback", value: analytics.outcomes.callback_scheduled },
        { name: "Complaint", value: analytics.outcomes.complaint_handled },
        { name: "No Action", value: analytics.outcomes.no_action },
      ]
    : [
        { name: "Appt Booked", value: 18 },
        { name: "Info Provided", value: 52 },
        { name: "Escalated", value: 12 },
        { name: "Callback", value: 9 },
        { name: "Complaint", value: 7 },
        { name: "No Action", value: 5 },
      ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Dark hero header */}
      <div
        className="nav-card px-8 pt-7 pb-0 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0B1D3A 0%, #132042 60%, #1a2c55 100%)" }}
      >
        {/* Decorative dot grid */}
        <div
          className="absolute right-0 top-0 w-80 h-40 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(108,93,211,0.8) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />

        {apiError && (
          <div className="mb-3 px-3 py-2 bg-yellow-500/20 border border-yellow-500/40 rounded-xl text-yellow-200 text-xs">
            Failed to load data. Using demo data.
          </div>
        )}

        <div className="mb-5">
          <h2 className="text-white text-2xl font-bold">Voxa AI Dashboard</h2>
          <p className="text-white/50 text-sm mt-0.5">AI-powered voice agent overview</p>
        </div>

        {/* Tab nav */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent border-0 p-0 h-auto gap-2">
            {["overview", "calls", "appointments", "analytics"].map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className={cn(
                  "capitalize px-1 pb-3 pt-0 text-sm font-medium rounded-none border-b-2 border-transparent transition-all",
                  activeTab === t
                    ? "text-white border-white data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    : "text-white/50 hover:text-white/80 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                )}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="bg-background rounded-t-3xl p-6 mt-0 grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Left column */}
              <div className="flex flex-col gap-4">
                {/* Calls Today card */}
                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-muted-foreground text-sm">Calls Today</p>
                    <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-foreground mb-1">{totalCalls}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(totalCalls * 0.72)} inbound / {Math.round(totalCalls * 0.28)} outbound
                  </p>
                  <div className="flex gap-3 mt-4">
                    <Button size="sm" className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-white">
                      <Phone className="w-3.5 h-3.5" />
                      View Calls
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-2 border-primary text-primary hover:bg-accent">
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </Button>
                  </div>
                </div>

                {/* Upcoming Appointments */}
                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold text-foreground text-sm">Upcoming Appointments</p>
                    <CalendarCheck className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col gap-4">
                    {UPCOMING_APPOINTMENTS.map((appt, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{appt.service}</p>
                          <p className="text-xs text-muted-foreground">{appt.time}</p>
                        </div>
                        <AppointmentStatusBadge status={appt.status} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Middle column */}
              <div className="flex flex-col gap-4">
                {/* Daily Call Volume chart */}
                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold text-foreground text-sm">Daily Call Volume</p>
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <ChartContainer config={chartConfig} className="h-36 w-full">
                    <AreaChart data={dailyCalls} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6C5DD3" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6C5DD3" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="calls" stroke="#6C5DD3" fill="url(#callsGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ChartContainer>
                </div>

                {/* Appointments Booked */}
                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Appointments Booked</p>
                      <p className="text-2xl font-bold text-foreground">{appointmentsBooked}</p>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent">
                      <CalendarCheck className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <ArrowUpRight className="w-3 h-3" />
                    {analytics?.appointments.conversion_rate_pct ?? 22.9}% conversion rate
                  </p>
                </div>

                {/* Open Tickets */}
                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Open Tickets</p>
                      <p className="text-2xl font-bold text-foreground">{openTickets}</p>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-50">
                      <TicketIcon className="w-5 h-5 text-orange-500" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">3 urgent, 5 high priority</p>
                </div>
              </div>

              {/* Right column */}
              <div className="flex flex-col gap-4">
                {/* Escalation Rate */}
                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-muted-foreground text-xs">Escalation Rate</p>
                    <span className="text-xs font-semibold text-orange-500">{escalationRate}%</span>
                  </div>
                  <p className="text-xl font-bold text-foreground mb-1">
                    {analytics?.calls.escalated ?? 12} escalated{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      from {totalCalls} calls
                    </span>
                  </p>
                  <Progress value={escalationRate} className="h-2 mt-3" />
                </div>

                {/* Call Outcomes chart */}
                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-muted-foreground text-xs">Call Outcomes</p>
                  </div>
                  <ChartContainer config={outcomesConfig} className="h-20 w-full mb-3">
                    <BarChart data={outcomesData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#667085" }} axisLine={false} tickLine={false} />
                      <Bar dataKey="value" fill="#6C5DD3" radius={[4, 4, 0, 0]} />
                      <Tooltip content={<ChartTooltipContent />} />
                    </BarChart>
                  </ChartContainer>
                  <div className="flex gap-3 flex-wrap text-xs">
                    {[
                      { label: "Booked", color: "#6C5DD3", val: outcomesData[0].value },
                      { label: "Info", color: "#4CA3FF", val: outcomesData[1].value },
                      { label: "Escalated", color: "#F04438", val: outcomesData[2].value },
                    ].map((e) => (
                      <div key={e.label}>
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
                          <span className="text-muted-foreground">{e.label}</span>
                        </div>
                        <p className="font-semibold text-foreground">{e.val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live activity feed */}
                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                  <p className="text-xs font-semibold text-foreground mb-3">Live Activity</p>
                  <div className="flex flex-col gap-2 max-h-32 overflow-y-auto scrollbar-hidden">
                    {notifications.slice(0, 4).map((n) => (
                      <div key={n.id} className="flex items-start gap-2">
                        <span
                          className={cn(
                            "mt-1 w-1.5 h-1.5 rounded-full shrink-0",
                            n.type === "success" ? "bg-green-500" : n.type === "warning" ? "bg-yellow-500" : "bg-primary"
                          )}
                        />
                        <div>
                          <p className="text-xs text-foreground leading-snug">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground">{n.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Calls table */}
            <div className="bg-background px-6 pb-6">
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <p className="font-semibold text-foreground">Recent Calls</p>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground text-xs">
                      <Filter className="w-3.5 h-3.5" />
                      Filter
                    </Button>
                    <button aria-label="More options" type="button" className="text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {["Caller", "Direction", "Duration", "Language", "Emotion", "Status"].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                            <div className="flex items-center gap-1">
                              {h}
                              <ArrowUpDown className="w-3 h-3 opacity-50" />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {calls.map((call) => (
                        <tr key={call.id} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                                <Phone className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <p className="text-sm font-medium text-foreground font-mono">{call.caller_number}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-medium",
                              call.direction === "inbound" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                            )}>
                              {call.direction}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{fmtDuration(call.duration_seconds)}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-muted rounded text-xs font-medium text-muted-foreground uppercase">
                              {call.language ?? "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {call.emotion ? `${emotionEmoji[call.emotion] ?? ""}  ${call.emotion}` : "—"}
                          </td>
                          <td className="px-6 py-4">
                            <CallStatusBadge status={call.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Calls Tab ─────────────────────────────────────────────────────── */}
          <TabsContent value="calls">
            <div className="bg-background rounded-t-3xl px-6 py-5 mt-0">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                <div className="relative flex-1 min-w-0 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by number…"
                    value={callSearch}
                    onChange={(e) => setCallSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(["all", "inbound", "outbound", "escalated", "missed"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setCallFilter(f)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize",
                        callFilter === f
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calls table */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        {["Caller", "Direction", "Started", "Duration", "Language", "Emotion", "Status"].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">
                            <div className="flex items-center gap-1">
                              {h}
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCalls.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                            No calls match your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredCalls.map((call) => (
                          <tr key={call.id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                                  <Phone className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <span className="text-sm font-medium font-mono">{call.caller_number}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-xs font-medium",
                                call.direction === "inbound" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                              )}>
                                {call.direction}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(call.started_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="px-5 py-3.5 text-sm text-muted-foreground">{fmtDuration(call.duration_seconds)}</td>
                            <td className="px-5 py-3.5">
                              <span className="px-2 py-0.5 bg-muted rounded text-xs font-medium text-muted-foreground uppercase">
                                {call.language ?? "—"}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-sm">
                              {call.emotion ? `${emotionEmoji[call.emotion] ?? ""} ${call.emotion}` : "—"}
                            </td>
                            <td className="px-5 py-3.5">
                              <CallStatusBadge status={call.status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
                  <span>{filteredCalls.length} call{filteredCalls.length !== 1 ? "s" : ""} shown</span>
                  <a href="/dashboard/calls" className="text-primary hover:underline font-medium">View full call log →</a>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Appointments Tab ───────────────────────────────────────────────── */}
          <TabsContent value="appointments">
            <div className="bg-background rounded-t-3xl px-6 py-5 mt-0">
              {/* Filter pills */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                {(["all", "scheduled", "confirmed", "completed", "cancelled"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setApptFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize",
                      apptFilter === f
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f}
                    <span className="ml-1 opacity-60">
                      ({f === "all" ? appointments.length : appointments.filter((a) => a.status === f).length})
                    </span>
                  </button>
                ))}
              </div>

              {/* Appointments list */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                {filteredAppts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <CalendarCheck className="w-9 h-9 text-muted-foreground/40 mb-2" />
                    <p className="font-medium text-foreground text-sm">No appointments</p>
                    <p className="text-xs text-muted-foreground mt-1">Nothing in the {apptFilter} category.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {filteredAppts.map((appt) => {
                      const d = new Date(appt.scheduled_at);
                      return (
                        <li key={appt.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                          {/* Date badge */}
                          <div className="w-11 h-11 rounded-xl bg-accent flex flex-col items-center justify-center shrink-0">
                            <span className="text-[10px] font-semibold text-primary uppercase leading-none">
                              {d.toLocaleString("default", { month: "short" })}
                            </span>
                            <span className="text-base font-bold text-foreground leading-tight">{d.getDate()}</span>
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-snug truncate">{appt.service_name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" })}
                              {appt.duration_minutes && ` · ${appt.duration_minutes} min`}
                            </p>
                          </div>
                          {/* Reminder badge */}
                          {appt.reminder_sent ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                              Reminded
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                              <XCircle className="w-3 h-3" />
                              No reminder
                            </span>
                          )}
                          {/* Status */}
                          <AppointmentStatusBadge status={appt.status} />
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
                  <span>{filteredAppts.length} appointment{filteredAppts.length !== 1 ? "s" : ""}</span>
                  <a href="/dashboard/appointments" className="text-primary hover:underline font-medium">Manage appointments →</a>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Analytics Tab ──────────────────────────────────────────────────── */}
          <TabsContent value="analytics">
            <div className="bg-background rounded-t-3xl px-6 py-5 mt-0 space-y-5">
              {/* KPI row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Calls", value: totalCalls, icon: Phone, color: "text-primary", bg: "bg-accent" },
                  { label: "Appointments", value: appointmentsBooked, icon: CalendarCheck, color: "text-green-600", bg: "bg-green-50" },
                  { label: "Escalations", value: analytics?.calls.escalated ?? 12, icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50" },
                  { label: "Avg Duration", value: `${analytics?.calls.avg_duration_seconds ? Math.round(analytics.calls.avg_duration_seconds / 60) : 3}m`, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", bg)}>
                      <Icon className={cn("w-5 h-5", color)} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-xl font-bold text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Daily Call Volume */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold text-sm text-foreground">Daily Call Volume</p>
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <ChartContainer config={chartConfig} className="h-48 w-full">
                    <AreaChart data={dailyCalls} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="anaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6C5DD3" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6C5DD3" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="calls" stroke="#6C5DD3" fill="url(#anaGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ChartContainer>
                </div>

                {/* Call Outcomes */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold text-sm text-foreground">Call Outcomes</p>
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <ChartContainer config={outcomesConfig} className="h-48 w-full">
                    <BarChart data={outcomesData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="#6C5DD3" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </div>

                {/* Language Distribution */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <p className="font-semibold text-sm text-foreground mb-4">Language Distribution</p>
                  <div className="flex items-center gap-6">
                    <ChartContainer config={{}} className="h-36 w-36 shrink-0">
                      <PieChart>
                        <Pie data={languageData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" paddingAngle={3}>
                          {languageData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [`${v} calls`]} />
                      </PieChart>
                    </ChartContainer>
                    <div className="flex flex-col gap-2 flex-1">
                      {languageData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                            <span className="text-muted-foreground">{d.name}</span>
                          </div>
                          <span className="font-semibold text-foreground">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Emotion Distribution */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <p className="font-semibold text-sm text-foreground mb-4">Caller Emotions</p>
                  <div className="space-y-3">
                    {emotionData.map((e) => {
                      const total = emotionData.reduce((s, x) => s + x.value, 0);
                      const pct = total > 0 ? Math.round((e.value / total) * 100) : 0;
                      return (
                        <div key={e.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <span>{emotionEmoji[e.name.toLowerCase()] ?? ""}</span>
                              {e.name}
                            </span>
                            <span className="text-xs font-semibold text-foreground">{e.value} <span className="font-normal text-muted-foreground">({pct}%)</span></span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: e.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
