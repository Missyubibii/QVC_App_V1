---
description: "CRITICAL: Hệ thống Debugger nội bộ. Giúp xem Log, Network Request, Storage ngay trên màn hình điện thoại (Production/Staging)."
globs: "src/core/logger/**/*, src/presentation/screens/Debug/**/*"
---

# SKILL: Implement In-App Debugger

> [!WARNING]
> **Performance Rule**:
>
> 1. Chỉ lưu tối đa 50-100 logs gần nhất (Tránh tràn RAM).
> 2. Debugger chỉ được phép bật ở môi trường DEV hoặc STAGING (Ẩn ở Production bằng Feature Flag).
> 3. Tuyệt đối không log Token/Password ra màn hình này.

## 🎯 Mục Tiêu Cốt Lõi

1. **Network Inspector**: Xem full request/response (như Network tab của Chrome).
2. **System Logs**: Capture `console.log`, `console.warn`, `console.error`.
3. **Storage Viewer**: Xem/Xóa key trong MMKV & SecureStore.
4. **Device Info**: Xem IP, OS, App Version.

---

## 🔧 BƯỚC 1: Cài đặt Dependencies

**AI Action:**

Chúng ta sẽ tự build UI đơn giản để không phụ thuộc thư viện nặng nề như `react-native-debugger`.

```bash
# Store log state (đã có từ implement-core)
# npx expo install zustand

# Copy log to clipboard
npx expo install expo-clipboard

# Device Info
npx expo install expo-device expo-application
```

> [!NOTE]
> Zustand đã được cài ở bước Core, chúng ta chỉ cần cài thêm `expo-clipboard` và `expo-device`.

---

## 🔧 BƯỚC 2: Log Store (Zustand)

**File:** `src/core/logger/logStore.ts`

**Mục tiêu:** Lưu trữ log vào bộ nhớ tạm (RAM).

```typescript
import { create } from 'zustand';

export type LogType = 'INFO' | 'WARN' | 'ERROR' | 'NETWORK';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: LogType;
  message: string;
  details?: any; // JSON object
}

interface LogState {
  logs: LogEntry[];
  addLog: (type: LogType, message: string, details?: any) => void;
  clearLogs: () => void;
}

const MAX_LOGS = 50; // Giới hạn RAM

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  
  addLog: (type, message, details) => set((state) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type,
      message,
      details,
    };
    
    // Giữ tối đa MAX_LOGS mới nhất
    return { logs: [newLog, ...state.logs].slice(0, MAX_LOGS) };
  }),
  
  clearLogs: () => set({ logs: [] }),
}));
```

> [!CRITICAL]
> **Memory Limit**: Chỉ lưu 50 logs mới nhất để tránh tràn RAM trên thiết bị cấp thấp.

---

## 🔧 BƯỚC 3: Network Interceptor Integration

**File:** `src/core/networking/apiClient.ts` (Sửa đổi)

**Mục tiêu:** Tự động đẩy Request/Response vào Log Store.

```typescript
import { useLogStore } from '@/core/logger/logStore';

// ... (Code cũ từ implement-core)

// Request Interceptor (Thêm logging)
apiClient.interceptors.request.use(async (config) => {
  const token = await TokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // 🔥 Log Network Request
  useLogStore.getState().addLog(
    'NETWORK', 
    `⬆️ ${config.method?.toUpperCase()} ${config.url}`, 
    {
      headers: config.headers,
      // ⚠️ Cẩn thận: Ẩn password nếu là login endpoint
      data: config.url?.includes('login') 
        ? { ...config.data, password: '***' } 
        : config.data,
    }
  );
  
  return config;
});

// Response Interceptor (Thêm logging)
apiClient.interceptors.response.use(
  (response) => {
    const { code, data, message } = response.data;

    // 🔥 Log Network Response
    useLogStore.getState().addLog(
      'NETWORK', 
      `⬇️ ${response.status} ${response.config.url}`, 
      {
        code,
        data: typeof data === 'object' ? JSON.stringify(data).slice(0, 200) : data,
      }
    );

    // Envelope unwrap logic (giữ nguyên từ implement-core)
    if (code && code !== 200) {
      return Promise.reject(new Error(message || 'Lỗi nghiệp vụ không xác định'));
    }

    response.data = data;
    return response;
  },
  async (error: AxiosError) => {
    // 🔥 Log Network Error
    useLogStore.getState().addLog(
      'ERROR', 
      `❌ ${error.response?.status || 'NETWORK_ERR'} ${error.config?.url}`, 
      {
        message: error.message,
        response: error.response?.data,
      }
    );

    // 401 handling (giữ nguyên)
    if (error.response?.status === 401) {
      await TokenStorage.clearToken();
    }
    
    return Promise.reject(error);
  }
);
```

