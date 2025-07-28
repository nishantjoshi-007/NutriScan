export interface SearchHistoryItem {
  id: string;
  timestamp: number;
  imageUri: string;
  weight: number;
  foodName: string;
  calories: number;
  confidence?: number;
  searchText?: string; // Optional text search query
  // Store complete nutrition data
  nutritionData: {
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
      potassiumLevel: "low" | "moderate" | "high";
      phosphorusLevel: "low" | "moderate" | "high";
      sodiumLevel: "low" | "moderate" | "high";
      proteinLevel: "low" | "moderate" | "high";
      recommendation: string;
      warnings: string[];
      modifications: string;
    };
  };
  // Keep simplified summary for backward compatibility and quick display
  summary: {
    macros: {
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      sugar: number;
    };
    vitamins: Array<{ name: string; amount: string; dailyValue: string }>;
    minerals: Array<{ name: string; amount: string; dailyValue: string }>;
    warnings: string[];
    tips: string[];
  };
}

export interface SearchHistoryService {
  saveSearch: (item: Omit<SearchHistoryItem, "id" | "timestamp">) => Promise<void>;
  getSearchHistory: () => Promise<SearchHistoryItem[]>;
  deleteSearchItem: (id: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
  getSearchStats: () => Promise<{ totalSearches: number; thisWeek: number; thisMonth: number }>;
}
