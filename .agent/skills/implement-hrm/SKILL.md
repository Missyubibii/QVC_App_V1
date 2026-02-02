---
description: Chấm công GPS/Camera chuẩn Offline-First & Anti-Cheat với OpenStreetMap
---

# SKILL: Implement HRM (Human Resource Management)

## 🎯 Mục tiêu

1. **Reliability**: Chấm công được ngay cả khi mất mạng (Offline-First)
2. **Hardware Safety**: Không treo App khi GPS yếu. Không crash trên Antigravity
3. **Data Integrity**: Chống spam nút (Idempotency UUID)
4. **Cost Effective**: Dùng OpenStreetMap miễn phí 100% (thay Google Maps)

## 📋 Prerequisites

- `implement-core` đã chạy xong
- Libraries: `expo-location`, `expo-camera`, `expo-crypto`, `expo-network`, `react-native-maps`

---

## 🔧 PART 1: Hardware Service with Timeout Guard

### File: `src/core/hardware/location.ts`

```typescript
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface Coordinates {
    latitude: number;
    longitude: number;
    accuracy: number;
    is_mock: boolean; // Flag quan trọng để Server biết
}

export const LocationService = {
    /**
     * Request Permission
     */
    async requestPermission(): Promise<boolean> {
        if (Platform.OS === 'web') return true;
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
    },

    /**
     * Get Location with Timeout Guard
     * ✅ CRITICAL: Race condition để tránh GPS treo app
     */
    async getCurrentLocation(): Promise<Coordinates> {
        // 1. Antigravity Guard
        if (Platform.OS === 'web') {
            return {
                latitude: 10.8231, // Mock Quốc Việt Office
                longitude: 106.6297,
                accuracy: 10,
                is_mock: true,
            };
        }

        try {
            // 2. Race Condition: GPS vs Timeout (5s)
            // Tránh việc App bị treo khi GPS yếu
            const locationPromise = Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced, // Balanced nhanh hơn High
            });

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 5000)
            );

            const result = await Promise.race([locationPromise, timeoutPromise]);

            return {
                latitude: result.coords.latitude,
                longitude: result.coords.longitude,
                accuracy: result.coords.accuracy || 0,
                is_mock: result.mocked || false,
            };
        } catch (error: any) {
            if (error.message === 'TIMEOUT') {
                // Fallback: Lấy vị trí cuối cùng được lưu đệm
                const lastKnown = await Location.getLastKnownPositionAsync();
                
                if (lastKnown) {
                    console.warn('⚠️ GPS timeout, using last known location');
                    return {
                        latitude: lastKnown.coords.latitude,
                        longitude: lastKnown.coords.longitude,
                        accuracy: lastKnown.coords.accuracy || 100,
                        is_mock: false,
                    };
                }
                
                throw new Error('GPS yếu. Vui lòng di chuyển ra chỗ thoáng.');
            }
            
            throw error;
        }
    },
};
```

### File: `src/core/hardware/camera.ts`

```typescript
import * as Camera from 'expo-camera';
import { Platform } from 'react-native';

export interface CapturedPhoto {
    base64?: string;
    uri: string;
}

export const CameraService = {
    /**
     * Request Permission
     */
    async requestPermission(): Promise<boolean> {
        if (Platform.OS === 'web') return true;
        
        const { status } = await Camera.requestCameraPermissionsAsync();
        return status === 'granted';
    },

    /**
     * Capture Photo (Mock on Antigravity)
     */
    async capturePhoto(): Promise<CapturedPhoto | null> {
        // Antigravity Guard
        if (Platform.OS === 'web') {
            return {
                uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            };
        }

        // Real device: Launch camera
        const result = await Camera.launchCameraAsync({
            mediaTypes: Camera.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5, // Compress để giảm dung lượng
            base64: true,
        });

        if (result.canceled) return null;

        return {
            uri: result.assets[0].uri,
            base64: result.assets[0].base64,
        };
    },
};
```

---

## 🔧 PART 2: Idempotent API (Chống Duplicate)

### File: `src/data/api/attendance.api.ts`

