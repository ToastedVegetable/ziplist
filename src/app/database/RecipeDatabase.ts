import { Recipe, CreateRecipeInput, UpdateRecipeInput, RecipeFilter } from "../types/Recipe";

const STORAGE_KEY = "ziplist.userRecipes";
const env = (import.meta as any).env || {};
const SUPABASE_URL = env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

type RecipeRow = {
  id: string;
  name: string;
  description?: string | null;
  image: string;
  cost: string;
  prep_time: string;
  cook_time?: string | null;
  total_time?: string | null;
  tags: string[];
  difficulty: string;
  category: string;
  cuisine?: string | null;
  servings?: number | null;
  calories?: number | null;
  ingredients: any[];
  steps: string[];
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  source?: string | null;
  is_public?: boolean | null;
  rating?: number | null;
  times_cooked?: number | null;
  last_cooked_at?: string | null;
};

function storageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function parseStoredRecipes(jsonData: string): Recipe[] {
  const imported = JSON.parse(jsonData);

  if (!Array.isArray(imported)) {
    return [];
  }

  return imported.map((r: any) => ({
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
    lastCookedAt: r.lastCookedAt ? new Date(r.lastCookedAt) : undefined,
  }));
}

function isSupabaseEnabled(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

function supabaseHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const key = SUPABASE_KEY || "";

  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extraHeaders,
  };
}

function isRecipeDifficulty(value: string): value is Recipe["difficulty"] {
  return value === "Easy" || value === "Medium" || value === "Hard";
}

function isRecipeCategory(value: string): value is Recipe["category"] {
  return value === "breakfast" || value === "lunch" || value === "dinner" || value === "snack" || value === "dessert";
}

function rowToRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    image: row.image,
    cost: row.cost,
    prepTime: row.prep_time,
    cookTime: row.cook_time || undefined,
    totalTime: row.total_time || undefined,
    tags: row.tags || [],
    difficulty: isRecipeDifficulty(row.difficulty) ? row.difficulty : "Medium",
    category: isRecipeCategory(row.category) ? row.category : "dinner",
    cuisine: row.cuisine || undefined,
    servings: row.servings || undefined,
    calories: row.calories || undefined,
    ingredients: row.ingredients || [],
    steps: row.steps || [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by || undefined,
    source: row.source === "system" || row.source === "imported" ? row.source : "user-upload",
    isPublic: row.is_public ?? true,
    rating: row.rating || undefined,
    timesCooked: row.times_cooked || 0,
    lastCookedAt: row.last_cooked_at ? new Date(row.last_cooked_at) : undefined,
  };
}

function recipeToRow(input: CreateRecipeInput | Recipe): Omit<RecipeRow, "id" | "created_at" | "updated_at"> {
  return {
    name: input.name,
    description: input.description || null,
    image: input.image,
    cost: input.cost,
    prep_time: input.prepTime,
    cook_time: input.cookTime || null,
    total_time: input.totalTime || null,
    tags: input.tags,
    difficulty: input.difficulty,
    category: input.category,
    cuisine: input.cuisine || null,
    servings: input.servings || null,
    calories: input.calories || null,
    ingredients: input.ingredients,
    steps: input.steps,
    created_by: input.createdBy || null,
    source: input.source || "user-upload",
    is_public: input.isPublic ?? true,
    rating: input.rating || null,
    times_cooked: input.timesCooked || 0,
    last_cooked_at: input.lastCookedAt ? input.lastCookedAt.toISOString() : null,
  };
}

export class RecipeDatabase {
  private recipes: Recipe[];
  private nextId: number;

  constructor(initialRecipes: Recipe[] = []) {
    const storedRecipes = isSupabaseEnabled() ? [] : this.loadStoredRecipes();
    const recipesById = new Map<string, Recipe>();

    if (isSupabaseEnabled()) {
      this.clearStoredUserRecipes();
    }

    storedRecipes.forEach(recipe => recipesById.set(recipe.id, recipe));
    initialRecipes.forEach(recipe => {
      if (!recipesById.has(recipe.id)) {
        recipesById.set(recipe.id, recipe);
      }
    });

    this.recipes = [...recipesById.values()];
    this.nextId = this.recipes.length > 0
      ? Math.max(...this.recipes.map(r => parseInt(r.id) || 0)) + 1
      : 1;
  }

