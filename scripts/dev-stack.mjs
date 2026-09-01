#!/usr/bin/env node
/**
 * Dev preview: build Angular, then Nest serves API + SPA on 0.0.0.0:8080.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const env = { ...process.env, PORT: process.env.PORT || "8080", HOST: process.env.HOST || "0.0.0.0" };

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", env, cwd: ROOT, ...opts });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
  });
}

function start(cmd, args) {
  const child = spawn(cmd, args, { stdio: "inherit", env, cwd: ROOT });
  child.on("error", (err) => {
    console.error(err);
    process.exit(1);
  });
  return child;
}

const indexCandidates = [
  join(ROOT, "dist/web/browser/index.html"),
  join(ROOT, "dist/web/index.html"),
];

if (!indexCandidates.some((p) => existsSync(p))) {
  console.log("[lumen] building Angular…");
  await run("npx", ["ng", "build", "web", "--configuration", "development"]);
}

const nest = start("npx", ["tsx", "--tsconfig", "apps/api/tsconfig.json", "apps/api/src/main.ts"]);
const watch = start("npx", ["ng", "build", "web", "--watch", "--configuration", "development"]);

const shutdown = () => {
  nest.kill("SIGTERM");
  watch.kill("SIGTERM");
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

nest.on("exit", (code) => {
  watch.kill("SIGTERM");
  process.exit(code ?? 1);
});