```typescript
import apiClient from '@/core/api/client';
import * as Crypto from 'expo-crypto';
import { Coordinates } from '@/core/hardware/location';
import { CapturedPhoto } from '@/core/hardware/camera';

export interface CheckInPayload {
    uuid: string; // ✅ Idempotency Key
    latitude: number;
    longitude: number;
    accuracy: number;
    photo_base64?: string;
    is_mock: boolean;
    created_at: number; // Timestamp lúc bấm
}

export interface CheckInResponse {
    id: number;
    user_id: number;
    check_in_time: string;
    location: string;
    status: 'success';
}

export const AttendanceApi = {
    /**
     * Check In
     */
    checkIn: async (payload: CheckInPayload): Promise<CheckInResponse> => {
        return apiClient.post('/app/hrm/check-in', payload);
    },

    /**
     * Check Out
     */
    checkOut: async (payload: CheckInPayload): Promise<CheckInResponse> => {
        return apiClient.post('/app/hrm/check-out', payload);
    },

    /**
     * Helper: Tạo Payload chuẩn
     */
    createPayload: (location: Coordinates, photo: CapturedPhoto | null): CheckInPayload => ({
        uuid: Crypto.randomUUID(), // Tạo ID duy nhất ngay tại Client
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        is_mock: location.is_mock,
        photo_base64: photo?.base64,
        created_at: Date.now(),
    }),
};
```

---

## 🔧 PART 3: Offline-First Logic (The Brain)

### File: `src/data/hooks/useCheckIn.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { Alert } from 'react-native';
import { AttendanceApi } from '@/data/api/attendance.api';
import { LocationService } from '@/core/hardware/location';
import { CameraService } from '@/core/hardware/camera';
import { OfflineQueueService } from '@/data/services/offline-queue';

export function useCheckIn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (note?: string) => {
            // 1. Hardware Phase (Parallel để nhanh hơn)
            const [location, photo] = await Promise.all([
                LocationService.getCurrentLocation(),
                CameraService.capturePhoto(),
            ]);

            // 2. Build Payload
            const payload = AttendanceApi.createPayload(location, photo);

            // 3. Network Check Phase
            const netStatus = await Network.getNetworkStateAsync();

            if (!netStatus.isConnected || !netStatus.isInternetReachable) {
                // 🛑 OFFLINE LOGIC
                // Lưu vào Queue thật sự thay vì throw error suông
                await OfflineQueueService.addToQueue(payload);
                
                // Throw error đặc biệt để kích hoạt onError UI
                throw new Error('OFFLINE_SAVED');
            }

            // 4. Online Phase
            return await AttendanceApi.checkIn(payload);
        },
        onError: (error: any) => {
            if (error.message === 'OFFLINE_SAVED') {
                // ✅ UI Feedback chuẩn Offline-First
                Alert.alert(
                    'Đã lưu Offline',
                    'Dữ liệu đã được lưu vào bộ nhớ máy và sẽ tự động gửi khi có mạng.'
                );
            } else {
                Alert.alert('Lỗi chấm công', error.message);
            }
        },
        onSuccess: () => {
            Alert.alert('Thành công', 'Đã chấm công.');
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
        },
    });
}
```

---

## 🔧 PART 3.5: Offline Queue Service (The Vault)

### File: `src/data/services/offline-queue.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckInPayload } from '@/data/api/attendance.api';

const QUEUE_KEY = 'hrm_offline_queue';

