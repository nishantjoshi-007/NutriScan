import axios from "axios";
import * as FileSystem from "expo-file-system";
import { NutritionData, GeminiResponse } from "../types/nutrition";
import { config } from "../config";
import i18n from "../i18n/i18n";

// Get API configuration from config file
const GEMINI_API_KEY = config.gemini.apiKey;
const GEMINI_API_URL = config.gemini.baseUrl;

export interface WeightEstimate {
  weight: number; // in grams
  confidence: number; // 0-1
  detectedFood: string;
  reasoning: string;
  volume?: number; // in cm³ (optional)
}

export class GeminiService {
  private static instance: GeminiService;

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private getLanguageInstructions(): string {
    const currentLanguage = i18n.language;

    if (currentLanguage === "gu") {
      return `
        IMPORTANT: For the "renalDiet" section, provide these specific fields in Gujarati:
        - "recommendation": Write this recommendation in Gujarati (ગુજરાતી). Use medical-appropriate Gujarati terminology.
        - "warnings": Provide all warning messages in Gujarati (ગુજરાતી). Use terms like "કિડની" for kidney, "મીઠું" for salt, "પ્રોટીન" for protein.
        - "modifications": Write dietary modifications in Gujarati (ગુજરાતી). Use terms like "ખાદ્ય" for food, "આહાર" for diet, "પાણી" for water.
        
        Use appropriate Gujarati medical and nutritional terminology. Be clear and helpful for Gujarati-speaking patients with kidney disease.
        All other numerical values and level indicators should remain in English format.
        
        Examples of Gujarati medical terms to use:
        - કિડની રોગ (kidney disease)
        - લોહીનું દબાણ (blood pressure)
        - ડાયાબિટીસ (diabetes)
        - પોષણ (nutrition)
        - વિટામિન (vitamins)
        - ખનિજ (minerals)
      `;
    }

    return `
      For the "renalDiet" section, provide all text fields in English.
    `;
  }

  async analyzeFood(imageBase64: string, weight: number): Promise<NutritionData> {
    try {
      const languageInstructions = this.getLanguageInstructions();

      const prompt = `
        Analyze this food image and provide detailed nutrition information for ${weight} grams of this food.
        
        ${languageInstructions}
        
        Return ONLY a JSON object with this exact structure (no additional text):
        {
          "food": "food name",
          "calories": number,
          "macros": {
            "protein": number,
            "carbs": number,
            "fat": number,
            "fiber": number,
            "sugar": number
          },
          "vitamins": {
            "vitaminA": number,
            "vitaminC": number,
            "vitaminD": number,
            "vitaminE": number,
            "vitaminK": number,
            "vitaminB1": number,
            "vitaminB2": number,
            "vitaminB3": number,
            "vitaminB6": number,
            "vitaminB12": number,
            "folate": number
          },
          "minerals": {
            "calcium": number,
            "iron": number,
            "magnesium": number,
            "phosphorus": number,
            "potassium": number,
            "sodium": number,
            "zinc": number,
            "selenium": number
          },
          "renalDiet": {
            "suitableForKidneyDisease": boolean,
            "potassiumLevel": "low|moderate|high",
            "phosphorusLevel": "low|moderate|high",
            "sodiumLevel": "low|moderate|high",
            "proteinLevel": "low|moderate|high",
            "recommendation": "detailed recommendation for people with kidney disease",
            "warnings": ["warning1", "warning2"],
            "modifications": "suggested modifications for renal diet"
          },
          "weight": ${weight},
          "confidence": number_between_0_and_1
        }
        
        Be as accurate as possible based on the visual appearance and the specified weight. Provide vitamin amounts in IU or mg as appropriate, minerals in mg, and comprehensive renal diet analysis.
      `;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      };

      const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const geminiResponse: GeminiResponse = response.data;
      const responseText = geminiResponse.candidates[0]?.content?.parts[0]?.text;

      if (!responseText) {
        throw new Error("No response from Gemini API");
      }

      // Parse JSON response with the same robust method as estimateWeightFromImage
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Raw response:", responseText);
        throw new Error("Invalid response format from Gemini");
      }

      const nutritionData: NutritionData = JSON.parse(jsonMatch[0]);

