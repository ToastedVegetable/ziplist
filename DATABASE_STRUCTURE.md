# Ziplist Recipe Database Architecture

## Overview

This document describes the data architecture for the ziplist meal planning application, including the Recipe data structure and RecipeDatabase interface.

## File Structure

```
src/app/
├── types/
│   └── Recipe.ts              # Recipe type definitions and interfaces
├── database/
│   ├── RecipeDatabase.ts      # Database interface class
│   ├── seedData.ts            # Initial 50 recipes for the app
│   ├── examples.ts            # Usage examples
│   └── README.md              # Detailed documentation
└── context/
    └── AppContext.tsx         # React context with database integration
```

## Core Components

### 1. Recipe Type (`src/app/types/Recipe.ts`)

The Recipe type contains all information needed to store a recipe as a database record:

```typescript
type Recipe = {
  // Identifiers
  id: string;

  // Basic info
  name: string;
  description?: string;
  image: string;

  // Cost & time
  cost: string;
  prepTime: string;
  cookTime?: string;
  totalTime?: string;

  // Classification
  tags: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  category: "breakfast" | "lunch" | "dinner" | "snack" | "dessert";
  cuisine?: string;

  // Nutrition
  servings?: number;
  calories?: number;

  // Recipe content
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
```

**Key Features:**
- **Timestamps**: `createdAt` and `updatedAt` track when recipes are created/modified
- **Source tracking**: Know if a recipe is user-uploaded, system-provided, or imported
- **Usage analytics**: Track how many times a recipe has been cooked
- **Flexible metadata**: Optional fields for calories, servings, ratings, etc.

### 2. RecipeDatabase Class (`src/app/database/RecipeDatabase.ts`)

A database interface class that manages all recipe operations. Currently uses in-memory array storage, but can easily be migrated to a real database.

**Available Methods:**

#### CRUD Operations
- `create(input: CreateRecipeInput): Promise<Recipe>` - Add new recipe
- `getById(id: string): Promise<Recipe | null>` - Fetch single recipe
- `getAll(): Promise<Recipe[]>` - Fetch all recipes
- `find(filter: RecipeFilter): Promise<Recipe[]>` - Search/filter recipes
- `update(input: UpdateRecipeInput): Promise<Recipe | null>` - Modify recipe
- `delete(id: string): Promise<boolean>` - Remove recipe

#### Utility Methods
- `getRandom(count: number): Promise<Recipe[]>` - Get random recipes for meal planning
- `markAsCooked(id: string): Promise<Recipe | null>` - Track recipe usage
- `getMostPopular(count: number): Promise<Recipe[]>` - Get frequently cooked recipes
- `getRecent(count: number): Promise<Recipe[]>` - Get recently added recipes
- `count(): Promise<number>` - Get total recipe count

#### Migration Helpers
- `export(): Promise<string>` - Export all data as JSON
- `import(jsonData: string): Promise<void>` - Import data from JSON
- `bulkImport(recipes: CreateRecipeInput[]): Promise<Recipe[]>` - Bulk add recipes

### 3. Seed Data (`src/app/database/seedData.ts`)

Contains 50 initial recipes with:
- First 5 recipes with detailed, realistic ingredient lists and cooking steps
- Remaining 45 recipes with basic placeholder data
- All recipes properly categorized (breakfast, lunch, dinner)
- Realistic cost estimates and prep times
- High-quality food images from Unsplash

### 4. Integration with AppContext

The RecipeDatabase is integrated into the existing AppContext, maintaining backward compatibility:

```typescript
const { recipeDB, allRecipes, addRecipe, refreshRecipes } = useAppContext();

// Old way (still works)
const recipes = allRecipes;

// New way (more powerful)
const breakfastRecipes = await recipeDB.find({ category: ["breakfast"] });
```

## Usage Examples

### Example 1: Add a User-Uploaded Recipe

