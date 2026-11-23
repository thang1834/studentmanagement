# 🚗 Hệ thống quản lý học viên lái xe - Bot Telegram

Bot Telegram giúp giáo viên dạy lái xe quản lý học viên, lịch học, tiến độ, thanh toán và xe.

---

## 📋 BƯỚC 1: SETUP GOOGLE SHEETS (5 phút)

### 1.1 Tạo Google Sheets mới
1. Truy cập: https://sheets.google.com
2. Tạo spreadsheet mới (Blank spreadsheet)
3. Đặt tên: **"Quản lý học viên lái xe"**

### 1.2 Chạy Apps Script để tạo cấu trúc
1. Trong Google Sheets, vào: **Extensions > Apps Script**
2. Xóa hết code mặc định
3. Copy toàn bộ nội dung file `scripts/create-sheets.gs` và paste vào
4. Nhấn **Save** (Ctrl+S) - đặt tên project: "Setup Sheets"
5. Chọn function `setupAllSheets` từ dropdown
6. Nhấn **Run** (▶️)
7. Lần đầu sẽ hỏi authorize:
   - Nhấn **Review permissions**
   - Chọn tài khoản Google của bạn
   - Nhấn **Advanced** → **Go to Setup Sheets (unsafe)**
   - Nhấn **Allow**
8. Chờ 1-2 phút, script sẽ tạo 8 sheets với đầy đủ:
   - ✅ Headers
   - ✅ Data validation (dropdowns)
   - ✅ Formulas tự động
   - ✅ Formatting

