import { Injectable, OnModuleInit } from "@nestjs/common";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Sql = {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
  exec(text: string): Promise<void>;
};

const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;

@Injectable()
export class Database implements OnModuleInit {
  private sql!: Sql;
  source: "neon" | "pglite" = "pglite";
  ready: Promise<void>;

  constructor() {
    this.ready = this.init();
  }

  async onModuleInit() {
    await this.ready;
  }

  private async init() {
    const raw = process.env.DATABASE_URL?.trim();
    if (raw) {
      this.source = "neon";
      this.sql = await this.createNeon(raw);
    } else {
      this.source = "pglite";
      this.sql = await this.createPglite();
    }
    await this.migrate();
  }

  query<T = Record<string, unknown>>(text: string, params: unknown[] = []) {
    return this.sql.query<T>(text, params);
  }

  private async createNeon(connectionString: string): Promise<Sql> {
    const { Pool, types } = await import("pg");
    types.setTypeParser(OID_INT8, Number);
    types.setTypeParser(OID_DATE, (v: string) => v);
    types.setTypeParser(OID_INTERVAL, (v: string) => v);
    const pool = new Pool({ connectionString });
    return {
      query: async <T>(text: string, params: unknown[] = []) => {
        const res = await pool.query(text, params);
        return res.rows as T[];
      },
      exec: async (text: string) => {
        await pool.query(text);
      },
    };
  }

  private async createPglite(): Promise<Sql> {
    const { PGlite } = await import("@electric-sql/pglite");
    const pg = new PGlite({
      parsers: {
        [OID_INT8]: Number,
        [OID_DATE]: (v: string) => v,
        [OID_INTERVAL]: (v: string) => v,
      },
    });
    await pg.waitReady;
    return {
      query: async <T>(text: string, params: unknown[] = []) => {
        const res = await pg.query<T>(text, params);
        return res.rows;
      },
      exec: async (text: string) => {
        await pg.exec(text);
      },
    };
  }

  private async migrate() {
    await this.sql.exec(
      "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    const dir = join(process.cwd(), "migrations");
    const entries = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    const doneRows = await this.sql.query<{ name: string }>("select name from _migrations");
    const done = new Set(doneRows.map((r) => r.name));
    for (const name of entries) {
      if (done.has(name)) continue;
      const text = readFileSync(join(dir, name), "utf8");
      await this.sql.exec(text);
      await this.sql.query("insert into _migrations (name) values ($1)", [name]);
    }
  }
}
