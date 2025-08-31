import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import * as eva from "@eva-design/eva";
import { ApplicationProvider } from "@ui-kitten/components";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { greenTheme } from "./src/theme/greenTheme";

// Initialize i18n
import "./src/i18n/i18n";

// Import screens
import HomeScreen from "./src/screens/HomeScreen";
import CameraScreen from "./src/screens/CameraScreen";
import WeightInputScreen from "./src/screens/WeightInputScreen";
import ResultsScreen from "./src/screens/ResultsScreen";
import TextSearchScreen from "./src/screens/TextSearchScreen";
import RecipeSearchScreen from "./src/screens/RecipeSearchScreen";
import RecipeDetailsScreen from "./src/screens/RecipeDetailsScreen";
import FoodLogScreen from "./src/screens/FoodLogScreen";

// Import navigation types
import { RootStackParamList } from "./src/types/navigation";

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <ApplicationProvider {...eva} theme={greenTheme}>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: "#4CAF50",
              },
              headerTintColor: "#fff",
              headerTitleStyle: {
                fontWeight: "bold",
              },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: "NutriScan", headerShown: false }} />
            <Stack.Screen
              name="Camera"
              component={CameraScreen}
              options={{ title: "NutriScan - Capture Food", headerBackTitle: "" }}
            />
            <Stack.Screen
              name="WeightInput"
              component={WeightInputScreen}
              options={{ title: "Enter Weight", headerBackTitle: "" }}
            />
            <Stack.Screen
              name="TextSearch"
              component={TextSearchScreen}
              options={{ title: "Text Search", headerBackTitle: "" }}
            />
            <Stack.Screen
              name="RecipeSearch"
              component={RecipeSearchScreen}
              options={{ title: "Recipe Search", headerBackTitle: "" }}
            />
            <Stack.Screen
              name="RecipeDetails"
              component={RecipeDetailsScreen}
              options={{ title: "Recipe Details", headerBackTitle: "" }}
            />
            <Stack.Screen
              name="FoodLog"
              component={FoodLogScreen}
              options={{ title: "Food Log", headerBackTitle: "" }}
            />
            <Stack.Screen
              name="Results"
              component={ResultsScreen}
              options={{ title: "Nutrition Results", headerBackTitle: "" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ApplicationProvider>
    </SafeAreaProvider>
  );
}
