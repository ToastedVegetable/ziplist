import { Link } from "react-router";
import { ListFilter, Search, Shuffle, Plus } from "lucide-react";

export function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-[#4E2A84] tracking-tight mb-4">ziplist</h1>
      <p className="text-lg sm:text-xl text-slate-500 mb-10 sm:mb-16 max-w-lg">
        Decide what to eat without overthinking it
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Card 1 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mb-6">
            <Search size={32} className="text-[#4E2A84]" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-slate-800">Browse Recipes</h2>
          <p className="text-slate-500 mb-8 flex-1">
            Get realistic meal ideas based on your budget, diet, preferences, and cooking access.
          </p>
          <Link
            to="/plan"
            aria-label="Plan meals by browsing recipes"
            className="w-full bg-[#4E2A84] text-white py-3 px-6 rounded-full font-semibold hover:bg-[#3d2168] transition-colors"
          >
            Plan My Meals
          </Link>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mb-6">
            <ListFilter size={32} className="text-[#4E2A84]" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-slate-800">Search Ingredients</h2>
          <p className="text-slate-500 mb-8 flex-1">
            Find recipes that use ingredients you already have on hand.
          </p>
          <Link
            to="/ingredient-search"
            aria-label="Search recipes by ingredient"
            className="w-full bg-white text-[#4E2A84] border-2 border-[#4E2A84] py-3 px-6 rounded-full font-semibold hover:bg-purple-50 transition-colors"
          >
            Search Ingredients
          </Link>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mb-6">
            <Shuffle size={32} className="text-[#4E2A84]" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-slate-800">Random Choice</h2>
          <p className="text-slate-500 mb-8 flex-1">
            Let ziplist choose a meal for you when you do not want to decide.
          </p>
          <Link
            to="/wheel"
            aria-label="Open the random recipe wheel"
            className="w-full bg-white text-[#4E2A84] border-2 border-[#4E2A84] py-3 px-6 rounded-full font-semibold hover:bg-purple-50 transition-colors"
          >
            Spin the Wheel
          </Link>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mb-6">
            <Plus size={32} className="text-[#4E2A84]" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-slate-800">Upload Recipe</h2>
          <p className="text-slate-500 mb-8 flex-1">
            Save your own recipes and add them to your weekly meal options.
          </p>
          <Link
            to="/upload"
            aria-label="Add a new recipe"
            className="w-full bg-slate-100 text-slate-700 py-3 px-6 rounded-full font-semibold hover:bg-slate-200 transition-colors"
          >
            Add Recipe
          </Link>
        </div>
      </div>
    </div>
  );
}
