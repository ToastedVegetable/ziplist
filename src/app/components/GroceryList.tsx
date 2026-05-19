import { useState, useMemo } from "react";
import { Link } from "react-router";
import { ArrowLeft, Printer, Share, CheckCircle2, Circle } from "lucide-react";
import { useAppContext } from "../context/AppContext";

type GroceryItem = {
  name: string;
  category: string;
  quantityStr: string[];
  totalCost: number;
};

export function GroceryList() {
  const { allRecipes, selectedMeals } = useAppContext();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const mealsToShop = allRecipes.filter(r => selectedMeals.has(r.id));

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

  const toggleCheck = (name: string) => {
    const next = new Set(checkedItems);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setCheckedItems(next);
  };

  if (mealsToShop.length === 0) {
    return (
      <div className="text-center py-20 animate-in fade-in">
        <h2 className="text-2xl font-bold text-slate-700 mb-4">Your grocery list is empty.</h2>
        <p className="text-slate-500 mb-8">Go back and select some meals to plan your list.</p>
        <Link to="/plan" className="bg-[#4E2A84] text-white px-6 py-3 rounded-full font-bold hover:bg-[#3d2168]">Plan Meals</Link>
      </div>
    );
  }

  const categoryNames: Record<string, string> = {
    produce: "Produce",
    protein: "Meat & Protein",
    grains: "Grains & Pasta",
    dairy: "Dairy & Eggs",
    pantry: "Pantry Staples",
    frozen: "Frozen",
    snacks: "Snacks"
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/plan" className="inline-flex items-center text-slate-500 hover:text-[#4E2A84] mb-2 text-sm font-medium">
            <ArrowLeft size={16} className="mr-1" /> Back to meals
          </Link>
          <h1 className="text-3xl font-bold text-slate-800">Your grocery list for the week</h1>
          <p className="text-slate-500 mt-1">Based on your {mealsToShop.length} selected meals.</p>
        </div>
        <div className="flex gap-3">
          <button className="p-3 bg-white text-slate-600 rounded-full border border-slate-200 hover:bg-slate-50 shadow-sm transition-colors">
            <Printer size={18} />
          </button>
          <button className="p-3 bg-white text-slate-600 rounded-full border border-slate-200 hover:bg-slate-50 shadow-sm transition-colors">
            <Share size={18} />
          </button>
        </div>
      </div>

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
                    className={`flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors ${isChecked ? 'opacity-50' : ''}`}
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
                    <div className="font-medium text-slate-600">
                      ${item.totalCost.toFixed(2)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        
        <div className="bg-purple-50 px-6 py-6 flex items-center justify-between border-t border-purple-100">
          <div>
            <h3 className="text-xl font-bold text-[#4E2A84]">Estimated Total</h3>
            <p className="text-sm text-purple-700/70">Prices may vary by store</p>
          </div>
          <div className="text-3xl font-extrabold text-[#4E2A84]">
            ${grandTotal.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-4">
        <Link to="/plan" className="bg-white text-slate-600 border border-slate-200 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors">
          Swap Meal
        </Link>
        <button className="bg-[#4E2A84] text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-[#3d2168] transition-colors">
          Save List
        </button>
      </div>
    </div>
  );
}
