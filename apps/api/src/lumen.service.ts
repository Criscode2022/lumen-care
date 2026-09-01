import { BadRequestException, Inject, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { Database } from "./database.js";
import { seedIfEmpty } from "./seed.js";

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
  created_at: string;
};

function reqString(v: unknown, field: string, max = 200) {
  if (typeof v !== "string" || !v.trim()) throw new BadRequestException(`${field} is required`);
  const s = v.trim();
  if (s.length > max) throw new BadRequestException(`${field} is too long`);
  return s;
}

function optString(v: unknown, max = 2000) {
  if (v == null || v === "") return null;
  if (typeof v !== "string") throw new BadRequestException("invalid string");
  const s = v.trim();
  if (s.length > max) throw new BadRequestException("value is too long");
  return s || null;
}

@Injectable()
export class LumenService implements OnModuleInit {
  constructor(@Inject(Database) private readonly db: Database) {}

  async onModuleInit() {
    await this.db.ready;
    await seedIfEmpty(this.db);
    await this.ensureTodayDoses();
  }

  async health() {
    const [{ n }] = await this.db.query<{ n: number }>("select count(*)::int as n from people");
    return { ok: true, service: "lumen-api", database: this.db.source, people: n };
  }

  async dashboard() {
    await this.ensureTodayDoses();
    const people = await this.listPeople();
    const todayDoses = await this.db.query(
      `select d.id, d.medication_id, d.scheduled_for, d.taken_at, d.status, d.note,
              m.name as medication_name, m.dosage, m.with_food, m.person_id,
              p.name as person_name, p.preferred_name, p.color
         from dose_logs d
         join medications m on m.id = d.medication_id
         join people p on p.id = m.person_id
        where d.scheduled_for >= date_trunc('day', now())
          and d.scheduled_for < date_trunc('day', now()) + interval '1 day'
        order by d.scheduled_for, p.name`,
    );
    const adherence = await this.db.query<{ person_id: number; person_name: string; color: string; taken: number; total: number }>(
      `select p.id as person_id, p.name as person_name, p.color,
              count(*) filter (where d.status = 'taken')::int as taken,
              count(*) filter (where d.status in ('taken','skipped','missed'))::int as total
         from dose_logs d
         join medications m on m.id = d.medication_id
         join people p on p.id = m.person_id
        where d.scheduled_for >= now() - interval '7 days'
          and d.scheduled_for < now()
        group by p.id, p.name, p.color
        order by p.name`,
    );
    const upcoming = await this.db.query(
      `select a.*, p.name as person_name, p.color
         from appointments a
         join people p on p.id = a.person_id
        where a.starts_at >= now() - interval '2 hours'
        order by a.starts_at
        limit 8`,
    );
    const openTasks = await this.db.query(
      `select t.*, p.name as person_name, p.color
         from tasks t
         left join people p on p.id = t.person_id
        where t.status != 'done'
        order by case t.priority when 'high' then 0 when 'normal' then 1 else 2 end, t.due_on nulls last
        limit 8`,
    );
    const recentJournal = await this.db.query(
      `select j.*, p.name as person_name, p.color
         from journal_entries j
         join people p on p.id = j.person_id
        order by j.recorded_at desc
        limit 5`,
    );

    const now = Date.now();
    const alerts: { kind: string; title: string; detail: string; href: string }[] = [];
    for (const row of todayDoses as Array<Record<string, unknown>>) {
      const scheduled = new Date(String(row.scheduled_for)).getTime();
      if (row.status === "pending" && scheduled < now - 20 * 60 * 1000) {
        alerts.push({
          kind: "dose",
          title: `Overdue: ${row.medication_name}`,
          detail: `${row.person_name} · due ${fmtTime(String(row.scheduled_for))}`,
          href: "/app/meds",
        });
      }
    }
    for (const t of openTasks as Array<Record<string, unknown>>) {
      if (t.priority === "high") {
        alerts.push({
          kind: "task",
          title: String(t.title),
          detail: t.due_on ? `Due ${t.due_on}` : "High priority",
          href: "/app/tasks",
        });
      }
    }
    const soon = (upcoming as Array<Record<string, unknown>>).filter((a) => {
      const s = new Date(String(a.starts_at)).getTime();
      return s > now && s < now + 24 * 60 * 60 * 1000;
    });
    for (const a of soon.slice(0, 2)) {
      alerts.push({
        kind: "appointment",
        title: String(a.title),
        detail: `${a.person_name} · ${fmtTime(String(a.starts_at))}`,
        href: "/app/calendar",
      });
    }

    const taken = adherence.reduce((s, r) => s + r.taken, 0);
    const total = adherence.reduce((s, r) => s + r.total, 0);

    return {
      generatedAt: new Date().toISOString(),
      people,
      todayDoses,
      adherence7d: { taken, total, byPerson: adherence },
      upcomingAppointments: upcoming,
      openTasks,
      recentJournal,
      alerts: alerts.slice(0, 6),
    };
  }

