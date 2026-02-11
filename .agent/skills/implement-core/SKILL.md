---
description: "CRITICAL: Xây dựng Core Engine. Yêu cầu: MMKV Storage (High Performance), Axios Envelope Unwrap, Hardware Abstraction Layer (HAL)."
globs: "src/core/storage/**/*, src/core/networking/**/*, src/core/hardware/**/*"
---

# SKILL: Implement Core Systems

> [!WARNING]
> **Performance Rule**:
>
> 1. KHÔNG dùng `AsyncStorage`. Bắt buộc dùng `MMKV` cho dữ liệu thường.
> 2. CHỈ dùng `SecureStore` cho Token nhạy cảm.
> 3. API Client phải tự động "bóc" lớp vỏ `{ code, data }` từ Laravel.

## 🎯 Mục Tiêu Cốt Lõi

1. **High-Perf Storage**: Tích hợp MMKV (JSI) nhanh gấp 30x AsyncStorage.
2. **Smart Networking**: Tự động xử lý cấu trúc Envelope của Laravel.
3. **Hardware Guard**: Chạy GPS/Camera trên máy ảo/Web mà không crash.
4. **Logger**: Hệ thống log tập trung để debug trên thiết bị thật.

---

## 🔧 BƯỚC 1: Cài đặt Dependencies

**AI Action:**

```bash
# 1. MMKV (Storage siêu tốc)
npx expo install react-native-mmkv

# 2. NetInfo (Check mạng)
npx expo install @react-native-community/netinfo

# 3. Location & Camera (Native)
npx expo install expo-location expo-camera
```

> [!NOTE]
> `react-native-mmkv` cần `expo-dev-client` để chạy (đã cài ở bước Setup Foundation).

---

## 🔧 BƯỚC 2: MMKV Storage Adapter (Web Compatible)

**File:** `src/core/storage/mmkv.ts`

**Mục tiêu:** MMKV chạy trên Mobile, fallback sang localStorage trên Web (Antigravity).

```typescript
import { MMKV } from 'react-native-mmkv';
import { Platform } from 'react-native';

// Khởi tạo instance
export const storage = new MMKV({
  id: 'user-settings-storage',
});

/**
 * Wrapper để hỗ trợ Web (Antigravity)
 * Vì MMKV là JSI Native, không chạy trên Web.
 */
export const AppStorage = {
  setItem: (key: string, value: string | number | boolean | object) => {
    const stringValue = JSON.stringify(value);
    if (Platform.OS === 'web') {
      localStorage.setItem(key, stringValue);
    } else {
      storage.set(key, stringValue);
    }
  },

  getItem: <T>(key: string): T | null => {
    let value: string | undefined | null;
    
    if (Platform.OS === 'web') {
      value = localStorage.getItem(key);
    } else {
      value = storage.getString(key);
    }

    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      storage.delete(key);
    }
  },

  clearAll: () => {
    if (Platform.OS === 'web') {
      localStorage.clear();
    } else {
      storage.clearAll();
    }
  }
};
```

> [!CRITICAL]
> **MMKV là Synchronous**: Không cần `await`. Đọc/ghi ngay lập tức → Cold Start nhanh hơn 30x so với AsyncStorage.

---

## 🔧 BƯỚC 3: Networking Envelope Unwrap

**File:** `src/core/networking/apiClient.ts`

**Mục tiêu:** Xử lý chuẩn `Danh_Sach_API.md`. Backend trả về `{ code: 200, data: ... }`. Client phải tự bóc lấy data.

```typescript
import axios, { AxiosError } from 'axios';
import { Env } from '@/core/config/env';
import { TokenStorage } from '@/core/auth/TokenStorage';

export const apiClient = axios.create({
  baseURL: Env.EXPO_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10s timeout
});

// Request: Auto Inject Token
apiClient.interceptors.request.use(async (config) => {
  const token = await TokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: Auto Unwrap Envelope & Error Handling
apiClient.interceptors.response.use(
  (response) => {
    // 1. Lấy body
    const { code, data, message } = response.data;

    // 2. Check Logic Code (Laravel Convention)
    // Nếu HTTP 200 nhưng Code != 200 -> Là lỗi nghiệp vụ
    if (code && code !== 200) {
      return Promise.reject(new Error(message || 'Lỗi nghiệp vụ không xác định'));
    }

    // 3. Unwrap: Trả về data thực sự thay vì cả envelope
    // Giữ nguyên response structure nhưng replace response.data
    response.data = data;
    return response;
  },
  async (error: AxiosError) => {
    // Handle 401 Logout
    if (error.response?.status === 401) {
      await TokenStorage.clearToken();
      // Emit event logout hoặc redirect
    }
    
    // Handle network errors
    if (!error.response) {
      return Promise.reject(new Error('Lỗi kết nối mạng'));
    }
    
    return Promise.reject(error);
  }
);
```

> [!WARNING]
> **Envelope Pattern**: Backend Laravel trả HTTP 200 ngay cả khi lỗi nghiệp vụ. Interceptor phải check `code` trong body để xác định lỗi thật.

