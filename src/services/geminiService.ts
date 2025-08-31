import axios from "axios";
import * as FileSystem from "expo-file-system";
import { NutritionData, RecipeSearchResult, RecipeDetails } from "../types/nutrition";
import { WeightEstimate, DailyNutritionContext, GeminiResponse } from "../types/services";
import { config } from "../config";
import i18n from "../i18n/i18n";
import foodLogService from "./foodLogService";

/**
 * Enhanced Gemini Service with Personalized Portion Recommendations
 *
 * This service now provides personalized portion recommendations based on:
 * - User's current daily intake (from food log)
 * - Remaining daily allowance for key nutrients (K, P, Na, calories)
 * - CKD-specific daily limits
 *
 * Usage examples:
 *
 * // Basic usage (auto-calculates based on today's food log)
 * const nutritionData = await GeminiService.analyzeFood(imageBase64, 150);
 * console.log(nutritionData.renalDiet.recommendedPortionGrams); // Personalized portion
 *
 * // Customize daily limits for specific patient needs
 * GeminiService.setDailyLimits({
 *   potassium: 1500, // Lower limit for advanced CKD
 *   sodium: 1500,    // Stricter sodium restriction
 * });
 *
 * // All analysis methods now include personalized recommendations:
 * - analyzeFood() - for camera-captured food
 * - analyzeFoodFromText() - for manually entered food
 * - searchRenalFriendlyRecipes() - for recipe searches
 * - getRecipeDetails() - for detailed recipe analysis
 */

// Get API configuration from config file
const GEMINI_API_KEY = config.gemini.apiKey;
const GEMINI_API_URL = config.gemini.baseUrl;

export class GeminiService {
  private static instance: GeminiService;

  // Daily recommended limits for CKD patients (can be made configurable)
  private readonly CKD_DAILY_LIMITS = {
    calories: 2000, // kcal (can vary based on age, weight, activity)
    potassium: 2000, // mg (2-3g typical for CKD stage 3-4)
    phosphorus: 800, // mg (800-1000mg typical for CKD)
    sodium: 2000, // mg (2g or less for CKD)
  };

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Get today's nutrition context for personalized recommendations
   */
  private async getTodayNutritionContext(): Promise<DailyNutritionContext> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const todayEntries = await foodLogService.getFoodLogForDate(today);

      const currentIntake = todayEntries.reduce(
        (totals, entry) => ({
          calories: totals.calories + (entry.calories || 0),
          potassium: totals.potassium + entry.potassium,
          phosphorus: totals.phosphorus + entry.phosphorus,
          sodium: totals.sodium + entry.sodium,
        }),
        { calories: 0, potassium: 0, phosphorus: 0, sodium: 0 }
      );

      const remaining = {
        calories: Math.max(0, this.CKD_DAILY_LIMITS.calories - currentIntake.calories),
        potassium: Math.max(0, this.CKD_DAILY_LIMITS.potassium - currentIntake.potassium),
        phosphorus: Math.max(0, this.CKD_DAILY_LIMITS.phosphorus - currentIntake.phosphorus),
        sodium: Math.max(0, this.CKD_DAILY_LIMITS.sodium - currentIntake.sodium),
      };

