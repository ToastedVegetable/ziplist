import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Clock, DollarSign, Search, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { useAppContext, Recipe } from "../context/AppContext";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

function normalizeSearchTerm(term: string): string {
  return term.trim().toLowerCase();
}

function getMatchingIngredientNames(recipe: Recipe, searchTerm: string): string[] {
  if (!searchTerm) {
    return [];
  }

  return recipe.ingredients
    .filter((ingredient) => ingredient.name.toLowerCase().includes(searchTerm))
    .map((ingredient) => ingredient.name);
}

export function IngredientSearch() {
  const { recipeDB, selectedMeals, setSelectedMeals } = useAppContext();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecipes = async () => {
      setLoading(true);
      const allRecipes = await recipeDB.getAll();
      setRecipes(allRecipes);
      setLoading(false);
    };

    loadRecipes();
  }, [recipeDB]);

  const normalizedTerm = normalizeSearchTerm(searchTerm);
  const matchedRecipes = useMemo(() => {
    if (!normalizedTerm) {
      return [];
    }

    return recipes
      .map((recipe) => ({
        recipe,
        matchingIngredients: getMatchingIngredientNames(recipe, normalizedTerm),
      }))
      .filter(({ matchingIngredients }) => matchingIngredients.length > 0);
  }, [normalizedTerm, recipes]);

  const toggleMealSelection = (id: string) => {
    const next = new Set(selectedMeals);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedMeals(next);
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <Link
        to="/"
        aria-label="Go back to home"
        className="inline-flex items-center text-slate-500 hover:text-[#4E2A84] mb-6 font-medium"
      >
        <ArrowLeft size={16} className="mr-1" /> Back home
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
          Search by Ingredient
        </h1>
        <p className="text-slate-500">
          Find recipes from the shared database and the built-in collection based on what you have.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8">
        <label htmlFor="ingredient-search" className="block text-sm font-bold text-slate-700 mb-2">
          Ingredient
        </label>
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            id="ingredient-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Try egg, chicken, rice, tomato..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#4E2A84]/20 focus:border-[#4E2A84]"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center text-slate-500">
          Loading recipes...
        </div>
      ) : !normalizedTerm ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">
          <SlidersHorizontal className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">Search your ingredients</h2>
          <p className="text-slate-500">
            Enter one ingredient to see every recipe that uses it.
          </p>
        </div>
      ) : matchedRecipes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">
          <h2 className="text-xl font-bold text-slate-700 mb-2">No recipes found</h2>
          <p className="text-slate-500">
            No recipes include "{searchTerm.trim()}". Try a broader ingredient like cheese, rice, or chicken.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-500">
              {matchedRecipes.length} {matchedRecipes.length === 1 ? "recipe" : "recipes"} found
            </p>
            <Link
              to="/grocery-list"
              aria-label={`Open grocery list with ${selectedMeals.size} selected meals`}
              className="text-sm font-semibold text-[#4E2A84] hover:text-[#3d2168]"
            >
              Grocery List ({selectedMeals.size})
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {matchedRecipes.map(({ recipe, matchingIngredients }) => {
              const isSelected = selectedMeals.has(recipe.id);

              return (
                <div
                  key={recipe.id}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col"
                >
                  <Link
                    to={`/plan?recipe=${encodeURIComponent(recipe.id)}`}
                    aria-label={`View ${recipe.name} recipe details`}
                    className="block"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={recipe.image}
                        alt={recipe.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      {recipe.source === "user-upload" && (
                        <Badge className="absolute top-3 left-3 bg-[#4E2A84] text-white hover:bg-[#4E2A84]">
                          User Upload
                        </Badge>
                      )}
                    </div>
                  </Link>

                  <div className="p-5 flex flex-col flex-1">
                    <Link
                      to={`/plan?recipe=${encodeURIComponent(recipe.id)}`}
                      aria-label={`View ${recipe.name} recipe details`}
                    >
                      <h2 className="text-xl font-bold text-slate-800 hover:text-[#4E2A84] transition-colors mb-2">
                        {recipe.name}
                      </h2>
                    </Link>

                    {recipe.description && (
                      <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-4">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={15} />
                        {recipe.prepTime}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <DollarSign size={15} />
                        {recipe.cost.replace("$", "")}
                      </span>
                      <Badge variant="secondary" className="capitalize">
                        {recipe.category}
                      </Badge>
                    </div>

                    <div className="mb-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Matching ingredients
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {matchingIngredients.map((ingredientName) => (
                          <Badge
                            key={ingredientName}
                            variant="secondary"
                            className="bg-purple-50 text-[#4E2A84] hover:bg-purple-100"
                          >
                            {ingredientName}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() => toggleMealSelection(recipe.id)}
                      aria-label={
                        isSelected
                          ? `Remove ${recipe.name} from grocery list`
                          : `Add ${recipe.name} to grocery list`
                      }
                      className={`mt-auto w-full ${
                        isSelected
                          ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                          : "bg-[#4E2A84] hover:bg-[#3d2168]"
                      }`}
                    >
                      {isSelected ? (
                        "Remove from Grocery List"
                      ) : (
                        <>
                          <ShoppingCart size={18} className="mr-2" />
                          Add to Grocery List
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
