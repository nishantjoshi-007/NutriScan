export interface NutritionData {
  food: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  vitamins: {
    vitaminA: number;
    vitaminC: number;
    vitaminD: number;
    vitaminE: number;
    vitaminK: number;
    vitaminB1: number;
    vitaminB2: number;
    vitaminB3: number;
    vitaminB6: number;
    vitaminB12: number;
    folate: number;
  };
  minerals: {
    calcium: number;
    iron: number;
    magnesium: number;
    phosphorus: number;
    potassium: number;
    sodium: number;
    zinc: number;
    selenium: number;
  };
  renalDiet: {
    suitableForKidneyDisease: boolean;
    overallSafetyFlag: "safe" | "caution" | "avoid";
    primaryConcerns: string[];
    potassiumLevel: "low" | "moderate" | "high";
    phosphorusLevel: "low" | "moderate" | "high";
    sodiumLevel: "low" | "moderate" | "high";
    proteinLevel: "low" | "moderate" | "high";
    recommendation: string;
    warnings: string[];
    modifications: string;
    antioxidants?: {
      hasAntioxidants: boolean;
      types: string[];
      kidneyBenefits: string[];
    };
    recommendedPortionGrams?: number;
    additionalMinerals?: {
      oxalates: number; // mg
      purines: number; // mg
      chloride: number; // mg
      sulfur: number; // mg
    };
    kidneySpecificInfo?: {
      isDialysisFriendly: boolean;
      ckdStageRecommendations: string;
      fluidContent: number; // percentage
      acidLoad: "low" | "moderate" | "high";
    };
  };
  weight?: number;
  confidence?: number;
}

export interface RecipeSearchResult {
  name: string;
  description: string;
  cookingTime: string;
  difficulty: "easy" | "medium" | "hard";
  servings: number;
  cuisineType: string;
  renalFriendliness: "excellent" | "good" | "fair";
  keyBenefits: string[];
  mainIngredients: string[];
  estimatedNutrition: {
    calories: number;
    potassium: "low" | "moderate";
    phosphorus: "low" | "moderate";
    sodium: "low" | "moderate";
  };
}

export interface RecipeIngredient {
  name: string;
  amount: string;
  notes?: string;
}

export interface RecipeDetails {
  name: string;
  description: string;
  servings: number;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  difficulty: "easy" | "medium" | "hard";
  cuisineType: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  renalModifications: string[];
  nutritionPerServing: NutritionData;
  tips: string[];
  storage: string;
  variations: string[];
}
