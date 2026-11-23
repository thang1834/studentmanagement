# 📱 Telegram Bot - Quản Lý Học Viên

> Bot Telegram hoàn chỉnh chạy trên Google Sheets + Apps Script (100% miễn phí)

## 🎯 Tổng quan

Bot quản lý học viên cho trung tâm dạy lái xe, sử dụng:
- **Database**: Google Sheets (miễn phí, 5 triệu cells)
- **Backend**: Google Apps Script (serverless, miễn phí)
- **Frontend**: Telegram Bot (miễn phí)

**Chi phí vận hành**: 0đ/tháng 💯

---

## ✨ Tính năng

### 👥 Quản lý học viên
- ✅ Thêm học viên mới (conversation flow 13 bước)
- ✅ Xem danh sách học viên (pagination)
- ✅ Tìm kiếm theo tên/SĐT/mã
- ✅ Xem chi tiết + action buttons
- ✅ Cập nhật thông tin
- ✅ Xóa học viên (có confirmation)
- ✅ Theo dõi công nợ

### 📅 Quản lý lịch học
- ✅ Đặt lịch học mới
- ✅ Xem lịch hôm nay
- ✅ Xem lịch theo học viên
- ✅ Phân loại: Lý thuyết / Thực hành / Ôn thi
- ✅ Gán xe tập cho buổi học

### 💰 Quản lý thanh toán
- ✅ Thu tiền học phí
- ✅ Lịch sử thanh toán
- ✅ Theo dõi công nợ
- ✅ Phương thức: Tiền mặt / Chuyển khoản
- ✅ Tự động cập nhật trạng thái

### 🚗 Quản lý xe tập
- ✅ Danh sách xe
- ✅ Thêm xe mới
- ✅ Trạng thái xe (Hoạt động / Bảo trì)
- ✅ Lịch bảo trì & kiểm định

### 📝 Quản lý kỳ thi
- ✅ Đăng ký thi
- ✅ Lịch thi sắp tới
- ✅ Loại thi: Lý thuyết / Thực hành / Cả hai
- ✅ Theo dõi kết quả

### 📊 Báo cáo & thống kê
- ✅ Thống kê tổng quan
- ✅ Báo cáo theo loại bằng
- ✅ Báo cáo theo giáo viên
- ✅ Top công nợ
- ✅ Doanh thu & tỷ lệ thu

---

## 📂 Cấu trúc project

```
appscript/
├── Code.gs              # Main entry point, webhook handler
├── student.gs           # Quản lý học viên
├── schedule.gs          # Quản lý lịch học
├── payment.gs           # Quản lý thanh toán
├── vehicle.gs           # Quản lý xe
├── exam.gs              # Quản lý kỳ thi
├── reports.gs           # Báo cáo chi tiết (/bao_cao)
├── statistics.gs        # Thống kê tổng quan (/thong_ke)
├── conversation.gs      # Multi-step conversations
├── callbacks.gs         # Callback handlers
├── telegram.gs          # Telegram API wrapper
├── utils.gs             # Helper functions
├── reminders.gs         # Nhắc nhở tự động (trigger theo giờ)
└── appsscript.json      # Project config

scripts/
└── create-sheets.gs     # Setup 8 sheets tự động
```

---

## 🚀 Hướng dẫn triển khai

Xem chi tiết: **[APPSCRIPT_SETUP.md](../APPSCRIPT_SETUP.md)**

### Tóm tắt 5 bước:

1. **Tạo Google Sheet** + chạy `create-sheets.gs` → 8 sheets tự động
2. **Tạo Telegram Bot** với @BotFather → lấy token
3. **Setup Apps Script** → upload 11 files .gs
4. **Deploy Web App** → lấy URL
5. **Setup Webhook** → chạy `setWebhook()`

**Thời gian**: ~30 phút
**Chi phí**: 0đ

### 🔔 Bật nhắc nhở tự động (chạy 1 lần sau khi deploy)

Trong Apps Script editor, mở file `reminders.gs`, chọn hàm `installReminderTriggers` và nhấn **Run** (authorize nếu được hỏi). Hàm tạo 4 trigger theo giờ:

| Nhắc | Hàm | Lịch chạy |
|------|-----|-----------|
| Buổi học sắp tới (trước 30 phút) | `remindUpcomingLessons` | mỗi 15 phút |
| Tổng kết công nợ | `remindDebtSummary` | thứ Hai, 9:00 |
| Bảo dưỡng xe (còn < 500 km) | `remindVehicleMaintenance` | mỗi ngày, 8:00 |
| Đăng kiểm xe (quá hạn hoặc còn < 30 ngày) | `remindVehicleInspection` | ngày 1 hằng tháng, 8:00 |

