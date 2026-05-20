"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Phone,
  CalendarCheck,
  AlertTriangle,
  Clock,
  Download,
} from "lucide-react";
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
  Legend,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { AnalyticsDashboard } from "@/lib/api";
import { cn } from "@/lib/utils";

const BUSINESS_ID = "demo-business";

const chartConfig = {
  calls: { label: "Calls", color: "#6C5DD3" },
  appointments: { label: "Appointments", color: "#4CA3FF" },
};

const FALLBACK_DAILY = [
  { date: "05/14", calls: 28 },
  { date: "05/15", calls: 35 },
  { date: "05/16", calls: 22 },
  { date: "05/17", calls: 47 },
  { date: "05/18", calls: 39 },
  { date: "05/19", calls: 31 },
  { date: "05/20", calls: 43 },
];

const FALLBACK_ANALYTICS: AnalyticsDashboard = {
  calls: { total_calls: 245, completed: 198, escalated: 21, missed: 26, escalation_rate_pct: 8.6, avg_duration_seconds: 187 },
  outcomes: { appointment_booked: 54, information_provided: 98, escalated: 21, callback_scheduled: 18, complaint_handled: 12, no_action: 9 },
  languages: { en: 112, fr: 68, sw: 43, rw: 22 },
  emotions: { neutral: 130, happy: 62, frustrated: 28, angry: 14, confused: 11 },
  appointments: { total_booked: 54, confirmed: 38, cancelled: 8, no_show: 4, completed: 4, conversion_rate_pct: 22.0 },
  whatsapp_conversations: 87,
  new_customers: 34,
};

