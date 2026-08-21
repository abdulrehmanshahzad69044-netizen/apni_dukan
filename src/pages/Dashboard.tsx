import {
  ShoppingCart,
  TrendingUp,
  Wallet,
  Receipt,
} from "lucide-react";

function Dashboard() {
  const stats = [
    {
      title: "Today's Sales",
      value: "Rs. 0",
      icon: ShoppingCart,
      description: "No sales yet",
    },
    {
      title: "Gross Profit",
      value: "Rs. 0",
      icon: TrendingUp,
      description: "Today's profit",
    },
    {
      title: "Pending Khaata",
      value: "Rs. 0",
      icon: Wallet,
      description: "Amount to recover",
    },
    {
      title: "Bills Today",
      value: "0",
      icon: Receipt,
      description: "No bills created",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-1 text-slate-500">
          Overview of your business
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-lg bg-green-50 p-3 text-green-600">
                  <Icon size={22} />
                </div>
              </div>

              <p className="text-sm text-slate-500">
                {stat.title}
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {stat.value}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Quick Actions
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <button className="rounded-lg bg-green-500 px-4 py-3 font-medium text-white hover:bg-green-600">
              New Bill
            </button>

            <button className="rounded-lg border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">
              Add Customer
            </button>

            <button className="rounded-lg border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">
              Add Product
            </button>

            <button className="rounded-lg border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">
              Add Expense
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Business Summary
          </h2>

          <div className="mt-6 space-y-4">
            <div className="flex justify-between border-b pb-3">
              <span className="text-slate-500">
                Business Expenses
              </span>

              <span className="font-semibold">
                Rs. 0
              </span>
            </div>

            <div className="flex justify-between border-b pb-3">
              <span className="text-slate-500">
                Company Payments
              </span>

              <span className="font-semibold">
                Rs. 0
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">
                Cash Outflow
              </span>

              <span className="font-semibold text-red-500">
                Rs. 0
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;