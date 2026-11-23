# 📚 HƯỚNG DẪN SỬ DỤNG - BOT QUẢN LÝ HỌC VIÊN

**Dành cho:** Giáo viên dạy lái xe  
**Phiên bản:** 1.0.0  
**Cập nhật:** 14/10/2026

---

## 🎯 GIỚI THIỆU

Bot Telegram giúp giáo viên quản lý:
- 👥 Học viên (thêm, sửa, xóa, tìm kiếm)
- 📅 Lịch học (đặt lịch, xem lịch, hoàn thành)
- 💰 Thanh toán & công nợ
- 📊 Tiến độ học tập
- 🚗 Xe (thêm, cập nhật km, bảo dưỡng)
- 📝 Kỳ thi (tạo, đăng ký, kết quả)
- 🔔 Nhắc nhở tự động
- 📈 Báo cáo & thống kê

---

## 🚀 BẮT ĐẦU

### Khởi động bot
```
/start
```

Sẽ thấy menu chính với các nhóm lệnh.

### Xem hướng dẫn
```
/help
```

Hiển thị tất cả lệnh có sẵn.

---

## 👥 QUẢN LÝ HỌC VIÊN

### Thêm học viên mới
```
/them_hv
```

**Bot sẽ hỏi lần lượt:**
1. Họ tên
2. Số điện thoại (10 số)
3. Số CMND/CCCD (9-12 số)
4. Ngày sinh (DD/MM/YYYY)
5. Giới tính (chọn từ nút)
6. Địa chỉ nhà (để đón)
7. Địa chỉ làm việc (optional - gõ "skip")
8. Ghi chú địa chỉ (optional)
9. Ngày nộp hồ sơ
10. Loại bằng (chọn từ nút)
11. Tên giáo viên
12. Học phí
13. Đã đóng
14. Xác nhận

**Mã học viên tự động:** HV001, HV002, HV003...

**Ví dụ:**
```
Tên: Nguyễn Văn A
SĐT: 0987654321
CMND: 123456789
Ngày sinh: 15/03/1995
Giới tính: Nam
Địa chỉ nhà: 123 Đường ABC, Q1
Địa chỉ công ty: skip
Ghi chú: Gần chợ Bến Thành
Ngày nộp HS: 01/10/2026
Loại bằng: B1
Giáo viên: Thầy Hùng
Học phí: 5000000
Đã đóng: 2000000
```

### Xem danh sách học viên
```
/ds_hv
```

Hiển thị 10 học viên/trang. Dùng nút **[Trang sau]** để xem tiếp.

### Tìm kiếm học viên
```
/tim_hv Nguyễn Văn A
/tim_hv 0987654321
/tim_hv HV001
```

Tìm theo: tên, số điện thoại, hoặc mã HV.

### Xem chi tiết học viên
```
/xem_hv HV001
```

Hiển thị đầy đủ thông tin + các nút:
- ✏️ **Sửa:** Sửa thông tin
- 💰 **Thu tiền:** Ghi nhận thanh toán
- 📊 **Tiến độ:** Xem tiến độ học tập
- 📅 **Lịch học:** Xem lịch của HV
- 🗑 **Xóa:** Xóa học viên (có confirm)

### Xóa học viên
```
/xoa_hv HV001
```

⚠️ **Lưu ý:** Xóa vĩnh viễn, cần xác nhận.

### Xem học viên có nợ
```
/xem_no
```

Danh sách sắp xếp theo số nợ giảm dần.

---

## 📅 QUẢN LÝ LỊCH HỌC

### Đặt lịch học mới
```
/dat_lich
```

**Bot sẽ hỏi:**
1. Tìm học viên (nhập tên hoặc mã)
2. Chọn học viên từ danh sách
3. Nhập ngày học (DD/MM/YYYY)
4. Giờ bắt đầu (HH:MM)
5. Giờ kết thúc (HH:MM)
6. Chọn buổi học (Sáng/Chiều/Tối)
7. Nội dung dạy
8. **Bot tự động gợi ý xe** phù hợp với loại bằng
9. Chọn xe
10. Tên giáo viên
11. Xác nhận

**Gợi ý xe thông minh:**
- Bằng B1 → Xe số sàn
- Bằng B2 → Xe số tự động
- Bằng A1/A2 → Xe máy

**Bot kiểm tra xe rảnh/bận** tự động.

### Xem lịch hôm nay
```
/lich_hom_nay
```

Hiển thị:
- Trạng thái (Đã đặt/Hoàn thành/Hủy)
- Thời gian
- Học viên, SĐT
- Loại bằng
- Nội dung
- Địa chỉ đón
- Xe

### Xem lịch tuần
```
/lich_tuan
```

Lịch 7 ngày tới, group theo ngày.

### Xem lịch của học viên
```
/lich_hv HV001
```

Tất cả lịch của 1 học viên.

### Hủy lịch
```
/huy_lich LH001
```

Cần xác nhận trước khi hủy.

### Hoàn thành buổi học
```
/hoan_thanh LH001
```

Đánh dấu buổi học đã xong.

### Đánh giá buổi học
```
/danh_gia LH001
```

