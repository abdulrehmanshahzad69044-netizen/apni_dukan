import { useEffect, useState } from "react";
import { Save, Store } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { CenterSpinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/toast";
import { settingsApi } from "./api";
import { useSettings } from "./hooks";
import { BackupSection } from "./BackupSection";

export function SettingsPage() {
  const { data, loading, reload } = useSettings();
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [receiptSize, setReceiptSize] = useState<"thermal_80" | "thermal_58" | "a4">(
    "thermal_80"
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setShopName(data.shopName);
      setShopAddress(data.shopAddress);
      setShopPhone(data.shopPhone);
      setTaxNumber(data.taxNumber);
      setReceiptFooter(data.receiptFooter);
      setReceiptSize(data.defaultReceiptSize);
    }
  }, [data]);

  async function handleSave() {
    if (!shopName.trim()) {
      toast.error("Shop name is required");
      return;
    }
    setSaving(true);
    try {
      await settingsApi.update({
        shopName: shopName.trim(),
        shopAddress: shopAddress.trim(),
        shopPhone: shopPhone.trim(),
        taxNumber: taxNumber.trim(),
        receiptFooter: receiptFooter.trim(),
        defaultReceiptSize: receiptSize,
        currency: data?.currency ?? "PKR",
      });
      toast.success("Settings saved");
      reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !data) {
    return (
      <Page title="Settings">
        <CenterSpinner />
      </Page>
    );
  }

  return (
    <Page
      title="Settings"
      description="Shop information, receipts, and backup."
      actions={
        <Button onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4" />
          Save
        </Button>
      }
    >
      <div className="space-y-8 max-w-3xl">
        {/* Shop info */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[rgb(var(--muted-fg))]" />
            <h2 className="text-base font-semibold">Shop Information</h2>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="set-name">Shop Name *</Label>
            <Input
              id="set-name"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Al-Madina Store"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="set-phone">Phone</Label>
              <Input
                id="set-phone"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                placeholder="e.g. 03001234567"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-tax">Tax / NTN Number</Label>
              <Input
                id="set-tax"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="set-address">Address</Label>
            <Input
              id="set-address"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              placeholder="Shop address"
            />
          </div>
        </section>

        {/* Receipt */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Receipt</h2>

          <div className="space-y-1.5">
            <Label>Default Receipt Size</Label>
            <select
              value={receiptSize}
              onChange={(e) =>
                setReceiptSize(e.target.value as typeof receiptSize)
              }
              className="w-full h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
            >
              <option value="thermal_80">Thermal 80mm</option>
              <option value="thermal_58">Thermal 58mm</option>
              <option value="a4">A4 Invoice</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="set-footer">Receipt Footer</Label>
            <Input
              id="set-footer"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              placeholder="e.g. Thank you for your business!"
            />
            <p className="text-xs text-[rgb(var(--muted-fg))]">
              Printed at the bottom of every receipt.
            </p>
          </div>
        </section>

        {/* Backup */}
        <BackupSection />
      </div>
    </Page>
  );
}