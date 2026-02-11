# SYSTEM RULES: QUOC VIET SUPER APP

File này chứa các quy tắc **BẤT KHẢ XÂM PHẠM**. Mọi hành động của Agent phải được đối chiếu với các quy tắc này trước khi thực thi.

---

## 1. NGUYÊN TẮC TƯ DUY (CORE BEHAVIOR)

### 1.1. Think First (Suy nghĩ trước khi làm)

* **BẮT BUỘC:** Trước khi viết code hoặc chạy lệnh, phải in ra block `<thinking>...</thinking>` mô tả kế hoạch 3 bước:
    1. **Analyze:** Hiểu yêu cầu là gì? File nào bị ảnh hưởng?
    2. **Plan:** Các bước thực hiện cụ thể.
    3. **Risk:** Có rủi ro gì không (mất dữ liệu, crash app)?
* **CẤM:** Trả về code ngay lập tức mà không có giải thích.

### 1.2. No Assumption (Không giả định)

* Nếu yêu cầu thiếu thông tin (ví dụ: "Tạo màn hình Home" nhưng không nói rõ có những nút nào), **DỪNG LẠI** và đặt câu hỏi làm rõ.
* **CẤM:** Tự ý bịa ra các trường dữ liệu (fields) không có trong file `Ho_so_thiet_ke_he_thong.md`.

### 1.3. Citation (Trích dẫn nguồn)

* Mọi logic nghiệp vụ phải dẫn chứng từ tài liệu.
  * *Ví dụ:* "Theo [Ho_so_thiet_ke_he_thong.md > Chương 3.1], màn hình này cần nút Back."
  * *Ví dụ:* "Sử dụng API `/app/login` theo [Danh_Sach_API.md]."

---

## 2. AN TOÀN & ĐẠO ĐỨC (SECURITY PRIME DIRECTIVE)

### 2.1. Data Integrity (Toàn vẹn dữ liệu)

* **READ-ONLY POLICY:** Tuyệt đối **KHÔNG XÓA** file gốc hoặc dữ liệu đầu vào của người dùng trong bất kỳ tình huống nào.
* **BACKUP:** Trước khi sửa đè một file quan trọng (`App.tsx`, `*.config.js`), phải nhắc người dùng backup hoặc tự tạo bản sao (nếu có quyền).

### 2.2. Data Privacy (Bảo mật)

* **ISOLATION:** Thông tin trong Workspace này là tuyệt mật. Không gửi thông tin ra ngoài (trừ các API Endpoint đã được định nghĩa trong `Danh_Sach_API.md`).
* **NO HARDCODED SECRETS:** Tuyệt đối không viết cứng Token, Password, API Key vào code. Phải dùng `process.env` hoặc `SecureStorage`.

---

## 3. QUY ĐỊNH KỸ THUẬT (PROJECT SPECIFIC)

### 3.1. Tech Stack Constraints (Tuân thủ Skill Setup)

* **Framework:** Expo SDK 54 (Managed Workflow)
* **Command:** Luôn dùng `npx expo install` thay vì `npm install` cho native libs
* **Styling:** NativeWind v4 (`className="..."`). Không dùng `StyleSheet.create` trừ khi bắt buộc
* **State:** TanStack Query (Server State) + Zustand (Client State)
* **Storage:** `SecureStorage` (cho Token/User) + `AsyncStorage` (cho Queue/Cache)

### 3.2. Coding Standards

* **Format Số:** Sử dụng dấu chấm (.) phân cách hàng nghìn (VN Standard).
  * *Ví dụ:* `1.000.000 đ` (Đúng), `1,000,000 đ` (Sai)
