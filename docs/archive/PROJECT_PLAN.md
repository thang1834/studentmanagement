# 🚗 HỆ THỐNG QUẢN LÝ HỌC VIÊN LÁI XE - BOT TELEGRAM

**Dự án:** Bot Telegram quản lý học viên lái xe cho giáo viên  
**Ngày tạo:** 14/10/2026  
**Trạng thái:** Planning

---

## 📋 MỤC LỤC

1. [Tổng quan dự án](#tổng-quan-dự-án)
2. [Cấu trúc hệ thống](#cấu-trúc-hệ-thống)
3. [Chi tiết Google Sheets](#chi-tiết-google-sheets)
4. [Tính năng Bot Telegram](#tính-năng-bot-telegram)
5. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
6. [Công nghệ sử dụng](#công-nghệ-sử-dụng)
7. [Checklist thực hiện](#checklist-thực-hiện)
8. [Timeline dự kiến](#timeline-dự-kiến)
9. [Báo cáo tiến độ](#báo-cáo-tiến-độ)

---

## 🎯 TỔNG QUAN DỰ ÁN

### Mục tiêu
Xây dựng bot Telegram giúp giáo viên dạy lái xe:
- Quản lý thông tin học viên
- Lên lịch dạy học tự động
- Theo dõi tiến độ học tập
- Quản lý thu chi, công nợ
- Quản lý phương tiện (xe)
- Thống kê, báo cáo

### Người dùng
- **Giáo viên dạy lái xe** (người duy nhất sử dụng bot)

### Phạm vi
- Quản lý thông tin cá nhân học viên
- Quản lý lịch học (lý thuyết, thực hành, sa hình)
- Theo dõi tiến độ từng kỹ năng
- Quản lý tài chính (học phí, công nợ)
- Quản lý xe (lịch sử, bảo dưỡng)
- Lịch thi và kết quả
- Báo cáo thống kê

---

## 🏗 CẤU TRÚC HỆ THỐNG

```
┌─────────────────┐
│  Giáo viên      │
│  (Telegram)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Bot Telegram   │
│  (Node.js)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Google Sheets   │
│   (Database)    │
└─────────────────┘
```

---

## 📊 CHI TIẾT GOOGLE SHEETS

### Sheet 1: THÔNG TIN HỌC VIÊN

| Cột | Tên cột | Kiểu dữ liệu | Bắt buộc | Ghi chú |
|-----|---------|--------------|----------|---------|
| A | ID | Text (tự động) | ✅ | HV001, HV002... |
| B | Họ tên | Text | ✅ | |
| C | Ngày sinh | Date | ✅ | DD/MM/YYYY |
| D | Giới tính | Text | ❌ | Nam/Nữ/Khác |
| E | Số điện thoại | Text | ✅ | 0912345678 |
| F | CMND/CCCD | Text | ✅ | |
| G | Địa chỉ nhà | Text | ✅ | Để đón học viên |
| H | Địa chỉ làm việc | Text | ❌ | |
| I | Ghi chú địa chỉ | Text | ❌ | Hướng dẫn tìm đường |
| J | Ngày nộp hồ sơ | Date | ✅ | |
| K | Ngày đăng ký học | Date | ✅ | |
| L | Loại bằng | Text | ✅ | A1/A2/B1/B2/C/D/E |
| M | Giáo viên phụ trách | Text | ✅ | |
| N | Trạng thái | Text | ✅ | Chờ xử lý hồ sơ/Đang học/Chờ thi/Đã tốt nghiệp/Bỏ học |
| O | Học phí (VNĐ) | Number | ✅ | |
| P | Đã đóng (VNĐ) | Number | ✅ | Default: 0 |
| Q | Còn nợ (VNĐ) | Formula | ✅ | =O2-P2 |
| R | Ghi chú | Text | ❌ | |
| S | Ngày tạo | Timestamp | ✅ | Auto |
| T | Ngày cập nhật | Timestamp | ✅ | Auto |

**Data Validation:**
- Loại bằng: Dropdown [A1, A2, B1, B2, C, D, E]
- Trạng thái: Dropdown [Chờ xử lý hồ sơ, Đang học, Chờ thi, Đã tốt nghiệp, Bỏ học]
- Giới tính: Dropdown [Nam, Nữ, Khác]

---

### Sheet 2: LỊCH HỌC

| Cột | Tên cột | Kiểu dữ liệu | Bắt buộc | Ghi chú |
|-----|---------|--------------|----------|---------|
| A | ID buổi học | Text | ✅ | LH001, LH002... |
| B | Ngày | Date | ✅ | DD/MM/YYYY |
| C | Giờ bắt đầu | Time | ✅ | HH:MM |
| D | Giờ kết thúc | Time | ✅ | HH:MM |
| E | ID học viên | Text | ✅ | HV001 |
| F | Họ tên | Formula | ✅ | =VLOOKUP(E2,'THÔNG TIN HỌC VIÊN'!A:B,2,0) |
| G | Loại bằng | Formula | ✅ | =VLOOKUP(E2,'THÔNG TIN HỌC VIÊN'!A:L,12,0) |
| H | Loại buổi học | Text | ✅ | Lý thuyết/Thực hành/Sa hình |
| I | Nội dung | Text | ✅ | VD: Khởi động xe, vào cua... |
| J | Địa chỉ đón | Text | ❌ | Nếu khác địa chỉ mặc định |
| K | Địa chỉ trả | Text | ❌ | |
| L | Biển số xe | Text | ❌ | 51F-12345 |
| M | Loại xe | Formula | ✅ | =VLOOKUP(L2,'QUẢN LÝ XE'!A:C,3,0) |
| N | Trạng thái | Text | ✅ | Đã học/Chưa học/Hủy/Nghỉ có phép |
| O | Giáo viên | Text | ✅ | |
| P | Đánh giá | Text | ❌ | Điểm hoặc nhận xét |
| Q | Ghi chú | Text | ❌ | |
| R | Ngày tạo | Timestamp | ✅ | Auto |
| S | Ngày cập nhật | Timestamp | ✅ | Auto |

**Data Validation:**
- Loại buổi học: Dropdown [Lý thuyết, Thực hành, Sa hình]
- Trạng thái: Dropdown [Đã học, Chưa học, Hủy, Nghỉ có phép]

---

### Sheet 3: TIẾN ĐỘ HỌC TẬP

| Cột | Tên cột | Kiểu dữ liệu | Bắt buộc | Ghi chú |
|-----|---------|--------------|----------|---------|
| A | ID học viên | Text | ✅ | HV001 |
| B | Họ tên | Formula | ✅ | =VLOOKUP(A2,'THÔNG TIN HỌC VIÊN'!A:B,2,0) |
| C | Giờ lý thuyết (đã học) | Number | ✅ | |
| D | Giờ lý thuyết (tổng) | Number | ✅ | |
| E | Giờ thực hành (đã học) | Number | ✅ | |
| F | Giờ thực hành (tổng) | Number | ✅ | |
| G | % hoàn thành | Formula | ✅ | =((C2/D2)+(E2/F2))/2*100 |
| H | Khởi động - dừng xe | Text | ❌ | ✓/✗ |
| I | Đổi số - ga - phanh | Text | ❌ | ✓/✗ |
| J | Vào cua phải/trái | Text | ❌ | ✓/✗ |
| K | Đỗ xe dọc | Text | ❌ | ✓/✗ |
| L | Đỗ xe ngang | Text | ❌ | ✓/✗ |
| M | Lùi xe | Text | ❌ | ✓/✗ |
| N | Đường dốc | Text | ❌ | ✓/✗ |
| O | Vượt chướng ngại vật | Text | ❌ | ✓/✗ |
| P | Điểm lý thuyết | Number | ❌ | 0-100 |
| Q | Kết quả thực hành | Text | ❌ | Đạt/Chưa đạt |
| R | Ngày thi dự kiến | Date | ❌ | |
| S | Số lần thi | Number | ✅ | Default: 0 |
| T | Trạng thái cuối | Text | ❌ | Đạt/Chưa đạt |
| U | Ngày cập nhật | Timestamp | ✅ | Auto |

**Data Validation:**
- Các cột kỹ năng (H-O): Dropdown [✓, ✗, blank]
- Kết quả: Dropdown [Đạt, Chưa đạt]

---

### Sheet 4: THANH TOÁN

| Cột | Tên cột | Kiểu dữ liệu | Bắt buộc | Ghi chú |
|-----|---------|--------------|----------|---------|
| A | ID giao dịch | Text | ✅ | TT001, TT002... |
| B | Ngày giờ | Timestamp | ✅ | |
| C | Loại | Text | ✅ | Thu/Chi |
| D | Khoản mục | Text | ✅ | Học phí/Lệ phí thi/Xăng xe/Bảo dưỡng... |
| E | ID học viên | Text | ❌ | Nếu liên quan đến học viên |
| F | Họ tên | Formula | ❌ | =IF(E2<>"",VLOOKUP(E2,'THÔNG TIN HỌC VIÊN'!A:B,2,0),"") |
| G | Số tiền (VNĐ) | Number | ✅ | |
| H | Hình thức | Text | ✅ | Tiền mặt/Chuyển khoản |
| I | Người thu/chi | Text | ✅ | |
| J | Biên lai/Hóa đơn | Text | ❌ | Link ảnh |
| K | Ghi chú | Text | ❌ | |
| L | Ngày tạo | Timestamp | ✅ | Auto |

**Data Validation:**
- Loại: Dropdown [Thu, Chi]
- Khoản mục: Dropdown [Học phí, Lệ phí thi, Xăng xe, Bảo dưỡng, Sửa chữa, Đăng kiểm, Bảo hiểm, Khác]
- Hình thức: Dropdown [Tiền mặt, Chuyển khoản]

---

### Sheet 5: QUẢN LÝ XE

| Cột | Tên cột | Kiểu dữ liệu | Bắt buộc | Ghi chú |
|-----|---------|--------------|----------|---------|
| A | Biển số | Text | ✅ | 51F-12345 |
| B | Phù hợp bằng | Text | ✅ | B1/B2/C/A1... |
| C | Loại xe | Text | ✅ | Số sàn/Số tự động/Xe máy |
| D | Hãng | Text | ✅ | Toyota, Honda... |
| E | Dòng xe | Text | ❌ | Vios, City... |
| F | Năm sản xuất | Number | ✅ | |
| G | Km hiện tại | Number | ✅ | |
| H | Trạng thái | Text | ✅ | Đang dùng/Bảo trì/Ngừng hoạt động |
| I | Ngày đăng kiểm cuối | Date | ❌ | |
| J | Ngày đăng kiểm tiếp theo | Date | ❌ | |
| K | Ngày bảo dưỡng cuối | Date | ❌ | |
| L | Km bảo dưỡng tiếp theo | Number | ❌ | |
| M | Chi phí bảo trì (tháng) | Number | ❌ | |
| N | Ghi chú | Text | ❌ | |
| O | Ngày tạo | Timestamp | ✅ | Auto |
| P | Ngày cập nhật | Timestamp | ✅ | Auto |

**Data Validation:**
- Phù hợp bằng: Dropdown [A1, A2, B1, B2, C, D, E]
- Loại xe: Dropdown [Số sàn, Số tự động, Xe máy, Xe tải]
- Trạng thái: Dropdown [Đang dùng, Bảo trì, Ngừng hoạt động]

---

### Sheet 6: LỊCH THI

| Cột | Tên cột | Kiểu dữ liệu | Bắt buộc | Ghi chú |
|-----|---------|--------------|----------|---------|
| A | ID kỳ thi | Text | ✅ | KT001, KT002... |
| B | Ngày thi | Date | ✅ | |
| C | Loại | Text | ✅ | Lý thuyết/Thực hành/Sa hình |
| D | Địa điểm | Text | ✅ | |
| E | Giờ tập trung | Time | ✅ | |
| F | Danh sách học viên | Text | ✅ | HV001,HV002,HV003 |
| G | Số lượng | Formula | ✅ | =LEN(F2)-LEN(SUBSTITUTE(F2,",",""))+1 |
| H | Đã đăng ký | Number | ✅ | Số học viên đã đăng ký |
| I | Đã thi | Number | ✅ | Số học viên đã thi |
| J | Đạt | Number | ✅ | Số học viên đạt |
| K | Kết quả chung | Formula | ✅ | =J2&"/"&I2&" đạt" |
| L | Ghi chú | Text | ❌ | |
| M | Ngày tạo | Timestamp | ✅ | Auto |

**Data Validation:**
- Loại: Dropdown [Lý thuyết, Thực hành, Sa hình]

---

### Sheet 7: NHẮC NHỞ

| Cột | Tên cột | Kiểu dữ liệu | Bắt buộc | Ghi chú |
|-----|---------|--------------|----------|---------|
| A | ID | Text | ✅ | NH001, NH002... |
| B | Loại | Text | ✅ | Sinh nhật/Đóng tiền/Lịch thi/Bảo dưỡng xe/Đăng kiểm |
| C | Tiêu đề | Text | ✅ | |
| D | Nội dung | Text | ✅ | |
| E | Ngày nhắc | Date | ✅ | |
| F | Giờ nhắc | Time | ✅ | |
| G | ID đối tượng | Text | ❌ | HV001 hoặc ALL |
| H | Trạng thái | Text | ✅ | Chờ gửi/Đã gửi/Hủy |
| I | Gửi qua | Text | ✅ | Telegram |
| J | Ngày tạo | Timestamp | ✅ | Auto |

**Data Validation:**
- Loại: Dropdown [Sinh nhật, Đóng tiền, Lịch thi, Bảo dưỡng xe, Đăng kiểm, Khác]
- Trạng thái: Dropdown [Chờ gửi, Đã gửi, Hủy]
- Gửi qua: Dropdown [Telegram]

---

### Sheet 8: BÁO CÁO THỐNG KÊ

| Cột | Tên cột | Kiểu dữ liệu | Bắt buộc | Ghi chú |
|-----|---------|--------------|----------|---------|
| A | Tháng/Năm | Text | ✅ | MM/YYYY |
| B | Số học viên mới | Number | ✅ | |
| C | Số học viên tốt nghiệp | Number | ✅ | |
| D | Số học viên đang học | Number | ✅ | |
| E | Số học viên bỏ học | Number | ✅ | |
| F | Doanh thu (VNĐ) | Number | ✅ | |
| G | Chi phí (VNĐ) | Number | ✅ | |
| H | Lợi nhuận (VNĐ) | Formula | ✅ | =F2-G2 |
| I | Tổng giờ dạy | Number | ✅ | |
| J | Tỷ lệ đậu lý thuyết (%) | Number | ✅ | |
| K | Tỷ lệ đậu thực hành (%) | Number | ✅ | |
| L | Ngày tạo | Timestamp | ✅ | Auto |

---

## 🤖 TÍNH NĂNG BOT TELEGRAM

### 1. Quản lý học viên
- [ ] `/start` - Khởi động bot và xem menu
- [ ] `/help` - Hướng dẫn sử dụng
- [ ] `/them_hv` - Thêm học viên mới (conversation flow)
- [ ] `/ds_hv` - Danh sách học viên (pagination)
- [ ] `/tim_hv <keyword>` - Tìm kiếm theo tên/sđt
- [ ] `/xem_hv <ID>` - Xem chi tiết học viên
- [ ] `/sua_hv <ID>` - Sửa thông tin (inline keyboard)
- [ ] `/xoa_hv <ID>` - Xóa học viên (confirmation)

### 2. Quản lý lịch học
- [ ] `/dat_lich` - Đặt lịch mới (conversation flow)
- [ ] `/lich_hom_nay` - Xem lịch hôm nay
- [ ] `/lich_tuan` - Xem lịch 7 ngày tới
- [ ] `/lich_hv <ID>` - Lịch của học viên
- [ ] `/huy_lich <ID buổi>` - Hủy buổi học
- [ ] `/hoan_thanh <ID buổi>` - Đánh dấu hoàn thành
- [ ] `/danh_gia <ID buổi>` - Đánh giá buổi học

### 3. Tiến độ học tập
- [ ] `/tien_do <ID>` - Xem tiến độ
- [ ] `/cap_nhat_td <ID>` - Cập nhật tiến độ
- [ ] `/ky_nang <ID>` - Đánh dấu kỹ năng đã đạt
- [ ] `/san_sang_thi <ID>` - Đánh dấu sẵn sàng thi

### 4. Thanh toán
- [ ] `/thu_tien <ID>` - Ghi nhận thu tiền
- [ ] `/xem_no` - DS học viên còn nợ
- [ ] `/cong_no <ID>` - Xem công nợ
- [ ] `/lich_su_tt <ID>` - Lịch sử thanh toán
- [ ] `/thong_ke_thu` - Thống kê thu chi tháng

### 5. Quản lý xe
- [ ] `/ds_xe` - Danh sách xe
- [ ] `/them_xe` - Thêm xe mới
- [ ] `/bd_xe <Biển số>` - Lịch bảo dưỡng
- [ ] `/cap_nhat_km <Biển số>` - Cập nhật km

### 6. Lịch thi
- [ ] `/tao_ky_thi` - Tạo kỳ thi mới
- [ ] `/ds_ky_thi` - DS kỳ thi sắp tới
- [ ] `/dang_ky_thi <ID HV> <ID KT>` - Đăng ký
- [ ] `/ket_qua_thi <ID KT>` - Nhập kết quả

### 7. Nhắc nhở & thống kê
- [ ] `/nhan_nho` - Xem nhắc nhở hôm nay
- [ ] `/thong_ke` - Thống kê tổng quan
- [ ] `/bao_cao_thang` - Báo cáo tháng

### 8. Tính năng tự động
- [ ] Nhắc lịch học trước 30 phút
- [ ] Nhắc công nợ mỗi tuần
- [ ] Nhắc bảo dưỡng xe
- [ ] Nhắc đăng kiểm xe
- [ ] Tính toán thống kê tự động

---

## 📁 CẤU TRÚC THƯ MỤC

```
studentmanagement/
├── src/
│   ├── bot/
│   │   ├── index.js              # Entry point bot
│   │   ├── commands/
│   │   │   ├── student.js        # Commands quản lý học viên
│   │   │   ├── schedule.js       # Commands lịch học
│   │   │   ├── progress.js       # Commands tiến độ
│   │   │   ├── payment.js        # Commands thanh toán
│   │   │   ├── vehicle.js        # Commands xe
│   │   │   ├── exam.js           # Commands thi
│   │   │   └── report.js         # Commands báo cáo
│   │   ├── handlers/
│   │   │   ├── conversation.js   # Conversation handlers
│   │   │   ├── callback.js       # Callback query handlers
│   │   │   └── error.js          # Error handlers
│   │   ├── utils/
│   │   │   ├── formatter.js      # Format messages
│   │   │   ├── validator.js      # Validate input
│   │   │   └── keyboard.js       # Inline keyboards
│   │   └── middlewares/
│   │       ├── auth.js           # Auth middleware
│   │       └── logger.js         # Logger middleware
│   ├── sheets/
│   │   ├── index.js              # Google Sheets client
│   │   ├── init.js               # Script tạo sheets
│   │   ├── student.js            # CRUD học viên
│   │   ├── schedule.js           # CRUD lịch học
│   │   ├── progress.js           # CRUD tiến độ
│   │   ├── payment.js            # CRUD thanh toán
│   │   ├── vehicle.js            # CRUD xe
│   │   ├── exam.js               # CRUD thi
│   │   ├── reminder.js           # CRUD nhắc nhở
│   │   └── report.js             # Query báo cáo
│   ├── services/
│   │   ├── scheduler.js          # Cron jobs nhắc nhở
│   │   ├── notification.js       # Gửi thông báo
│   │   └── analytics.js          # Tính toán thống kê
│   ├── config/
│   │   ├── index.js              # Main config
│   │   ├── telegram.js           # Telegram config
│   │   └── sheets.js             # Google Sheets config
│   └── constants/
│       ├── sheets.js             # Sheet names, columns
│       ├── messages.js           # Message templates
│       └── validation.js         # Validation rules
├── scripts/
│   ├── create-sheets.js          # Script tạo Google Sheets
│   ├── seed-data.js              # Script seed dữ liệu mẫu
│   └── backup.js                 # Script backup
├── tests/
│   ├── bot/
│   ├── sheets/
│   └── services/
├── .env.example                  # Example env file
├── .gitignore
├── package.json
├── README.md
└── PROJECT_PLAN.md              # File này
```

---

## 🛠 CÔNG NGHỆ SỬ DỤNG

### Backend
- **Node.js** v18+ - Runtime
- **telegraf** - Telegram Bot framework
- **googleapis** - Google Sheets API
- **node-cron** - Scheduler cho nhắc nhở
- **dotenv** - Environment variables
- **date-fns** - Date manipulation

### Google Sheets API
- **@google-cloud/local-auth** - OAuth2 authentication
- **googleapis** - Sheets API v4

### Dev Tools
- **nodemon** - Auto reload
- **eslint** - Code linting
- **prettier** - Code formatting

---

## ✅ CHECKLIST THỰC HIỆN

### Phase 1: Setup & Infrastructure ⏰ 2-3 giờ

#### 1.1 Setup Project
- [ ] Tạo thư mục dự án
- [ ] Init npm project: `npm init -y`
- [ ] Install dependencies
- [ ] Tạo cấu trúc thư mục
- [ ] Setup .gitignore
- [ ] Setup .env.example
- **Verify:** `npm start` chạy không lỗi

#### 1.2 Setup Google Sheets API
- [ ] Tạo project trên Google Cloud Console
- [ ] Enable Google Sheets API
- [ ] Tạo OAuth2 credentials
- [ ] Download credentials.json
- [ ] Test authentication
- **Verify:** Có thể đọc/ghi sheet thử nghiệm

#### 1.3 Tạo Google Sheets Database
- [ ] Viết script `scripts/create-sheets.js`
- [ ] Tạo 8 sheets với cấu trúc đã định nghĩa
- [ ] Setup data validation rules
- [ ] Setup formulas tự động
- [ ] Setup conditional formatting (optional)
- **Verify:** Mở sheet và kiểm tra cấu trúc đầy đủ

#### 1.4 Setup Telegram Bot
- [ ] Tạo bot mới với @BotFather
- [ ] Lấy Bot Token
- [ ] Lấy Chat ID của giáo viên
- [ ] Cấu hình bot (name, description, commands)
- [ ] Test kết nối bot
- **Verify:** Bot trả lời được `/start`

---

### Phase 2: Core Features - Quản lý học viên ⏰ 4-5 giờ

#### 2.1 Google Sheets Client
- [ ] Implement `src/sheets/index.js` - base client
- [ ] Implement `src/sheets/student.js`
  - [ ] `createStudent(data)` - Thêm học viên
  - [ ] `getStudents()` - Lấy danh sách
  - [ ] `getStudentById(id)` - Lấy theo ID
  - [ ] `updateStudent(id, data)` - Cập nhật
  - [ ] `deleteStudent(id)` - Xóa
  - [ ] `searchStudents(keyword)` - Tìm kiếm
- **Verify:** Test từng function với console.log

#### 2.2 Bot Commands - Học viên
- [ ] `/start` - Welcome message + menu
- [ ] `/help` - Hướng dẫn chi tiết
- [ ] `/them_hv` - Conversation flow
  - [ ] Hỏi họ tên
  - [ ] Hỏi ngày sinh
  - [ ] Hỏi số điện thoại
  - [ ] Hỏi CMND/CCCD
  - [ ] Hỏi địa chỉ nhà
  - [ ] Hỏi địa chỉ làm việc (optional)
  - [ ] Hỏi ngày nộp hồ sơ
  - [ ] Hỏi loại bằng (inline keyboard)
  - [ ] Hỏi học phí
  - [ ] Confirm và lưu
- [ ] `/ds_hv` - List với pagination (10 items/page)
- [ ] `/tim_hv <keyword>` - Tìm kiếm
- [ ] `/xem_hv <ID>` - Chi tiết + inline keyboard actions
- [ ] `/sua_hv <ID>` - Inline keyboard chọn field → nhập giá trị mới
- [ ] `/xoa_hv <ID>` - Confirmation dialog
- **Verify:** Test từng command, thử nhập sai format

---

### Phase 3: Quản lý lịch học ⏰ 5-6 giờ

#### 3.1 Google Sheets - Lịch học
- [ ] Implement `src/sheets/schedule.js`
  - [ ] `createSchedule(data)`
  - [ ] `getSchedules(filters)` - filter theo ngày, học viên
  - [ ] `getScheduleById(id)`
  - [ ] `updateSchedule(id, data)`
  - [ ] `deleteSchedule(id)`
  - [ ] `getTodaySchedules()`
  - [ ] `getWeekSchedules()`
  - [ ] `checkVehicleAvailable(vehicleId, date, timeStart, timeEnd)`
- **Verify:** Test queries phức tạp

#### 3.2 Bot Commands - Lịch học
- [ ] `/dat_lich` - Conversation flow
  - [ ] Chọn học viên (inline keyboard với search)
  - [ ] Hiển thị info học viên + địa chỉ + loại bằng
  - [ ] Chọn ngày (calendar picker hoặc text)
  - [ ] Chọn giờ bắt đầu
  - [ ] Chọn loại buổi học (inline keyboard)
  - [ ] Nhập nội dung dạy
  - [ ] Gợi ý xe phù hợp dựa trên loại bằng
  - [ ] Chọn xe (hiển thị trạng thái rảnh/bận)
  - [ ] Confirm và lưu
- [ ] `/lich_hom_nay` - Format đẹp với emoji
- [ ] `/lich_tuan` - Group theo ngày
- [ ] `/lich_hv <ID>` - Lịch của 1 học viên
- [ ] `/huy_lich <ID>` - Confirmation
- [ ] `/hoan_thanh <ID>` - Update status
- [ ] `/danh_gia <ID>` - Nhập đánh giá
- **Verify:** Đặt lịch trùng xe, kiểm tra validation

---

### Phase 4: Tiến độ & Thanh toán ⏰ 4-5 giờ

#### 4.1 Google Sheets - Tiến độ
- [ ] Implement `src/sheets/progress.js`
  - [ ] `getProgress(studentId)`
  - [ ] `updateProgress(studentId, data)`
  - [ ] `updateSkill(studentId, skill, value)`
  - [ ] `calculateProgress(studentId)` - Tính % tự động
- **Verify:** Cập nhật tiến độ và xem công thức

#### 4.2 Google Sheets - Thanh toán
- [ ] Implement `src/sheets/payment.js`
  - [ ] `createPayment(data)`
  - [ ] `getPayments(filters)`
  - [ ] `getStudentDebt(studentId)`
  - [ ] `getStudentsWithDebt()`
  - [ ] `getMonthlyReport(month, year)`
- **Verify:** Tính toán công nợ chính xác

#### 4.3 Bot Commands - Tiến độ & Thanh toán
- [ ] `/tien_do <ID>` - Progress bar visual
- [ ] `/cap_nhat_td <ID>` - Update giờ học
- [ ] `/ky_nang <ID>` - Inline keyboard chọn kỹ năng
- [ ] `/thu_tien <ID>` - Conversation flow
- [ ] `/xem_no` - List sorted by debt
- [ ] `/cong_no <ID>` - Detail
- [ ] `/lich_su_tt <ID>` - Payment history
- [ ] `/thong_ke_thu` - Monthly summary
- **Verify:** Thu tiền và xem cập nhật công nợ

---

### Phase 5: Xe & Lịch thi ⏰ 3-4 giờ

#### 5.1 Google Sheets - Xe & Thi
- [ ] Implement `src/sheets/vehicle.js`
  - [ ] `createVehicle(data)`
  - [ ] `getVehicles()`
  - [ ] `getVehicleByPlate(plate)`
  - [ ] `updateVehicle(plate, data)`
  - [ ] `getVehiclesByType(type)`
- [ ] Implement `src/sheets/exam.js`
  - [ ] `createExam(data)`
  - [ ] `getUpcomingExams()`
  - [ ] `registerStudentForExam(studentId, examId)`
  - [ ] `updateExamResult(examId, results)`
- **Verify:** CRUD operations

#### 5.2 Bot Commands - Xe & Thi
- [ ] `/ds_xe` - List xe
- [ ] `/them_xe` - Conversation flow
- [ ] `/bd_xe <plate>` - Maintenance schedule
- [ ] `/cap_nhat_km <plate>` - Update km
- [ ] `/tao_ky_thi` - Conversation flow
- [ ] `/ds_ky_thi` - Upcoming exams
- [ ] `/dang_ky_thi <ID HV> <ID KT>` - Register
- [ ] `/ket_qua_thi <ID KT>` - Input results
- **Verify:** Đăng ký thi và nhập kết quả

---

### Phase 6: Nhắc nhở & Tự động hóa ⏰ 4-5 giờ

#### 6.1 Scheduler Service
- [ ] Implement `src/services/scheduler.js`
  - [ ] Setup node-cron
  - [ ] Kiểm tra nhắc nhở mỗi 15 phút
  - [ ] Gửi nhắc nhở đến hạn
  - [ ] Update trạng thái "Đã gửi"
- **Verify:** Tạo nhắc nhở test và kiểm tra gửi đúng giờ

#### 6.2 Auto Reminders
- [ ] Nhắc lịch học trước 30 phút
  - [ ] Query lịch sắp tới
  - [ ] Format message với đầy đủ info
  - [ ] Gửi cho giáo viên
- [ ] Nhắc công nợ hàng tuần (Thứ 2 9h)
  - [ ] Query học viên còn nợ
  - [ ] Group theo mức nợ
  - [ ] Gửi summary
- [ ] Nhắc bảo dưỡng xe
  - [ ] Kiểm tra km sắp đến hạn bảo dưỡng
  - [ ] Gửi nhắc trước 500km
- [ ] Nhắc đăng kiểm xe
  - [ ] Kiểm tra đăng kiểm sắp hết hạn
  - [ ] Gửi nhắc trước 1 tháng
- **Verify:** Chạy thử từng loại nhắc nhở

#### 6.3 Bot Commands - Nhắc nhở
- [ ] `/nhan_nho` - Xem nhắc nhở hôm nay
- [ ] `/tao_nhan_nho` - Tạo custom reminder
- **Verify:** Tạo và nhận nhắc nhở

---

### Phase 7: Báo cáo & Thống kê ⏰ 3-4 giờ

#### 7.1 Report Service
- [ ] Implement `src/sheets/report.js`
  - [ ] `getOverview()` - Tổng quan
  - [ ] `getMonthlyReport(month, year)`
  - [ ] `calculatePassRate(month, year)`
  - [ ] `getRevenueReport(startDate, endDate)`
- [ ] Implement `src/services/analytics.js`
  - [ ] Tính toán thống kê từ data
  - [ ] Generate charts (text-based)
- **Verify:** Các con số khớp với manual calculation

#### 7.2 Bot Commands - Báo cáo
- [ ] `/thong_ke` - Dashboard tổng quan
  - [ ] Số học viên đang học
  - [ ] Số buổi học tháng này
  - [ ] Doanh thu tháng này
  - [ ] Tỷ lệ đậu
- [ ] `/bao_cao_thang` - Monthly report
  - [ ] Group theo category
  - [ ] Visual với emoji/bar
- **Verify:** Số liệu chính xác

---

### Phase 8: Polish & Testing ⏰ 3-4 giờ

#### 8.1 Error Handling
- [ ] Implement global error handler
- [ ] Handle Google Sheets API errors
- [ ] Handle Telegram API errors
- [ ] User-friendly error messages
- [ ] Logging errors
- **Verify:** Test các edge cases

#### 8.2 Input Validation
- [ ] Validate phone number format
- [ ] Validate date format
- [ ] Validate ID format
- [ ] Validate number ranges
- [ ] Prevent SQL injection (nếu có)
- **Verify:** Thử input sai format

#### 8.3 UX Improvements
- [ ] Loading indicators
- [ ] Confirmation dialogs
- [ ] Cancel actions mid-conversation
- [ ] Back buttons
- [ ] Help text trong conversations
- **Verify:** Test user flow mượt mà

#### 8.4 Testing
- [ ] Test tất cả commands
- [ ] Test conversation flows
- [ ] Test với dữ liệu edge cases
- [ ] Test concurrency (nếu có)
- [ ] Performance test với nhiều data
- **Verify:** Không có bug critical

---

### Phase 9: Documentation & Deployment ⏰ 2-3 giờ

#### 9.1 Documentation
- [ ] Viết README.md đầy đủ
  - [ ] Installation guide
  - [ ] Configuration guide
  - [ ] Commands reference
  - [ ] Troubleshooting
- [ ] Comment code quan trọng
- [ ] Tạo file CHANGELOG.md
- **Verify:** Người khác có thể setup theo hướng dẫn

#### 9.2 Deployment
- [ ] Setup production environment
- [ ] Configure environment variables
- [ ] Setup process manager (PM2)
- [ ] Setup backup cron job
- [ ] Test trên production
- **Verify:** Bot chạy ổn định 24/7

#### 9.3 User Training
- [ ] Tạo video/doc hướng dẫn sử dụng
- [ ] Training giáo viên sử dụng
- [ ] Gather feedback
- **Verify:** Giáo viên sử dụng thành thạo

---

## ⏱ TIMELINE DỰ KIẾN

| Phase | Nội dung | Thời gian | Tích lũy |
|-------|----------|-----------|----------|
| 1 | Setup & Infrastructure | 2-3h | 3h |
| 2 | Quản lý học viên | 4-5h | 8h |
| 3 | Quản lý lịch học | 5-6h | 14h |
| 4 | Tiến độ & Thanh toán | 4-5h | 19h |
| 5 | Xe & Lịch thi | 3-4h | 23h |
| 6 | Nhắc nhở & Tự động hóa | 4-5h | 28h |
| 7 | Báo cáo & Thống kê | 3-4h | 32h |
| 8 | Polish & Testing | 3-4h | 36h |
| 9 | Documentation & Deployment | 2-3h | 39h |

**Tổng thời gian dự kiến: 35-40 giờ (4-5 ngày làm việc)**

---

## 📊 BÁO CÁO TIẾN ĐỘ

### Cập nhật ngày: 14/10/2026 - 21:58

#### ✅ Phase 1: Setup & Infrastructure - HOÀN THÀNH (100%)

**1.1 Setup Project**
- [x] Tạo thư mục dự án
- [x] Init npm project: `npm init -y`
- [x] Install dependencies (telegraf, googleapis, dotenv, node-cron, date-fns)
- [x] Install dev dependencies (nodemon)
- [x] Tạo cấu trúc thư mục
- [x] Setup .gitignore
- [x] Setup .env.example
- [x] Cập nhật package.json với scripts

**1.2 Setup Constants & Config**
- [x] Tạo `src/constants/sheets.js` - định nghĩa sheet names, columns, dropdowns, headers
- [x] Tạo `src/config/index.js` - config cho Telegram & Google Sheets

**1.3 Tạo Google Sheets Database**
- [x] Viết script `scripts/create-sheets.gs` (Google Apps Script)
- [x] Script tự động tạo 8 sheets với cấu trúc đầy đủ
- [x] Setup data validation rules (dropdowns)
- [x] Setup formulas tự động (công nợ, %, VLOOKUP...)
- [x] Auto-resize columns và formatting

**1.4 Documentation**
- [x] Tạo PROJECT_PLAN.md với checklist đầy đủ
- [x] Tạo README.md với hướng dẫn chi tiết:
  - Setup Google Sheets với Apps Script
  - Setup Telegram Bot
  - Setup Google Sheets API (Service Account)
  - Cài đặt và chạy bot
  - Troubleshooting

#### 🚧 Đang thực hiện
- [ ] Phase 2: Core Features - Quản lý học viên

#### ⏭ Sắp triển khai
- [ ] Tạo Google Sheets client (`src/sheets/index.js`)
- [ ] Implement CRUD học viên (`src/sheets/student.js`)
- [ ] Implement bot commands học viên

#### 📝 Ghi chú
- ✅ Chuyển từ Node.js script sang Google Apps Script để setup sheets → đơn giản hơn nhiều!
- ✅ Không cần credentials.json và token.json phức tạp cho việc tạo sheets
- ✅ Cấu trúc project đã hoàn chỉnh, sẵn sàng implement bot

#### ⏱ Thời gian thực tế
- **Phase 1:** ~1.5 giờ (dự kiến: 2-3 giờ) ✅

---

## 🎯 NEXT STEPS

### Bước tiếp theo:
1. ✅ ~~Setup project structure~~ - DONE
2. ✅ ~~Create Google Sheets setup script~~ - DONE  
3. **👉 Người dùng chạy Apps Script để tạo Google Sheets**
4. **👉 Người dùng setup Telegram Bot với @BotFather**
5. **👉 Người dùng tạo Service Account & share Sheets**
6. Implement Phase 2: Bot Commands - Quản lý học viên

### Hành động cần người dùng làm:
1. Làm theo hướng dẫn trong **README.md > BƯỚC 1** để tạo Google Sheets
2. Làm theo **README.md > BƯỚC 2** để setup Telegram Bot
3. Cung cấp thông tin:
   - Bot Token
   - Chat ID
   - Spreadsheet ID
4. Sau đó chúng ta tiếp tục implement bot code

---

## 📞 SUPPORT & CONTACT

- **Developer:** [Tên bạn]
- **Email:** [Email của bạn]
- **Telegram:** [Username Telegram]

---

*Document này sẽ được cập nhật liên tục trong quá trình phát triển.*
