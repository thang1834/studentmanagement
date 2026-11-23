# Lịch sử thay đổi

Số phiên bản là version của tệp triển khai Apps Script đang chạy webhook.

## v47 — 2026-11-23

- Nhiều giáo viên dùng chung bot: `teachers.gs`, tab **GIÁO VIÊN** trong file gốc, mỗi thầy một Google Sheet riêng do `/them_gv` tạo.
- Ngữ cảnh dữ liệu `getDb()` thay cho `getActiveSpreadsheet()` trong toàn bộ hàm lấy sheet.
- Lệnh admin: `/them_gv`, `/ds_gv`, `/xoa_gv`, `/chon_gv`; `/thong_ke` và `/xem_no` tổng hợp toàn trường khi admin ở file gốc.
- Phân quyền: admin theo `ADMIN_IDS` (mặc định `TEST_CHAT_ID`), giáo viên theo tab GIÁO VIÊN.
- Nhắc nhở tự động chạy riêng cho từng thầy; thứ Hai admin nhận tổng hợp công nợ toàn trường.
- `/start` hiện ngữ cảnh dữ liệu; `/help` có mục Admin.
- Test Node `tests/test_teachers.js`.

## v46 — 2026-11-23

- Lệnh `/huy` hủy thao tác đang nhập dở.
- Whitelist kiểm tra theo user ID người gửi thay vì chat ID; người lạ nhận lại ID của mình.

## v45 — 2026-11-23

- Ô ngày kiểu Date lúc 00:00 chỉ hiện ngày (hết đuôi " 00:00" ở ngày sinh, ngày thi).
- Thêm xe trùng biển số bị từ chối.
- `dryRunWebhook` có thêm bước thử thêm xe.

## v44 — 2026-11-22

- Sửa crash khi nhập ngày ở luồng đặt lịch.
- Ba nút Lịch học, Thanh toán, Tiến độ trong chi tiết học viên hoạt động.
- Chức năng Sửa học viên (14 trường) với kiểm tra dữ liệu.
- Báo cáo tài chính đọc đúng cột của tab THANH TOÁN; thống kê dùng đúng trạng thái học viên; công nợ sắp xếp giảm dần.
- Whitelist chat ID; tách tin dài hơn 4096 ký tự; tự gửi lại dạng thường khi Markdown lỗi.
- Tab LỊCH THI chuyển sang cấu trúc 11 cột (`migrateExamSheet`); dropdown loại xe mở rộng.
- Nhắc nhở tự động: 4 trigger (`reminders.gs`).
- Xóa `report.gs` trùng lặp; `showAlert` để các hàm setup chạy được từ trình soạn.
- `dryRunWebhook` chạy khô toàn bộ luồng bot.

## Trước v44

- Bản đầu: quản lý học viên, lịch học, thanh toán, lịch thi, xe tập, thống kê, báo cáo trên Apps Script.
