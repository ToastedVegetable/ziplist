/**
 * RecipeDatabase Usage Examples
 *
 * This file demonstrates how to use the RecipeDatabase class
 * in various scenarios throughout the application.
 */

import { RecipeDatabase } from "./RecipeDatabase";
import { Recipe, CreateRecipeInput } from "../types/Recipe";
import { ALL_SEED_RECIPES } from "./seedData";

// ========================================
// EXAMPLE 1: Basic CRUD Operations
// ========================================

async function exampleBasicCRUD() {
  const db = new RecipeDatabase(ALL_SEED_RECIPES);

  // CREATE - Add a new recipe
  const newRecipe: CreateRecipeInput = {
    name: "Mediterranean Quinoa Bowl",
    image: "https://example.com/quinoa-bowl.jpg",
    cost: "$5.50",
    prepTime: "20 min",
    tags: ["healthy", "vegetarian", "mediterranean"],
    difficulty: "Easy",
    category: "lunch",
    servings: 2,
    calories: 420,
    ingredients: [
      { name: "Quinoa", category: "grains", quantity: "1 cup", cost: 2.0 },
      { name: "Cucumber", category: "produce", quantity: "1", cost: 1.0 },
      { name: "Cherry tomatoes", category: "produce", quantity: "1 cup", cost: 1.5 },
      { name: "Feta cheese", category: "dairy", quantity: "1/4 cup", cost: 1.0 }
    ],
    steps: [
      "Cook quinoa according to package instructions",
      "Dice cucumber and halve cherry tomatoes",
      "Mix quinoa with vegetables",
      "Top with crumbled feta cheese",
      "Drizzle with olive oil and lemon juice"
    ]
  };

  const created = await db.create(newRecipe);
  console.log("Created recipe:", created.id, created.name);

  // READ - Get recipe by ID
  const retrieved = await db.getById(created.id);
  console.log("Retrieved recipe:", retrieved?.name);

  // UPDATE - Modify the recipe
  const updated = await db.update({
    id: created.id,
    cost: "$6.00",
    rating: 4.5
  });
  console.log("Updated recipe cost:", updated?.cost);

  // DELETE - Remove the recipe
  const deleted = await db.delete(created.id);
  console.log("Recipe deleted:", deleted);
}

// ========================================
// EXAMPLE 2: Filtering and Searching
// ========================================

async function exampleSearching() {
  const db = new RecipeDatabase(ALL_SEED_RECIPES);

  // Find all vegetarian recipes
  const vegetarianMeals = await db.find({
    tags: ["vegetarian"]
  });
  console.log(`Found ${vegetarianMeals.length} vegetarian recipes`);

  // Find quick, cheap breakfast options
  const quickBreakfasts = await db.find({
    category: ["breakfast"],
    maxPrepTime: 10,
    maxCost: 3.0
  });
  console.log("Quick breakfasts:", quickBreakfasts.map(r => r.name));

  // Search for recipes with "chicken" in the name
  const chickenRecipes = await db.find({
    searchTerm: "chicken"
  });
  console.log("Chicken recipes:", chickenRecipes.map(r => r.name));

  // Find easy dinner recipes
  const easyDinners = await db.find({
    category: ["dinner"],
    difficulty: ["Easy"]
  });
  console.log(`Found ${easyDinners.length} easy dinner recipes`);
}

// ========================================
// EXAMPLE 3: Meal Plan Generation
// ========================================

async function exampleMealPlanning() {
  const db = new RecipeDatabase(ALL_SEED_RECIPES);

  // Generate a week of meals (7 random recipes)
  const weeklyMeals = await db.getRandom(7);
  console.log("This week's meal plan:");
  weeklyMeals.forEach((meal, index) => {
    console.log(`Day ${index + 1}: ${meal.name}`);
  });

  // Generate a balanced week (2 breakfasts, 3 lunches, 2 dinners)
  const breakfasts = await db.find({ category: ["breakfast"] });
  const lunches = await db.find({ category: ["lunch"] });
  const dinners = await db.find({ category: ["dinner"] });

  const selectedBreakfasts = breakfasts.slice(0, 2);
  const selectedLunches = lunches.slice(0, 3);
  const selectedDinners = dinners.slice(0, 2);

  const balancedPlan = [...selectedBreakfasts, ...selectedLunches, ...selectedDinners];
  console.log("Balanced meal plan:", balancedPlan.map(r => r.name));
}

// ========================================
// EXAMPLE 4: Grocery List Generation
// ========================================

async function exampleGroceryList() {
  const db = new RecipeDatabase(ALL_SEED_RECIPES);

  // Get selected recipes for the week
  const selectedIds = ["1", "2", "3", "4", "5"];
  const recipes = (await Promise.all(
    selectedIds.map(id => db.getById(id))
  )).filter((r): r is Recipe => r !== null);

  // Aggregate all ingredients
  const allIngredients = recipes.flatMap(r => r.ingredients);

  // Group by category
  const groupedByCategory = allIngredients.reduce((acc, ing) => {
    if (!acc[ing.category]) {
      acc[ing.category] = [];
    }
    acc[ing.category].push(ing);
    return acc;
  }, {} as Record<string, typeof allIngredients>);

  // Calculate total cost
  const totalCost = allIngredients.reduce((sum, ing) => sum + ing.cost, 0);

  console.log("Grocery List:");
  Object.entries(groupedByCategory).forEach(([category, items]) => {
    console.log(`\n${category.toUpperCase()}:`);
    items.forEach(item => {
      console.log(`  - ${item.name} (${item.quantity}) - $${item.cost}`);
    });
  });
  console.log(`\nTotal estimated cost: $${totalCost.toFixed(2)}`);
}

