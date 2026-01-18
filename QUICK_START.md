# Quick Start - Convert to APK

## Fastest Way to Build Your APK

### 1. Install Dependencies (First Time Only)
```bash
npm install
```

### 2. Add Android Platform (First Time Only)
```bash
npx cap add android
```

### 3. Sync Your Web Files
```bash
npx cap sync
```

### 4. Open in Android Studio
```bash
npx cap open android
```

### 5. Build APK in Android Studio
- Click **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- Find your APK at: `android/app/build/outputs/apk/debug/app-debug.apk`

## After Making Changes

Whenever you update HTML, CSS, or JavaScript:

```bash
npx cap sync
```

Then rebuild in Android Studio.

## Need Help?

See **BUILD_INSTRUCTIONS.md** for detailed steps, troubleshooting, and release APK instructions.