      return {
        currentIntake,
        recommendedLimits: this.CKD_DAILY_LIMITS,
        remaining,
      };
    } catch (error) {
      console.error("Error getting nutrition context:", error);
      // Return default context if unable to get food log data
      return {
        currentIntake: { calories: 0, potassium: 0, phosphorus: 0, sodium: 0 },
        recommendedLimits: this.CKD_DAILY_LIMITS,
        remaining: this.CKD_DAILY_LIMITS,
      };
    }
  }

  /**
   * Generate personalized portion recommendation instructions
   */
  private async getPersonalizedPortionInstructions(): Promise<string> {
    const nutritionContext = await this.getTodayNutritionContext();

    return `
PERSONALIZED PORTION RECOMMENDATION CONTEXT:
Today's Current Intake:
- Calories: ${nutritionContext.currentIntake.calories}/${nutritionContext.recommendedLimits.calories} kcal
- Potassium: ${nutritionContext.currentIntake.potassium}/${nutritionContext.recommendedLimits.potassium} mg
- Phosphorus: ${nutritionContext.currentIntake.phosphorus}/${nutritionContext.recommendedLimits.phosphorus} mg
- Sodium: ${nutritionContext.currentIntake.sodium}/${nutritionContext.recommendedLimits.sodium} mg

Remaining Daily Allowance:
- Calories: ${nutritionContext.remaining.calories} kcal
- Potassium: ${nutritionContext.remaining.potassium} mg
- Phosphorus: ${nutritionContext.remaining.phosphorus} mg
- Sodium: ${nutritionContext.remaining.sodium} mg

IMPORTANT INSTRUCTIONS FOR recommendedPortionGrams:
1. Calculate the optimal portion size based on the user's REMAINING daily allowance
2. If the user has plenty of remaining allowance for a nutrient, you can suggest larger portions
3. If the user is close to their daily limit for any nutrient, suggest smaller portions
4. Always prioritize the MOST RESTRICTIVE nutrient (the one with least remaining allowance)
5. Consider the nutritional density - if food is very high in a restricted nutrient, limit portion accordingly
6. If user has very low remaining allowance (<10% of daily limit), suggest very small portions or recommend avoiding
7. Factor in that this is not their only meal of the day - leave room for other meals
8. Typical portion guidance:
   - If >50% allowance remaining: Can suggest standard or slightly larger portions
   - If 25-50% remaining: Suggest moderate portions 
   - If 10-25% remaining: Suggest small portions
   - If <10% remaining: Suggest very small portions or null (avoid)

Example calculation logic:
- If potassium remaining is 800mg and food has 200mg K per 100g, could suggest up to 400g
- But if sodium remaining is only 300mg and food has 150mg Na per 100g, limit to 200g
- Choose the smaller portion to respect the most restrictive nutrient
`;
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
      const portionInstructions = await this.getPersonalizedPortionInstructions();

      const prompt = `
        Analyze this food image and provide detailed nutrition information for ${weight} grams of this food.
        
        ${languageInstructions}
        
        ${portionInstructions}
        
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
            "overallSafetyFlag": "safe|caution|avoid",
            "primaryConcerns": ["list of main reasons for safety classification"],
            "potassiumLevel": "low|moderate|high",
            "phosphorusLevel": "low|moderate|high",
            "sodiumLevel": "low|moderate|high",
            "proteinLevel": "low|moderate|high",
            "recommendation": "detailed recommendation for people with kidney disease with specific reasoning",
            "warnings": ["warning1", "warning2"],
            "modifications": "suggested modifications for renal diet",
            "antioxidants": {
              "hasAntioxidants": boolean,
              "types": ["list of antioxidants present like lycopene, anthocyanins, etc"],
              "kidneyBenefits": ["specific benefits for kidney health"]
            },
            "recommendedPortionGrams": number_or_null_based_on_remaining_daily_allowance,
            "additionalMinerals": {
              "oxalates": number_in_mg,
              "purines": number_in_mg,
              "chloride": number_in_mg,
              "sulfur": number_in_mg
            },
            "kidneySpecificInfo": {
              "isDialysisFriendly": boolean,
              "ckdStageRecommendations": "recommendations based on CKD stages 1-5",
              "fluidContent": number_percentage,
              "acidLoad": "low|moderate|high"
            }
          },
          "weight": ${weight},
          "confidence": number_between_0_and_1
        }
        
        IMPORTANT GUIDELINES FOR KIDNEY DISEASE ASSESSMENT:
        1. Even if individual nutrients (K, P, Na) are low/moderate, flag food as 'caution' or 'avoid' if:
           - High oxalate content (>50mg) - kidney stone risk
           - High purine content (>150mg) - gout/kidney stone risk  
           - Processed foods with additives harmful to kidneys
           - High acid load foods that burden kidney function
           - Foods that interfere with kidney medications
           - Foods with hidden phosphorus additives
        2. 'overallSafetyFlag' should be the FINAL recommendation regardless of individual nutrient levels
        3. 'primaryConcerns' should list the TOP 2-3 reasons for the safety classification
        4. Be conservative - if unsure, err on side of caution for kidney patients
        5. Consider cumulative effects and food processing methods
        
        Be as accurate as possible based on the visual appearance and the specified weight. Provide vitamin amounts in IU or mg as appropriate, minerals in mg, and comprehensive renal diet analysis with focus on:
        - Antioxidants beneficial for kidney health (lycopene, anthocyanins, quercetin, etc.)
        - Recommended portion sizes for kidney patients (if restrictions apply)
        - Oxalate content (important for kidney stone prevention)
        - Purine levels (relevant for those with kidney stones/gout)
        - Acid load of the food (important for CKD patients)
        - Dialysis-friendly considerations
        - Stage-specific CKD recommendations
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

  async analyzeFoodFromText(foodDescription: string, weight: number, unit: string = "g"): Promise<NutritionData> {
    try {
      const languageInstructions = this.getLanguageInstructions();
      const portionInstructions = await this.getPersonalizedPortionInstructions();

      const prompt = `
        Analyze the food "${foodDescription}" and provide detailed nutrition information for ${weight} ${unit} of this food.
        
        ${languageInstructions}
        
        ${portionInstructions}
        
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
            "overallSafetyFlag": "safe|caution|avoid",
            "primaryConcerns": ["list of main reasons for safety classification"],
            "potassiumLevel": "low|moderate|high",
            "phosphorusLevel": "low|moderate|high",
            "sodiumLevel": "low|moderate|high",
            "proteinLevel": "low|moderate|high",
            "recommendation": "detailed recommendation for people with kidney disease with specific reasoning",
            "warnings": ["warning1", "warning2"],
            "modifications": "suggested modifications for renal diet",
            "antioxidants": {
              "hasAntioxidants": boolean,
              "types": ["list of antioxidants present like lycopene, anthocyanins, etc"],
              "kidneyBenefits": ["specific benefits for kidney health"]
            },
            "recommendedPortionGrams": number_or_null_based_on_remaining_daily_allowance,
            "additionalMinerals": {
              "oxalates": number_in_mg,
              "purines": number_in_mg,
              "chloride": number_in_mg,
              "sulfur": number_in_mg
            },
            "kidneySpecificInfo": {
              "isDialysisFriendly": boolean,
              "ckdStageRecommendations": "recommendations based on CKD stages 1-5",
              "fluidContent": number_percentage,
              "acidLoad": "low|moderate|high"
            }
          },
          "weight": ${weight},
          "confidence": number_between_0_and_1
        }
        
        IMPORTANT GUIDELINES FOR KIDNEY DISEASE ASSESSMENT:
        1. Even if individual nutrients (K, P, Na) are low/moderate, flag food as 'caution' or 'avoid' if:
           - High oxalate content (>50mg) - kidney stone risk
           - High purine content (>150mg) - gout/kidney stone risk  
           - Processed foods with additives harmful to kidneys
           - High acid load foods that burden kidney function
           - Foods that interfere with kidney medications
           - Foods with hidden phosphorus additives
        2. 'overallSafetyFlag' should be the FINAL recommendation regardless of individual nutrient levels
        3. 'primaryConcerns' should list the TOP 2-3 reasons for the safety classification
        4. Be conservative - if unsure, err on side of caution for kidney patients
        5. Consider cumulative effects and food processing methods
        
        Be as accurate as possible based on the food description and the specified weight/volume. For liquids, consider density and typical nutritional content per ml. Provide vitamin amounts in IU or mg as appropriate, minerals in mg, and comprehensive renal diet analysis with focus on:
        - Antioxidants beneficial for kidney health (lycopene, anthocyanins, quercetin, etc.)
        - Recommended portion sizes for kidney patients (if restrictions apply)
        - Oxalate content (important for kidney stone prevention)
        - Purine levels (relevant for those with kidney stones/gout)
        - Acid load of the food (important for CKD patients)
        - Dialysis-friendly considerations
        - Stage-specific CKD recommendations
        Use standard nutritional databases and food composition data.
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

  /**
   * Update daily limits for CKD recommendations (optional customization)
   */
  public setDailyLimits(limits: Partial<typeof this.CKD_DAILY_LIMITS>): void {
    Object.assign(this.CKD_DAILY_LIMITS, limits);
    console.log("Updated daily limits:", this.CKD_DAILY_LIMITS);
  }

  /**
   * Get current daily limits
   */
  public getDailyLimits() {
    return { ...this.CKD_DAILY_LIMITS };
  }

  /**
   * Search for kidney-friendly recipes based on cuisine type or search query
   */
  async searchRenalFriendlyRecipes(searchQuery: string): Promise<RecipeSearchResult[]> {
    try {
      const languageInstructions = this.getLanguageInstructions();
      const portionInstructions = await this.getPersonalizedPortionInstructions();

      const prompt = `
        Search for kidney-friendly recipes based on this query: "${searchQuery}"
        
        ${languageInstructions}
        
        ${portionInstructions}
        
        IMPORTANT: Only provide recipes that are SPECIFICALLY BENEFICIAL and SAFE for people with Chronic Kidney Disease (CKD). 
        
        Strict Requirements:
        - LOW potassium content (under 200mg per serving)
        - LOW phosphorus content (under 150mg per serving)  
        - LOW sodium content (under 300mg per serving)
        - Moderate to low protein (appropriate for CKD stages 3-4)
        - Avoid high-potassium fruits/vegetables (bananas, oranges, potatoes, tomatoes, spinach)
        - Avoid processed foods, nuts, seeds, dairy in large amounts
        - Focus on kidney-protective ingredients (cauliflower, cabbage, bell peppers, apples, berries)
        
        Provide 6-10 recipes that are GENUINELY safe and beneficial for CKD patients. Each recipe should:
        - Use CKD-approved ingredients
        - Be easily modifiable for different CKD stages
        - Include traditional dishes from the requested cuisine if specified, but modified for renal diet
        - Emphasize fresh, whole foods over processed ingredients
        - Include cooking methods that reduce potassium/phosphorus (boiling, leaching techniques)
        
        Return ONLY a JSON array with this exact structure (no additional text):
        [
          {
            "name": "recipe_name",
            "description": "brief_description_emphasizing_kidney_benefits",
            "cookingTime": "cooking_time_in_minutes",
            "difficulty": "easy|medium|hard",
            "servings": number_of_servings,
            "cuisineType": "cuisine_type",
            "renalFriendliness": "excellent|good",
            "keyBenefits": ["kidney_specific_benefit1", "kidney_specific_benefit2", "kidney_specific_benefit3"],
            "mainIngredients": ["ckd_safe_ingredient1", "ckd_safe_ingredient2", "ckd_safe_ingredient3"],
            "estimatedNutrition": {
              "calories": estimated_calories_per_serving,
              "potassium": "low",
              "phosphorus": "low", 
              "sodium": "low"
            }
          }
        ]
        
        ONLY include recipes that a nephrologist would approve for CKD patients. Do not include any recipes with high-potassium or high-phosphorus ingredients.
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
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error("Raw response:", responseText);
        throw new Error("Invalid response format from Gemini");
      }

      const recipes: RecipeSearchResult[] = JSON.parse(jsonMatch[0]);
      return recipes;
    } catch (error: any) {
      console.error("Error searching recipes with Gemini:", error);
      if (error.response) {
        console.error("API Response Status:", error.response.status);
        console.error("API Response Data:", error.response.data);
      }
      throw new Error("Failed to search recipes. Please try again.");
    }
  }

  /**
   * Get detailed recipe with nutrition analysis and renal diet recommendations
   */
  async getRecipeDetails(recipeName: string, servings: number = 4): Promise<RecipeDetails> {
    try {
      const languageInstructions = this.getLanguageInstructions();
      const portionInstructions = await this.getPersonalizedPortionInstructions();

      const prompt = `
        Provide detailed recipe information and complete nutrition analysis for "${recipeName}" (${servings} servings).
        
        IMPORTANT: This recipe should be optimized specifically for people with Chronic Kidney Disease (CKD).
        Ensure all ingredients and modifications support kidney health and are safe for CKD patients.
        
        ${languageInstructions}
        
        ${portionInstructions}
        
        Return ONLY a JSON object with this exact structure (no additional text):
        {
          "name": "recipe_name",
          "description": "detailed_description",
          "servings": ${servings},
          "prepTime": "prep_time_in_minutes",
          "cookTime": "cook_time_in_minutes",
          "totalTime": "total_time_in_minutes",
          "difficulty": "easy|medium|hard",
          "cuisineType": "cuisine_type",
          "ingredients": [
            {
              "name": "ingredient_name",
              "amount": "amount_with_unit",
              "notes": "optional_notes_for_renal_diet"
            }
          ],
          "instructions": [
            "step_1_instruction",
            "step_2_instruction"
          ],
          "renalModifications": [
            "modification_1_for_kidney_patients",
            "modification_2_for_kidney_patients"
          ],
          "nutritionPerServing": {
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
              "overallSafetyFlag": "safe|caution|avoid",
              "primaryConcerns": ["list of main concerns if any"],
              "potassiumLevel": "low|moderate|high",
              "phosphorusLevel": "low|moderate|high",
              "sodiumLevel": "low|moderate|high",
              "proteinLevel": "low|moderate|high",
              "recommendation": "detailed recommendation for kidney patients",
              "warnings": ["warning1", "warning2"],
              "modifications": "suggested modifications for renal diet",
              "antioxidants": {
                "hasAntioxidants": boolean,
                "types": ["list of antioxidants"],
                "kidneyBenefits": ["kidney health benefits"]
              },
              "recommendedPortionGrams": number_or_null_based_on_remaining_daily_allowance,
              "additionalMinerals": {
                "oxalates": number_in_mg,
                "purines": number_in_mg,
                "chloride": number_in_mg,
                "sulfur": number_in_mg
              },
              "kidneySpecificInfo": {
                "isDialysisFriendly": boolean,
                "ckdStageRecommendations": "recommendations for different CKD stages",
                "fluidContent": number_percentage,
                "acidLoad": "low|moderate|high"
              }
            }
          },
          "tips": [
            "cooking_tip_1",
            "cooking_tip_2"
          ],
          "storage": "storage_instructions",
          "variations": [
            "variation_1_for_different_dietary_needs",
            "variation_2_for_different_dietary_needs"
          ]
        }
        
        IMPORTANT: Ensure nutrition analysis follows the same comprehensive kidney assessment guidelines as food analysis. Be conservative and detailed in renal diet recommendations.
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

      const recipeDetails: RecipeDetails = JSON.parse(jsonMatch[0]);
      return recipeDetails;
    } catch (error: any) {
      console.error("Error getting recipe details with Gemini:", error);
      if (error.response) {
        console.error("API Response Status:", error.response.status);
        console.error("API Response Data:", error.response.data);
      }
      throw new Error("Failed to get recipe details. Please try again.");
    }
  }
}

export default GeminiService.getInstance();
