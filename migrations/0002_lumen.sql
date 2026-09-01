-- Lumen care coordination schema. Idempotent. Unowned demo rows (auth off).

create table if not exists people (
  id              serial primary key,
  name            text not null,
  preferred_name  text,
  date_of_birth   date,
  relationship    text,
  conditions      text,
  allergies       text,
  emergency_name  text,
  emergency_phone text,
  notes           text,
  color           text not null default 'sage',
  created_at      timestamptz not null default now()
);

create table if not exists medications (
  id              serial primary key,
  person_id       int not null references people(id) on delete cascade,
  name            text not null,
  dosage          text not null,
  instructions    text,
  schedule_times  text not null,
  with_food       boolean not null default false,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists dose_logs (
  id              serial primary key,
  medication_id   int not null references medications(id) on delete cascade,
  scheduled_for   timestamptz not null,
  taken_at        timestamptz,
  status          text not null,
  note            text,
  created_at      timestamptz not null default now()
);

create unique index if not exists dose_logs_med_sched_idx
  on dose_logs (medication_id, scheduled_for);
create index if not exists dose_logs_status_idx on dose_logs (status);
create index if not exists medications_person_idx on medications (person_id);

create table if not exists appointments (
  id              serial primary key,
  person_id       int not null references people(id) on delete cascade,
  title           text not null,
  kind            text not null,
  location        text,
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  provider        text,
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists appointments_starts_idx on appointments (starts_at);

create table if not exists tasks (
  id              serial primary key,
  person_id       int references people(id) on delete cascade,
  title           text not null,
  details         text,
  due_on          date,
  status          text not null default 'open',
  priority        text not null default 'normal',
  created_at      timestamptz not null default now()
);

create index if not exists tasks_status_idx on tasks (status);

create table if not exists journal_entries (
  id              serial primary key,
  person_id       int not null references people(id) on delete cascade,
  kind            text not null,
  body            text not null,
  recorded_at     timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index if not exists journal_person_idx on journal_entries (person_id, recorded_at desc);

create table if not exists team_members (
  id              serial primary key,
  name            text not null,
  role            text not null,
  phone           text,
  email           text,
  notes           text,
  created_at      timestamptz not null default now()
);
