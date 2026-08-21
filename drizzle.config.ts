import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./electron/database/schema/index.ts",

  out: "./drizzle",

  dialect: "sqlite",

  dbCredentials: {
    url: "./dev-apni-dukan.db",
  },
});