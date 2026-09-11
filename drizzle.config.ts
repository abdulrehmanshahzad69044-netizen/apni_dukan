import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./electron/database/schema/index.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    // Dev-only DB. Production DB lives in app.getPath('userData') —
    // resolved at runtime in electron/database/paths.ts
    url: "./dev-apni-dukan.db",
  },
  verbose: true,
  strict: true,
});