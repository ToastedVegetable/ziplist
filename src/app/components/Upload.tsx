import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Image as ImageIcon, CheckCircle2, Plus, Trash2, X } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import type { Recipe, Ingredient } from "../types/Recipe";

type IngredientDraft = {
  name: string;
  category: Ingredient["category"];
  quantity: string;
  cost: string;
};

const INGREDIENT_CATEGORIES: Ingredient["category"][] = [
  "protein",
  "produce",
  "grains",
  "dairy",
  "pantry",
  "spices",
  "other",
];

const RECIPE_CATEGORIES: Recipe["category"][] = ["breakfast", "lunch", "dinner", "snack", "dessert"];
const DIFFICULTIES: Recipe["difficulty"][] = ["Easy", "Medium", "Hard"];

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1542308197-eb3a1d307399?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cGxvYWQlMjByZWNpcGV8ZW58MXx8fHwxNzc4NzAwMTMzfDA&ixlib=rb-4.1.0&q=80&w=1080";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function blankIngredient(): IngredientDraft {
  return { name: "", category: "pantry", quantity: "", cost: "" };
}

function getUploadErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Something went wrong saving the recipe. Please try again.";
  }

  if (error.message.includes("row-level security") || error.message.includes("permission denied")) {
    return "The shared recipe database is blocking uploads right now. Please check the Supabase insert policy.";
  }

  if (error.message.includes("Failed to fetch")) {
    return "Could not reach the shared recipe database. Please check your connection and try again.";
  }

  if (error.message.includes("Could not save recipe:")) {
    return `Could not save recipe. ${error.message.replace("Could not save recipe:", "").trim()}`;
  }

  return "Something went wrong saving the recipe. Please try again.";
}

