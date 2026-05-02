# NTD Project

This repository contains two main projects:
1. **NTD_Android Studio** - Android Assistive App
2. **NTD_Antigravity** - React/Vite Web Application

## Setup Instructions

### Before Running the Projects

**Important:** This repository does NOT include sensitive configuration files for security reasons. You need to configure them locally.

### Android Project Setup

1. **Configure Firebase:**
   - Copy the template file: `cp NTD_Android\ Studio/app/google-services.json.template NTD_Android\ Studio/app/google-services.json`
   - Replace `YOUR_*` placeholders with your actual Firebase project credentials from [Firebase Console](https://console.firebase.google.com)

2. **Configure Local SDK Path:**
   - Copy the template file: `cp NTD_Android\ Studio/local.properties.template NTD_Android\ Studio/local.properties`
   - Update the `sdk.dir` value with your Android SDK path (typically `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk` on Windows)

3. **Build and Run:**
   ```bash
   cd NTD_Android\ Studio
   ./gradlew build
   ```

### Web Project Setup (Antigravity)

1. **Install Dependencies:**
   ```bash
   cd NTD_Antigravity
   npm install
   ```

2. **Configure Firebase (if needed):**
   - Update the Firebase configuration in `src/firebase.js` with your project credentials (do not commit this file with secrets)

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```

## Security Notes

- **Never commit** the following files:
  - `google-services.json` (Android Firebase config)
  - `local.properties` (Local SDK paths)
  - `.env` files (Environment variables)
  - API keys and credentials
  
- Always use `.template` files as reference and create local copies with actual values
- Use `.gitignore` to prevent accidental commits of sensitive files

## Project Structure

```
NTD/
├── NTD_Android Studio/     # Android application
│   ├── app/
│   │   ├── src/
│   │   │   ├── java/       # Java source code
│   │   │   └── res/        # Resources (layouts, drawables, values)
│   │   ├── build.gradle
│   │   └── google-services.json.template
│   ├── local.properties.template
│   └── settings.gradle
├── NTD_Antigravity/        # React/Vite web application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── assets/         # Static assets
│   │   └── firebase.js     # Firebase configuration
│   ├── package.json
│   └── vite.config.js
└── .gitignore
```

## Contributing

1. Never commit secrets or credentials
2. Use template files for configuration
3. Document any new dependencies or setup requirements

## Support

For Firebase setup help, visit: https://firebase.google.com/docs/android/setup
For Android SDK setup, visit: https://developer.android.com/studio/command-line/sdkmanager
