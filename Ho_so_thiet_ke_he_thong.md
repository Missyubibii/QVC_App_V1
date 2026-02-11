# HỒ SƠ THIẾT KẾ HỆ THỐNG: QVC APP

## CHƯƠNG 1: TỔNG QUAN HẠ TẦNG & CÔNG NGHỆ (CLOUD-FIRST ARCHITECTURE)
**Phiên bản:** 9.0 (Cloud-First Architecture)  
**Môi trường:** Antigravity (Cloud IDE) + Expo Prebuild (CNG)  
**Mục tiêu:** Build một lần chạy mọi nơi, vượt qua rào cản mạng của Cloud IDE, tối ưu hiệu năng bản đồ Native.

### 1.1. BỘ CÔNG NGHỆ CHUẨN (FAIL-SAFE STACK)

| Thành phần | Công nghệ / Thư viện | Lý do chọn & Lưu ý sống còn |
| :--- | :--- | :--- |
| **Framework** | Expo SDK 52+ | Sử dụng workflow Prebuild (CNG). |
| **Kết nối Cloud** | Ngrok (Tunnel) | **BẮT BUỘC** trên Antigravity. Giúp điện thoại thật kết nối được với Server Dev trên Cloud. |
| **Bản đồ** | `@maplibre/maplibre-react-native` | Render Vector Map. Yêu cầu cấu hình **Web Guard** để không crash trên Antigravity Preview. |
| **Map Clustering** | GeoJSON Source + SymbolLayer | Thay thế `PointAnnotation`. Render hàng nghìn điểm marker trên GPU mà không lag. |
| **Routing** | Expo Router v4 | File-based routing. |
| **State** | Zustand + TanStack Query | Quản lý cache và offline. |

### 1.2. CHIẾN LƯỢC MÔI TRƯỜNG & KẾT NỐI (NETWORK STRATEGY)
Đây là phần quan trọng nhất để làm việc trên Antigravity.

**Quy tắc "Tunnel First":**
*   **Vấn đề:** Antigravity chạy trên Cloud Container, không có IP LAN công khai.
*   **Giải pháp:** Khi khởi động server, **BẮT BUỘC** phải dùng lệnh:
    ```bash
    npx expo start --tunnel
    ```
    *(Lệnh này tạo một đường hầm HTTPs công khai, giúp điện thoại của bạn kết nối được vào Cloud IDE).*

**Quy tắc "Phân tách Môi trường":**
1.  **Web Preview (Trên Antigravity):**
    *   Chỉ dùng để kiểm tra logic JS, layout cơ bản (View, Text).
    *   **CẤM:** Không được render MapLibre, Camera, SQLite trên Web. Phải dùng Mock Component thay thế.
2.  **Development Client (Trên Điện thoại thật):**
    *   Dùng để test tính năng Native (Map, Camera).
    *   Kết nối qua đường hầm `--tunnel`.

### 1.3. QUY TRÌNH KHỞI TẠO DỰ ÁN (AI INSTRUCTION)
AI phải thực hiện chính xác trình tự lệnh sau:

**Bước 1: Khởi tạo & Cài đặt Tunnel**
```bash
# 1. Tạo project
npx create-expo-app@latest frontend --template blank-typescript
cd frontend

# 2. Cài đặt thư viện Tunnel (Quan trọng cho Antigravity)
npm install -g @expo/ngrok
```

**Bước 2: Cài đặt Stack Native (Prebuild)**
```bash
# Core
npx expo install expo-dev-client expo-router react-native-safe-area-context react-native-screens
npm install nativewind tailwindcss react-native-reanimated react-native-svg

# Hardware & Map
npx expo install @maplibre/maplibre-react-native expo-location expo-camera expo-file-system
```

**Bước 3: Cấu hình App Identity**
Sửa `app.json`:
*   `android.package`: "com.quocviet.superapp"
*   `ios.bundleIdentifier`: "com.quocviet.superapp"
*   `plugins`: Thêm config cho maplibre và camera.

### 1.4. CHIẾN LƯỢC BẢN ĐỒ HIỆU NĂNG CAO (MAP CLUSTERING)
Để tránh tình trạng giật lag khi hiển thị nhiều điểm, AI phải tuân thủ kiến trúc GeoJSON Source.

**Sai lầm (Cũ):**
```typescript
// KHÔNG ĐƯỢC LÀM THẾ NÀY (Gây lag)
locations.map(loc => <PointAnnotation coordinate={[loc.long, loc.lat]} />)
```

**Giải pháp (Mới - GPU Rendering):**
1.  **Chuyển đổi dữ liệu:** Convert mảng locations từ API thành chuẩn **GeoJSON** (FeatureCollection).
2.  **Render:**
    *   Sử dụng `<MapLibreGL.ShapeSource id="locations" shape={geoJsonData} />`.
    *   Sử dụng `<MapLibreGL.SymbolLayer />` để vẽ icon lên bản đồ.
    *   Kích hoạt `cluster={true}` trong ShapeSource để tự động gom nhóm khi zoom out.

### 1.5. CÁC QUY TẮC PHÒNG VỆ (DEFENSIVE CODING)

**1. Web Crash Guard (Antigravity Prevention):**
Tạo file `src/components/native-guard/MapGuard.tsx`.

**Logic:**
```typescript
import { Platform } from 'react-native';

// Nếu là Web, trả về ảnh tĩnh hoặc text cảnh báo
if (Platform.OS === 'web') return <div className="bg-gray-200">Map Native not available on Web</div>;

// Nếu là Mobile, trả về MapLibre thật
return <MapLibreGL.MapView ... />;
```

**2. Build Guard:**
AI phải luôn nhắc người dùng: *"Trên Antigravity, bạn không thể chạy lệnh `run:android`. Hãy chỉ chạy `npx expo start --tunnel` và kết nối bằng điện thoại đã cài Development Build."*
