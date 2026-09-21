import { defineConfig, type UserConfig } from "vite";
import path from "node:path";

const config: UserConfig = {
  resolve: {
    // better-sqlite3 is a native module — must be loaded at runtime
    // from node_modules, not bundled by Vite.
    conditions: ["node", "require"],
  },
  build: {
    rollupOptions: {
      external: ["better-sqlite3", "bindings", "electron"],
    },
  },
};

export default defineConfig(config);