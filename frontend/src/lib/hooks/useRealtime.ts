"use client";

import { useState, useEffect, useCallback } from "react";
import { onlineUsers } from "@/lib/mock-data";

export interface PresenceUser {
  name: string;
  avatar: string;
  color: string;
}

export interface LiveNotification {
  id: string;
  message: string;
  timestamp: string;
  type: "info" | "success" | "warning";
}

type NotifType = LiveNotification["type"];

const NOTIF_TYPES: NotifType[] = ["info", "success", "warning"];

const VOXA_MESSAGES = [
  "New inbound call from 250780123456",
  "Appointment booked: Haircut at 10:00 AM",
  "Ticket escalated: Customer complaint - billing issue",
  "Outbound call completed to 254701234567",
  "AI detected frustrated emotion on last call",
  "Callback scheduled for 250788654321 at 3:00 PM",
  "WhatsApp confirmation sent for tomorrow appointment",
  "New customer registered: Amara Diallo",
  "IVR menu option 2 selected - appointment booking",
  "Call summary generated for 250782345678",
  "Ticket 1042 resolved by AI agent",
  "Language detected: Kinyarwanda on 250789012345",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Simulates real-time presence - returns users currently online */
export function usePresence() {
  const [users, setUsers] = useState<PresenceUser[]>(onlineUsers.slice(0, 2));

  useEffect(() => {
    const interval = setInterval(() => {
      const count = Math.floor(Math.random() * onlineUsers.length) + 1;
      setUsers(onlineUsers.slice(0, count));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return { users };
}

/** Simulates live activity feed notifications */
export function useLiveNotifications() {
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);

  useEffect(() => {
    const addNotification = () => {
      const notif: LiveNotification = {
        id: Date.now().toString(),
        message: pickRandom(VOXA_MESSAGES),
        timestamp: new Date().toLocaleTimeString(),
        type: pickRandom(NOTIF_TYPES),
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 8));
    };

    const interval = setInterval(addNotification, 6000);
    addNotification();
    return () => clearInterval(interval);
  }, []);

  return { notifications };
}

/** Simulates a live KPI ticker */
export function useLiveKPIs() {
  const [kpis, setKpis] = useState({
    totalBalance: 32456,
    totalIncome: 10456,
    totalExpense: 2456,
    activeUsers: 142,
  });

  const updateKPIs = useCallback(() => {
    setKpis((prev) => ({
      totalBalance: prev.totalBalance + Math.floor(Math.random() * 200 - 50),
      totalIncome: prev.totalIncome + Math.floor(Math.random() * 150),
      totalExpense: prev.totalExpense + Math.floor(Math.random() * 80),
      activeUsers: prev.activeUsers + Math.floor(Math.random() * 5 - 2),
    }));
  }, []);

  useEffect(() => {
    const interval = setInterval(updateKPIs, 10000);
    return () => clearInterval(interval);
  }, [updateKPIs]);

  return { kpis };
}
