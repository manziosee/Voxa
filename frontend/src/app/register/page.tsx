"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Zap, ArrowRight, Eye, EyeOff, User, Mail, Lock, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/dashboard";
    }, 1400);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0B1D3A 0%, #132042 60%, #1a2c55 100%)" }}
      >
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "radial-gradient(circle, rgba(108,93,211,0.9) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/15 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-xl">Nexus</p>
              <p className="text-white/40 text-xs">Business OS</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4 leading-snug">
            Start your free<br />30-day trial
          </h2>
          <p className="text-white/60 text-sm mb-10 leading-relaxed">
            No credit card required. Get full access to all ERP modules, real-time collaboration, and AI automation.
          </p>

          {/* Plan highlights */}
          <div className="bg-white/[0.06] border border-white/[0.1] rounded-2xl p-5">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-4">Included in trial</p>
            <div className="flex flex-col gap-3">
              {["All 8 ERP modules", "Up to 25 team members", "Real-time collaboration", "AI command interface", "Priority support"].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-400/20 border border-green-400/40 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  </div>
                  <span className="text-white/70 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="relative text-white/30 text-xs">No credit card · Cancel anytime</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-foreground">Nexus</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{s}</div>
                <span className={`text-sm ${step >= s ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s === 1 ? "Account" : "Workspace"}</span>
                {s < 2 && <div className={`h-px w-8 ${step > s ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">
            {step === 1 ? "Create your account" : "Set up your workspace"}
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            {step === 1 ? "Join thousands of businesses using Nexus." : "Tell us about your organization."}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {step === 1 ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="firstName">First name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="firstName" placeholder="Ali" required className="pl-10" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" placeholder="Husni" required />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Work email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="ali@company.com" required className="pl-10" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" required className="pl-10 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="company">Company name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="company" placeholder="Acme Corp Ltd." required className="pl-10" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="size">Company size</Label>
                  <select id="size" className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>1-10 employees</option>
                    <option>11-50 employees</option>
                    <option>51-200 employees</option>
                    <option>201-1000 employees</option>
                    <option>1000+ employees</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="industry">Industry</Label>
                  <select id="industry" className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Finance & Banking</option>
                    <option>Retail & E-commerce</option>
                    <option>Manufacturing</option>
                    <option>Logistics & Transport</option>
                    <option>Healthcare</option>
                    <option>Technology</option>
                    <option>Other</option>
                  </select>
                </div>
              </>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating workspace…
                </div>
              ) : (
                <>{step === 1 ? "Continue" : "Create workspace"} <ArrowRight className="ml-2 w-4 h-4" /></>
              )}
            </Button>
          </form>

          {step === 2 && (
            <button onClick={() => setStep(1)} className="w-full text-center text-sm text-muted-foreground mt-3 hover:text-foreground transition-colors">
              ← Back to account details
            </button>
          )}

          <p className="text-center text-xs text-muted-foreground mt-6">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">Terms</a> and{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          </p>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