- Tin nhắc chạy cho từng giáo viên đang hoạt động: đọc Sheet riêng của thầy, gửi cho thầy đó và ghi vào sheet **NHẮC NHỞ** của thầy (Trạng thái "Đã gửi"). Thứ Hai admin nhận thêm tổng hợp công nợ toàn trường.
- Giờ chạy thực tế của trigger Google lệch trong khoảng 1 giờ (ví dụ 8:00–9:00).
- Chạy lại `installReminderTriggers()` không tạo trùng (hàm tự xóa trigger cũ). Gỡ hết: chạy `removeReminderTriggers()`.
- Muốn thử ngay: chạy tay từng hàm `remind...` trong editor.

---

## 👨‍🏫 Nhiều giáo viên dùng chung bot

- **Admin**: user ID Telegram trong Script Properties `ADMIN_IDS` (cách nhau bằng dấu phẩy); chưa đặt thì dùng `TEST_CHAT_ID`. Admin dùng file gốc (file chứa script) làm dữ liệu của mình.
- **Thêm giáo viên**: admin gõ `/them_gv <user ID> <Tên> [email]`. Bot tạo một Google Sheet riêng (đủ 8 tab như file gốc) trong Drive của chủ script, ghi vào tab **GIÁO VIÊN** của file gốc, chia sẻ cho email nếu có và báo cho thầy qua Telegram. Mọi lệnh của thầy đọc/ghi trên Sheet riêng đó; mã HV001... đánh số riêng từng thầy.
- `/ds_gv` liệt kê giáo viên, `/xoa_gv <ID>` khóa (mở lại bằng cách sửa cột Trạng thái trong tab GIÁO VIÊN thành "Hoạt động").
- `/chon_gv <ID>` đưa admin vào dữ liệu của một thầy (mọi lệnh sau đó thao tác trên Sheet của thầy), `/chon_gv` không tham số quay về file gốc.
- Ở file gốc, `/thong_ke` và `/xem_no` của admin tổng hợp mọi thầy (không tính dữ liệu file gốc).
- Thầy lấy user ID bằng cách nhắn bất kỳ gì cho bot: bot từ chối và trả lại ID.

---

## 🎮 Commands

| Command | Mô tả |
|---------|-------|
| `/start` | Bắt đầu & xem menu |
| `/help` | Hướng dẫn chi tiết |
| `/huy` | Hủy thao tác đang thực hiện |
| `/them_hv` | Thêm học viên mới |
| `/ds_hv` | Danh sách học viên |
| `/tim_hv <keyword>` | Tìm kiếm học viên |
| `/xem_<mã HV>` | Xem chi tiết học viên (VD: `/xem_HV001`) |
| `/dat_lich` | Đặt lịch học mới |
| `/lich_hom_nay` | Lịch hôm nay |
| `/lich_tuan` | Lịch tuần này |
| `/thu_tien` | Thu tiền học phí |
| `/xem_no` | Danh sách công nợ |
| `/dat_lich_thi` | Đăng ký kỳ thi |
| `/ds_thi` | Danh sách lịch thi |
| `/ds_xe` | Danh sách xe |
| `/them_xe` | Thêm xe mới |
| `/thong_ke` | Thống kê tổng quan |
| `/bao_cao` | Báo cáo chi tiết |
| `/them_gv <ID> <Tên> [email]` | (Admin) Thêm giáo viên, tạo Sheet riêng |
| `/ds_gv` | (Admin) Danh sách giáo viên |
| `/xoa_gv <ID>` | (Admin) Khóa giáo viên |
| `/chon_gv [ID]` | (Admin) Vào dữ liệu của một thầy / quay về file gốc |

---

## 💾 Cấu trúc database (Google Sheets)

### Sheet 1: THÔNG TIN HỌC VIÊN
- Mã HV, Họ tên, SĐT, CMND, Ngày sinh
- Địa chỉ, Loại bằng, Giáo viên
- Học phí, Đã đóng, Còn nợ (formula)
- Trạng thái

### Sheet 2: LỊCH HỌC
- Mã lịch, Mã HV, Tên HV
- Ngày học, Giờ học, Địa điểm
- Giáo viên, Biển số xe
- Loại buổi, Trạng thái

### Sheet 3: THANH TOÁN
- Mã thanh toán, Mã HV, Tên HV
- Ngày thanh toán, Số tiền
- Loại, Phương thức, Người thu

