import { Page } from "../../components/ui/Page";

export function DashboardPage() {
  return (
    <Page
      title="Dashboard"
      description="Business overview at a glance."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          "Today's Sales",
          "Today's Gross Profit",
          "Today's Net Profit",
          "Pending Khaata",
          "Low Stock Alerts",
          "Bills Created Today",
        ].map((label) => (
          <div
            key={label}
            className="rounded-xl border bg-[rgb(var(--card))] p-5"
          >
            <p className="text-sm text-[rgb(var(--muted-fg))]">{label}</p>
            <p className="text-3xl font-semibold mt-2">—</p>
          </div>
        ))}
      </div>
    </Page>
  );
}