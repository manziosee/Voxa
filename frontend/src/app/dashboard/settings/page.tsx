"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  User, Bell, Shield, Globe, Key, Zap, Save, Plus, Trash2, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import type { ApiKey, IVRConfig, WebhookConfig } from "@/lib/api";
import { cn } from "@/lib/utils";

const BUSINESS_ID = "demo-business";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "ivr", label: "IVR Config", icon: Globe },
  { id: "apikeys", label: "API Keys", icon: Key },
  { id: "ai", label: "AI Settings", icon: Zap },
];

// ── IVR Tab ───────────────────────────────────────────────────────────────────

function IVRTab() {
  const [config, setConfig] = useState<IVRConfig>({
    enabled: true,
    welcome_message: "Welcome to our business. Press 1 for appointments, 2 for support.",
    language: "en",
    menu_options: [
      { digit: "1", label: "Book Appointment", action: "book_appointment" },
      { digit: "2", label: "Customer Support", action: "support_ticket" },
      { digit: "3", label: "Business Hours", action: "info_hours" },
    ],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.ivr.get(BUSINESS_ID).then(setConfig).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.ivr.update(BUSINESS_ID, config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save IVR config.");
    } finally {
      setSaving(false);
    }
  };

  const updateOption = (i: number, field: "digit" | "label" | "action", val: string) => {
    setConfig((prev) => {
      const opts = [...prev.menu_options];
      opts[i] = { ...opts[i], [field]: val };
      return { ...prev, menu_options: opts };
    });
  };

  const addOption = () => {
    setConfig((prev) => ({
      ...prev,
      menu_options: [...prev.menu_options, { digit: "", label: "", action: "" }],
    }));
  };

  const removeOption = (i: number) => {
    setConfig((prev) => ({
      ...prev,
      menu_options: prev.menu_options.filter((_, idx) => idx !== i),
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-semibold text-foreground mb-1">IVR Configuration</h2>
        <p className="text-sm text-muted-foreground">Configure your interactive voice response menu.</p>
      </div>
      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Enable IVR</p>
          <p className="text-xs text-muted-foreground">Turn the IVR menu on or off for incoming calls</p>
        </div>
        <Switch checked={config.enabled} onCheckedChange={(v) => setConfig((p) => ({ ...p, enabled: v }))} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Welcome Message</Label>
        <Input
          value={config.welcome_message ?? ""}
          onChange={(e) => setConfig((p) => ({ ...p, welcome_message: e.target.value }))}
          placeholder="Welcome to our business..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ivr-language">Default Language</Label>
        <select
          id="ivr-language"
          title="Default IVR language"
          value={config.language ?? "en"}
          onChange={(e) => setConfig((p) => ({ ...p, language: e.target.value }))}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="sw">Swahili</option>
          <option value="rw">Kinyarwanda</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label>Menu Options</Label>
          <Button type="button" size="sm" variant="outline" onClick={addOption} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />Add Option
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {config.menu_options.map((opt, i) => (
            <div key={i} className="grid grid-cols-[60px_1fr_1fr_36px] gap-2 items-center">
              <Input
                value={opt.digit}
                onChange={(e) => updateOption(i, "digit", e.target.value)}
                placeholder="Digit"
                className="text-center"
              />
              <Input
                value={opt.label}
                onChange={(e) => updateOption(i, "label", e.target.value)}
                placeholder="Label (e.g. Book Appointment)"
              />
              <Input
                value={opt.action}
                onChange={(e) => updateOption(i, "action", e.target.value)}
                placeholder="Action key"
              />
              <button
                type="button"
                title="Remove menu option"
                aria-label="Remove menu option"
                onClick={() => removeOption(i)}
                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="mt-2 flex justify-end">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={cn("bg-primary hover:bg-primary/90 text-white gap-2", saved && "bg-green-600 hover:bg-green-600")}
        >
          <Save className="w-4 h-4" />
          {saved ? "Saved!" : saving ? "Saving..." : "Save IVR Config"}
        </Button>
      </div>
    </div>
  );
}

// ── API Keys Tab ──────────────────────────────────────────────────────────────

function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.keys.list(BUSINESS_ID)
      .then(setKeys)
      .catch(() => {
        setKeys([
          { id: "1", name: "Production Key", prefix: "vxa_prod_", scopes: ["calls:read", "analytics:read"], created_at: "2026-04-01T00:00:00Z", last_used: "2026-05-19T14:32:00Z" },
          { id: "2", name: "Webhook Listener", prefix: "vxa_wh_", scopes: ["webhooks:write"], created_at: "2026-04-15T00:00:00Z" },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!newKeyName.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await api.keys.create(BUSINESS_ID, {
        name: newKeyName.trim(),
        scopes: ["calls:read", "analytics:read", "appointments:write"],
      });
      setRawKey(result.raw_key);
      setShowModal(true);
      setKeys((prev) => [...prev, result]);
      setNewKeyName("");
    } catch {
      setError("Failed to generate key. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyKey = () => {
    if (rawKey) {
      navigator.clipboard.writeText(rawKey).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-semibold text-foreground mb-1">API Keys</h2>
        <p className="text-sm text-muted-foreground">Manage API keys for programmatic access to Voxa.</p>
      </div>
      <Separator />

      {/* Generate new key */}
      <div className="flex gap-3">
        <Input
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Key name (e.g. Production App)"
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !newKeyName.trim()}
          className="bg-primary hover:bg-primary/90 text-white gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          {generating ? "Generating..." : "Generate New Key"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Keys table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 rounded-xl animate-pulse bg-muted" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Name", "Prefix", "Created", "Last Used"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{k.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{k.prefix}****</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(k.created_at)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {k.last_used ? fmtDate(k.last_used) : "Never"}
                  </td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No API keys yet. Generate your first key above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Raw key modal */}
      {showModal && rawKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="font-bold text-foreground mb-2">Your New API Key</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Copy this key now — it will not be shown again.
            </p>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-xl mb-4">
              <code className="flex-1 text-xs text-foreground break-all font-mono">{rawKey}</code>
              <button type="button" onClick={copyKey} className="p-1.5 rounded-lg hover:bg-accent transition-colors shrink-0">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
            <Button
              type="button"
              onClick={() => { setShowModal(false); setRawKey(null); }}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              I have copied my key
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Webhooks section (inside integrations / IVR tab) ──────────────────────────

function WebhooksSection() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.webhooks.list(BUSINESS_ID).then(setWebhooks).catch(() => {
      setWebhooks([
        {
          id: "1",
          business_id: BUSINESS_ID,
          url: "https://myapp.example.com/voxa-webhook",
          events: ["call.completed", "appointment.booked"],
          active: true,
          created_at: "2026-04-10T00:00:00Z",
        },
      ]);
    });
  }, []);

  const handleAdd = async () => {
    if (!url.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const result = await api.webhooks.create({
        business_id: BUSINESS_ID,
        url: url.trim(),
        events: ["call.completed", "appointment.booked", "ticket.escalated"],
      });
      setWebhooks((prev) => [...prev, result]);
      setUrl("");
    } catch {
      setError("Failed to add webhook. Check the URL and try again.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mt-6">
      <Separator className="mb-6" />
      <h3 className="font-semibold text-foreground mb-1 text-sm">Webhooks</h3>
      <p className="text-xs text-muted-foreground mb-4">Receive real-time event notifications via HTTP POST.</p>
      <div className="flex gap-3 mb-4">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-endpoint.com/webhook"
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={adding || !url.trim()}
          className="bg-primary hover:bg-primary/90 text-white gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          {adding ? "Adding..." : "Add Webhook"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}
      <div className="flex flex-col gap-2">
        {webhooks.map((wh) => (
          <div key={wh.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
            <div className={cn("w-2 h-2 rounded-full shrink-0", wh.active ? "bg-green-500" : "bg-muted-foreground")} />
            <p className="text-sm text-foreground font-mono flex-1 truncate">{wh.url}</p>
            <div className="flex gap-1 flex-wrap">
              {wh.events.slice(0, 2).map((ev) => (
                <span key={ev} className="px-2 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">{ev}</span>
              ))}
              {wh.events.length > 2 && (
                <span className="px-2 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">+{wh.events.length - 2}</span>
              )}
            </div>
          </div>
        ))}
        {webhooks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No webhooks configured.</p>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function SettingsInner() {
  const searchParams = useSearchParams();
  const validTabs = ["profile", "notifications", "security", "ivr", "apikeys", "ai"];
  const initialTab = validTabs.includes(searchParams.get("tab") ?? "")
    ? (searchParams.get("tab") as string)
    : "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const showSaveButton = ["profile", "notifications", "security", "ai"].includes(activeTab);

  return (
    <div className="p-6">
      {/* Header */}
      <div
        className="nav-card rounded-2xl px-6 py-5 mb-6"
        style={{ background: "linear-gradient(135deg, #0B1D3A, #132042)" }}
      >
        <h1 className="text-white text-xl font-bold">Settings</h1>
        <p className="text-white/50 text-sm">Manage your Voxa account and agent preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Tab sidebar */}
        <div className="w-48 shrink-0">
          <div className="bg-card border border-border rounded-2xl p-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                    activeTab === t.id
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-card border border-border rounded-2xl p-6">
          {activeTab === "profile" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-semibold text-foreground mb-1">Profile</h2>
                <p className="text-sm text-muted-foreground">Update your business profile information.</p>
              </div>
              <Separator />
              <div className="flex items-center gap-5">
                <img src="https://i.pravatar.cc/80?u=voxa-admin" alt="Avatar" className="w-20 h-20 rounded-full ring-4 ring-primary/20" />
                <div>
                  <Button variant="outline" size="sm">Change photo</Button>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 2MB</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5"><Label>Business Name</Label><Input defaultValue="Kigali Wellness Center" /></div>
                <div className="flex flex-col gap-1.5"><Label>Contact Name</Label><Input defaultValue="Business Admin" /></div>
                <div className="flex flex-col gap-1.5 col-span-2"><Label>Email</Label><Input type="email" defaultValue="admin@kigaliwellness.rw" /></div>
                <div className="flex flex-col gap-1.5 col-span-2"><Label>Phone Number</Label><Input defaultValue="+250780123456" /></div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-semibold text-foreground mb-1">Notifications</h2>
                <p className="text-sm text-muted-foreground">Control how you receive Voxa alerts.</p>
              </div>
              <Separator />
              <div className="flex flex-col gap-5">
                {[
                  { l: "New call alerts", d: "Get notified on every new inbound or outbound call" },
                  { l: "Appointment reminders", d: "Reminders before scheduled appointments" },
                  { l: "Escalation alerts", d: "When a call is escalated by the AI agent" },
                  { l: "Ticket updates", d: "Status changes on support tickets" },
                  { l: "Callback reminders", d: "When a scheduled callback is due" },
                ].map((n) => (
                  <div key={n.l} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{n.l}</p>
                      <p className="text-xs text-muted-foreground">{n.d}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-semibold text-foreground mb-1">Security</h2>
                <p className="text-sm text-muted-foreground">Manage your account security.</p>
              </div>
              <Separator />
              <div className="flex flex-col gap-4">
                {[
                  { l: "Current password", p: "Enter current password" },
                  { l: "New password", p: "Min. 8 characters" },
                  { l: "Confirm new password", p: "Repeat new password" },
                ].map((f) => (
                  <div key={f.l} className="flex flex-col gap-1.5">
                    <Label>{f.l}</Label>
                    <Input type="password" placeholder={f.p} />
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Two-factor authentication</p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Switch />
              </div>
            </div>
          )}

          {activeTab === "ivr" && (
            <>
              <IVRTab />
              <WebhooksSection />
            </>
          )}

          {activeTab === "apikeys" && <ApiKeysTab />}

          {activeTab === "ai" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-semibold text-foreground mb-1">AI Settings</h2>
                <p className="text-sm text-muted-foreground">Configure Voxa AI agent behaviour.</p>
              </div>
              <Separator />
              <div className="flex flex-col gap-5">
                {[
                  { l: "Enable multilingual detection", d: "Auto-detect caller language (en/fr/sw/rw)" },
                  { l: "Auto-generate call summaries", d: "AI writes a summary after each call" },
                  { l: "Emotion detection", d: "Detect caller emotion in real time" },
                  { l: "Auto-escalation", d: "Escalate to a human agent when frustration is detected" },
                  { l: "WhatsApp confirmations", d: "Send appointment confirmations via WhatsApp" },
                ].map((n) => (
                  <div key={n.l} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{n.l}</p>
                      <p className="text-xs text-muted-foreground">{n.d}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>
            </div>
          )}

          {showSaveButton && (
            <div className="mt-8 pt-6 border-t border-border flex justify-end">
              <Button
                type="button"
                onClick={handleSave}
                className={cn(
                  "bg-primary hover:bg-primary/90 text-white gap-2",
                  saved && "bg-green-600 hover:bg-green-600"
                )}
              >
                <Save className="w-4 h-4" />
                {saved ? "Saved!" : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 animate-pulse"><div className="h-32 bg-muted rounded-2xl" /></div>}>
      <SettingsInner />
    </Suspense>
  );
}
