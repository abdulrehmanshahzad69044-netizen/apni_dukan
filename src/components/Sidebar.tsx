import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Boxes,
  ReceiptText,
  WalletCards,
  HandCoins,
  CreditCard,
  BarChart3,
  DatabaseBackup,
  Store,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const menuItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Customers",
    path: "/customers",
    icon: Users,
  },
  {
    name: "Companies",
    path: "/companies",
    icon: Building2,
  },
  {
    name: "Products",
    path: "/products",
    icon: Package,
  },
  {
    name: "Inventory",
    path: "/inventory",
    icon: Boxes,
  },
  {
    name: "Billing",
    path: "/billing",
    icon: ReceiptText,
  },
  {
    name: "Khaata",
    path: "/khaata",
    icon: WalletCards,
  },
  {
    name: "Payments",
    path: "/payments",
    icon: HandCoins,
  },
  {
    name: "Expenses",
    path: "/expenses",
    icon: CreditCard,
  },
  {
    name: "Reports",
    path: "/reports",
    icon: BarChart3,
  },
  {
    name: "Backup",
    path: "/backup",
    icon: DatabaseBackup,
  },
];

function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col bg-slate-900 text-white">
      <div className="flex items-center gap-3 border-b border-slate-700 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500">
          <Store size={22} />
        </div>

        <div>
          <h1 className="text-lg font-bold">Apni Dukan</h1>
          <p className="text-xs text-slate-400">
            Shop Management
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-green-500 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon size={20} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-700 p-4">
        <p className="text-xs text-slate-400">
          Apni Dukan v0.1.0
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;