import { z } from "zod";

export type Settings = {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  taxNumber: string;
  receiptFooter: string;
  defaultReceiptSize: "thermal_80" | "thermal_58" | "a4";
  currency: string;
  onboardingComplete: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  shopName: "Apni Dukan",
  shopAddress: "",
  shopPhone: "",
  taxNumber: "",
  receiptFooter: "Thank you for your business!",
  defaultReceiptSize: "thermal_80",
  currency: "PKR",
  onboardingComplete: false,
};

const optionalTrimmedString = (max: number) =>
  z.union([z.string(), z.null(), z.undefined()]).transform((v) => {
    if (v === null || v === undefined) return "";
    const t = v.trim();
    if (t.length > max) throw new Error(`Must be at most ${max} characters`);
    return t;
  });

export const updateSettingsSchema = z.object({
  shopName: z.string().trim().min(1, "Shop name is required").max(120),
  shopAddress: optionalTrimmedString(300),
  shopPhone: optionalTrimmedString(30),
  taxNumber: optionalTrimmedString(30),
  receiptFooter: optionalTrimmedString(200),
  defaultReceiptSize: z.enum(["thermal_80", "thermal_58", "a4"]),
  currency: z.string().trim().min(1).max(10),
  onboardingComplete: z.boolean().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;