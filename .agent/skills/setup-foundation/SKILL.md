---
description: Khởi tạo Project chuẩn Clean Architecture & Fail-Fast Config
---

# SKILL: Setup Foundation

## 🎯 Mục tiêu

1. **Strict Stack**: Cài đặt đúng phiên bản thư viện tương thích Expo SDK 53
2. **Fail-Fast Config**: App không khởi động nếu biến môi trường sai (Thiếu HTTPS)
3. **Clean Architecture**: Tạo sẵn cây thư mục chuẩn để AI không tạo file lung tung

## 📋 Prerequisites

- Node.js 18+
- Expo CLI

---

## 🔧 STEP 1: Strict Dependency Installation

### Mục tiêu

Cài đặt thư viện bằng `expo install` để đảm bảo tương thích phiên bản (Native Modules).

### Commands

Chạy lần lượt các lệnh sau:

```bash
# 1. Core Framework
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar expo-font expo-splash-screen

# 2. UI Engine (NativeWind v4 + Reanimated)
# Lưu ý: Cài đúng thứ tự để tránh lỗi Babel
npx expo install nativewind react-native-reanimated
npm install tailwindcss

# 3. State & Network
npm install axios @tanstack/react-query @tanstack/react-query-persist-client zustand zod clsx tailwind-merge date-fns

# 4. Native Modules (Hardware)
npx expo install expo-secure-store expo-device expo-crypto expo-network expo-camera expo-location expo-file-system expo-image-manipulator expo-local-authentication

# 5. Maps (React Native Maps)
npx expo install react-native-maps
```

### ⚠️ CRITICAL RULES

- **LUÔN DÙNG** `npx expo install` cho các thư viện liên quan đến native (camera, map, location)
- **KHÔNG DÙNG** `npm install` cho native modules (sẽ dẫn đến version mismatch)
- **PHẢI CÀI** `react-native-reanimated` trước khi config Babel

---

## 🔧 STEP 2: Strict Environment Validation

### Mục tiêu

Validate kỹ lưỡng biến môi trường. Chặn lỗi Network Error do thiếu protocol https.

### File: `src/core/config/env.ts`

```typescript
import { z } from 'zod';

const envSchema = z.object({
    // ✅ CRITICAL: Bắt buộc HTTPS (trừ localhost)
    API_URL: z.string()
        .url('API_URL không đúng định dạng URL')
        .refine(
            (url) => url.startsWith('http://') || url.startsWith('https://'),
            'API_URL phải bắt đầu bằng http:// hoặc https://'
        )
        .refine(
            (url) => {
                // Allow localhost/127.0.0.1 with http, force https for others
                if (url.includes('localhost') || url.includes('127.0.0.1')) {
                    return true;
                }
                return url.startsWith('https://');
            },
            'API_URL production phải dùng HTTPS (trừ localhost)'
        )
        .transform((url) => url.endsWith('/') ? url.slice(0, -1) : url),
    
    API_TIMEOUT: z.string()
        .default('30000')
        .transform(Number)
        .refine((n) => n > 0 && n <= 60000, 'API_TIMEOUT phải từ 1-60000ms'),
    
    // String 'true'/'false' -> Boolean
    USE_MOCK: z.enum(['true', 'false'])
        .default('false')
        .transform((v) => v === 'true'),
});

const _env = {
    API_URL: process.env.EXPO_PUBLIC_API_URL,
    API_TIMEOUT: process.env.EXPO_PUBLIC_API_TIMEOUT,
    USE_MOCK: process.env.EXPO_PUBLIC_USE_MOCK,
};

// ✅ Fail Fast Logic
const parsed = envSchema.safeParse(_env);

if (!parsed.success) {
    console.error('❌ FATAL ERROR: Invalid Environment Variables');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('App cannot start due to invalid .env config');
}

export const ENV = parsed.data;
```

### Example `.env` file

```bash
# Development
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_API_TIMEOUT=30000
EXPO_PUBLIC_USE_MOCK=false

# Production
# EXPO_PUBLIC_API_URL=https://api.quocviet.com/api
# EXPO_PUBLIC_API_TIMEOUT=15000
# EXPO_PUBLIC_USE_MOCK=false
```

---

## 🔧 STEP 3: Directory Scaffolding (Clean Architecture)

### Mục tiêu

Tạo trước cấu trúc thư mục để AI tuân thủ Clean Architecture.

### Script: `.agent/scripts/scaffold.js`

