/**
 * Service-related interfaces and types
 */

/**
 * Weight estimation result from image analysis
 */
export interface WeightEstimate {
  weight: number; // in grams
  confidence: number; // 0-1
  detectedFood: string;
  reasoning: string;
  volume?: number; // in cm³ (optional)
}

/**
 * Volume estimation result
 */
export interface VolumeEstimate {
  volume: number; // in cm³
  weight: number; // in grams
  confidence: number; // 0-1
  detectedFood?: string;
  estimationMethod: "gemini" | "manual";
  geminiAnalysis?: string;
}

/**
 * Daily nutrition context for personalized recommendations
 */
export interface DailyNutritionContext {
  currentIntake: {
    calories: number;
    potassium: number; // mg
    phosphorus: number; // mg
    sodium: number; // mg
  };
  recommendedLimits: {
    calories: number;
    potassium: number; // mg
    phosphorus: number; // mg
    sodium: number; // mg
  };
  remaining: {
    calories: number;
    potassium: number; // mg
    phosphorus: number; // mg
    sodium: number; // mg
  };
}

/**
 * Gemini API response structure
 */
export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

/**
 * Service configuration interface
 */
export interface ServiceConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
}
