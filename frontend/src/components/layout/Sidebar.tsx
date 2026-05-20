"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Building2,
  Phone,
  PhoneOutgoing,
  CalendarCheck,
  TicketCheck,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calls", href: "/dashboard/calls", icon: Phone },
  { label: "Appointments", href: "/dashboard/appointments", icon: CalendarCheck },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { type: "divider", label: "Voxa" },
  { label: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Tickets", href: "/dashboard/tickets", icon: TicketCheck },
  { label: "Outbound", href: "/dashboard/outbound", icon: PhoneOutgoing },
  { type: "divider", label: "Admin" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sidebar-panel relative flex flex-col shrink-0 h-full transition-all duration-300 ease-in-out border-r",
        "border-[var(--sidebar-border)]",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--sidebar-border)]">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-base leading-tight">Voxa</p>
            <p className="text-[var(--sidebar-foreground)]/50 text-[11px]">
              AI Voice Agent
            </p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 overflow-y-auto scrollbar-hidden">
        {navItems.map((item, i) => {
          if ("type" in item && item.type === "divider") {
            return !collapsed ? (
              <p
                key={i}
                className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--sidebar-foreground)]/40"
              >
                {item.label}
              </p>
            ) : (
              <div
                key={i}
                className="mx-3 my-3 border-t border-[var(--sidebar-border)]"
              />
            );
          }

          if (!("href" in item)) return null;
          const Icon = item.icon!;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href ?? ""));

          return (
            <Link
              key={item.href ?? i}
              href={item.href ?? "/dashboard"}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "text-[var(--sidebar-foreground)]/70 hover:bg-[var(--sidebar-accent)] hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "shrink-0 transition-colors",
                  collapsed ? "w-5 h-5" : "w-4 h-4",
                  isActive ? "text-white" : "text-[var(--sidebar-foreground)]/60 group-hover:text-white"
                )}
              />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      {!collapsed && (
        <div className="p-4 border-t border-[var(--sidebar-border)]">
          <div className="flex items-center gap-3">
            <img
              src="https://i.pravatar.cc/36?u=voxa-admin"
              alt="Business Admin"
              className="w-9 h-9 rounded-full ring-2 ring-primary/40"
            />
            <div className="flex-1 overflow-hidden">
              <p className="text-white text-sm font-semibold truncate">
                Business Admin
              </p>
              <p className="text-[var(--sidebar-foreground)]/50 text-xs truncate">
                Business Admin
              </p>
            </div>
            <Building2 className="w-4 h-4 text-[var(--sidebar-foreground)]/40" />
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-[72px] flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white shadow-md hover:scale-110 transition-transform z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </aside>
  );
}
