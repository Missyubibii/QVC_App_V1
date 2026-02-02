---
description: Xây dựng Networking, Storage & Hardware Abstraction (Zero-Crash Core)
---

# SKILL: Implement Core Systems

## 🎯 Mục tiêu

Xây dựng hạ tầng cốt lõi đảm bảo:

1. **Storage thông minh**: Tự động xử lý Object/String, tự động Fallback (Web vs Mobile)
2. **Networking an toàn**: Tự động bóc tách Envelope, tự động Logout khi 401
3. **Hardware Guard**: Chạy được GPS/Camera trên máy ảo mà không crash

## 📋 Prerequisites

- `setup-foundation` đã chạy xong
- Các thư viện: `axios`, `expo-secure-store`, `@react-native-async-storage/async-storage`, `expo-device`

---

## 🔧 PART 1: The "Smart" Storage Facade

### File: `src/core/storage/index.ts`

```typescript
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Smart Storage Facade
 * ✅ Auto-detects Platform (Mobile vs Web)
 * ✅ Auto-stringifies Objects
 * ✅ Auto-parses JSON when retrieving
 */

const isSecureStoreAvailable = Platform.OS !== 'web';

export const SecureStorage = {
    /**
     * Store data (Auto-detects String vs Object)
     * ✅ SMART: Tự động chuyển Object/Number thành String
     */
    async setItem(key: string, value: any): Promise<void> {
        try {
            if (value === null || value === undefined) {
                console.warn(`SecureStorage.setItem: Skipping null/undefined value for key: ${key}`);
                return;
            }

            // ✅ SMART: Tự động stringify nếu không phải string
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

            if (isSecureStoreAvailable) {
                await SecureStore.setItemAsync(key, stringValue);
            } else {
                // Antigravity/Web Fallback
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem(key, stringValue);
                } else {
                    await AsyncStorage.setItem(key, stringValue);
                }
            }
        } catch (error) {
            console.error(`❌ SecureStorage.setItem(${key}) failed:`, error);
            throw error;
        }
    },

    /**
     * Get data (Auto-parse JSON if possible)
     * ✅ SMART: Thử Parse JSON, nếu lỗi thì trả về chuỗi gốc
     * ✅ OPTIMIZED: Check startsWith để tránh parse không cần thiết
     */
    async getItem<T = string>(key: string): Promise<T | null> {
        try {
            let result: string | null = null;

            if (isSecureStoreAvailable) {
                result = await SecureStore.getItemAsync(key);
            } else {
                if (typeof window !== 'undefined' && window.localStorage) {
                    result = window.localStorage.getItem(key);
                } else {
                    result = await AsyncStorage.getItem(key);
                }
            }

            if (!result) return null;

            // ✅ PERFORMANCE: Chỉ parse nếu chuỗi có dạng JSON
            // Tránh ném mọi chuỗi vào JSON.parse (tốn CPU)
            if (result.startsWith('{') || result.startsWith('[')) {
                try {
                    return JSON.parse(result) as T;
                } catch {
                    // Parse failed, return as-is
                    return result as unknown as T;
                }
            }

            // Plain string, return directly
            return result as unknown as T;
        } catch (error) {
            console.error(`❌ SecureStorage.getItem(${key}) failed:`, error);
            return null;
        }
    },

    /**
     * Remove item
     */
    async removeItem(key: string): Promise<void> {
        try {
            if (isSecureStoreAvailable) {
                await SecureStore.deleteItemAsync(key);
            } else {
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.removeItem(key);
                } else {
                    await AsyncStorage.removeItem(key);
                }
            }
        } catch (error) {
            console.error(`❌ SecureStorage.removeItem(${key}) failed:`, error);
        }
    },

    /**
     * Clear all (use with caution)
     */
    async clearAll(): Promise<void> {
        try {
            if (isSecureStoreAvailable) {
                console.warn('⚠️ SecureStore does not support clearAll. Clear keys individually.');
            } else {
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.clear();
                } else {
                    await AsyncStorage.clear();
                }
            }
        } catch (error) {
            console.error('❌ SecureStorage.clearAll() failed:', error);
        }
    },
};

/**
 * Storage Keys (Centralized)
 */
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_ID: 'user_id',
    USER_INFO: 'user_info',
} as const;
```

### ⚠️ WHY SMART STORAGE?

**Vấn đề**: Storage API chỉ nhận string, nhưng Auth module cần lưu User object

```typescript
// ❌ BAD: Crash với TypeError
await SecureStorage.setItem('user', { id: 1, name: 'Test' });

// ✅ GOOD: Smart Storage tự động stringify
await SecureStorage.setItem('user', { id: 1, name: 'Test' });
// Internally: JSON.stringify({ id: 1, name: 'Test' })
```

**Lợi ích**:

- Auth module không cần lo stringify/parse
- Tránh lỗi `TypeError: value must be string`
- Code gọn gàng hơn

---

