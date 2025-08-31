import AsyncStorage from "@react-native-async-storage/async-storage";
import { SearchHistoryItem } from "../types/searchHistory";
import { Alert } from "react-native";

const SEARCH_HISTORY_KEY = "@NutriScan:SearchHistory";

class SearchHistoryService {
  private static instance: SearchHistoryService;

  public static getInstance(): SearchHistoryService {
    if (!SearchHistoryService.instance) {
      SearchHistoryService.instance = new SearchHistoryService();
    }
    return SearchHistoryService.instance;
  }

  /**
   * Save a search result to local storage
   */
  async saveSearch(item: Omit<SearchHistoryItem, "id" | "timestamp">): Promise<void> {
    try {
      const existingHistory = await this.getSearchHistory();

      const newItem: SearchHistoryItem = {
        ...item,
        id: this.generateId(),
        timestamp: Date.now(),
      };

      // Add to beginning of array (most recent first)
      const updatedHistory = [newItem, ...existingHistory];

      // Keep only the last 50 searches to avoid storage issues
      const limitedHistory = updatedHistory.slice(0, 50);

      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limitedHistory));
      console.log("Search saved to history:", newItem.foodName);
    } catch (error) {
      console.error("Failed to save search to history:", error);
      Alert.alert(
        "Save Error",
        "Failed to save search to history. Please try again.",
        [{ text: "OK" }]
      );
    }
  }

  /**
   * Get all search history
   */
  async getSearchHistory(): Promise<SearchHistoryItem[]> {
    try {
      const historyJson = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (!historyJson) {
        return [];
      }

      const history: SearchHistoryItem[] = JSON.parse(historyJson);

      // Migrate old format items that don't have nutritionData
      const migratedHistory = history.map((item) => {
        if (!item.nutritionData && item.summary) {
          // Create placeholder nutritionData for backward compatibility
          item.nutritionData = {
            macros: item.summary.macros,
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
              overallSafetyFlag: "caution",
              primaryConcerns: [],
              potassiumLevel: "low",
              phosphorusLevel: "low",
              sodiumLevel: "low",
              proteinLevel: "moderate",
              recommendation: "Migrated from older data format - detailed information may be limited",
              warnings: item.summary.warnings || [],
              modifications: item.summary.tips?.join(". ") || "",
            },
          };
        }
        return item;
      });

      // Sort by timestamp (most recent first)
      return migratedHistory.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error("Failed to load search history:", error);
      Alert.alert(
        "History Load Error",
        "Failed to load search history. Please try again later.",
        [{ text: "OK" }]
      );
      return [];
    }
  }

  /**
   * Delete a specific search item
   */
  async deleteSearchItem(id: string): Promise<void> {
    try {
      const history = await this.getSearchHistory();
      const updatedHistory = history.filter((item) => item.id !== id);

      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
      console.log("Search item deleted from history:", id);
    } catch (error) {
      console.error("Failed to delete search item:", error);
      Alert.alert(
        "Delete Error",
        "Failed to delete search item. Please try again.",
        [{ text: "OK" }]
      );
    }
  }

  /**
   * Clear all search history
   */
  async clearAllHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
      Alert.alert("All search history cleared");
    } catch (error) {
      console.error("Failed to clear search history:", error);
      Alert.alert(
        "Clear History Error",
        "Failed to clear search history. Please try again.",
        [{ text: "OK" }]
      );
    }
  }

  /**
   * Get search statistics
   */
  async getSearchStats(): Promise<{ totalSearches: number; thisWeek: number; thisMonth: number }> {
    try {
      const history = await this.getSearchHistory();
      const now = Date.now();
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

      const thisWeek = history.filter((item) => item.timestamp > oneWeekAgo).length;
      const thisMonth = history.filter((item) => item.timestamp > oneMonthAgo).length;

      return {
        totalSearches: history.length,
        thisWeek,
        thisMonth,
      };
    } catch (error) {
      console.error("Failed to get search stats:", error);
      Alert.alert(
        "Stats Error",
        "Failed to get search stats. Please try again.",
        [{ text: "OK" }]
      );
      return { totalSearches: 0, thisWeek: 0, thisMonth: 0 };
    }
  }

  /**
   * Generate a unique ID for search items
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();

    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    // If this week, show day name
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return days[date.getDay()];
    }

    // Otherwise show date
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}

export default SearchHistoryService.getInstance();
