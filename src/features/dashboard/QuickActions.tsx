import { useNavigate } from "react-router-dom";
import {
  Receipt,
  UserPlus,
  Package,
  TrendingDown,
  HandCoins,
  Wallet,
} from "lucide-react";

type Action = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  tone: string;
};

const ACTIONS: Action[] = [
  {
    label: "New Bill",
    icon: Receipt,
    to: "/billing/new",
    tone: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  },
  {
    label: "Add Customer",
    icon: UserPlus,
    to: "/customers",
    tone: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  },
  {
    label: "Add Product",
    icon: Package,
    to: "/products",
    tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  {
    label: "Add Expense",
    icon: TrendingDown,
    to: "/expenses",
    tone: "bg-red-500/15 text-red-700 dark:text-red-400",
  },
  {
    label: "Company Payment",
    icon: HandCoins,
    to: "/company-payments",
    tone: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  {
    label: "Customer Payment",
    icon: Wallet,
    to: "/payments",
    tone: "bg-green-500/15 text-green-700 dark:text-green-400",
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border bg-[rgb(var(--card))] p-4">
      <p className="text-sm font-medium mb-3">Quick Actions</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              onClick={() => navigate(a.to)}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:shadow-sm hover:border-[rgb(var(--fg))]/30 transition-all"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.tone}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-center leading-tight">
                {a.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}