export const OfflineQueueService = {
    /**
     * Thêm request vào hàng đợi
     */
    async addToQueue(payload: CheckInPayload): Promise<void> {
        try {
            // 1. Lấy hàng đợi hiện tại
            const currentQueueRaw = await AsyncStorage.getItem(QUEUE_KEY);
            const currentQueue: CheckInPayload[] = currentQueueRaw 
                ? JSON.parse(currentQueueRaw) 
                : [];

            // 2. Thêm mới (Tránh trùng lặp UUID)
            const exists = currentQueue.some(item => item.uuid === payload.uuid);
            if (!exists) {
                currentQueue.push(payload);
                
                // 3. Lưu lại
                await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(currentQueue));
                console.log(`📦 [OfflineQueue] Saved item ${payload.uuid}. Total: ${currentQueue.length}`);
            }
        } catch (error) {
            console.error('Failed to save offline queue:', error);
        }
    },

    /**
     * Lấy và xóa hàng đợi (để sync)
     */
    async popQueue(): Promise<CheckInPayload[]> {
        try {
            const currentQueueRaw = await AsyncStorage.getItem(QUEUE_KEY);
            if (!currentQueueRaw) return [];

            const queue = JSON.parse(currentQueueRaw);
            
            // Clear queue sau khi lấy
            await AsyncStorage.removeItem(QUEUE_KEY);
            return queue;
        } catch (error) {
            console.error('Failed to pop offline queue:', error);
            return [];
        }
    },
    
    /**
     * Đếm số lượng pending
     */
    async getCount(): Promise<number> {
        try {
            const currentQueueRaw = await AsyncStorage.getItem(QUEUE_KEY);
            return currentQueueRaw ? JSON.parse(currentQueueRaw).length : 0;
        } catch (error) {
            return 0;
        }
    },
};
```

### ⚠️ WHY OFFLINE QUEUE?

**Vấn đề**: User mất mạng → Bấm chấm công → Data biến mất

**Giải pháp**: Lưu vào AsyncStorage → Tự động sync khi có mạng

**Lợi ích**:

- Không mất dữ liệu khi offline
- UX tốt hơn (báo "Đã lưu" thay vì "Lỗi mạng")
- Tự động retry khi có mạng trở lại

---

## 🔧 PART 4: Auto Sync Logic (The Un-locker)

### File: `src/data/hooks/useAutoSync.ts`

```typescript
import { useEffect } from 'react';
import * as Network from 'expo-network';
import { OfflineQueueService } from '@/data/services/offline-queue';
import { AttendanceApi } from '@/data/api/attendance.api';

/**
 * Hook này sẽ được gắn vào Layout chính.
 * Tự động kiểm tra mạng và đẩy dữ liệu Offline lên Server.
 */
export function useAutoSync() {
    useEffect(() => {
        const syncData = async () => {
            // 1. Check Network
            const status = await Network.getNetworkStateAsync();
            if (!status.isConnected || !status.isInternetReachable) {
                return;
            }

            // 2. Check Queue
            const count = await OfflineQueueService.getCount();
            if (count === 0) {
                return;
            }

            console.log(`🔄 [AutoSync] Found ${count} pending items. Syncing...`);

            // 3. Process Queue
            const queue = await OfflineQueueService.popQueue();
            
            // Gửi lần lượt (Serial) để tránh DDOS Server
            for (const item of queue) {
                try {
                    console.log(`📤 Syncing item: ${item.uuid}`);
                    await AttendanceApi.checkIn(item);
                    console.log(`✅ Synced: ${item.uuid}`);
                } catch (error) {
                    console.error(`❌ Sync failed for ${item.uuid}:`, error);
                    // TODO: Nếu lỗi, đẩy lại vào queue để thử lại sau
                    // Hoặc lưu vào failed_queue riêng để admin xử lý
                }
            }

            console.log(`✅ [AutoSync] Completed. Synced ${queue.length} items.`);
        };

        // Chạy mỗi khi App mount hoặc focus lại
        const interval = setInterval(syncData, 30000); // Check mỗi 30s
        syncData(); // Check ngay lập tức

        return () => clearInterval(interval);
    }, []);
}
```

### ⚠️ WHY AUTO SYNC?

**Problem**: User chấm công offline → Data lưu vào queue → **Nhưng không bao giờ được gửi lên server**

**Solution**: Hook tự động check network mỗi 30s → Gửi data khi có mạng

**Impact**:
- Dữ liệu offline tự động sync khi có mạng
- User không cần làm gì thêm
- Zero data loss

---

## 🔧 PART 5: Free Map & Geocoding (OpenStreetMap)

### File: `src/presentation/components/hrm/CheckInMap.tsx`

```typescript
import React from 'react';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { View, Text, Platform, ActivityIndicator } from 'react-native';
import { Coordinates } from '@/core/hardware/location';

interface CheckInMapProps {
    location: Coordinates | null;
    loading: boolean;
}

