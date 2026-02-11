---
description: "CRITICAL: Triển khai Authentication (Social + JWT). Yêu cầu: Expo SecureStore, Google/Apple Sign-In (Native), Antigravity Guard, Axios Interceptor."
globs: "src/core/auth/**/*, src/data/repositories/AuthRepository.ts, src/store/useAuthStore.ts, app.json"
---

# SKILL: Implement Advanced Auth System

> [!WARNING]
> **Native Auth Context**:
>
> 1. Google/Apple Sign-In **CHỈ** hoạt động trên Điện thoại thật (qua Dev Client).
> 2. Trên Antigravity (Web Preview), hệ thống phải tự động chuyển sang **Mock Login** để không crash.
> 3. Bắt buộc cấu hình Plugin trong `app.json` trước khi build.

## 🎯 Mục Tiêu Cốt Lõi

1. **Secure Storage**: Lưu Token bằng `expo-secure-store` (Mã hóa phần cứng).
2. **Native Social**: Login Google/Apple chuẩn Native (không dùng WebView).
3. **Interceptor**: Tự động chèn Token vào Header mỗi request.
4. **Fail-Safe**: Cơ chế Mock Login khi thiếu file cấu hình hoặc chạy trên Web.

---

## 🔧 BƯỚC 1: Cài đặt Dependencies

**AI Action:** Chạy lệnh cài đặt (Lưu ý: Social Auth cần Native Modules).

```bash
# 1. Secure Storage & JWT
npx expo install expo-secure-store
npm install jwt-decode

# 2. Native Social Auth (Google & Apple)
npx expo install expo-apple-authentication
npx expo install @react-native-google-signin/google-signin

# 3. Validation
npm install zod
```

> [!IMPORTANT]
> **Tại sao cần Native Modules?**
>
> - `expo-secure-store`: Lưu token vào Keychain (iOS) / KeyStore (Android)
> - `expo-apple-authentication`: Sign In with Apple chuẩn Apple
> - `@react-native-google-signin/google-signin`: Google Sign-In SDK native
> - Nếu thiếu `expo-dev-client` → Crash vì không load được native modules

---

## 🔧 BƯỚC 2: Cấu hình Native Plugin (Prebuild Config)

**File:** `app.json`

**AI Action:** Thêm cấu hình plugin để Prebuild tự động link thư viện Native.

```json
{
  "expo": {
    "ios": {
      "usesAppleSignIn": true,
      "bundleIdentifier": "com.quocviet.superapp"
    },
    "android": {
      "package": "com.quocviet.superapp",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-apple-authentication",
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.YOUR-IOS-CLIENT-ID"
        }
      ]
    ]
  }
}
```

> [!TIP]
> **Nội dung Mock `google-services.json`** (Để Build không lỗi):
>
> Nếu chưa có file thật, hãy paste nội dung này vào `google-services.json`:
> ```json
> {
>   "project_info": {
>     "project_number": "000000000000",
>     "project_id": "mock-project-id",
>     "storage_bucket": "mock-project-id.appspot.com"
>   },
>   "client": [
>     {
>       "client_info": {
>         "mobilesdk_app_id": "1:000000000000:android:0000000000000000",
>         "android_client_info": { "package_name": "com.quocviet.superapp" }
>       },
>       "api_key": [{ "current_key": "mock-api-key" }]
>     }
>   ]
> }
> ```
>
> Login sẽ fail với mock config này, nhưng build không lỗi. Logic Mock trong `GoogleAuth.ts` sẽ handle.

---

## 🔧 BƯỚC 3: Xây dựng Storage Layer (SecureStore Wrapper)

**File:** `src/core/auth/TokenStorage.ts`

**Logic:**

- **Mobile**: Dùng `expo-secure-store`
- **Web (Antigravity)**: Dùng `localStorage` (vì SecureStore không chạy trên Web)

```typescript
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'auth_token';

export const TokenStorage = {
  setToken: async (token: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(KEY, token);
    } else {
      await SecureStore.setItemAsync(KEY, token);
    }
  },

  getToken: async () => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(KEY);
    }
    return await SecureStore.getItemAsync(KEY);
  },

  clearToken: async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(KEY);
    } else {
      await SecureStore.deleteItemAsync(KEY);
    }
  }
};
```

> [!NOTE]
> **Web Fallback**: `expo-secure-store` không có API trên web. Phải dùng `localStorage` để tránh crash.

---

## 🔧 BƯỚC 4: Mockable Google Sign-In (Hardware Guard)

**File:** `src/core/auth/GoogleAuth.ts`