```typescript
const { recipeDB, refreshRecipes } = useAppContext();

const newRecipe = await recipeDB.create({
  name: "My Custom Pasta",
  image: uploadedImageUrl,
  cost: "$5.00",
  prepTime: "30 min",
  tags: ["italian", "pasta"],
  difficulty: "Medium",
  category: "dinner",
  ingredients: [
    { name: "Pasta", category: "grains", quantity: "200g", cost: 2.0 }
  ],
  steps: ["Boil water", "Cook pasta", "Serve"],
  source: "user-upload",
  createdBy: currentUser.id
});

await refreshRecipes(); // Update UI
```

### Example 2: Generate Weekly Meal Plan

```typescript
const { recipeDB } = useAppContext();

// Get 7 random recipes for the week
const weeklyMeals = await recipeDB.getRandom(7);

// Or get balanced meals
const breakfasts = await recipeDB.find({ category: ["breakfast"] });
const dinners = await recipeDB.find({ category: ["dinner"] });
```

### Example 3: Search for Recipes

```typescript
const { recipeDB } = useAppContext();

// Find quick, cheap vegetarian meals
const results = await recipeDB.find({
  tags: ["vegetarian"],
  maxPrepTime: 15,
  maxCost: 5.0
});
```

### Example 4: Track Recipe Usage

```typescript
const { recipeDB } = useAppContext();

// User cooked a recipe
await recipeDB.markAsCooked("1");

// Later, get most popular recipes
const popular = await recipeDB.getMostPopular(10);
```

## Migration Path to Real Database

When you're ready to use a real database (Supabase, PostgreSQL, etc.):

### Step 1: Export Current Data
```typescript
const backup = await recipeDB.export();
// Save to file or send to server
```

### Step 2: Create Database Schema
```sql
CREATE TABLE recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT,
  cost TEXT,
  prep_time TEXT,
  tags TEXT[],
  difficulty TEXT,
  category TEXT,
  ingredients JSONB,
  steps TEXT[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  -- ... other fields
);
```

### Step 3: Implement API Layer
```typescript
class SupabaseRecipeDatabase {
  async create(input: CreateRecipeInput): Promise<Recipe> {
    const { data } = await supabase
      .from('recipes')
      .insert(input)
      .single();
    return data;
  }
  // ... implement other methods
}
```

### Step 4: Update AppContext
```typescript
// Just change this one line:
const recipeDB = useMemo(() => new SupabaseRecipeDatabase(), []);
```

**No other code changes needed!** Your components will continue working exactly as before.

## Advantages of This Architecture

1. **Type Safety**: Full TypeScript support with proper types
2. **Metadata Tracking**: Automatic timestamps, usage statistics
3. **Easy Migration**: Same interface works with any backend
4. **Backward Compatible**: Existing code continues to work
5. **Powerful Filtering**: Rich query capabilities
6. **Future-Proof**: Designed to scale from prototype to production

## Data Model Diagram

```
┌─────────────────────────────────────┐
│         Recipe                      │
├─────────────────────────────────────┤
│ id: string                          │
│ name: string                        │
│ image: string                       │
│ cost: string                        │
│ prepTime: string                    │
│ tags: string[]                      │
│ difficulty: "Easy"|"Medium"|"Hard"  │
│ category: breakfast|lunch|dinner    │
│ ingredients: Ingredient[]           │
│ steps: string[]                     │
│ createdAt: Date                     │
│ updatedAt: Date                     │
│ timesCooked?: number                │
│ ... more fields                     │
└─────────────────────────────────────┘
            │
            │ has many
            ▼
┌─────────────────────────────────────┐
│       Ingredient                    │
├─────────────────────────────────────┤
│ name: string                        │
│ category: protein|produce|grains... │
│ quantity: string                    │
│ cost: number                        │
│ optional?: boolean                  │
└─────────────────────────────────────┘
```

## Next Steps

1. **Add more recipes**: Use `recipeDB.create()` to add more variety
2. **Implement user uploads**: Connect the Upload form to the database
3. **Add search UI**: Create a search bar that uses `recipeDB.find()`
4. **Track analytics**: Use `markAsCooked()` and `getMostPopular()`
5. **Migrate to Supabase**: When ready, follow the migration steps above

For detailed examples and API documentation, see:
- `/src/app/database/README.md`
- `/src/app/database/examples.ts`
