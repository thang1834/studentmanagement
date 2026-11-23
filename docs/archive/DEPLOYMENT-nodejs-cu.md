# 🚀 HƯỚNG DẪN DEPLOYMENT - BOT QUẢN LÝ HỌC VIÊN

**Version:** 1.0.0  
**Last Updated:** 14/10/2026  
**Author:** Claude Code

---

## 📋 YÊU CẦU HỆ THỐNG

### Môi trường
- **Node.js:** >= 16.x (khuyến nghị 18.x hoặc 20.x)
- **npm:** >= 8.x
- **Internet:** Stable connection cho Google Sheets API & Telegram
- **OS:** Windows, macOS, Linux

### Tài khoản cần thiết
- ✅ Google Account (để tạo Sheets & Service Account)
- ✅ Telegram Account (để tạo bot)
- ✅ Google Cloud Project (free tier OK)

---

## 🔧 BƯỚC 1: SETUP GOOGLE SHEETS

### 1.1. Tạo Google Sheet
1. Truy cập [sheets.google.com](https://sheets.google.com)
2. Tạo **Spreadsheet mới**
3. Đặt tên: `Quản lý học viên - [Tên trung tâm]`
4. **Copy Spreadsheet ID** từ URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```

### 1.2. Chạy Apps Script để tạo sheets
1. Trong Google Sheet, click **Extensions → Apps Script**
2. Xóa code mặc định
3. Copy toàn bộ nội dung từ `scripts/create-sheets.gs`
4. Paste vào Apps Script editor
5. Click **💾 Save** → đặt tên project: `Setup Sheets`
6. Click **▶️ Run** → chọn function `setupAllSheets`
7. **Authorize:** Click "Review permissions" → chọn Google account → "Allow"
8. Chờ ~10 giây → script tạo 8 sheets tự động
9. Refresh Google Sheet → kiểm tra đã có 8 tabs:
   - THÔNG TIN HỌC VIÊN
   - LỊCH HỌC
   - TIẾN ĐỘ HỌC TẬP
   - THANH TOÁN
   - QUẢN LÝ XE
   - LỊCH THI
   - NHẮC NHỞ
   - BÁO CÁO THỐNG KÊ

✅ **Google Sheets sẵn sàng!**

---

## 🤖 BƯỚC 2: TẠO TELEGRAM BOT

### 2.1. Tạo bot với BotFather
1. Mở Telegram → tìm `@BotFather`
2. Gửi `/newbot`
3. Nhập tên bot: `Quản lý học viên [Tên bạn]`
4. Nhập username: `ten_trung_tam_bot` (phải kết thúc bằng `bot`)
5. **Copy Bot Token** (dạng `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2.2. Cấu hình bot
```
/setdescription
Bot quản lý học viên cho trung tâm dạy lái xe

/setabouttext
Bot hỗ trợ giáo viên quản lý học viên, lịch học, thanh toán, xe, và kỳ thi.

/setcommands
start - Bắt đầu
help - Hướng dẫn
them_hv - Thêm học viên
ds_hv - Danh sách học viên
dat_lich - Đặt lịch học
lich_hom_nay - Lịch hôm nay
thu_tien - Thu tiền
thong_ke - Thống kê
bao_cao - Báo cáo tổng quan
```

### 2.3. Lấy Chat ID của giáo viên
1. Mở bot vừa tạo trong Telegram
2. Gửi `/start`
3. Mở trình duyệt, truy cập:
   ```
   https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
   ```
   Thay `<BOT_TOKEN>` bằng token của bạn
4. Tìm `"chat":{"id":123456789}` → copy số `123456789`
5. Đây là **TEACHER_CHAT_ID**

✅ **Telegram Bot sẵn sàng!**

---

## 🔑 BƯỚC 3: SETUP GOOGLE CLOUD SERVICE ACCOUNT

### 3.1. Tạo Project
1. Truy cập [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project** → **NEW PROJECT**
3. Project name: `Bot học viên`
4. Click **CREATE**

### 3.2. Enable Google Sheets API
1. Trong project vừa tạo, click **☰ Menu** → **APIs & Services** → **Library**
2. Tìm `Google Sheets API`
3. Click **ENABLE**

### 3.3. Tạo Service Account
1. **☰ Menu** → **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **Service Account**
3. Service account name: `bot-sheets-access`
4. Click **CREATE AND CONTINUE**
5. Role: chọn **Basic → Editor**
6. Click **CONTINUE** → **DONE**

### 3.4. Tạo Key
1. Click vào service account vừa tạo
2. Tab **KEYS** → **ADD KEY** → **Create new key**
3. Key type: **JSON**
4. Click **CREATE** → file JSON tự động download
5. **Rename** file thành `credentials.json`
6. **Di chuyển** file vào thư mục project

### 3.5. Chia sẻ Google Sheet với Service Account
1. Mở file `credentials.json` → tìm `"client_email": "bot-sheets-access@..."`
2. Copy email này
3. Mở Google Sheet → click **Share**
4. Paste email vào → role: **Editor**
5. **Bỏ tick** "Notify people" (không cần gửi email)
6. Click **Share**

✅ **Service Account sẵn sàng!**

---

## 💻 BƯỚC 4: SETUP PROJECT

### 4.1. Clone/Download code
```bash
# Nếu có git
git clone <repository_url>
cd studentmanagement

# Hoặc download ZIP và giải nén
```

### 4.2. Install dependencies
```bash
npm install
```

### 4.3. Tạo file .env
```bash
# Copy từ template
cp .env.example .env

# Hoặc tạo file .env mới
```

**Nội dung file .env:**
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_TEACHER_CHAT_ID=123456789

# Google Sheets
GOOGLE_SPREADSHEET_ID=1abc...xyz
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
```

**Thay thế:**
- `TELEGRAM_BOT_TOKEN`: token từ BotFather
- `TELEGRAM_TEACHER_CHAT_ID`: chat ID từ bước 2.3
- `GOOGLE_SPREADSHEET_ID`: spreadsheet ID từ bước 1.1

### 4.4. Kiểm tra credentials.json
```bash
# Đảm bảo file tồn tại
ls credentials.json

# Nên thấy: credentials.json
```

✅ **Project setup hoàn tất!**

---

## 🚀 BƯỚC 5: CHẠY BOT

### 5.1. Test mode (Development)
```bash
npm run dev
```

**Kiểm tra output:**
```
🚀 Starting bot...
📊 Connecting to Google Sheets...
✅ Google Sheets connected
✅ Bot started: @ten_trung_tam_bot
📱 Teacher Chat ID: 123456789
📊 Spreadsheet ID: 1abc...xyz
✅ Bot is running...
Press Ctrl+C to stop
🔔 Starting scheduler service...
✅ Scheduler service started
📅 Schedule reminders: every 15 minutes
💰 Debt reminders: Monday 9:00 AM
🔧 Maintenance check: daily 8:00 AM
🔍 Inspection check: 1st of month 8:00 AM
```

**Telegram sẽ nhận message:**
```
✅ Bot đã khởi động thành công!

🔔 Hệ thống nhắc nhở tự động đã bật.

Gõ /start để bắt đầu.
```

### 5.2. Test commands
Trong Telegram, thử các lệnh:
```
/start
/help
/them_hv
/ds_xe
/thong_ke
```

✅ **Bot hoạt động!**

---

## 📦 BƯỚC 6: PRODUCTION DEPLOYMENT

### Option 1: VPS/Server (Khuyến nghị)

#### 6.1. Chọn VPS
- **DigitalOcean:** $5/tháng
- **Vultr:** $5/tháng
- **AWS EC2:** Free tier 12 tháng
- **Google Cloud:** $300 credit

#### 6.2. Setup trên Ubuntu Server
```bash
# SSH vào server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify
node --version  # v20.x.x
npm --version   # 10.x.x

# Install PM2 (process manager)
npm install -g pm2

# Clone project
git clone <repo> /opt/bot
cd /opt/bot

# Install dependencies
npm install --production

# Copy .env và credentials.json từ local
# Sử dụng scp hoặc upload manually
```

#### 6.3. Chạy với PM2
```bash
# Start bot
pm2 start npm --name "bot-hoc-vien" -- start

# Check status
pm2 status

# View logs
pm2 logs bot-hoc-vien

# Auto-restart on system reboot
pm2 startup
pm2 save
```

#### 6.4. Monitor
```bash
# Real-time logs
pm2 logs bot-hoc-vien --lines 100

# Restart
pm2 restart bot-hoc-vien

# Stop
pm2 stop bot-hoc-vien
```

### Option 2: Heroku (Free tier phải wake up)
```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create bot-hoc-vien

# Set env vars
heroku config:set TELEGRAM_BOT_TOKEN=...
heroku config:set TELEGRAM_TEACHER_CHAT_ID=...
heroku config:set GOOGLE_SPREADSHEET_ID=...

# Add credentials.json content as env
cat credentials.json | base64
heroku config:set GOOGLE_CREDENTIALS_BASE64="<output>"

# Update config/index.js to decode base64
# Deploy
git push heroku main
```

### Option 3: Railway (Recommended cho beginners)
1. Truy cập [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub**
3. Connect repository
4. Add Environment Variables:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_TEACHER_CHAT_ID`
   - `GOOGLE_SPREADSHEET_ID`
   - `GOOGLE_CREDENTIALS_BASE64` (base64 của credentials.json)
5. Deploy tự động

✅ **Bot chạy 24/7!**

---

## 🔒 BẢO MẬT

### ✅ Checklist
- [x] File `.env` trong `.gitignore`
- [x] File `credentials.json` trong `.gitignore`
- [x] Không commit tokens/keys lên Git
- [x] Service Account chỉ có quyền Editor trên 1 sheet
- [x] Bot token không chia sẻ công khai
- [x] Teacher chat ID private

### ⚠️ Nếu lộ token
1. **Telegram:** Revoke token tại @BotFather → `/token` → `/revoke`
2. **Google:** Xóa service account → tạo mới
3. Update `.env` với credentials mới
4. Restart bot

---

## 🔄 BACKUP & RECOVERY

### Backup tự động Google Sheets
1. Google Sheets tự động lưu version history
2. **File → Version history → See version history**
3. Restore bất kỳ version nào

### Backup thủ công
```bash
# Export toàn bộ data
# File → Download → Microsoft Excel (.xlsx)
```

### Recovery
1. Nếu xóa nhầm data → restore từ version history
2. Nếu xóa sheet → chạy lại Apps Script `setupAllSheets`
3. Nếu corrupt → import từ backup .xlsx

---

## 📊 MONITORING

### Check Bot Health
```bash
# PM2 dashboard
pm2 monit

# Logs
pm2 logs --lines 200
```

### Metrics quan trọng
- ✅ Bot uptime: pm2 status
- ✅ Error rate: check logs cho "❌ Error"
- ✅ API latency: Google Sheets response time
- ✅ Memory usage: pm2 monit

### Alerts
Nhận thông báo khi bot down:
```bash
# Setup PM2 monitoring (optional)
pm2 install pm2-server-monit
```

---

## 🆘 TROUBLESHOOTING

### Bot không khởi động
```
❌ Error: Cannot find module
→ npm install

❌ Google Sheets connection failed
→ Check credentials.json path
→ Check spreadsheet ID
→ Check service account permissions

❌ Telegram error 401
→ Check bot token
→ Revoke & recreate nếu cần
```

### Bot crash giữa chừng
```bash
# Check logs
pm2 logs bot-hoc-vien --err

# Common issues:
# - Out of memory → upgrade VPS
# - Google API quota → wait 1 phút
# - Network timeout → check internet
```

### Commands không hoạt động
```
# Restart bot
pm2 restart bot-hoc-vien

# Clear session
# Gửi /start trong Telegram
```

---

## 📈 SCALING

### Khi nào cần scale?
- Trên 100 học viên active
- Trên 500 schedules/tháng
- Response time > 5 giây

### Cách scale
1. **Upgrade VPS:** More RAM & CPU
2. **Cache data:** Redis cho frequently accessed data
3. **Database:** Chuyển từ Sheets sang PostgreSQL
4. **Load balancer:** Multiple bot instances

---

## ✅ CHECKLIST DEPLOYMENT HOÀN CHỈNH

- [ ] Google Sheet tạo và có 8 tabs
- [ ] Service Account có quyền Editor
- [ ] Telegram Bot token valid
- [ ] Teacher Chat ID correct
- [ ] File .env configured
- [ ] credentials.json in project root
- [ ] npm install success
- [ ] Bot starts without errors
- [ ] /start command works
- [ ] Scheduler logs show "✅ started"
- [ ] First reminder scheduled
- [ ] PM2 running (production)
- [ ] Auto-restart enabled
- [ ] Logs monitored

---

**🎉 DEPLOYMENT HOÀN TẤT!**

Bot giờ đã chạy 24/7 và sẵn sàng quản lý học viên.

**Support:** Xem README.md hoặc PROJECT_PLAN.md để biết thêm chi tiết.
