import React, { useState, useRef } from "react";
import { View, StyleSheet, Alert, Image, SafeAreaView, TouchableOpacity } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { StackNavigationProp } from "@react-navigation/stack";
import { Layout, Text, Button, Card, Spinner } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../App";

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, "Camera">;

interface Props {
  navigation: CameraScreenNavigationProp;
}

export default function CameraScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    // Camera permissions are still loading
    return (
      <Layout style={styles.container} level="1">
        <Layout style={styles.centerContent} level="1">
          <Spinner size="large" />
          <Text style={styles.text} category="s1">
            {t("common.loading")}
          </Text>
        </Layout>
      </Layout>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <Layout style={styles.container} level="1">
        <Layout style={styles.centerContent} level="1">
          <Text style={styles.permissionText} category="h5" status="basic">
            {t("camera.cameraPermissionMessage")}
          </Text>
          <Button style={styles.permissionButton} status="primary" size="large" onPress={requestPermission}>
            {t("camera.cameraPermission")}
          </Button>
        </Layout>
      </Layout>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });

        if (photo) {
          setCapturedImage(photo.uri);
        }
      } catch (error) {
        console.error("Error taking picture:", error);
        Alert.alert(t("common.error"), t("camera.failedToTakePhoto"));
      }
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
  };

  const proceedToWeightInput = () => {
    if (capturedImage) {
      navigation.navigate("WeightInput", { imageUri: capturedImage });
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  if (capturedImage) {
    return (
      <Layout style={styles.container} level="1">
        <Layout style={styles.previewContainer} level="1">
          <Layout style={styles.imageContainer} level="2">
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          </Layout>

          <Layout style={styles.previewActions} level="1">
            <Text style={styles.previewTitle} category="h4" status="basic">
              {t("camera.usePhoto")}
            </Text>

            <Layout style={styles.buttonRow} level="1">
              <Button
                style={styles.retakeButton}
                status="basic"
                appearance="outline"
                size="large"
                onPress={retakePicture}
              >
                {t("camera.retakePhoto")}
              </Button>
              <Button style={styles.usePhotoButton} status="primary" size="large" onPress={proceedToWeightInput}>
                {t("camera.usePhoto")}
              </Button>
            </Layout>
          </Layout>
        </Layout>
      </Layout>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.overlay}>
          <View style={styles.topOverlay}>
            <Text style={styles.instructionText}>{t("camera.pointCamera")}</Text>
          </View>

          <View style={styles.bottomOverlay}>
            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                <Text style={styles.flipButtonText}>🔄</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <View style={styles.spacer} />
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "space-between",
  },
  topOverlay: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  bottomOverlay: {
    padding: 40,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  instructionText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  cameraControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  flipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  flipButtonText: {
    fontSize: 24,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 30,
    borderWidth: 4,
    borderColor: "#4CAF50",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4CAF50",
  },
  spacer: {
    width: 60,
  },
  previewContainer: {
    flex: 1,
    padding: 20,
  },
  previewActions: {
    paddingVertical: 20,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#4CAF50",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButtonText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "bold",
  },
  text: {
    fontSize: 16,
    marginTop: 16,
  },
  permissionText: {
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    marginTop: 16,
    minWidth: 200,
  },
  imageCard: {
    flex: 1,
    marginBottom: 20,
  },
  imageContainer: {
    flex: 1,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  previewImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  retakeButton: {
    flex: 1,
    marginRight: 8,
  },
  usePhotoButton: {
    flex: 1,
    marginLeft: 8,
  },
});
