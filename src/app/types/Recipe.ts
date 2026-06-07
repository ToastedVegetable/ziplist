export type Recipe = {
  id: string;
  name: string;
  description?: string;
  image: string;
  cost: string;
  prepTime: string;
  cookTime?: string;
  totalTime?: string;
  tags: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  category: "breakfast" | "lunch" | "dinner" | "snack" | "dessert";
  cuisine?: string;
  servings?: number;
  calories?: number;
  ingredients: Ingredient[];
  steps: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  source?: "user-upload" | "system" | "imported";
  isPublic?: boolean;
  rating?: number;
  timesCooked?: number;
  lastCookedAt?: Date;
};

export type Ingredient = {
  name: string;
  category: "protein" | "produce" | "grains" | "dairy" | "pantry" | "spices" | "other";
  quantity: string;
  cost: number;
  optional?: boolean;
};

export type CreateRecipeInput = Omit<Recipe, "id" | "createdAt" | "updatedAt" | "timesCooked" | "lastCookedAt"> & {
  id?: string;
};

export type UpdateRecipeInput = Partial<Recipe> & {
  id: string;
};

export type RecipeFilter = {
  tags?: string[];
  difficulty?: Recipe["difficulty"][];
  category?: Recipe["category"][];
  maxCost?: number;
  maxPrepTime?: number;
  searchTerm?: string;
};