**Logic:** Check môi trường. Nếu là Web hoặc thiếu config → Trả về Mock Token ngay lập tức.

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

export const GoogleAuth = {
  configure: () => {
    if (Platform.OS !== 'web') {
      try {
        GoogleSignin.configure({
          // scopes: ['email', 'profile'], // Tùy chỉnh
        });
      } catch (e) {
        console.warn('Google Signin configure failed (ok if in mock mode)');
      }
    }
  },

  signIn: async () => {
    // 1. Web / Mock Guard
    if (Platform.OS === 'web' || process.env.EXPO_PUBLIC_IS_MOCK === 'true') {
      console.log('⚠️ Using Mock Google Login');
      return { 
        idToken: 'mock-google-token-123', 
        user: { email: 'mock@test.com', name: 'Mock User' } 
      };
    }

    // 2. Real Native Login
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      return userInfo.data; // Expo 52+ / GoogleSignin v11+ return structure
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  }
};
```

> [!CRITICAL]
> **Mock Guard là BẮT BUỘC**: Nếu gọi `GoogleSignin.signIn()` trên Web → App crash trắng màn hình.

---

## 🔧 BƯỚC 5: Apple Sign-In (với Web Guard)

**File:** `src/core/auth/AppleAuth.ts`

```typescript
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

export const AppleAuth = {
  signIn: async () => {
    // 1. Web / Mock Guard
    if (Platform.OS === 'web' || process.env.EXPO_PUBLIC_IS_MOCK === 'true') {
      console.log('⚠️ Using Mock Apple Login');
      return { 
        identityToken: 'mock-apple-token-123',
        user: { email: 'mock@apple.com', fullName: { givenName: 'Mock' } }
      };
    }

    // 2. Check Apple Auth Available (iOS only)
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In only available on iOS');
    }

    // 3. Real Native Login
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      return credential;
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      throw error;
    }
  }
};
```

---

## 🔧 BƯỚC 6: Axios Interceptor (Auto-Inject Token)

**File:** `src/core/networking/axiosClient.ts`

**Logic:**

- **Request**: Lấy token từ TokenStorage → Gắn vào Header
- **Response**: Nếu gặp 401 → Logout ngay lập tức

```typescript
import axios from 'axios';
import { TokenStorage } from '@/core/auth/TokenStorage';
import { Env } from '@/core/config/env';

export const axiosClient = axios.create({
  baseURL: Env.EXPO_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor
axiosClient.interceptors.request.use(async (config) => {
  const token = await TokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized! Token expired.');
      await TokenStorage.clearToken();
      // Sẽ trigger logout ở UI layer
    }
    return Promise.reject(error);
  }
);
```

> [!WARNING]
> **Async Interceptor**: Request interceptor phải `async` vì `getToken()` là Promise.

---

## 🔧 BƯỚC 7: Zustand Auth Store

**File:** `src/store/useAuthStore.ts`

```typescript
import { create } from 'zustand';
import { TokenStorage } from '@/core/auth/TokenStorage';
import { router } from 'expo-router';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean; // 👈 Mới: Cờ kiểm tra trạng thái khởi động
  user: User | null;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>; // Gọi khi App start
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isInitialized: false, // Mặc định chưa khởi tạo
  user: null,

  login: async (token, user) => {
    await TokenStorage.setToken(token);
    set({ isAuthenticated: true, user });
    router.replace('/(tabs)/home'); // Chuyển hướng sau khi login
  },

  logout: async () => {
    await TokenStorage.clearToken();
    set({ isAuthenticated: false, user: null });
    router.replace('/(auth)/login');
  },

  hydrate: async () => {
    try {
      const token = await TokenStorage.getToken();
      if (token) {
        // TODO: Gọi API /me để lấy thông tin user mới nhất
        set({ isAuthenticated: true, user: { id: '1', email: 'user@test.com', name: 'User' } }); 
      }
    } catch (e) {
      console.error('Hydration failed', e);
    } finally {
      // 👇 Quan trọng: Luôn đánh dấu đã khởi tạo xong dù có token hay không
      set({ isInitialized: true });
    }
  }
}));
```

> [!CRITICAL]
> **`isInitialized` prevents Auth Flicker**: Nếu không có state này, app sẽ nháy qua màn Login rồi mới vào Home khi user đã đăng nhập sẵn.

---

## 🔧 BƯỚC 8: Root Layout Integration (Splash Screen Guard)

**File:** `app/_layout.tsx`

**Logic:** Giữ Splash Screen cho đến khi Auth hydrate xong.

```typescript
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/store/useAuthStore';
import '../src/global.css';