## 🔧 PART 2: The "Safe" Networking Client (Architect-Level)

### File: `src/core/api/client.ts`

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { DeviceEventEmitter } from 'react-native';
import { ENV } from '@/core/config/env';
import { SecureStorage, STORAGE_KEYS } from '@/core/storage';

/**
 * Envelope Response Type (Laravel ApiResponse trait)
 */
export interface EnvelopeResponse<T = any> {
    code: number;
    status: 'success' | 'error';
    message: string;
    data: T;
    trace_id?: string;
    errors?: Record<string, string[]>; // Laravel validation errors
}

/**
 * Create Axios Instance
 */
export const apiClient = axios.create({
    baseURL: ENV.API_URL,
    timeout: ENV.API_TIMEOUT || 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

/**
 * REQUEST INTERCEPTOR: Attach Bearer Token
 */
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await SecureStorage.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN);
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (__DEV__) {
            console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR: THE GATEKEEPER
 * ✅ CRITICAL: Strict Unwrap Strategy
 * - Hoặc unwrap thành công → return data thật
 * - Hoặc throw error → không có trạng thái lửng lơ
 */
apiClient.interceptors.response.use(
    (response) => {
        const contentType = response.headers['content-type'];
        
        // 1. Guard: Check JSON Content-Type (HTML Guard)
        if (!contentType?.includes('application/json')) {
            throw new Error(
                'Invalid Response: Server returned HTML (Possible 500 Error or Maintenance Mode)'
            );
        }

        const envelope = response.data as EnvelopeResponse;
        
        // 2. Guard: Check Envelope Structure
        if (envelope && typeof envelope.code === 'number') {
            // Business Error Check (code !== 200 trong body 200)
            if (envelope.code !== 200) {
                // Ném lỗi để error handler xử lý
                const error: any = new Error(envelope.message || 'Business Error');
                error.response = response;
                error.isBusinessError = true;
                error.businessCode = envelope.code;
                return Promise.reject(error);
            }
            
            // ✅ SUCCESS: Strict Unwrap
            // CRITICAL: Trả về DATA THẬT, không còn vỏ envelope
            // Điều này có nghĩa là ở API layer, bạn nhận được User object trực tiếp
            return envelope.data;
        }

        // 3. Fallback: API cũ chưa chuẩn Envelope
        return response.data;
    },
    async (error: AxiosError) => {
        // 🛑 KILL SWITCH: 401 Unauthorized
        if (error.response?.status === 401) {
            const originalRequest = error.config as InternalAxiosRequestConfig;
            
            if (!originalRequest.url?.includes('/login')) {
                console.warn('🔒 Session expired. Logging out...');
                
                await SecureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                await SecureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
                await SecureStorage.removeItem(STORAGE_KEYS.USER_INFO);
                
                DeviceEventEmitter.emit('auth:session-expired');
            }
        }

        // 🛑 NORMALIZE ERROR: Laravel Validation (422)
        const data = error.response?.data as any;
        if (error.response?.status === 422 && data?.errors) {
            // Chuẩn hóa lỗi Laravel { message, errors } thành format dễ đọc
            error.message = data.message || 'Dữ liệu không hợp lệ';
            
            // Attach validation errors để UI có thể hiển thị chi tiết
            (error as any).validationErrors = data.errors;
        }

        // Parse error message from envelope (nếu có)
        const envelope = error.response?.data as EnvelopeResponse;
        if (envelope?.message) {
            error.message = envelope.message;
        }

        if (__DEV__) {
            console.error(`❌ API Error: ${error.response?.status} - ${error.message}`);
        }

        return Promise.reject(error);
    }
);

export default apiClient;
```

### ⚠️ CRITICAL RULES (Architect-Level)

1. **Strict Unwrap Strategy**: Interceptor trả về `envelope.data` trực tiếp
   - ✅ API layer nhận được User object, không phải `{ data: User }`
   - ✅ Không còn confusion giữa `response.data` và `response.data.data`

2. **HTML Guard**: PHẢI kiểm tra Content-Type trước khi parse
   - Tránh lỗi `SyntaxError: Unexpected token <` khi server trả HTML

3. **401 Kill Switch**: Tự động logout và emit event
   - Tránh loop vô hạn ở trang login

4. **Laravel Validation Normalization**: Tự động parse lỗi 422
   - Attach `validationErrors` vào error object để UI hiển thị

5. **Performance**: Storage chỉ parse JSON khi cần thiết
   - Check `startsWith('{')` trước khi gọi `JSON.parse()`

---

## 🔧 PART 3: Hardware Guard (Antigravity Survival)

### File: `src/core/hardware/useSafeHardware.ts`

```typescript
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Hook để kiểm tra xem có an toàn để gọi Native Module không
 * Giúp tránh crash trên Antigravity / Simulator
 * 
 * ✅ CRITICAL: Luôn check trước khi gọi GPS/Camera
 */
export const useSafeHardware = () => {
    const isRealDevice = Device.isDevice && Platform.OS !== 'web';

    return {
        isRealDevice,
        
        // Mock Data khi chạy trên máy ảo
        mockGPS: {
            latitude: 10.8231, // Tọa độ Quốc Việt
            longitude: 106.6297,
            accuracy: 5,
        },
        
        // Mock Image (1x1 black pixel)
        mockImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    };
};
```

### Usage Example

```typescript
import { useSafeHardware } from '@/core/hardware/useSafeHardware';
import * as Location from 'expo-location';

export function useLocation() {
    const { isRealDevice, mockGPS } = useSafeHardware();

    async function getCurrentLocation() {
        if (!isRealDevice) {
            console.log('🌐 Antigravity: Using mock GPS');
            return mockGPS;
        }

        // Real device: Call native GPS
        const location = await Location.getCurrentPositionAsync();
        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
        };
    }

    return { getCurrentLocation };
}
```

---

## ✅ Verification Tests

### Test 1: Smart Storage

```typescript
// File: src/__tests__/storage.test.ts
import { SecureStorage, STORAGE_KEYS } from '@/core/storage';

async function testSmartStorage() {
    // Test 1: String storage
    await SecureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'test-token-123');
    const token = await SecureStorage.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN);
    console.log('✅ Token:', token); // "test-token-123"

    // Test 2: Object storage (SMART!)
    const user = { id: 1, name: 'Test User', email: 'test@qvc.vn' };
    await SecureStorage.setItem(STORAGE_KEYS.USER_INFO, user);
    const savedUser = await SecureStorage.getItem(STORAGE_KEYS.USER_INFO);
    console.log('✅ User:', savedUser); // { id: 1, name: 'Test User', ... }

    // Test 3: Number storage
    await SecureStorage.setItem(STORAGE_KEYS.USER_ID, 123);
    const userId = await SecureStorage.getItem<number>(STORAGE_KEYS.USER_ID);
    console.log('✅ User ID:', userId); // 123
}
```

### Test 2: API Client

```typescript
// File: src/__tests__/api-client.test.ts
import apiClient from '@/core/api/client';