  listPeople() {
    return this.db.query<Person>("select * from people order by name");
  }

  async getPerson(id: number) {
    const rows = await this.db.query<Person>("select * from people where id = $1", [id]);
    if (!rows[0]) throw new NotFoundException("Person not found");
    const medications = await this.db.query(
      "select * from medications where person_id = $1 order by name",
      [id],
    );
    const appointments = await this.db.query(
      "select * from appointments where person_id = $1 order by starts_at desc limit 12",
      [id],
    );
    const tasks = await this.db.query(
      "select * from tasks where person_id = $1 order by created_at desc",
      [id],
    );
    const journal = await this.db.query(
      "select * from journal_entries where person_id = $1 order by recorded_at desc limit 20",
      [id],
    );
    const adherence = await this.db.query<{ taken: number; total: number }>(
      `select count(*) filter (where d.status = 'taken')::int as taken,
              count(*) filter (where d.status in ('taken','skipped','missed'))::int as total
         from dose_logs d
         join medications m on m.id = d.medication_id
        where m.person_id = $1
          and d.scheduled_for >= now() - interval '7 days'
          and d.scheduled_for < now()`,
      [id],
    );
    return { person: rows[0], medications, appointments, tasks, journal, adherence7d: adherence[0] ?? { taken: 0, total: 0 } };
  }

