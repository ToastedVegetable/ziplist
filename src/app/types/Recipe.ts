/**
 * Core Recipe type with full metadata for database storage
 */
export type Recipe = {
  // Core identifiers
  id: string;

  // Basic information
  name: string;
  description?: string;
  image: string;

  // Cost and time
  cost: string;
  prepTime: string;
  cookTime?: string;
  totalTime?: string;

  // Classification
  tags: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  category: "breakfast" | "lunch" | "dinner" | "snack" | "dessert";
  cuisine?: string;

  // Nutritional info (optional)
  servings?: number;
  calories?: number;

  // Recipe details
  ingredients: Ingredient[];
  steps: string[];

  // Metadata for database tracking
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  source?: "user-upload" | "system" | "imported";
  isPublic?: boolean;

  // Rating and usage
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

/**
 * Type for creating a new recipe (without auto-generated fields)
 */
export type CreateRecipeInput = Omit<Recipe, "id" | "createdAt" | "updatedAt" | "timesCooked" | "lastCookedAt"> & {
  id?: string;
};

/**
 * Type for updating a recipe (all fields optional except id)
 */
export type UpdateRecipeInput = Partial<Recipe> & {
  id: string;
};

/**
 * Filter options for querying recipes
 */
export type RecipeFilter = {
  tags?: string[];
  difficulty?: Recipe["difficulty"][];
  category?: Recipe["category"][];
  maxCost?: number;
  maxPrepTime?: number;
  searchTerm?: string;
};