export function Upload() {
  const { recipeDB, refreshRecipes } = useAppContext();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [difficulty, setDifficulty] = useState<Recipe["difficulty"]>("Medium");
  const [category, setCategory] = useState<Recipe["category"]>("dinner");
  const [tags, setTags] = useState("");
  const [steps, setSteps] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([blankIngredient()]);

  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedRecipeId, setUploadedRecipeId] = useState<string | null>(null);

  const totalCost = useMemo(() => {
    return ingredients.reduce((sum, ing) => {
      const n = parseFloat(ing.cost);
      return sum + (isNaN(n) ? 0 : n);
    }, 0);
  }, [ingredients]);

  const updateIngredient = (idx: number, patch: Partial<IngredientDraft>) => {
    setIngredients((prev) => prev.map((ing, i) => (i === idx ? { ...ing, ...patch } : ing)));
  };
  const addIngredient = () => setIngredients((prev) => [...prev, blankIngredient()]);
  const removeIngredient = (idx: number) =>
    setIngredients((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));

  const onPickImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Please choose an image under 2 MB so the recipe can be saved in your browser.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageDataUrl(typeof e.target?.result === "string" ? e.target.result : null);
    };
    reader.onerror = () => setError("Could not read that image file.");
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setName("");
    setDescription("");
    setPrepTime("");
    setDifficulty("Medium");
    setCategory("dinner");
    setTags("");
    setSteps("");
    setImageDataUrl(null);
    setIngredients([blankIngredient()]);
  };

  const handleUpload = async () => {
    setError(null);

    if (!name.trim()) {
      setError("Please give the recipe a name.");
      return;
    }

    const cleanedIngredients: Ingredient[] = ingredients
      .filter((ing) => ing.name.trim())
      .map((ing) => ({
        name: ing.name.trim(),
        category: ing.category,
        quantity: ing.quantity.trim() || "1",
        cost: parseFloat(ing.cost) || 0,
      }));

    if (cleanedIngredients.length === 0) {
      setError("Add at least one ingredient.");
      return;
    }

    const cleanedSteps = steps
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (cleanedSteps.length === 0) {
      setError("Add at least one cooking step.");
      return;
    }

    const summedCost = cleanedIngredients.reduce((sum, ing) => sum + ing.cost, 0);
    const costString = "$" + summedCost.toFixed(2);

    setIsSubmitting(true);
    try {
      const uploadedRecipe = await recipeDB.create({
        name: name.trim(),
        description: description.trim() || undefined,
        image: imageDataUrl || DEFAULT_IMAGE,
        cost: costString,
        prepTime: prepTime.trim() || "15 min",
        tags: tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        difficulty,
        category,
        servings: 1,
        ingredients: cleanedIngredients,
        steps: cleanedSteps,
        source: "user-upload",
        isPublic: true,
      });

      await refreshRecipes();

      setUploadedRecipeId(uploadedRecipe.id);
      setIsSuccess(true);
      reset();
      setTimeout(() => setIsSuccess(false), 4000);
    } catch (e) {
      setError(getUploadErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <Link
        to="/"
        aria-label="Go back to home"
        className="inline-flex items-center text-slate-500 hover:text-[#4E2A84] mb-6 font-medium"
      >
        <ArrowLeft size={16} className="mr-1" /> Back home
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Upload a Recipe</h1>
        <p className="text-slate-500">
          Add a recipe you already like, and ziplist will include it in your Browse Recipes and Spin Wheel options.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-100">
        {isSuccess && (
          <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-medium border border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} /> Recipe uploaded! It's now in Browse Recipes.
            </div>
            <button
              onClick={() => navigate(uploadedRecipeId ? `/plan?recipe=${encodeURIComponent(uploadedRecipeId)}` : "/plan")}
              aria-label="View uploaded recipe"
              className="text-sm font-semibold underline hover:no-underline"
            >
              View it
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-start justify-between gap-3 font-medium border border-red-200">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              aria-label="Dismiss upload error"
              className="text-red-700/70 hover:text-red-700"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onPickImage(file);
                e.target.value = "";
              }}
            />
            {imageDataUrl ? (
              <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-slate-200">
                <img src={imageDataUrl} alt="Recipe preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImageDataUrl(null)}
                  className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80"
                  aria-label="Remove image"
                  type="button"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Choose a recipe image to upload"
                className="w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 cursor-pointer transition-colors"
              >
                <ImageIcon size={32} className="mb-2" />
                <span className="text-sm font-medium">Click to upload an image</span>
                <span className="text-xs text-slate-400 mt-1">PNG or JPG, optional</span>
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Recipe Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grandma's Pasta"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#4E2A84]/20 focus:border-[#4E2A84]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Short Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. A creamy weeknight pasta"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#4E2A84]/20 focus:border-[#4E2A84]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Meal</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Recipe["category"])}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-slate-700 font-medium capitalize focus:outline-none focus:ring-2 focus:ring-[#4E2A84]/20 focus:border-[#4E2A84]"
              >
                {RECIPE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Recipe["difficulty"])}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#4E2A84]/20 focus:border-[#4E2A84]"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Prep Time</label>
              <input
                type="text"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="e.g. 20 min"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#4E2A84]/20 focus:border-[#4E2A84]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. vegetarian, quick, comfort food"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#4E2A84]/20 focus:border-[#4E2A84]"
            />
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
              <label className="block text-sm font-bold text-slate-700">Ingredients</label>
              <span className="text-sm text-slate-500">
                Estimated cost: <span className="font-bold text-[#4E2A84]">${totalCost.toFixed(2)}</span>
              </span>
            </div>
            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center bg-slate-50 border border-slate-200 rounded-xl p-2"
                >
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(idx, { name: e.target.value })}
                    placeholder="Ingredient"
                    className="col-span-12 sm:col-span-4 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E2A84]/20 focus:border-[#4E2A84]"
                  />
                  <input
                    type="text"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(idx, { quantity: e.target.value })}
                    placeholder="Qty (e.g. 1 cup)"
                    className="col-span-6 sm:col-span-3 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E2A84]/20 focus:border-[#4E2A84]"
                  />
                  <select
                    value={ing.category}
                    onChange={(e) =>
                      updateIngredient(idx, { category: e.target.value as Ingredient["category"] })
                    }
                    className="col-span-6 sm:col-span-2 bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-[#4E2A84]/20 focus:border-[#4E2A84]"
                  >
                    {INGREDIENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <div className="col-span-10 sm:col-span-2 relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.05"
                      value={ing.cost}
                      onChange={(e) => updateIngredient(idx, { cost: e.target.value })}
                      placeholder="0.00"
                      className="w-full min-w-0 bg-white border border-slate-200 rounded-lg pl-5 pr-2 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#4E2A84]/20 focus:border-[#4E2A84]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    disabled={ingredients.length === 1}
                    className="col-span-2 sm:col-span-1 flex justify-center items-center text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-400"
                    aria-label="Remove ingredient"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addIngredient}
              aria-label="Add another ingredient"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#4E2A84] hover:text-[#3d2168]"
            >
              <Plus size={16} /> Add ingredient
            </button>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Steps (one per line)</label>
            <textarea
              rows={5}
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder={"Preheat the oven to 400°F.\nChop the vegetables.\nRoast for 25 minutes."}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#4E2A84]/20 focus:border-[#4E2A84] resize-none"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={reset}
            aria-label="Reset recipe upload form"
            className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={isSubmitting}
            aria-label="Upload recipe"
            className="flex-1 bg-[#4E2A84] text-white py-3 rounded-xl font-bold hover:bg-[#3d2168] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
