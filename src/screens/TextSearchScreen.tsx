import React, { useState } from "react";
import { View, StyleSheet, Alert, ScrollView, SafeAreaView } from "react-native";
import { Layout, Text, Input, Button, Card, Spinner } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import GeminiService from "../services/geminiService";
import searchHistoryService from "../services/searchHistoryService";
import { TextSearchScreenProps } from "../types/navigation";

export default function TextSearchScreen({ navigation }: TextSearchScreenProps) {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const [weight, setWeight] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleWeightChange = (text: string) => {
    // Only allow numbers and one decimal point
    const numericText = text.replace(/[^0-9.]/g, "");
    const decimalCount = (numericText.match(/\./g) || []).length;

    if (decimalCount <= 1) {
      setWeight(numericText);
    }
  };

  const analyzeFood = async () => {
    if (!searchText.trim()) {
      Alert.alert(t("textSearch.missingInformation"), t("textSearch.enterFoodDescription"));
      return;
    }

    const weightValue = parseFloat(weight) || 100; // Default to 100g if no weight provided

    if (weightValue <= 0 || weightValue > 5000) {
      Alert.alert(t("textSearch.invalidWeight"), t("textSearch.weightRange"));
      return;
    }

    setIsProcessing(true);

    try {
      navigation.navigate("Results", {
        imageUri: "", // No image for text search
        weight: weightValue,
        calories: 0, // Will be calculated in ResultsScreen
        confidence: 0, // Will be calculated in ResultsScreen
        searchText: searchText.trim(), // Pass the search text
        summary: {
          macros: {
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
          },
          vitamins: [],
          minerals: [],
          warnings: [],
          tips: [],
        },
        nutritionData: null, // Will be calculated in ResultsScreen
      });
    } catch (error) {
      console.error("Error proceeding to analysis:", error);
      Alert.alert(
        "Analysis Error",
        "Failed to proceed to analysis. Please try again.",
        [{ text: "OK" }]
      );
      Alert.alert(t("textSearch.error"), t("textSearch.analysisError"));
    } finally {
      setIsProcessing(false);
    }
  };

  const renderUnitAccessory = () => (
    <Text category="s1" appearance="hint">
      {t("textSearch.grams")}
    </Text>
  );

  const quickFoodSuggestions = [
    "Apple, medium",
    "Banana, large",
    "Rice, cooked",
    "Broccoli, steamed",
    "Greek yogurt",
    "Whole wheat bread",
    "Avocado, half",
    "Sweet potato, baked",
  ];

  const quickWeightSuggestions = [
    { label: "50g", value: 50 },
    { label: "100g", value: 100 },
    { label: "150g", value: 150 },
    { label: "200g", value: 200 },
    { label: "250g", value: 250 },
    { label: "300g", value: 300 },
  ];

  return (
    <Layout style={styles.container} level="1">
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
      >
        <Layout style={styles.content} level="1">
          {/* Help Text */}
          <Layout style={styles.helpSection} level="1">
            <Text style={styles.helpTitle} category="s1" status="basic">
              {t("textSearch.tipsTitle")}
            </Text>
            <Text style={styles.helpText} category="c1" appearance="hint">
              {t("textSearch.tip1")}
            </Text>
            <Text style={styles.helpText} category="c1" appearance="hint">
              {t("textSearch.tip2")}
            </Text>
            <Text style={styles.helpText} category="c1" appearance="hint">
              {t("textSearch.tip3")}
            </Text>
            <Text style={styles.helpText} category="c1" appearance="hint">
              {t("textSearch.tip4")}
            </Text>
          </Layout>

          {/* Food Description Input */}
          <Layout style={styles.inputSection} level="1">
            <Text style={styles.sectionTitle} category="s1" status="basic">
              {t("textSearch.foodDescription")}
            </Text>
            <Input
              style={styles.foodInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder={t("textSearch.foodPlaceholder")}
              multiline={true}
              textStyle={styles.multilineText}
              size="large"
              status="primary"
            />

            {/* Quick Food Suggestions */}
            <Text style={styles.quickSelectLabel} category="s1" status="basic">
              {t("textSearch.quickSuggestions")}
            </Text>
            <Layout style={styles.suggestionContainer} level="1">
              {quickFoodSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  style={styles.suggestionButton}
                  status={searchText === suggestion ? "primary" : "basic"}
                  appearance={searchText === suggestion ? "filled" : "outline"}
                  size="small"
                  onPress={() => setSearchText(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </Layout>
          </Layout>

          {/* Weight Input */}
          <Layout style={styles.inputSection} level="1">
            <Text style={styles.sectionTitle} category="s1" status="basic">
              {t("textSearch.weight")}
            </Text>
            <Text style={styles.sectionSubtitle} category="c1" appearance="hint">
              {t("textSearch.weightSubtitle")}
            </Text>
            <Input
              style={styles.weightInput}
              value={weight}
              onChangeText={handleWeightChange}
              placeholder="100"
              keyboardType="numeric"
              maxLength={6}
              accessoryRight={renderUnitAccessory}
              size="large"
              status="primary"
            />

            {/* Quick Weight Buttons */}
            <Text style={styles.quickSelectLabel} category="s1" status="basic">
              {t("textSearch.quickSelect")}
            </Text>
            <Layout style={styles.quickButtonsContainer} level="1">
              {quickWeightSuggestions.map((button) => (
                <Button
                  key={button.value}
                  style={styles.quickButton}
                  status={weight === button.value.toString() ? "primary" : "basic"}
                  appearance={weight === button.value.toString() ? "filled" : "outline"}
                  size="small"
                  onPress={() => setWeight(button.value.toString())}
                >
                  {button.label}
                </Button>
              ))}
            </Layout>
          </Layout>

          {/* Search Button */}
          <Button
            style={styles.searchButton}
            status="primary"
            size="large"
            onPress={analyzeFood}
            disabled={!searchText.trim() || isProcessing}
            accessoryLeft={isProcessing ? () => <Spinner size="small" status="control" /> : undefined}
          >
            {isProcessing ? t("textSearch.analyzing") : t("textSearch.analyzeNutrition")}
          </Button>
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
  inputSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: "600",
  },
  sectionSubtitle: {
    marginBottom: 12,
    fontStyle: "italic",
  },
  foodInput: {
    marginBottom: 16,
    minHeight: 80,
  },
  multilineText: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  weightInput: {
    marginBottom: 16,
  },
  quickSelectLabel: {
    marginBottom: 12,
    fontWeight: "600",
  },
  suggestionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionButton: {
    marginBottom: 8,
    marginRight: 4,
  },
  quickButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickButton: {
    width: "30%",
    marginBottom: 8,
  },
  searchButton: {
    marginBottom: 24,
  },
  helpSection: {
    padding: 16,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.2)",
    marginBottom: 24,
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
