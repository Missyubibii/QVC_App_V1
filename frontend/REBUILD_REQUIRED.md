# 🚨 CRITICAL: Rebuild Development Client Required

## ⚠️ The Native Rebuild Trap

You have installed **3 new native modules**:
- `react-native-mmkv` (C++ JSI bridge)
- `expo-location` (Native GPS)
- `expo-camera` (Native Camera)

**Your current Development Client on your phone does NOT have these native modules.**

### What Happens if You Don't Rebuild?

If you just run `npx expo start --tunnel` and reload the app:
- ❌ **App will CRASH immediately**
- ❌ Error: "MMKV JSI Module not found"
- ❌ Location/Camera features won't work

---

## ✅ Solution: Rebuild Development Client

### Option 1: Local Build (Recommended for Testing)

**Prerequisites:**
- Android Studio installed
- Android SDK configured
- Physical device connected via USB

**Steps:**
```bash
cd d:\quocviet-super-app\frontend

# Build and install to connected device
npx expo run:android
```

This will:
1. Run Gradle build with new native modules
2. Generate new APK
3. Auto-install to your device
4. Launch the app

### Option 2: EAS Build (For Production/Distribution)

```bash
# Configure EAS (first time only)
npx eas build:configure

# Build development client
npx eas build --profile development --platform android
```

Download the APK from EAS dashboard and install on your device.

---

## 📋 Verification After Rebuild

After rebuilding, verify MMKV is working:

```typescript
import { AppStorage } from '@/core/storage/mmkv';

// Test write
AppStorage.setItem('test_key', 'test_value');

// Test read
const value = AppStorage.getItem('test_key');
console.log('MMKV Test:', value); // Should print: "test_value"
```

If you see the log without crash → MMKV is working! ✅

---

## 🎯 Next Steps After Rebuild

1. ✅ Rebuild Dev Client (follow steps above)
2. ✅ Test MMKV storage
3. ✅ Test Location mock (on emulator/web)
4. ✅ Continue with `/debug` or `/auth`

---

## 💡 Pro Tip

**When do you need to rebuild?**

Rebuild is required when you:
- Install new native modules (like MMKV, Camera, etc.)
- Update native module versions
- Change `app.json` plugins configuration
- Modify native Android/iOS code

**When can you skip rebuild?**

You can use `npx expo start` (no rebuild) when you only:
- Change JavaScript/TypeScript code
- Update UI components
- Modify business logic
- Update environment variables

---

**Remember: Native modules = Native rebuild required!** 🔥
