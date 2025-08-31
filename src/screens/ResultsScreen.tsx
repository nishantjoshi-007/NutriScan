import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Image,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import { NutritionData } from "../types/nutrition";
import { ResultsScreenProps } from "../types/navigation";
import { NutritionItemProps, MacroCardProps, NutrientCardProps } from "../types/components";
import GeminiService from "../services/geminiService";
import searchHistoryService from "../services/searchHistoryService";
import * as FileSystem from "expo-file-system";

const { width: screenWidth } = Dimensions.get("window");

const NutritionItem: React.FC<NutritionItemProps> = ({ label, value, unit = "", color = "#333" }) => (
  <View style={styles.nutritionItem}>
    <Text style={styles.nutritionLabel}>{label}</Text>
    <Text style={[styles.nutritionValue, { color }]}>
      {value}
      {unit}
    </Text>
  </View>
);

const MacroCard: React.FC<MacroCardProps> = ({ value, label, color, icon }) => (
  <View style={styles.macroCard}>
    <View style={[styles.macroIconContainer, { backgroundColor: color + "20" }]}>
      <Text style={styles.macroIcon}>{icon}</Text>
    </View>
    <Text style={[styles.macroValue, { color }]}>{value}g</Text>
    <Text style={styles.macroLabel}>{label}</Text>
  </View>
);

const NutrientCard: React.FC<NutrientCardProps> = ({ title, icon, children }) => (
  <View style={styles.nutrientCard}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <View style={styles.cardContent}>{children}</View>
  </View>
);

