import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

let app: INestApplication;
let base = "";

before(async () => {
  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix("api");
  await app.listen(0, "127.0.0.1");
  const addr = app.getHttpServer().address() as { port: number };
  base = `http://127.0.0.1:${addr.port}`;
});

after(async () => {
  await app.close();
});

async function req(path: string, init: RequestInit = {}) {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers || {}) },
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* keep */
  }
  return { status: res.status, body };
}

test("health reports the seeded circle", async () => {
  const health = await req("/api/health");
  assert.equal(health.status, 200);
  const h = health.body as { ok: boolean; people: number; service: string; database: string };
  assert.equal(h.ok, true);
  assert.equal(h.service, "lumen-api");
  assert.ok(h.people >= 2);
  assert.equal(h.database, "pglite");
});

test("dashboard returns doses, tasks, and visits", async () => {
  const dash = await req("/api/dashboard");
  assert.equal(dash.status, 200);
  const d = dash.body as { people: unknown[]; todayDoses: unknown[]; openTasks: unknown[]; upcomingAppointments: unknown[] };
  assert.ok(d.people.length >= 2);
  assert.ok(d.todayDoses.length >= 1);
  assert.ok(d.openTasks.length >= 1);
  assert.ok(d.upcomingAppointments.length >= 1);
});

test("people list includes the Voss circle", async () => {
  const res = await req("/api/people");
  assert.equal(res.status, 200);
  const people = res.body as Array<{ name: string }>;
  const names = people.map((p) => p.name);
  assert.ok(names.includes("Elena Voss"));
  assert.ok(names.includes("Theo Voss"));
});

test("missing person returns 404", async () => {
  const res = await req("/api/people/99999");
  assert.equal(res.status, 404);
});

test("tasks can be created and completed", async () => {
  const created = await req("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ title: "Call pharmacy", priority: "high" }),
  });
  assert.ok(created.status === 201 || created.status === 200);
  const task = created.body as { id: number; title: string };
  assert.equal(task.title, "Call pharmacy");

  const patched = await req(`/api/tasks/${task.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "done" }),
  });
  assert.equal(patched.status, 200);
  assert.equal((patched.body as { status: string }).status, "done");
});

test("empty task title is rejected", async () => {
  const res = await req("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ title: "  " }),
  });
  assert.equal(res.status, 400);
});

test("medications list and dose logging", async () => {
  const list = await req("/api/medications");
  assert.equal(list.status, 200);
  const meds = list.body as Array<{ id: number; name: string }>;
  assert.ok(meds.length >= 3);
  const carbidopa = meds.find((m) => m.name.includes("Carbidopa"));
  assert.ok(carbidopa);

  const dash = await req("/api/dashboard");
  const doses = (dash.body as { todayDoses: Array<{ id: number; medication_id: number; scheduled_for: string; status: string }> }).todayDoses;
  const pending = doses.find((d) => d.medication_id === carbidopa!.id && d.status === "pending") ?? doses.find((d) => d.status === "pending");
  assert.ok(pending, "expected a pending dose");

  const logged = await req(`/api/medications/${pending!.medication_id}/doses`, {
    method: "POST",
    body: JSON.stringify({ status: "taken", scheduled_for: pending!.scheduled_for }),
  });
  assert.ok(logged.status === 201 || logged.status === 200, `dose log status ${logged.status}`);
  assert.equal((logged.body as { status: string }).status, "taken");
});

test("journal entries can be written", async () => {
  const people = (await req("/api/people")).body as Array<{ id: number; name: string }>;
  const elena = people.find((p) => p.name === "Elena Voss");
  assert.ok(elena);

  const created = await req("/api/journal", {
    method: "POST",
    body: JSON.stringify({ person_id: elena!.id, kind: "note", body: "Slept through the night." }),
  });
  assert.ok(created.status === 201 || created.status === 200);
  assert.equal((created.body as { body: string }).body, "Slept through the night.");

  const listed = await req(`/api/journal?personId=${elena!.id}`);
  assert.equal(listed.status, 200);
  const entries = listed.body as Array<{ body: string }>;
  assert.ok(entries.some((e) => e.body.includes("Slept through the night")));
});

test("care circle is seeded", async () => {
  const res = await req("/api/team");
  assert.equal(res.status, 200);
  const team = res.body as Array<{ name: string; role: string }>;
  assert.ok(team.length >= 2);
  assert.ok(team.some((m) => /maya/i.test(m.name)));
});
