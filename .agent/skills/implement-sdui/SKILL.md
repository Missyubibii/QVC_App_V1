---
description: Server-Driven UI Engine: Recursive Rendering & Dynamic Actions (Production-Grade)
---

# SKILL: Implement SDUI (Server-Driven UI)

## 🎯 Mục tiêu

Xây dựng Engine có khả năng biến JSON từ Server thành Giao diện Native mượt mà.

1. **Recursive Rendering**: Xử lý lồng nhau vô hạn (Card > Column > Row > Text)
2. **Dynamic Actions**: Xử lý điều hướng, gọi API, mở Web ngay từ JSON
3. **Fail-Safe**: Không crash khi Server trả về cấu trúc sai

## 📋 Prerequisites

- `implement-core` (để gọi API)
- `nativewind` (để style động)

---

## 🔧 PART 1: Strict Type Definitions

### File: `src/presentation/sdui/types.ts`

```typescript
/**
 * Định nghĩa tất cả các loại Block hỗ trợ
 */
export type BlockType =
    // Primitives (Cơ bản)
    | 'container' // View/Div
    | 'text'
    | 'image'
    | 'button'
    | 'input'
    | 'list'      // FlatList/FlashList
    | 'card'
    | 'spacer'
    // Business Widgets (Nghiệp vụ - Khớp Design Doc)
    | 'HEADER_BANNER'     // Banner chạy quảng cáo
    | 'GRID_MENU'         // Menu 4 ô chức năng
    | 'NEWS_LIST'         // List tin tức
    | 'STATS_WIDGET';     // Biểu đồ thống kê

export interface Action {
    type: 'navigate' | 'api' | 'link' | 'refresh';
    path?: string;       // URL hoặc Route
    method?: 'GET' | 'POST'; // Cho API
    payload?: any;       // Data gửi đi
    confirm_msg?: string; // "Bạn có chắc chắn muốn xóa?"
}

export interface SDUIBlock {
    id: string;
    type: BlockType;
    props?: Record<string, any>; // Style, text, src...
    action?: Action;             // Sự kiện onPress
    children?: SDUIBlock[];      // ✅ QUAN TRỌNG: Mảng con đệ quy
}

export interface ScreenResponse {
    screen_id: string;
    title: string;
    blocks: SDUIBlock[];
}
```

---

## 🔧 PART 2: The Recursive Renderer (Core Engine)

### File: `src/presentation/sdui/SDUIEngine.tsx`

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { SDUIBlock } from './types';
import { getComponent } from './registry'; // Sẽ tạo ở Part 3

interface Props {
    blocks: SDUIBlock[];
    depth?: number; // ✅ Guard: Chống Stack Overflow
}

const MAX_DEPTH = 10; // Giới hạn lồng nhau 10 cấp

export const SDUIEngine: React.FC<Props> = ({ blocks, depth = 0 }) => {
    // 1. Guard: Empty Check
    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return null;

    // 2. Guard: Max Depth
    if (depth > MAX_DEPTH) {
        console.warn('⚠️ SDUI Max Depth Exceeded. Stopping recursion.');
        return null;
    }

    return (
        <>
            {blocks.map((block) => {
                const Component = getComponent(block.type);

                // 3. Guard: Unknown Component
                if (!Component) {
                    if (__DEV__) {
                        return (
                            <View 
                                key={block.id}
                                className="bg-red-100 p-2 m-1 border border-red-300"
                            >
                                <Text className="text-red-600 text-xs">
                                    Unknown Block: {block.type}
                                </Text>
                            </View>
                        );
                    }
                    return null; // Production: Ẩn đi
                }

                return (
                    <Component 
                        key={block.id} 
                        {...block.props} 
                        action={block.action}
                    >
                        {/* ✅ RECURSION MAGIC: Render con của block này */}
                        {block.children && (
                            <SDUIEngine 
                                blocks={block.children} 
                                depth={depth + 1} 
                            />
                        )}
                    </Component>
                );
            })}
        </>
    );
};
```

### ⚠️ WHY MAX_DEPTH?

**Problem**: Backend lỡ tay trả về JSON vòng lặp (A chứa B, B chứa A)

**Solution**: Giới hạn 10 cấp lồng nhau → Dừng đệ quy → Không crash

**Impact**: App không bao giờ bị Stack Overflow

---

## 🔧 PART 3: Component Registry (The Mapping)

### File: `src/presentation/sdui/registry.tsx`

```typescript
import React from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { Action } from './types';
import apiClient from '@/core/api/client';

