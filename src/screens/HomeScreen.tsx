import React, { useState, useCallback, useRef } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, RefreshControl } from "react-native";
import { Layout, Text, Card, Spinner } from "@ui-kitten/components";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { SearchHistoryItem } from "../types/searchHistory";
import { HomeScreenProps } from "../types/navigation";
import searchHistoryService from "../services/searchHistoryService";
import LanguageSwitcher from "../components/LanguageSwitcher";
import SearchHistoryModal from "../components/SearchHistoryModal";

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [stats, setStats] = useState({ totalSearches: 0, thisWeek: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleItems, setVisibleItems] = useState(10); // Show 10 items initially
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const loadHistory = async () => {
    try {
      const [historyData, statsData] = await Promise.all([
        searchHistoryService.getSearchHistory(),
        searchHistoryService.getSearchStats(),
      ]);
      setHistory(historyData);
      setStats(statsData);
      setVisibleItems(5); // Reset to show only 5 items initially
    } catch (error) {
      console.error("Failed to load history:", error);
      Alert.alert("History Load Error", "Failed to load search history. Please try again later.", [{ text: "OK" }]);
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
    setVisibleItems(5); // Reset to show only 5 items initially
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

  const handleFindMore = () => {
    setSearchModalVisible(true);
  };

  const handleHistoryItemSelect = (selectedItem: SearchHistoryItem) => {
    // Navigate to Results screen
    navigation.navigate("Results", {
      calories: selectedItem.calories,
      weight: selectedItem.weight,
      confidence: selectedItem.confidence || 0,
      summary: selectedItem.summary,
      imageUri: selectedItem.imageUri,
      searchText: selectedItem.searchText,
      nutritionData: selectedItem.nutritionData,
    });
  };

  const handleBackToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
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
          searchText: item.searchText,
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
          <View style={styles.nutritionRow}>
            <Text style={styles.calories}>🔥 {item.calories} cal</Text>
            <Text style={styles.weight}>⚖️ {item.weight}g</Text>
          </View>
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

  const renderStatCard = (value: number, label: string, icon: string, color: string) => (
    <LinearGradient
      colors={[color + "15", color + "08"]}
      style={styles.statCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.statIconContainer}>
        <Text style={[styles.statIcon, { color }]}>{icon}</Text>
      </View>
      <Text style={[styles.statNumber, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  );

  if (loading) {
    return (
      <Layout style={styles.container}>
        <LinearGradient
          colors={["#E8F5E8", "#F0F8F0", "#FFFFFF"]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.loadingContainer}>
            <View style={styles.loadingAnimation}>
              <Spinner size="large" status="success" />
            </View>
            <Text style={styles.loadingText}>{t("home.loadingHistory")}</Text>
            <Text style={styles.loadingSubtitle}>{t("home.loadingHistorySubtitle")}</Text>
          </View>
        </LinearGradient>
      </Layout>
    );
  }

  return (
    <Layout style={styles.container}>
      <LinearGradient
        colors={["#E8F5E8", "#F0F8F0", "#FFFFFF"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4CAF50"]} tintColor="#4CAF50" />
          }
        >
          {/* Header Section */}
          <View style={styles.header}>
            <LanguageSwitcher style={styles.languageSwitcher} />
            <View style={styles.headerContent}>
              <Text style={styles.welcomeText}>{t("home.welcomeTo")}</Text>
              <Text style={styles.title}>{t("home.title")}</Text>
              <Text style={styles.subtitle}>{t("home.subtitle")}</Text>
            </View>
          </View>

          {/* Quick Stats Section */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>{t("home.yourActivity")}</Text>
            <View style={styles.statsContainer}>
              {renderStatCard(stats.totalSearches, t("home.totalScans"), "📊", "#4CAF50")}
              {renderStatCard(stats.thisWeek, t("home.thisWeek"), "📅", "#2196F3")}
              {renderStatCard(stats.thisMonth, t("home.thisMonth"), "📈", "#9C27B0")}
            </View>
          </View>

          {/* Quick Actions Section */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>{t("home.quickActions")}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryAction]}
                onPress={() => navigation.navigate("Camera")}
                activeOpacity={0.8}
              >
                <View style={styles.primaryActionContent}>
                  <View style={styles.primaryActionIconContainer}>
                    <Text style={styles.primaryActionIcon}>📷</Text>
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.primaryActionTitle}>{t("home.scanNewFood")}</Text>
                    <Text style={styles.primaryActionSubtitle}>{t("home.scanNewFoodSubtitle")}</Text>
                  </View>
                  <Text style={styles.actionArrow}>→</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryAction, styles.textSearchAction]}
                  onPress={() => navigation.navigate("TextSearch")}
                  activeOpacity={0.8}
                >
                  <View style={styles.secondaryActionContent}>
                    <View style={[styles.secondaryActionIconContainer, styles.textSearchIcon]}>
                      <Text style={styles.secondaryActionIcon}>🔍</Text>
                    </View>
                    <View style={styles.actionTextContainer}>
                      <Text style={styles.secondaryActionTitle}>{t("home.textSearch")}</Text>
                      <Text style={styles.secondaryActionSubtitle}>{t("home.textSearchSubtitle")}</Text>
                    </View>
                    <Text style={styles.secondaryActionArrow}>›</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryAction, styles.recipeAction]}
                  onPress={() => navigation.navigate("RecipeSearch")}
                  activeOpacity={0.8}
                >
                  <View style={styles.secondaryActionContent}>
                    <View style={[styles.secondaryActionIconContainer, styles.recipeIcon]}>
                      <Text style={styles.secondaryActionIcon}>🍽️</Text>
                    </View>
                    <View style={styles.actionTextContainer}>
                      <Text style={styles.secondaryActionTitle}>{t("home.recipeSearch")}</Text>
                      <Text style={styles.secondaryActionSubtitle}>{t("home.recipeSearchSubtitle")}</Text>
                    </View>
                    <Text style={styles.secondaryActionArrow}>›</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryAction, styles.logAction]}
                  onPress={() => navigation.navigate("FoodLog")}
                  activeOpacity={0.8}
                >
                  <View style={styles.secondaryActionContent}>
                    <View style={[styles.secondaryActionIconContainer, styles.logIcon]}>
                      <Text style={styles.secondaryActionIcon}>📝</Text>
                    </View>
                    <View style={styles.actionTextContainer}>
                      <Text style={styles.secondaryActionTitle}>{t("home.foodLog")}</Text>
                      <Text style={styles.secondaryActionSubtitle}>{t("home.foodLogSubtitle")}</Text>
                    </View>
                    <Text style={styles.secondaryActionArrow}>›</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Recent Scans Section */}
          <View style={styles.historySection}>
            <View style={styles.historySectionHeader}>
              <Text style={styles.sectionTitle}>{t("home.recentScans")}</Text>
              {history.length > 0 && (
                <TouchableOpacity onPress={handleClearAll}>
                  <Text style={styles.clearAllText}>{t("home.clearAll")}</Text>
                </TouchableOpacity>
              )}
            </View>

            {history.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Text style={styles.emptyIcon}>🔍</Text>
                </View>
                <Text style={styles.emptyTitle}>{t("home.noScansYet")}</Text>
                <Text style={styles.emptySubtitle}>{t("home.noScansSubtitle")}</Text>
                <TouchableOpacity
                  style={styles.getStartedButton}
                  onPress={() => navigation.navigate("Camera")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.getStartedText}>{t("home.getStarted")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.historyList}>
                {history.slice(0, visibleItems).map(renderHistoryItem)}

                {/* Find More Button */}
                {history.length > visibleItems && (
                  <View style={styles.loadMoreContainer}>
                    <TouchableOpacity style={styles.loadMoreButton} onPress={handleFindMore} activeOpacity={0.8}>
                      <Text style={styles.loadMoreText}>{t("home.findMore")}</Text>
                      <Text style={styles.loadMoreSubtext}>
                        {t("home.showingItems", { shown: visibleItems, total: history.length })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Back to Top Button */}
                {visibleItems > 10 && (
                  <View style={styles.backToTopContainer}>
                    <TouchableOpacity style={styles.backToTopButton} onPress={handleBackToTop} activeOpacity={0.8}>
                      <Text style={styles.backToTopText}>↑ {t("home.backToTop")}</Text>
                    </TouchableOpacity>

                    {/* Quick Actions Shortcut */}
                    <TouchableOpacity
                      style={styles.quickActionsShortcut}
                      onPress={() => {
                        handleBackToTop();
                        // Small delay to ensure scroll completes
                        setTimeout(() => {
                          scrollViewRef.current?.scrollTo({ y: 300, animated: true });
                        }, 300);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.quickActionsShortcutText}>⚡ {t("home.quickActions")}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        <SearchHistoryModal
          visible={searchModalVisible}
          onClose={() => setSearchModalVisible(false)}
          onItemSelect={handleHistoryItemSelect}
          title={t("home.findMore")}
        />
      </LinearGradient>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingAnimation: {
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "500",
  },
  loadingSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    position: "relative",
  },
  headerContent: {
    alignItems: "center",
  },
  languageSwitcher: {
    position: "absolute",
    top: 65,
    right: 20,
    zIndex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#4CAF50",
    opacity: 0.9,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 24,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  actionButtons: {
    gap: 20,
  },
  actionButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  primaryAction: {
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    backgroundColor: "#4CAF50",
  },
  primaryActionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  primaryActionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  primaryActionIcon: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  actionTextContainer: {
    flex: 1,
  },
  primaryActionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  primaryActionSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  actionArrow: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  secondaryActions: {
    gap: 16,
  },
  secondaryAction: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  secondaryActionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  secondaryActionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textSearchAction: {
    backgroundColor: "#FFF8F0",
    borderColor: "#FFE0B2",
  },
  textSearchIcon: {
    backgroundColor: "#FFF3E0",
  },
  recipeAction: {
    backgroundColor: "#F3E5F5",
    borderColor: "#CE93D8",
  },
  recipeIcon: {
    backgroundColor: "#F8F5FF",
  },
  logAction: {
    backgroundColor: "#E8F5E8",
    borderColor: "#C8E6C9",
  },
  logIcon: {
    backgroundColor: "#F0FFF0",
  },
  secondaryActionIcon: {
    fontSize: 24,
  },
  secondaryActionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 2,
  },
  secondaryActionSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  secondaryActionArrow: {
    fontSize: 18,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  historySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  historySectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  clearAllText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "500",
  },
  historyList: {
    paddingHorizontal: 0,
    paddingBottom: 10,
  },
  historyCard: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    marginBottom: 8,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  imageContainer: {
    marginRight: 16,
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  placeholderImage: {
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E2E2E",
    marginBottom: 6,
  },
  nutritionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 12,
  },
  calories: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
  weight: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  timestamp: {
    fontSize: 12,
    color: "#8F9BB3",
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 18,
    color: "#FF6B6B",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2E2E2E",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#8F9BB3",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  getStartedButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  getStartedText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomPadding: {
    height: 30,
  },
  loadMoreContainer: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  loadMoreButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    width: "100%",
  },
  loadMoreText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  loadMoreSubtext: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
  },
  backToTopContainer: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  backToTopButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    flex: 1,
    marginRight: 8,
  },
  backToTopText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  quickActionsShortcut: {
    backgroundColor: "#FFF3E0",
    borderWidth: 1,
    borderColor: "#FFB74D",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    flex: 1,
    marginLeft: 8,
  },
  quickActionsShortcutText: {
    color: "#E65100",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default HomeScreen;