const OUTCOME_COLORS = ["#6C5DD3", "#4CA3FF", "#F04438", "#F79009", "#12B76A", "#94A3B8"];
const EMOTION_COLORS = { neutral: "#94A3B8", happy: "#12B76A", frustrated: "#F79009", angry: "#F04438", confused: "#4CA3FF" };
const LANG_COLORS = ["#6C5DD3", "#4CA3FF", "#12B76A", "#F79009"];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("Week");
  const [analytics, setAnalytics] = useState<AnalyticsDashboard>(FALLBACK_ANALYTICS);
  const [dailyCalls, setDailyCalls] = useState(FALLBACK_DAILY);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [dash, daily] = await Promise.all([
          api.analytics.getDashboard(BUSINESS_ID),
          api.analytics.getDailyCalls(BUSINESS_ID),
        ]);
        if (!cancelled) {
          setAnalytics(dash);
          if (daily.data?.length) setDailyCalls(daily.data);
        }
      } catch {
        if (!cancelled) setApiError(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const kpis = [
    {
      label: "Total Calls",
      value: analytics.calls.total_calls.toString(),
      change: "+12.4%",
      up: true,
      icon: Phone,
      color: "text-primary",
      bg: "bg-accent",
    },
    {
      label: "Appt Conversion",
      value: `${analytics.appointments.conversion_rate_pct}%`,
      change: "+4.1%",
      up: true,
      icon: CalendarCheck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Escalation Rate",
      value: `${analytics.calls.escalation_rate_pct}%`,
      change: "-1.3%",
      up: false,
      icon: AlertTriangle,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      label: "Avg Duration",
      value: `${Math.floor(analytics.calls.avg_duration_seconds / 60)}m ${analytics.calls.avg_duration_seconds % 60}s`,
      change: "+5.2%",
      up: true,
      icon: Clock,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  const outcomesData = [
    { name: "Appt Booked", value: analytics.outcomes.appointment_booked },
    { name: "Info Provided", value: analytics.outcomes.information_provided },
    { name: "Escalated", value: analytics.outcomes.escalated },
    { name: "Callback", value: analytics.outcomes.callback_scheduled },
    { name: "Complaint", value: analytics.outcomes.complaint_handled },
    { name: "No Action", value: analytics.outcomes.no_action },
  ];

  const languageData = [
    { lang: "English", value: analytics.languages.en },
    { lang: "French", value: analytics.languages.fr },
    { lang: "Swahili", value: analytics.languages.sw },
    { lang: "Kinyarwanda", value: analytics.languages.rw },
  ];

  const emotionData = [
    { name: "Neutral", value: analytics.emotions.neutral, color: EMOTION_COLORS.neutral },
    { name: "Happy", value: analytics.emotions.happy, color: EMOTION_COLORS.happy },
    { name: "Frustrated", value: analytics.emotions.frustrated, color: EMOTION_COLORS.frustrated },
    { name: "Angry", value: analytics.emotions.angry, color: EMOTION_COLORS.angry },
    { name: "Confused", value: analytics.emotions.confused, color: EMOTION_COLORS.confused },
  ];

  const totalEmotions = emotionData.reduce((s, e) => s + e.value, 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div
        className="nav-card rounded-2xl px-6 py-5 mb-6"
        style={{ background: "linear-gradient(135deg, #0B1D3A, #132042)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">Analytics</h1>
            <p className="text-white/50 text-sm">AI voice agent performance insights</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {["Week", "Month", "Year"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    period === p ? "bg-primary text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <a
              href={api.analytics.exportCallsUrl(BUSINESS_ID)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </a>
          </div>
        </div>
        {apiError && (
          <div className="mt-3 px-3 py-2 bg-yellow-500/20 border border-yellow-500/40 rounded-xl text-yellow-200 text-xs">
            Failed to load data. Using demo data.
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", k.bg)}>
                  <Icon className={cn("w-5 h-5", k.color)} />
                </div>
                <span className={cn("text-xs font-semibold flex items-center gap-1", k.up ? "text-green-600" : "text-red-500")}>
                  {k.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {k.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Daily Call Volume */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <p className="font-semibold text-foreground mb-4 text-sm">Daily Call Volume</p>
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <AreaChart data={dailyCalls} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="callsGradA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C5DD3" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6C5DD3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="calls" stroke="#6C5DD3" fill="url(#callsGradA)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Call Outcomes pie */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="font-semibold text-foreground mb-4 text-sm">Call Outcomes</p>
          <ChartContainer config={chartConfig} className="h-40 w-full">
            <PieChart>
              <Pie
                data={outcomesData}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={64}
                paddingAngle={2}
                dataKey="value"
              >
                {outcomesData.map((_, i) => (
                  <Cell key={i} fill={OUTCOME_COLORS[i % OUTCOME_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [v, ""]} />
            </PieChart>
          </ChartContainer>
          <div className="flex flex-col gap-1.5 mt-2">
            {outcomesData.map((e, i) => (
              <div key={e.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: OUTCOME_COLORS[i % OUTCOME_COLORS.length] }} />
                  <span className="text-muted-foreground">{e.name}</span>
                </div>
                <span className="font-medium text-foreground">{e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Language Distribution */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="font-semibold text-foreground mb-4 text-sm">Language Distribution</p>
          <ChartContainer
            config={{ value: { label: "Calls", color: "#6C5DD3" } }}
            className="h-48 w-full"
          >
            <BarChart data={languageData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" vertical={false} />
              <XAxis dataKey="lang" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltipContent />} />
              {languageData.map((_, i) => null)}
              <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Calls">
                {languageData.map((_, i) => (
                  <Cell key={i} fill={LANG_COLORS[i % LANG_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        {/* Emotion Distribution */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="font-semibold text-foreground mb-4 text-sm">Emotion Distribution</p>
          <div className="flex flex-col gap-3 mt-2">
            {emotionData.map((e) => {
              const pct = totalEmotions > 0 ? Math.round((e.value / totalEmotions) * 100) : 0;
              return (
                <div key={e.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{e.name}</span>
                    <span className="text-xs font-semibold text-foreground">{e.value} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: e.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Export appointments */}
          <div className="mt-5 pt-4 border-t border-border">
            <a
              href={api.analytics.exportAppointmentsUrl(BUSINESS_ID)}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Download className="w-3.5 h-3.5" />
                Export Appointments CSV
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