```javascript
const fs = require('fs');
const path = require('path');

const dirs = [
    // Core Layer (Framework-agnostic)
    'src/core/api',         // Axios client
    'src/core/config',      // Env, Constants
    'src/core/hooks',       // Global hooks (useNetwork)
    'src/core/storage',     // SecureStore facade
    'src/core/hardware',    // Hardware Guards (GPS, Camera)
    'src/core/auth',        // AuthProvider, AuthContext
    'src/core/services',    // Geocoding, etc.
    
    // Data Layer (Business Logic)
    'src/data/api',         // API definitions (AuthApi, HrmApi)
    'src/data/hooks',       // React Query hooks (useLogin)
    'src/data/services',    // Logic services (OfflineQueue)
    
    // Presentation Layer (UI)
    'src/presentation/components/ui',      // Buttons, Inputs
    'src/presentation/components/layout',  // ScreenWrapper
    'src/presentation/components/hrm',     // CheckInMap
    'src/presentation/screens',            // Screen implementation
    'src/presentation/sdui',               // SDUI Engine
];

console.log('🏗️ Scaffolding Project Structure...');

dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Created: ${dir}`);
    } else {
        console.log(`⏭️  Exists: ${dir}`);
    }
});

console.log('🚀 Project structure ready!');
```

### Run Scaffold

```bash
node .agent/scripts/scaffold.js
```

---

## 🔧 STEP 4: Babel & Tailwind Config

### File: `tailwind.config.js`

Cấu hình content path để NativeWind nhận diện class.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007AFF',   // Màu chủ đạo theo thiết kế
        danger: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
      },
      fontFamily: {
        // Custom fonts nếu cần
      },
    },
  },
  plugins: [],
}
```

### File: `babel.config.js`

Cấu hình Alias `@/` và Reanimated plugin.

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "nativewind/babel",
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src",
          },
        },
      ],
      "react-native-reanimated/plugin", // ⚠️ PHẢI ĐỂ CUỐI CÙNG
    ],
  };
};
```

---

## 🔧 STEP 5: TypeScript Configuration

### File: `tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}
```

---

## 🔧 STEP 6: Global CSS Setup

### File: `global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### File: `app/_layout.tsx`

```typescript
import '../global.css'; // NativeWind
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/core/auth/AuthProvider';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// ✅ CRITICAL: Giữ Splash Screen cho đến khi load xong tài nguyên
SplashScreen.preventAutoHideAsync();

// ✅ CRITICAL: Tạo Query Client BÊN NGOÀI component để tránh re-create
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 3,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
});

/**
 * Component phụ để gọi các hook chạy ngầm (Background Processes)
 * ✅ CRITICAL: Gắn vào đây để tránh unmount khi điều hướng
 */
function AppProcess() {
    // Sẽ uncomment sau khi implement HRM Skill
    // useAutoSync(); 
    return null;
}

export default function RootLayout() {
    const [loaded] = useFonts({
        // Load custom fonts nếu cần (SpaceMono, Inter...)
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    // ✅ CRITICAL: Chờ fonts load xong mới render
    if (!loaded) return null;

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <StatusBar style="dark" />
                
                {/* Background Processes */}
                <AppProcess />
                
                {/* Navigation Stack */}
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(main)" />
                </Stack>
            </AuthProvider>
        </QueryClientProvider>
    );
}
```

### ⚠️ WHY THIS STRUCTURE?

**Single Context Instance**:

- `queryClient` tạo BÊN NGOÀI component
- Chỉ có 1 cache instance trong suốt vòng đời app
- Tránh reset cache khi re-render

**AppProcess Component**:

- Tách riêng background tasks (AutoSync, NetworkListener)
- Không bị unmount khi điều hướng
- React chỉ re-render khi cần thiết

**SplashScreen Control**:

- `preventAutoHideAsync()` che giấu quá trình load
- User thấy app "hiện lên là dùng được ngay"
- Tránh FOUC (Flash of Unstyled Content)

**Impact**:

- App không crash khi gọi `useAuth()` hoặc `useQuery()`
- Background sync hoạt động liên tục
- UX mượt mà, không nhấp nháy

---

## 🔧 STEP 7: Root Layout Configuration

 Mục tiêu

Mount tất cả Providers (QueryClient, Auth, AutoSync) vào root của app để các hook hoạt động.

 File: `app/_layout.tsx`

```typescript
import '../global.css'; // NativeWind
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/core/auth/AuthProvider';
import { useAutoSync } from '@/data/hooks/useAutoSync';
import { StatusBar } from 'expo-status-bar';

// Tạo Query Client cho React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 3,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
});

/**
 * Component phụ để gọi hook AutoSync
 * (vì _layout phải sạch, không gọi hook trực tiếp)
 */
function AppProcesses() {
    // ✅ CRITICAL: Tự động sync dữ liệu offline khi có mạng
    useAutoSync();
    return null;
}

export default function RootLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <StatusBar style="dark" />
                
                {/* Background Processes */}
                <AppProcesses />
                
                {/* Navigation Stack */}
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(main)" />
                </Stack>
            </AuthProvider>
        </QueryClientProvider>
    );
}
```

