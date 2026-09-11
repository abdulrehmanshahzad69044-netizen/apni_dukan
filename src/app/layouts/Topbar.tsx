export function Topbar() {
  return (
    <header
      className="md:hidden h-14 border-b flex items-center px-4 sticky top-0 z-20"
      style={{ backgroundColor: "rgb(var(--sidebar-bg))" }}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-[rgb(var(--fg))] text-[rgb(var(--bg))] flex items-center justify-center font-bold text-xs">
          AD
        </div>
        <span className="font-semibold">Apni Dukan</span>
      </div>
    </header>
  );
}