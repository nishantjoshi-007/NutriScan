import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
  FlatList,
  SafeAreaView,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SearchHistoryItem } from "../types/searchHistory";
import searchHistoryService from "../services/searchHistoryService";

interface SearchHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  onItemSelect: (item: SearchHistoryItem) => void;
  title?: string;
  initialItems?: number;
}

const SearchHistoryModal: React.FC<SearchHistoryModalProps> = ({
  visible,
  onClose,
  onItemSelect,
  title,
  initialItems = 6,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [allHistoryItems, setAllHistoryItems] = useState<SearchHistoryItem[]>([]);
  const [filteredHistoryItems, setFilteredHistoryItems] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    if (visible) {
      loadHistory();
    }
  }, [visible]);

  const loadHistory = async () => {
    try {
      const history = await searchHistoryService.getSearchHistory();
      setAllHistoryItems(history);
      setFilteredHistoryItems(history.slice(0, initialItems));
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to load history:", error);
      Alert.alert("History Load Error", "Failed to load search history. Please try again later.", [{ text: "OK" }]);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      // Show first N items when search is empty
      setFilteredHistoryItems(allHistoryItems.slice(0, initialItems));
    } else {
      // Filter items based on search query
      const filtered = allHistoryItems.filter((item) => item.foodName.toLowerCase().includes(query.toLowerCase()));
      setFilteredHistoryItems(filtered);
    }
  };

  const handleItemSelect = (item: SearchHistoryItem) => {
    onClose();
    onItemSelect(item);
  };

  const renderHistoryItem = ({ item }: { item: SearchHistoryItem }) => (
    <TouchableOpacity style={styles.historyItem} onPress={() => handleItemSelect(item)}>
      <View style={styles.historyItemContent}>
        <Text style={styles.historyItemName}>{item.foodName}</Text>
        <Text style={styles.historyItemWeight}>{item.weight}g</Text>
      </View>
      <Text style={styles.historyItemCalories}>🔥 {item.calories} cal</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title || t("home.findMore")}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t("home.textSearch")}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Text style={styles.searchResultsText}>
          {searchQuery.trim() === ""
            ? t("home.recentScans")
            : `${t("home.recentScans")} (${filteredHistoryItems.length})`}
        </Text>

        <FlatList
          data={filteredHistoryItems}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          ListEmptyComponent={
            searchQuery.trim() !== "" ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>{t("recipeSearch.noRecipesFound")}</Text>
                <Text style={styles.noResultsSubtext}>{t("recipeSearch.tryDifferentKeywords")}</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.historyList}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: "#666",
    fontWeight: "bold",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  searchInput: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchResultsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  historyList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  historyItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E2E2E",
    marginBottom: 4,
  },
  historyItemWeight: {
    fontSize: 14,
    color: "#666",
  },
  historyItemCalories: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
  },
  noResults: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});

export default SearchHistoryModal;
