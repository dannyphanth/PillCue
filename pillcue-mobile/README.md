# PillCue Mobile

Expo React Native migration of the original `MedicineTracker` hackathon project.

## What this app includes

- Android-emulator-friendly Expo shell
- Home, Scan Bottle, OCR Review, and Medication Schedule screens
- Local medication storage with AsyncStorage
- Reused schedule behavior from the original web app
- Mobile image upload flow that calls the existing Python backend

## Run the mobile app

1. Install dependencies:

```bash
npm install
```

2. Start Expo:

```bash
npm run android
```

3. Optional: override the backend URL if needed.

Android emulator default:

```bash
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5050
```

## Run the backend

From `MedicineTracker-main/backend`:

```bash
pip install -r requirements.txt
python app.py
```

If you want LLM parsing instead of the built-in fallback parser, set:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```
