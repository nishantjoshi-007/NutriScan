# NutriScan - Food Scanner App

A React Native Expo app that uses camera and AI to analyze food nutrition information.

## Features

- 📷 **Camera Integration**: Capture food images
- ⚖️ **Weight Input**: Manual weight entry with AI-assisted estimation
- 🤖 **AI Analysis**: Gemini API integration for nutrition analysis and weight estimation
- 📊 **Nutrition Display**: Comprehensive nutrition information including vitamins, minerals, and renal diet guidance

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

1. **Camera Screen**: Take a photo of food
2. **Weight Input Screen**: Choose between AI weight estimation or manual entry
3. **Results Screen**: View comprehensive nutrition analysis

## Current Implementation

- ✅ Camera functionality with preview
- ✅ AI-powered weight estimation from food images
- ✅ Manual weight input with quick select buttons
- ✅ Gemini API integration for nutrition analysis
- ✅ Comprehensive nutrition results with vitamins and minerals
- ✅ Renal diet assessment for kidney disease patients
- ✅ Professional UI with gradients and cards
- ✅ Navigation between screens

## Future Enhancements (Phase 2+)

- [ ] Volume estimation using computer vision
- [ ] Offline food database
- [ ] History of scanned foods
- [ ] Barcode scanning
- [ ] Multiple food items in one image

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for navigation
- **Expo Camera** for camera functionality
- **Gemini AI** for food analysis
- **Axios** for API calls

## Project Structure

```
src/
├── screens/           # App screens
│   ├── CameraScreen.tsx
│   ├── WeightInputScreen.tsx
│   └── ResultsScreen.tsx
├── services/          # API services
│   └── geminiService.ts
├── types/             # TypeScript types
│   └── nutrition.ts
└── components/        # Reusable components (future)
```

## Notes

- This is a personal app with no authentication required
- All nutrition analysis is done via cloud API calls
- Images are processed locally and sent to Gemini API
- Results are estimates and should not be used for medical purposes
