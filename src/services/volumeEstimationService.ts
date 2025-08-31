import { Dimensions } from "react-native";
import { Alert } from "react-native";
import GeminiService from "./geminiService";
import { WeightEstimate, VolumeEstimate } from "../types/services";

export class VolumeEstimationService {
  private static instance: VolumeEstimationService;

  public static getInstance(): VolumeEstimationService {
    if (!VolumeEstimationService.instance) {
      VolumeEstimationService.instance = new VolumeEstimationService();
    }
    return VolumeEstimationService.instance;
  }

  /**
   * Estimate weight directly from image using Gemini AI
   */
  async estimateWeightFromImage(imageUri: string, foodType?: string): Promise<VolumeEstimate> {
    try {
      // Use Gemini to estimate weight based on image
      const geminiEstimate = await GeminiService.estimateWeightFromImage(imageUri, foodType);

      return {
        volume: geminiEstimate.volume || 100, // Provide a reasonable default volume estimate
        weight: geminiEstimate.weight,
        confidence: geminiEstimate.confidence,
        detectedFood: geminiEstimate.detectedFood,
        estimationMethod: "gemini",
        geminiAnalysis: geminiEstimate.reasoning,
      };
    } catch (error) {
      console.error("Gemini weight estimation failed:", error);
      Alert.alert(
        "Weight Estimation Error",
        "Failed to estimate weight from image. Please try again.",
        [{ text: "OK" }]
      );
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Weight estimation failed: ${errorMessage}`);
    }
  }

  /**
   * Create a manual weight estimate (when user enters weight manually)
   */
  createManualEstimate(weight: number, detectedFood?: string): VolumeEstimate {
    // Rough volume estimation based on weight (assuming average food density ~1g/cm³)
    const estimatedVolume = weight * 0.8; // Slightly less dense than water on average

    return {
      volume: estimatedVolume,
      weight: weight,
      confidence: 1.0, // User input is considered 100% confident
      detectedFood: detectedFood || "Unknown food",
      estimationMethod: "manual",
      geminiAnalysis: "Manual weight input by user",
    };
  }

  /**
   * Get quick weight suggestions based on common food portions
   */
  getQuickWeightSuggestions(): { label: string; value: number }[] {
    return [
      { label: "Small portion (50g)", value: 50 },
      { label: "Medium portion (100g)", value: 100 },
      { label: "Large portion (150g)", value: 150 },
      { label: "Extra large (200g)", value: 200 },
      { label: "Meal size (250g)", value: 250 },
      { label: "Large meal (300g)", value: 300 },
    ];
  }

  /**
   * Validate weight input
   */
  validateWeight(weight: number): { isValid: boolean; error?: string } {
    if (!weight || isNaN(weight)) {
      return { isValid: false, error: "Please enter a valid number" };
    }

    if (weight <= 0) {
      return { isValid: false, error: "Weight must be greater than 0" };
    }

    if (weight > 5000) {
      return { isValid: false, error: "Weight seems too high (max 5000g)" };
    }

    if (weight < 1) {
      return { isValid: false, error: "Weight seems too low (min 1g)" };
    }

    return { isValid: true };
  }
}

export default VolumeEstimationService.getInstance();