Nhập đánh giá về buổi học (tự do).

---

## 💰 THANH TOÁN & CÔNG NỢ

### Thu tiền
```
/thu_tien HV001
```

**Bot sẽ hỏi:**
1. Số tiền thu
2. Phương thức (Tiền mặt/Chuyển khoản)
3. Người thu
4. Xác nhận

**Bot tự động:**
- Tạo mã thanh toán (TT001, TT002...)
- Cập nhật cột "Đã đóng" của học viên
- Tính lại công nợ

⚠️ **Warning:** Nếu thu > công nợ (prepayment OK).

### Xem công nợ chi tiết
```
/cong_no HV001
```

Hiển thị:
- Học phí
- Đã đóng
- Còn nợ
- Lịch sử thanh toán

### Xem công nợ tất cả
```
/xem_no
```

Danh sách HV có nợ, sort giảm dần.

---

## 📊 TIẾN ĐỘ HỌC TẬP

### Xem tiến độ
```
/tien_do HV001
```

Hiển thị:
- Progress bar visual (████░░░░)
- Giờ học: 15/30 giờ
- 8 kỹ năng với checkbox (✅/⬜)
- Kết quả thi (nếu có)
- Nút **[Cập nhật kỹ năng]** và **[Kết quả thi]**

**8 kỹ năng:**
1. Khởi động - Dừng xe
2. Sang số - Phanh
3. Vào cua
4. Đỗ xe song song
5. Đỗ xe dọc
6. Lùi xe
7. Lên dốc
8. Vượt chướng ngại vật

### Cập nhật kỹ năng
Click nút **[Cập nhật kỹ năng]** → chọn kỹ năng → toggle ✅/⬜

### Nhập kết quả thi
Click nút **[Kết quả thi]** → nhập:
- Lý thuyết: Đạt/Không đạt + điểm
- Thực hành: Đạt/Không đạt

**Bot tự động:** Nếu cả 2 đạt → đổi status sang "Đã tốt nghiệp"

---

## 🚗 QUẢN LÝ XE

### Xem danh sách xe
```
/ds_xe
```

Hiển thị tất cả xe với status icon:
- ✅ Đang dùng
- 🔧 Bảo trì
- ❌ Ngừng hoạt động

### Thêm xe mới
```
/them_xe
```

**Bot sẽ hỏi:**
1. Biển số (VD: 51A-12345)
2. Loại bằng phù hợp (A1/A2/B1/B2/C/D/E)
3. Loại hộp số (chọn từ nút)
4. Hãng xe
5. Model
6. Năm sản xuất
7. Km hiện tại
8. Chi phí/tháng
9. Xác nhận

### Xem chi tiết xe
```
/xem_xe 51A-12345
```

Hiển thị + các nút:
- ✏️ **Sửa**
- 📊 **Cập nhật km**
- 🔧 **Bảo dưỡng**
- 🗑 **Xóa**

### Cập nhật km
```
/cap_nhat_km 51A-12345
```

Nhập km mới → cập nhật.

### Xe cần bảo dưỡng
```
/bd_xe
```

Liệt kê xe còn < 500km đến hạn bảo dưỡng.

### Kiểm tra đăng kiểm
```
/kiem_tra_dk
```

Liệt kê xe hết hạn hoặc sắp hết hạn đăng kiểm.

### Xóa xe
```
/xoa_xe 51A-12345
```

Cần xác nhận.

---

## 📝 QUẢN LÝ KỲ THI

### Tạo kỳ thi
```
/tao_ky_thi
```

**Bot sẽ hỏi:**
1. Ngày thi (DD/MM/YYYY)
2. Loại thi (Lý thuyết/Thực hành)
3. Địa điểm
4. Giờ tập trung
5. Xác nhận

**Mã kỳ thi tự động:** KT001, KT002...

### Xem danh sách kỳ thi
```
/ds_ky_thi
```

Chỉ hiển thị kỳ thi sắp tới, sort theo ngày.

### Xem chi tiết kỳ thi
```
/xem_ky_thi KT001
```

Hiển thị:
- Thông tin cơ bản
- Thống kê (đã đăng ký, đã thi, đạt, tỷ lệ)
- Danh sách HV
- Nút **[Đăng ký HV]**, **[Kết quả]**, **[Xóa]**

### Đăng ký học viên thi
```
/dang_ky_thi HV001 KT001
```

**Bot tự động:**
- Check HV & kỳ thi tồn tại
- Check duplicate
- Thêm vào danh sách

### Hủy đăng ký
```
/huy_dang_ky_thi HV001 KT001
```

Cần xác nhận.

### Nhập kết quả thi
```
/ket_qua_thi KT001
```

**Bot sẽ hỏi:**
1. Số HV đã thi
2. Số HV đạt
3. Tóm tắt kết quả (optional)

**Bot tự động tính tỷ lệ đậu.**

### Xóa kỳ thi
```
/xoa_ky_thi KT001
```

Cần xác nhận.

---

## 🔔 NHẮC NHỞ

### Nhắc nhở tự động (không cần làm gì)

**Bot tự động nhắc:**

