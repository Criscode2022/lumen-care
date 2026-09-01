import type { Database } from "./database.js";

function atHour(day: Date, hour: number, minute = 0) {
  const d = new Date(day);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function startOfDay(offset = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

export async function seedIfEmpty(db: Database) {
  const [{ n }] = await db.query<{ n: number }>("select count(*)::int as n from people");
  if (n > 0) return false;

  const elena = await db.query<{ id: number }>(
    `insert into people (name, preferred_name, date_of_birth, relationship, conditions, allergies, emergency_name, emergency_phone, notes, color)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
    [
      "Elena Voss",
      "Ella",
      "1947-04-12",
      "Mother",
      "Parkinson’s disease, hypertension, mild hearing loss",
      "Penicillin, sulfa drugs",
      "Maya Voss",
      "(415) 555-0148",
      "Prefers morning appointments. Tremor is worse after 6pm. Take her teal cardigan to clinic visits.",
      "sage",
    ],
  );

  const theo = await db.query<{ id: number }>(
    `insert into people (name, preferred_name, date_of_birth, relationship, conditions, allergies, emergency_name, emergency_phone, notes, color)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
    [
      "Theo Voss",
      "Theo",
      "2015-09-03",
      "Grandson",
      "Type 1 diabetes (diagnosed 2021)",
      "None known",
      "Maya Voss",
      "(415) 555-0148",
      "School 504 plan on file. Dexcom G7 on left arm. Soccer Tuesdays and Saturdays — pack extra glucose tabs.",
      "clay",
    ],
  );

  const elenaId = elena[0].id;
  const theoId = theo[0].id;

  const meds = await db.query<{ id: number; person_id: number; schedule_times: string }>(
    `insert into medications (person_id, name, dosage, instructions, schedule_times, with_food) values
      ($1, 'Carbidopa/Levodopa', '25/100 mg', 'Take at the same times daily. Do not crush.', '["07:00","12:00","18:00"]', false),
      ($1, 'Amlodipine', '5 mg', 'Morning with water.', '["08:00"]', false),
      ($1, 'Vitamin D3', '2000 IU', 'With breakfast.', '["08:00"]', true),
      ($2, 'Insulin glargine', '10 units', 'Evening basal. Rotate injection site.', '["21:00"]', false),
      ($2, 'Insulin lispro', 'Mealtime, per sliding scale', 'Dose with first bite. Confirm CGM reading.', '["07:30","12:30","18:30"]', true)
     returning id, person_id, schedule_times`,
    [elenaId, theoId],
  );

  const now = new Date();
  for (const med of meds) {
    const times = JSON.parse(med.schedule_times) as string[];
    for (let day = -6; day <= 0; day += 1) {
      const base = startOfDay(day);
      for (const t of times) {
        const [h, m] = t.split(":").map(Number);
        const scheduled = atHour(base, h, m);
        let status = "pending";
        let takenAt: Date | null = null;
        if (scheduled.getTime() < now.getTime() - 30 * 60 * 1000) {
          const roll = (med.id * 17 + day * 3 + h) % 10;
          if (roll === 0) status = "skipped";
          else {
            status = "taken";
            takenAt = new Date(scheduled.getTime() + 8 * 60 * 1000);
          }
        }
        await db.query(
          `insert into dose_logs (medication_id, scheduled_for, taken_at, status)
           values ($1,$2,$3,$4)
           on conflict (medication_id, scheduled_for) do nothing`,
          [med.id, scheduled.toISOString(), takenAt?.toISOString() ?? null, status],
        );
      }
    }
  }

  await db.query(
    `insert into appointments (person_id, title, kind, location, starts_at, ends_at, provider, notes) values
      ($1, 'Neurology follow-up', 'clinic', 'Bay Neurology, Suite 410', $3, $4, 'Dr. Anika Patel', 'Bring current medication list and tremor diary.'),
      ($1, 'Physical therapy', 'therapy', 'Harbor PT', $5, $6, 'Luis Ortega, DPT', 'Balance and gait. Wear sneakers.'),
      ($2, 'Pediatric endocrinology', 'clinic', 'Children’s Diabetes Center', $7, $8, 'Dr. Helen Cho', 'Download Dexcom last 14 days beforehand.'),
      ($1, 'Comprehensive metabolic panel', 'lab', 'Quest — Geary St', $9, $10, 'Quest Diagnostics', 'Fasting. Water only after 10pm.'),
      ($2, 'School 504 review', 'other', 'Westlake Elementary', $11, $12, 'Ms. Alvarez, counselor', 'Maya attending. Bring rescue protocol.')`,
    [
      elenaId,
      theoId,
      isoOffset(2, 10, 30),
      isoOffset(2, 11, 15),
      isoOffset(0, 14, 0),
      isoOffset(0, 15, 0),
      isoOffset(5, 9, 0),
      isoOffset(5, 9, 45),
      isoOffset(1, 8, 15),
      isoOffset(1, 8, 30),
      isoOffset(8, 15, 30),
      isoOffset(8, 16, 15),
    ],
  );

  await db.query(
    `insert into tasks (person_id, title, details, due_on, status, priority) values
      ($1, 'Refill Carbidopa/Levodopa', 'Pharmacy has it on auto-refill hold — call before Thursday.', $3, 'open', 'high'),
      ($1, 'Replace hearing-aid batteries', 'Spare pack in the kitchen drawer.', $4, 'open', 'normal'),
      ($2, 'Order Dexcom G7 sensors', 'Two-pack remaining. Need a three-month supply.', $5, 'open', 'high'),
      ($2, 'Update school 504 binder', 'Print new hypo protocol and emergency contacts.', $6, 'doing', 'normal'),
      ($1, 'Schedule ophthalmology', 'Annual exam overdue from March.', $7, 'open', 'normal'),
      (null, 'Backup caregiver for Saturday soccer', 'Maya at a conference. James can cover if confirmed.', $8, 'open', 'high')`,
    [
      elenaId,
      theoId,
      dateOffset(2),
      dateOffset(0),
      dateOffset(4),
      dateOffset(7),
      dateOffset(12),
      dateOffset(3),
    ],
  );

  await db.query(
    `insert into journal_entries (person_id, kind, body, recorded_at) values
      ($1, 'symptom', 'Evening tremor more pronounced after dinner. Skipped the walk. Sleep was fragmented — up twice.', $3),
      ($1, 'win', 'Completed the full PT circuit without a rest stop. Luis noted improved tandem stance.', $4),
      ($1, 'question', 'Ask Dr. Patel whether the 6pm levodopa can move to 5:30 to cover dinner tremor.', $5),
      ($2, 'note', 'Soccer game, 68 minutes. CGM 142 at final whistle after 15g juice at half. No hypo overnight.', $6),
      ($2, 'mood', 'Frustrated at lunch — site change stung. Calmed after a walk. Willing to try the other arm tomorrow.', $7),
      ($1, 'note', 'Ate well at lunch. Blood pressure 128/76 sitting. No dizziness on standing.', $8)`,
    [
      elenaId,
      theoId,
      isoOffset(-1, 21, 10),
      isoOffset(-3, 16, 40),
      isoOffset(-1, 8, 5),
      isoOffset(-2, 18, 20),
      isoOffset(0, 13, 15),
      isoOffset(0, 12, 50),
    ],
  );

  await db.query(
    `insert into team_members (name, role, phone, email, notes) values
      ('Maya Voss', 'primary', '(415) 555-0148', 'maya@voss.example', 'Daughter. Coordinates medications, school, and appointments.'),
      ('James Voss', 'family', '(415) 555-0192', 'james@voss.example', 'Son. Weekends and soccer coverage.'),
      ('Dr. Anika Patel', 'clinician', '(415) 555-2201', 'apatel@bayneuro.example', 'Neurology. Prefers messages through the clinic portal.'),
      ('Dr. Helen Cho', 'clinician', '(415) 555-3340', 'hcho@cdc.example', 'Pediatric endocrinology.'),
      ('Rivera Home Health', 'aide', '(415) 555-4418', 'scheduling@riverahh.example', 'Tue/Thu mornings for Elena. Call 24h to reschedule.')`,
  );

  return true;
}

function isoOffset(day: number, hour: number, minute: number) {
  return atHour(startOfDay(day), hour, minute).toISOString();
}

function dateOffset(day: number) {
  const d = startOfDay(day);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
