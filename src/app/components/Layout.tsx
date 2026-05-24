import { Outlet, Link } from "react-router";
import { Utensils } from "lucide-react";

export function Layout() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-slate-800 font-sans selection:bg-[#4E2A84] selection:text-white">
      <header className="bg-white sticky top-0 z-10 border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to="/"
            aria-label="Go to ziplist home"
            className="flex items-center gap-2 text-[#4E2A84] hover:opacity-80 transition-opacity"
          >
            <Utensils size={28} className="text-[#4E2A84]" />
            <h1 className="text-2xl font-bold tracking-tight">ziplist</h1>
          </Link>
          <nav className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2 text-sm font-medium text-slate-600">
            <Link to="/plan" aria-label="Plan meals" className="hover:text-[#4E2A84] transition-colors">Plan Meals</Link>
            <Link to="/ingredient-search" aria-label="Search recipes by ingredient" className="hover:text-[#4E2A84] transition-colors">Search Ingredients</Link>
            <Link to="/grocery-list" aria-label="Open grocery list" className="hover:text-[#4E2A84] transition-colors">Grocery List</Link>
            <Link to="/wheel" aria-label="Open recipe wheel" className="hover:text-[#4E2A84] transition-colors">Spin Wheel</Link>
            <Link to="/upload" aria-label="Add a new recipe" className="hover:text-[#4E2A84] transition-colors">Add Recipe</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