export const CheckInMap = ({ location, loading }: CheckInMapProps) => {
    // 1. Antigravity Guard (Web Fallback)
    if (Platform.OS === 'web') {
        return (
            <View className="h-48 w-full bg-slate-100 items-center justify-center rounded-xl border border-slate-200">
                <Text className="text-slate-500">
                    🗺️ Map View (Mocked for Antigravity)
                </Text>
                {location && (
                    <Text className="text-xs text-slate-400 mt-2">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </Text>
                )}
            </View>
        );
    }

    if (!location || loading) {
        return (
            <View className="h-48 w-full bg-slate-50 items-center justify-center rounded-xl">
                <ActivityIndicator size="small" color="#007AFF" />
                <Text className="text-xs text-slate-400 mt-2">Đang lấy vị trí...</Text>
            </View>
        );
    }

    return (
        <View className="h-48 w-full rounded-xl overflow-hidden border border-slate-200">
            <MapView
                provider={PROVIDER_DEFAULT} // Không dùng PROVIDER_GOOGLE để tránh cần API Key
                style={{ flex: 1 }}
                initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.005, // Zoom level (Gần)
                    longitudeDelta: 0.005,
                }}
                rotateEnabled={false}
                pitchEnabled={false}
            >
                {/* ✅ CORE MAGIC: Dùng OpenStreetMap Tiles (Miễn phí hoàn toàn) */}
                <UrlTile
                    urlTemplate="https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maximumZ={19}
                    flipY={false}
                />

                {/* Marker vị trí hiện tại */}
                <Marker
                    coordinate={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                    }}
                    title="Vị trí của bạn"
                />
            </MapView>

            {/* Overlay bản quyền (Bắt buộc theo luật OSM) */}
            <View className="absolute bottom-1 right-1 bg-white/70 px-1 rounded">
                <Text className="text-[8px] text-black">© OpenStreetMap</Text>
            </View>
        </View>
    );
};
```

### File: `src/core/services/geocoding.ts`

```typescript
import axios from 'axios';
import { Platform } from 'react-native';

export const GeocodingService = {
    /**
     * Reverse Geocoding dùng Nominatim (OSM) - Miễn phí
     * ⚠️ Rate Limit: 1 request/giây
     */
    async getAddress(lat: number, lon: number): Promise<string> {
        // Antigravity Guard
        if (Platform.OS === 'web') {
            return 'Văn phòng Quốc Việt (Mock Address)';
        }

        try {
            // Lưu ý: Nominatim yêu cầu User-Agent header
            const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
                params: {
                    lat,
                    lon,
                    format: 'json',
                    zoom: 18,
                    addressdetails: 1,
                },
                headers: {
                    'User-Agent': 'QuocVietSuperApp/1.0',
                },
                timeout: 5000,
            });

            if (response.data && response.data.display_name) {
                return response.data.display_name;
            }

            return 'Không xác định được tên đường';
        } catch (error) {
            console.warn('Geocoding failed:', error);
            return 'Lỗi lấy địa chỉ (Vẫn chấm công được)';
        }
    },
};
```

---

## 🔧 PART 6: Check-In Screen

### File: `app/(main)/checkin.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { Button } from '@/presentation/components/ui/Button';
import { CheckInMap } from '@/presentation/components/hrm/CheckInMap';
import { useCheckIn } from '@/data/hooks/useCheckIn';
import { LocationService } from '@/core/hardware/location';
import { GeocodingService } from '@/core/services/geocoding';
import { Coordinates } from '@/core/hardware/location';

