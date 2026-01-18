# Build Android APK - Step by Step Guide

This guide will help you convert your Restaurant POS web application into an Android APK file.

## Prerequisites

1. **Node.js and npm** (v14 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **Android Studio** (for building the APK)
   - Download from: https://developer.android.com/studio
   - Install Android SDK and build tools

3. **Java Development Kit (JDK)** (version 11 or higher)
   - Usually comes with Android Studio
   - Verify: `java -version`

## Step 1: Install Dependencies

Open your terminal/command prompt in the project directory and run:

```bash
npm install
```

This will install Capacitor and all required dependencies.

## Step 2: Initialize Capacitor

```bash
npx cap init
```

When prompted:
- **App name**: Restaurant POS (or your preferred name)
- **App ID**: com.restaurant.pos (or your preferred ID like com.yourcompany.restaurant)
- **Web directory**: . (current directory)

Alternatively, if capacitor.config.json already exists, you can skip this step.

## Step 3: Add Android Platform

```bash
npx cap add android
```

This creates the Android project structure.

## Step 4: Sync Web Assets

```bash
npx cap sync
```

This copies your web files (HTML, CSS, JS, images) to the Android project.

## Step 5: Open in Android Studio

```bash
npx cap open android
```

This opens the Android project in Android Studio.

## Step 6: Configure Android App in Android Studio

1. In Android Studio, wait for Gradle sync to complete
2. Go to **File → Project Structure** (or press `Ctrl+Alt+Shift+S`)
   - Set **Compile SDK Version** to 34 or higher
   - Set **Target SDK Version** to 34 or higher
   - Set **Minimum SDK Version** to 22 or higher (Android 5.1)

3. Configure App Icon (Optional):
   - Right-click on `app/src/main/res` → New → Image Asset
   - Choose your app icon
   - This will update `mipmap` folders

4. Configure App Name and Version:
   - Open `app/src/main/AndroidManifest.xml`
   - Verify package name matches your app ID
   - Check application label

## Step 7: Build APK

### Option A: Build Debug APK (for testing)

1. In Android Studio, go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for the build to complete
3. When finished, click **locate** in the notification
4. Your APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option B: Build Release APK (for distribution)

1. **Create a Keystore** (if you don't have one):
   ```bash
   keytool -genkey -v -keystore restaurant-pos-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias restaurant-pos
   ```
   - Enter a password (remember it!)
   - Fill in your details

2. **Configure Signing**:
   - Create file: `android/key.properties`
   - Add:
     ```
     storePassword=YOUR_KEYSTORE_PASSWORD
     keyPassword=YOUR_KEY_PASSWORD
     keyAlias=restaurant-pos
     storeFile=../restaurant-pos-key.jks
     ```

3. **Update build.gradle** (`android/app/build.gradle`):
   - Add at the top:
     ```gradle
     def keystorePropertiesFile = rootProject.file("key.properties")
     def keystoreProperties = new Properties()
     if (keystorePropertiesFile.exists()) {
         keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
     }
     ```
   - Find `android` block and add:
     ```gradle
     signingConfigs {
         release {
             keyAlias keystoreProperties['keyAlias']
             keyPassword keystoreProperties['keyPassword']
             storeFile file(keystoreProperties['storeFile'])
             storePassword keystoreProperties['storePassword']
         }
     }
     buildTypes {
         release {
             signingConfig signingConfigs.release
             minifyEnabled false
             proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
         }
     }
     ```

4. **Build Release APK**:
   - In Android Studio: **Build → Generate Signed Bundle / APK**
   - Choose **APK**
   - Select your keystore file
   - Enter passwords
   - Choose **release** build variant
   - Click **Finish**
   - APK location: `android/app/release/app-release.apk`

### Option C: Build from Command Line

```bash
cd android
./gradlew assembleDebug    # For debug APK
./gradlew assembleRelease  # For release APK (requires signing setup)
```

On Windows:
```bash
cd android
gradlew.bat assembleDebug
gradlew.bat assembleRelease
```

## Step 8: Install APK on Device

### Method 1: Direct Transfer
- Transfer the APK file to your Android device
- Open file manager on device
- Tap the APK file
- Allow installation from unknown sources if prompted
- Install

### Method 2: Via ADB (Android Debug Bridge)
```bash
adb install app-debug.apk
```

## Updating the App

After making changes to your web files (HTML, CSS, JS):

1. Sync the changes:
   ```bash
   npx cap sync
   ```

2. Rebuild in Android Studio or run:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

## Troubleshooting

### Issue: "SDK location not found"
- Open Android Studio → Preferences → Appearance & Behavior → System Settings → Android SDK
- Note the "Android SDK Location"
- Create file `android/local.properties` with:
  ```
  sdk.dir=/path/to/your/android/sdk
  ```

### Issue: Build fails with Gradle errors
- In Android Studio: **File → Invalidate Caches → Invalidate and Restart**
- Try: **Build → Clean Project**, then **Build → Rebuild Project**

### Issue: App crashes on launch
- Check Android Studio Logcat for errors
- Ensure all file paths in your code are correct
- Verify that images are copied to the correct location

### Issue: Web assets not updating
- Run `npx cap sync` after any web file changes
- Clear app data on your device/emulator

## Important Notes

- **LocalStorage**: Works in the app, but data is stored per-installation
- **File Access**: Ensure proper permissions in `AndroidManifest.xml` if needed
- **Images**: Make sure all images in the `images/` folder are included
- **Testing**: Always test on a real device before distribution

## Next Steps

- Test the app thoroughly on different Android versions
- Consider adding app icons and splash screens
- Configure app permissions if needed (camera, storage, etc.)
- Publish to Google Play Store (requires release APK and Play Console account)

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Add Android platform (first time only)
npx cap add android

# Sync web files to Android
npx cap sync

# Open in Android Studio
npx cap open android

# Copy web files only
npx cap copy
```

Good luck building your Android app! 🚀


