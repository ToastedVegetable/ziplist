import { Link } from "react-router";
import { ListFilter, Search, Shuffle, Plus } from "lucide-react";

const CARD_IMAGES = {
  browse: "https://images.unsplash.com/photo-1636401870585-a8852371e84a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
  ingredients: "https://images.unsplash.com/photo-1542838132-92c53300491e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
  wheel: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
  upload: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
};

export function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-[#4E2A84] tracking-tight mb-4">ziplist</h1>
      <p className="text-lg sm:text-xl text-slate-600 mb-10 sm:mb-16 max-w-2xl">
        Decide what to eat without overthinking it
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Card 1 */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow overflow-hidden">
          <img
            src={CARD_IMAGES.browse}
            alt="Chicken rice bowl with vegetables"
            className="mb-6 h-36 w-full rounded-2xl object-cover"
          />
          <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-5">
            <Search size={32} className="text-[#4E2A84]" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-slate-800">Browse Recipes</h2>
          <p className="text-slate-500 mb-8 flex-1">
            Scan real meal options with prep time, cost, ingredients, and the details you need before committing.
          </p>
          <Link
            to="/plan"
            aria-label="Plan meals by browsing recipes"
            className="w-full bg-[#4E2A84] text-white py-3 px-6 rounded-full font-semibold hover:bg-[#3d2168] transition-colors"
          >
            Browse the Board
          </Link>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow overflow-hidden">
          <img
            src={CARD_IMAGES.ingredients}
            alt="Fresh vegetables and pantry ingredients"
            className="mb-6 h-36 w-full rounded-2xl object-cover"
          />
          <div className="w-16 h-16 rounded-full bg-[#FFF4ED] flex items-center justify-center mb-5">
            <ListFilter size={32} className="text-[#E4572E]" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-slate-800">Fridge Match</h2>
          <p className="text-slate-500 mb-8 flex-1">
            Type what you have, then let ZipList rank recipes by matches, missing items, and extra cost.
          </p>
          <Link
            to="/ingredient-search"
            aria-label="Search recipes by ingredient"
            className="w-full bg-[#E4572E] text-white py-3 px-6 rounded-full font-semibold hover:bg-[#C94727] transition-colors"
          >
            Match My Ingredients
          </Link>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow overflow-hidden">
          <img
            src={CARD_IMAGES.wheel}
            alt="Bowl of ramen with egg and greens"
            className="mb-6 h-36 w-full rounded-2xl object-cover"
          />
          <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-5">
            <Shuffle size={32} className="text-[#4E2A84]" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-slate-800">Decision Wheel</h2>
          <p className="text-slate-500 mb-8 flex-1">
            Spin through meals without repeats when the group chat, fridge, or your brain refuses to choose.
          </p>
          <Link
            to="/wheel"
            aria-label="Open the random recipe wheel"
            className="w-full bg-white text-[#4E2A84] border-2 border-[#4E2A84] py-3 px-6 rounded-full font-semibold hover:bg-purple-50 transition-colors"
          >
            Spin Dinner
          </Link>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow overflow-hidden">
          <img
            src={CARD_IMAGES.upload}
            alt="Recipe notes beside fresh ingredients"
            className="mb-6 h-36 w-full rounded-2xl object-cover"
          />
          <div className="w-16 h-16 rounded-full bg-[#FFF4ED] flex items-center justify-center mb-5">
            <Plus size={32} className="text-[#E4572E]" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-slate-800">Add a Keeper</h2>
          <p className="text-slate-500 mb-8 flex-1">
            Save the meals you actually make so they can show up in Browse, Fridge Match, and the wheel.
          </p>
          <Link
            to="/upload"
            aria-label="Add a new recipe"
            className="w-full bg-slate-100 text-slate-700 py-3 px-6 rounded-full font-semibold hover:bg-[#FFF4ED] hover:text-[#B83B1D] transition-colors"
          >
            Save a Recipe
          </Link>
        </div>
      </div>
    </div>
  );
}
