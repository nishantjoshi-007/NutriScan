import React, { useState, useCallback, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
  Text,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { DailyFoodLog, FoodLogEntry, FoodLogCardProps, DailyLogCardProps } from "../types/foodLog";
import { FoodLogScreenProps } from "../types/navigation";
import foodLogService from "../services/foodLogService";
import searchHistoryService from "../services/searchHistoryService";
import GeminiService from "../services/geminiService";
import SearchHistoryModal from "../components/SearchHistoryModal";

export default function FoodLogScreen({ navigation }: FoodLogScreenProps) {
  const { t } = useTranslation();
  const [dailyLogs, setDailyLogs] = useState<DailyFoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyzingFood, setAnalyzingFood] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  const FoodLogCard: React.FC<FoodLogCardProps> = ({ entry, onPress, onDelete }) => (
    <View style={styles.foodLogCardContainer}>
      <TouchableOpacity style={styles.foodLogCard} onPress={onPress}>
        <View style={styles.cardContent}>
          <View style={styles.foodInfo}>
            <Text style={styles.foodName}>{entry.foodName}</Text>
            <Text style={styles.foodWeight}>
              {entry.weight} {t("foodLog.grams")}
            </Text>
          </View>

          <View style={styles.nutrientsContainer}>
            <View style={styles.nutrientItem}>
              <Text style={styles.nutrientLabel}>{t("foodLog.potassiumShort")}</Text>
              <Text style={[styles.nutrientValue, styles.potassiumValue]}>
                {entry.potassium} {t("foodLog.milligrams")}
              </Text>
            </View>
            <View style={styles.nutrientItem}>
              <Text style={styles.nutrientLabel}>{t("foodLog.phosphorusShort")}</Text>
              <Text style={[styles.nutrientValue, styles.phosphorusValue]}>
                {entry.phosphorus} {t("foodLog.milligrams")}
              </Text>
            </View>
            <View style={styles.nutrientItem}>
              <Text style={styles.nutrientLabel}>{t("foodLog.sodiumShort")}</Text>
              <Text style={[styles.nutrientValue, styles.sodiumValue]}>
                {entry.sodium} {t("foodLog.milligrams")}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  const DailyLogCard: React.FC<DailyLogCardProps> = ({ dailyLog, onEntryPress, onEntryDelete }) => {
    const totalCalories = dailyLog.totalNutrients.calories;
    const totalPotassium = dailyLog.totalNutrients.potassium;
    const totalPhosphorus = dailyLog.totalNutrients.phosphorus;
    const totalSodium = dailyLog.totalNutrients.sodium;

    return (
      <View style={styles.dailyLogCard}>
        <View style={styles.dailyHeader}>
          <Text style={styles.dateText}>{foodLogService.formatDate(dailyLog.date, t)}</Text>
          <View style={styles.dailyTotals}>
            <Text style={styles.totalCalories}>
              {totalCalories} {t("foodLog.cal")}
            </Text>
          </View>
        </View>

        <View style={styles.dailyNutrients}>
          <Text style={styles.dailyNutrient}>
            {t("foodLog.potassiumShort")} {totalPotassium} {t("foodLog.milligrams")}
          </Text>
          <Text style={styles.dailyNutrient}>
            {t("foodLog.phosphorusShort")} {totalPhosphorus} {t("foodLog.milligrams")}
          </Text>
          <Text style={styles.dailyNutrient}>
            {t("foodLog.sodiumShort")} {totalSodium} {t("foodLog.milligrams")}
          </Text>
        </View>

        <View style={styles.entriesContainer}>
          {dailyLog.entries.map((entry) => (
            <FoodLogCard
              key={entry.id}
              entry={entry}
              onPress={() => onEntryPress(entry)}
              onDelete={() => onEntryDelete(entry.id)}
            />
          ))}
        </View>
      </View>
    );
  };

  const loadFoodLogs = async () => {
    try {
      const logs = await foodLogService.getDailyFoodLogs();
      setDailyLogs(logs);
    } catch (error) {
      console.error("Failed to load food logs:", error);
      Alert.alert(
        "Food Log Error",
        "Failed to load food logs. Please try again later.",
        [{ text: "OK" }]
      );
      Alert.alert(t("common.error"), t("foodLog.failedToLoadLogs"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFoodLogs();
    }, [t])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.headerButton} onPress={handleAddPress}>
          <Text style={styles.headerButtonText}>+</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFoodLogs();
  };

  const handleEntryPress = async (entry: FoodLogEntry) => {
    try {
      const fullNutritionData = await foodLogService.getFullNutritionData(entry);

      if (fullNutritionData) {
        // Navigate to Results screen with full nutrition data
        navigation.navigate("Results", {
          imageUri: "", // No image available for food log entries
          calories: entry.calories, // Use actual calories from the entry
          weight: entry.weight,
          confidence: 1, // Assume high confidence for logged items
          summary: {
            macros: fullNutritionData.macros,
            vitamins: [], // We'll populate this if needed
            minerals: [], // We'll populate this if needed
            warnings: fullNutritionData.renalDiet.warnings,
            tips: [fullNutritionData.renalDiet.modifications],
          },
          nutritionData: fullNutritionData,
          searchText: entry.foodName,
        });
      } else {
        // Show basic info if no full data available
        Alert.alert(
          entry.foodName,
          `${t("foodLog.weight")} ${entry.weight}${t("foodLog.grams")}\n${t("foodLog.calories")} ${
            entry.calories
          } ${t("foodLog.cal")}\n${t("foodLog.potassium")} ${entry.potassium}${t("foodLog.milligrams")}\n${t(
            "foodLog.phosphorus"
          )} ${entry.phosphorus}${t("foodLog.milligrams")}\n${t("foodLog.sodium")} ${entry.sodium}${t(
            "foodLog.milligrams"
          )}`,
          [{ text: t("common.ok") }]
        );
      }
    } catch (error) {
      console.error("Failed to get nutrition data:", error);
      Alert.alert(
        "Nutrition Data Error",
        "Failed to get nutrition data. Please try again later.",
        [{ text: "OK" }]
      );
      Alert.alert(t("common.error"), t("foodLog.failedToLoadNutrition"));
    }
  };

  const handleEntryDelete = (entryId: string) => {
    Alert.alert(t("foodLog.deleteEntry"), t("foodLog.deleteEntryConfirm"), [
      { text: t("home.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await foodLogService.deleteFoodEntry(entryId);
            loadFoodLogs(); // Refresh the list
          } catch (error) {
            console.error("Failed to delete entry:", error);
            Alert.alert(
              "Delete Error",
              "Failed to delete entry. Please try again.",
              [{ text: "OK" }]
            );
            Alert.alert(t("common.error"), t("foodLog.failedToDeleteEntry"));
          }
        },
      },
    ]);
  };

  const handleAddPress = () => {
    Alert.alert(t("foodLog.addFoodEntry"), t("foodLog.howToAddFood"), [
      { text: t("foodLog.fromHistory"), onPress: handleAddFromHistory },
      { text: t("foodLog.manualEntry"), onPress: handleManualEntry },
      { text: t("home.cancel"), style: "cancel" },
    ]);
  };

  const handleManualEntry = () => {
    Alert.prompt(t("foodLog.addFoodManually"), t("foodLog.enterFoodName"), [
      { text: t("home.cancel"), style: "cancel" },
      {
        text: t("foodLog.next"),
        onPress: (foodName) => {
          if (foodName && foodName.trim()) {
            handleDateSelection(foodName.trim());
          }
        },
      },
    ]);
  };

  const handleDateSelection = (foodName: string) => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);

    Alert.alert(t("foodLog.selectDate"), t("foodLog.whenDidYouEat"), [
      { text: t("foodLog.today"), onPress: () => handleWeightEntry(foodName, today.toISOString().split("T")[0]) },
      {
        text: t("foodLog.yesterday"),
        onPress: () => handleWeightEntry(foodName, yesterday.toISOString().split("T")[0]),
      },
      { text: t("home.cancel"), style: "cancel" },
    ]);
  };

  const handleAddFromHistory = async () => {
    try {
      const history = await searchHistoryService.getSearchHistory();
      if (history.length === 0) {
        Alert.alert(t("foodLog.noHistory"), t("foodLog.noHistoryMessage"));
        return;
      }

      setSearchModalVisible(true);
    } catch (error) {
      console.error("Failed to load history:", error);
      Alert.alert(
        "History Load Error",
        "Failed to load search history. Please try again later.",
        [{ text: "OK" }]
      );
      Alert.alert(t("common.error"), t("foodLog.failedToLoadHistory"));
    }
  };

  const handleHistoryItemSelect = (selectedItem: any) => {
    // Ask for date selection
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    Alert.alert(t("foodLog.selectDate"), t("foodLog.whenDidYouEat"), [
      {
        text: t("foodLog.today"),
        onPress: () => handleWeightEntry(selectedItem.foodName, today),
      },
      {
        text: t("foodLog.yesterday"),
        onPress: () => handleWeightEntry(selectedItem.foodName, yesterday),
      },
      { text: t("home.cancel"), style: "cancel" },
    ]);
  };

  const handleWeightEntry = (foodName: string, selectedDate: string) => {
    Alert.prompt(
      t("foodLog.addFoodManually"),
      `${t("foodLog.enterWeightFor")} "${foodName}" (${t("foodLog.weightExample")}):`,
      [
        { text: t("home.cancel"), style: "cancel" },
        {
          text: t("foodLog.add"),
          onPress: (weightInput) => {
            if (weightInput && weightInput.trim()) {
              handleAddManualFood(foodName, weightInput.trim(), selectedDate);
            }
          },
        },
      ]
    );
  };

  const handleAddManualFood = async (foodName: string, weightInput: string, selectedDate?: string) => {
    try {
      // Parse weight input (e.g., "150g", "200ml", "150")
      const weightMatch = weightInput.match(/^(\d+(?:\.\d+)?)\s*(g|ml)?$/i);
      if (!weightMatch) {
        Alert.alert(t("foodLog.invalidInput"), t("foodLog.enterWeightFormat"));
        return;
      }

      const weight = parseFloat(weightMatch[1]);
      const unit = weightMatch[2]?.toLowerCase() || "g"; // Default to grams if no unit specified

      if (isNaN(weight) || weight <= 0) {
        Alert.alert(t("foodLog.invalidInput"), t("foodLog.enterValidWeight"));
        return;
      }

      // Set loading state
      setAnalyzingFood(true);

      // Analyze food using Gemini
      const nutritionData = await GeminiService.analyzeFoodFromText(foodName, weight, unit);

      // Create search history entry
      const historyItem = {
        imageUri: "", // No image for manual entry
        weight,
        foodName,
        calories: nutritionData.calories,
        confidence: nutritionData.confidence || 0.8,
        searchText: foodName,
        nutritionData: {
          macros: nutritionData.macros,
          vitamins: nutritionData.vitamins,
          minerals: nutritionData.minerals,
          renalDiet: nutritionData.renalDiet,
        },
        summary: {
          macros: nutritionData.macros,
          vitamins: [], // We'll populate if needed
          minerals: [], // We'll populate if needed
          warnings: nutritionData.renalDiet.warnings,
          tips: [nutritionData.renalDiet.modifications],
        },
      };

      // Save to history
      await searchHistoryService.saveSearch(historyItem);

      // Create food log entry
      const entry: Omit<FoodLogEntry, "id" | "timestamp"> = {
        date: selectedDate || new Date().toISOString().split("T")[0],
        foodName,
        weight,
        calories: nutritionData.calories,
        potassium: nutritionData.minerals.potassium,
        phosphorus: nutritionData.minerals.phosphorus,
        sodium: nutritionData.minerals.sodium,
        nutritionDataId: "", // Will be set after saving to history
      };

      await foodLogService.addFoodEntry(entry);

      // Get the newly added entry to get its ID
      const allEntries = await foodLogService.getAllFoodLog();
      const newEntry = allEntries[allEntries.length - 1];

      // Update the entry with the history item ID
      const historyItems = await searchHistoryService.getSearchHistory();
      const latestHistoryItem = historyItems[0]; // Most recent
      if (latestHistoryItem && latestHistoryItem.foodName === foodName) {
        await foodLogService.updateFoodEntry(newEntry.id, {
          nutritionDataId: latestHistoryItem.id,
        });
      }

      loadFoodLogs();
      Alert.alert(
        t("common.success"),
        `${foodName} (${weight}${unit}) ${t("foodLog.addedToLog")} ${
          selectedDate ? foodLogService.formatDate(selectedDate, t) : t("foodLog.today").toLowerCase()
        } ${t("foodLog.log")}`
      );
    } catch (error) {
      console.error("Failed to add manual food:", error);
      Alert.alert(
        "Add Food Error",
        "Failed to add manual food. Please try again.",
        [{ text: "OK" }]
      );
      Alert.alert(t("common.error"), t("foodLog.failedToAnalyze"));
    } finally {
      setAnalyzingFood(false);
    }
  };

  const handleClearAll = () => {
    if (dailyLogs.length === 0) return;

    Alert.alert(t("foodLog.clearAllLogs"), t("foodLog.clearAllConfirm"), [
      { text: t("home.cancel"), style: "cancel" },
      {
        text: t("foodLog.clearAll"),
        style: "destructive",
        onPress: async () => {
          try {
            await foodLogService.clearAllFoodLog();
            loadFoodLogs();
          } catch (error) {
            console.error("Failed to clear logs:", error);
            Alert.alert(
              "Clear Logs Error",
              "Failed to clear logs. Please try again.",
              [{ text: "OK" }]
            );
            Alert.alert(t("common.error"), t("foodLog.failedToClearLogs"));
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>{t("foodLog.loadingFoodLogs")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {analyzingFood && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingSpinner}>🔄</Text>
            <Text style={styles.loadingTitle}>{t("foodLog.analyzingFood")}</Text>
            <Text style={styles.loadingSubtitle}>{t("foodLog.gettingNutritionInfo")}</Text>
          </View>
        </View>
      )}

      {/* Search History Modal */}
      <SearchHistoryModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onItemSelect={handleHistoryItemSelect}
        title={t("foodLog.addFromHistory")}
        initialItems={5}
      />

      {dailyLogs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>{t("foodLog.noFoodLoggedYet")}</Text>
          <Text style={styles.emptySubtitle}>{t("foodLog.startLoggingMessage")}</Text>
          <TouchableOpacity style={styles.emptyAddButton} onPress={handleAddPress}>
            <Text style={styles.emptyAddButtonText}>{t("foodLog.addYourFirstFood")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {dailyLogs.map((dailyLog) => (
            <DailyLogCard
              key={dailyLog.date}
              dailyLog={dailyLog}
              onEntryPress={handleEntryPress}
              onEntryDelete={handleEntryDelete}
            />
          ))}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  headerButton: {
    marginRight: 16,
    padding: 8,
  },
  headerButtonText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dailyLogCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dailyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  dailyTotals: {
    alignItems: "flex-end",
  },
  totalCalories: {
    fontSize: 16,
    color: "#FF6B6B",
    fontWeight: "bold",
  },
  dailyNutrients: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  dailyNutrient: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  entriesContainer: {
    gap: 8,
  },
  foodLogCardContainer: {
    position: "relative",
    marginBottom: 8,
  },
  foodLogCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    paddingRight: 22,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E2E2E",
    marginBottom: 2,
  },
  foodWeight: {
    fontSize: 12,
    color: "#666",
  },
  nutrientsContainer: {
    flexDirection: "row",
    gap: 12,
    marginRight: 10,
  },
  nutrientItem: {
    alignItems: "center",
  },
  nutrientLabel: {
    fontSize: 10,
    color: "#666",
    fontWeight: "bold",
    marginBottom: 2,
  },
  nutrientValue: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    flexWrap: "wrap",
    maxWidth: 50,
  },
  potassiumValue: {
    color: "#FF6B6B",
  },
  phosphorusValue: {
    color: "#4ECDC4",
  },
  sodiumValue: {
    color: "#FFA726",
  },
  deleteButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    padding: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  deleteIcon: {
    fontSize: 12,
    color: "#D32F2F",
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E2E2E",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyAddButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyAddButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomPadding: {
    height: 20,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loadingSpinner: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
});