  async createPerson(body: Record<string, unknown>) {
    const rows = await this.db.query<Person>(
      `insert into people (name, preferred_name, date_of_birth, relationship, conditions, allergies, emergency_name, emergency_phone, notes, color)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
      [
        reqString(body.name, "name", 80),
        optString(body.preferred_name, 80),
        optString(body.date_of_birth, 10),
        optString(body.relationship, 80),
        optString(body.conditions, 500),
        optString(body.allergies, 300),
        optString(body.emergency_name, 80),
        optString(body.emergency_phone, 40),
        optString(body.notes, 2000),
        optString(body.color, 20) ?? "sage",
      ],
    );
    return rows[0];
  }

  async updatePerson(id: number, body: Record<string, unknown>) {
    await this.requirePerson(id);
    const current = (await this.db.query<Person>("select * from people where id = $1", [id]))[0];
    const rows = await this.db.query<Person>(
      `update people set
         name = $2, preferred_name = $3, date_of_birth = $4, relationship = $5,
         conditions = $6, allergies = $7, emergency_name = $8, emergency_phone = $9,
         notes = $10, color = $11
       where id = $1 returning *`,
      [
        id,
        body.name != null ? reqString(body.name, "name", 80) : current.name,
        body.preferred_name !== undefined ? optString(body.preferred_name, 80) : current.preferred_name,
        body.date_of_birth !== undefined ? optString(body.date_of_birth, 10) : current.date_of_birth,
        body.relationship !== undefined ? optString(body.relationship, 80) : current.relationship,
        body.conditions !== undefined ? optString(body.conditions, 500) : current.conditions,
        body.allergies !== undefined ? optString(body.allergies, 300) : current.allergies,
        body.emergency_name !== undefined ? optString(body.emergency_name, 80) : current.emergency_name,
        body.emergency_phone !== undefined ? optString(body.emergency_phone, 40) : current.emergency_phone,
        body.notes !== undefined ? optString(body.notes, 2000) : current.notes,
        body.color !== undefined ? (optString(body.color, 20) ?? current.color) : current.color,
      ],
    );
    return rows[0];
  }

  listMedications(personId?: number) {
    if (personId) {
      return this.db.query(
        `select m.*, p.name as person_name, p.color
           from medications m join people p on p.id = m.person_id
          where m.person_id = $1
          order by m.active desc, m.name`,
        [personId],
      );
    }
    return this.db.query(
      `select m.*, p.name as person_name, p.color
         from medications m join people p on p.id = m.person_id
        order by p.name, m.name`,
    );
  }

  async createMedication(body: Record<string, unknown>) {
    const personId = Number(body.person_id);
    if (!Number.isInteger(personId)) throw new BadRequestException("person_id is required");
    await this.requirePerson(personId);
    const times = normalizeTimes(body.schedule_times);
    const rows = await this.db.query(
      `insert into medications (person_id, name, dosage, instructions, schedule_times, with_food, active)
       values ($1,$2,$3,$4,$5,$6,true) returning *`,
      [
        personId,
        reqString(body.name, "name", 80),
        reqString(body.dosage, "dosage", 80),
        optString(body.instructions, 500),
        JSON.stringify(times),
        Boolean(body.with_food),
      ],
    );
    await this.ensureTodayDoses();
    return rows[0];
  }

  async updateMedication(id: number, body: Record<string, unknown>) {
    const current = (await this.db.query("select * from medications where id = $1", [id]))[0];
    if (!current) throw new NotFoundException("Medication not found");
    const times =
      body.schedule_times !== undefined
        ? JSON.stringify(normalizeTimes(body.schedule_times))
        : current.schedule_times;
    const rows = await this.db.query(
      `update medications set
         name = $2, dosage = $3, instructions = $4, schedule_times = $5, with_food = $6, active = $7
       where id = $1 returning *`,
      [
        id,
        body.name != null ? reqString(body.name, "name", 80) : current.name,
        body.dosage != null ? reqString(body.dosage, "dosage", 80) : current.dosage,
        body.instructions !== undefined ? optString(body.instructions, 500) : current.instructions,
        times,
        body.with_food !== undefined ? Boolean(body.with_food) : current.with_food,
        body.active !== undefined ? Boolean(body.active) : current.active,
      ],
    );
    return rows[0];
  }

  async logDose(id: number, body: Record<string, unknown>) {
    const status = reqString(body.status, "status", 20);
    if (!["taken", "skipped", "pending"].includes(status)) {
      throw new BadRequestException("status must be taken, skipped, or pending");
    }
    const scheduledFor = reqString(body.scheduled_for, "scheduled_for", 40);
    const takenAt = status === "taken" ? new Date().toISOString() : null;
    const rows = await this.db.query(
      `insert into dose_logs (medication_id, scheduled_for, taken_at, status, note)
       values ($1,$2,$3,$4,$5)
       on conflict (medication_id, scheduled_for)
       do update set status = excluded.status, taken_at = excluded.taken_at, note = excluded.note
       returning *`,
      [id, scheduledFor, takenAt, status, optString(body.note, 300)],
    );
    return rows[0];
  }

  listAppointments() {
    return this.db.query(
      `select a.*, p.name as person_name, p.color
         from appointments a join people p on p.id = a.person_id
        order by a.starts_at`,
    );
  }

  async createAppointment(body: Record<string, unknown>) {
    const personId = Number(body.person_id);
    if (!Number.isInteger(personId)) throw new BadRequestException("person_id is required");
    await this.requirePerson(personId);
    const rows = await this.db.query(
      `insert into appointments (person_id, title, kind, location, starts_at, ends_at, provider, notes)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
      [
        personId,
        reqString(body.title, "title", 120),
        optString(body.kind, 40) ?? "clinic",
        optString(body.location, 160),
        reqString(body.starts_at, "starts_at", 40),
        optString(body.ends_at, 40),
        optString(body.provider, 120),
        optString(body.notes, 1000),
      ],
    );
    return rows[0];
  }