**Ví dụ sử dụng:**

```typescript
// Trước (Phải unwrap thủ công)
const response = await apiClient.get('/users');
const users = response.data.data; // ❌ Phải nhớ .data.data

// Sau (Auto unwrap)
const response = await apiClient.get('/users');
const users = response.data; // ✅ Đã unwrap tự động
```

---

## 🔧 BƯỚC 4: Hardware Abstraction Layer (HAL)

**File:** `src/core/hardware/useSafeHardware.ts`

**Mục tiêu:** Tránh crash trên Emulator/Web khi gọi GPS/Camera.

```typescript
import * as Location from 'expo-location';
import * as Camera from 'expo-camera';
import { Platform } from 'react-native';
import { Env } from '@/core/config/env';

export const useSafeHardware = () => {
  const isMock = Env.EXPO_PUBLIC_IS_MOCK === 'true' || Platform.OS === 'web';

  const getLocation = async () => {
    if (isMock) {
      console.log('📍 [MOCK] Location requested -> Returning Vinh City');
      return {
        coords: { 
          latitude: 18.6789, 
          longitude: 105.6789,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
        mocked: true,
      };
    }

    // Real Native Call
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission denied');
    }
    return await Location.getCurrentPositionAsync({});
  };

  const requestCameraPermission = async () => {
    if (isMock) {
      console.log('📷 [MOCK] Camera permission -> Granted');
      return { status: 'granted', mocked: true };
    }

    const { status } = await Camera.requestCameraPermissionsAsync();
    return { status, mocked: false };
  };

  return { 
    getLocation, 
    requestCameraPermission,
    isMock 
  };
};
```

**Ví dụ sử dụng:**

```typescript
// Trong component
const { getLocation, isMock } = useSafeHardware();

const handleCheckIn = async () => {
  try {
    const location = await getLocation();
    if (location.mocked) {
      console.warn('Using mock location for development');
    }
    // Gửi location lên server
    await checkIn(location.coords);
  } catch (error) {
    console.error('Location error:', error);
  }
};
```

> [!CRITICAL]
> **Hardware Guard là BẮT BUỘC**: Nếu gọi `Location.getCurrentPositionAsync()` trên Emulator không có Google Play Services → App treo vĩnh viễn.

---

## 🔧 BƯỚC 5: Network State Monitor

**File:** `src/core/networking/useNetworkState.ts`

```typescript
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkState = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, isInternetReachable };
};
```

---

## 🚨 Checklist Kiểm Tra (Definition of Done)

AI phải tự kiểm tra:

### Storage

- [ ] **MMKV**: Đã config wrapper cho Web chưa? (MMKV native crash trên web)
- [ ] **Sync**: Hàm getItem có chạy đồng bộ không (trừ đoạn fallback web)?
- [ ] **Fallback**: Web có dùng localStorage không?

### Networking

- [ ] **Envelope**: Interceptor có check `response.data.code !== 200` không?
- [ ] **Timeout**: Đã set timeout chưa? (Tránh treo app khi mạng lag)
- [ ] **401 Handling**: Có auto-logout khi gặp 401 không?
- [ ] **Network Error**: Có xử lý lỗi mạng (error.response === undefined) không?

### Hardware

- [ ] **Mock Flag**: Có check `EXPO_PUBLIC_IS_MOCK` không?
- [ ] **Web Guard**: Có check `Platform.OS === 'web'` không?
- [ ] **Permission**: Có xử lý trường hợp user từ chối permission không?

---

## 💡 Pro Tips

### 1. MMKV Encryption

Nếu cần lưu dữ liệu nhạy cảm vừa phải (không phải token) vào MMKV, có thể dùng `encryptionKey`:

```typescript
export const secureStorage = new MMKV({
  id: 'secure-storage',
  encryptionKey: 'your-encryption-key-here',
});
```

### 2. Axios Retry

Nên cài thêm `axios-retry` để tự động thử lại khi rớt mạng:

```bash
npm install axios-retry
```

```typescript
import axiosRetry from 'axios-retry';

axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) 
      || error.response?.status === 429;
  },
});
```

### 3. Logger cho Production

```typescript
// src/core/utils/logger.ts
import { Platform } from 'react-native';

export const logger = {
  log: (...args: any[]) => {
    if (__DEV__) console.log(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
    // TODO: Gửi lên Sentry/Crashlytics
  },
};
```

### 4. Storage Migration

Nếu đang migrate từ AsyncStorage sang MMKV:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const migrateFromAsyncStorage = async () => {
  const keys = await AsyncStorage.getAllKeys();
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      AppStorage.setItem(key, value);
      await AsyncStorage.removeItem(key);
    }
  }
};
```

---

## 🎓 Tài Liệu Tham Khảo

- [MMKV Documentation](https://github.com/mrousavy/react-native-mmkv)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [NetInfo](https://github.com/react-native-netinfo/react-native-netinfo)
