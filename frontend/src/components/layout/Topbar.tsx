"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, ChevronDown, Wifi } from "lucide-react";
import { usePresence } from "@/lib/hooks/useRealtime";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TopbarProps {
  title?: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { users } = usePresence();
  const router = useRouter();
  const [notifCount, setNotifCount] = useState(3);
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="nav-card flex items-center gap-4 px-6 h-16 shrink-0 border-b border-white/[0.08]">
      {/* Page title */}
      <div className="flex-1 min-w-0">
        {title && (
          <div>
            <h1 className="text-white font-semibold text-base leading-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-white/50 text-xs">{subtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200",
          searchFocused
            ? "bg-white/10 border-primary/60 w-64"
            : "bg-white/[0.07] border-white/[0.1] w-48"
        )}
      >
        <Search className="w-4 h-4 text-white/50 shrink-0" />
        <input
          type="text"
          placeholder="Search anything here"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="bg-transparent text-white placeholder:text-white/40 text-sm outline-none w-full"
        />
      </div>

      {/* Live users presence */}
      <div className="flex items-center gap-1" title="Users online">
        <Wifi className="w-3.5 h-3.5 text-green-400 mr-1" />
        <div className="flex -space-x-2">
          {users.map((u) => (
            <img
              key={u.name}
              src={u.avatar}
              alt={u.name}
              title={u.name}
              className="w-7 h-7 rounded-full ring-2 ring-[var(--nav)] hover:scale-110 transition-transform cursor-pointer"
              style={{ boxShadow: `0 0 0 2px ${u.color}` }}
            />
          ))}
        </div>
        <span className="ml-1 text-white/50 text-xs">{users.length} online</span>
      </div>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Notifications"
          className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.07] hover:bg-white/12 transition-colors"
        >
          <Bell className="w-4 h-4 text-white/80" />
          {notifCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold">
              {notifCount}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="font-semibold text-sm">Notifications</span>
            {notifCount > 0 && (
              <button
                type="button"
                onClick={() => setNotifCount(0)}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <DropdownMenuSeparator />
          {[
            {
              msg: "New inbound call from +250780123456",
              sub: "Language: Kinyarwanda · 2 min ago",
              dot: "bg-blue-500",
            },
            {
              msg: "Appointment booked: Haircut at 10:00 AM",
              sub: "Via AI agent · 15 min ago",
              dot: "bg-green-500",
            },
            {
              msg: "Call escalated — frustrated caller",
              sub: "+250788654321 forwarded to human · 32 min ago",
              dot: "bg-red-500",
            },
          ].map((n, i) => (
            <DropdownMenuItem
              key={i}
              className="flex gap-3 cursor-pointer py-2.5 px-3"
              onClick={() => router.push("/dashboard/notifications")}
            >
              <span className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", n.dot)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug font-medium">{n.msg}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.sub}</p>
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="justify-center text-primary text-sm font-medium cursor-pointer"
            onClick={() => router.push("/dashboard/notifications")}
          >
            View all notifications
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="User menu"
          className="flex items-center gap-2 hover:bg-white/8 px-2 py-1 rounded-xl transition-colors"
        >
          <img
            src="https://i.pravatar.cc/36?u=voxa-admin"
            alt="Business Admin"
            className="w-8 h-8 rounded-full ring-2 ring-primary/50"
          />
          <ChevronDown className="w-3.5 h-3.5 text-white/60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-3 py-2">
            <p className="font-semibold text-sm">Business Admin</p>
            <p className="text-xs text-muted-foreground">admin@kigaliwellness.rw</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push("/dashboard/settings?tab=profile")}
          >
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push("/dashboard/settings?tab=notifications")}
          >
            Preferences
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive cursor-pointer"
            onClick={() => router.push("/login")}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
