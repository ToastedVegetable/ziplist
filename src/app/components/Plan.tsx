import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Clock, DollarSign, ChefHat, Users, Flame, ShoppingCart, Sparkles } from "lucide-react";
import { useAppContext, Recipe } from "../context/AppContext";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export function Plan() {
  const { recipeDB, selectedMeals, setSelectedMeals, setWeeklyMeals } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const requestedRecipeId = searchParams.get("recipe");

  useEffect(() => {
    loadRecipes();
  }, [requestedRecipeId]);

  const loadRecipes = async () => {
    setLoading(true);
    const allRecipes = await recipeDB.getAll();
    setRecipes(allRecipes);
    setSelectedRecipe((currentRecipe) => {
      const requestedRecipe = requestedRecipeId
        ? allRecipes.find(recipe => recipe.id === requestedRecipeId)
        : null;
      const refreshedCurrentRecipe = currentRecipe
        ? allRecipes.find(recipe => recipe.id === currentRecipe.id)
        : null;

      return requestedRecipe || refreshedCurrentRecipe || allRecipes[0] || null;
    });
    setLoading(false);
  };

  const toggleMealSelection = (id: string) => {
    const next = new Set(selectedMeals);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedMeals(next);
  };

  const chooseWeekMeals = () => {
    const weeklyRecipes = [...recipes]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(14, recipes.length));

    if (weeklyRecipes.length === 0) {
      return;
    }

    setWeeklyMeals(weeklyRecipes);
    setSelectedMeals(new Set(weeklyRecipes.map((recipe) => recipe.id)));
    setSelectedRecipe(weeklyRecipes[0]);
    navigate("/grocery-list");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-500">Loading recipes...</div>
      </div>
    );
  }

  return (
    // Break out of the Layout's max-w-5xl + padded <main> so the two-panel
    // browser can use the full viewport width and height. The calc() margins
    // pull the element back out to the viewport edges (cancelling max-w-5xl
    // and px-6), and -my-10 cancels <main>'s vertical padding. The fixed
    // height lets the inner ScrollAreas know exactly how tall they can be.
    <div
      className="-my-10 flex flex-col bg-white"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        height: "calc(100vh - 73px)",
      }}
    >
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            aria-label="Go back to home"
            className="text-slate-500 hover:text-[#4E2A84] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Browse Recipes</h1>
            <p className="text-sm text-slate-500">{recipes.length} recipes available</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={chooseWeekMeals}
            disabled={recipes.length === 0}
            variant="outline"
            aria-label="Pick 14 random meals for the week"
            className="border-[#4E2A84]/30 text-[#4E2A84] hover:bg-purple-50 gap-2"
          >
            <Sparkles size={18} />
            Pick My Week
          </Button>
          <Link to="/grocery-list" aria-label={`Open grocery list with ${selectedMeals.size} selected meals`}>
            <Button
              aria-label={`Open grocery list with ${selectedMeals.size} selected meals`}
              className="bg-[#4E2A84] hover:bg-[#3d2168]"
            >
              <ShoppingCart size={18} className="mr-2" />
              Grocery List ({selectedMeals.size})
            </Button>
          </Link>
        </div>
      </div>

      {/* Two-panel layout. `min-h-0` is critical: without it, flex items
          default to min-height: auto, which lets the inner ScrollAreas grow
          to fit all 50 recipes instead of scrolling. */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - Recipe List */}
        <div className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col overflow-hidden min-h-0">
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-2">
              {recipes.map((recipe) => {
                const isSelected = selectedRecipe?.id === recipe.id;
                const isInCart = selectedMeals.has(recipe.id);

                return (
                  <button
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe)}
                    aria-label={`View details for ${recipe.name}`}
                    className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${
                      isSelected
                        ? "bg-white shadow-sm border border-[#4E2A84]/20"
                        : "bg-white/60 hover:bg-white hover:shadow-sm border border-transparent"
                    }`}
                  >
                    <div className="flex gap-3">
                      <img
                        src={recipe.image}
                        alt={recipe.name}
                        className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-sm mb-1 truncate ${
                          isSelected ? "text-[#4E2A84]" : "text-slate-800"
                        }`}>
                          {recipe.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {recipe.prepTime}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <DollarSign size={12} />
                            {recipe.cost.replace('$', '')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {recipe.source === "user-upload" && (
                            <Badge className="text-xs px-1.5 py-0 h-5 bg-[#4E2A84] text-white hover:bg-[#4E2A84]">
                              User Upload
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                            {recipe.difficulty}
                          </Badge>
                          {isInCart && (
                            <Badge className="text-xs px-1.5 py-0 h-5 bg-[#4E2A84] hover:bg-[#4E2A84]">
                              In Cart
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Recipe Details */}
        <div className="flex-1 bg-white overflow-hidden min-w-0">
          {selectedRecipe ? (
            <ScrollArea className="h-full">
              <div className="max-w-4xl mx-auto p-8">
                {/* Recipe Image */}
                <div className="relative rounded-2xl overflow-hidden mb-6 h-80">
                  <img
                    src={selectedRecipe.image}
                    alt={selectedRecipe.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <h2 className="text-4xl font-bold mb-2">{selectedRecipe.name}</h2>
                      {selectedRecipe.description && (
                        <p className="text-white/90">{selectedRecipe.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recipe Meta */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <Clock className="w-5 h-5 mx-auto mb-2 text-[#4E2A84]" />
                    <div className="text-xs text-slate-500 mb-1">Prep Time</div>
                    <div className="font-semibold text-slate-800">{selectedRecipe.prepTime}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <DollarSign className="w-5 h-5 mx-auto mb-2 text-[#4E2A84]" />
                    <div className="text-xs text-slate-500 mb-1">Cost</div>
                    <div className="font-semibold text-slate-800">{selectedRecipe.cost}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <ChefHat className="w-5 h-5 mx-auto mb-2 text-[#4E2A84]" />
                    <div className="text-xs text-slate-500 mb-1">Difficulty</div>
                    <div className="font-semibold text-slate-800">{selectedRecipe.difficulty}</div>
                  </div>
                  {selectedRecipe.servings && (
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <Users className="w-5 h-5 mx-auto mb-2 text-[#4E2A84]" />
                      <div className="text-xs text-slate-500 mb-1">Servings</div>
                      <div className="font-semibold text-slate-800">{selectedRecipe.servings}</div>
                    </div>
                  )}
                  {selectedRecipe.calories && !selectedRecipe.servings && (
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <Flame className="w-5 h-5 mx-auto mb-2 text-[#4E2A84]" />
                      <div className="text-xs text-slate-500 mb-1">Calories</div>
                      <div className="font-semibold text-slate-800">{selectedRecipe.calories}</div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedRecipe.source === "user-upload" && (
                    <Badge className="bg-[#4E2A84] text-white hover:bg-[#4E2A84]">
                      User Upload
                    </Badge>
                  )}
                  {selectedRecipe.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-purple-50 text-[#4E2A84] hover:bg-purple-100">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Separator className="my-6" />

                {/* Ingredients and Steps */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {/* Ingredients */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <div className="w-1 h-6 bg-[#4E2A84] rounded-full"></div>
                      Ingredients
                    </h3>
                    <div className="space-y-3">
                      {selectedRecipe.ingredients.map((ingredient, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0"
                        >
                          <div>
                            <span className="font-medium text-slate-800">{ingredient.name}</span>
                            {ingredient.optional && (
                              <span className="text-xs text-slate-400 ml-2">(optional)</span>
                            )}
                          </div>
                          <span className="text-sm text-slate-500">{ingredient.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-700">Estimated Cost</span>
                        <span className="text-lg font-bold text-[#4E2A84]">
                          ${selectedRecipe.ingredients.reduce((sum, ing) => sum + ing.cost, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Steps */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <div className="w-1 h-6 bg-[#4E2A84] rounded-full"></div>
                      Instructions
                    </h3>
                    <ol className="space-y-4">
                      {selectedRecipe.steps.map((step, index) => (
                        <li key={index} className="flex gap-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#4E2A84] text-white flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <p className="text-slate-700 pt-0.5 leading-relaxed">{step}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Action Button */}
                <div className="sticky bottom-0 bg-white pt-6 pb-2 border-t border-slate-200 -mx-8 px-8">
                  <Button
                    onClick={() => toggleMealSelection(selectedRecipe.id)}
                    aria-label={
                      selectedMeals.has(selectedRecipe.id)
                        ? `Remove ${selectedRecipe.name} from grocery list`
                        : `Add ${selectedRecipe.name} to grocery list`
                    }
                    className={`w-full py-6 text-lg font-semibold ${
                      selectedMeals.has(selectedRecipe.id)
                        ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        : "bg-[#4E2A84] hover:bg-[#3d2168]"
                    }`}
                  >
                    {selectedMeals.has(selectedRecipe.id) ? (
                      "Remove from Grocery List"
                    ) : (
                      <>
                        <ShoppingCart size={20} className="mr-2" />
                        Add to Grocery List
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-slate-400">
                <ChefHat size={48} className="mx-auto mb-3 opacity-50" />
                <p>Select a recipe to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
