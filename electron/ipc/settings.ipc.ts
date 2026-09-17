import { ipcMain } from "electron";
import { settingsService } from "../services/settings.service";
import { updateSettingsSchema } from "../shared/types/settings";

export function registerSettingsIpc() {
  ipcMain.handle("settings:get", async () => {
    return settingsService.get();
  });

  ipcMain.handle("settings:update", async (_e, rawInput: unknown) => {
    const input = updateSettingsSchema.parse(rawInput);
    return settingsService.update(input);
  });
}