* **Format Ngày:** `DD/MM/YYYY` (hoặc `HH:mm DD/MM/YYYY`)
* **Naming:**
  * Component: `PascalCase` (e.g., `HomeScreen.tsx`)
  * Function/Var: `camelCase` (e.g., `handleLogin`)
  * Constant: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY`)

### 3.3. Architecture Rules

* **Separation of Concerns:** UI (`app/`) chỉ gọi Hook. Hook gọi Service. Service gọi API
* **Antigravity Guard:** Luôn bọc Native Module trong `if (Platform.OS !== 'web')` hoặc dùng Mock Data
* **Fail-Fast:** Mọi API Response phải được parse qua `Zod Schema`
* **Background Processes:** Các hook chạy ngầm (AutoSync, NetworkListener) **BẮT BUỘC** phải được gắn vào `RootLayout` hoặc `AppProcess`. **CẤM** gắn vào màn hình con (Screen) để tránh bị unmount khi điều hướng

---

## 4. GIAO TIẾP (COMMUNICATION)

* **Ngôn ngữ mặc định:** Tiếng Việt
* **Phong cách:** Chuyên nghiệp, ngắn gọn, súc tích (như Lead Developer nói chuyện với Junior)
* **Khi gặp lỗi:** Không xin lỗi chung chung. Phải chỉ ra nguyên nhân (Root Cause) và giải pháp (Fix)

---

## 5. HƯỚNG DẪN SỬ DỤNG SKILL

Khi người dùng yêu cầu thực hiện tính năng, hãy tham chiếu thư mục `.agent/skills/`:

1. **Setup/Config** → xem `setup-foundation`
2. **Login/User** → xem `implement-auth`
3. **Database/API** → xem `implement-core`
4. **UI/Layout** → xem `implement-sdui`
5. **Check-in/GPS** → xem `implement-hrm`
6. **Deploy** → xem `deployment-check`

**KHÔNG ĐƯỢC** tự ý sáng tạo cách code nếu đã có hướng dẫn trong `SKILL.md`.

---

## 6. CRITICAL CONSTRAINTS

### 6.1. Offline-First

* **BẮT BUỘC:** Mọi tính năng quan trọng (check-in, submit form) phải có offline queue
* **CẤM:** Để user mất dữ liệu khi offline

### 6.2. Platform Compatibility

* **BẮT BUỘC:** Code phải chạy được trên cả iOS, Android, và Web (Antigravity)
* **CẤM:** Dùng native module mà không có fallback cho web

### 6.3. Performance

* **BẮT BUỘC:** Optimize JSON.parse (check string trước khi parse)
* **BẮT BUỘC:** Timeout cho GPS/Camera (max 5s)
* **CẤM:** Infinite loop trong recursive rendering (max depth = 10)

---

## 7. DEPLOYMENT RULES

### 7.1. Pre-Deploy Checklist

* **BẮT BUỘC:** Chạy `deployment-check` skill trước khi build
* **BẮT BUỘC:** Verify `.env` có HTTPS (trừ localhost)
* **BẮT BUỘC:** Check Privacy Manifest (iOS) và Permissions (Android)

### 7.2. Version Control

* **BẮT BUỘC:** Bump version trong `app.json` trước mỗi build
* **BẮT BUỘC:** Tag git commit với version number
* **CẤM:** Deploy code chưa test

---

## 8. ERROR HANDLING

### 8.1. User-Facing Errors

* **BẮT BUỘC:** Hiển thị error message bằng tiếng Việt
* **BẮT BUỘC:** Cung cấp action rõ ràng (e.g., "Vui lòng bật GPS")
* **CẤM:** Hiển thị stack trace cho user

### 8.2. Developer Errors

* **BẮT BUỘC:** Log chi tiết vào console trong `__DEV__` mode
* **BẮT BUỘC:** Sử dụng `console.error` cho lỗi nghiêm trọng
* **NÊN:** Gửi error logs lên monitoring service (production)

---

## 9. TESTING REQUIREMENTS

### 9.1. Manual Testing

* **BẮT BUỘC:** Test trên cả 3 platforms (iOS, Android, Web)
* **BẮT BUỘC:** Test offline mode cho tính năng quan trọng
* **BẮT BUỘC:** Test với GPS/Camera permission denied

### 9.2. Edge Cases

* **BẮT BUỘC:** Test với network timeout
* **BẮT BUỘC:** Test với invalid API response
* **BẮT BUỘC:** Test với empty/null data

---

## 10. DOCUMENTATION

### 10.1. Code Comments

* **BẮT BUỘC:** Comment cho logic phức tạp (e.g., recursive rendering)
* **BẮT BUỘC:** Comment cho workaround/hack
* **NÊN:** Sử dụng JSDoc cho public functions

### 10.2. Skill Updates

* **BẮT BUỘC:** Cập nhật `SKILL.md` khi thay đổi architecture
* **BẮT BUỘC:** Thêm example code cho pattern mới
* **NÊN:** Thêm "Common Pitfalls" section

---

## 💡 TẠI SAO BỘ RULES NÀY HIỆU QUẢ?

### Chống "Ảo giác" (Hallucination)

* **Quy tắc 1.3 Citation** buộc AI phải đọc tài liệu. Nếu không tìm thấy dẫn chứng, không dám bịa code
* **Quy tắc 5. Skill Reference** ép AI đi theo đường ray đã vẽ (các file SKILL.md), tránh dùng thư viện lạ

### Chống "Phá hoại" (Destruction)

* **Quy tắc 2.1 Read-Only** bảo vệ source code cũ
* **Quy tắc 2.2 Privacy** ngăn chặn rò rỉ key

### Chuẩn hóa văn hóa Code (Standardization)

* Quy định rõ Format số/ngày và Naming Convention
* Code nhất quán dù làm việc với AI hôm nay hay 1 tháng sau

---

**Hiến pháp này là bất khả xâm phạm. Mọi vi phạm đều phải được báo cáo và sửa ngay lập tức.**
