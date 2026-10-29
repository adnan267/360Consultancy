# Android app (Capacitor wrapper)

App live website `https://www.360consultancy.pk` ko load karti hai, is liye website update hone par app khud update ho jati hai.

- Debug APK: GitHub → Actions → "Android build" → Run workflow → artifact `360consultancy-debug-apk`.
- Play Store ke liye signed AAB chahiye (keystore apni machine par banayen, repo mein commit na karein).
- Push notifications: Firebase `google-services.json` + backend token registration abhi baqi hai.
