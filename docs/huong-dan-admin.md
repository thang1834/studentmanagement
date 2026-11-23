# Hướng dẫn cho admin

Tài liệu này dành cho người sở hữu bot: cài đặt từ đầu, vận hành hằng ngày, quản lý giáo viên, cập nhật mã và xử lý sự cố.

- [1. Vai trò admin](#1-vai-trò-admin)
- [2. Cài đặt lần đầu](#2-cài-đặt-lần-đầu)
- [3. Quản lý giáo viên](#3-quản-lý-giáo-viên)
- [4. Xem và tổng hợp dữ liệu](#4-xem-và-tổng-hợp-dữ-liệu)
- [5. Nhắc nhở tự động](#5-nhắc-nhở-tự-động)
- [6. Cập nhật mã nguồn](#6-cập-nhật-mã-nguồn)
- [7. Sao lưu và an toàn dữ liệu](#7-sao-lưu-và-an-toàn-dữ-liệu)
- [8. Xử lý sự cố](#8-xử-lý-sự-cố)
- [9. Tham chiếu Script Properties](#9-tham-chiếu-script-properties)

---

## 1. Vai trò admin

Admin là user ID Telegram nằm trong thuộc tính `ADMIN_IDS`; khi chưa đặt thuộc tính này, `TEST_CHAT_ID` là admin duy nhất. Admin có thể:

- Dùng toàn bộ lệnh thường như một giáo viên. Dữ liệu của admin là **file Sheet gốc** (file chứa script). Nếu bạn không trực tiếp dạy, cứ để trống các tab này hoặc dùng làm nơi thử nghiệm.
- Thêm, liệt kê, khóa giáo viên; vào dữ liệu của bất kỳ thầy nào để xem hoặc sửa giúp.
- Xem thống kê và công nợ gộp của mọi giáo viên.
- Nhận tổng hợp công nợ toàn trường mỗi sáng thứ Hai.

Giáo viên lấy user ID bằng cách nhắn bất kỳ gì cho bot: bot từ chối và trả lại ID của họ. Bạn cũng xem được ID của chính mình theo cách này trước khi được cấp quyền, hoặc qua bot **@userinfobot**.

---

## 2. Cài đặt lần đầu

Tổng thời gian khoảng 20 phút. Cần một tài khoản Google (sẽ là chủ của mọi Sheet) và tài khoản Telegram.

### 2.1 Tạo Google Sheet và đưa mã vào Apps Script

1. Tạo một Google Sheet mới, đặt tên tùy ý (ví dụ *Quản Lý Học Viên*).
2. Vào **Tiện ích mở rộng → Apps Script**. Đặt tên dự án (ví dụ *StudentBot*).
3. Đưa mã vào theo một trong hai cách:
   - **Dán tay:** tạo từng file `.gs` trùng tên với các file trong thư mục `appscript/` và dán nội dung; thay nội dung `appsscript.json` (bật *Hiển thị tệp kê khai "appsscript.json"* trong Cài đặt dự án).
   - **Dùng clasp** (khuyên dùng khi còn cập nhật mã về sau): xem mục [6](#6-cập-nhật-mã-nguồn).
4. Trong trình soạn, mở `create-sheets.gs`, chọn hàm `setupAllSheets` ở menu cạnh nút **Chạy** rồi bấm **Chạy**. Lần đầu Google hỏi cấp quyền: **Xem lại quyền → chọn tài khoản → Nâng cao → Đi tới StudentBot (không an toàn) → Cho phép**. Sau khi chạy, Sheet có 8 tab dữ liệu.

### 2.2 Tạo bot Telegram

1. Nhắn `/newbot` cho **@BotFather**, đặt tên hiển thị và username (phải kết thúc bằng `bot`).
2. Lưu lại **token** BotFather trả về. Không gửi token cho ai và không dán vào mã nguồn.
3. Gửi `/setcommands`, chọn bot, dán danh sách lệnh trong [README](../README.md#lệnh-của-bot) để Telegram hiện menu lệnh.

### 2.3 Đặt Script Properties

Trong Apps Script: **Cài đặt dự án → Thuộc tính tập lệnh → Thêm thuộc tính tập lệnh**:

| Thuộc tính | Giá trị |
|---|---|
| `TELEGRAM_BOT_TOKEN` | token từ BotFather |
| `TEST_CHAT_ID` | user ID Telegram của bạn |
| `ADMIN_NAME` | tên bạn (tùy chọn) |

Đặt tay như trên là cách chắc chắn nhất. Hàm `setupProperties` trong `Code.gs` chỉ hiện được hộp thoại khi gọi từ giao diện Sheet (menu tùy chỉnh), không chạy được từ trình soạn.

### 2.4 Triển khai ứng dụng web và nối webhook

1. **Triển khai → Tạo tệp triển khai mới → Loại: Ứng dụng web.** *Thực thi với tư cách:* **Tôi**. *Ai có quyền truy cập:* **Bất kỳ ai**. Bấm Triển khai và sao chép URL kết thúc bằng `/exec`.
2. Thêm thuộc tính `WEB_APP_URL` = URL vừa sao chép.
3. Mở `Code.gs`, chọn hàm `setWebhook`, bấm **Chạy**. Log phải có `"ok": true`.
4. Nhắn `/start` cho bot trên Telegram. Nếu bot trả lời là xong.

Mỗi lần sửa mã, phải tạo **phiên bản mới** của tệp triển khai thì webhook mới dùng mã mới (xem mục 6).

### 2.5 Bật nhắc nhở tự động

Mở `reminders.gs`, chọn `installReminderTriggers`, bấm **Chạy**. Google sẽ hỏi thêm quyền *"Cho phép ứng dụng chạy khi bạn vắng mặt"*: bấm **Xem lại quyền → Cho phép** như lần đầu. Log phải ghi `Đã cài 4 trigger nhắc nhở`. Kiểm tra lại ở trang **Kích hoạt** (biểu tượng đồng hồ ở cột trái).

---

## 3. Quản lý giáo viên

### Thêm giáo viên

```
/them_gv 123456789 Nguyễn Văn A
/them_gv 123456789 Nguyễn Văn A thaya@gmail.com
```

Bot sẽ:

1. Tạo Google Sheet *Quản Lý Học Viên - Nguyễn Văn A* trong Drive của bạn với đủ 8 tab (mất khoảng 40 giây).
2. Ghi một dòng vào tab **GIÁO VIÊN** của file gốc: User ID, Tên, Spreadsheet ID, URL, Trạng thái `Hoạt động`.
3. Chia sẻ Sheet cho email nếu có (quyền chỉnh sửa). Không có email thì bạn chia sẻ thủ công qua link bot gửi, hoặc không chia sẻ nếu thầy chỉ dùng qua Telegram.
4. Nhắn cho thầy *"Bạn đã được cấp quyền..."*. Tin này chỉ tới nếu thầy đã từng nhắn cho bot; nếu chưa, bot báo lại để bạn nhắn thầy gõ `/start`.

Lưu ý: tên thầy được ghi vào cột *Giáo viên phụ trách* khi thầy thêm học viên và bấm nút **Tôi**.

### Danh sách, khóa, mở lại

- `/ds_gv`: liệt kê mọi giáo viên, ✅ đang hoạt động, 🔒 đã khóa, kèm link Sheet.
- `/xoa_gv 123456789`: khóa. Thầy không dùng được bot và không nhận nhắc nhở nữa; Sheet của thầy giữ nguyên.
- Mở lại: mở file gốc, tab **GIÁO VIÊN**, đổi cột *Trạng thái* của thầy đó thành `Hoạt động`.
- Xóa hẳn: xóa dòng trong tab GIÁO VIÊN và chuyển Sheet của thầy vào thùng rác Drive.

### Nhiều admin

Đặt thuộc tính `ADMIN_IDS` = các user ID cách nhau bằng dấu phẩy, ví dụ `7000000001,7000000002`. Khi đã đặt `ADMIN_IDS` thì `TEST_CHAT_ID` không còn được coi là admin, nên nhớ đưa cả ID của bạn vào.

---

## 4. Xem và tổng hợp dữ liệu

### Vào dữ liệu của một thầy

```
/chon_gv 123456789
```

Từ lúc này, mọi lệnh bạn gõ (`/ds_hv`, `/them_hv`, `/thu_tien`, `/thong_ke`...) đọc và ghi trên Sheet của thầy đó, y như thầy tự thao tác. `/start` luôn hiện bạn đang ở dữ liệu của ai. Gõ `/chon_gv` không tham số để quay về file gốc. Lựa chọn này được lưu lại, không mất khi bạn tắt Telegram.

### Tổng hợp toàn trường

Khi đang ở file gốc:

- `/thong_ke`: với mỗi thầy hiện số học viên, số buổi hôm nay, công nợ, số xe; cuối cùng là tổng cộng toàn trường (học phí, đã thu, còn nợ, tỷ lệ thu).
- `/xem_no`: danh sách học viên còn nợ gom theo thầy và tổng công nợ.

Dữ liệu trong file gốc không được tính vào tổng hợp, và khi đã có giáo viên thì `/thong_ke` ở file gốc luôn là bản tổng hợp. Vì vậy hãy coi file gốc là nơi thử nghiệm, không nhập học viên thật vào đó.

### Mở Sheet trực tiếp

Bạn là chủ của mọi Sheet nên mở được tất cả từ Drive hoặc từ link trong `/ds_gv`. Sửa trực tiếp trong Sheet cũng được, bot đọc dữ liệu mới ngay lượt kế tiếp. Chỉ cần giữ nguyên tên tab và tiêu đề cột.

---

## 5. Nhắc nhở tự động

| Nhắc | Lịch chạy | Nội dung |
|---|---|---|
| Lịch học | mỗi 15 phút | Buổi học hôm nay trạng thái *Chưa học*, bắt đầu trong 30 phút tới |
| Công nợ | thứ Hai 9:00 | Học viên còn nợ của từng thầy; admin nhận thêm bản toàn trường |
| Bảo dưỡng xe | 8:00 hằng ngày | Xe còn dưới 500 km đến mốc bảo dưỡng |
| Đăng kiểm | ngày 1 hằng tháng 8:00 | Xe quá hạn hoặc còn dưới 30 ngày |

Mỗi tin nhắc chỉ gửi tới thầy sở hữu dữ liệu và được ghi vào tab **NHẮC NHỞ** của Sheet thầy đó, nhờ vậy không gửi trùng trong ngày. Giờ chạy theo múi giờ Việt Nam, Google có thể lệch trong khoảng một giờ.

Muốn gửi thử ngay: chạy tay `remindDebtSummary` trong trình soạn. Muốn tắt: chạy `removeReminderTriggers`.

---

## 6. Cập nhật mã nguồn

### Cách 1: dán tay

Sửa file trong trình soạn Apps Script, lưu, rồi **Triển khai → Quản lý tệp triển khai → ✏️ → Phiên bản: Phiên bản mới → Triển khai**. Webhook vẫn giữ URL cũ.

### Cách 2: clasp (khuyên dùng)

Cài một lần:

```powershell
npm install -g @google/clasp
clasp login
```

Trong thư mục `appscript/`, tạo `.clasp.json` từ `.clasp.json.example` và điền Script ID (lấy ở **Cài đặt dự án** của Apps Script). Quy trình mỗi lần cập nhật:

```powershell
clasp push -f
```

```powershell
clasp create-version "Mô tả thay đổi"
```

```powershell
clasp redeploy <deploymentId> -V <số version vừa tạo>
```

`deploymentId` xem bằng `clasp list-deployments` (chọn tệp triển khai có URL đang dùng làm webhook). Muốn quay lại bản cũ, `redeploy` với số version cũ.

Sau khi push, kiểm tra trang **Tổng quan** của dự án, mục *Phạm vi OAuth*: nếu xuất hiện phạm vi mới, bạn phải chạy tay một hàm trong trình soạn và cấp quyền lại, nếu không webhook sẽ báo lỗi ủy quyền.

### Kiểm tra trước khi triển khai

- `node tests/test_teachers.js appscript` và `node tests/test_edit_student.js appscript` phải báo đủ nhóm test qua.
- Chạy `dryRunWebhook` (file `test-webhook.gs`) trong trình soạn và đọc Execution log: cuối log phải là `KẾT THÚC: ... 0 lỗi`.

---

## 7. Sao lưu và an toàn dữ liệu

- Google Sheets có **Lịch sử phiên bản** (Tệp → Lịch sử phiên bản) cho từng file; dùng khi lỡ xóa nhầm.
- Định kỳ **Tệp → Tạo bản sao** cho file gốc và các Sheet giáo viên, hoặc tải về Excel.
- Khóa giáo viên không mất dữ liệu; xóa học viên qua bot xóa hẳn dòng trong Sheet (đã có bước xác nhận).
- Token bot bị lộ: nhắn `/revoke` cho BotFather để lấy token mới, cập nhật `TELEGRAM_BOT_TOKEN`, chạy lại `setWebhook`.

---

## 8. Xử lý sự cố

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Bot không trả lời gì | Webhook chưa đặt hoặc URL cũ | Chạy `setWebhook`; kiểm tra `WEB_APP_URL` đúng URL `/exec` của tệp triển khai đang dùng |
| Bot trả lời *"Bạn không có quyền sử dụng bot này"* kèm ID | ID chưa có trong `ADMIN_IDS`/`TEST_CHAT_ID` hoặc tab GIÁO VIÊN | Thêm bằng `/them_gv`, hoặc sửa thuộc tính |
| Sửa mã rồi nhưng bot vẫn chạy như cũ | Chưa tạo phiên bản mới cho tệp triển khai | Làm theo mục 6 |
| Chạy hàm trong trình soạn hiện *Yêu cầu ủy quyền* | Thiếu phạm vi OAuth mới, hoặc vừa push xong Google đang tính lại | Bấm **Xem lại quyền → Cho phép**; nếu vừa push, chờ 1–2 phút rồi chạy lại |
| Nhắc nhở không đến | Trigger chưa cài, hoặc thầy bị khóa | Kiểm tra trang **Kích hoạt**, chạy `installReminderTriggers` |
| `/them_gv` báo lỗi tạo Sheet | Hết hạn mức Drive, hoặc chưa cấp quyền spreadsheets | Xem Execution log; chạy tay `setupAllSheets` để Google hỏi lại quyền |
| Tin nhắn hiện ký tự lạ hoặc mất chữ đậm | Tên hoặc ghi chú chứa ký tự `*`, `_`, `` ` `` | Bot đã tự gửi lại dạng văn bản thường; tránh các ký tự đó trong tên |

Log của lượt chạy tay xem ngay trong **Nhật ký thực thi** của trình soạn. Log của các lượt webhook (ẩn danh) không hiện ở trang **Thực thi**; khi cần xem bot trả lời gì, chạy `dryRunWebhook`.

---

## 9. Tham chiếu Script Properties

| Thuộc tính | Bắt buộc | Mô tả |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ✅ | Token bot từ BotFather |
| `WEB_APP_URL` | ✅ | URL `/exec` của ứng dụng web, dùng bởi `setWebhook` |
| `TEST_CHAT_ID` | ✅ | User ID của bạn; admin mặc định; nơi `testSendMessage` và `dryRunWebhook` dùng để thử |
| `ADMIN_IDS` | – | Các admin, cách nhau bằng dấu phẩy; khi đặt thì thay thế vai trò admin của `TEST_CHAT_ID` |
| `ADMIN_NAME` | – | Tên admin, dùng cho nút "Tôi" khi nhập giáo viên phụ trách |
| `VIEW_AS_<adminId>` | tự động | Thầy mà admin đang xem bằng `/chon_gv`; bot tự tạo và xóa |
