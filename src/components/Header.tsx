import { Search, Bell, User } from "lucide-react";

function Header() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Shop Management System
        </h2>

        <p className="text-sm text-slate-500">
          Manage your business efficiently
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 md:flex">
          <Search size={18} className="text-slate-400" />

          <input
            type="text"
            placeholder="Search..."
            className="w-48 border-none text-sm outline-none"
          />
        </div>

        <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell size={20} />
        </button>

        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <User size={20} />
        </button>
      </div>
    </header>
  );
}

export default Header;