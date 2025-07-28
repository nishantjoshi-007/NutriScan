// Configuration file for NutriScan app
export const config = {
  // Gemini API Configuration
  gemini: {
    // Replace with your actual Gemini API key from Google AI Studio
    // Get it from: https://makersuite.google.com/app/apikey
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API,

    // API endpoint (usually doesn't need to change)
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",

    // Model settings
    model: "gemini-2.0-flash",
    temperature: 0.4, // Lower = more consistent results
  },

  // App settings
  app: {
    // Image quality for camera (0.1 to 1.0)
    imageQuality: 0.8,

    // Maximum weight allowed (in grams)
    maxWeight: 5000,
  },

  // UI colors
  colors: {
    primary: "#4CAF50",
    secondary: "#45B7D1",
    error: "#FF6B6B",
    warning: "#FFA726",
    success: "#66BB6A",
    background: "#f8f9fa",
    white: "#ffffff",
    text: "#333333",
    textSecondary: "#666666",
  },
};

export default config;