  private loadStoredRecipes(): Recipe[] {
    if (!storageAvailable()) {
      return [];
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return [];
      }

      return parseStoredRecipes(stored);
    } catch (error) {
      console.warn("Could not load saved recipes", error);
      return [];
    }
  }

  private persistUserRecipes(): void {
    if (!storageAvailable() || isSupabaseEnabled()) {
      return;
    }

    const userRecipes = this.recipes.filter(recipe => recipe.source !== "system");

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(userRecipes));
    } catch (error) {
      console.warn("Could not save user recipes", error);
    }
  }

  private clearStoredUserRecipes(): void {
    if (!storageAvailable()) {
      return;
    }

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Could not clear saved local recipes", error);
    }
  }

  private mergeRemoteRecipes(remoteRecipes: Recipe[]): Recipe[] {
    const recipesById = new Map<string, Recipe>();

    remoteRecipes.forEach(recipe => recipesById.set(recipe.id, recipe));
    this.recipes.filter(recipe => recipe.source === "system").forEach(recipe => {
      if (!recipesById.has(recipe.id)) {
        recipesById.set(recipe.id, recipe);
      }
    });

    this.recipes = [...recipesById.values()];
    return [...this.recipes];
  }

  private async fetchRemoteRecipes(): Promise<Recipe[]> {
    if (!isSupabaseEnabled()) {
      return [];
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/recipes?select=*&order=created_at.desc`, {
      headers: supabaseHeaders(),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Could not fetch recipes: ${response.status} ${message}`);
    }

    const rows = await response.json() as RecipeRow[];
    return rows.map(rowToRecipe);
  }

  private async createRemoteRecipe(input: CreateRecipeInput): Promise<Recipe> {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/recipes`, {
      method: "POST",
      headers: supabaseHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify(recipeToRow(input)),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Could not save recipe: ${response.status} ${message}`);
    }

    const rows = await response.json() as RecipeRow[];
    return rowToRecipe(rows[0]);
  }

  async create(input: CreateRecipeInput): Promise<Recipe> {
    if (isSupabaseEnabled()) {
      const remoteRecipe = await this.createRemoteRecipe(input);
      this.recipes.unshift(remoteRecipe);
      return remoteRecipe;
    }

    const now = new Date();
    const recipe: Recipe = {
      ...input,
      id: input.id || this.nextId.toString(),
      createdAt: now,
      updatedAt: now,
      timesCooked: 0,
      source: input.source || "user-upload",
      isPublic: input.isPublic ?? true,
    };

    this.recipes.unshift(recipe);
    this.nextId++;
    this.persistUserRecipes();

    return recipe;
  }

  async getById(id: string): Promise<Recipe | null> {
    const recipes = await this.getAll();
    return recipes.find(r => r.id === id) || null;
  }

  async getAll(): Promise<Recipe[]> {
    if (isSupabaseEnabled()) {
      try {
        const remoteRecipes = await this.fetchRemoteRecipes();
        return this.mergeRemoteRecipes(remoteRecipes);
      } catch (error) {
        console.warn("Could not fetch shared recipes", error);
      }
    }

    return [...this.recipes];
  }

  async find(filter: RecipeFilter): Promise<Recipe[]> {
    let results = await this.getAll();

    if (filter.tags && filter.tags.length > 0) {
      results = results.filter(r =>
        filter.tags!.some(tag => r.tags.includes(tag))
      );
    }

    if (filter.difficulty && filter.difficulty.length > 0) {
      results = results.filter(r =>
        filter.difficulty!.includes(r.difficulty)
      );
    }

    if (filter.category && filter.category.length > 0) {
      results = results.filter(r =>
        filter.category!.includes(r.category)
      );
    }

    if (filter.maxCost !== undefined) {
      results = results.filter(r => {
        const cost = parseFloat(r.cost.replace('$', ''));
        return cost <= filter.maxCost!;
      });
    }

    if (filter.maxPrepTime !== undefined) {
      results = results.filter(r => {
        const time = parseInt(r.prepTime);
        return time <= filter.maxPrepTime!;
      });
    }

    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      results = results.filter(r =>
        r.name.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term) ||
        r.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    return results;
  }

  async update(input: UpdateRecipeInput): Promise<Recipe | null> {
    const index = this.recipes.findIndex(r => r.id === input.id);

    if (index === -1) {
      return null;
    }

    const updated: Recipe = {
      ...this.recipes[index],
      ...input,
      updatedAt: new Date(),
    };

    this.recipes[index] = updated;
    this.persistUserRecipes();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.recipes.findIndex(r => r.id === id);

    if (index === -1) {
      return false;
    }

    this.recipes.splice(index, 1);
    this.persistUserRecipes();
    return true;
  }

  async getRandom(count: number): Promise<Recipe[]> {
    const recipes = await this.getAll();
    const shuffled = [...recipes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  async markAsCooked(id: string): Promise<Recipe | null> {
    const recipe = this.recipes.find(r => r.id === id);

    if (!recipe) {
      return null;
    }

    recipe.timesCooked = (recipe.timesCooked || 0) + 1;
    recipe.lastCookedAt = new Date();
    recipe.updatedAt = new Date();
    this.persistUserRecipes();

    return recipe;
  }

  async getMostPopular(count: number): Promise<Recipe[]> {
    const recipes = await this.getAll();
    const sorted = [...recipes].sort((a, b) =>
      (b.timesCooked || 0) - (a.timesCooked || 0)
    );
    return sorted.slice(0, count);
  }

  async getRecent(count: number): Promise<Recipe[]> {
    const recipes = await this.getAll();
    const sorted = [...recipes].sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );
    return sorted.slice(0, count);
  }

  async count(): Promise<number> {
    const recipes = await this.getAll();
    return recipes.length;
  }

  async clear(): Promise<void> {
    this.recipes = [];
    this.nextId = 1;
    this.persistUserRecipes();
  }

  async bulkImport(recipes: CreateRecipeInput[]): Promise<Recipe[]> {
    const created: Recipe[] = [];

    for (const input of recipes) {
      const recipe = await this.create(input);
      created.push(recipe);
    }

    return created;
  }

  async export(): Promise<string> {
    return JSON.stringify(this.recipes, null, 2);
  }

  async import(jsonData: string): Promise<void> {
    this.recipes = parseStoredRecipes(jsonData);

    this.nextId = this.recipes.length > 0
      ? Math.max(...this.recipes.map(r => parseInt(r.id) || 0)) + 1
      : 1;
    this.persistUserRecipes();
  }
}
