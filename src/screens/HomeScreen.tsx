import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, RefreshControl } from "react-native";
import { Layout, Text, Button, Card, Divider, Spinner } from "@ui-kitten/components";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../App";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { SearchHistoryItem } from "../types/searchHistory";
import searchHistoryService from "../services/searchHistoryService";
import LanguageSwitcher from "../components/LanguageSwitcher";

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [stats, setStats] = useState({ totalSearches: 0, thisWeek: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const [historyData, statsData] = await Promise.all([
        searchHistoryService.getSearchHistory(),
        searchHistoryService.getSearchStats(),
      ]);
      setHistory(historyData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const handleDeleteItem = (item: SearchHistoryItem) => {
    Alert.alert(t("home.deleteSearch"), t("home.deleteConfirm", { foodName: item.foodName }), [
      { text: t("home.cancel"), style: "cancel" },
      {
        text: t("home.delete"),
        style: "destructive",
        onPress: async () => {
          await searchHistoryService.deleteSearchItem(item.id);
          loadHistory();
        },
      },
    ]);
  };

  const handleClearAll = () => {
    if (history.length === 0) return;

    Alert.alert(t("home.clearAllHistory"), t("home.clearAllConfirm"), [
      { text: t("home.cancel"), style: "cancel" },
      {
        text: t("home.clearAll"),
        style: "destructive",
        onPress: async () => {
          await searchHistoryService.clearAllHistory();
          loadHistory();
        },
      },
    ]);
  };

  const renderHistoryItem = (item: SearchHistoryItem) => (
    <Card
      key={item.id}
      style={styles.historyCard}
      onPress={() =>
        navigation.navigate("Results", {
          calories: item.calories,
          weight: item.weight,
          confidence: item.confidence || 0,
          summary: item.summary,
          imageUri: item.imageUri,
          searchText: item.searchText, // Pass searchText if available
          // Include complete nutrition data if available
          nutritionData: item.nutritionData,
        })
      }
    >
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          {item.imageUri ? (
            <Image source={{ uri: item.imageUri }} style={styles.foodImage} />
          ) : (
            <View style={[styles.foodImage, styles.placeholderImage]}>
              <Text style={styles.placeholderIcon}>{item.searchText ? "📝" : "🖼️"}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.foodName} numberOfLines={1}>
            {item.foodName}
          </Text>
          <Text style={styles.calories} category="s1">
            {item.calories} calories • {item.weight}g
          </Text>
          <Text style={styles.timestamp} appearance="hint" category="c1">
            {searchHistoryService.formatTimestamp(item.timestamp)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <Layout style={styles.container}>
        <View style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Spinner size="large" />
            <Text style={styles.loadingText}>{t("home.loadingHistory")}</Text>
          </View>
        </View>
      </Layout>
    );
  }

  return (
    <Layout style={styles.container}>
      <View style={styles.gradient}>
        <View style={styles.header}>
          <LanguageSwitcher style={styles.languageSwitcher} />
          <Text style={styles.title}>{t("home.title")}</Text>
          <Text style={styles.subtitle}>{t("home.subtitle")}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalSearches}</Text>
            <Text style={styles.statLabel}>{t("home.totalScans")}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.thisWeek}</Text>
            <Text style={styles.statLabel}>{t("home.thisWeek")}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.thisMonth}</Text>
            <Text style={styles.statLabel}>{t("home.thisMonth")}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Button
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => navigation.navigate("Camera")}
            accessoryLeft={() => <Text style={styles.buttonIcon}>📷</Text>}
          >
            {t("home.scanNewFood")}
          </Button>

          <Button
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate("TextSearch")}
            accessoryLeft={() => <Text style={styles.secondaryButtonIcon}>🔍</Text>}
            appearance="outline"
            status="success"
          >
            {t("home.textSearch")}
          </Button>

          <Button
            style={[styles.actionButton, styles.recipeButton]}
            onPress={() => navigation.navigate("RecipeSearch")}
            accessoryLeft={() => <Text style={styles.recipeButtonIcon}>🍽️</Text>}
            appearance="outline"
            status="primary"
          >
            {t("home.recipeSearch")}
          </Button>
        </View>

        <View style={styles.historySection}>
          <View style={styles.historySectionHeader}>
            <Text style={styles.historyTitle}>{t("home.recentScans")}</Text>
            {history.length > 0 && (
              <TouchableOpacity onPress={handleClearAll}>
                <Text style={styles.clearAllText}>{t("home.clearAll")}</Text>
              </TouchableOpacity>
            )}
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>{t("home.noScansYet")}</Text>
              <Text style={styles.emptySubtitle}>{t("home.noScansSubtitle")}</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.historyList}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
              {history.map(renderHistoryItem)}
              <View style={styles.bottomPadding} />
            </ScrollView>
          )}
        </View>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    backgroundColor: "#F0F8F0",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "center",
    position: "relative",
  },
  languageSwitcher: {
    position: "absolute",
    top: 65,
    right: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#4CAF50",
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    marginHorizontal: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 4,
  },
  primaryButton: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderColor: "#4CAF50",
  },
  buttonIcon: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  secondaryButtonIcon: {
    fontSize: 18,
    color: "#4CAF50",
  },
  recipeButton: {
    borderColor: "#2196F3",
  },
  recipeButtonIcon: {
    fontSize: 18,
    color: "#2196F3",
  },
  historySection: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
  },
  historySectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E7D32",
  },
  clearAllText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "500",
  },
  historyList: {
    flex: 1,
  },
  historyCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  imageContainer: {
    marginRight: 12,
  },
  foodImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: {
    fontSize: 20,
  },
  infoContainer: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E2E2E",
    marginBottom: 2,
  },
  calories: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E2E2E",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8F9BB3",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 20,
  },
});

export default HomeScreen;