/**
 * HOC: Xử lý Action chung cho mọi Component
 * ✅ CRITICAL: Bọc logic Click để code Component sạch sẽ
 */
const withAction = (Component: React.ComponentType<any>) => {
    return ({ action, children, ...props }: { action?: Action; children?: React.ReactNode } & any) => {
        const handlePress = async () => {
            if (!action) return;

            // 1. Confirmation Guard
            if (action.confirm_msg) {
                const confirmed = await new Promise<boolean>((resolve) => 
                    Alert.alert('Xác nhận', action.confirm_msg, [
                        { text: 'Hủy', onPress: () => resolve(false), style: 'cancel' },
                        { text: 'OK', onPress: () => resolve(true) }
                    ])
                );
                if (!confirmed) return;
            }

            // 2. Execute Action
            switch (action.type) {
                case 'navigate':
                    if (action.path) router.push(action.path as any);
                    break;
                    
                case 'link':
                    if (action.path) Linking.openURL(action.path);
                    break;
                    
                case 'api':
                    try {
                        if (action.method === 'POST') {
                            await apiClient.post(action.path!, action.payload);
                        } else {
                            await apiClient.get(action.path!);
                        }
                        Alert.alert('Thành công', 'Đã xử lý yêu cầu.');
                    } catch (e) {
                        Alert.alert('Lỗi', 'Không thể thực hiện hành động.');
                    }
                    break;
                    
                case 'refresh':
                    // Trigger query invalidation hoặc reload
                    break;
            }
        };

        // Nếu có action, bọc trong TouchableOpacity
        if (action) {
            return (
                <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
                    <Component {...props}>{children}</Component>
                </TouchableOpacity>
            );
        }

        return <Component {...props}>{children}</Component>;
    };
};

// --- PRIMITIVE COMPONENTS ---

const Container = ({ children, style, className }: any) => (
    <View style={style} className={className}>
        {children}
    </View>
);

const SDUIText = ({ text, style, className, children }: any) => (
    <Text style={style} className={className}>
        {text || children}
    </Text>
);

const SDUIImage = ({ src, style, className }: any) => (
    <Image 
        source={{ uri: src }} 
        style={style} 
        className={className} 
        resizeMode="cover" 
    />
);

const SDUIButton = ({ text, style, className, children }: any) => (
    <View 
        style={style} 
        className={className || "bg-blue-500 px-4 py-2 rounded-lg"}
    >
        <Text className="text-white font-semibold text-center">
            {text || children}
        </Text>
    </View>
);

const Spacer = ({ height = 10 }: any) => <View style={{ height }} />;

// --- BUSINESS WIDGETS (PLACEHOLDERS) ---
// AI sẽ cần implement chi tiết các widget này trong các skill module tương ứng
// Tại đây ta map chúng để Engine không bị crash khi Backend trả về Business Block

const HeaderBannerWidget = (props: any) => (
    <Container className="w-full h-48 bg-gray-200 rounded-xl overflow-hidden mb-4">
        {/* Placeholder cho Banner */}
        <SDUIImage 
            src={props.data?.items?.[0]?.image_url || 'https://via.placeholder.com/400x200'} 
            className="w-full h-full" 
        />
        <View className="absolute bottom-2 left-2 bg-black/50 px-2 rounded">
            <SDUIText text="Banner Widget (Loading...)" className="text-white text-xs" />
        </View>
    </Container>
);

const GridMenuWidget = (props: any) => (
    <Container className="flex-row flex-wrap justify-between p-2">
        {/* Render tạm các items nếu có */}
        {(props.data?.items || []).map((item: any, index: number) => (
            <Container key={index} className="w-[23%] items-center mb-4">
                <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-1">
                    <SDUIText text={item.icon_name?.[0] || '?'} className="text-blue-600 font-bold" />
                </View>
                <SDUIText text={item.label || 'Menu'} className="text-[10px] text-center" />
            </Container>
        ))}
        {!(props.data?.items) && <SDUIText text="Grid Menu Placeholder" className="text-xs text-gray-400" />}
    </Container>
);