  async updateAppointment(id: number, body: Record<string, unknown>) {
    const current = (await this.db.query("select * from appointments where id = $1", [id]))[0];
    if (!current) throw new NotFoundException("Appointment not found");
    const rows = await this.db.query(
      `update appointments set title=$2, kind=$3, location=$4, starts_at=$5, ends_at=$6, provider=$7, notes=$8
       where id=$1 returning *`,
      [
        id,
        body.title != null ? reqString(body.title, "title", 120) : current.title,
        body.kind !== undefined ? (optString(body.kind, 40) ?? current.kind) : current.kind,
        body.location !== undefined ? optString(body.location, 160) : current.location,
        body.starts_at != null ? reqString(body.starts_at, "starts_at", 40) : current.starts_at,
        body.ends_at !== undefined ? optString(body.ends_at, 40) : current.ends_at,
        body.provider !== undefined ? optString(body.provider, 120) : current.provider,
        body.notes !== undefined ? optString(body.notes, 1000) : current.notes,
      ],
    );
    return rows[0];
  }

  async deleteAppointment(id: number) {
    const rows = await this.db.query("delete from appointments where id = $1 returning id", [id]);
    if (!rows[0]) throw new NotFoundException("Appointment not found");
    return { ok: true };
  }

  listTasks() {
    return this.db.query(
      `select t.*, p.name as person_name, p.color
         from tasks t left join people p on p.id = t.person_id
        order by case t.status when 'open' then 0 when 'doing' then 1 else 2 end,
                 case t.priority when 'high' then 0 when 'normal' then 1 else 2 end,
                 t.due_on nulls last`,
    );
  }

  async createTask(body: Record<string, unknown>) {
    const personId = body.person_id == null || body.person_id === "" ? null : Number(body.person_id);
    if (personId != null) {
      if (!Number.isInteger(personId)) throw new BadRequestException("invalid person");
      await this.requirePerson(personId);
    }
    const rows = await this.db.query(
      `insert into tasks (person_id, title, details, due_on, status, priority)
       values ($1,$2,$3,$4,$5,$6) returning *`,
      [
        personId,
        reqString(body.title, "title", 160),
        optString(body.details, 1000),
        optString(body.due_on, 10),
        optString(body.status, 20) ?? "open",
        optString(body.priority, 20) ?? "normal",
      ],
    );
    return rows[0];
  }

  async updateTask(id: number, body: Record<string, unknown>) {
    const current = (await this.db.query("select * from tasks where id = $1", [id]))[0];
    if (!current) throw new NotFoundException("Task not found");
    const rows = await this.db.query(
      `update tasks set title=$2, details=$3, due_on=$4, status=$5, priority=$6 where id=$1 returning *`,
      [
        id,
        body.title != null ? reqString(body.title, "title", 160) : current.title,
        body.details !== undefined ? optString(body.details, 1000) : current.details,
        body.due_on !== undefined ? optString(body.due_on, 10) : current.due_on,
        body.status !== undefined ? (optString(body.status, 20) ?? current.status) : current.status,
        body.priority !== undefined ? (optString(body.priority, 20) ?? current.priority) : current.priority,
      ],
    );
    return rows[0];
  }

  async deleteTask(id: number) {
    const rows = await this.db.query("delete from tasks where id = $1 returning id", [id]);
    if (!rows[0]) throw new NotFoundException("Task not found");
    return { ok: true };
  }

  listJournal(personId?: number) {
    if (personId) {
      return this.db.query(
        `select j.*, p.name as person_name, p.color
           from journal_entries j join people p on p.id = j.person_id
          where j.person_id = $1
          order by j.recorded_at desc`,
        [personId],
      );
    }
    return this.db.query(
      `select j.*, p.name as person_name, p.color
         from journal_entries j join people p on p.id = j.person_id
        order by j.recorded_at desc
        limit 80`,
    );
  }