export default function ResultsScreen({ navigation, route }: ResultsScreenProps) {
  const { t } = useTranslation();
  const {
    imageUri,
    weight,
    calories,
    confidence,
    summary,
    nutritionData: savedNutritionData,
    searchText,
  } = route.params;
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have complete saved nutrition data from history, use it
    if (savedNutritionData) {
      const historyData: NutritionData = {
        food: "Previous Analysis", // Extract from summary if available
        calories,
        confidence,
        macros: savedNutritionData.macros,
        vitamins: savedNutritionData.vitamins,
        minerals: savedNutritionData.minerals,
        renalDiet: {
          ...savedNutritionData.renalDiet,
          overallSafetyFlag:
            (savedNutritionData.renalDiet as any).overallSafetyFlag ||
            (savedNutritionData.renalDiet.suitableForKidneyDisease ? "safe" : "caution"),
          primaryConcerns: (savedNutritionData.renalDiet as any).primaryConcerns || [],
        },
      };
      setNutritionData(historyData);
      setIsLoading(false);
    }
    // If we have basic pre-calculated data from history (backward compatibility), use it
    else if (calories > 0 && confidence > 0 && summary && summary.macros.protein > 0) {
      const historyData: NutritionData = {
        food: "Previous Analysis",
        calories,
        confidence,
        macros: summary.macros,
        vitamins: {
          vitaminA: 0,
          vitaminC: 0,
          vitaminD: 0,
          vitaminE: 0,
          vitaminK: 0,
          vitaminB1: 0,
          vitaminB2: 0,
          vitaminB3: 0,
          vitaminB6: 0,
          vitaminB12: 0,
          folate: 0,
        },
        minerals: {
          calcium: 0,
          iron: 0,
          magnesium: 0,
          phosphorus: 0,
          potassium: 0,
          sodium: 0,
          zinc: 0,
          selenium: 0,
        },
        renalDiet: {
          suitableForKidneyDisease: true,
          overallSafetyFlag: "safe",
          primaryConcerns: [],
          potassiumLevel: "low",
          phosphorusLevel: "low",
          sodiumLevel: "low",
          proteinLevel: "moderate",
          recommendation: "Previous analysis data - detailed information may be limited",
          warnings: summary.warnings || [],
          modifications: summary.tips?.join(". ") || "",
        },
      };
      setNutritionData(historyData);
      setIsLoading(false);
    } else {
      // This is a new analysis, proceed with Gemini API call
      analyzeFood();
    }
  }, []);

  const saveToHistory = async (data: NutritionData) => {
    try {
      // Convert vitamins object to array format (for summary display)
      const vitaminsArray = [
        { name: "Vitamin A", amount: `${data.vitamins.vitaminA}`, dailyValue: "IU" },
        { name: "Vitamin C", amount: `${data.vitamins.vitaminC}`, dailyValue: "mg" },
        { name: "Vitamin D", amount: `${data.vitamins.vitaminD}`, dailyValue: "IU" },
        { name: "Vitamin E", amount: `${data.vitamins.vitaminE}`, dailyValue: "mg" },
        { name: "Vitamin K", amount: `${data.vitamins.vitaminK}`, dailyValue: "mcg" },
        { name: "B1 (Thiamine)", amount: `${data.vitamins.vitaminB1}`, dailyValue: "mg" },
        { name: "B2 (Riboflavin)", amount: `${data.vitamins.vitaminB2}`, dailyValue: "mg" },
        { name: "B3 (Niacin)", amount: `${data.vitamins.vitaminB3}`, dailyValue: "mg" },
        { name: "B6", amount: `${data.vitamins.vitaminB6}`, dailyValue: "mg" },
        { name: "B12", amount: `${data.vitamins.vitaminB12}`, dailyValue: "mcg" },
        { name: "Folate", amount: `${data.vitamins.folate}`, dailyValue: "mcg" },
      ];

      // Convert minerals object to array format (for summary display)
      const mineralsArray = [
        { name: "Calcium", amount: `${data.minerals.calcium}`, dailyValue: "mg" },
        { name: "Iron", amount: `${data.minerals.iron}`, dailyValue: "mg" },
        { name: "Magnesium", amount: `${data.minerals.magnesium}`, dailyValue: "mg" },
        { name: "Phosphorus", amount: `${data.minerals.phosphorus}`, dailyValue: "mg" },
        { name: "Potassium", amount: `${data.minerals.potassium}`, dailyValue: "mg" },
        { name: "Sodium", amount: `${data.minerals.sodium}`, dailyValue: "mg" },
        { name: "Zinc", amount: `${data.minerals.zinc}`, dailyValue: "mg" },
        { name: "Selenium", amount: `${data.minerals.selenium}`, dailyValue: "mcg" },
      ];

      await searchHistoryService.saveSearch({
        imageUri: imageUri || "", // Empty string for text searches
        weight,
        foodName: data.food,
        calories: data.calories,
        confidence: data.confidence,
        searchText: searchText || undefined, // Include search text if available
        // Store complete nutrition data
        nutritionData: {
          macros: data.macros,
          vitamins: data.vitamins,
          minerals: data.minerals,
          renalDiet: data.renalDiet,
        },
        // Keep simplified summary for backward compatibility and quick display
        summary: {
          macros: data.macros,
          vitamins: vitaminsArray,
          minerals: mineralsArray,
          warnings: data.renalDiet.warnings,
          tips: data.renalDiet.modifications ? [data.renalDiet.modifications] : [],
        },
      });
    } catch (error) {
      console.error("Failed to save search to history:", error);
      // Don't show error to user as this is not critical functionality
    }
  };

  const analyzeFood = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let result: NutritionData;

      if (searchText) {
        // Text-based analysis
        result = await GeminiService.analyzeFoodFromText(searchText, weight, "g");
      } else {
        // Image-based analysis
        const base64Image = await convertImageToBase64(imageUri);
        result = await GeminiService.analyzeFood(base64Image, weight);
      }

      setNutritionData(result);

      // Save to search history
      await saveToHistory(result);
    } catch (error) {
      console.error("Error analyzing food:", error);
      Alert.alert(
        t("results.analysisFailed"),
        typeof error === "object" && error !== null && "message" in error
          ? (error as any).message
          : t("results.analysisFailed"),
        [{ text: "OK" }]
      );
      setError(t("results.analysisFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const convertImageToBase64 = async (uri: string): Promise<string> => {
    try {
      // Skip if no URI (text search)
      if (!uri) {
        throw new Error("No image URI provided");
      }

      // First, let's check the file size
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (__DEV__) {
        console.log("Image file info:", fileInfo);
      }

      // If file exists and is too large (>4MB), we might need to resize
      if (fileInfo.exists && "size" in fileInfo && fileInfo.size > 4 * 1024 * 1024) {
        Alert.alert(
          "Large Image Warning",
          `The selected image is large (${fileInfo.size} bytes). This may cause issues with analysis. Consider using a smaller image.`,
          [{ text: "OK" }]
        );
      }

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (__DEV__) {
        console.log("Base64 string length:", base64.length);
      }
      return base64;
    } catch (error) {
      console.error("Error converting image to base64:", error);
      Alert.alert(
        "Image Processing Error",
        "Failed to process image. Please try a different image or check your device storage.",
        [{ text: "OK" }]
      );
      throw new Error("Failed to process image");
    }
  };

  const scanAnother = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Home" }],
    });
  };

  const goHome = () => {
    navigation.navigate("Home");
  };

  const retryAnalysis = () => {
    analyzeFood();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>🔍</Text>
            <Text style={styles.loadingTitle}>{t("results.analyzingFood")}</Text>
            <Text style={styles.loadingSubtitle}>{t("results.analyzingSubtitle")}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.errorTitle}>{t("results.analysisFailed")}</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={retryAnalysis}>
              <Text style={styles.retryButtonText}>{t("results.tryAgain")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={scanAnother}>
              <Text style={styles.secondaryButtonText}>{t("results.scanAnother")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!nutritionData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{t("results.noNutritionData")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Background */}
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            {searchText ? (
              // Text search - show text icon and description
              <View style={styles.textSearchContainer}>
                <Text style={styles.textSearchIcon}>📝</Text>
                <Text style={styles.searchTextDisplay}>"{searchText}"</Text>
                <View style={styles.imageOverlay}>
                  <Text style={styles.weightBadge}>{weight}g</Text>
                </View>
              </View>
            ) : (
              // Image search - show image
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.foodImage} />
                <View style={styles.imageOverlay}>
                  <Text style={styles.weightBadge}>{weight}g</Text>
                </View>
              </View>
            )}
            <Text style={styles.foodName}>{nutritionData.food}</Text>
            {nutritionData.confidence && (
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {Math.round(nutritionData.confidence * 100)}% {t("results.confident")}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Calories Highlight Card */}
        <View style={styles.caloriesCard}>
          <View style={styles.caloriesGradient}>
            <Text style={styles.caloriesIcon}>🔥</Text>
            <Text style={styles.caloriesNumber}>{nutritionData.calories}</Text>
            <Text style={styles.caloriesLabel}>{t("results.calories")}</Text>
          </View>
        </View>

        {/* Macronutrients Cards */}
        <NutrientCard title={t("results.macronutrients")} icon="📊">
          <View style={styles.macroGrid}>
            <MacroCard value={nutritionData.macros.protein} label={t("results.protein")} color="#FF6B6B" icon="🥩" />
            <MacroCard value={nutritionData.macros.carbs} label={t("results.carbs")} color="#4ECDC4" icon="🍞" />
            <MacroCard value={nutritionData.macros.fat} label={t("results.fat")} color="#45B7D1" icon="🥑" />
            <MacroCard value={nutritionData.macros.fiber} label={t("results.fiber")} color="#96CEB4" icon="🌾" />
            <MacroCard value={nutritionData.macros.sugar} label={t("results.sugar")} color="#FFEAA7" icon="🍯" />
          </View>
        </NutrientCard>

        {/* Vitamins Card */}
        <NutrientCard title={t("results.vitamins")} icon="💊">
          <View style={styles.nutrientsGrid}>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>🥕</Text>
                <Text style={styles.nutrientLabel}>{t("results.vitaminA")}</Text>
              </View>
              <Text style={styles.nutrientValue}>{nutritionData.vitamins.vitaminA} IU</Text>
            </View>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>🍊</Text>
                <Text style={styles.nutrientLabel}>{t("results.vitaminC")}</Text>
              </View>
              <Text style={styles.nutrientValue}>{nutritionData.vitamins.vitaminC} mg</Text>
            </View>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>☀️</Text>
                <Text style={styles.nutrientLabel}>{t("results.vitaminD")}</Text>
              </View>
              <Text style={styles.nutrientValue}>{nutritionData.vitamins.vitaminD} IU</Text>
            </View>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>🌰</Text>
                <Text style={styles.nutrientLabel}>{t("results.vitaminE")}</Text>
              </View>
              <Text style={styles.nutrientValue}>{nutritionData.vitamins.vitaminE} mg</Text>
            </View>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>🥬</Text>
                <Text style={styles.nutrientLabel}>{t("results.vitaminK")}</Text>
              </View>
              <Text style={styles.nutrientValue}>{nutritionData.vitamins.vitaminK} mcg</Text>
            </View>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>🌾</Text>
                <Text style={styles.nutrientLabel}>{t("results.vitaminB1")}</Text>
              </View>
              <Text style={styles.nutrientValue}>{nutritionData.vitamins.vitaminB1} mg</Text>
            </View>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>🥛</Text>
                <Text style={styles.nutrientLabel}>{t("results.vitaminB2")}</Text>
              </View>
              <Text style={styles.nutrientValue}>{nutritionData.vitamins.vitaminB2} mg</Text>
            </View>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>🍖</Text>
                <Text style={styles.nutrientLabel}>{t("results.vitaminB3")}</Text>
              </View>
              <Text style={styles.nutrientValue}>{nutritionData.vitamins.vitaminB3} mg</Text>
            </View>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>🐟</Text>
                <Text style={styles.nutrientLabel}>{t("results.vitaminB6")}</Text>
              </View>
              <Text style={styles.nutrientValue}>{nutritionData.vitamins.vitaminB6} mg</Text>
            </View>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>🧀</Text>
                <Text style={styles.nutrientLabel}>{t("results.vitaminB12")}</Text>
              </View>
              <Text style={styles.nutrientValue}>{nutritionData.vitamins.vitaminB12} mcg</Text>
            </View>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>🥦</Text>
                <Text style={styles.nutrientLabel}>{t("results.folate")}</Text>
              </View>
              <Text style={styles.nutrientValue}>{nutritionData.vitamins.folate} mcg</Text>
            </View>
          </View>
        </NutrientCard>

        {/* Minerals Card */}
        <NutrientCard title={t("results.minerals")} icon="⚡">
          <View style={styles.nutrientsGrid}>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>🦴</Text>
                <Text style={styles.nutrientLabel}>{t("results.calcium")}</Text>
              </View>
              <Text style={styles.nutrientValue}>{nutritionData.minerals.calcium} mg</Text>
            </View>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>🩸</Text>
                <Text style={styles.nutrientLabel}>{t("results.iron")}</Text>
              </View>
              <Text style={styles.nutrientValue}>{nutritionData.minerals.iron} mg</Text>
            </View>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>💪</Text>
                <Text style={styles.nutrientLabel}>{t("results.magnesium")}</Text>
              </View>
              <Text style={styles.nutrientValue}>{nutritionData.minerals.magnesium} mg</Text>
            </View>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>🦷</Text>
                <Text style={styles.nutrientLabel}>{t("results.phosphorus")}</Text>
              </View>
              <Text style={[styles.nutrientValue, styles.highlightMineral]}>
                {nutritionData.minerals.phosphorus} mg
              </Text>
            </View>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>💓</Text>
                <Text style={styles.nutrientLabel}>{t("results.potassium")}</Text>
              </View>
              <Text style={[styles.nutrientValue, styles.highlightMineral, { color: "#FF6B6B" }]}>
                {nutritionData.minerals.potassium} mg
              </Text>
            </View>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>🧂</Text>
                <Text style={styles.nutrientLabel}>{t("results.sodium")}</Text>
              </View>
              <Text style={[styles.nutrientValue, styles.highlightMineral, { color: "#FFA726" }]}>
                {nutritionData.minerals.sodium} mg
              </Text>
            </View>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>🛡️</Text>
                <Text style={styles.nutrientLabel}>{t("results.zinc")}</Text>
              </View>
              <Text style={styles.nutrientValue}>{nutritionData.minerals.zinc} mg</Text>
            </View>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientEmoji}>⚛️</Text>
                <Text style={styles.nutrientLabel}>{t("results.selenium")}</Text>
              </View>
              <Text style={styles.nutrientValue}>{nutritionData.minerals.selenium} mcg</Text>
            </View>
          </View>
        </NutrientCard>

        {/* Renal Diet Information Card */}
        <View
          style={[
            styles.renalCard,
            {
              backgroundColor:
                (nutritionData.renalDiet.overallSafetyFlag ||
                  (nutritionData.renalDiet.suitableForKidneyDisease ? "safe" : "caution")) === "safe"
                  ? "#E8F5E8"
                  : (nutritionData.renalDiet.overallSafetyFlag ||
                      (nutritionData.renalDiet.suitableForKidneyDisease ? "safe" : "caution")) === "caution"
                  ? "#FFF3E0"
                  : "#FFEBEE",
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🏥</Text>
            <Text style={styles.cardTitle}>{t("results.renalDiet")}</Text>
          </View>

          <View style={styles.renalStatusCard}>
            <Text
              style={[
                styles.renalStatus,
                {
                  color:
                    (nutritionData.renalDiet.overallSafetyFlag ||
                      (nutritionData.renalDiet.suitableForKidneyDisease ? "safe" : "caution")) === "safe"
                      ? "#2E7D32"
                      : (nutritionData.renalDiet.overallSafetyFlag ||
                          (nutritionData.renalDiet.suitableForKidneyDisease ? "safe" : "caution")) === "caution"
                      ? "#F57C00"
                      : "#C62828",
                },
              ]}
            >
              {(nutritionData.renalDiet.overallSafetyFlag ||
                (nutritionData.renalDiet.suitableForKidneyDisease ? "safe" : "caution")) === "safe"
                ? "✅ " + t("results.safe")
                : (nutritionData.renalDiet.overallSafetyFlag ||
                    (nutritionData.renalDiet.suitableForKidneyDisease ? "safe" : "caution")) === "caution"
                ? "⚠️ " + t("results.useCaution")
                : "🚫 " + t("results.avoid")}
            </Text>

            {/* Primary Concerns */}
            {nutritionData.renalDiet.primaryConcerns && nutritionData.renalDiet.primaryConcerns.length > 0 && (
              <View style={styles.primaryConcernsContainer}>
                <Text style={styles.primaryConcernsTitle}>{t("results.primaryConcerns")}:</Text>
                {nutritionData.renalDiet.primaryConcerns.map((concern, index) => (
                  <View key={index} style={styles.concernItem}>
                    <Text style={styles.concernBullet}>•</Text>
                    <Text style={styles.concernText}>{concern}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.levelsGrid}>
            <View style={styles.levelCard}>
              <Text style={styles.levelEmoji}>🍌</Text>
              <Text style={styles.levelLabel}>{t("results.potassium")}</Text>
              <Text
                style={[
                  styles.levelValue,
                  {
                    color:
                      nutritionData.renalDiet.potassiumLevel === "high"
                        ? "#C62828"
                        : nutritionData.renalDiet.potassiumLevel === "moderate"
                        ? "#F57C00"
                        : "#2E7D32",
                  },
                ]}
              >
                {t(`results.${nutritionData.renalDiet.potassiumLevel}`)}
              </Text>
            </View>
            <View style={styles.levelCard}>
              <Text style={styles.levelEmoji}>🦴</Text>
              <Text style={styles.levelLabel}>{t("results.phosphorus")}</Text>
              <Text
                style={[
                  styles.levelValue,
                  {
                    color:
                      nutritionData.renalDiet.phosphorusLevel === "high"
                        ? "#C62828"
                        : nutritionData.renalDiet.phosphorusLevel === "moderate"
                        ? "#F57C00"
                        : "#2E7D32",
                  },
                ]}
              >
                {t(`results.${nutritionData.renalDiet.phosphorusLevel}`)}
              </Text>
            </View>
            <View style={styles.levelCard}>
              <Text style={styles.levelEmoji}>🧂</Text>
              <Text style={styles.levelLabel}>{t("results.sodium")}</Text>
              <Text
                style={[
                  styles.levelValue,
                  {
                    color:
                      nutritionData.renalDiet.sodiumLevel === "high"
                        ? "#C62828"
                        : nutritionData.renalDiet.sodiumLevel === "moderate"
                        ? "#F57C00"
                        : "#2E7D32",
                  },
                ]}
              >
                {t(`results.${nutritionData.renalDiet.sodiumLevel}`)}
              </Text>
            </View>
            <View style={styles.levelCard}>
              <Text style={styles.levelEmoji}>🥩</Text>
              <Text style={styles.levelLabel}>{t("results.protein")}</Text>
              <Text
                style={[
                  styles.levelValue,
                  {
                    color:
                      nutritionData.renalDiet.proteinLevel === "high"
                        ? "#C62828"
                        : nutritionData.renalDiet.proteinLevel === "moderate"
                        ? "#F57C00"
                        : "#2E7D32",
                  },
                ]}
              >
                {t(`results.${nutritionData.renalDiet.proteinLevel}`)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>{t("results.recommendation")}</Text>
          <Text style={styles.infoText}>{nutritionData.renalDiet.recommendation}</Text>
        </View>

        {nutritionData.renalDiet.warnings.length > 0 && (
          <View style={styles.warningsSection}>
            <Text style={styles.warningsTitle}>{t("results.warnings")}</Text>
            {nutritionData.renalDiet.warnings.map((warning, index) => (
              <View key={index} style={styles.warningItem}>
                <Text style={styles.warningBullet}>•</Text>
                <Text style={styles.warningText}>{warning}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>{t("results.modifications")}</Text>
          <Text style={styles.infoText}>{nutritionData.renalDiet.modifications}</Text>
        </View>

        {/* Recommended Portion Section */}
        {nutritionData.renalDiet.recommendedPortionGrams && (
          <View style={styles.portionSection}>
            <Text style={styles.portionTitle}>⚖️ {t("results.recommendedPortion")}</Text>
            <View style={styles.portionCard}>
              <Text style={styles.portionAmount}>{nutritionData.renalDiet.recommendedPortionGrams}g</Text>
              <Text style={styles.portionLabel}>{t("results.maxDailyAmount")}</Text>
            </View>
            <Text style={styles.portionNote}>{t("results.portionNote")}</Text>
          </View>
        )}

        {/* Additional Minerals Section */}
        {nutritionData.renalDiet.additionalMinerals && (
          <View style={styles.additionalMineralsSection}>
            <Text style={styles.infoTitle}>🧪 {t("results.additionalMinerals")}</Text>
            <View style={styles.mineralGrid}>
              <View style={styles.mineralCard}>
                <Text style={styles.mineralEmoji}>🪨</Text>
                <Text style={styles.mineralLabel}>{t("results.oxalates")}</Text>
                <Text style={styles.mineralValue}>{nutritionData.renalDiet.additionalMinerals.oxalates} mg</Text>
              </View>
              <View style={styles.mineralCard}>
                <Text style={styles.mineralEmoji}>🔬</Text>
                <Text style={styles.mineralLabel}>{t("results.purines")}</Text>
                <Text style={styles.mineralValue}>{nutritionData.renalDiet.additionalMinerals.purines} mg</Text>
              </View>
              <View style={styles.mineralCard}>
                <Text style={styles.mineralEmoji}>🧂</Text>
                <Text style={styles.mineralLabel}>{t("results.chloride")}</Text>
                <Text style={styles.mineralValue}>{nutritionData.renalDiet.additionalMinerals.chloride} mg</Text>
              </View>
              <View style={styles.mineralCard}>
                <Text style={styles.mineralEmoji}>💨</Text>
                <Text style={styles.mineralLabel}>{t("results.sulfur")}</Text>
                <Text style={styles.mineralValue}>{nutritionData.renalDiet.additionalMinerals.sulfur} mg</Text>
              </View>
            </View>
          </View>
        )}

        {/* Kidney-Specific Information */}
        {nutritionData.renalDiet.antioxidants?.hasAntioxidants || nutritionData.renalDiet.kidneySpecificInfo ? (
          <View style={styles.kidneyInfoSection}>
            <Text style={styles.infoTitle}>💙 {t("results.kidneySpecificInfo")}</Text>
            {nutritionData.renalDiet.kidneySpecificInfo && (
              <View>
                <View style={styles.kidneyInfoGrid}>
                  <View style={styles.kidneyInfoCard}>
                    <Text style={styles.kidneyInfoEmoji}>🩺</Text>
                    <Text style={styles.kidneyInfoLabel}>{t("results.dialysisFriendly")}</Text>
                    <Text
                      style={[
                        styles.kidneyInfoValue,
                        {
                          color: nutritionData.renalDiet.kidneySpecificInfo.isDialysisFriendly
                            ? "#2E7D32"
                            : "#C62828",
                        },
                      ]}
                    >
                      {nutritionData.renalDiet.kidneySpecificInfo.isDialysisFriendly
                        ? t("common.yes")
                        : t("common.no")}
                    </Text>
                  </View>

                  <View style={styles.kidneyInfoCard}>
                    <Text style={styles.kidneyInfoEmoji}>💧</Text>
                    <Text style={styles.kidneyInfoLabel}>{t("results.fluidContent")}</Text>
                    <Text style={styles.kidneyInfoValue}>
                      {nutritionData.renalDiet.kidneySpecificInfo.fluidContent}%
                    </Text>
                  </View>

                  <View style={styles.kidneyInfoCard}>
                    <Text style={styles.kidneyInfoEmoji}>⚡</Text>
                    <Text style={styles.kidneyInfoLabel}>{t("results.acidLoad")}</Text>
                    <Text
                      style={[
                        styles.kidneyInfoValue,
                        {
                          color:
                            nutritionData.renalDiet.kidneySpecificInfo.acidLoad === "high"
                              ? "#C62828"
                              : nutritionData.renalDiet.kidneySpecificInfo.acidLoad === "moderate"
                              ? "#F57C00"
                              : "#2E7D32",
                        },
                      ]}
                    >
                      {t(`results.${nutritionData.renalDiet.kidneySpecificInfo.acidLoad}`)}
                    </Text>
                  </View>
                </View>

                <View style={styles.ckdRecommendations}>
                  <Text style={styles.ckdTitle}>{t("results.ckdRecommendations")}</Text>
                  <Text style={styles.ckdText}>
                    {nutritionData.renalDiet.kidneySpecificInfo.ckdStageRecommendations}
                  </Text>
                </View>
              </View>
            )}

            {nutritionData.renalDiet.antioxidants?.hasAntioxidants && (
              <View style={styles.kidneyBenefitsSection}>
                <Text style={styles.infoTitle}>🛡️ {t("results.antioxidants")}</Text>
                {nutritionData.renalDiet.antioxidants.types.length > 0 && (
                  <View style={styles.antioxidantsContainer}>
                    <Text style={styles.antioxidantsSubtitle}>{t("results.typesPresent")}:</Text>
                    <View style={styles.antioxidantsList}>
                      {nutritionData.renalDiet.antioxidants.types.map((type, index) => (
                        <View key={index} style={styles.antioxidantTag}>
                          <Text style={styles.antioxidantText}>{type}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {nutritionData.renalDiet.antioxidants.kidneyBenefits.length > 0 && (
                  <View style={styles.benefitsContainer}>
                    <Text style={styles.benefitsSubtitle}>{t("results.kidneyBenefits")}:</Text>
                    {nutritionData.renalDiet.antioxidants.kidneyBenefits.map((benefit, index) => (
                      <View key={index} style={styles.benefitItem}>
                        <Text style={styles.benefitBullet}>•</Text>
                        <Text style={styles.benefitText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.primaryButton} onPress={scanAnother}>
            <View style={styles.buttonGradient}>
              <Text style={styles.primaryButtonText}>{t("results.scanAnotherFood")}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={goHome}>
            <Text style={styles.secondaryButtonText}>{t("results.backToHome")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={retryAnalysis}>
            <Text style={styles.secondaryButtonText}>{t("results.reAnalyze")}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t("results.disclaimer")}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  // Header Styles
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    backgroundColor: "#4CAF50",
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: "relative",
  },
  textSearchContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: "relative",
    padding: 16,
  },
  textSearchIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  searchTextDisplay: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 14,
  },
  foodImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#FF6B6B",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  weightBadge: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  foodName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  confidenceBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  confidenceText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Calories Card
  caloriesCard: {
    margin: 20,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  caloriesGradient: {
    padding: 30,
    alignItems: "center",
    backgroundColor: "#FFF3E0",
  },
  caloriesIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  caloriesNumber: {
    fontSize: 56,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginBottom: 5,
  },
  caloriesLabel: {
    fontSize: 20,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "600",
  },

  // Card Components
  nutrientCard: {
    backgroundColor: "#fff",
    margin: 20,
    marginTop: 10,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 15,
    backgroundColor: "#F8F9FA",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  cardContent: {
    padding: 20,
    paddingTop: 15,
  },

  // Macro Components
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  macroCard: {
    width: (screenWidth - 80) / 3 - 8, // 3 columns with gaps
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  macroIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  macroIcon: {
    fontSize: 20,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
    fontWeight: "600",
    textAlign: "center",
  },

  // Nutrient Display
  nutrientsGrid: {
    gap: 4,
  },
  nutrientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  nutrientLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  nutrientEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  nutrientLabel: {
    fontSize: 16,
    color: "#666",
    flex: 1,
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "right",
    minWidth: 80,
  },
  highlightMineral: {
    fontWeight: "bold",
    fontSize: 17,
  },

  // Renal Diet Card
  renalCard: {
    margin: 20,
    marginTop: 10,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  renalStatusCard: {
    padding: 16,
    margin: 16,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 16,
    alignItems: "center",
  },
  renalStatus: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Level Grid for Renal Diet
  levelsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  levelCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  levelEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  levelLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 4,
  },
  levelValue: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Info Sections
  infoSection: {
    padding: 16,
    margin: 24,
    marginTop: 8,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },

  // Warnings Section
  warningsSection: {
    padding: 16,
    margin: 24,
    marginTop: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#C62828",
  },
  warningsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C62828",
    marginBottom: 8,
  },
  warningItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  warningBullet: {
    fontSize: 16,
    color: "#C62828",
    marginRight: 8,
    fontWeight: "bold",
  },
  warningText: {
    fontSize: 14,
    color: "#C62828",
    lineHeight: 18,
    flex: 1,
  },

  // Action Buttons
  actionSection: {
    padding: 20,
    gap: 16,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#4CAF50",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Footer
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 20,
  },

  // Loading States
  loadingContainer: {
    alignItems: "center",
  },
  loadingText: {
    fontSize: 60,
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: "#666",
  },

  // Error States
  errorContainer: {
    alignItems: "center",
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Legacy styles (to be removed)
  headerSection: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  weightText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  caloriesSection: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  macroContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  macroItem: {
    alignItems: "center",
  },
  vitaminsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  vitaminTag: {
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  vitaminText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
  },
  nutritionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  nutritionLabel: {
    fontSize: 16,
    color: "#666",
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  renalStatusContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  levelsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  levelItem: {
    width: "48%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  recommendationContainer: {
    marginBottom: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  warningsContainer: {
    marginBottom: 12,
  },
  modificationsContainer: {
    marginTop: 8,
  },
  modificationsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  modificationsText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },

  // Antioxidants Styles
  antioxidantsContainer: {
    marginTop: 8,
  },
  antioxidantsSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  antioxidantsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  antioxidantTag: {
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  antioxidantText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  benefitsContainer: {
    marginTop: 8,
  },
  benefitsSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  benefitBullet: {
    fontSize: 14,
    color: "#4CAF50",
    marginRight: 8,
    marginTop: 2,
  },
  benefitText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    lineHeight: 18,
  },

  // Portion Styles
  portionSection: {
    backgroundColor: "#FFF3E0",
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#FF9800",
  },
  portionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E65100",
    marginBottom: 12,
    textAlign: "center",
  },
  portionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  portionAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#E65100",
    marginBottom: 4,
  },
  portionLabel: {
    fontSize: 14,
    color: "#666",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  portionNote: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },

  // Additional Minerals Styles
  additionalMineralsSection: {
    margin: 20,
    marginTop: 10,
    backgroundColor: "#F3E5F5",
    borderRadius: 16,
    padding: 16,
  },
  mineralGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  mineralCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mineralEmoji: {
    fontSize: 20,
    marginBottom: 6,
  },
  mineralLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 4,
    fontWeight: "600",
  },
  mineralValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },

  // Kidney-Specific Info Styles
  kidneyInfoSection: {
    margin: 20,
    marginTop: 10,
    backgroundColor: "#E3F2FD",
    borderRadius: 16,
    padding: 16,
  },
  kidneyInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 16,
  },
  kidneyInfoCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  kidneyInfoEmoji: {
    fontSize: 20,
    marginBottom: 6,
  },
  kidneyInfoLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 4,
    fontWeight: "600",
  },
  kidneyInfoValue: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  ckdRecommendations: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  ckdTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 8,
  },
  ckdText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },

  // Kidney Benefits Section
  kidneyBenefitsSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginTop: 16,
  },

  // Primary Concerns Styles
  primaryConcernsContainer: {
    marginTop: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    padding: 12,
    alignItems: "flex-start",
    width: "100%",
  },
  primaryConcernsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#D32F2F",
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  concernItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    width: "100%",
    paddingRight: 8,
  },
  concernBullet: {
    fontSize: 14,
    color: "#D32F2F",
    marginRight: 8,
    marginTop: 1,
    width: 12,
  },
  concernText: {
    fontSize: 13,
    color: "#D32F2F",
    flex: 1,
    lineHeight: 18,
    fontWeight: "500",
    textAlign: "left",
  },
});
