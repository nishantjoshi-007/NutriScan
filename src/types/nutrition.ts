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
    potassiumLevel: "low" | "moderate" | "high";
    phosphorusLevel: "low" | "moderate" | "high";
    sodiumLevel: "low" | "moderate" | "high";
    proteinLevel: "low" | "moderate" | "high";
    recommendation: string;
    warnings: string[];
    modifications: string;
  };
  weight?: number;
  confidence?: number;
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}
