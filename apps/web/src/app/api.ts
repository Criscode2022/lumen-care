import { Injectable } from "@angular/core";

export type Person = {
  id: number;
  name: string;
  preferred_name: string | null;
  date_of_birth: string | null;
  relationship: string | null;
  conditions: string | null;
  allergies: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  notes: string | null;
  color: string;
};

export type Dose = {
  id: number;
  medication_id: number;
  scheduled_for: string;
  taken_at: string | null;
  status: "taken" | "skipped" | "pending" | "missed";
  medication_name: string;
  dosage: string;
  with_food: boolean;
  person_id: number;
  person_name: string;
  preferred_name: string | null;
  color: string;
};

export type Dashboard = {
  generatedAt: string;
  people: Person[];
  todayDoses: Dose[];
  adherence7d: { taken: number; total: number; byPerson: { person_id: number; person_name: string; color: string; taken: number; total: number }[] };
  upcomingAppointments: Array<Record<string, unknown>>;
  openTasks: Array<Record<string, unknown>>;
  recentJournal: Array<Record<string, unknown>>;
  alerts: { kind: string; title: string; detail: string; href: string }[];
};

@Injectable({ providedIn: "root" })
export class Api {
  get<T>(path: string) {
    return this.send<T>("GET", path);
  }
  post<T>(path: string, body?: unknown) {
    return this.send<T>("POST", path, body);
  }
  patch<T>(path: string, body?: unknown) {
    return this.send<T>("PATCH", path, body);
  }
  delete(path: string) {
    return this.send<unknown>("DELETE", path);
  }

  private async send<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`/api${path}`, {
      method,
      headers: body !== undefined ? { "content-type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }
}

export function fmtTime(iso: unknown) {
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function fmtDate(iso: unknown) {
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return String(iso ?? "");
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function fmtDob(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  const age = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
  return `${d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} · ${age}`;
}

export function pct(taken: number, total: number) {
  if (!total) return 0;
  return Math.round((taken / total) * 100);
}

export function toLocalInput(iso: unknown) {
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
