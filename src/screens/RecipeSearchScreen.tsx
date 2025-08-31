import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView } from "react-native";
import { Layout, Text, Input, Button, Card, Spinner } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import GeminiService from "../services/geminiService";
import { RecipeSearchResult } from "../types/nutrition";
import { RecipeSearchScreenProps } from "../types/navigation";

export default function RecipeSearchScreen({ navigation }: RecipeSearchScreenProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [recipes, setRecipes] = useState<RecipeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchRecipes = async () => {
    if (!searchQuery.trim()) {
      Alert.alert(t("recipeSearch.missingQuery"), t("recipeSearch.enterSearchQuery"));
      return;
    }

    setIsSearching(true);

    try {
      const results = await GeminiService.searchRenalFriendlyRecipes(searchQuery.trim());
      setRecipes(results);
    } catch (error) {
      console.error("Error searching recipes:", error);
      Alert.alert(
        "Recipe Search Error",
        "Failed to search recipes. Please try again.",
        [{ text: "OK" }]
      );
      Alert.alert(t("recipeSearch.searchFailed"), t("recipeSearch.tryAgain"));
    } finally {
      setIsSearching(false);
    }
  };

  const openRecipeDetails = (recipe: RecipeSearchResult) => {
    navigation.navigate("RecipeDetails", {
      recipeName: recipe.name,
      servings: recipe.servings,
    });
  };

  const quickSearchSuggestions = [
    "Gujarati dishes",
    "Low sodium Indian",
    "Kidney-friendly snacks",
    "Diabetic recipes",
    "Low potassium meals",
    "Mediterranean diet",
    "South Indian breakfast",
    "Punjabi vegetarian",
  ];

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

  const getRenalFriendlinessColor = (level: string) => {
    switch (level) {
      case "excellent":
        return "#4CAF50";
      case "good":
        return "#8BC34A";
      case "fair":
        return "#FFC107";
      default:
        return "#666";
    }
  };

  return (
    <Layout style={styles.container} level="1">
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        automaticallyAdjustKeyboardInsets={true}
      >
        <Layout style={styles.content} level="1">
          {/* Help Text */}
          <Layout style={styles.helpSection} level="1">
            <Text style={styles.helpTitle} category="s1" status="basic">
              {t("recipeSearch.tipsTitle")}
            </Text>
            <Text style={styles.helpText} category="c1" appearance="hint">
              {t("recipeSearch.tip1")}
            </Text>
            <Text style={styles.helpText} category="c1" appearance="hint">
              {t("recipeSearch.tip2")}
            </Text>
            <Text style={styles.helpText} category="c1" appearance="hint">
              {t("recipeSearch.tip3")}
            </Text>
          </Layout>

          {/* Search Input */}
          <Layout style={styles.searchSection} level="1">
            <Text style={styles.sectionTitle} category="s1" status="basic">
              {t("recipeSearch.recipeDescription")}
            </Text>
            <Input
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("recipeSearch.searchPlaceholder")}
              size="large"
              status="primary"
              multiline={true}
              textStyle={styles.multilineText}
            />

            {/* Quick Search Suggestions */}
            <Text style={styles.quickSelectLabel} category="s1" status="basic">
              {t("recipeSearch.quickSuggestions")}
            </Text>
            <Layout style={styles.suggestionContainer} level="1">
              {quickSearchSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  style={styles.suggestionButton}
                  status={searchQuery === suggestion ? "primary" : "basic"}
                  appearance={searchQuery === suggestion ? "filled" : "outline"}
                  size="small"
                  onPress={() => setSearchQuery(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </Layout>

            {/* Search Button */}
            <Button
              style={styles.searchButton}
              status="primary"
              size="large"
              onPress={searchRecipes}
              disabled={!searchQuery.trim() || isSearching}
              accessoryLeft={isSearching ? () => <Spinner size="small" status="control" /> : undefined}
            >
              {isSearching ? t("recipeSearch.searching") : t("recipeSearch.searchButton")}
            </Button>
          </Layout>

          {/* Results */}
          {recipes.length > 0 && (
            <Layout style={styles.resultsSection} level="1">
              <Text style={styles.resultsTitle} category="h6">
                {t("recipeSearch.resultsTitle")} ({recipes.length})
              </Text>

              {recipes.map((recipe, index) => (
                <Card key={index} style={styles.recipeCard} onPress={() => openRecipeDetails(recipe)}>
                  <Layout style={styles.recipeHeader} level="1">
                    <Text style={styles.recipeName} category="h6">
                      {recipe.name}
                    </Text>
                    <Layout style={styles.recipeBadges} level="1">
                      {/* <Layout
                        style={[styles.badge, { backgroundColor: getDifficultyColor(recipe.difficulty) + "20" }]}
                        level="1"
                      >
                        <Text style={[styles.badgeText, { color: getDifficultyColor(recipe.difficulty) }]}>
                          {t(`recipeSearch.${recipe.difficulty}`)}
                        </Text>
                      </Layout> */}
                      <Layout
                        style={[
                          styles.badge,
                          { backgroundColor: getRenalFriendlinessColor(recipe.renalFriendliness) + "20" },
                        ]}
                        level="1"
                      >
                        <Text
                          style={[styles.badgeText, { color: getRenalFriendlinessColor(recipe.renalFriendliness) }]}
                        >
                          {t(`recipeSearch.${recipe.renalFriendliness}`)}
                        </Text>
                      </Layout>
                    </Layout>
                  </Layout>

                  <Text style={styles.recipeDescription} category="s1" appearance="hint">
                    {recipe.description}
                  </Text>

                  <Layout style={styles.recipeInfo} level="1">
                    <Layout style={styles.infoItem} level="1">
                      <Text style={styles.infoIcon}>⏱️</Text>
                      <Text style={styles.infoText} category="c1">
                        {recipe.cookingTime}
                      </Text>
                    </Layout>
                    <Layout style={styles.infoItem} level="1">
                      <Text style={styles.infoIcon}>👥</Text>
                      <Text style={styles.infoText} category="c1">
                        {recipe.servings} {t("recipeSearch.servings")}
                      </Text>
                    </Layout>
                    <Layout style={styles.infoItem} level="1">
                      <Text style={styles.infoIcon}>🍽️</Text>
                      <Text style={styles.infoText} category="c1">
                        {recipe.cuisineType}
                      </Text>
                    </Layout>
                  </Layout>

                  <Layout style={styles.nutritionPreview} level="1">
                    <Text style={styles.nutritionTitle} category="s2">
                      {t("recipeSearch.nutritionPreview")}:
                    </Text>
                    <Layout style={styles.nutritionTags} level="1">
                      <Layout style={[styles.nutritionTag, { backgroundColor: "#E8F5E8" }]} level="1">
                        <Text style={[styles.nutritionTagText, { color: "#4CAF50" }]}>
                          🍌 K: {t(`recipeSearch.${recipe.estimatedNutrition.potassium}`)}
                        </Text>
                      </Layout>
                      <Layout style={[styles.nutritionTag, { backgroundColor: "#FFF3E0" }]} level="1">
                        <Text style={[styles.nutritionTagText, { color: "#FF9800" }]}>
                          🦴 P: {t(`recipeSearch.${recipe.estimatedNutrition.phosphorus}`)}
                        </Text>
                      </Layout>
                      <Layout style={[styles.nutritionTag, { backgroundColor: "#E3F2FD" }]} level="1">
                        <Text style={[styles.nutritionTagText, { color: "#2196F3" }]}>
                          🧂 Na: {t(`recipeSearch.${recipe.estimatedNutrition.sodium}`)}
                        </Text>
                      </Layout>
                    </Layout>
                  </Layout>

                  {recipe.keyBenefits.length > 0 && (
                    <Layout style={styles.benefitsContainer} level="1">
                      <Text style={styles.benefitsTitle} category="s2">
                        {t("recipeSearch.keyBenefits")}:
                      </Text>
                      <Layout style={styles.benefitsList} level="1">
                        {recipe.keyBenefits.slice(0, 2).map((benefit, benefitIndex) => (
                          <Text key={benefitIndex} style={styles.benefitItem} category="c1">
                            • {benefit}
                          </Text>
                        ))}
                      </Layout>
                    </Layout>
                  )}
                </Card>
              ))}
            </Layout>
          )}
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
  content: {
    padding: 20,
  },
  headerCard: {
    marginBottom: 20,
  },
  headerContent: {
    alignItems: "center",
    padding: 10,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
  },
  searchSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: "600",
  },
  searchInput: {
    marginBottom: 16,
    minHeight: 80,
  },
  multilineText: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  quickSelectLabel: {
    marginBottom: 12,
    fontWeight: "600",
  },
  suggestionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  suggestionButton: {
    marginBottom: 8,
    marginRight: 4,
  },
  searchButton: {
    marginBottom: 16,
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultsTitle: {
    marginBottom: 16,
    color: "#333",
    fontWeight: "bold",
  },
  recipeCard: {
    marginBottom: 16,
    padding: 0,
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  recipeName: {
    flex: 1,
    marginRight: 8,
  },
  recipeBadges: {
    flexDirection: "row",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  recipeDescription: {
    marginBottom: 12,
    lineHeight: 18,
  },
  recipeInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 7,
    borderRadius: 8,
    backgroundColor: "rgba(255, 254, 207, 1)",
  },
  infoIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#666",
  },
  nutritionPreview: {
    marginBottom: 12,
  },
  nutritionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  nutritionTags: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  nutritionTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nutritionTagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  benefitsContainer: {
    marginTop: 8,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  benefitsList: {
    marginLeft: 8,
  },
  benefitItem: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  helpSection: {
    padding: 16,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.2)",
    marginBottom: 18,
  },
  helpTitle: {
    marginBottom: 8,
    fontWeight: "600",
    color: "#2E7D32",
  },
  helpText: {
    marginBottom: 4,
    lineHeight: 18,
  },
});
