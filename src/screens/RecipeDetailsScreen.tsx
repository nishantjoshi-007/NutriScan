import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, Alert, View } from "react-native";
import { Layout, Text, Button, Card, Spinner } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import GeminiService from "../services/geminiService";
import { RecipeDetails } from "../types/nutrition";
import { RecipeDetailsScreenProps } from "../types/navigation";

export default function RecipeDetailsScreen({ navigation, route }: RecipeDetailsScreenProps) {
  const { t } = useTranslation();
  const { recipeName, servings } = route.params;
  const [recipeDetails, setRecipeDetails] = useState<RecipeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecipeDetails();
  }, [recipeName, servings]);

  const fetchRecipeDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const details = await GeminiService.getRecipeDetails(recipeName, servings);
      setRecipeDetails(details);
    } catch (error) {
      console.error("Error fetching recipe details:", error);
      Alert.alert(
        "Recipe Error",
        "Failed to fetch recipe details. Please try again.",
        [{ text: "OK" }]
      );
      setError(t("recipeDetails.loadingFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const viewNutritionAnalysis = () => {
    if (!recipeDetails) return;

    navigation.navigate("Results", {
      imageUri: "", // No image for recipes
      weight: 100, // Per serving weight (placeholder)
      calories: recipeDetails.nutritionPerServing.calories,
      confidence: 1, // High confidence for detailed recipes
      searchText: `Recipe: ${recipeDetails.name}`,
      nutritionData: recipeDetails.nutritionPerServing,
      summary: {
        macros: recipeDetails.nutritionPerServing.macros,
        vitamins: [],
        minerals: [],
        warnings: recipeDetails.nutritionPerServing.renalDiet.warnings || [],
        tips: recipeDetails.renalModifications || [],
      },
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "#4CAF50";
      case "medium":
        return "#FF9800";
      case "hard":
        return "#F44336";
      default:
        return "#666";
    }
  };

  if (isLoading) {
    return (
      <Layout style={styles.container} level="1">
        <Layout style={styles.centerContent} level="1">
          <Spinner size="giant" />
          <Text style={styles.loadingText} category="h6">
            {t("recipeDetails.loadingRecipe")}
          </Text>
          <Text style={styles.loadingSubtext} category="s1" appearance="hint">
            {t("recipeDetails.loadingSubtext")}
          </Text>
        </Layout>
      </Layout>
    );
  }

  if (error || !recipeDetails) {
    return (
      <Layout style={styles.container} level="1">
        <Layout style={styles.centerContent} level="1">
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorTitle} category="h6">
            {t("recipeDetails.loadingFailed")}
          </Text>
          <Text style={styles.errorText} category="s1" appearance="hint">
            {error || t("recipeDetails.tryAgain")}
          </Text>
          <Button style={styles.retryButton} status="primary" onPress={fetchRecipeDetails}>
            {t("recipeDetails.retry")}
          </Button>
        </Layout>
      </Layout>
    );
  }

  return (
    <Layout style={styles.container} level="1">
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Layout style={styles.headerContent} level="1">
            <Text style={styles.recipeName} category="h4">
              {recipeDetails.name}
            </Text>
            <Text style={styles.recipeDescription} category="s1" appearance="hint">
              {recipeDetails.description}
            </Text>

            <Layout style={styles.headerInfo} level="1">
              <Layout style={styles.infoRow} level="1">
                <Layout style={styles.infoItem} level="1">
                  <Text style={styles.infoIcon}>⏱️</Text>
                  <Text style={styles.infoText}>{recipeDetails.totalTime}</Text>
                </Layout>
                <Layout style={styles.infoItem} level="1">
                  <Text style={styles.infoIcon}>👥</Text>
                  <Text style={styles.infoText}>
                    {recipeDetails.servings} {t("recipeDetails.servings")}
                  </Text>
                </Layout>
                <Layout
                  style={[styles.badge, { backgroundColor: getDifficultyColor(recipeDetails.difficulty) + "20" }]}
                  level="1"
                >
                  <Text style={[styles.badgeText, { color: getDifficultyColor(recipeDetails.difficulty) }]}>
                    {t(`recipeDetails.${recipeDetails.difficulty}`)}
                  </Text>
                </Layout>
              </Layout>
            </Layout>
          </Layout>
        </Card>

        {/* Nutrition Quick Overview */}
        <Card style={styles.nutritionCard}>
          <Text style={styles.sectionTitle} category="h6">
            {t("recipeDetails.nutritionOverview")}
          </Text>
          <Layout style={styles.nutritionOverview} level="1">
            <Layout style={styles.caloriesContainer} level="1">
              <Text style={styles.caloriesNumber}>{recipeDetails.nutritionPerServing.calories}</Text>
              <Text style={styles.caloriesLabel}>{t("recipeDetails.caloriesPerServing")}</Text>
            </Layout>
            <Layout style={styles.renalStatusContainer} level="1">
              <Text
                style={[
                  styles.renalStatus,
                  {
                    color:
                      (recipeDetails.nutritionPerServing.renalDiet.overallSafetyFlag || "safe") === "safe"
                        ? "#4CAF50"
                        : (recipeDetails.nutritionPerServing.renalDiet.overallSafetyFlag || "safe") === "caution"
                        ? "#FF9800"
                        : "#F44336",
                  },
                ]}
              >
                {(recipeDetails.nutritionPerServing.renalDiet.overallSafetyFlag || "safe") === "safe"
                  ? "✅ " + t("recipeDetails.kidneyFriendly")
                  : (recipeDetails.nutritionPerServing.renalDiet.overallSafetyFlag || "safe") === "caution"
                  ? "⚠️ " + t("recipeDetails.useCaution")
                  : "🚫 " + t("recipeDetails.avoid")}
              </Text>
            </Layout>
          </Layout>
          <Button
            style={styles.detailedNutritionButton}
            status="primary"
            appearance="outline"
            onPress={viewNutritionAnalysis}
          >
            {t("recipeDetails.viewDetailedNutrition")}
          </Button>
        </Card>

        {/* Ingredients */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle} category="h6">
            {t("recipeDetails.ingredients")}
          </Text>
          {recipeDetails.ingredients.map((ingredient, index) => (
            <Layout key={index} style={styles.ingredientItem} level="1">
              <Text style={styles.ingredientBullet}>•</Text>
              <Layout style={styles.ingredientContent} level="1">
                <Text style={styles.ingredientText}>
                  <Text style={styles.ingredientAmount}>{ingredient.amount}</Text> {ingredient.name}
                </Text>
                {ingredient.notes && (
                  <Text style={styles.ingredientNotes} category="c1" appearance="hint">
                    💡 {ingredient.notes}
                  </Text>
                )}
              </Layout>
            </Layout>
          ))}
        </Card>

        {/* Instructions */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle} category="h6">
            {t("recipeDetails.instructions")}
          </Text>
          {recipeDetails.instructions.map((instruction, index) => (
            <Layout key={index} style={styles.instructionItem} level="1">
              <Text style={styles.stepNumber}>{index + 1}</Text>
              <Text style={styles.instructionText}>{instruction}</Text>
            </Layout>
          ))}
        </Card>

        {/* Renal Diet Modifications */}
        {recipeDetails.renalModifications && recipeDetails.renalModifications.length > 0 && (
          <Card style={styles.modificationsCard}>
            <Text style={styles.sectionTitle} category="h6">
              🏥 {t("recipeDetails.renalModifications")}
            </Text>
            {recipeDetails.renalModifications.map((modification, index) => (
              <Layout key={index} style={styles.modificationItem} level="1">
                <Text style={styles.modificationBullet}>•</Text>
                <Text style={styles.modificationText}>{modification}</Text>
              </Layout>
            ))}
          </Card>
        )}

        {/* Tips & Storage */}
        <Layout style={styles.tipsSection} level="1">
          {recipeDetails.tips && recipeDetails.tips.length > 0 && (
            <Card style={styles.tipsCard}>
              <Text style={styles.sectionTitle} category="h6">
                💡 {t("recipeDetails.cookingTips")}
              </Text>
              {recipeDetails.tips.map((tip, index) => (
                <Text key={index} style={styles.tipItem} category="s1">
                  • {tip}
                </Text>
              ))}
            </Card>
          )}

          {recipeDetails.storage && (
            <Card style={styles.storageCard}>
              <Text style={styles.sectionTitle} category="h6">
                🥶 {t("recipeDetails.storage")}
              </Text>
              <Text style={styles.storageText} category="s1">
                {recipeDetails.storage}
              </Text>
            </Card>
          )}
        </Layout>

        {/* Action Buttons */}
        <Layout style={styles.actionSection} level="1">
          <Button style={styles.primaryButton} status="primary" size="large" onPress={viewNutritionAnalysis}>
            {t("recipeDetails.analyzeNutrition")}
          </Button>

          <Button
            style={styles.secondaryButton}
            status="basic"
            appearance="outline"
            onPress={() => navigation.goBack()}
          >
            {t("recipeDetails.backToSearch")}
          </Button>
        </Layout>

        <Layout style={styles.footer} level="1">
          <Text style={styles.footerText} category="c1" appearance="hint">
            {t("recipeDetails.disclaimer")}
          </Text>
        </Layout>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  loadingText: {
    marginTop: 16,
    textAlign: "center",
  },
  loadingSubtext: {
    marginTop: 8,
    textAlign: "center",
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  errorTitle: {
    textAlign: "center",
    marginBottom: 8,
  },
  errorText: {
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    minWidth: 120,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerContent: {
    padding: 0,
  },
  recipeName: {
    textAlign: "center",
    marginBottom: 8,
    color: "#333",
  },
  recipeDescription: {
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  headerInfo: {
    alignItems: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  nutritionCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    color: "#333",
    fontWeight: "bold",
  },
  nutritionOverview: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 16,
  },
  caloriesContainer: {
    alignItems: "center",
  },
  caloriesNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  caloriesLabel: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
  },
  renalStatusContainer: {
    alignItems: "center",
  },
  renalStatus: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  detailedNutritionButton: {
    marginTop: 8,
  },
  sectionCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  ingredientItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  ingredientBullet: {
    fontSize: 16,
    color: "#4CAF50",
    marginRight: 8,
    marginTop: 2,
  },
  ingredientContent: {
    flex: 1,
  },
  ingredientText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ingredientAmount: {
    fontWeight: "600",
    color: "#333",
  },
  ingredientNotes: {
    marginTop: 2,
    fontStyle: "italic",
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 24,
    marginRight: 12,
    marginTop: 2,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
  },
  modificationsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#FFF3E0",
    borderColor: "#FF9800",
    borderWidth: 1,
  },
  modificationItem: {
    flexDirection: "row",
    marginBottom: 8,
    backgroundColor: "#FFF3E0",
  },
  modificationBullet: {
    fontSize: 16,
    color: "#333",
    backgroundColor: "#FFF3E0",
    marginRight: 8,
    marginTop: 2,
  },
  modificationText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    backgroundColor: "#FFF3E0",
    color: "#333",
  },
  tipsSection: {
    marginHorizontal: 16,
  },
  tipsCard: {
    marginBottom: 8,
  },
  tipItem: {
    marginBottom: 6,
    lineHeight: 18,
  },
  storageCard: {
    marginBottom: 8,
  },
  storageText: {
    lineHeight: 20,
  },
  actionSection: {
    margin: 16,
    gap: 12,
  },
  primaryButton: {
    marginBottom: 8,
  },
  secondaryButton: {
    marginBottom: 8,
  },
  footer: {
    padding: 16,
    alignItems: "center",
  },
  footerText: {
    textAlign: "center",
    lineHeight: 18,
  },
});
