---
description: Authentication toàn diện - Social, Biometric, Zod Validation & Permission Priming
---

# SKILL: Implement Advanced Auth System

## 🎯 Mục tiêu

Xây dựng hệ thống Auth **"Bulletproof"** (Chống đạn):

1. **Zero-Crash trên Antigravity**: Tự động Mock Social Login khi chạy trên Web/Linux
2. **Runtime Safety**: Validate dữ liệu Server trả về bằng Zod
3. **UX Flow chuẩn**: Login → Permission Priming → Home
4. **Apple Compliance**: Account Deletion (Guideline 5.1.1) + Apple Sign In (Guideline 4.8)

## 📋 Prerequisites

- Packages: `zod`, `expo-local-authentication`, `expo-apple-authentication`, `@react-native-google-signin/google-signin`
- Core: `src/core/api/client.ts`, `src/core/storage/index.ts`
- Đã hoàn thành `implement-core` skill

---

## 🔧 PART 1: Auth API Layer with Zod Runtime Validation

### File: `src/data/api/auth.api.ts`

```typescript
import { z } from 'zod';
import apiClient from '@/core/api/client';
import { Platform } from 'react-native';

/**
 * ✅ CRITICAL: Zod Schemas for Runtime Validation
 * Tại sao: TypeScript chỉ tồn tại compile-time. Runtime cần Zod để validate.
 */
export const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
    role: z.string().optional(),
    avatar: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
});

export const AuthResponseSchema = z.object({
    access_token: z.string().min(1, 'Token không được rỗng'),
    user: UserSchema,
});

// Infer Types from Schemas (Single Source of Truth)
export type User = z.infer<typeof UserSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export interface LoginPayload {
    email: string;
    password: string;
    device_name?: string;
}

export interface SocialLoginPayload {
    provider: 'google' | 'apple';
    id_token: string;
    device_name?: string;
}

export const AuthApi = {
    /**
     * Standard Email/Password Login
     * ✅ CRITICAL: Parse response với Zod để catch lỗi ngay
     */
    login: async (payload: LoginPayload): Promise<AuthResponse> => {
        const response = await apiClient.post('/app/login', {
            ...payload,
            device_name: payload.device_name || 'Mobile App',
        });

        // ✅ RUNTIME VALIDATION: Crash ngay nếu Server trả sai cấu trúc
        try {
            return AuthResponseSchema.parse(response.data);
        } catch (error) {
            console.error('❌ Auth Response Validation Failed:', error);
            throw new Error(
                'Server trả về dữ liệu không hợp lệ. ' +
                'Vui lòng liên hệ IT Support.'
            );
        }
    },

    /**
     * Social Login (Google/Apple)
     * ✅ ANTIGRAVITY GUARD: Mock khi Platform.OS === 'web'
     */
    loginSocial: async (payload: SocialLoginPayload): Promise<AuthResponse> => {
        // 🛡️ ANTIGRAVITY GUARD: Tránh crash khi gọi Native SDK trên Web
        if (Platform.OS === 'web') {
            console.warn('⚠️ Antigravity Mode: Mocking Social Login');
            
            // Fallback to standard login với test account
            return AuthApi.login({
                email: `test_${payload.provider}@quocviet.com`,
                password: '123456',
            });
        }

        // Mobile: Gọi API thật
        const endpoint = payload.provider === 'apple' 
            ? '/app/auth/apple' 
            : '/app/auth/google';

        const response = await apiClient.post(endpoint, {
            id_token: payload.id_token,
            device_name: payload.device_name || 'Mobile App',
        });

        return AuthResponseSchema.parse(response.data);
    },

    /**
     * Get Profile
     */
    getProfile: async (): Promise<User> => {
        const response = await apiClient.get('/user');
        
        try {
            return UserSchema.parse(response.data);
        } catch (error) {
            console.error('❌ User Profile Validation Failed:', error);
            throw new Error('Dữ liệu profile không hợp lệ');
        }
    },

    /**
     * Logout
     */
    logout: async (): Promise<void> => {
        await apiClient.post('/app/logout');
    },

    /**
     * Delete Account (Apple Guideline 5.1.1 - REQUIRED)
     */
    deleteAccount: async (): Promise<void> => {
        await apiClient.delete('/app/account');
    },
};
```

