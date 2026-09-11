import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "../../lib/nav";
import { cn } from "../../lib/cn";

export function Sidebar() {
  return (
    <aside
      className="hidden md:flex flex-col w-60 shrink-0 border-r"
      style={{ backgroundColor: "rgb(var(--sidebar-bg))" }}
    >
      <div className="h-16 flex items-center px-5 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[rgb(var(--fg))] text-[rgb(var(--bg))] flex items-center justify-center font-bold text-sm">
            AD
          </div>
          <span className="font-semibold tracking-tight">Apni Dukan</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))]"
                    : "text-[rgb(var(--sidebar-fg))] hover:bg-[rgb(var(--muted))]"
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}