const NewsListWidget = (props: any) => (
    <Container className="p-2">
        <SDUIText text="📰 News List Widget (Placeholder)" className="text-sm text-gray-500" />
        {/* TODO: Implement NewsListWidget in content module */}
    </Container>
);

const StatsWidget = (props: any) => (
    <Container className="p-4 bg-white rounded-xl shadow">
        <SDUIText text="📊 Stats Widget (Placeholder)" className="text-sm text-gray-500" />
        {/* TODO: Implement StatsWidget in analytics module */}
    </Container>
);

// --- REGISTRY MAP ---

const ComponentMap: Record<string, React.ComponentType<any>> = {
    // Primitives
    container: withAction(Container),
    text: withAction(SDUIText),
    image: withAction(SDUIImage),
    button: withAction(SDUIButton),
    spacer: Spacer,
    card: withAction(Container), // Card cũng là Container với style khác
    
    // Business Widgets (Khớp Design Doc & API)
    HEADER_BANNER: withAction(HeaderBannerWidget),
    GRID_MENU: withAction(GridMenuWidget),
    NEWS_LIST: withAction(NewsListWidget),
    STATS_WIDGET: withAction(StatsWidget),
};

export const getComponent = (type: string) => ComponentMap[type];
```

### ⚠️ WHY HOC (Higher-Order Component)?

**Problem**: Mỗi component phải tự xử lý `onPress`, `navigation`, `API call`

**Solution**: `withAction` HOC bọc logic chung → Component chỉ lo render

**Impact**:

- Code sạch hơn (separation of concerns)
- Mọi component (kể cả Image, Text) đều có thể bấm được
- Dễ thêm action mới (chỉ sửa 1 chỗ)

---

## 🔧 PART 4: Usage Example (Home Screen)

### File: `app/(main)/home.tsx`

```typescript
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SDUIEngine } from '@/presentation/sdui/SDUIEngine';
import apiClient from '@/core/api/client';
import { ScreenWrapper } from '@/presentation/components/layout/ScreenWrapper';

