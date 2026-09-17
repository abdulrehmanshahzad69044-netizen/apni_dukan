import type {
  Settings,
  UpdateSettingsInput,
} from "../../../electron/shared/types/settings";

export const settingsApi = {
  async get(): Promise<Settings> {
    return window.api.settings.get();
  },
  async update(input: UpdateSettingsInput): Promise<Settings> {
    return window.api.settings.update(input);
  },
};