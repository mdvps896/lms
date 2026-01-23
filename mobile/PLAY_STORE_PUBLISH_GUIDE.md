# Google Play Store Publishing Guide (Flutter)

Aapki Flutter app ko Google Play Store par live karne ke liye ye steps follow karein.

## Step 1: Google Play Console Account
1. [Google Play Console](https://play.google.com/console/signup) par jayein.
2. $25 (one-time fee) pay karke Developer Account banayein.
3. Identity verification process complete karein.

## Step 2: App Readiness Check
*   **App Name:** Check karein ki name unique hai.
*   **App Icon:** 512x512px (Transparent background allowed).
*   **Feature Graphic:** 1024x500px.
*   **Screenshots:** Mobile, 7-inch tablet, aur 10-inch tablet ke liye screenshots ready rakhein.
*   **Privacy Policy:** Ek privacy policy URL ready rakhein (Aap GitHub Pages ya normal website par host kar sakte hain).

## Step 3: Bundle ID aur Permissions
1. `android/app/build.gradle` mein `applicationId` check karein (e.g., `com.example.yourapp`). Ye unique hona chahiye.
2. `android/app/src/main/AndroidManifest.xml` mein check karein ki sirf zaroori permissions (`INTERNET`, `CAMERA`, etc.) hi added hain.

## Step 4: Signing the App (Keystore)
Google Play Store bina signed app ke accept nahi karta.
1. **Keystore Generate Karein:**
   Terminal mein niche di gayi command chalayein:
   ```bash
   keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
   *(Windows par `~/` ki jagah apna path dein, e.g., `C:\Users\Name\upload-keystore.jks`)*

2. **`key.properties` Create Karein:**
   `android` folder ke andar `key.properties` file banayein aur ye details dalein:
   ```properties
   storePassword=your-password
   keyPassword=your-password
   keyAlias=upload
   storeFile=/path/to/your/upload-keystore.jks
   ```

3. **`build.gradle` Configure Karein:**
   `android/app/build.gradle` mein signing configs setup karein (Official documentation follow karein).

## Step 5: Build App Bundle (.aab)
Google ab `.apk` ki jagah `.aab` (Android App Bundle) prefer karta hai kyunki uska size chota hota hai.
Terminal mein ye command chalayein:
```bash
flutter build appbundle --release
```
Ye file aapko `build/app/outputs/bundle/release/app-release.aab` mein milegi.

## Step 6: Create App on Play Console
1. Play Console mein "Create app" par click karein.
2. Default language aur App type (App or Game, Free or Paid) select karein.
3. **App Setup:** Dashboard par "Set up your app" section ke andar saare tasks complete karein (Privacy policy, Content rating, Target audience, etc.).

## Step 7: Release to Production
1. "Production" track par jayein.
2. `Create new release` par click karein.
3. Apni `.aab` file upload karein.
4. Release details aur changes likhein.
5. "Review release" par click karke "Start rollout to Production" karein.

## Step 8: Waiting for Review
*   Pehli baar app review hone mein **3-7 din** tak lag sakte hain.
*   Review ke baad agar sab sahi raha toh app Play Store par **Live** ho jayegi.

---
**Tips for Success:**
*   Aapke screens high-quality hone chahiye.
*   App crash nahi honi chahiye (First run properly check karein).
*   Description mein keywords use karein taaki search mein app upar aaye.