      return nutritionData;
    } catch (error: any) {
      console.error("Error analyzing food with Gemini:", error);
      if (error.response) {
        console.error("API Response Status:", error.response.status);
        console.error("API Response Data:", error.response.data);
      }
      if (error.request) {
        console.error("No response received:", error.request);
      }
      throw new Error("Failed to analyze food with Gemini AI. Please check your API configuration and try again.");
    }
  }

  async analyzeFoodFromText(foodDescription: string, weight: number): Promise<NutritionData> {
    try {
      const languageInstructions = this.getLanguageInstructions();

      const prompt = `
        Analyze the food "${foodDescription}" and provide detailed nutrition information for ${weight} grams of this food.
        
        ${languageInstructions}
        
        Return ONLY a JSON object with this exact structure (no additional text):
        {
          "food": "food name",
          "calories": number,
          "macros": {
            "protein": number,
            "carbs": number,
            "fat": number,
            "fiber": number,
            "sugar": number
          },
          "vitamins": {
            "vitaminA": number,
            "vitaminC": number,
            "vitaminD": number,
            "vitaminE": number,
            "vitaminK": number,
            "vitaminB1": number,
            "vitaminB2": number,
            "vitaminB3": number,
            "vitaminB6": number,
            "vitaminB12": number,
            "folate": number
          },
          "minerals": {
            "calcium": number,
            "iron": number,
            "magnesium": number,
            "phosphorus": number,
            "potassium": number,
            "sodium": number,
            "zinc": number,
            "selenium": number
          },
          "renalDiet": {
            "suitableForKidneyDisease": boolean,
            "potassiumLevel": "low|moderate|high",
            "phosphorusLevel": "low|moderate|high",
            "sodiumLevel": "low|moderate|high",
            "proteinLevel": "low|moderate|high",
            "recommendation": "detailed recommendation for people with kidney disease",
            "warnings": ["warning1", "warning2"],
            "modifications": "suggested modifications for renal diet"
          },
          "weight": ${weight},
          "confidence": number_between_0_and_1
        }
        
        Be as accurate as possible based on the food description and the specified weight. Provide vitamin amounts in IU or mg as appropriate, minerals in mg, and comprehensive renal diet analysis. Use standard nutritional databases and food composition data.
      `;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      };

      const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const geminiResponse: GeminiResponse = response.data;
      const responseText = geminiResponse.candidates[0]?.content?.parts[0]?.text;

      if (!responseText) {
        throw new Error("No response from Gemini API");
      }

      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Raw response:", responseText);
        throw new Error("Invalid response format from Gemini");
      }

      const nutritionData: NutritionData = JSON.parse(jsonMatch[0]);

      return nutritionData;
    } catch (error: any) {
      console.error("Error analyzing food from text with Gemini:", error);
      if (error.response) {
        console.error("API Response Status:", error.response.status);
        console.error("API Response Data:", error.response.data);
      }
      if (error.request) {
        console.error("No response received:", error.request);
      }
      throw new Error(
        "Failed to analyze food from text with Gemini AI. Please check your API configuration and try again."
      );
    }
  }

  /**
   * Estimate weight directly from image using Gemini AI
   */
  async estimateWeightFromImage(imageUri: string, foodType?: string): Promise<WeightEstimate> {
    try {
      // Convert image to base64
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const currentLanguage = i18n.language;
      const languageInstruction =
        currentLanguage === "gu"
          ? "Provide the reasoning explanation in Gujarati (ગુજરાતી)."
          : "Provide the reasoning explanation in English.";

      const prompt = `
Analyze this food image and estimate its weight. Please provide:

1. Your best estimate of the weight in grams
2. The type of food you identify
3. Your confidence level (0-100%)
4. Brief reasoning for your weight estimation
5. Estimated volume in cm³ (if possible)

Consider factors like:
- Food density and composition
- Visual appearance (ripeness, size, etc.)
- Typical weight ranges for this food type
- Scale indicators in the image

${languageInstruction}

Respond in this exact JSON format:
{
  "weight": number_in_grams,
  "foodType": "identified_food_name",
  "confidence": confidence_percentage,
  "reasoning": "brief_explanation",
  "volume": estimated_volume_in_cm3_or_null
}
`;

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Image,
                  },
                },
              ],
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!result) {
        throw new Error("No response from Gemini API");
      }

      // Parse JSON response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid response format from Gemini");
      }

      const geminiResult = JSON.parse(jsonMatch[0]);

      return {
        weight: Math.round(geminiResult.weight),
        confidence: geminiResult.confidence / 100,
        detectedFood: geminiResult.foodType,
        reasoning: geminiResult.reasoning,
        volume: geminiResult.volume || undefined,
      };
    } catch (error: any) {
      console.error("Error with Gemini weight estimation:", error);
      if (error.response) {
        console.error("API Response Status:", error.response.status);
        console.error("API Response Data:", error.response.data);
      }
      throw new Error("Failed to estimate weight from image. Please enter weight manually.");
    }
  }

  // Method to set API key (call this in your app initialization)
  public setApiKey(apiKey: string): void {
    // In a real app, you'd want to store this securely
    console.log("Gemini API key set");
  }
}

export default GeminiService.getInstance();
