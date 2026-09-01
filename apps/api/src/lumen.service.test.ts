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
  const h = health.body as { ok: boolean; people: number; service: string };
  assert.equal(h.ok, true);
  assert.equal(h.service, "lumen-api");
  assert.ok(h.people >= 2);
});

test("dashboard returns doses, tasks, and visits", async () => {
  const dash = await req("/api/dashboard");
  assert.equal(dash.status, 200);
  const d = dash.body as { people: unknown[]; todayDoses: unknown[]; openTasks: unknown[] };
  assert.ok(d.people.length >= 2);
  assert.ok(d.todayDoses.length >= 1);
  assert.ok(d.openTasks.length >= 1);
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
