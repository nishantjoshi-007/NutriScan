import AsyncStorage from "@react-native-async-storage/async-storage";
import { FoodLogEntry, DailyFoodLog } from "../types/foodLog";
import { SearchHistoryItem } from "../types/searchHistory";
import searchHistoryService from "./searchHistoryService";

const FOOD_LOG_KEY = "@NutriScan:FoodLog";

class FoodLogService {
  private static instance: FoodLogService;

  public static getInstance(): FoodLogService {
    if (!FoodLogService.instance) {
      FoodLogService.instance = new FoodLogService();
    }
    return FoodLogService.instance;
  }

  /**
   * Add a food entry to the log
   */
  async addFoodEntry(entry: Omit<FoodLogEntry, "id" | "timestamp">): Promise<void> {
    try {
      const existingLog = await this.getAllFoodLog();
      const newEntry: FoodLogEntry = {
        ...entry,
        id: this.generateId(),
        timestamp: Date.now(),
      };

      existingLog.push(newEntry);
      await AsyncStorage.setItem(FOOD_LOG_KEY, JSON.stringify(existingLog));
      console.log("Food entry added to log:", newEntry.foodName);
    } catch (error) {
      console.error("Failed to add food entry:", error);
      throw error;
    }
  }

  /**
   * Get all food log entries
   */
  async getAllFoodLog(): Promise<FoodLogEntry[]> {
    try {
      const logJson = await AsyncStorage.getItem(FOOD_LOG_KEY);
      if (!logJson) {
        return [];
      }
      return JSON.parse(logJson);
    } catch (error) {
      console.error("Failed to load food log:", error);
      return [];
    }
  }

  /**
   * Get food log entries for a specific date
   */
  async getFoodLogForDate(date: string): Promise<FoodLogEntry[]> {
    try {
      const allEntries = await this.getAllFoodLog();
      return allEntries.filter((entry) => entry.date === date);
    } catch (error) {
      console.error("Failed to get food log for date:", error);
      return [];
    }
  }

  /**
   * Get daily food logs grouped by date
   */
  async getDailyFoodLogs(): Promise<DailyFoodLog[]> {
    try {
      const allEntries = await this.getAllFoodLog();

      // Group entries by date
      const groupedByDate = allEntries.reduce((acc, entry) => {
        if (!acc[entry.date]) {
          acc[entry.date] = [];
        }
        acc[entry.date].push(entry);
        return acc;
      }, {} as Record<string, FoodLogEntry[]>);

      // Convert to DailyFoodLog array
      const dailyLogs: DailyFoodLog[] = Object.keys(groupedByDate)
        .sort((a, b) => b.localeCompare(a)) // Most recent first
        .map((date) => {
          const entries = groupedByDate[date];
          const totalNutrients = entries.reduce(
            (totals, entry) => ({
              weight: totals.weight + entry.weight,
              calories: totals.calories + (entry.calories || 0),
              potassium: totals.potassium + entry.potassium,
              phosphorus: totals.phosphorus + entry.phosphorus,
              sodium: totals.sodium + entry.sodium,
            }),
            { weight: 0, calories: 0, potassium: 0, phosphorus: 0, sodium: 0 }
          );

          return {
            date,
            entries,
            totalNutrients,
          };
        });

      return dailyLogs;
    } catch (error) {
      console.error("Failed to get daily food logs:", error);
      return [];
    }
  }

  /**
   * Delete a food log entry
   */
  async deleteFoodEntry(id: string): Promise<void> {
    try {
      const allEntries = await this.getAllFoodLog();
      const updatedEntries = allEntries.filter((entry) => entry.id !== id);
      await AsyncStorage.setItem(FOOD_LOG_KEY, JSON.stringify(updatedEntries));
      console.log("Food entry deleted:", id);
    } catch (error) {
      console.error("Failed to delete food entry:", error);
      throw error;
    }
  }

  /**
   * Update a food log entry
   */
  async updateFoodEntry(id: string, updates: Partial<FoodLogEntry>): Promise<void> {
    try {
      const allEntries = await this.getAllFoodLog();
      const updatedEntries = allEntries.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry));
      await AsyncStorage.setItem(FOOD_LOG_KEY, JSON.stringify(updatedEntries));
      console.log("Food entry updated:", id);
    } catch (error) {
      console.error("Failed to update food entry:", error);
      throw error;
    }
  }

  /**
   * Create a food log entry from search history
   */
  async createEntryFromSearchHistory(
    searchHistoryItem: SearchHistoryItem,
    date: string = this.getCurrentDateString()
  ): Promise<FoodLogEntry> {
    const entry: Omit<FoodLogEntry, "id" | "timestamp"> = {
      date,
      foodName: searchHistoryItem.foodName,
      weight: searchHistoryItem.weight,
      calories: searchHistoryItem.calories,
      potassium: searchHistoryItem.nutritionData.minerals.potassium,
      phosphorus: searchHistoryItem.nutritionData.minerals.phosphorus,
      sodium: searchHistoryItem.nutritionData.minerals.sodium,
      nutritionDataId: searchHistoryItem.id,
    };

    await this.addFoodEntry(entry);
    const allEntries = await this.getAllFoodLog();
    return allEntries[allEntries.length - 1]; // Return the newly added entry
  }

  /**
   * Get full nutrition data for a food log entry
   */
  async getFullNutritionData(entry: FoodLogEntry) {
    if (entry.nutritionDataId) {
      // Get from search history
      const history = await searchHistoryService.getSearchHistory();
      const historyItem = history.find((item) => item.id === entry.nutritionDataId);
      if (historyItem) {
        return historyItem.nutritionData;
      }
    }

    // Return custom nutrition data or null
    return entry.customNutritionData || null;
  }

  /**
   * Clear all food log entries
   */
  async clearAllFoodLog(): Promise<void> {
    try {
      await AsyncStorage.removeItem(FOOD_LOG_KEY);
      console.log("All food log cleared");
    } catch (error) {
      console.error("Failed to clear food log:", error);
      throw error;
    }
  }

  /**
   * Get current date as YYYY-MM-DD string
   */
  private getCurrentDateString(): string {
    const now = new Date();
    return now.toISOString().split("T")[0];
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string, t?: (key: string) => string): string {
    const entryDate = new Date(dateString + "T00:00:00"); // Ensure we're working with local time
    const now = new Date();

    // Get date components for comparison
    const entryYear = entryDate.getFullYear();
    const entryMonth = entryDate.getMonth();
    const entryDay = entryDate.getDate();

    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const nowDay = now.getDate();

    // Calculate difference in days
    const entryDateObj = new Date(entryYear, entryMonth, entryDay);
    const todayObj = new Date(nowYear, nowMonth, nowDay);
    const diffTime = todayObj.getTime() - entryDateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t ? t("foodLog.today") : "Today";
    } else if (diffDays === 1) {
      return t ? t("foodLog.yesterday") : "Yesterday";
    } else if (diffDays === 2) {
      return t ? "2 " + (t ? t("foodLog.daysAgo") : "days ago") : "2 days ago";
    } else if (diffDays <= 7) {
      return t ? `${diffDays} ${t("foodLog.daysAgo")}` : `${diffDays} days ago`;
    } else {
      return entryDate.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    }
  }
}

export default FoodLogService.getInstance();
