import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";

/**
 * Root navigation stack parameter list
 * Defines all screens and their expected parameters
 */
export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  WeightInput: {
    imageUri: string;
    detectedFood?: string;
    estimatedWeight?: number;
    confidence?: number;
  };
  Results: {
    imageUri: string;
    calories: number;
    weight: number;
    confidence: number;
    summary: {
      macros: any;
      vitamins: any[];
      minerals: any[];
      warnings: string[];
      tips: string[];
    };
    nutritionData: any;
    searchText?: string;
  };
  FoodLog: undefined;
  RecipeSearch: undefined;
  RecipeDetails: {
    recipeName: string;
    servings?: number;
  };
  TextSearch: undefined;
};

// Navigation prop types for each screen
export type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

export type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, "Camera">;

export type WeightInputScreenNavigationProp = StackNavigationProp<RootStackParamList, "WeightInput">;
export type WeightInputScreenRouteProp = RouteProp<RootStackParamList, "WeightInput">;

export type ResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, "Results">;
export type ResultsScreenRouteProp = RouteProp<RootStackParamList, "Results">;

export type FoodLogScreenNavigationProp = StackNavigationProp<RootStackParamList, "FoodLog">;
export type FoodLogScreenRouteProp = RouteProp<RootStackParamList, "FoodLog">;

export type RecipeSearchScreenNavigationProp = StackNavigationProp<RootStackParamList, "RecipeSearch">;

export type RecipeDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, "RecipeDetails">;
export type RecipeDetailsScreenRouteProp = RouteProp<RootStackParamList, "RecipeDetails">;

export type TextSearchScreenNavigationProp = StackNavigationProp<RootStackParamList, "TextSearch">;

// Screen props interfaces
export interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export interface CameraScreenProps {
  navigation: CameraScreenNavigationProp;
}

export interface WeightInputScreenProps {
  navigation: WeightInputScreenNavigationProp;
  route: WeightInputScreenRouteProp;
}

export interface ResultsScreenProps {
  navigation: ResultsScreenNavigationProp;
  route: ResultsScreenRouteProp;
}

export interface FoodLogScreenProps {
  navigation: FoodLogScreenNavigationProp;
  route: FoodLogScreenRouteProp;
}

export interface RecipeSearchScreenProps {
  navigation: RecipeSearchScreenNavigationProp;
}

export interface RecipeDetailsScreenProps {
  navigation: RecipeDetailsScreenNavigationProp;
  route: RecipeDetailsScreenRouteProp;
}

export interface TextSearchScreenProps {
  navigation: TextSearchScreenNavigationProp;
}
