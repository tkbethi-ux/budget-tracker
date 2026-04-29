# Budget Tracker

Budget Tracker is a React Native app for iOS and Android that helps track store spending against bi-weekly or monthly budgets. The app is built from the original React Native CLI project in this workspace and is now consistently named `BudgetTracker` across JavaScript, Android, and iOS project files.

## Features

- Switch between bi-weekly and monthly budget modes.
- Set bi-weekly budget, monthly budget, and savings goal amounts.
- Add, edit, and update stores with category, amount spent, and visit count.
- Star favorite stores and mark stores as "my store".
- Quickly add visits or common spend amounts to existing stores.
- See total spent, remaining budget, and budget progress.
- View bi-weekly and monthly reports, category breakdowns, average spend per visit, and top spending store.
- Manage a grocery list with item quantities, estimated costs, checked-off items, and remaining grocery estimate.
- Forecast remaining budget after unpurchased grocery list items.
- Save budgets, stores, visits, spend amounts, and grocery items locally on the device.
- Start clean on first launch with no seeded demo budget, stores, or grocery list data.
- Include Budget Tracker launcher icons for iOS and Android.

## Project Name

- Folder: `BudgetTracker`
- React Native app name: `BudgetTracker`
- Visible app name: `Budget Tracker`
- Android application id: `com.budgettracker`
- iOS scheme/workspace/project: `BudgetTracker`

## App Icon

- iOS app icons live in `ios/BudgetTracker/Images.xcassets/AppIcon.appiconset`.
- The App Store marketing icon is `AppIcon-1024.png`, exported as an opaque 1024 x 1024 RGB PNG with no alpha channel.
- Android launcher icons live in `android/app/src/main/res/mipmap-*`.
- Android adaptive icon resources live in `android/app/src/main/res/mipmap-anydpi-v26` with foreground and background drawables in `android/app/src/main/res/drawable`.
- The in-app header logo lives at `assets/brand/budget-tracker-logo.png`.

## Requirements

Follow the React Native environment setup for your target platform:

- [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment)
- Node.js compatible with the version required in `package.json`
- Android Studio and an Android emulator or device for Android
- Xcode and CocoaPods for iOS

## Install Dependencies

From the project root:

```sh
npm install
```

For iOS, install CocoaPods dependencies:

```sh
cd ios
bundle install
bundle exec pod install
cd ..
```

## Run The App

Start Metro:

```sh
npm start
```

In another terminal, run iOS:

```sh
npm run ios
```

Or run Android:

```sh
npm run android
```

## Useful Commands

Run TypeScript checks:

```sh
npx tsc --noEmit
```

Run lint:

```sh
npm run lint
```

Run tests:

```sh
npm test -- --runInBand --watchman=false
```

List the iOS workspace schemes:

```sh
cd ios
xcodebuild -list -workspace BudgetTracker.xcworkspace
```

## Current Notes

- Fresh installs open with empty budgets, stores, and grocery list data.
- The app persists local data with `@react-native-async-storage/async-storage`, so closing and reopening the app keeps saved budgets, stores, visits, spend amounts, and grocery list items on that device.
- The current persistence is local-only. A natural next step for a production App Store release is optional cloud sync or account backup if you want data restored across devices.
- `bundle exec pod install` has been run successfully for the renamed `BudgetTracker` iOS target.
- Android project naming has been updated to `BudgetTracker` and `com.budgettracker`. A local Android debug build check hit a Gradle/toolchain cache issue unrelated to the rename: `JvmVendorSpec does not have member field IBM_SEMERU`.

## Main Files

- `App.tsx` contains the Budget Tracker UI and app logic.
- `assets/brand/budget-tracker-logo.png` contains the in-app logo.
- `app.json` contains the React Native app name and display name.
- `android/app/build.gradle` contains the Android namespace and application id.
- `ios/Podfile` contains the iOS target name.