### Sheet 4: QUẢN LÝ XE
- Biển số, Loại xe, Hãng xe
- Năm SX, Trạng thái
- Bảo trì cuối, Kiểm định cuối

### Sheet 5: LỊCH THI
- Mã kỳ thi, Mã HV, Tên HV
- Loại bằng, Ngày thi, Giờ thi
- Địa điểm, Loại thi, Kết quả

### Sheets 6-8: TIẾN ĐỘ, NHẮC NHỞ, BÁO CÁO

---

## 🔧 Technical Stack

- **Platform**: Google Apps Script (JavaScript ES6)
- **Storage**: Google Sheets API
- **Cache**: CacheService (conversation state)
- **HTTP**: UrlFetchApp (Telegram API)
- **Webhook**: Web App deployment
- **Timezone**: Asia/Ho_Chi_Minh

---

## 📊 Giới hạn

Google Apps Script Free tier:

| Loại | Giới hạn |
|------|----------|
| Executions/day | 20,000 |
| Runtime/execution | 6 minutes |
| UrlFetch calls/day | 20,000 |
| Trigger runtime/day | 90 min |

**Đủ cho**: < 100 học viên, ~500 transactions/ngày

---

## 🎨 User Experience

### Conversation Flow (ví dụ: Thêm học viên)

```
User: /them_hv
Bot: 👤 Nhập họ tên học viên:

User: Nguyễn Văn A
Bot: 📱 Nhập số điện thoại (10 số):

User: 0901234567
Bot: 🆔 Nhập CMND/CCCD (9-12 số):

... (11 bước nữa)

Bot: 📋 XÁC NHẬN THÔNG TIN...
     [✅ Xác nhận] [❌ Hủy]
```

### Inline Keyboards

- **Gender**: 👨 Nam | 👩 Nữ
- **License**: A1 | A2 | B1 | B2 | C | D
- **Session type**: 🏫 Lý thuyết | 🚗 Thực hành
- **Payment method**: 💵 Tiền mặt | 🏦 Chuyển khoản

### Action Buttons

Từ chi tiết học viên:
- 📅 Lịch học
- 💰 Thanh toán
- 📊 Tiến độ
- ✏️ Sửa
- 🗑️ Xóa

---

## 🔐 Security

✅ **Bot Token**: Lưu trong Script Properties (không commit code)
✅ **Phân quyền**: Chỉ admin (`ADMIN_IDS` trong Script Properties, chưa đặt thì `TEST_CHAT_ID`) và giáo viên đang hoạt động trong tab GIÁO VIÊN mới dùng được bot, kiểm tra theo user ID người gửi nên trong nhóm cũng vậy. Mỗi thầy chỉ thấy Sheet riêng của mình. Người lạ nhắn bot sẽ nhận lại ID của mình để gửi cho admin
✅ **Webhook**: HTTPS only
✅ **Data**: Google Sheets permissions
✅ **Execution**: Runs as owner
✅ **Input validation**: Phone, ID card, date formats

⚠️ **Lưu ý**:
- Không share bot token
- Không deploy với "Execute as: User accessing the web app"
- Chỉ share sheet với người cần thiết

---

## 🐛 Debugging

### Xem logs
1. Apps Script editor → **Executions**
2. Click execution → xem logs
3. Logger.log() output xuất hiện ở đây

### Test functions
```javascript
function testSendMessage() {
  sendMessage(TEST_CHAT_ID, 'Test message');
}
```

### Check webhook
```javascript
function getWebhookInfo() {
  const url = `${CONFIG.TELEGRAM_API_URL}${CONFIG.TELEGRAM_BOT_TOKEN}/getWebhookInfo`;
  const response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}
```

---

## 📈 Roadmap

- [x] Nhắc nhở tự động (triggers)
- [ ] Export báo cáo Excel
- [ ] Gửi tin nhắn hàng loạt
- [ ] Chatbot hỗ trợ học viên
- [ ] Dashboard web admin
- [ ] Integration với hệ thống thi

---

## 📝 License

MIT License - Free to use & modify

---

## 👨‍💻 Author

Built with ❤️ by Claude Code
- Version: 1.0.0
- Date: October 2026

---

## 🙏 Support

Gặp vấn đề? Check:
1. **[APPSCRIPT_SETUP.md](../APPSCRIPT_SETUP.md)** - Hướng dẫn setup
2. **[USER_MANUAL.md](../USER_MANUAL.md)** - Hướng dẫn sử dụng
3. **Execution logs** - Debug trong Apps Script

---

**🎉 Happy coding!**