export default function HomeScreen() {
    // Fetch cấu hình UI từ Server
    const { data, isLoading, error } = useQuery({
        queryKey: ['sdui', 'home'],
        queryFn: async () => {
            const res = await apiClient.get('/app/screens/HOME');
            return res; // Interceptor đã unwrap data
        },
    });

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (error) {
        // Fallback UI (có thể load từ file JSON local)
        return (
            <View className="flex-1 justify-center items-center p-4">
                <Text className="text-red-500">Lỗi tải giao diện</Text>
            </View>
        );
    }

    return (
        <ScreenWrapper scrollable>
            {/* Truyền Blocks vào Engine */}
            <SDUIEngine blocks={data?.blocks || []} />
        </ScreenWrapper>
    );
}
```

---

## 🔧 PART 5: Backend JSON Example

### Example: Home Screen JSON Response

```json
{
  "screen_id": "HOME",
  "title": "Trang chủ",
  "blocks": [
    {
      "id": "banner-1",
      "type": "image",
      "props": {
        "src": "https://example.com/banner.jpg",
        "className": "w-full h-48 rounded-xl"
      },
      "action": {
        "type": "link",
        "path": "https://quocviet.com/promotion"
      }
    },
    {
      "id": "card-1",
      "type": "card",
      "props": {
        "className": "bg-white p-4 m-2 rounded-xl shadow"
      },
      "children": [
        {
          "id": "title-1",
          "type": "text",
          "props": {
            "text": "Chấm công nhanh",
            "className": "text-lg font-bold mb-2"
          }
        },
        {
          "id": "btn-checkin",
          "type": "button",
          "props": {
            "text": "Chấm công ngay"
          },
          "action": {
            "type": "navigate",
            "path": "/(main)/checkin"
          }
        }
      ]
    }
  ]
}
```

---

## ⚠️ CRITICAL RULES

### 1. Recursive Rendering (MANDATORY)

- **PHẢI** render `children` bên trong Component
- **KHÔNG** render JSON trực tiếp vào JSX
- **PHẢI** gọi `<SDUIEngine blocks={block.children} />` để đệ quy

### 2. Max Depth Guard (MANDATORY)

- **PHẢI** giới hạn độ sâu (MAX_DEPTH = 10)
- **PHẢI** tăng `depth` mỗi lần đệ quy
- **KHÔNG** để Stack Overflow xảy ra

### 3. Fail-Safe Rendering (BEST PRACTICE)

- **PHẢI** hiển thị error UI trong `__DEV__` mode
- **NÊN** ẩn unknown component trong production
- **KHÔNG** crash app khi gặp block lạ

### 4. Action Handling (BEST PRACTICE)

- **PHẢI** dùng HOC pattern (`withAction`)
- **PHẢI** confirm trước khi thực hiện action nguy hiểm
- **NÊN** handle error khi gọi API

### 5. Business Widget Mapping (MANDATORY)

- **PHẢI** map tất cả Business Widgets từ Design Doc
- **PHẢI** có placeholder component cho widget chưa implement
- **KHÔNG** để Backend trả về block mà Registry không có
- **NÊN** thêm TODO comment cho widget cần implement sau

---

## ✅ Verification Tests

### Test 1: Recursive Rendering

```json
{
  "blocks": [
    {
      "id": "parent",
      "type": "container",
      "children": [
        {
          "id": "child",
          "type": "text",
          "props": { "text": "Nested Text" }
        }
      ]
    }
  ]
}
```

**Expected**: Text hiển thị bên trong Container

### Test 2: Max Depth Guard

```json
// Tạo JSON lồng 15 cấp
{
  "blocks": [
    {
      "id": "1",
      "type": "container",
      "children": [
        {
          "id": "2",
          "type": "container",
          "children": [
            // ... lồng đến cấp 15
          ]
        }
      ]
    }
  ]
}
```

**Expected**: Dừng ở cấp 10, log warning

### Test 3: Unknown Block

```json
{
  "blocks": [
    {
      "id": "unknown",
      "type": "video_player", // Chưa implement
      "props": {}
    }
  ]
}
```

**Expected**: Dev mode hiển thị error box, Production ẩn đi

### Test 4: Action Handling

```json
{
  "blocks": [
    {
      "id": "btn",
      "type": "button",
      "props": { "text": "Xóa tài khoản" },
      "action": {
        "type": "api",
        "method": "POST",
        "path": "/app/user/delete",
        "confirm_msg": "Bạn có chắc chắn muốn xóa?"
      }
    }
  ]
}
```

**Expected**: Hiển thị confirm dialog → Gọi API nếu OK

---

## 📚 References

- [React Reconciliation](https://react.dev/learn/preserving-and-resetting-state)
- [Higher-Order Components](https://react.dev/reference/react/Component#alternatives)
- [Expo Router Navigation](https://docs.expo.dev/router/navigating-pages/)

---

## 🎓 Learning Outcomes

1. ✅ Hiểu cách implement recursive rendering đúng cách
2. ✅ Biết cách dùng HOC pattern để tái sử dụng logic
3. ✅ Thành thạo Max Depth guard để tránh Stack Overflow
4. ✅ Xây dựng được SDUI engine chuẩn Super App

---

## 🚨 Common Pitfalls & Solutions

### Issue 1: "Children không hiển thị"

**Cause**: Render JSON array thay vì React nodes

**Solution**: Gọi `<SDUIEngine blocks={block.children} />` bên trong Component

```typescript
// ❌ WRONG
<Container>{block.children}</Container>

// ✅ CORRECT
<Container>
  {block.children && <SDUIEngine blocks={block.children} />}
</Container>
```

### Issue 2: "App bị treo khi render"

**Cause**: JSON có vòng lặp (A → B → A)

**Solution**: Thêm `depth` guard và MAX_DEPTH

### Issue 3: "Action không hoạt động"

**Cause**: Component không được wrap bởi `withAction`

**Solution**: Đảm bảo mọi component trong Registry đều dùng `withAction()`

---

## 💡 Pro Tips

1. **Cache JSON locally**: Lưu response vào AsyncStorage để offline mode
2. **Versioning**: Thêm `schema_version` vào JSON để migrate khi cần
3. **Analytics**: Log mỗi action để biết user tương tác như thế nào
4. **A/B Testing**: Server trả về JSON khác nhau cho từng user group
5. **Fallback UI**: Luôn có file JSON local để app không bị trắng khi server lỗi