### ⚠️ WHY ZOD?

**Vấn đề**: TypeScript chỉ kiểm tra compile-time. Runtime Server có thể trả về:

```json
{
  "access_token": null,  // ❌ Lỗi nhưng TypeScript không bắt được
  "user": { "user_id": 1 }  // ❌ Sai field name (id vs user_id)
}
```

**Giải pháp**: Zod parse runtime → Crash ngay với error message rõ ràng:

```log
Invalid input: expected string, received null at access_token
```

---

## 🔧 PART 2: Social Login Services (Antigravity-Safe)

### File: `src/core/auth/social-login.ts`

```typescript
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

/**
 * Social Login Service
 * ✅ ANTIGRAVITY GUARD: Tất cả methods đều check Platform.OS
 */
export const SocialLoginService = {
    /**
     * Initialize Google Sign-In
     * ⚠️ CRITICAL: Chỉ gọi trên Mobile
     */
    async initializeGoogle() {
        if (Platform.OS === 'web') {
            console.warn('⚠️ Antigravity: Skipping Google Sign-In initialization');
            return;
        }

        GoogleSignin.configure({
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
            offlineAccess: true,
        });
    },

    /**
     * Sign in with Google
     */
    async signInWithGoogle(): Promise<string> {
        if (Platform.OS === 'web') {
            throw new Error('Google Sign-In không khả dụng trên Antigravity');
        }

        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            return userInfo.idToken!;
        } catch (error) {
            console.error('Google Sign-In failed:', error);
            throw new Error('Đăng nhập Google thất bại');
        }
    },

    /**
     * Sign in with Apple
     * ⚠️ CRITICAL: Chỉ khả dụng trên iOS
     */
    async signInWithApple(): Promise<string> {
        if (Platform.OS === 'web') {
            throw new Error('Apple Sign-In không khả dụng trên Antigravity');
        }

        if (Platform.OS !== 'ios') {
            throw new Error('Apple Sign-In chỉ khả dụng trên iOS');
        }

        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            return credential.identityToken!;
        } catch (error: any) {
            if (error.code === 'ERR_CANCELED') {
                throw new Error('Người dùng hủy đăng nhập');
            }
            console.error('Apple Sign-In failed:', error);
            throw new Error('Đăng nhập Apple thất bại');
        }
    },

    /**
     * Check if Apple Sign-In is available
     */
    async isAppleSignInAvailable(): Promise<boolean> {
        if (Platform.OS !== 'ios') return false;

        try {
            return await AppleAuthentication.isAvailableAsync();
        } catch {
            return false;
        }
    },
};
```

---

## 🔧 PART 3: Biometric Authentication (Optional Enhancement)

### File: `src/core/auth/biometric.ts`

```typescript
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export const BiometricService = {
    /**
     * Check if biometric is supported
     */
    async isSupported(): Promise<boolean> {
        if (Platform.OS === 'web') return false;

        try {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            return compatible && enrolled;
        } catch {
            return false;
        }
    },

    /**
     * Authenticate with biometric
     */
    async authenticate(): Promise<boolean> {
        if (Platform.OS === 'web') {
            console.warn('⚠️ Antigravity: Skipping biometric auth');
            return true; // Auto-pass trên Antigravity
        }

        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Xác thực để đăng nhập',
                fallbackLabel: 'Dùng mật khẩu',
                cancelLabel: 'Hủy',
            });

            return result.success;
        } catch (error) {
            console.error('Biometric auth failed:', error);
            return false;
        }
    },

    /**
     * Get biometric type (FaceID/TouchID/Fingerprint)
     */
    async getBiometricType(): Promise<string> {
        if (Platform.OS === 'web') return 'None';

        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            return 'FaceID';
        }
        if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            return Platform.OS === 'ios' ? 'TouchID' : 'Fingerprint';
        }
        return 'None';
    },
};
```

