import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowLeft, Sparkles, ShoppingCart, Trash2, RefreshCw, Settings2, X } from "lucide-react";
import { useAppContext, Recipe } from "../context/AppContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Card } from "./ui/card";

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const words = text.split(" ");
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(nextLine).width <= maxWidth || !currentLine) {
      currentLine = nextLine;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function shuffleRecipes(recipes: Recipe[]): Recipe[] {
  return [...recipes].sort(() => Math.random() - 0.5);
}

export function WheelPage() {
  const { recipeDB, selectedMeals, setSelectedMeals, weeklyMeals, clearWeeklyMeals } = useAppContext();
  const [searchParams] = useSearchParams();
  const startedFromWeekPicker = searchParams.get("source") === "week";
  const hasWeeklyMealOptions = weeklyMeals.length > 0;

  // Wheel configuration
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [wheelRecipes, setWheelRecipes] = useState<Recipe[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [maxCost, setMaxCost] = useState<number>(10);
  const [showConfig, setShowConfig] = useState(false);

  // Wheel state
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Selection list
  const [pickedRecipes, setPickedRecipes] = useState<Recipe[]>([]);
  const [usingWeeklyMeals, setUsingWeeklyMeals] = useState(startedFromWeekPicker || hasWeeklyMealOptions);

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    filterWheelRecipes();
  }, [allRecipes, selectedCategories, selectedTags, maxCost, usingWeeklyMeals, weeklyMeals]);

  useEffect(() => {
    drawWheel();
  }, [wheelRecipes, rotation]);

  const loadRecipes = async () => {
    const recipes = await recipeDB.getAll();
    setAllRecipes(recipes);
    setWheelRecipes(getStartingWheelRecipes(recipes));
  };

  const getStartingWheelRecipes = (recipes: Recipe[]) => {
    if (usingWeeklyMeals && weeklyMeals.length > 0) {
      return weeklyMeals;
    }

    return recipes.slice(0, 8);
  };

  const buildFilteredWheelRecipes = () => {
    let filtered = [...allRecipes];

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(recipe =>
        selectedCategories.includes(recipe.category)
      );
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(recipe =>
        selectedTags.some(tag => recipe.tags.includes(tag))
      );
    }

    filtered = filtered.filter(recipe => {
      const cost = parseFloat(recipe.cost.replace('$', ''));
      return cost <= maxCost;
    });

    const randomized = shuffleRecipes(filtered).slice(0, 8);
    return randomized.length > 0 ? randomized : allRecipes.slice(0, 8);
  };

  const filterWheelRecipes = () => {
    if (allRecipes.length === 0) return;

    if (usingWeeklyMeals && weeklyMeals.length > 0) {
      setWheelRecipes(weeklyMeals.filter(recipe => !pickedRecipes.some(picked => picked.id === recipe.id)));
      return;
    }

    setWheelRecipes(buildFilteredWheelRecipes());
  };

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 180;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (wheelRecipes.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#F8FAFC';
      ctx.fill();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'center';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('All recipes picked', centerX, centerY - 8);
      ctx.font = '14px sans-serif';
      ctx.fillText('Regenerate the wheel to start again', centerX, centerY + 20);
      return;
    }

    const sliceAngle = (2 * Math.PI) / wheelRecipes.length;

    // Draw wheel slices
    wheelRecipes.forEach((recipe, index) => {
      const startAngle = index * sliceAngle + (rotation * Math.PI / 180);
      const endAngle = startAngle + sliceAngle;

      // Slice background
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      // Alternate colors
      const colors = ['#4E2A84', '#6B46A8', '#8B5FC9', '#9F7DCE'];
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();

      // Border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Recipe name
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${recipe.name.length > 22 ? 11 : 13}px sans-serif`;

      const labelLines = wrapCanvasText(ctx, recipe.name, radius * 0.58);
      const lineHeight = recipe.name.length > 22 ? 12 : 14;
      const startY = -((labelLines.length - 1) * lineHeight) / 2;
      labelLines.forEach((line, lineIndex) => {
        ctx.fillText(line, radius * 0.62, startY + lineIndex * lineHeight);
      });
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#4E2A84';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Pointer (fixed at bottom)
    ctx.beginPath();
    ctx.moveTo(centerX, canvas.height - 20);
    ctx.lineTo(centerX - 15, canvas.height - 50);
    ctx.lineTo(centerX + 15, canvas.height - 50);
    ctx.closePath();
    ctx.fillStyle = '#EF4444';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const spinWheel = () => {
    if (isSpinning || wheelRecipes.length === 0) return;

    setIsSpinning(true);
    const spinDuration = 3000;
    const extraRotations = 5;
    const randomDegrees = Math.random() * 360;
    const totalRotation = extraRotations * 360 + randomDegrees;

    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = easeOut * totalRotation;
      setRotation(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Calculate which recipe was selected
        const normalizedRotation = currentRotation % 360;
        const sliceAngle = 360 / wheelRecipes.length;
        // The pointer is fixed at the bottom (90 degrees in canvas coordinates).
        const pointerAngle = (90 - normalizedRotation + 360) % 360;
        const selectedIndex = Math.floor(pointerAngle / sliceAngle) % wheelRecipes.length;
        const selected = wheelRecipes[selectedIndex];

        setSelectedRecipe(selected);
        setIsSpinning(false);
        setWheelRecipes(prev => prev.filter(recipe => recipe.id !== selected.id));
        setRotation(0);

        // Add to picked recipes if not already there
        if (!pickedRecipes.find(r => r.id === selected.id)) {
          setPickedRecipes(prev => [...prev, selected]);
        }
      }
    };

    requestAnimationFrame(animate);
  };

  const removeFromPicked = (id: string) => {
    setPickedRecipes(prev => prev.filter(r => r.id !== id));
  };

  const addAllToCart = () => {
    const newSelected = new Set(selectedMeals);
    pickedRecipes.forEach(recipe => newSelected.add(recipe.id));
    setSelectedMeals(newSelected);
  };

  const clearPicked = () => {
    setPickedRecipes([]);
    setSelectedRecipe(null);
    setWheelRecipes(getStartingWheelRecipes(allRecipes));
  };

  const regenerateWheel = () => {
    setUsingWeeklyMeals(false);
    clearWeeklyMeals();
    setPickedRecipes([]);
    setWheelRecipes(buildFilteredWheelRecipes());
    setRotation(0);
    setSelectedRecipe(null);
  };

  const useAllRecipes = () => {
    setUsingWeeklyMeals(false);
    clearWeeklyMeals();
    setPickedRecipes([]);
    setSelectedRecipe(null);
    setWheelRecipes(allRecipes.slice(0, 8));
    setRotation(0);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const categories = ["breakfast", "lunch", "dinner", "snack"];
  const commonTags = ["vegetarian", "vegan", "high protein", "quick", "cheap", "healthy"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            aria-label="Go back to home"
            className="text-slate-500 hover:text-[#4E2A84] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Recipe Wheel</h1>
            <p className="text-sm text-slate-500">Spin to discover your next meal</p>
          </div>
        </div>

        <Button
          onClick={() => setShowConfig(!showConfig)}
          variant="outline"
          aria-label={showConfig ? "Hide wheel configuration" : "Show wheel configuration"}
          className="gap-2"
        >
          <Settings2 size={18} />
          Configure Wheel
        </Button>
      </div>

      <div className="container mx-auto p-6 grid lg:grid-cols-[1fr,400px] gap-6">
        {/* Left: Wheel Section */}
        <div className="space-y-6">
          {/* Configuration Panel */}
          {showConfig && (
            <Card className="p-6 bg-white border-2 border-[#4E2A84]/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">Wheel Configuration</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfig(false)}
                  aria-label="Close wheel configuration"
                >
                  <X size={18} />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Categories */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Meal Categories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <Badge
                        key={cat}
                        variant={selectedCategories.includes(cat) ? "default" : "outline"}
                        className={`cursor-pointer capitalize ${
                          selectedCategories.includes(cat)
                            ? "bg-[#4E2A84] hover:bg-[#3d2168]"
                            : "hover:bg-slate-100"
                        }`}
                        onClick={() => toggleCategory(cat)}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Dietary Preferences
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {commonTags.map(tag => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          selectedTags.includes(tag)
                            ? "bg-[#4E2A84] hover:bg-[#3d2168]"
                            : "hover:bg-slate-100"
                        }`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Max Cost */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Max Cost: ${maxCost}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="0.5"
                    value={maxCost}
                    onChange={(e) => setMaxCost(parseFloat(e.target.value))}
                    className="w-full accent-[#4E2A84]"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>$1</span>
                    <span>$15</span>
                  </div>
                </div>

                <Button
                  onClick={regenerateWheel}
                  aria-label="Regenerate the recipe wheel"
                  className="w-full bg-[#4E2A84] hover:bg-[#3d2168] gap-2"
                >
                  <RefreshCw size={16} />
                  Regenerate Wheel
                </Button>
                {usingWeeklyMeals && (
                  <Button
                    onClick={useAllRecipes}
                    variant="outline"
                    aria-label="Use all recipes for the wheel"
                    className="w-full border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Use All Recipes
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Wheel Display */}
          <Card className="p-8 bg-white">
            <div className="flex flex-col items-center">
              {usingWeeklyMeals && weeklyMeals.length > 0 && (
                <div className="mb-5 w-full max-w-md rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 text-center">
                  <p className="text-sm font-semibold text-[#4E2A84]">
                    Spinning from your picked week
                  </p>
                  <p className="text-xs text-purple-700/70">
                    Each recipe leaves the wheel after it lands.
                  </p>
                </div>
              )}
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width="400"
                  height="400"
                  className="drop-shadow-xl"
                />
              </div>

              <div className="mt-6 space-y-4 w-full max-w-md">
                <Button
                  onClick={spinWheel}
                  disabled={isSpinning || wheelRecipes.length === 0}
                  aria-label="Spin the recipe wheel"
                  className="w-full py-6 text-lg font-bold bg-gradient-to-r from-[#4E2A84] to-[#6B46A8] hover:from-[#3d2168] hover:to-[#5a3890] disabled:opacity-50 gap-2"
                >
                  <Sparkles size={20} />
                  {isSpinning ? "Spinning..." : wheelRecipes.length === 0 ? "All Recipes Picked" : "Spin the Wheel!"}
                </Button>

                {wheelRecipes.length === 0 && !isSpinning && (
                  <Button
                    onClick={clearPicked}
                    variant="outline"
                    aria-label="Refill the recipe wheel"
                    className="w-full border-[#4E2A84]/30 text-[#4E2A84] hover:bg-purple-50 gap-2"
                  >
                    <RefreshCw size={16} />
                    Refill Wheel
                  </Button>
                )}

                {selectedRecipe && !isSpinning && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-[#4E2A84]/30 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedRecipe.image}
                        alt={selectedRecipe.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="text-xs text-[#4E2A84] font-semibold mb-1">
                          You got:
                        </p>
                        <h3 className="font-bold text-slate-800">
                          {selectedRecipe.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {selectedRecipe.prepTime} • {selectedRecipe.cost}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Current wheel recipes preview */}
              <div className="mt-6 w-full">
                <p className="text-xs text-slate-500 text-center mb-2">
                  Current wheel: {wheelRecipes.length} recipes
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {wheelRecipes.map(r => (
                    <Badge key={r.id} variant="secondary" className="text-xs whitespace-normal text-center leading-snug">
                      {r.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Selection List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-120px)] sticky top-6">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-800">Your Selections</h2>
              {pickedRecipes.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearPicked}
                  aria-label="Clear selected recipes"
                  className="text-slate-500 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
            <p className="text-sm text-slate-500">
              {pickedRecipes.length} {pickedRecipes.length === 1 ? "recipe" : "recipes"} selected
            </p>
          </div>

          <ScrollArea className="flex-1 p-4">
            {pickedRecipes.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-400">Spin the wheel to add recipes!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pickedRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="bg-slate-50 rounded-lg p-3 border border-slate-200 hover:border-[#4E2A84]/30 transition-colors group"
                  >
                    <div className="flex gap-3">
                      <img
                        src={recipe.image}
                        alt={recipe.name}
                        className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 mb-1 leading-snug">
                          {recipe.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                          <span>{recipe.prepTime}</span>
                          <span>•</span>
                          <span>{recipe.cost}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {recipe.tags.slice(0, 2).map(tag => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs px-1.5 py-0 h-5"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromPicked(recipe.id)}
                        aria-label={`Remove ${recipe.name} from selections`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {pickedRecipes.length > 0 && (
            <div className="p-4 border-t border-slate-200 space-y-2">
              <div className="text-sm text-slate-600 mb-2">
                Total estimated cost:{" "}
                <span className="font-bold text-[#4E2A84]">
                  $
                  {pickedRecipes
                    .reduce((sum, r) => sum + parseFloat(r.cost.replace("$", "")), 0)
                    .toFixed(2)}
                </span>
              </div>
              <Separator />
              <Link
                to="/grocery-list"
                aria-label="Open grocery list with selected recipes"
                className="block"
              >
                <Button
                  onClick={addAllToCart}
                  aria-label="Add all selected recipes to grocery list"
                  className="w-full bg-[#4E2A84] hover:bg-[#3d2168] gap-2"
                >
                  <ShoppingCart size={18} />
                  Add All to Grocery List
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