// ========================================
// EXAMPLE 5: Usage Tracking
// ========================================

async function exampleUsageTracking() {
  const db = new RecipeDatabase(ALL_SEED_RECIPES);

  // User cooks a recipe
  const cookedRecipe = await db.markAsCooked("1");
  console.log(`${cookedRecipe?.name} has been cooked ${cookedRecipe?.timesCooked} times`);

  // Mark as cooked again
  await db.markAsCooked("1");
  await db.markAsCooked("1");

  // Get most popular recipes
  const popular = await db.getMostPopular(5);
  console.log("\nMost popular recipes:");
  popular.forEach((recipe, index) => {
    console.log(`${index + 1}. ${recipe.name} - cooked ${recipe.timesCooked} times`);
  });
}

// ========================================
// EXAMPLE 6: Bulk Operations
// ========================================

async function exampleBulkOperations() {
  const db = new RecipeDatabase();

  // Bulk import recipes
  const recipesToImport: CreateRecipeInput[] = [
    {
      name: "Recipe 1",
      image: "https://example.com/1.jpg",
      cost: "$3.00",
      prepTime: "15 min",
      tags: ["quick"],
      difficulty: "Easy",
      category: "lunch",
      ingredients: [],
      steps: []
    },
    {
      name: "Recipe 2",
      image: "https://example.com/2.jpg",
      cost: "$4.00",
      prepTime: "20 min",
      tags: ["healthy"],
      difficulty: "Medium",
      category: "dinner",
      ingredients: [],
      steps: []
    }
  ];

  const imported = await db.bulkImport(recipesToImport);
  console.log(`Imported ${imported.length} recipes`);

  // Get total count
  const count = await db.count();
  console.log(`Database now contains ${count} recipes`);
}

// ========================================
// EXAMPLE 7: Export/Import for Migration
// ========================================

async function exampleDataMigration() {
  const db = new RecipeDatabase(ALL_SEED_RECIPES);

  // Export all data as JSON (for backup or migration)
  const jsonBackup = await db.export();
  console.log("Database exported to JSON");

  // Later, restore from backup
  const newDb = new RecipeDatabase();
  await newDb.import(jsonBackup);

  const count = await newDb.count();
  console.log(`Restored ${count} recipes from backup`);
}

// ========================================
// EXAMPLE 8: User Recipe Upload Handler
// ========================================

async function exampleUserRecipeUpload(
  db: RecipeDatabase,
  formData: {
    name: string;
    image: File;
    cost: string;
    prepTime: string;
    tags: string[];
    difficulty: "Easy" | "Medium" | "Hard";
    category: Recipe["category"];
    ingredients: { name: string; category: string; quantity: string; cost: number }[];
    steps: string[];
  },
  currentUserId: string
) {
  // In a real app, you'd upload the image to a CDN first
  const imageUrl = "https://cdn.example.com/" + formData.image.name;

  const newRecipe = await db.create({
    name: formData.name,
    image: imageUrl,
    cost: formData.cost,
    prepTime: formData.prepTime,
    tags: formData.tags,
    difficulty: formData.difficulty,
    category: formData.category,
    ingredients: formData.ingredients,
    steps: formData.steps,
    source: "user-upload",
    createdBy: currentUserId,
    isPublic: false
  });

  console.log("Recipe uploaded:", newRecipe.name);
  return newRecipe;
}

// ========================================
// EXAMPLE 9: Recently Added Recipes
// ========================================

async function exampleRecentRecipes() {
  const db = new RecipeDatabase(ALL_SEED_RECIPES);

  // Get 10 most recently added recipes
  const recent = await db.getRecent(10);

  console.log("Recently added recipes:");
  recent.forEach(recipe => {
    const date = recipe.createdAt.toLocaleDateString();
    console.log(`${recipe.name} - added on ${date}`);
  });
}

// ========================================
// EXAMPLE 10: Complex Filtering
// ========================================

async function exampleComplexFiltering() {
  const db = new RecipeDatabase(ALL_SEED_RECIPES);

  // Find vegetarian or vegan recipes that are quick (under 15 min)
  // and cost less than $4
  const quickVeggieOptions = await db.find({
    tags: ["vegetarian", "vegan"],
    maxPrepTime: 15,
    maxCost: 4.0
  });

  console.log("Quick & cheap vegetarian options:");
  quickVeggieOptions.forEach(recipe => {
    console.log(`${recipe.name} - ${recipe.prepTime}, ${recipe.cost}`);
  });
}

// Export all examples
export {
  exampleBasicCRUD,
  exampleSearching,
  exampleMealPlanning,
  exampleGroceryList,
  exampleUsageTracking,
  exampleBulkOperations,
  exampleDataMigration,
  exampleUserRecipeUpload,
  exampleRecentRecipes,
  exampleComplexFiltering
};