---

## 🔧 PART 4: Auth Context Provider (Enhanced)

### File: `src/core/auth/AuthProvider.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeviceEventEmitter, Platform } from 'react-native';
import { router, useSegments } from 'expo-router';
import { SecureStorage, STORAGE_KEYS } from '@/core/storage';
import { AuthApi, User, LoginPayload, SocialLoginPayload } from '@/data/api/auth.api';
import { BiometricService } from './biometric';
import { SocialLoginService } from './social-login';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isBiometricSupported: boolean;
    login: (payload: LoginPayload) => Promise<void>;
    loginSocial: (payload: SocialLoginPayload) => Promise<void>;
    loginWithBiometric: () => Promise<void>;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const segments = useSegments();

    // 1. Initialize
    useEffect(() => {
        loadUser();
        checkBiometricSupport();
        initializeSocialLogin();

        // 👂 Listen to 401 event from client.ts (Kill Switch)
        const subscription = DeviceEventEmitter.addListener('auth:session-expired', () => {
            console.log('🔄 Session expired event received. Logging out...');
            performLogoutCleanup();
        });

        return () => {
            subscription.remove();
        };
    }, []);

    // 2. Check Biometric Support
    async function checkBiometricSupport() {
        const supported = await BiometricService.isSupported();
        setIsBiometricSupported(supported);
    }

    // 3. Initialize Social Login
    async function initializeSocialLogin() {
        if (Platform.OS !== 'web') {
            await SocialLoginService.initializeGoogle();
        }
    }

    // 4. Cleanup function (Shared by Logout & Auto-Logout)
    const performLogoutCleanup = async () => {
        await SecureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        await SecureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        await SecureStorage.removeItem(STORAGE_KEYS.USER_ID);
        setUser(null);
        router.replace('/(auth)/login');
    };

    async function loadUser() {
        try {
            const token = await SecureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
            
            if (!token) {
                setLoading(false);
                return;
            }

            const userData = await AuthApi.getProfile();
            setUser(userData);
        } catch (error) {
            console.error('❌ Failed to load user:', error);
            await performLogoutCleanup();
        } finally {
            setLoading(false);
        }
    }

    /**
     * Standard Login
     * ✅ CRITICAL: Redirect to Permission Priming, NOT Home
     */
    async function login(payload: LoginPayload) {
        try {
            const { access_token, user: userData } = await AuthApi.login(payload);

            // Save token & user ID
            await SecureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
            await SecureStorage.setItem(STORAGE_KEYS.USER_ID, String(userData.id));
            setUser(userData);

            // 🛑 STOP! Đừng vào Home vội
            // Điều hướng sang trang xin quyền trước
            router.replace('/(auth)/permission-priming');
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    /**
     * Social Login (Google/Apple)
     */
    async function loginSocial(payload: SocialLoginPayload) {
        try {
            const { access_token, user: userData } = await AuthApi.loginSocial(payload);

            await SecureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
            await SecureStorage.setItem(STORAGE_KEYS.USER_ID, String(userData.id));
            setUser(userData);

            router.replace('/(auth)/permission-priming');
        } catch (error) {
            console.error('Social login failed:', error);
            throw error;
        }
    }

    /**
     * Login with Biometric
     * ✅ CRITICAL: Chỉ dùng khi đã có saved credentials
     */
    async function loginWithBiometric() {
        try {
            const authenticated = await BiometricService.authenticate();
            
            if (!authenticated) {
                throw new Error('Xác thực sinh trắc học thất bại');
            }

            // Get saved credentials
            const savedEmail = await SecureStorage.getItem('saved_email');
            const savedPassword = await SecureStorage.getItem('saved_password');

            if (!savedEmail || !savedPassword) {
                throw new Error('Không tìm thấy thông tin đăng nhập đã lưu');
            }

            await login({ email: savedEmail, password: savedPassword });
        } catch (error) {
            console.error('Biometric login failed:', error);
            throw error;
        }
    }

    async function logout() {
        try {
            await AuthApi.logout();
        } catch (error) {
            console.warn('Logout API failed, forcing local cleanup', error);
        } finally {
            await performLogoutCleanup();
        }
    }

    async function deleteAccount() {
        try {
            await AuthApi.deleteAccount();
            await performLogoutCleanup();
        } catch (error) {
            console.error('Delete account failed:', error);
            throw error;
        }
    }

    async function refreshUser() {
        try {
            const userData = await AuthApi.getProfile();
            setUser(userData);
        } catch (error) {
            console.error('Refresh user failed:', error);
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isBiometricSupported,
                login,
                loginSocial,
                loginWithBiometric,
                logout,
                deleteAccount,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth phải được sử dụng trong AuthProvider');
    }
    return context;
}
```

---

## 🔧 PART 5: Permission Priming Screen (THE MISSING PIECE)

### File: `app/(auth)/permission-priming.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { ScreenWrapper } from '@/presentation/components/layout/ScreenWrapper';
import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { MapPin, Camera } from 'lucide-react-native';

/**
 * Permission Priming Screen
 * 
 * ✅ WHY: Tăng tỷ lệ cấp quyền từ 20% lên 90%
 * ✅ HOW: Giải thích ngữ cảnh TRƯỚC KHI hệ thống hỏi
 */
export default function PermissionPrimingScreen() {
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [loading, setLoading] = useState(false);

    async function handleContinue() {
        setLoading(true);

        try {
            // 1. Request Camera Permission
            if (!cameraPermission?.granted) {
                const { granted } = await requestCameraPermission();
                if (!granted) {
                    Alert.alert(
                        'Cần quyền Camera',
                        'Để chấm công bằng khuôn mặt, vui lòng cấp quyền Camera trong Cài đặt.'
                    );
                }
            }

            // 2. Request Location Permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Cần quyền Vị trí',
                    'Để xác minh bạn đang ở văn phòng, vui lòng cấp quyền Vị trí trong Cài đặt.'
                );
            }

            // 3. Dù user đồng ý hay từ chối, vẫn cho vào Home
            // (Sẽ xử lý chặn tính năng sau nếu cần)
            router.replace('/(main)/home');
        } catch (error) {
            console.error('Permission request failed:', error);
            router.replace('/(main)/home'); // Fallback
        } finally {
            setLoading(false);
        }
    }

    function handleSkip() {
        router.replace('/(main)/home');
    }

    return (
        <ScreenWrapper centered bgColor="white">
            <Card className="w-full max-w-md">
                <View className="items-center mb-6">
                    <Text className="text-2xl font-bold text-center mb-2">
                        Cần cấp quyền truy cập
                    </Text>
                    <Text className="text-slate-500 text-center">
                        Để sử dụng đầy đủ tính năng, ứng dụng cần một số quyền sau:
                    </Text>
                </View>

                {/* Permission List */}
                <View className="mb-6 space-y-4">
                    <View className="flex-row items-start">
                        <Camera size={24} color="#2563EB" className="mr-3 mt-1" />
                        <View className="flex-1">
                            <Text className="font-semibold text-slate-800 mb-1">
                                Camera
                            </Text>
                            <Text className="text-sm text-slate-500">
                                Chụp ảnh khuôn mặt khi chấm công và tạo báo cáo
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-start">
                        <MapPin size={24} color="#2563EB" className="mr-3 mt-1" />
                        <View className="flex-1">
                            <Text className="font-semibold text-slate-800 mb-1">
                                Vị trí
                            </Text>
                            <Text className="text-sm text-slate-500">
                                Xác minh bạn đang ở văn phòng khi chấm công
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <Button
                    title={loading ? 'Đang xử lý...' : 'Cho phép & Tiếp tục'}
                    onPress={handleContinue}
                    loading={loading}
                    disabled={loading}
                    fullWidth
                    size="lg"
                />

                <Button
                    title="Để sau"
                    variant="ghost"
                    onPress={handleSkip}
                    fullWidth
                    className="mt-3"
                />
            </Card>
        </ScreenWrapper>
    );
}
```

---

## 🔧 PART 6: Enhanced Login Screen

### File: `app/(auth)/login.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import { useAuth } from '@/core/auth/AuthProvider';
import { SocialLoginService } from '@/core/auth/social-login';
import { Input } from '@/presentation/components/ui/Input';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { ScreenWrapper } from '@/presentation/components/layout/ScreenWrapper';

