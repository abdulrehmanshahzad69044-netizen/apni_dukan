import { eq } from "drizzle-orm";
import { getDb } from "../database/client";
import { settings as settingsTable } from "../database/schema";
import type {
  Settings,
  UpdateSettingsInput,
} from "../shared/types/settings";
import { DEFAULT_SETTINGS } from "../shared/types/settings";

const SETTINGS_KEY = "app";

export const settingsService = {
  async get(): Promise<Settings> {
    const db = getDb();
    const rows = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.key, SETTINGS_KEY))
      .limit(1);

    if (!rows[0]) return { ...DEFAULT_SETTINGS };

    try {
      const parsed = JSON.parse(rows[0].value) as Partial<Settings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },

  async update(input: UpdateSettingsInput): Promise<Settings> {
    const db = getDb();
    const current = await this.get();
    const next: Settings = { ...current, ...input };

    const serialized = JSON.stringify(next);

    await db
      .insert(settingsTable)
      .values({ key: SETTINGS_KEY, value: serialized })
      .onConflictDoUpdate({
        target: settingsTable.key,
        set: { value: serialized, updatedAt: new Date() },
      });

    return next;
  },
};