1. **Lịch học** (mỗi 15 phút)
   - Nhắc trước 30 phút
   - Hiển thị đầy đủ: HV, SĐT, xe, địa chỉ đón

2. **Công nợ** (Thứ 2, 9:00 AM)
   - Danh sách HV có nợ
   - Group theo mức: Cao/Trung bình/Thấp

3. **Bảo dưỡng xe** (mỗi ngày, 8:00 AM)
   - Xe còn < 500km đến hạn

4. **Đăng kiểm xe** (đầu tháng, 8:00 AM)
   - Xe hết hạn hoặc sắp hết hạn

### Xem nhắc nhở hôm nay
```
/nhan_nho
```

### Tạo nhắc nhở tùy chỉnh
```
/tao_nhan_nho
```

**Bot sẽ hỏi:**
1. Tiêu đề
2. Mô tả (optional - gõ "skip")
3. Ngày nhắc (DD/MM/YYYY)
4. Giờ nhắc (HH:MM) (optional - gõ "skip")

**Ví dụ:**
```
Tiêu đề: Họp phụ huynh
Mô tả: Thảo luận chương trình học
Ngày: 20/10/2026
Giờ: 14:00
```

### Xem tất cả nhắc nhở
```
/ds_nhan_nho
```

### Xóa nhắc nhở
```
/xoa_nhan_nho NH001
```

---

## 📊 BÁO CÁO & THỐNG KÊ

### Thống kê nhanh
```
/thong_ke
```

Hiển thị:
- Số lượng HV theo status
- Tài chính tháng hiện tại (thu/chi/lợi nhuận)
- Tổng công nợ

### Báo cáo tổng quan
```
/bao_cao
```

**Toàn bộ hệ thống:**
- HV theo status & loại bằng
- Lịch học (hoàn thành/đã đặt/hủy)
- Tài chính (thu/chi/lợi nhuận/nợ)
- Xe theo status
- Kỳ thi & tỷ lệ đậu

### Báo cáo theo tháng
```
/bao_cao_thang              # Tháng hiện tại
/bao_cao_thang 10 2026      # Tháng 10/2026
```

Hiển thị:
- Tài chính tháng đó
- Lịch học & tỷ lệ hoàn thành

### Tỷ lệ đậu thi
```
/ty_le_dau                  # Tất cả
/ty_le_dau 10 2026          # Tháng 10/2026
```

Phân tích:
- Tổng quát
- Lý thuyết
- Thực hành

### Báo cáo doanh thu
```
/doanh_thu 01/10/2026 14/10/2026
```

Hiển thị:
- Thu/chi/lợi nhuận
- Breakdown theo danh mục
- Số giao dịch

---

## 💡 MẸO SỬ DỤNG

### 1. Workflow đặt lịch
```
/them_hv → thêm HV
/dat_lich → đặt lịch (bot gợi ý xe tự động)
/lich_hom_nay → xem lịch ngày
/hoan_thanh → đánh dấu xong
/danh_gia → nhập đánh giá
```

### 2. Workflow thu tiền
```
/xem_no → xem ai còn nợ
/thu_tien HV001 → thu tiền
/cong_no HV001 → kiểm tra lại
```

### 3. Workflow quản lý tiến độ
```
/tien_do HV001 → xem tiến độ
[Cập nhật kỹ năng] → tick kỹ năng đã học
[Kết quả thi] → nhập kết quả
→ Bot tự động đổi status "Đã tốt nghiệp"
```

### 4. Workflow kỳ thi
```
/tao_ky_thi → tạo kỳ thi
/dang_ky_thi HV001 KT001 → đăng ký từng HV
/xem_ky_thi KT001 → xem danh sách
/ket_qua_thi KT001 → nhập kết quả sau thi
```

---

## ❓ FAQ

**Q: Làm sao biết mã học viên?**  
A: Dùng `/ds_hv` hoặc `/tim_hv <tên>` để xem.

**Q: Có thể sửa thông tin HV không?**  
A: Có, dùng `/xem_hv HV001` → nút **[Sửa]**.

**Q: Bot nhắc trước bao lâu?**  
A: Lịch học nhắc trước 30 phút.

**Q: Nhắc công nợ khi nào?**  
A: Mỗi thứ 2 lúc 9:00 AM.

**Q: Xe gợi ý sai loại?**  
A: Check loại bằng của HV và loại xe trong sheet QUẢN LÝ XE.

**Q: Thu tiền nhiều hơn nợ?**  
A: OK, bot warning nhưng cho phép (prepayment).

**Q: Xóa nhầm HV?**  
A: Vào Google Sheets → File → Version history → Restore.

**Q: Bot không trả lời?**  
A: Kiểm tra bot có đang chạy không (VPS/server).

**Q: Làm sao export data?**  
A: Google Sheets → File → Download → Excel.

---

## 📞 HỖ TRỢ

Nếu gặp lỗi:
1. Thử gửi `/start` để reset
2. Restart bot (nếu tự host)
3. Xem logs để debug
4. Liên hệ admin

---

**🎉 Chúc sử dụng hiệu quả!**

Bot sẽ giúp tiết kiệm thời gian quản lý và tập trung vào việc dạy học.
