import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Boxes,
  Receipt,
  BookOpen,
  Wallet,
  TrendingDown,
  BarChart3,
  Settings,
  Tag,
  Ruler,
  ArrowRightLeft,
  Layers,
  Truck,
  ClipboardList,
} from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  mobile?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, mobile: true },
  { label: "Billing", to: "/billing", icon: Receipt, mobile: true },
  { label: "Customers", to: "/customers", icon: Users, mobile: true },
  { label: "Inventory", to: "/inventory", icon: Boxes, mobile: true },
  { label: "Purchases", to: "/purchases", icon: Truck },
  { label: "Adjustments", to: "/adjustments", icon: ClipboardList },
  { label: "Products", to: "/products", icon: Package },
  { label: "Variants", to: "/variants", icon: Layers },
  { label: "Categories", to: "/categories", icon: Tag },
  { label: "Units", to: "/units", icon: Ruler },
  { label: "Unit Conversions", to: "/unit-conversions", icon: ArrowRightLeft },
  { label: "Companies", to: "/companies", icon: Building2 },
  { label: "Khaata", to: "/khaata", icon: BookOpen },
  { label: "Payments", to: "/payments", icon: Wallet },
  { label: "Expenses", to: "/expenses", icon: TrendingDown },
  { label: "Reports", to: "/reports", icon: BarChart3 },
  { label: "Settings", to: "/settings", icon: Settings },
];