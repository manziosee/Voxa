"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap, Users, BarChart3, Brain, Globe,
  ArrowRight, CheckCircle2, ChevronRight, Play,
  Shield, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
  { icon: Users, title: "Multiplayer ERP", desc: "Multiple users edit the same records simultaneously — like Google Docs for your entire business.", color: "text-primary", bg: "bg-accent" },
  { icon: RefreshCw, title: "Real-Time Sync", desc: "Instant updates across all modules — sales, warehouse, payroll, and fleet — without page refreshes.", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: Brain, title: "AI Automation", desc: "Natural language commands, smart inventory suggestions, fraud detection, and auto-generated reports.", color: "text-green-600", bg: "bg-green-50" },
  { icon: Globe, title: "Offline-First", desc: "Works without internet. Changes sync automatically when connectivity is restored — built for Africa.", color: "text-orange-500", bg: "bg-orange-50" },
  { icon: BarChart3, title: "Live Analytics", desc: "CEO dashboards, warehouse views, and regional analytics that update in real time as your business moves.", color: "text-purple-600", bg: "bg-purple-50" },
  { icon: Shield, title: "Smart Permissions", desc: "Role-based access, field-level security, and regional permissions with event-sourced audit trails.", color: "text-red-500", bg: "bg-red-50" },
];

const modules = ["HR & Payroll", "Accounting", "Inventory", "Procurement", "CRM", "POS", "Fleet", "Analytics"];
const stats = [{ value: "10K+", label: "Active Users" }, { value: "99.9%", label: "Uptime SLA" }, { value: "< 50ms", label: "Sync Latency" }, { value: "8 ERP", label: "Modules" }];

function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const steps = 60;
    const step = target / steps;
    let cur = 0;
    const timer = setInterval(() => {
      cur += step;
      if (cur >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(cur));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

export default function LandingPage() {
  const balance = useCounter(32456, 2500);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="nav-card sticky top-0 z-50 border-b border-white/[0.08]" style={{ background: "linear-gradient(135deg, #0B1D3A 0%, #132042 100%)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">Nexus</span>
            <span className="text-white/40 text-xs ml-1">Business OS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
            {["Features", "Modules", "Pricing", "Docs"].map((l) => (
              <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 border-0">Sign in</Button></Link>
            <Link href="/register"><Button className="bg-primary hover:bg-primary/90 text-white">Get Started <ArrowRight className="ml-1 w-4 h-4" /></Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-36" style={{ background: "linear-gradient(135deg, #0B1D3A 0%, #132042 50%, #1a2c55 100%)" }}>
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(circle, rgba(108,93,211,0.9) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/20 rounded-full blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.07] border border-white/[0.12] text-white/70 text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Now with AI-powered automation
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            The Real-Time<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C5DD3] to-[#4CA3FF]"> Multiplayer </span>Business OS
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Combine ERP, real-time collaboration, AI automation, and live analytics into one state-synchronized business operating system. Built for Africa.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register"><Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 h-12">Start Free Trial <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
            <Link href="/dashboard"><Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 h-12 gap-2"><Play className="w-4 h-4" />View Live Demo</Button></Link>
          </div>
          <div className="max-w-sm mx-auto bg-white/[0.06] backdrop-blur-sm border border-white/[0.12] rounded-2xl p-5 text-left">
            <p className="text-white/50 text-xs mb-1">Total Balance — Live</p>
            <p className="text-3xl font-bold text-white mb-3">${balance.toLocaleString()}.00</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-primary/20 rounded-lg p-2 text-center"><p className="text-xs text-white/50">Income</p><p className="text-sm font-semibold text-green-400">+$10,456</p></div>
              <div className="flex-1 bg-white/[0.05] rounded-lg p-2 text-center"><p className="text-xs text-white/50">Expense</p><p className="text-sm font-semibold text-red-400">-$2,456</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-primary mb-1">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Why Nexus</p>
          <h2 className="text-3xl font-bold text-foreground mb-4">Everything your business needs — live</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">No more page refreshes. No more data silos. Just one living, breathing business operating system.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-card border border-border rounded-2xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-4", f.bg)}>
                  <Icon className={cn("w-5 h-5", f.color)} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modules */}
      <section className="py-16 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Modules</p>
          <h2 className="text-2xl font-bold text-foreground mb-8">One platform, every business function</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {modules.map((m) => (
              <span key={m} className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-full text-sm font-medium border border-primary/20 hover:bg-primary hover:text-white transition-colors cursor-default">
                <CheckCircle2 className="w-3.5 h-3.5" />{m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <div className="bg-gradient-to-br from-[#0B1D3A] to-[#1a2c55] rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, rgba(108,93,211,0.9) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 mb-6"><Brain className="w-7 h-7 text-primary" /></div>
            <h2 className="text-3xl font-bold text-white mb-4">AI-Powered Commands</h2>
            <p className="text-white/60 max-w-xl mx-auto mb-8">Control your entire business with natural language. Just type what you need.</p>
            <div className="flex flex-col gap-2 max-w-md mx-auto mb-8">
              {['"Create invoice for customer with unpaid balance"', '"Show Kigali warehouse low stock items"', '"Generate payroll for Engineering team"'].map((cmd) => (
                <div key={cmd} className="flex items-center gap-3 bg-white/[0.07] border border-white/[0.12] rounded-xl px-4 py-2.5 text-left">
                  <ChevronRight className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-white/80 text-sm font-mono">{cmd}</span>
                </div>
              ))}
            </div>
            <Link href="/register"><Button className="bg-primary hover:bg-primary/90 text-white px-8">Try AI Commands Free <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10" style={{ background: "#0B1D3A" }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary"><Zap className="w-4 h-4 text-white" /></div>
            <span className="text-white font-bold">Nexus</span>
            <span className="text-white/30 text-xs">© 2026 All rights reserved</span>
          </div>
          <div className="flex gap-6 text-sm text-white/40">
            {["Privacy", "Terms", "Contact", "Docs"].map((l) => (
              <a key={l} href="#" className="hover:text-white/70 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