// Giữ Splash Screen hiển thị
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isInitialized, isAuthenticated, hydrate } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // 1. Khởi động Auth
  useEffect(() => {
    hydrate();
  }, []);

  // 2. Ẩn Splash Screen khi đã load xong
  useEffect(() => {
    if (isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [isInitialized]);

  // 3. Bảo vệ Route (Navigation Guard)
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (isAuthenticated && inAuthGroup) {
      // Đã login mà đang ở trang Login -> Đá về Home
      router.replace('/(tabs)/home');
    } else if (!isAuthenticated && !inAuthGroup) {
      // Chưa login mà đang ở trang trong -> Đá về Login
      router.replace('/(auth)/login');
    }
  }, [isInitialized, isAuthenticated, segments]);

  return <Slot />;
}
```

**Key Points:**

- **`SplashScreen.preventAutoHideAsync()`**: Giữ splash hiển thị cho đến khi auth ready
- **Navigation Guard**: Tự động redirect dựa trên `isAuthenticated`
- **No Flicker**: User không bao giờ thấy màn hình "nháy" khi app start

---

## 🔧 BƯỚC 9: Auth Repository (Backend Integration)

**File:** `src/data/repositories/AuthRepository.ts`

```typescript
import { axiosClient } from '@/core/networking/axiosClient';
import { GoogleAuth } from '@/core/auth/GoogleAuth';
import { AppleAuth } from '@/core/auth/AppleAuth';
import { z } from 'zod';

const LoginResponseSchema = z.object({
  code: z.literal(200),
  data: z.object({
    access_token: z.string(),
    user: z.object({
      id: z.string(),
      email: z.string(),
      name: z.string(),
    }),
  }),
});

export const AuthRepository = {
  loginWithGoogle: async () => {
    const googleUser = await GoogleAuth.signIn();
    
    // Gửi idToken lên Backend để verify
    const response = await axiosClient.post('/auth/google', {
      id_token: googleUser.idToken,
    });
    
    const parsed = LoginResponseSchema.parse(response.data);
    return parsed.data;
  },

  loginWithApple: async () => {
    const appleUser = await AppleAuth.signIn();
    
    const response = await axiosClient.post('/auth/apple', {
      identity_token: appleUser.identityToken,
    });
    
    const parsed = LoginResponseSchema.parse(response.data);
    return parsed.data;
  },

  getProfile: async () => {
    const response = await axiosClient.get('/user');
    return response.data.data;
  },
};
```

---

## 🚨 Checklist Kiểm Tra (Definition of Done)

AI phải tự kiểm tra các điểm sau:

### Core Setup

- [ ] **Prebuild Config**: `app.json` đã có plugin `@react-native-google-signin/google-signin` chưa?
- [ ] **Web Guard**: `GoogleAuth.ts` có chặn `Platform.OS === 'web'` không?
- [ ] **Interceptor**: `axiosClient` có tự động gắn `Bearer Token` không?
- [ ] **SecureStore**: Có fallback sang `localStorage` trên Web không?

### Mock Capability

- [ ] **ENV Check**: Có check `process.env.EXPO_PUBLIC_IS_MOCK` không?
- [ ] **Mock Token**: Mock token có format giống real token không?

### Security

- [ ] **Token Storage**: Token lưu vào SecureStore (mobile) hoặc localStorage (web)?
- [ ] **401 Handling**: Interceptor có auto-logout khi 401 không?

---

## 💡 Pro Tips for Developer

### 1. Google Services File

Bạn cần lên **Firebase Console**, tạo project, tải:

- `google-services.json` (Android) → Đặt ở root project
- `GoogleService-Info.plist` (iOS) → Đặt ở root project

### 2. SHA-1 Keystore

Khi build Dev Client, nhớ lấy SHA-1 fingerprint của keystore debug:

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey
```

Thêm SHA-1 vào Firebase Console → Google Login mới chạy được trên máy ảo.

### 3. Apple Developer Account

Apple Sign-In cần:

- Apple Developer Account ($99/year)
- Thêm "Sign In with Apple" capability trong Xcode
- Bundle ID phải match với `app.json`

### 4. Testing on Antigravity

Khi chạy `npx expo start --tunnel`:

- Google/Apple Login → Tự động dùng Mock
- Kiểm tra console log xem có "Using Mock Login" không
- Test với real device để verify native flow

---

## 🎓 Tài Liệu Tham Khảo

- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Google Sign-In React Native](https://react-native-google-signin.github.io/docs/install)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
