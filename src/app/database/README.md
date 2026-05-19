# Recipe Database Documentation

This directory contains the core data structures and database interface for the ziplist meal planning application.

## Files

- **Recipe.ts** - TypeScript types and interfaces for Recipe data
- **RecipeDatabase.ts** - Database interface class for managing recipes
- **seedData.ts** - Initial recipe data (50 recipes)
- **examples.ts** - Usage examples (see below)

## Quick Start

### Using the RecipeDatabase from Context

The easiest way to interact with recipes is through the AppContext:

```tsx
import { useAppContext } from "../context/AppContext";

function MyComponent() {
  const { recipeDB, allRecipes, refreshRecipes } = useAppContext();

  // Get all recipes (already available in allRecipes)
  console.log(allRecipes);

  // Add a new recipe
  const handleAddRecipe = async () => {
    const newRecipe = await recipeDB.create({
      name: "My Custom Recipe",
      image: "https://example.com/image.jpg",
      cost: "$5.00",
      prepTime: "30 min",
      tags: ["dinner", "healthy"],
      difficulty: "Medium",
      category: "dinner",
      ingredients: [
        { name: "Chicken", category: "protein", quantity: "1 lb", cost: 5.0 }
      ],
      steps: ["Cook the chicken", "Serve hot"]
    });

    // Refresh the UI
    await refreshRecipes();
  };
}
```

### Direct Database Operations

You can also use the RecipeDatabase directly:

```tsx
import { RecipeDatabase } from "../database/RecipeDatabase";
import { ALL_SEED_RECIPES } from "../database/seedData";

// Create a new database instance
const db = new RecipeDatabase(ALL_SEED_RECIPES);

// CREATE - Add a new recipe
const newRecipe = await db.create({
  name: "Spaghetti Carbonara",
  image: "https://example.com/carbonara.jpg",
  cost: "$4.50",
  prepTime: "25 min",
  tags: ["italian", "pasta", "dinner"],
  difficulty: "Medium",
  category: "dinner",
  servings: 2,
  calories: 650,
  ingredients: [
    { name: "Spaghetti", category: "grains", quantity: "200g", cost: 1.0 },
    { name: "Eggs", category: "protein", quantity: "2", cost: 1.0 },
    { name: "Bacon", category: "protein", quantity: "100g", cost: 2.0 },
    { name: "Parmesan", category: "dairy", quantity: "50g", cost: 0.5 }
  ],
  steps: [
    "Boil spaghetti according to package instructions",
    "Fry bacon until crispy",
    "Mix eggs and parmesan",
    "Combine hot pasta with egg mixture",
    "Add bacon and serve"
  ]
});

// READ - Get a recipe by ID
const recipe = await db.getById("1");

// READ - Get all recipes
const allRecipes = await db.getAll();

// READ - Search/filter recipes
const vegetarianRecipes = await db.find({
  tags: ["vegetarian"]
});

const quickCheapMeals = await db.find({
  maxPrepTime: 15,
  maxCost: 5.0
});

const breakfastIdeas = await db.find({
  category: ["breakfast"],
  difficulty: ["Easy"]
});

// UPDATE - Modify a recipe
const updated = await db.update({
  id: "1",
  cost: "$5.00",
  rating: 4.5
});

// DELETE - Remove a recipe
const deleted = await db.delete("1");

// UTILITY - Get random recipes for meal planning
const randomMeals = await db.getRandom(7);

// UTILITY - Mark a recipe as cooked (tracks usage)
const cookedRecipe = await db.markAsCooked("1");

// UTILITY - Get most popular recipes
const popular = await db.getMostPopular(10);

// UTILITY - Get recently added recipes
const recent = await db.getRecent(5);

// UTILITY - Get database statistics
const totalRecipes = await db.count();
```

## Recipe Type Structure

```typescript
type Recipe = {
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

  // Nutritional info
  servings?: number;
  calories?: number;

  // Recipe details
  ingredients: Ingredient[];
  steps: string[];

  // Metadata (auto-generated)
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  source?: "user-upload" | "system" | "imported";
  isPublic?: boolean;

  // Usage tracking
  rating?: number;
  timesCooked?: number;
  lastCookedAt?: Date;
};

type Ingredient = {
  name: string;
  category: "protein" | "produce" | "grains" | "dairy" | "pantry" | "spices" | "other";
  quantity: string;
  cost: number;
  optional?: boolean;
};
```

## Migration to Real Database

When you're ready to migrate to a real database (like Supabase, PostgreSQL, etc.):

1. **Export current data:**
```tsx
const jsonBackup = await recipeDB.export();
// Save this to a file or database
```

2. **Create new database tables** matching the Recipe schema

3. **Implement API layer** with the same interface:
```tsx
class SupabaseRecipeDatabase {
  async create(input: CreateRecipeInput): Promise<Recipe> {
    // Call Supabase API
  }

  async getById(id: string): Promise<Recipe | null> {
    // Call Supabase API
  }

  // ... implement all other methods
}
```

4. **Update AppContext** to use the new implementation:
```tsx
const recipeDB = useMemo(() => new SupabaseRecipeDatabase(), []);
```

The rest of your application code won't need to change!

## Common Patterns

### Meal Plan Generation
```tsx
const db = useAppContext().recipeDB;

// Generate a balanced week of meals
const breakfasts = await db.find({ category: ["breakfast"] });
const lunches = await db.find({ category: ["lunch"] });
const dinners = await db.find({ category: ["dinner"] });

const randomBreakfasts = breakfasts.sort(() => 0.5 - Math.random()).slice(0, 7);
const randomLunches = lunches.sort(() => 0.5 - Math.random()).slice(0, 7);
const randomDinners = dinners.sort(() => 0.5 - Math.random()).slice(0, 7);
```

### Grocery List Generation
```tsx
const selectedRecipes = await Promise.all(
  selectedMealIds.map(id => db.getById(id))
);

const groceryList = selectedRecipes
  .filter(r => r !== null)
  .flatMap(r => r.ingredients);
```

### User Recipe Upload
```tsx
const uploadedRecipe = await db.create({
  name: formData.name,
  image: uploadedImageUrl,
  cost: formData.cost,
  prepTime: formData.prepTime,
  tags: formData.tags,
  difficulty: formData.difficulty,
  category: formData.category,
  ingredients: formData.ingredients,
  steps: formData.steps,
  source: "user-upload",
  createdBy: currentUser.id
});
```