export default function LoginScreen() {
    const { login, loginSocial, loginWithBiometric, isBiometricSupported } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        if (!email || !password) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ email và mật khẩu');
            return;
        }

        setLoading(true);

        try {
            await login({ email, password });
        } catch (error: any) {
            const serverMessage = error?.response?.data?.message;
            const displayMessage = serverMessage || 'Email hoặc mật khẩu không đúng';
            Alert.alert('Đăng nhập thất bại', displayMessage);
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleLogin() {
        if (Platform.OS === 'web') {
            Alert.alert('Không khả dụng', 'Google Sign-In chỉ khả dụng trên Mobile');
            return;
        }

        setLoading(true);

        try {
            const idToken = await SocialLoginService.signInWithGoogle();
            await loginSocial({ provider: 'google', id_token: idToken });
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Đăng nhập Google thất bại');
        } finally {
            setLoading(false);
        }
    }

    async function handleAppleLogin() {
        if (Platform.OS !== 'ios') {
            Alert.alert('Không khả dụng', 'Apple Sign-In chỉ khả dụng trên iOS');
            return;
        }

        setLoading(true);

        try {
            const idToken = await SocialLoginService.signInWithApple();
            await loginSocial({ provider: 'apple', id_token: idToken });
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Đăng nhập Apple thất bại');
        } finally {
            setLoading(false);
        }
    }

    async function handleBiometricLogin() {
        setLoading(true);

        try {
            await loginWithBiometric();
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Xác thực sinh trắc học thất bại');
        } finally {
            setLoading(false);
        }
    }

    return (
        <ScreenWrapper scrollable centered bgColor="blue">
            <Card className="w-full">
                <Text className="text-2xl font-bold text-center mb-6">
                    Đăng nhập
                </Text>

                <Input
                    label="Email"
                    placeholder="admin@quocviet.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    blurOnSubmit={false}
                />

                <Input
                    label="Mật khẩu"
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    onSubmitEditing={handleLogin}
                />

                <Button
                    title={loading ? 'Đang xác thực...' : 'Đăng nhập'}
                    onPress={handleLogin}
                    loading={loading}
                    disabled={loading}
                    fullWidth
                    size="lg"
                    className="mt-4"
                />

                {/* Biometric Login */}
                {isBiometricSupported && (
                    <Button
                        title="Đăng nhập bằng sinh trắc học"
                        variant="secondary"
                        onPress={handleBiometricLogin}
                        fullWidth
                        className="mt-3"
                    />
                )}

                {/* Social Login */}
                {Platform.OS !== 'web' && (
                    <View className="mt-6">
                        <Text className="text-center text-slate-500 mb-4">
                            Hoặc đăng nhập bằng
                        </Text>

                        <Button
                            title="Đăng nhập với Google"
                            variant="secondary"
                            onPress={handleGoogleLogin}
                            fullWidth
                            className="mb-3"
                        />

                        {Platform.OS === 'ios' && (
                            <Button
                                title="Đăng nhập với Apple"
                                variant="default"
                                onPress={handleAppleLogin}
                                fullWidth
                            />
                        )}
                    </View>
                )}
            </Card>
        </ScreenWrapper>
    );
}
```

---

## ⚠️ CRITICAL RULES

### 1. Zod Runtime Validation (MANDATORY)

- **PHẢI** parse mọi response từ Server bằng Zod
- **PHẢI** có try-catch với error message rõ ràng
- **KHÔNG** trust TypeScript interface ở runtime

### 2. Antigravity Guard (MANDATORY)

- **PHẢI** check `Platform.OS === 'web'` trước khi gọi Native SDK
- **PHẢI** có fallback logic cho Antigravity
- **KHÔNG** import Native modules ở top-level (lazy import)

### 3. Permission Priming (UX BEST PRACTICE)

- **PHẢI** redirect về Permission Priming sau login
- **PHẢI** giải thích lý do cần quyền TRƯỚC KHI hỏi
- **KHÔNG** spam popup permission ngay khi vào app

### 4. Apple Compliance

- **PHẢI** có "Delete Account" button (Guideline 5.1.1)
- **PHẢI** có "Sign in with Apple" nếu có Google Sign-In (Guideline 4.8)
- **PHẢI** request minimal permissions

---

## ✅ Verification Checklist

### Test trên Antigravity (Web)

```bash
# 1. Login với email/password
- ✅ Không crash khi gọi AuthApi.login
- ✅ Zod validation pass
- ✅ Redirect về Permission Priming

