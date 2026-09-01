import "reflect-metadata";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    logger: ["error", "warn", "log"],
  });
  app.setGlobalPrefix("api");

  const publicDir = join(process.cwd(), "public");
  if (existsSync(publicDir)) {
    app.useStaticAssets(publicDir);
  }

  const browserDir = [
    join(process.cwd(), "dist/web/browser"),
    join(process.cwd(), "dist/web"),
  ].find((dir) => existsSync(join(dir, "index.html")));

  if (browserDir) {
    app.useStaticAssets(browserDir);
    app.use((req: { originalUrl: string; method: string }, res: { sendFile: (p: string) => void }, next: () => void) => {
      if (req.method !== "GET" && req.method !== "HEAD") return next();
      if (req.originalUrl.startsWith("/api")) return next();
      res.sendFile(join(browserDir, "index.html"));
    });
  }

  const port = Number(process.env.PORT || 8080);
  const host = process.env.HOST || "0.0.0.0";
  await app.listen(port, host);
  console.log(`[lumen] api listening on ${host}:${port}  db=${process.env.DATABASE_URL ? "neon" : "pglite"}`);
}

bootstrap();
