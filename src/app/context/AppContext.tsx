import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from "react";
import { Recipe } from "../types/Recipe";
import { RecipeDatabase } from "../database/RecipeDatabase";
import { ALL_SEED_RECIPES } from "../database/seedData";

// Backward compatibility export for existing components
export type { Recipe };

type AppContextType = {
  // Recipe database instance
  recipeDB: RecipeDatabase;

  // Backward compatibility: expose recipes as array
  allRecipes: Recipe[];
  setAllRecipes: (recipes: Recipe[]) => void;

  // Weekly meal plan state
  weeklyMeals: Recipe[];
  setWeeklyMeals: (recipes: Recipe[]) => void;
  clearWeeklyMeals: () => void;

  // Selected meals for grocery list
  selectedMeals: Set<string>;
  setSelectedMeals: React.Dispatch<React.SetStateAction<Set<string>>>;

  // Backward compatibility: addRecipe method
  addRecipe: (recipe: Recipe) => Promise<void>;

  // Force refresh (useful when database is updated)
  refreshRecipes: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Initialize database with seed data
  const recipeDB = useMemo(() => new RecipeDatabase(ALL_SEED_RECIPES), []);

  // State for backward compatibility
  const [allRecipes, setAllRecipes] = useState<Recipe[]>(ALL_SEED_RECIPES);
  const [weeklyMeals, setWeeklyMeals] = useState<Recipe[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<Set<string>>(new Set());

  // Refresh recipes from database
  const refreshRecipes = async () => {
    const recipes = await recipeDB.getAll();
    setAllRecipes(recipes);
  };

  useEffect(() => {
    refreshRecipes();
  }, []);

  // Backward compatibility: addRecipe method
  const addRecipe = async (recipe: Recipe) => {
    await recipeDB.create(recipe);
    await refreshRecipes();
  };

  const clearWeeklyMeals = () => {
    setWeeklyMeals([]);
  };

  return (
    <AppContext.Provider
      value={{
        recipeDB,
        allRecipes,
        setAllRecipes,
        weeklyMeals,
        setWeeklyMeals,
        clearWeeklyMeals,
        selectedMeals,
        setSelectedMeals,
        addRecipe,
        refreshRecipes,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
