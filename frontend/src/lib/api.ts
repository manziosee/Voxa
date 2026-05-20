// Voxa API client — all backend endpoints typed and namespaced

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Auth helpers ──────────────────────────────────────────────────────────────

export function setApiKey(key: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("voxa_api_key", key);
  }
}

export function getApiKey(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("voxa_api_key");
  }
  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AnalyticsDashboard {
  calls: {
    total_calls: number;
    completed: number;
    escalated: number;
    missed: number;
    escalation_rate_pct: number;
    avg_duration_seconds: number;
  };
  outcomes: {
    appointment_booked: number;
    information_provided: number;
    escalated: number;
    callback_scheduled: number;
    complaint_handled: number;
    no_action: number;
  };
  languages: {
    en: number;
    fr: number;
    sw: number;
    rw: number;
  };
  emotions: {
    neutral: number;
    happy: number;
    frustrated: number;
    angry: number;
    confused: number;
  };
  appointments: {
    total_booked: number;
    confirmed: number;
    cancelled: number;
    no_show: number;
    completed: number;
    conversion_rate_pct: number;
  };
  whatsapp_conversations: number;
  new_customers: number;
}

export interface DailyCallData {
  data: Array<{ date: string; calls: number }>;
}

export interface Call {
  id: string;
  business_id: string;
  caller_number: string;
  direction: "inbound" | "outbound";
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  language?: string;
  emotion?: string;
  status: "completed" | "escalated" | "missed" | "in_progress";
  outcome?: string;
  summary?: string;
  transcripts?: Array<{ role: string; text: string; timestamp: string }>;
}

export interface Customer {
  id: string;
  business_id: string;
  phone_number: string;
  name?: string;
  preferred_language?: string;
  last_contact?: string;
  notes?: string;
  status?: "active" | "vip" | "blocked";
}

export interface Appointment {
  id: string;
  business_id: string;
  customer_id?: string;
  service_name: string;
  scheduled_at: string;
  duration_minutes?: number;
  status: "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";
  reminder_sent?: boolean;
  notes?: string;
}

export interface CreateAppointmentBody {
  business_id: string;
  customer_id?: string;
  service_name: string;
  scheduled_at: string;
  duration_minutes?: number;
  notes?: string;
}

export interface UpdateAppointmentBody {
  status?: Appointment["status"];
  scheduled_at?: string;
  notes?: string;
  duration_minutes?: number;
}

export interface Ticket {
  id: string;
  business_id: string;
  customer_id?: string;
  subject: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  updated_at?: string;
}

export interface CreateTicketBody {
  business_id: string;
  customer_id?: string;
  subject: string;
  description?: string;
  priority?: Ticket["priority"];
}

export interface UpdateTicketBody {
  status?: Ticket["status"];
  priority?: Ticket["priority"];
  subject?: string;
  description?: string;
}

export interface OutboundCallBody {
  business_id: string;
  to_number: string;
  language: string;
  script_hint?: string;
}

export interface CallbackBody {
  business_id: string;
  customer_phone: string;
  scheduled_at: string;
  reason?: string;
  language?: string;
}

export interface Callback {
  id: string;
  business_id: string;
  customer_phone: string;
  scheduled_at: string;
  reason?: string;
  language?: string;
  status: "pending" | "completed" | "cancelled";
  created_at: string;
}

export interface IVRConfig {
  enabled: boolean;
  menu_options: Array<{
    digit: string;
    label: string;
    action: string;
  }>;
  welcome_message?: string;
  language?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  created_at: string;
  last_used?: string;
}

export interface CreateApiKeyBody {
  name: string;
  scopes: string[];
}

export interface CreateApiKeyResponse extends ApiKey {
  raw_key: string;
}

export interface WebhookConfig {
  id: string;
  business_id: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  created_at: string;
}

export interface CreateWebhookBody {
  business_id: string;
  url: string;
  events: string[];
  secret?: string;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const key = getApiKey();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (key) {
    headers["X-API-Key"] = key;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }

  // Handle empty responses (204 No Content, etc.)
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// ── API object ────────────────────────────────────────────────────────────────

export const api = {
  // Analytics
  analytics: {
    getDashboard: (businessId: string) =>
      request<AnalyticsDashboard>(
        `/api/v1/analytics/${businessId}/dashboard`
      ),
    getDailyCalls: (businessId: string) =>
      request<DailyCallData>(
        `/api/v1/analytics/${businessId}/calls/daily`
      ),
    exportCallsUrl: (businessId: string) =>
      `${BASE_URL}/api/v1/analytics/${businessId}/export/calls`,
    exportAppointmentsUrl: (businessId: string) =>
      `${BASE_URL}/api/v1/analytics/${businessId}/export/appointments`,
  },

  // Calls
  calls: {
    list: (businessId: string, limit = 50, offset = 0) =>
      request<Call[]>(
        `/api/v1/calls/?business_id=${businessId}&limit=${limit}&offset=${offset}`
      ),
    get: (id: string) => request<Call>(`/api/v1/calls/${id}`),
  },

  // Customers
  customers: {
    list: (businessId: string) =>
      request<Customer[]>(
        `/api/v1/customers/?business_id=${businessId}`
      ),
  },

  // Appointments
  appointments: {
    list: (businessId: string) =>
      request<Appointment[]>(
        `/api/v1/appointments/?business_id=${businessId}`
      ),
    create: (body: CreateAppointmentBody) =>
      request<Appointment>("/api/v1/appointments/", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: UpdateAppointmentBody) =>
      request<Appointment>(`/api/v1/appointments/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
  },

  // Tickets
  tickets: {
    list: (businessId: string) =>
      request<Ticket[]>(
        `/api/v1/tickets/businesses/${businessId}`
      ),
    create: (businessId: string, body: CreateTicketBody) =>
      request<Ticket>(`/api/v1/tickets/?business_id=${businessId}`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: UpdateTicketBody) =>
      request<Ticket>(`/api/v1/tickets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
  },

  // Outbound
  outbound: {
    initiateCall: (body: OutboundCallBody) =>
      request<{ call_sid: string; status: string }>("/api/v1/outbound/call", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    scheduleCallback: (body: CallbackBody) =>
      request<Callback>("/api/v1/outbound/callback", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    getCallbacks: (businessId: string) =>
      request<Callback[]>(
        `/api/v1/outbound/callbacks/${businessId}`
      ),
  },

  // IVR
  ivr: {
    get: (businessId: string) =>
      request<IVRConfig>(`/api/v1/businesses/${businessId}/ivr`),
    update: (businessId: string, config: IVRConfig) =>
      request<IVRConfig>(`/api/v1/businesses/${businessId}/ivr`, {
        method: "PUT",
        body: JSON.stringify(config),
      }),
  },

  // API Keys
  keys: {
    list: (businessId: string) =>
      request<ApiKey[]>(`/api/v1/auth/businesses/${businessId}/keys`),
    create: (businessId: string, body: CreateApiKeyBody) =>
      request<CreateApiKeyResponse>(
        `/api/v1/auth/businesses/${businessId}/keys`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      ),
  },

  // Webhooks
  webhooks: {
    list: (businessId: string) =>
      request<WebhookConfig[]>(
        `/api/v1/webhook-configs/?business_id=${businessId}`
      ),
    create: (body: CreateWebhookBody) =>
      request<WebhookConfig>("/api/v1/webhook-configs/", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
};
