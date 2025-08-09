# NutriScan - Food Scanner App

A React Native Expo app that uses camera and AI to analyze food nutrition information.

## Features

- 📷 **Camera Integration**: High-quality food image capture with preview
- 📝 **Text Search**: Manual food description input for analysis
- 🍽️ **CKD Recipe Search**: Specialized kidney-friendly recipe discovery
- ⚖️ **Smart Weight Input**: AI-assisted estimation with manual override options
- 🤖 **Advanced AI Analysis**: Gemini API integration for comprehensive nutrition analysis
- 📊 **Complete Nutrition Display**: Detailed vitamins, minerals, macros, and renal diet guidance
- 🏥 **CKD-Specific Features**: Safety assessments, portion recommendations, and stage-specific advice
- 🌐 **Multilingual Support**: English and Gujarati language options
- 📱 **Modern UI/UX**: Professional design with intuitive navigation

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 3. Configure API Key

Edit `src/services/geminiService.ts` and replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key:

```typescript
const GEMINI_API_KEY = "your_actual_api_key_here";
```

### 4. Run the App

```bash
# Start the development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## App Flow

### Primary Flows

1. **Camera Flow**:
   - Take a photo of food → AI weight estimation or manual entry → Comprehensive nutrition analysis
2. **Text Search Flow**:
   - Enter food description manually → Optional weight input → AI-powered nutrition analysis
3. **CKD Recipe Search Flow**:
   - Search for kidney-friendly recipes → View recipe list with nutrition previews → Detailed recipe with full nutrition analysis

### Navigation Structure

- **Home Screen**: Recent scan history, statistics, and main navigation options
- **Camera Screen**: Food photo capture with preview
- **Weight Input Screen**: AI estimation or manual weight entry
- **Text Search Screen**: Manual food description input
- **Recipe Search Screen**: CKD-specific recipe discovery
- **Recipe Details Screen**: Complete recipe with nutrition analysis
- **Results Screen**: Comprehensive nutrition breakdown with renal diet assessment

## Current Implementation

### Core Features

- ✅ **Multi-input Analysis**: Camera capture, text search, and recipe search
- ✅ **AI-Powered Weight Estimation**: Computer vision-based food weight estimation
- ✅ **Manual Weight Input**: Quick select buttons and custom input
- ✅ **Comprehensive Nutrition Analysis**: Complete vitamin, mineral, and macro breakdown
- ✅ **Advanced Renal Diet Assessment**: CKD-specific safety analysis with detailed warnings
- ✅ **Enhanced Kidney Health Features**: Antioxidants, portion recommendations, dialysis compatibility

### Specialized CKD Features

- ✅ **CKD Recipe Search**: Curated kidney-friendly recipes with strict nutritional criteria
- ✅ **Recipe Details**: Complete cooking instructions with renal diet modifications
- ✅ **Safety Classification**: Comprehensive safety flags (safe/caution/avoid)
- ✅ **Primary Concerns**: Specific health warnings for CKD patients
- ✅ **Additional Minerals**: Oxalates, purines, chloride, and sulfur tracking
- ✅ **CKD Stage Recommendations**: Tailored advice for different kidney disease stages

### User Experience

- ✅ **Search History**: Persistent storage of all nutrition analyses
- ✅ **Statistics Dashboard**: Weekly and monthly scan tracking
- ✅ **Multilingual Support**: English and Gujarati language options
- ✅ **Professional UI**: Modern design with gradients, cards, and intuitive navigation
- ✅ **Comprehensive Navigation**: Seamless flow between all features

### Technical Implementation

- ✅ **Gemini AI Integration**: Advanced prompting for accurate nutrition analysis
- ✅ **Type Safety**: Complete TypeScript implementation with comprehensive interfaces
- ✅ **Data Persistence**: Local storage for search history and user preferences
- ✅ **Error Handling**: Robust error management with user-friendly messages

## Future Enhancements (Phase 2+)

- [ ] Volume estimation using computer vision
- [ ] Offline food database
- [ ] Barcode scanning
- [ ] Multiple food items in one image

## Tech Stack

- **React Native** with Expo for cross-platform mobile development
- **TypeScript** for comprehensive type safety and developer experience
- **React Navigation** for seamless screen navigation
- **UI Kitten** for professional UI components and theming
- **Expo Camera** for high-quality camera functionality
- **Gemini AI** for advanced food analysis and recipe recommendations
- **i18next** for internationalization and multilingual support
- **AsyncStorage** for local data persistence
- **Axios** for robust API communication

## Project Structure

```
src/
├── screens/              # App screens
│   ├── HomeScreen.tsx           # Main dashboard with history and navigation
│   ├── CameraScreen.tsx         # Food photo capture
│   ├── WeightInputScreen.tsx    # Weight estimation and input
│   ├── TextSearchScreen.tsx     # Manual food description search
│   ├── RecipeSearchScreen.tsx   # CKD recipe discovery
│   ├── RecipeDetailsScreen.tsx  # Detailed recipe view with nutrition
│   └── ResultsScreen.tsx        # Comprehensive nutrition analysis
├── services/             # API and data services
│   ├── geminiService.ts         # Gemini AI integration
│   └── searchHistoryService.ts  # Local data persistence
│   └── volumeEstimationService.ts  # Estimate volume using Computer vision
├── types/                # TypeScript type definitions
│   ├── nutrition.ts             # Nutrition and recipe interfaces
│   └── searchHistory.ts         # Search history data structures
├── components/           # Reusable UI components
│   └── LanguageSwitcher.tsx     # Language selection component
├── i18n/                # Internationalization
│   ├── i18n.ts                  # i18next configuration
│   └── locales/                 # Translation files
│       ├── en.json              # English translations
│       └── gu.json              # Gujarati translations
└── theme/               # UI theming
    └── greenTheme.ts            # Custom UI Kitten theme
```

## Notes

- **Medical Focus**: Specialized for CKD (Chronic Kidney Disease) patients with comprehensive renal diet analysis
- **Personal Health App**: No authentication required - designed for individual use
- **Cloud-Powered Analysis**: All nutrition analysis powered by Gemini AI with sophisticated prompting
- **Local Data Storage**: Search history and preferences stored locally on device
- **Educational Tool**: Results are estimates and should complement, not replace, medical advice
- **Multilingual Ready**: Currently supports English and Gujarati with extensible architecture
- **Privacy-First**: Images processed securely through Google's Gemini API with no permanent storage
