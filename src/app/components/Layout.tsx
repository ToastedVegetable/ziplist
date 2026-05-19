import { Outlet, Link } from "react-router";
import { Utensils } from "lucide-react";

export function Layout() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-slate-800 font-sans selection:bg-[#4E2A84] selection:text-white">
      <header className="bg-white sticky top-0 z-10 border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-[#4E2A84] hover:opacity-80 transition-opacity">
            <Utensils size={28} className="text-[#4E2A84]" />
            <h1 className="text-2xl font-bold tracking-tight">ziplist</h1>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/plan" className="hover:text-[#4E2A84] transition-colors">Plan Meals</Link>
            <Link to="/grocery-list" className="hover:text-[#4E2A84] transition-colors">Grocery List</Link>
            <Link to="/wheel" className="hover:text-[#4E2A84] transition-colors">Spin Wheel</Link>
            <Link to="/upload" className="hover:text-[#4E2A84] transition-colors">Add Recipe</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
