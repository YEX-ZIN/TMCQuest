# TMCQuest

TMCQuest is an Expo React Native treasure-hunt app for the GeoQuest assignment.

## What It Does

- Sign up and log in with the GeoQuest API.
- Create or join events with invite codes.
- View caches on a map.
- Use the AR camera screen to capture evidence when close enough.
- Track scores on event and public leaderboards.
- Edit your profile and manage host-only hunt locations.

## AR

The AR camera screen uses the camera, location, and motion sensors.
It shows distance and direction to the selected cache, and saves evidence photos locally after capture.

## Run From Scratch

1. Install Node.js 18 or newer.
2. Install npm if it is not included with Node.js.
3. Clone or download this repository.
4. Open a terminal in the project folder.
5. Install the project dependencies:

```bash
npm install
```

This installs the AR, map, navigation, and storage packages used by the app.

If Expo asks for compatible versions, you can install the main native packages with:

```bash
npx expo install expo-camera expo-location expo-sensors react-native-maps react-native-gesture-handler react-native-reanimated react-native-safe-area-context react-native-screens @react-native-community/datetimepicker @react-native-picker/picker @react-native-async-storage/async-storage
```

6. Create a `.env` file in the project root if one is not already present.
7. Copy the values from `.env.example` into `.env`:

```env
EXPO_PUBLIC_GEOQUEST_API_BASE=https://mark0s.com/geoquest/v1/api
EXPO_PUBLIC_GEOQUEST_API_KEY=n9suok
```

8. Start the app:

```bash
npm start
```

9. Open the app using one of these options:

- Scan the Expo QR code with Expo Go on a phone.
- Press `a` for Android.
- Press `i` for iOS.
- Press `w` for web.

## Notes

- Use a physical phone if you want camera and location features to work properly.
- If the app asks for camera or location permission, allow it.
- The app already points to the GeoQuest API in `.env.example`.

## Submission

- Commit and push a working version to `main`.
- Submit the repository URL to Canvas.
- Make sure all required academic reviewers have been invited and accepted.
