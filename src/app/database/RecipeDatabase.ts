import { Recipe, CreateRecipeInput, UpdateRecipeInput, RecipeFilter } from "../types/Recipe";

const STORAGE_KEY = "ziplist.userRecipes";

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

/**
 * RecipeDatabase - Interface between app and recipe storage
 *
 * Uses seed recipes plus browser localStorage for user-uploaded recipes.
 * Can be easily migrated to a real database (Supabase, PostgreSQL, etc.)
 * by implementing the same interface methods with API calls.
 */
export class RecipeDatabase {
  private recipes: Recipe[];
  private nextId: number;

  constructor(initialRecipes: Recipe[] = []) {
    const storedRecipes = this.loadStoredRecipes();
    const recipesById = new Map<string, Recipe>();

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
    if (!storageAvailable()) {
      return;
    }

    const userRecipes = this.recipes.filter(recipe => recipe.source !== "system");

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(userRecipes));
    } catch (error) {
      console.warn("Could not save user recipes", error);
    }
  }

  /**
   * CREATE - Add a new recipe
   */
  async create(input: CreateRecipeInput): Promise<Recipe> {
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

  /**
   * READ - Get a single recipe by ID
   */
  async getById(id: string): Promise<Recipe | null> {
    return this.recipes.find(r => r.id === id) || null;
  }

  /**
   * READ - Get all recipes
   */
  async getAll(): Promise<Recipe[]> {
    return [...this.recipes];
  }

  /**
   * READ - Get recipes with filtering
   */
  async find(filter: RecipeFilter): Promise<Recipe[]> {
    let results = [...this.recipes];

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

  /**
   * UPDATE - Update an existing recipe
   */
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

  /**
   * DELETE - Remove a recipe
   */
  async delete(id: string): Promise<boolean> {
    const index = this.recipes.findIndex(r => r.id === id);

    if (index === -1) {
      return false;
    }

    this.recipes.splice(index, 1);
    this.persistUserRecipes();
    return true;
  }

  /**
   * UTILITY - Get random recipes
   */
  async getRandom(count: number): Promise<Recipe[]> {
    const shuffled = [...this.recipes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * UTILITY - Record that a recipe was cooked
   */
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

  /**
   * UTILITY - Get most popular recipes
   */
  async getMostPopular(count: number): Promise<Recipe[]> {
    const sorted = [...this.recipes].sort((a, b) =>
      (b.timesCooked || 0) - (a.timesCooked || 0)
    );
    return sorted.slice(0, count);
  }

  /**
   * UTILITY - Get recently added recipes
   */
  async getRecent(count: number): Promise<Recipe[]> {
    const sorted = [...this.recipes].sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );
    return sorted.slice(0, count);
  }

  /**
   * UTILITY - Get total count
   */
  async count(): Promise<number> {
    return this.recipes.length;
  }

  /**
   * UTILITY - Clear all recipes (use with caution)
   */
  async clear(): Promise<void> {
    this.recipes = [];
    this.nextId = 1;
    this.persistUserRecipes();
  }

  /**
   * UTILITY - Bulk import recipes
   */
  async bulkImport(recipes: CreateRecipeInput[]): Promise<Recipe[]> {
    const created: Recipe[] = [];

    for (const input of recipes) {
      const recipe = await this.create(input);
      created.push(recipe);
    }

    return created;
  }

  /**
   * MIGRATION HELPER - Export all data as JSON
   * Useful for backing up or migrating to a real database
   */
  async export(): Promise<string> {
    return JSON.stringify(this.recipes, null, 2);
  }

  /**
   * MIGRATION HELPER - Import data from JSON
   * Useful for restoring from backup or seeding initial data
   */
  async import(jsonData: string): Promise<void> {
    this.recipes = parseStoredRecipes(jsonData);

    this.nextId = this.recipes.length > 0
      ? Math.max(...this.recipes.map(r => parseInt(r.id) || 0)) + 1
      : 1;
    this.persistUserRecipes();
  }
}