> [!WARNING]
> **Security**: Luôn filter `password` field trong login request trước khi log, tránh lộ thông tin nhạy cảm.

---

## 🔧 BƯỚC 4: Console Log Capture (Optional)

**File:** `src/core/logger/consoleOverride.ts`

**Mục tiêu:** Bắt các lệnh `console.log` thông thường để hiển thị lên Debugger.

```typescript
import { useLogStore } from './logStore';

const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

export const enableConsoleCapture = () => {
  if (!__DEV__) return; // Chỉ chạy ở Dev/Staging

  console.log = (...args) => {
    originalLog(...args);
    useLogStore.getState().addLog('INFO', args.map(a => String(a)).join(' '));
  };

  console.warn = (...args) => {
    originalWarn(...args);
    useLogStore.getState().addLog('WARN', args.map(a => String(a)).join(' '));
  };

  console.error = (...args) => {
    originalError(...args);
    useLogStore.getState().addLog('ERROR', args.map(a => String(a)).join(' '));
  };
};
```

**Khởi động trong `app/_layout.tsx`:**

```typescript
import { enableConsoleCapture } from '@/core/logger/consoleOverride';

export default function RootLayout() {
  useEffect(() => {
    enableConsoleCapture();
  }, []);
  
  // ... rest of layout
}
```

---

## 🔧 BƯỚC 5: Debug UI Screen

**File:** `src/presentation/screens/Debug/DebugLogScreen.tsx`

**Mục tiêu:** Màn hình hiển thị danh sách log.

```typescript
import { FlashList } from '@shopify/flash-list';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { useLogStore, LogEntry } from '@/core/logger/logStore';

export default function DebugLogScreen() {
  const { logs, clearLogs } = useLogStore();
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const getLogColor = (type: string) => {
    switch (type) {
      case 'ERROR': return 'text-red-600';
      case 'WARN': return 'text-yellow-600';
      case 'NETWORK': return 'text-blue-600';
      default: return 'text-gray-800';
    }
  };

  const copyAllLogs = async () => {
    const logText = logs.map(log => 
      `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.type}: ${log.message}`
    ).join('\n');
    
    await Clipboard.setStringAsync(logText);
    alert('Logs copied to clipboard!');
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200">
        <Text className="text-lg font-bold">Debug Logs ({logs.length}/50)</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity 
            onPress={copyAllLogs}
            className="px-3 py-2 bg-blue-500 rounded"
          >
            <Text className="text-white font-semibold">Copy All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={clearLogs}
            className="px-3 py-2 bg-red-500 rounded"
          >
            <Text className="text-white font-semibold">Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Log List */}
      <FlashList
        data={logs}
        estimatedItemSize={60}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedLog(item)}
            className="p-3 bg-white border-b border-gray-200"
          >
            <View className="flex-row justify-between">
              <Text className={`font-semibold ${getLogColor(item.type)}`}>
                {item.type}
              </Text>
              <Text className="text-xs text-gray-500">
                {new Date(item.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            <Text className="text-sm mt-1" numberOfLines={2}>
              {item.message}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
      />

      {/* Detail Modal */}
      <Modal
        visible={!!selectedLog}
        animationType="slide"
        onRequestClose={() => setSelectedLog(null)}
      >
        <View className="flex-1 bg-white p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Log Details</Text>
            <TouchableOpacity onPress={() => setSelectedLog(null)}>
              <Text className="text-blue-500 text-lg">Close</Text>
            </TouchableOpacity>
          </View>
          
          {selectedLog && (
            <View>
              <Text className="font-semibold mb-2">Type: {selectedLog.type}</Text>
              <Text className="text-gray-600 mb-2">
                Time: {new Date(selectedLog.timestamp).toLocaleString()}
              </Text>
              <Text className="font-semibold mb-2">Message:</Text>
              <Text className="mb-4">{selectedLog.message}</Text>
              
              {selectedLog.details && (
                <>
                  <Text className="font-semibold mb-2">Details:</Text>
                  <Text className="font-mono text-xs bg-gray-100 p-2 rounded">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </Text>
                </>
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
```

