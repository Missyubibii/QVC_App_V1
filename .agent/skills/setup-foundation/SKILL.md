---
description: "CRITICAL: Khởi tạo Project Expo Prebuild (CNG) trên Antigravity. Yêu cầu: Dev Client, Tunneling, Clean Architecture, Strict Identity."
globs: "app.json, package.json, babel.config.js, src/**/*"
---

# SKILL: Setup Foundation (Expo Prebuild / Cloud Edition)

> [!WARNING]
> **Antigravity Context**: Môi trường này là Cloud Container.
>
> 1. KHÔNG thể chạy Emulator trực tiếp.
> 2. BẮT BUỘC dùng `npx expo start --tunnel` để kết nối điện thoại.
> 3. BẮT BUỘC cài `expo-dev-client` để chạy MapLibre/Native Modules.

## 🎯 Mục Tiêu Cốt Lõi

1. **Dev Client First**: Thiết lập môi trường chạy Custom Native ngay từ đầu.
2. **Cloud Ready**: Cấu hình Tunneling để dev trên Antigravity.
3. **Clean Architecture**: Tạo khung sườn chuẩn Domain-Driven Design.
4. **Fail-Fast**: Validate biến môi trường ngay khi khởi động.

---

## 🔧 BƯỚC 1: Khởi tạo & Cài đặt Core (Prebuild Heart)

**Mục tiêu:** Cài đặt "Trái tim" của hệ thống Prebuild.

**AI Action:** Chạy lần lượt các lệnh sau (Đừng gộp chung để dễ debug):

```bash
# 1. Khởi tạo Project (Nếu chưa có)
npx create-expo-app@latest frontend --template blank-typescript
cd frontend

# 2. CRITICAL: Cài đặt Development Client & Tunnel (Cho Antigravity)
npx expo install expo-dev-client
npm install -g @expo/ngrok

# 3. Core Framework & Navigation
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar expo-font expo-splash-screen

# 4. UI Engine (NativeWind v4)
npx expo install nativewind react-native-reanimated react-native-svg
npm install tailwindcss

# 5. Data & Logic Layer
npm install axios @tanstack/react-query @tanstack/react-query-persist-client zustand zod clsx tailwind-merge date-fns
```

> [!IMPORTANT]
> **Tại sao expo-dev-client là BẮT BUỘC?**
>
> - Expo Go KHÔNG hỗ trợ MapLibre, VisionCamera (Native C++)
> - expo-dev-client tạo custom runtime build có chứa native modules
> - Nếu thiếu → App crash với lỗi "Native module not found"

---

## 🔧 BƯỚC 2: Định danh Ứng dụng (Identity Setup)

**Mục tiêu:** Prebuild sẽ THẤT BẠI nếu không có Package Name.

**File:** `app.json`

**AI Action:** Phải sửa file `app.json` ngay lập tức, thêm các trường sau:

```json
{
  "expo": {
    "name": "QuocVietSuperApp",
    "slug": "quocviet-super-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "scheme": "quocvietapp",
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.quocviet.superapp"  // 👈 BẮT BUỘC
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.quocviet.superapp"           // 👈 BẮT BUỘC
    },
    "plugins": [
      "expo-router",
      "expo-font"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

> [!CRITICAL]
> `bundleIdentifier` (iOS) và `package` (Android) PHẢI được khai báo TRƯỚC khi cài bất kỳ native module nào (MapLibre, Camera). Nếu thiếu, Prebuild sẽ tạo config sai.

---

## 🔧 BƯỚC 3: Cấu hình UI Engine (NativeWind v4)

**Mục tiêu:** Setup TailwindCSS đúng chuẩn v4 cho Expo 52.

### File 1: `tailwind.config.js` (Tạo mới)

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  // 🔥 QUAN TRỌNG: Phải trỏ đúng đường dẫn
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### File 2: `babel.config.js`

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      "react-native-reanimated/plugin", // Phải luôn ở cuối cùng
    ],
  };
};
```

> [!NOTE]
> **NativeWind v4 Changes**: Không cần plugin `nativewind/babel` nữa. Chỉ cần set `jsxImportSource: "nativewind"` trong `babel-preset-expo` là đủ.

### File 3: `src/global.css` (Tạo mới)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### File 4: `app/_layout.tsx` (Import CSS)

```typescript
import "../src/global.css"; // 👈 Import dòng đầu tiên
import { Slot } from "expo-router";

export default function RootLayout() {
  return <Slot />;
}
```

