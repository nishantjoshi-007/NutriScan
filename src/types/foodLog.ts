export interface FoodLogEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  foodName: string;
  weight: number; // in grams
  calories: number; // calories
  // Key nutrients shown by default
  potassium: number; // mg
  phosphorus: number; // mg
  sodium: number; // mg
  // Reference to full nutrition data (either from search history or custom)
  nutritionDataId?: string; // ID of the SearchHistoryItem if it exists
  customNutritionData?: {
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
    };
  };
  timestamp: number; // When this entry was logged
}

export interface DailyFoodLog {
  date: string; // YYYY-MM-DD
  entries: FoodLogEntry[];
  totalNutrients: {
    weight: number;
    calories: number;
    potassium: number;
    phosphorus: number;
    sodium: number;
  };
}

export interface FoodLogCardProps {
  entry: FoodLogEntry;
  onPress: () => void;
  onDelete: () => void;
}

export interface DailyLogCardProps {
  dailyLog: DailyFoodLog;
  onEntryPress: (entry: FoodLogEntry) => void;
  onEntryDelete: (entryId: string) => void;
}
