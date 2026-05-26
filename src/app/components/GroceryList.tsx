import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Printer, Share, CheckCircle2, Circle, ListFilter, Search, Sparkles } from "lucide-react";
import { useAppContext } from "../context/AppContext";

type GroceryItem = {
  name: string;
  category: string;
  quantityStr: string[];
  totalCost: number;
};

const SAVED_LISTS_KEY = "ziplist.savedGroceryLists";
const ACTIVE_GROCERY_LIST_KEY = "ziplist.activeGroceryList";

const categoryNames: Record<string, string> = {
  produce: "Produce",
  protein: "Meat & Protein",
  grains: "Grains & Pasta",
  dairy: "Dairy & Eggs",
  pantry: "Pantry Staples",
  spices: "Spices",
  other: "Other",
};

export function GroceryList() {
  const { allRecipes, selectedMeals, setSelectedMeals, setWeeklyMeals } = useAppContext();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [highlightActions, setHighlightActions] = useState(false);

  const mealsToShop = allRecipes.filter(r => selectedMeals.has(r.id));
  const selectedMealSignature = useMemo(() => {
    return Array.from(selectedMeals).sort().join("|");
  }, [selectedMeals]);

  useEffect(() => {
    try {
      const savedList = JSON.parse(localStorage.getItem(ACTIVE_GROCERY_LIST_KEY) || "null");
      if (!savedList || !Array.isArray(savedList.mealIds) || !Array.isArray(savedList.checkedItems)) {
        setCheckedItems(new Set());
        return;
      }

      const savedMealSignature = [...savedList.mealIds].sort().join("|");
      setCheckedItems(savedMealSignature === selectedMealSignature ? new Set(savedList.checkedItems) : new Set());
    } catch {
      setCheckedItems(new Set());
    }
  }, [selectedMealSignature]);

  const { itemsByCategory, grandTotal } = useMemo(() => {
    const itemsMap = new Map<string, GroceryItem>();
    let total = 0;

    mealsToShop.forEach(meal => {
      meal.ingredients.forEach(ing => {
        const key = ing.name.toLowerCase();
        if (itemsMap.has(key)) {
          const existing = itemsMap.get(key)!;
          existing.quantityStr.push(ing.quantity);
          existing.totalCost += ing.cost;
        } else {
          itemsMap.set(key, {
            name: ing.name,
            category: ing.category,
            quantityStr: [ing.quantity],
            totalCost: ing.cost
          });
        }
        total += ing.cost;
      });
    });

    const grouped: Record<string, GroceryItem[]> = {};
    itemsMap.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    return { itemsByCategory: grouped, grandTotal: total };
  }, [mealsToShop]);

  const groceryListText = useMemo(() => {
    const lines = [
      "ziplist grocery list",
      "",
      `Meals: ${mealsToShop.map(meal => meal.name).join(", ")}`,
      "",
    ];

    Object.entries(itemsByCategory).forEach(([cat, items]) => {
      lines.push(categoryNames[cat] || cat);
      items.forEach(item => {
        lines.push(
          `- ${item.name}: ${item.quantityStr.join(" + ")} ($${item.totalCost.toFixed(2)})`
        );
      });
      lines.push("");
    });

    lines.push(`Estimated total: $${grandTotal.toFixed(2)}`);
    return lines.join("\n");
  }, [grandTotal, itemsByCategory, mealsToShop]);

  const showStatus = (message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), 3000);
  };

  const toggleCheck = (name: string) => {
    const next = new Set(checkedItems);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setCheckedItems(next);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "ziplist grocery list",
          text: groceryListText,
        });
        showStatus("Grocery list shared.");
        return;
      }

      await navigator.clipboard.writeText(groceryListText);
      showStatus("Grocery list copied to clipboard.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      showStatus("Could not share this list.");
    }
  };

  const handleSaveList = () => {
    const savedList = {
      id: Date.now().toString(),
      savedAt: new Date().toISOString(),
      mealIds: mealsToShop.map(meal => meal.id),
      mealNames: mealsToShop.map(meal => meal.name),
      itemsByCategory,
      grandTotal,
      checkedItems: Array.from(checkedItems),
      text: groceryListText,
    };

    try {
      const previousLists = JSON.parse(localStorage.getItem(SAVED_LISTS_KEY) || "[]");
      const savedLists = Array.isArray(previousLists) ? previousLists : [];
      localStorage.setItem(ACTIVE_GROCERY_LIST_KEY, JSON.stringify(savedList));
      localStorage.setItem(SAVED_LISTS_KEY, JSON.stringify([savedList, ...savedLists]));
      window.scrollTo({ top: 0, behavior: "smooth" });
      setHighlightActions(true);
      window.setTimeout(() => setHighlightActions(false), 3500);
      showStatus("Grocery list saved. Share it or print it from here.");
    } catch {
      showStatus("Could not save this list.");
    }
  };

  const handlePickWeek = () => {
    const weeklyRecipes = [...allRecipes]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(14, allRecipes.length));

    setWeeklyMeals(weeklyRecipes);
    setSelectedMeals(new Set(weeklyRecipes.map((recipe) => recipe.id)));
  };

  if (mealsToShop.length === 0) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center animate-in fade-in">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-10 shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-purple-50">
            <Sparkles className="text-[#4E2A84]" size={30} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Your grocery list is empty.</h2>
          <p className="mx-auto max-w-xl text-slate-500 mb-8">
            Start from a full week, browse one recipe at a time, or search by what is already in your kitchen.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={handlePickWeek}
              disabled={allRecipes.length === 0}
              className="flex flex-col items-center justify-center rounded-2xl bg-[#4E2A84] px-4 py-5 font-bold text-white transition-colors hover:bg-[#3d2168] disabled:opacity-50"
              aria-label="Pick 14 meals for this week"
            >
              <Sparkles size={22} className="mb-2" />
              Pick My Week
            </button>
            <Link
              to="/plan"
              aria-label="Browse recipes to build a grocery list"
              className="flex flex-col items-center justify-center rounded-2xl border border-[#4E2A84]/20 bg-purple-50 px-4 py-5 font-bold text-[#4E2A84] transition-colors hover:bg-purple-100"
            >
              <Search size={22} className="mb-2" />
              Browse Recipes
            </Link>
            <Link
              to="/ingredient-search"
              aria-label="Search ingredients to build a grocery list"
              className="flex flex-col items-center justify-center rounded-2xl border border-[#E4572E]/20 bg-[#FFF4ED] px-4 py-5 font-bold text-[#B83B1D] transition-colors hover:bg-[#FFE5D6]"
            >
              <ListFilter size={22} className="mb-2" />
              Search Ingredients
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            to="/plan"
            aria-label="Go back to meals"
            className="inline-flex items-center text-slate-500 hover:text-[#4E2A84] mb-2 text-sm font-medium"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to meals
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Your grocery list for the week</h1>
          <p className="text-slate-500 mt-1">Based on your {mealsToShop.length} selected meals.</p>
        </div>
        <div className="flex gap-3 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className={`p-3 rounded-full border shadow-sm transition-all ${
              highlightActions
                ? "bg-purple-50 text-[#4E2A84] border-[#4E2A84] ring-4 ring-purple-100 scale-110"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
            aria-label="Print grocery list"
            title="Print grocery list"
          >
            <Printer size={18} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className={`p-3 rounded-full border shadow-sm transition-all ${
              highlightActions
                ? "bg-purple-50 text-[#4E2A84] border-[#4E2A84] ring-4 ring-purple-100 scale-110"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
            aria-label="Share grocery list"
            title="Share grocery list"
          >
            <Share size={18} />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-4 rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm font-medium text-[#4E2A84] print:hidden">
          {statusMessage}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {Object.entries(itemsByCategory).map(([cat, items]) => (
          <div key={cat} className="border-b border-slate-100 last:border-0">
            <div className="bg-slate-50 px-6 py-3">
              <h3 className="font-bold text-slate-700 uppercase tracking-wider text-xs">{categoryNames[cat] || cat}</h3>
            </div>
            <ul className="divide-y divide-slate-50">
              {items.map(item => {
                const isChecked = checkedItems.has(item.name);
                return (
                  <li 
                    key={item.name} 
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors ${isChecked ? 'opacity-50' : ''}`}
                    onClick={() => toggleCheck(item.name)}
                  >
                    <div className="flex items-center gap-4">
                      {isChecked ? (
                        <CheckCircle2 className="text-[#4E2A84]" size={24} />
                      ) : (
                        <Circle className="text-slate-300" size={24} />
                      )}
                      <div>
                        <span className={`font-semibold text-lg ${isChecked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {item.name}
                        </span>
                        <div className="text-sm text-slate-500">
                          {item.quantityStr.join(' + ')}
                        </div>
                      </div>
                    </div>
                    <div className="font-medium text-slate-600 self-end sm:self-auto">
                      ${item.totalCost.toFixed(2)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        
        <div className="bg-purple-50 px-4 sm:px-6 py-6 flex items-center justify-between gap-4 border-t border-purple-100">
          <div>
            <h3 className="text-xl font-bold text-[#4E2A84]">Estimated Total</h3>
            <p className="text-sm text-purple-700/70">Prices may vary by store</p>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#4E2A84]">
            ${grandTotal.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 print:hidden">
        <Link
          to="/plan"
          aria-label="Go back to meal planning"
          className="bg-white text-slate-600 border border-slate-200 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors text-center"
        >
          Back to Meals
        </Link>
        <button
          type="button"
          onClick={handleSaveList}
          aria-label="Save this grocery list"
          className="bg-[#4E2A84] text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-[#3d2168] transition-colors"
        >
          Save List
        </button>
      </div>
    </div>
  );
}
