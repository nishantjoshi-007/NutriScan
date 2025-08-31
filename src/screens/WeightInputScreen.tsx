import React, { useState, useEffect } from "react";
import { StyleSheet, Image, Alert, ScrollView } from "react-native";
import { Layout, Text, Input, Button, Card, Spinner, Modal, Toggle, Divider } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import VolumeEstimationService from "../services/volumeEstimationService";
import GeminiService from "../services/geminiService";
import { WeightInputScreenProps } from "../types/navigation";
import { VolumeEstimate } from "../types/services";

export default function WeightInputScreen({ navigation, route }: WeightInputScreenProps) {
  const { t } = useTranslation();
  const { imageUri } = route.params;
  const [weight, setWeight] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [useAutoWeight, setUseAutoWeight] = useState(true);
  const [volumeEstimate, setVolumeEstimate] = useState<VolumeEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  useEffect(() => {
    if (useAutoWeight) {
      estimateWeight();
    }
  }, [useAutoWeight]);

  const estimateWeight = async () => {
    if (!useAutoWeight) return;

    setIsEstimating(true);
    try {
      // Use Gemini AI to estimate weight from image
      const estimate = await VolumeEstimationService.estimateWeightFromImage(imageUri);
      setVolumeEstimate(estimate);
      setWeight(estimate.weight.toString());
    } catch (error) {
      console.error("Weight estimation failed:", error);
      Alert.alert(
        "Weight Estimation Error",
        "Failed to estimate weight. Please try again.",
        [{ text: "OK" }]
      );
      Alert.alert(t("weightInput.estimationFailed"), t("weightInput.enterManually"), [
        { text: t("weightInput.manualInput"), onPress: () => setUseAutoWeight(false) },
        { text: t("results.tryAgain"), onPress: estimateWeight },
      ]);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleWeightChange = (text: string) => {
    // Only allow numbers and one decimal point
    const numericText = text.replace(/[^0-9.]/g, "");
    const decimalCount = (numericText.match(/\./g) || []).length;

    if (decimalCount <= 1) {
      setWeight(numericText);
    }
  };

  const analyzeFood = async () => {
    const weightValue = parseFloat(weight);
    const validation = VolumeEstimationService.validateWeight(weightValue);

    if (!validation.isValid) {
      Alert.alert(t("weightInput.invalidWeight"), validation.error);
      return;
    }

    setIsProcessing(true);

    try {
      navigation.navigate("Results", {
        imageUri,
        weight: weightValue,
        calories: 0, // Will be calculated in ResultsScreen
        confidence: 0, // Will be calculated in ResultsScreen
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
      Alert.alert(t("common.error"), t("textSearch.analysisError"));
    } finally {
      setIsProcessing(false);
    }
  };

  const quickWeightButtons = VolumeEstimationService.getQuickWeightSuggestions();

  const renderUnitAccessory = () => (
    <Text category="s1" appearance="hint">
      {t("weightInput.grams")}
    </Text>
  );

  const renderVolumeEstimateCard = () => {
    if (!volumeEstimate || !useAutoWeight) return null;

    const isGeminiEstimate = volumeEstimate.estimationMethod === "gemini";

    return (
      <Card style={styles.estimateCard} status={volumeEstimate.confidence > 0.7 ? "success" : "warning"}>
        <Layout level="1">
          <Text category="h6" style={styles.estimateTitle}>
            {isGeminiEstimate
              ? "🧠 " + t("weightInput.aiSmartEstimate")
              : "🤖 " + t("weightInput.basicVolumeEstimate")}
          </Text>
          <Layout style={styles.estimateDetails} level="1">
            <Text category="s1">
              {t("weightInput.volume")}: ~{Math.round(volumeEstimate.volume)} cm³
            </Text>
            <Text category="s1">
              {t("weightInput.estimatedWeight")}: {volumeEstimate.weight}g
            </Text>
            {volumeEstimate.detectedFood && (
              <Text category="s1">
                {t("weightInput.detected")}: {volumeEstimate.detectedFood}
              </Text>
            )}
            <Text category="c1" appearance="hint">
              {t("weightInput.confidence")}: {Math.round(volumeEstimate.confidence * 100)}%
            </Text>
            <Text category="c1" appearance="hint">
              {t("weightInput.method")}: {t("weightInput.aiImageAnalysis")}
            </Text>
          </Layout>
          {volumeEstimate.geminiAnalysis && (
            <Layout style={styles.geminiAnalysis} level="1">
              <Text category="c1" appearance="hint" style={styles.analysisTitle}>
                💡 {t("weightInput.aiReasoning")}:
              </Text>
              <Text category="c1" appearance="hint" style={styles.analysisText}>
                {volumeEstimate.geminiAnalysis}
              </Text>
            </Layout>
          )}
        </Layout>
      </Card>
    );
  };

  return (
    <Layout style={styles.container} level="1">
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Layout style={styles.content} level="1">
          {/* Weight Method Toggle */}
          <Card style={styles.toggleCard}>
            <Layout style={styles.toggleContainer} level="1">
              <Layout style={styles.toggleRow} level="1">
                <Text category="s1" style={styles.toggleLabel}>
                  {t("weightInput.estimateWeight")}
                </Text>
                <Toggle checked={useAutoWeight} onChange={setUseAutoWeight} status="primary" />
              </Layout>
              <Text category="c1" appearance="hint">
                {t("weightInput.aiEstimate")}
              </Text>
            </Layout>
          </Card>

          {/* Volume Estimate Display */}
          {renderVolumeEstimateCard()}

          {/* Loading State for Estimation */}
          {isEstimating && (
            <Card style={styles.loadingCard}>
              <Layout style={styles.loadingContainer} level="1">
                <Spinner size="large" status="primary" />
                <Text category="s1" style={styles.loadingText}>
                  {t("weightInput.estimating")}
                </Text>
              </Layout>
            </Card>
          )}

          {/* Manual Input Section */}
          <Layout style={styles.inputSection} level="1">
            <Text style={styles.title} category="h4" status="basic">
              {useAutoWeight ? t("weightInput.adjustWeight") : t("weightInput.enterWeightManually")}
            </Text>
            <Text style={styles.subtitle} category="s1" appearance="hint">
              {useAutoWeight ? t("weightInput.aiEstimateHelp") : t("weightInput.helpText")}
            </Text>

            {/* Manual Input */}
            <Input
              style={styles.weightInput}
              value={weight}
              onChangeText={handleWeightChange}
              placeholder={t("weightInput.enterWeight")}
              keyboardType="numeric"
              maxLength={6}
              accessoryRight={renderUnitAccessory}
              size="large"
              status="primary"
              disabled={isEstimating}
            />

            {!useAutoWeight && (
              <>
                {/* Quick Weight Buttons */}
                <Text style={styles.quickSelectLabel} category="s1" status="basic">
                  {t("weightInput.quickSelect")}
                </Text>
                <Layout style={styles.quickButtonsContainer} level="1">
                  {quickWeightButtons.map((button) => (
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
              </>
            )}

            {/* Analyze Button */}
            <Button
              style={styles.analyzeButton}
              status="primary"
              size="large"
              onPress={analyzeFood}
              disabled={!weight || isProcessing || isEstimating}
              accessoryLeft={isProcessing ? () => <Spinner size="small" status="control" /> : undefined}
            >
              {isProcessing ? t("weightInput.analyzing") : t("weightInput.analyzeNutrition")}
            </Button>

            {/* Help Text */}
            <Text style={styles.helpText} category="c1" appearance="hint">
              💡 {t("weightInput.helpTip")}
            </Text>
          </Layout>
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
  toggleCard: {
    marginBottom: 16,
  },
  toggleContainer: {
    padding: 4,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  toggleLabel: {
    fontWeight: "600",
  },
  estimateCard: {
    marginBottom: 16,
  },
  estimateTitle: {
    marginBottom: 8,
  },
  estimateDetails: {
    marginBottom: 8,
  },
  geminiAnalysis: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 4,
  },
  analysisTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  analysisText: {
    fontStyle: "italic",
    lineHeight: 16,
  },
  tipText: {
    fontStyle: "italic",
    textAlign: "center",
  },
  loadingCard: {
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    textAlign: "center",
  },
  inputSection: {
    flex: 1,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
  },
  weightInput: {
    marginBottom: 16,
  },
  referenceButton: {
    marginBottom: 16,
  },
  quickSelectLabel: {
    marginBottom: 12,
    fontWeight: "600",
  },
  quickButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  quickButton: {
    width: "30%",
    marginBottom: 8,
  },
  analyzeButton: {
    marginBottom: 16,
  },
  helpText: {
    textAlign: "center",
    fontStyle: "italic",
  },
});