### ⚠️ WHY ROOT LAYOUT?

**Problem**: Providers không được mount → `useAuth()` crash với "must be used within AuthProvider"

**Solution**: Wrap toàn bộ app với Providers ở root level

**Impact**:

- Tất cả hooks (useAuth, useQuery) hoạt động
- AutoSync chạy ngầm tự động
- App không crash khi mount

---

## ⚠️ CRITICAL RULES

### 1. Dependency Installation (MANDATORY)

- **PHẢI** dùng `npx expo install` cho native modules
- **KHÔNG** dùng `npm install` cho expo-camera, expo-location, etc.
- **PHẢI** cài `react-native-reanimated` trước khi config Babel

### 2. Environment Validation (MANDATORY)

- **PHẢI** validate HTTPS protocol (trừ localhost)
- **PHẢI** check timeout range (1-60000ms)
- **PHẢI** fail-fast nếu env sai (throw Error)

### 3. Clean Architecture (BEST PRACTICE)

- **PHẢI** chạy scaffold script trước khi code
- **KHÔNG** tạo folder `utils`, `helpers`, `shared` tùy tiện
- **PHẢI** tuân thủ 3 layers: Core → Data → Presentation

### 4. Babel Configuration (MANDATORY)

- **PHẢI** đặt `react-native-reanimated/plugin` cuối cùng
- **PHẢI** config `module-resolver` cho alias `@/`
- **PHẢI** enable `nativewind/babel`

### 5. Root Layout (MANDATORY)

- **PHẢI** mount QueryClientProvider ở root
- **PHẢI** mount AuthProvider bên trong QueryClientProvider
- **PHẢI** gọi useAutoSync trong AppProcesses component
- **KHÔNG** gọi hooks trực tiếp trong _layout function

---

## ✅ Verification Tests

### Test 1: Env Validation

```bash
# Missing HTTPS
EXPO_PUBLIC_API_URL=khanh.maytinhquocviet.com

# Expected: Error "API_URL phải bắt đầu bằng http://"
```

### Test 2: Dependency Check

```bash
npx expo-doctor

# Expected: No version conflicts
```

### Test 3: Scaffold Check

```bash
node .agent/scripts/scaffold.js

# Expected: All directories created
```

### Test 4: Alias Check

```typescript
// In any file
import { ENV } from '@/core/config/env';

// Expected: No import errors
```

---

## 📚 References

- [Expo SDK 53 Docs](https://docs.expo.dev/)
- [NativeWind v4](https://www.nativewind.dev/)
- [Zod Validation](https://zod.dev/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

## 🎓 Learning Outcomes

1. ✅ Hiểu cách cài đặt dependencies đúng cách với Expo
2. ✅ Biết cách validate environment variables với Zod
3. ✅ Thành thạo Clean Architecture folder structure
4. ✅ Config Babel và Tailwind cho NativeWind v4

---

## 🚨 Common Pitfalls & Solutions

### Issue 1: "Reanimated version mismatch"

**Cause**: Dùng `npm install react-native-reanimated`

**Solution**: Dùng `npx expo install react-native-reanimated`

### Issue 2: "Network Error" khi gọi API

**Cause**: API_URL thiếu `https://`

**Solution**: Env validation đã chặn lỗi này ngay từ đầu

### Issue 3: "Cannot find module '@/core/config/env'"

**Cause**: Babel chưa config `module-resolver`

**Solution**: Thêm alias `@` vào `babel.config.js`

### Issue 4: "Tailwind classes không hoạt động"

**Cause**: `content` path sai trong `tailwind.config.js`

**Solution**: Đảm bảo include `./app/**/*.tsx` và `./src/**/*.tsx`

---

## 💡 Pro Tips

1. **Run scaffold first**: Luôn chạy scaffold script trước khi bắt đầu code
2. **Use expo-doctor**: Chạy `npx expo-doctor` để check version conflicts
3. **Strict TypeScript**: Enable `strict: true` để catch lỗi sớm
4. **Environment files**: Tạo `.env.development` và `.env.production` riêng
5. **Git ignore**: Đảm bảo `.env` trong `.gitignore`

---

## 🔄 Workflow

1. ✅ Install dependencies (STEP 1)
2. ✅ Run scaffold script (STEP 3)
3. ✅ Create `.env` file (STEP 2)
4. ✅ Config Babel & Tailwind (STEP 4)
5. ✅ Config TypeScript (STEP 5)
6. ✅ Setup global CSS (STEP 6)
7. ✅ Run `npx expo start` to verify

**Foundation setup hoàn tất!** 🚀
