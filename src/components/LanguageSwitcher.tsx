import React from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Text } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import { LanguageSwitcherProps } from "../types/components";

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ style }) => {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLanguage = i18n.language === "en" ? "gu" : "en";
    i18n.changeLanguage(newLanguage);

    Alert.alert(t("language.changeLanguage"), t("language.languageChanged"), [{ text: t("common.ok") }]);
  };

  const getCurrentLanguageDisplay = () => {
    return i18n.language === "en" ? "EN | ગુ" : "EN | ગુ";
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={toggleLanguage}
      accessibilityLabel={t("language.changeLanguage")}
    >
      <View style={styles.languageButton}>
        <Text style={styles.languageText}>🌐</Text>
        <Text style={styles.languageCode}>{getCurrentLanguageDisplay()}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-end",
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  languageText: {
    fontSize: 16,
    marginRight: 4,
  },
  languageCode: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E7D32",
  },
});

export default LanguageSwitcher;
