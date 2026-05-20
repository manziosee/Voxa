"use client";

import { useState, useEffect, useCallback } from "react";
import {
  api,
  type AnalyticsDashboard,
  type Call,
  type Appointment,
  type Ticket,
  type Customer,
  type Callback,
  type DailyCallData,
} from "@/lib/api";

// ── Generic hook result type ──────────────────────────────────────────────────

export interface HookResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ── useAnalytics ──────────────────────────────────────────────────────────────

export function useAnalytics(businessId: string): HookResult<AnalyticsDashboard> {
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.analytics.getDashboard(businessId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ── useDailyCalls ─────────────────────────────────────────────────────────────

export function useDailyCalls(businessId: string): HookResult<DailyCallData> {
  const [data, setData] = useState<DailyCallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.analytics.getDailyCalls(businessId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load daily calls");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ── useCalls ──────────────────────────────────────────────────────────────────

export function useCalls(businessId: string): HookResult<Call[]> {
  const [data, setData] = useState<Call[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.calls.list(businessId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calls");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ── useAppointments ───────────────────────────────────────────────────────────

export function useAppointments(businessId: string): HookResult<Appointment[]> {
  const [data, setData] = useState<Appointment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.appointments.list(businessId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ── useTickets ────────────────────────────────────────────────────────────────

export function useTickets(businessId: string): HookResult<Ticket[]> {
  const [data, setData] = useState<Ticket[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.tickets.list(businessId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ── useCustomers ──────────────────────────────────────────────────────────────

export function useCustomers(businessId: string): HookResult<Customer[]> {
  const [data, setData] = useState<Customer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.customers.list(businessId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ── useOutboundCallbacks ──────────────────────────────────────────────────────

export function useOutboundCallbacks(businessId: string): HookResult<Callback[]> {
  const [data, setData] = useState<Callback[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.outbound.getCallbacks(businessId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load callbacks");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