---

## 🔧 BƯỚC 6: Storage Viewer Screen

**File:** `src/presentation/screens/Debug/StorageViewerScreen.tsx`

**Mục tiêu:** Xem/Xóa dữ liệu trong MMKV.

```typescript
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { AppStorage } from '@/core/storage/mmkv';

export default function StorageViewerScreen() {
  const [storageData, setStorageData] = useState<Record<string, any>>({});

  const loadStorage = () => {
    // Note: MMKV không có API getAllKeys(), cần track keys manually
    // Hoặc dùng một prefix convention
    const knownKeys = ['user_preferences', 'cache_data', 'last_sync'];
    const data: Record<string, any> = {};
    
    knownKeys.forEach(key => {
      const value = AppStorage.getItem(key);
      if (value) data[key] = value;
    });
    
    setStorageData(data);
  };

  const deleteKey = (key: string) => {
    Alert.alert('Delete Key', `Are you sure you want to delete "${key}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: () => {
          AppStorage.removeItem(key);
          loadStorage();
        }
      }
    ]);
  };

  useEffect(() => {
    loadStorage();
  }, []);

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4">
      <Text className="text-xl font-bold mb-4">MMKV Storage</Text>
      
      {Object.entries(storageData).map(([key, value]) => (
        <View key={key} className="bg-white p-4 mb-2 rounded">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="font-semibold">{key}</Text>
              <Text className="text-xs text-gray-600 mt-1" numberOfLines={3}>
                {JSON.stringify(value)}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => deleteKey(key)}
              className="ml-2 px-2 py-1 bg-red-500 rounded"
            >
              <Text className="text-white text-xs">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      
      <TouchableOpacity 
        onPress={loadStorage}
        className="mt-4 p-3 bg-blue-500 rounded"
      >
        <Text className="text-white text-center font-semibold">Reload</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
```

---

## 🔧 BƯỚC 7: Device Info Screen

**File:** `src/presentation/screens/Debug/DeviceInfoScreen.tsx`

```typescript
import { View, Text, ScrollView } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

export default function DeviceInfoScreen() {
  const info = {
    'App Version': Application.nativeApplicationVersion,
    'Build Number': Application.nativeBuildVersion,
    'Device Name': Device.deviceName,
    'Model': Device.modelName,
    'OS': Platform.OS,
    'OS Version': Platform.Version,
    'Is Device': Device.isDevice ? 'Yes' : 'No (Emulator)',
    'Brand': Device.brand,
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4">
      <Text className="text-xl font-bold mb-4">Device Information</Text>
      
      {Object.entries(info).map(([key, value]) => (
        <View key={key} className="bg-white p-3 mb-2 rounded">
          <Text className="text-gray-600 text-sm">{key}</Text>
          <Text className="font-semibold mt-1">{value}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
```

---

## 🔧 BƯỚC 8: Secret Entry Point (Lối vào bí mật)

**File:** `src/presentation/screens/(tabs)/profile.tsx` (Ví dụ)

**Mục tiêu:** User thường không thấy nút Debug.

**Logic:**

- Tạo một vùng trong suốt (Transparent Area) hoặc logo App
- User bấm liên tiếp 5 lần (Tap 5 times) → Mở màn hình Debug

```typescript
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View, Text } from 'react-native';

export default function ProfileScreen() {
  const [tapCount, setTapCount] = useState(0);
  const router = useRouter();

  const handleSecretTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    
    if (newCount >= 5) {
      setTapCount(0);
      router.push('/debug/logs');
    }
    
    // Reset sau 2 giây
    setTimeout(() => setTapCount(0), 2000);
  };

  return (
    <View className="flex-1 p-4">
      {/* Header với secret area */}
      <TouchableOpacity onPress={handleSecretTap} activeOpacity={1}>
        <Text className="text-2xl font-bold">Profile</Text>
      </TouchableOpacity>
      
      {/* Rest of profile content */}
    </View>
  );
}
```

**Debug Tab Routes:**

Create folder structure:

```
app/
  debug/
    _layout.tsx
    logs.tsx
    storage.tsx
    device.tsx
```

**File:** `app/debug/_layout.tsx`

```typescript
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function DebugLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen 
        name="logs" 
        options={{ 
          title: 'Logs',
          tabBarIcon: ({ color }) => <Text style={{ color }}>📝</Text>
        }} 
      />
      <Tabs.Screen 
        name="storage" 
        options={{ 
          title: 'Storage',
          tabBarIcon: ({ color }) => <Text style={{ color }}>💾</Text>
        }} 
      />
      <Tabs.Screen 
        name="device" 
        options={{ 
          title: 'Device',
          tabBarIcon: ({ color }) => <Text style={{ color }}>📱</Text>
        }} 
      />
    </Tabs>
  );
}
```

> [!NOTE]
> **Layout Options**:
> - `headerShown: false` - Tránh double header nếu Stack cha đã có header
> - `tabBarIcon` - Emoji icons để dễ nhận diện (có thể thay bằng icon library)

---

## 🚨 Checklist Kiểm Tra (Definition of Done)

AI phải tự kiểm tra:

### Core Functionality

- [ ] **Memory Leak**: Log Store có giới hạn số lượng log không (50-100)?
- [ ] **Security**: Có filter password/token trong log không?
- [ ] **Network Logging**: Request/Response có được log đầy đủ không?

### UI/UX

- [ ] **Entry Point**: Có lối vào ẩn (secret tap) không?
- [ ] **Copy Function**: Có chức năng copy log text không?
- [ ] **Clear Function**: Có nút xóa log không?

### Safety

- [ ] **Production Hide**: Debug screen có ẩn ở production không (feature flag)?
- [ ] **Sensitive Data**: Password/Token có bị log không?

---

## 💡 Pro Tips

### 1. Feature Flag cho Production

```typescript
// src/core/config/env.ts
export const Env = {
  // ...
  EXPO_PUBLIC_ENABLE_DEBUGGER: process.env.EXPO_PUBLIC_ENABLE_DEBUGGER === 'true',
};

// Trong entry point logic
if (!Env.EXPO_PUBLIC_ENABLE_DEBUGGER) {
  // Không show debug tab/button
}
```

### 2. Export Logs to File

```typescript
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const exportLogs = async () => {
  const logs = useLogStore.getState().logs;
  const logText = JSON.stringify(logs, null, 2);
  
  const fileUri = FileSystem.documentDirectory + 'debug-logs.json';
  await FileSystem.writeAsStringAsync(fileUri, logText);
  await Sharing.shareAsync(fileUri);
};
```

### 3. Remote Logging (Advanced)

Gửi logs lên server để developer xem từ xa:

```typescript
const sendLogsToServer = async () => {
  const logs = useLogStore.getState().logs;
  await apiClient.post('/debug/logs', { logs });
};
```

---

## 🎓 Tài Liệu Tham Khảo

- [Expo Clipboard](https://docs.expo.dev/versions/latest/sdk/clipboard/)
- [Expo Device](https://docs.expo.dev/versions/latest/sdk/device/)
- [Expo Application](https://docs.expo.dev/versions/latest/sdk/application/)
- [FlashList](https://shopify.github.io/flash-list/)
