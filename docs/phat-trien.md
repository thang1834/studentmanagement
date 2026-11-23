# Tài liệu phát triển

Dành cho người sửa hoặc mở rộng mã nguồn. Đọc cùng [README](../README.md) và [Hướng dẫn cho admin](huong-dan-admin.md) (mục cập nhật mã).

- [1. Luồng xử lý một update](#1-luồng-xử-lý-một-update)
- [2. Ngữ cảnh dữ liệu và nhiều giáo viên](#2-ngữ-cảnh-dữ-liệu-và-nhiều-giáo-viên)
- [3. Quy ước mã](#3-quy-ước-mã)
- [4. Thêm một lệnh mới](#4-thêm-một-lệnh-mới)
- [5. Thêm một luồng hội thoại](#5-thêm-một-luồng-hội-thoại)
- [6. Kiểm thử](#6-kiểm-thử)
- [7. Quy trình phát hành với clasp](#7-quy-trình-phát-hành-với-clasp)
- [8. Những điểm dễ vấp](#8-những-điểm-dễ-vấp)

---

## 1. Luồng xử lý một update

```
Telegram ──POST──▶ doPost(e)                       Code.gs
                    ├─ parse JSON, chống trùng update_id (CacheService 1 giờ)
                    ├─ userId = message.from.id | callback_query.from.id
                    ├─ isAuthorized(userId)?  ──không──▶ trả lời ⛔ kèm ID, return
                    ├─ setCurrentUser(userId)         teachers.gs: chọn Sheet (getDb)
                    ├─ message        ──▶ handleMessage(message)
                    │     ├─ text bắt đầu bằng "/" ──▶ switch(command)   lệnh
                    │     └─ ngược lại ──▶ handleConversationState()     conversation.gs
                    └─ callback_query ──▶ handleCallbackQuery()          callbacks.gs
                                             switch(action) theo callback_data "action:param1:param2"
```

- `doPost` luôn trả `HtmlService.createHtmlOutput('OK')` kể cả khi lỗi, để Telegram không gửi lại update.
- Trạng thái hội thoại: `getConversationState(userId)` / `setConversationState(userId, state)` / `clearConversationState(userId)` trong `conversation.gs`, lưu `CacheService.getUserCache()` 30 phút. `state = { type, step, data, chatId }`.
- Lệnh luôn thắng trạng thái: gõ `/lenh` giữa chừng sẽ chạy lệnh, trạng thái cũ vẫn còn cho tới khi `/huy` hoặc hết hạn.

## 2. Ngữ cảnh dữ liệu và nhiều giáo viên

`teachers.gs` giữ `TENANT.current = { userId, isAdmin, teacher, name, spreadsheet }`.

| Hàm | Vai trò |
|---|---|
| `getDb()` | Spreadsheet của lượt hiện tại. Không có ngữ cảnh (chạy tay trong trình soạn) → file gốc. **Mọi truy cập sheet phải đi qua đây.** |
| `setCurrentUser(userId)` | Admin → file gốc hoặc thầy đang chọn (`VIEW_AS_<id>`); giáo viên → `openById(spreadsheetId)` |
| `withTeacher(teacher, fn)` | Chạy `fn` trong ngữ cảnh một thầy rồi khôi phục; dùng cho nhắc nhở và tổng hợp |
| `forEachActiveTeacher(fn)` | Lặp mọi thầy *Hoạt động*, cộng dồn kết quả, lỗi một thầy không chặn thầy khác |
| `isAuthorized(userId)` | admin, hoặc thầy *Hoạt động* trong tab GIÁO VIÊN |
| `isAdminAtRoot()` | Admin đang ở file gốc → `/thong_ke`, `/xem_no` chuyển sang bản tổng hợp |

Sáu hàm lấy sheet (`getStudentSheet`, `getScheduleSheet`, `getPaymentSheet`, `getVehicleSheet`, `getExamSheet`, `getReminderSheet`) đều là `getDb().getSheetByName(...)`. Tab **GIÁO VIÊN** là ngoại lệ duy nhất dùng `SpreadsheetApp.getActiveSpreadsheet()` vì chỉ tồn tại ở file gốc.

Sheet riêng của thầy do `SpreadsheetApp.create()` + `setupAllSheets(ss)` tạo; vì vậy mọi thay đổi cấu trúc tab phải đi vào `create-sheets.gs` để Sheet mới và file gốc giống nhau. Với Sheet đã tồn tại, viết hàm migrate như `migrateExamSheet` và chạy cho từng Sheet (có thể bọc bằng `forEachActiveTeacher`).

## 3. Quy ước mã

- Một file cho một nghiệp vụ: `x.gs` (đọc/ghi sheet) + `x-conversation.gs` (hội thoại) + `view-x.gs` (hiển thị).
- Đọc sheet bằng `getRange(2, 1, lastRow - 1, n).getValues()` rồi map theo vị trí cột; `getAllStudents` gắn `_row` để cập nhật/xóa đúng dòng. Bỏ qua dòng có cột ID trống.
- Ngày: lưu `dd/MM/yyyy` (chuỗi) hoặc Date; hiển thị qua `formatDate` (Date lúc 00:00 chỉ hiện ngày) và `formatDateOnly`; parse qua `parseDate` trong `utils.gs`.
- Tiền: `parseMoney` (hiểu `tr`, `triệu`, dấu chấm), `formatMoney` → `12.000.000₫`.
- Tin nhắn dùng Markdown legacy của Telegram: dấu `_` trong lệnh phải viết `\\_` trong template; text tự do (tên, URL, email) bọc bằng `mdEscape`. `sendMessage` tự gửi lại dạng thường nếu Telegram báo lỗi parse, và tự cắt tin dài hơn 4096 ký tự.
- `callback_data` tối đa 64 byte, dạng `action:param:param`; giá trị chọn không được chứa `:`.
- Hàm chạy tay trong trình soạn không được gọi `SpreadsheetApp.getUi()` trực tiếp; dùng `showAlert` (có try/catch).
- Không ghi token hay ID vào mã; đọc từ `PropertiesService.getScriptProperties()`.

## 4. Thêm một lệnh mới

1. `Code.gs` → `handleMessage` → thêm `case '/ten_lenh':` gọi handler. Lệnh được `toLowerCase()` trước khi so sánh; `args` là phần sau dấu cách.
2. Viết handler trong file nghiệp vụ tương ứng; truy cập sheet qua `getDb()`.
3. Thêm dòng vào `sendHelpMessage` (và mục Admin nếu là lệnh admin, kiểm tra `isAdmin(message.from.id)` trong `handleMessage`).
4. Thêm vào danh sách BotFather trong README và bảng lệnh.
5. Thêm một bước vào `dryRunWebhook` nếu lệnh chỉ đọc, hoặc có nút hủy.

## 5. Thêm một luồng hội thoại

1. Hàm `startXConversation(chatId, userId)` đặt `state = { type: 'x', step: 'buoc_1', data: {} }` và hỏi câu đầu.
2. `conversation.gs` → `handleConversationState` → `case 'x': handleXStep(chatId, userId, state, text)`.
3. `handleXStep` `switch(state.step)`: kiểm tra `text`, lưu vào `state.data`, đổi `step`, `setConversationState`, hỏi câu kế. Sai thì nhắc nhập lại và giữ nguyên step.
4. Bước chọn bằng nút: gửi `sendMessageWithKeyboard` với `callback_data` `x_field:value`, xử lý trong `callbacks.gs`.
5. Bước cuối: ghi sheet, `clearConversationState`, gửi tóm tắt. Luôn có nút ❌ Hủy (`x_cancel`) và tôn trọng `/huy`.

Mẫu gọn nhất để tham khảo: `edit-student.gs` (bảng khai báo trường + validate + choices).

## 6. Kiểm thử

**Node, không cần Google** (`tests/`): nạp file `.gs` thật bằng `vm.runInThisContext` với stub `PropertiesService`, `SpreadsheetApp`, `Logger` và các hàm dự án mà file đó gọi.

```powershell
node tests/test_teachers.js appscript
```

```powershell
node tests/test_edit_student.js appscript
```

**Cú pháp:** sao chép từng `.gs` sang `.js` rồi `node --check` (Apps Script V8 chấp nhận gần như toàn bộ cú pháp ES2019).

**Chạy khô trên dữ liệu thật:** `dryRunWebhook` trong `test-webhook.gs` (chạy từ trình soạn). Hàm này:

- `setCurrentUser(TEST_CHAT_ID)` để có ngữ cảnh như webhook,
- thay tạm `sendMessage`, `editMessage`, `answerCallbackQuery` bằng hàm ghi lại nội dung,
- đẩy 29 bước lệnh/nút qua `handleMessage` / `handleCallbackQuery` với dữ liệu thật,
- in từng tin bot định gửi và nút kèm theo ra Execution log, cuối cùng `KẾT THÚC: N bước, M lỗi`,
- không gửi Telegram, không ghi sheet (chỉ dùng lệnh đọc, bước nhập sai và nút hủy), dọn trạng thái hội thoại ở `finally`.

Thêm bước mới vào mảng `steps` khi thêm lệnh chỉ đọc. Không đưa lệnh ghi vào đây.

**Thử trên webhook thật:** gửi update giả tới URL `/exec` bằng `curl --data-binary @file.json` (file UTF-8). Dùng `from.id` là ID của bạn và `chat.id` là chat của bạn để thấy kết quả trong Telegram. Chat ID `0` dùng cho smoke test không gửi tin cho ai. **Không** đặt tiếng Việt trực tiếp trong tham số dòng lệnh trên Windows: dấu sẽ mất.

## 7. Quy trình phát hành với clasp

```powershell
cd appscript; clasp push -f
```

```powershell
clasp create-version "Mô tả"
```

```powershell
clasp redeploy <deploymentId> -V <version>
```

- `clasp login` một lần bằng tài khoản chủ Sheet. `.clasp.json` tạo từ `.clasp.json.example`, không commit.
- `appsscript.json` phải giữ khối `webapp` (`executeAs: USER_DEPLOYING`, `access: ANYONE_ANONYMOUS`), nếu không tệp triển khai hỏng.
- Dự án container-bound nên `clasp list-scripts` không thấy; Script ID lấy ở Cài đặt dự án.
- `clasp logs` và `clasp run` không dùng được với dự án GCP mặc định; chạy hàm và xem log trong trình soạn.
- Sau khi push, phạm vi OAuth được tính lại; lần chạy tay đầu tiên có thể hiện "Yêu cầu ủy quyền" dù không có phạm vi mới: Hủy, chờ 1–2 phút, chạy lại. Nếu phạm vi thật sự mới (xem trang Tổng quan), phải cấp quyền trước khi redeploy, nếu không webhook lỗi ủy quyền.

## 8. Những điểm dễ vấp

- **Thiếu `getDb()`:** gọi `SpreadsheetApp.getActiveSpreadsheet()` trong mã nghiệp vụ sẽ ghi nhầm vào file gốc khi giáo viên dùng. Grep trước khi phát hành: chỉ `teachers.gs` (tab GIÁO VIÊN), `create-sheets.gs` (chạy tay) và `Code.gs/getConfig` được phép.
- **Markdown:** tên học viên có `_` làm hỏng định dạng cả tin; `sendMessage` đã có fallback nhưng hãy `mdEscape` text người dùng nhập.
- **`toLowerCase()` ở lệnh:** `/xem_HV001` tới handler dưới dạng `hv001`; `getStudentById` so sánh không phân biệt hoa thường.
- **Trigger và ngữ cảnh:** hàm chạy bởi trigger không có `TENANT.current`; luôn bọc bằng `forEachActiveTeacher` / `withTeacher`.
- **Ô ngày trong Sheet** có thể là Date hoặc chuỗi tùy cách nhập; luôn đi qua `formatDateOnly` trước khi so sánh.
- **Chạy hàm trong trình soạn:** kiểm tra kỹ tên hàm ở menu cạnh nút Chạy trước khi bấm; chạy nhầm `setupAllSheets` trên file gốc không mất dữ liệu nhưng ghi đè tiêu đề, dropdown và công thức.