async function testApiClient() {
    try {
        // Test envelope unwrapping
        const response = await apiClient.get('/user');
        console.log('✅ User data:', response.data); // Already unwrapped!
    } catch (error: any) {
        console.error('❌ Error:', error.message); // Enhanced error message
    }
}
```

### Test 3: Hardware Guard

```typescript
// File: src/__tests__/hardware.test.ts
import { useSafeHardware } from '@/core/hardware/useSafeHardware';

function testHardwareGuard() {
    const { isRealDevice, mockGPS, mockImage } = useSafeHardware();

    console.log('Is Real Device:', isRealDevice);
    console.log('Mock GPS:', mockGPS);
    console.log('Mock Image:', mockImage.substring(0, 50) + '...');
}
```

---

## 📚 References

- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [Expo Device](https://docs.expo.dev/versions/latest/sdk/device/)

---

## 🎓 Learning Outcomes

1. ✅ Hiểu cách implement Smart Storage với auto stringify/parse
2. ✅ Biết cách unwrap Envelope response mà không mutate
3. ✅ Thành thạo 401 Kill Switch pattern
4. ✅ Tránh được crash trên Antigravity với Hardware Guard

---

## 🚨 Common Pitfalls & Solutions

### Issue 1: "TypeError: value must be string"

**Cause**: Trying to save Object directly to SecureStore

**Solution**: Use Smart Storage (auto stringify)

```typescript
// ❌ BAD
await SecureStore.setItemAsync('user', { id: 1 }); // Crash!

// ✅ GOOD
await SecureStorage.setItem('user', { id: 1 }); // Auto stringify
```

### Issue 2: "Undefined is not an object (reading 'data')"

**Cause**: Accessing `response.data.data` after envelope unwrapping

**Solution**: Interceptor already unwrapped, just use `response.data`

```typescript
// ❌ BAD
const user = response.data.data; // undefined!

// ✅ GOOD
const user = response.data; // Already unwrapped by interceptor
```

### Issue 3: "App crash on Antigravity when using GPS"

**Cause**: Calling native GPS module on Web platform

**Solution**: Use Hardware Guard

```typescript
// ❌ BAD
const location = await Location.getCurrentPositionAsync(); // Crash on Web!

// ✅ GOOD
const { isRealDevice, mockGPS } = useSafeHardware();
const location = isRealDevice 
    ? await Location.getCurrentPositionAsync()
    : mockGPS;
```

---

## 💡 Pro Tips

1. **Always use Smart Storage**: Không cần lo stringify/parse
2. **Trust the Interceptor**: Response đã được unwrap, không cần `.data.data`
3. **Check Platform first**: Luôn dùng Hardware Guard trước khi gọi native module
4. **Debug with **DEV****: Logs chỉ hiện trong development mode