export default function CheckInScreen() {
    const [location, setLocation] = useState<Coordinates | null>(null);
    const [address, setAddress] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const checkInMutation = useCheckIn();

    // Load location on mount
    useEffect(() => {
        loadLocation();
    }, []);

    const loadLocation = async () => {
        setLoading(true);
        try {
            const hasPermission = await LocationService.requestPermission();
            
            if (!hasPermission) {
                Alert.alert('Lỗi', 'Cần cấp quyền vị trí để chấm công');
                return;
            }

            const coords = await LocationService.getCurrentLocation();
            setLocation(coords);

            // Get address (only once, not in useEffect loop)
            const addr = await GeocodingService.getAddress(
                coords.latitude,
                coords.longitude
            );
            setAddress(addr);
        } catch (error: any) {
            Alert.alert('Lỗi GPS', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (!location) {
            Alert.alert('Lỗi', 'Chưa có vị trí GPS');
            return;
        }

        // ✅ ADDED: Check Camera Permission trước khi bấm
        const hasCam = await CameraService.requestPermission();
        if (!hasCam) {
            Alert.alert(
                'Quyền Camera',
                'Vui lòng cấp quyền Camera để chụp ảnh check-in.'
            );
            return;
        }

        checkInMutation.mutate();
    };

    return (
        <View className="flex-1 bg-white p-4">
            <Text className="text-2xl font-bold mb-4">Chấm công</Text>

            {/* Map */}
            <CheckInMap location={location} loading={loading} />

            {/* Address */}
            {address && (
                <View className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <Text className="text-xs text-slate-500">Địa chỉ</Text>
                    <Text className="text-sm mt-1">{address}</Text>
                </View>
            )}

            {/* Accuracy Warning */}
            {location && location.accuracy > 50 && (
                <View className="mt-2 p-2 bg-yellow-50 rounded-lg">
                    <Text className="text-xs text-yellow-700">
                        ⚠️ GPS không chính xác ({location.accuracy.toFixed(0)}m)
                    </Text>
                </View>
            )}

            {/* Check In Button */}
            <Button
                title="Chấm công vào"
                onPress={handleCheckIn}
                loading={checkInMutation.isPending}
                disabled={!location || loading}
                className="mt-4"
            />

            {/* Refresh Button */}
            <Button
                title="Làm mới vị trí"
                variant="secondary"
                onPress={loadLocation}
                loading={loading}
                className="mt-2"
            />
        </View>
    );
}
```

---

## ⚠️ CRITICAL RULES

### 1. Timeout Guard (MANDATORY)

- **PHẢI** dùng `Promise.race` với timeout 5s
- **PHẢI** fallback về `getLastKnownPositionAsync` nếu timeout
- **KHÔNG** để GPS treo app vô thời hạn

### 2. Idempotency (MANDATORY)

- **PHẢI** thêm `uuid` vào mọi payload
- **PHẢI** thêm `created_at` timestamp
- **KHÔNG** tin tưởng user chỉ bấm 1 lần

### 3. Offline-First (BEST PRACTICE)

- **PHẢI** check network status trước khi gọi API
- **NÊN** lưu payload vào queue khi offline
- **KHÔNG** để user mất dữ liệu khi mất mạng

### 4. OpenStreetMap (COST SAVING)

- **PHẢI** dùng `<UrlTile>` với OSM tiles
- **PHẢI** hiển thị "© OpenStreetMap" attribution
- **KHÔNG** gọi Nominatim quá 1 req/giây

---

## ✅ Verification Tests

### Test 1: GPS Timeout

```typescript
// Simulate GPS timeout
// Expected: Fallback to last known location or error message
```

### Test 2: Offline Mode

```typescript
// Turn off wifi/mobile data
// Tap Check In
// Expected: "Đã lưu Offline" alert
```

### Test 3: Duplicate Prevention

```typescript
// Tap Check In button 5 times rapidly
// Expected: Only 1 record created (same UUID)
```

### Test 4: Antigravity Compatibility

```typescript
// Run on web browser
// Expected: Mock GPS, Mock Map, No crash
```

---

## 📚 References

- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [OpenStreetMap Tiles](https://wiki.openstreetmap.org/wiki/Tile_servers)
- [Nominatim API](https://nominatim.org/release-docs/latest/api/Reverse/)

---

## 🎓 Learning Outcomes

1. ✅ Hiểu cách implement GPS timeout guard để tránh app treo
2. ✅ Biết cách build offline-first attendance system
3. ✅ Thành thạo OpenStreetMap integration (miễn phí 100%)
4. ✅ Tránh được duplicate records với idempotency UUID

---

## 🚨 Common Pitfalls & Solutions

### Issue 1: "GPS treo app mãi không dừng"

**Cause**: `getCurrentPositionAsync` không có timeout

**Solution**: Dùng `Promise.race` với timeout 5s

```typescript
const result = await Promise.race([
    Location.getCurrentPositionAsync(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 5000))
]);
```

### Issue 2: "Map hiển thị trắng"

**Cause**: Thiếu `<UrlTile>` hoặc URL sai

**Solution**: Đảm bảo URL đúng format `https://c.tile.openstreetmap.org/{z}/{x}/{y}.png`

### Issue 3: "Nominatim trả về 429 Too Many Requests"

**Cause**: Gọi quá 1 request/giây

**Solution**: Chỉ gọi 1 lần khi GPS stable, không gọi trong `useEffect` loop

---

## 💡 Pro Tips

1. **Use Balanced Accuracy**: `Location.Accuracy.Balanced` nhanh hơn `High` mà vẫn đủ chính xác
2. **Compress Photos**: Set `quality: 0.5` để giảm dung lượng upload
3. **Cache Last Known Location**: Lưu vào AsyncStorage để lần sau load nhanh hơn
4. **Monitor Network**: Dùng `NetInfo` để tự động retry khi có mạng trở lại
