import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "../../lib/nav";
import { cn } from "../../lib/cn";

export function BottomNav() {
  const items = NAV_ITEMS.filter((i) => i.mobile);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t flex"
      style={{ backgroundColor: "rgb(var(--sidebar-bg))" }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium",
                isActive
                  ? "text-[rgb(var(--fg))]"
                  : "text-[rgb(var(--muted-fg))]"
              )
            }
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}