import { createHashRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/Home";
import { Plan } from "./components/Plan";
import { GroceryList } from "./components/GroceryList";
import { WheelPage } from "./components/Wheel";
import { Upload } from "./components/Upload";
import { IngredientSearch } from "./components/IngredientSearch";

export const router = createHashRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "plan", Component: Plan },
      { path: "ingredient-search", Component: IngredientSearch },
      { path: "grocery-list", Component: GroceryList },
      { path: "wheel", Component: WheelPage },
      { path: "upload", Component: Upload },
    ],
  },
]);