# 2. Social Login
- ✅ Không crash khi Platform.OS === 'web'
- ✅ Fallback về standard login
```

### Test trên Mobile

```bash
# 1. Standard Login
- ✅ Nhập email/password đúng → Permission Priming → Home
- ✅ Nhập sai → Error message rõ ràng

# 2. Social Login
- ✅ Google Sign-In → Nhận idToken → API success
- ✅ Apple Sign-In (iOS only) → Nhận identityToken → API success

# 3. Biometric
- ✅ FaceID/TouchID → Authenticate → Auto-login

# 4. Permission Priming
- ✅ Request Camera → User grant → Proceed
- ✅ Request Location → User deny → Still proceed (với warning)
```

---

## 📚 References

- [Zod Documentation](https://zod.dev/)
- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [React Native Google Sign-In](https://github.com/react-native-google-signin/google-signin)
- [Expo Local Authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
- [Apple Guideline 4.8 - Sign in with Apple](https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple)
- [Apple Guideline 5.1.1 - Account Deletion](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage)

---

## 🎓 Learning Outcomes

1. ✅ Hiểu tại sao cần Zod cho Runtime Validation
2. ✅ Biết cách implement Antigravity Guard cho Native SDK
3. ✅ Thành thạo Permission Priming UX pattern
4. ✅ Tuân thủ Apple/Google compliance requirements
5. ✅ Tránh được 90% lỗi Auth phổ biến

---

## 🚨 Common Pitfalls & Solutions

### Issue 1: "expo-apple-authentication crashes on Android"

**Solution**: Lazy import + Platform check

```typescript
// ❌ BAD
import * as AppleAuth from 'expo-apple-authentication';

// ✅ GOOD
if (Platform.OS === 'ios') {
  const AppleAuth = require('expo-apple-authentication');
}
```

### Issue 2: "Zod validation too strict"

**Solution**: Use `.nullable().optional()` cho optional fields

```typescript
avatar: z.string().nullable().optional()
```

### Issue 3: "Permission denied → App unusable"

**Solution**: Graceful degradation

```typescript
// Vẫn cho vào Home, nhưng disable tính năng cần permission
if (!hasLocationPermission) {
  showWarning('Tính năng Chấm công bị tắt. Cấp quyền Vị trí để sử dụng.');
}
```
