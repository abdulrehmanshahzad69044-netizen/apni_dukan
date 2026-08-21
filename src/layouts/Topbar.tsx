import { Bell, Menu, Search } from "lucide-react";

interface TopbarProps {
  onMenuClick: () => void;
}

function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={22} />
      </button>

      <div className="hidden max-w-md flex-1 sm:block">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <Search size={18} className="text-slate-400" />

          <input
            type="text"
            placeholder="Search products, customers..."
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100"
        >
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">
            Shop Owner
          </p>

          <p className="text-xs text-slate-400">
            Administrator
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
          AD
        </div>
      </div>
    </header>
  );
}

export default Topbar;