9. Khi xong sẽ có popup thông báo kèm **Spreadsheet ID**
10. Copy **Spreadsheet ID** (hoặc lấy từ URL: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`)

### 1.3 Kiểm tra kết quả
Bạn sẽ thấy 8 sheets:
- THÔNG TIN HỌC VIÊN
- LỊCH HỌC
- TIẾN ĐỘ HỌC TẬP
- THANH TOÁN
- QUẢN LÝ XE
- LỊCH THI
- NHẮC NHỞ
- BÁO CÁO THỐNG KÊ

---

## 🤖 BƯỚC 2: SETUP TELEGRAM BOT (5 phút)

### 2.1 Tạo Bot
1. Mở Telegram, tìm: **@BotFather**
2. Gửi: `/newbot`
3. Nhập tên bot: `Quản lý học viên lái xe`
4. Nhập username: `student_driving_bot` (hoặc tên khác có đuôi `_bot`)
5. BotFather sẽ trả về **Bot Token** - copy lại

### 2.2 Lấy Chat ID của bạn
1. Tìm bot: **@userinfobot** trên Telegram
2. Nhấn Start
3. Bot sẽ trả về **Chat ID** của bạn - copy lại

### 2.3 Cấu hình Bot Commands
1. Gửi cho @BotFather: `/setcommands`
2. Chọn bot vừa tạo
3. Copy và paste danh sách commands sau:

```
start - Khởi động bot và xem menu
help - Hướng dẫn sử dụng
them_hv - Thêm học viên mới
ds_hv - Danh sách học viên
tim_hv - Tìm kiếm học viên
xem_hv - Xem chi tiết học viên
dat_lich - Đặt lịch học mới
lich_hom_nay - Xem lịch hôm nay
lich_tuan - Xem lịch tuần này
thu_tien - Ghi nhận thu tiền
xem_no - Danh sách học viên còn nợ
tien_do - Xem tiến độ học viên
ds_xe - Danh sách xe
thong_ke - Thống kê tổng quan
```

### 2.4 Setup Google Sheets API Credentials

**Option A: Dùng Service Account (Khuyến nghị - đơn giản hơn)**

1. Truy cập: https://console.cloud.google.com
2. Tạo project mới hoặc chọn project có sẵn
3. Enable **Google Sheets API**:
   - Search "Google Sheets API"
   - Nhấn Enable
4. Tạo Service Account:
   - Vào **APIs & Services > Credentials**
   - Nhấn **Create Credentials > Service Account**
   - Điền tên: `telegram-bot`
   - Nhấn **Create and Continue**
   - Skip permissions, nhấn **Done**
5. Tạo Key:
   - Vào Service Account vừa tạo
   - Tab **Keys > Add Key > Create new key**
   - Chọn **JSON**
   - File JSON sẽ tự động download
6. Đổi tên file thành `credentials.json` và copy vào thư mục gốc project
7. **QUAN TRỌNG:** Share Google Sheets cho Service Account:
   - Mở file `credentials.json`, copy email có dạng `xxx@xxx.iam.gserviceaccount.com`
   - Mở Google Sheets vừa tạo
   - Nhấn **Share**
   - Paste email Service Account
   - Chọn quyền: **Editor**
   - Bỏ tick "Notify people"
   - Nhấn **Share**

**Option B: Dùng OAuth2 (Phức tạp hơn nhưng an toàn hơn)**
- Xem hướng dẫn chi tiết tại: https://developers.google.com/sheets/api/quickstart/nodejs

---

## 💻 BƯỚC 3: CÀI ĐẶT VÀ CHẠY BOT

### 3.1 Cài đặt dependencies
```bash
npm install
```

### 3.2 Tạo file .env
Copy file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

Hoặc tạo file `.env` mới với nội dung:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TEACHER_CHAT_ID=your_chat_id_here
SPREADSHEET_ID=your_spreadsheet_id_here
TZ=Asia/Ho_Chi_Minh
NODE_ENV=development
```

Điền thông tin:
- `TELEGRAM_BOT_TOKEN`: Bot token từ @BotFather
- `TEACHER_CHAT_ID`: Chat ID của bạn từ @userinfobot
- `SPREADSHEET_ID`: ID của Google Sheets (từ bước 1)

### 3.3 Chạy bot
```bash
# Development mode (auto-reload khi code thay đổi)
npm run dev

# Production mode
npm start
```

### 3.4 Test bot
1. Mở Telegram, tìm bot của bạn
2. Nhấn **Start**
3. Thử command: `/help`

Nếu bot trả lời → **Setup thành công!** 🎉

---

## 📚 CẤU TRÚC PROJECT

```
studentmanagement/
├── src/
│   ├── bot/                    # Bot Telegram
│   │   ├── index.js           # Entry point
│   │   ├── commands/          # Các commands
│   │   ├── handlers/          # Event handlers
│   │   ├── utils/             # Utilities
│   │   └── middlewares/       # Middlewares
│   ├── sheets/                # Google Sheets CRUD
│   │   ├── index.js           # Sheets client
│   │   ├── student.js         # CRUD học viên
│   │   ├── schedule.js        # CRUD lịch học
│   │   └── ...
│   ├── services/              # Background services
│   │   ├── scheduler.js       # Cron jobs
│   │   └── notification.js    # Notifications
│   ├── config/                # Configuration
│   └── constants/             # Constants
├── scripts/
│   └── create-sheets.gs       # Apps Script setup sheets
├── .env                       # Environment variables (không commit)
├── .env.example               # Template
├── package.json
├── PROJECT_PLAN.md            # Kế hoạch chi tiết
└── README.md                  # File này
```

---

## 🎯 TÍNH NĂNG CHÍNH

### Quản lý học viên
- ✅ Thêm/sửa/xóa học viên
- ✅ Tìm kiếm theo tên/SĐT
- ✅ Lưu địa chỉ nhà/làm việc để đón
- ✅ Theo dõi loại bằng đang học

### Quản lý lịch học
- ✅ Đặt lịch học tự động
- ✅ Hiển thị: loại bằng, xe, địa chỉ đón
- ✅ Gợi ý xe phù hợp theo loại bằng
- ✅ Kiểm tra xe rảnh/bận
- ✅ Xem lịch hôm nay/tuần

### Tiến độ học tập
- ✅ Theo dõi giờ học lý thuyết/thực hành
- ✅ Checklist 8 kỹ năng lái xe
- ✅ Tính % hoàn thành tự động
- ✅ Ghi nhận kết quả thi

### Thanh toán
- ✅ Ghi nhận thu/chi
- ✅ Tính công nợ tự động
- ✅ Xem danh sách còn nợ
- ✅ Lịch sử thanh toán

### Quản lý xe
- ✅ Theo dõi km, bảo dưỡng
- ✅ Nhắc đăng kiểm, bảo dưỡng
- ✅ Tự động gợi ý xe theo loại bằng

### Báo cáo & Thống kê
- ✅ Thống kê tháng (doanh thu, chi phí)
- ✅ Tỷ lệ đậu/rớt
- ✅ Số học viên mới/tốt nghiệp

---

## 🔧 TROUBLESHOOTING

### Bot không trả lời
1. Kiểm tra bot đang chạy: `npm run dev`
2. Kiểm tra `.env` đã điền đúng thông tin
3. Xem logs trong terminal có lỗi gì không

### Lỗi Google Sheets API
1. Kiểm tra `credentials.json` đã đúng chưa
2. Kiểm tra đã share Sheets cho Service Account chưa
3. Kiểm tra `SPREADSHEET_ID` trong `.env` đúng chưa

### Lỗi "Cannot find module"
```bash
rm -rf node_modules
npm install
```

---

## 📖 HƯỚNG DẪN SỬ DỤNG CHI TIẾT

Xem file **PROJECT_PLAN.md** để biết:
- Kế hoạch triển khai đầy đủ
- Cấu trúc database (8 sheets)
- Danh sách tất cả commands
- Timeline phát triển

---

## 🚀 NEXT STEPS

### Phase 2: Implement Bot Commands (đang làm)
- [ ] Tạo Google Sheets client
- [ ] Implement quản lý học viên
- [ ] Implement lịch học
- [ ] Implement thanh toán
- [ ] ...

Theo dõi tiến độ tại: **PROJECT_PLAN.md > Báo cáo tiến độ**

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, kiểm tra:
1. Logs trong terminal
2. Google Sheets có data đúng không
3. Bot token và Chat ID đúng chưa

---

**Phiên bản:** 1.0.0  
**Ngày tạo:** 14/10/2026  
**License:** ISC