  async createJournal(body: Record<string, unknown>) {
    const personId = Number(body.person_id);
    if (!Number.isInteger(personId)) throw new BadRequestException("person_id is required");
    await this.requirePerson(personId);
    const kind = optString(body.kind, 20) ?? "note";
    const rows = await this.db.query(
      `insert into journal_entries (person_id, kind, body, recorded_at)
       values ($1,$2,$3, coalesce($4::timestamptz, now())) returning *`,
      [personId, kind, reqString(body.body, "body", 4000), optString(body.recorded_at, 40)],
    );
    return rows[0];
  }

  async deleteJournal(id: number) {
    const rows = await this.db.query("delete from journal_entries where id = $1 returning id", [id]);
    if (!rows[0]) throw new NotFoundException("Entry not found");
    return { ok: true };
  }

  listTeam() {
    return this.db.query("select * from team_members order by case role when 'primary' then 0 when 'family' then 1 when 'clinician' then 2 else 3 end, name");
  }

  async createTeam(body: Record<string, unknown>) {
    const rows = await this.db.query(
      `insert into team_members (name, role, phone, email, notes) values ($1,$2,$3,$4,$5) returning *`,
      [
        reqString(body.name, "name", 80),
        optString(body.role, 40) ?? "family",
        optString(body.phone, 40),
        optString(body.email, 120),
        optString(body.notes, 500),
      ],
    );
    return rows[0];
  }

  async updateTeam(id: number, body: Record<string, unknown>) {
    const current = (await this.db.query("select * from team_members where id = $1", [id]))[0];
    if (!current) throw new NotFoundException("Member not found");
    const rows = await this.db.query(
      `update team_members set name=$2, role=$3, phone=$4, email=$5, notes=$6 where id=$1 returning *`,
      [
        id,
        body.name != null ? reqString(body.name, "name", 80) : current.name,
        body.role !== undefined ? (optString(body.role, 40) ?? current.role) : current.role,
        body.phone !== undefined ? optString(body.phone, 40) : current.phone,
        body.email !== undefined ? optString(body.email, 120) : current.email,
        body.notes !== undefined ? optString(body.notes, 500) : current.notes,
      ],
    );
    return rows[0];
  }

  async deleteTeam(id: number) {
    const rows = await this.db.query("delete from team_members where id = $1 returning id", [id]);
    if (!rows[0]) throw new NotFoundException("Member not found");
    return { ok: true };
  }

  private async requirePerson(id: number) {
    const rows = await this.db.query("select id from people where id = $1", [id]);
    if (!rows[0]) throw new NotFoundException("Person not found");
  }

  private async ensureTodayDoses() {
    const meds = await this.db.query<{ id: number; schedule_times: string; active: boolean }>(
      "select id, schedule_times, active from medications where active = true",
    );
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (const med of meds) {
      let times: string[] = [];
      try {
        times = JSON.parse(med.schedule_times);
      } catch {
        times = [];
      }
      for (const t of times) {
        const [h, m] = String(t).split(":").map(Number);
        const scheduled = new Date(start);
        scheduled.setHours(h, m || 0, 0, 0);
        await this.db.query(
          `insert into dose_logs (medication_id, scheduled_for, status)
           values ($1,$2,'pending')
           on conflict (medication_id, scheduled_for) do nothing`,
          [med.id, scheduled.toISOString()],
        );
      }
    }
  }
}

function normalizeTimes(raw: unknown): string[] {
  let arr: unknown[] = [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      arr = Array.isArray(parsed) ? parsed : raw.split(/[, ]+/);
    } catch {
      arr = raw.split(/[, ]+/);
    }
  } else if (Array.isArray(raw)) arr = raw;
  const times = arr
    .map((t) => String(t).trim())
    .filter((t) => /^\d{1,2}:\d{2}$/.test(t))
    .map((t) => {
      const [h, m] = t.split(":");
      return `${h.padStart(2, "0")}:${m}`;
    });
  if (times.length === 0) throw new BadRequestException("schedule_times must include at least one HH:MM");
  return times;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