### File 5: `metro.config.js` (Tạo mới)

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./src/global.css" });
```

> [!CRITICAL]
> **Metro Config là BẮT BUỘC**: NativeWind v4 cần `withNativeWind` wrapper để biên dịch CSS đúng cách, đặc biệt khi chạy với `--tunnel` trên Antigravity.

> [!WARNING]
> **NativeWind v4 Breaking Changes:**
>
> - PHẢI import `global.css` vào `_layout.tsx`
> - PHẢI set `jsxImportSource: "nativewind"` trong babel
> - Nếu thiếu → TailwindCSS không chạy, giao diện vỡ

---

## 🔧 BƯỚC 4: Tạo Cấu Trúc Thư Mục (Clean Architecture)

**AI Action:** Tạo cây thư mục chuẩn. Không được sáng tạo thêm.

```bash
mkdir -p src/core/config
mkdir -p src/core/networking
mkdir -p src/core/sdui
mkdir -p src/core/hardware
mkdir -p src/data/repositories
mkdir -p src/data/sources
mkdir -p src/domain/models
mkdir -p src/domain/types
mkdir -p src/presentation/components/ui
mkdir -p src/presentation/components/widgets
mkdir -p src/presentation/screens
mkdir -p src/presentation/hooks
mkdir -p src/store
```

**Giải thích cấu trúc:**

- `core/`: Engine cốt lõi (SDUI, Hardware Guards, API Client)
- `data/`: Repository pattern, Data sources (API, Cache)
- `domain/`: Business logic, Types, Models
- `presentation/`: UI Components, Screens, Hooks
- `store/`: Global state (Zustand)

---

## 🔧 BƯỚC 5: Fail-Fast Config (Validation)

**File:** `src/core/config/env.ts`

**Mục tiêu:** App sập ngay nếu config sai (tránh bug ẩn).

```typescript
import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_IS_MOCK: z.string().optional(),
});

// Validate process.env
const _env = envSchema.safeParse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_IS_MOCK: process.env.EXPO_PUBLIC_IS_MOCK,
});

if (!_env.success) {
  console.error("❌ INVALID ENVIRONMENT VARIABLES:", _env.error.format());
  throw new Error("Invalid Environment Variables");
}

export const Env = _env.data;
```

**File:** `.env` (Tạo mới)

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api
EXPO_PUBLIC_IS_MOCK=false
```

> [!TIP]
> `10.0.2.2` là địa chỉ localhost từ Android Emulator. Trên Antigravity, thay bằng URL ngrok sau khi start tunnel.

---

## 🔧 BƯỚC 6: Antigravity Tunnel Setup

**Mục tiêu:** Kết nối điện thoại thật với Cloud IDE.

**AI Action:**

1. Start dev server với tunnel:

   ```bash
   npx expo start --dev-client --tunnel
   ```

2. Đợi ngrok tạo URL (vd: `https://abc123.ngrok.io`)

3. Cập nhật `.env`:

   ```bash
   EXPO_PUBLIC_API_URL=https://abc123.ngrok.io/api
   ```

4. Quét QR code trên điện thoại → App sẽ kết nối qua tunnel

> [!CRITICAL]
> **Không dùng `--tunnel` = Không kết nối được**. Antigravity không có IP công khai, điện thoại không thể tìm thấy server.

---

## 🚨 Checklist Kiểm Tra (Definition of Done)

AI phải tự kiểm tra các điểm sau:

### Core Setup

- [ ] **Dev Client**: Đã cài `expo-dev-client` chưa? (Bắt buộc cho MapLibre)
- [ ] **Package Name**: File `app.json` đã có `android.package` và `ios.bundleIdentifier` chưa?
- [ ] **Tunnel**: Đã nhắc user chạy với cờ `--tunnel` chưa?

### UI Engine

- [ ] **Tailwind**: Đã import `global.css` vào `_layout.tsx` chưa?
- [ ] **Babel**: Đã set `jsxImportSource: "nativewind"` chưa?
- [ ] **Preset**: Đã thêm `nativewind/preset` vào `tailwind.config.js` chưa?

### Architecture

- [ ] **Folders**: Đã tạo đủ 13 thư mục theo Clean Arch chưa?
- [ ] **Env Validation**: Đã tạo `src/core/config/env.ts` chưa?
- [ ] **.env**: Đã tạo file `.env` với `EXPO_PUBLIC_API_URL` chưa?

---

## 💡 Pro Tips (Antigravity Specific)

### Start Command

Luôn dùng:

```bash
npx expo start --dev-client --tunnel
```

- `--dev-client`: Để báo cho Expo biết ta dùng App riêng, không phải Expo Go.
- `--tunnel`: Để xuyên tường lửa Cloud.

### No Native Build

**ĐỪNG** cố chạy `npx expo run:android` trên Antigravity (Sẽ lỗi vì không có Emulator).

**Thay vào đó:**

1. Build APK ở máy local hoặc EAS
2. Cài vào điện thoại
3. Kết nối tới Antigravity qua tunnel

### Debug Tips

- **Lỗi "Native module not found"** → Thiếu `expo-dev-client`
- **Lỗi "Unable to resolve module"** → Cần rebuild dev client
- **TailwindCSS không chạy** → Kiểm tra `global.css` import
- **Không kết nối được** → Kiểm tra tunnel đang chạy và QR code

---

## 📦 npm Scripts (Recommended)

Thêm vào `package.json`:

```json
{
  "scripts": {
    "start": "expo start --dev-client",
    "start:tunnel": "expo start --dev-client --tunnel",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "prebuild": "expo prebuild",
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 🎓 Tài Liệu Tham Khảo

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [NativeWind v4 Setup](https://www.nativewind.dev/v4/getting-started/expo-router)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Tunneling with ngrok](https://docs.expo.dev/more/expo-cli/#tunneling)
