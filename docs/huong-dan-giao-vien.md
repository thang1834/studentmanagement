# Hướng dẫn cho giáo viên

Bot Telegram giúp bạn quản lý học viên, lịch dạy, học phí, lịch thi và xe tập ngay trên điện thoại. Dữ liệu của bạn nằm trong một Google Sheet riêng, chỉ bạn và admin xem được.

- [1. Bắt đầu](#1-bắt-đầu)
- [2. Cách bot làm việc](#2-cách-bot-làm-việc)
- [3. Học viên](#3-học-viên)
- [4. Lịch học](#4-lịch-học)
- [5. Thu tiền và công nợ](#5-thu-tiền-và-công-nợ)
- [6. Lịch thi](#6-lịch-thi)
- [7. Xe tập](#7-xe-tập)
- [8. Nhắc nhở tự động](#8-nhắc-nhở-tự-động)
- [9. Thống kê và báo cáo](#9-thống-kê-và-báo-cáo)
- [10. Google Sheet của bạn](#10-google-sheet-của-bạn)
- [11. Câu hỏi thường gặp](#11-câu-hỏi-thường-gặp)

---

## 1. Bắt đầu

1. Mở Telegram, tìm bot theo tên admin đưa, bấm **Start** hoặc gõ `/start`.
2. Lần đầu bot sẽ từ chối và trả lại **ID của bạn**. Gửi ID này cho admin.
3. Khi admin đã thêm bạn, gõ `/start` lại. Bot chào và hiện dòng *👨‍🏫 Giáo viên: &lt;tên bạn&gt;*.
4. Gõ `/help` bất cứ lúc nào để xem danh sách lệnh. Menu lệnh cũng có ở nút **/** cạnh ô nhập tin.

---

## 2. Cách bot làm việc

- **Lệnh** bắt đầu bằng `/`, ví dụ `/ds_hv`. Gõ hoặc chọn từ menu.
- **Nút bấm** xuất hiện dưới tin nhắn của bot; bấm để chọn học viên, loại bằng, xác nhận...
- **Hội thoại nhiều bước:** khi thêm học viên, đặt lịch, thu tiền... bot hỏi từng câu, bạn trả lời từng câu. Bot kiểm tra ngay: số điện thoại sai, ngày sai, tiền sai sẽ được yêu cầu nhập lại.
- **Hủy giữa chừng:** gõ `/huy` hoặc bấm nút ❌ Hủy. Sau 30 phút không trả lời, bot tự quên thao tác dở.
- **Gõ nhanh:** ngày nhận `25/12/2026`, `25122026`, `hôm nay`, `ngày mai`; tiền nhận `12tr`, `19 triệu`, `19.000.000`.
- Mã học viên có dạng `HV001`; gõ `/xem_HV001` để mở chi tiết, viết hoa hay thường đều được.

---

## 3. Học viên

### Thêm học viên: `/them_hv`

Bot hỏi lần lượt: họ tên → số điện thoại (10 số) → CMND/CCCD (9–12 số) → ngày sinh → giới tính (nút) → địa chỉ nhà → địa chỉ làm việc → ghi chú địa chỉ → ngày nộp hồ sơ → loại bằng (nút A1…E) → giáo viên phụ trách (bấm **Tôi** hoặc gõ tên) → học phí → số đã đóng. Cuối cùng bot tóm tắt, bạn bấm **Xác nhận** để lưu. Học viên nhận mã `HVxxx`, trạng thái ban đầu *Chờ xử lý hồ sơ*.

Mục nào không có, gõ `-` hoặc bấm **Bỏ qua** khi bot cho phép.

### Danh sách và tìm kiếm

- `/ds_hv`: danh sách có phân trang, bấm vào tên để mở chi tiết.
- `/tim_hv Nguyễn`, `/tim_hv 0901`, `/tim_hv HV00`: tìm theo tên, số điện thoại, CMND hoặc mã.

### Chi tiết học viên: `/xem_HV001`

Hiện đầy đủ thông tin, học phí, đã đóng, còn nợ, kèm các nút:

| Nút | Tác dụng |
|---|---|
| 📅 Lịch học | Các buổi học của học viên này |
| 💰 Thanh toán | Các lần đã thu tiền |
| 📊 Tiến độ | Số buổi đã học / tổng số buổi |
| ✏️ Sửa | Chọn một trong 14 trường (họ tên, SĐT, địa chỉ, loại bằng, trạng thái, học phí, ghi chú...) rồi nhập giá trị mới hoặc chọn nút |
| 🗑️ Xóa | Hỏi xác nhận trước khi xóa hẳn |

Trạng thái học viên có 5 mức: *Chờ xử lý hồ sơ → Đang học → Chờ thi → Đã tốt nghiệp*, hoặc *Bỏ học*. Đổi bằng nút **Sửa → Trạng thái**.

Số *Đã đóng* không sửa tay được qua bot; dùng `/thu_tien` để sheet thanh toán và công nợ luôn khớp nhau.

---

## 4. Lịch học

### Đặt lịch: `/dat_lich`

5 bước: chọn học viên (nút) → ngày học → giờ bắt đầu (`08:00`) → giờ kết thúc → loại buổi học (Lý thuyết / Thực hành / Sa hình). Bot có thể hỏi thêm ghi chú, bấm **Bỏ qua** nếu không cần.

### Xem lịch

- `/lich_hom_nay`: các buổi hôm nay theo giờ.
- `/lich_tuan`: cả tuần này.
- Trong chi tiết học viên bấm **📅 Lịch học** để xem lịch của riêng người đó.

Trạng thái buổi học (*Chưa học / Đã học / Hủy / Nghỉ có phép*) hiện tại chỉnh trong Google Sheet, tab **LỊCH HỌC**, cột *Trạng thái*. Bot nhắc lịch chỉ với buổi *Chưa học*.

---

## 5. Thu tiền và công nợ

### Thu học phí: `/thu_tien`

3 bước: chọn học viên → số tiền (`5tr`, `5 triệu`, `5000000`) → hình thức (Tiền mặt / Chuyển khoản), sau đó bot hỏi ghi chú (bấm **Bỏ qua** nếu không cần). Bot ghi một giao dịch vào tab **THANH TOÁN**, cộng vào *Đã đóng* và trừ *Còn nợ* của học viên ngay lập tức.

### Công nợ: `/xem_no`

Danh sách học viên còn nợ, nợ nhiều xếp trước, kèm tổng công nợ. Mỗi sáng thứ Hai bot tự gửi bản tổng kết này cho bạn.

---

## 6. Lịch thi

- `/dat_lich_thi`: chọn học viên → loại thi (Lý thuyết / Thực hành / Sát hạch) → ngày thi → giờ thi (có thể bỏ qua) → địa điểm (có thể bỏ qua).
- `/ds_thi`: các kỳ thi sắp tới xếp theo ngày, kèm trạng thái *Chưa thi*.
- Kết quả thi (*Đạt / Không đạt / Vắng mặt*) nhập trong Google Sheet, tab **LỊCH THI**, cột *Kết quả*; `/thong_ke` sẽ tính tỷ lệ đạt.

---

## 7. Xe tập

- `/them_xe`: biển số (bot từ chối nếu trùng xe đã có) → loại bằng phù hợp → loại xe (số sàn, tự động, xe ga...).
- `/ds_xe`: danh sách xe, trạng thái, km hiện tại.
- Km hiện tại, mốc bảo dưỡng, ngày đăng kiểm cập nhật trong tab **QUẢN LÝ XE**; bot dùng các cột này để nhắc bảo dưỡng và đăng kiểm.

---

## 8. Nhắc nhở tự động

Bot tự nhắn cho bạn, không cần làm gì thêm:

| Khi nào | Nội dung |
|---|---|
| Trước buổi học 30 phút | Học viên, giờ, loại buổi, ghi chú |
| Thứ Hai 9:00 | Tổng kết công nợ tuần |
| 8:00 hằng ngày | Xe còn dưới 500 km đến hạn bảo dưỡng |
| Ngày 1 hằng tháng | Xe sắp hết hạn hoặc quá hạn đăng kiểm |

Mỗi tin nhắc chỉ gửi một lần trong ngày cho cùng một đối tượng. Giờ gửi có thể lệch trong vòng một giờ do cơ chế hẹn giờ của Google.

---

## 9. Thống kê và báo cáo

- `/thong_ke`: tổng quan học viên theo trạng thái, lịch hôm nay / tuần / tháng, tài chính (tổng học phí, đã thu, còn nợ, tỷ lệ thu), xe, kỳ thi.
- `/bao_cao`: chọn một trong 5 báo cáo chi tiết: học viên, tài chính tháng này (theo hình thức thanh toán), lịch học, kỳ thi, xe tập.

---

## 10. Google Sheet của bạn

Admin có thể chia sẻ Google Sheet riêng của bạn qua email. Trong đó:

- 8 tab: **THÔNG TIN HỌC VIÊN, LỊCH HỌC, TIẾN ĐỘ HỌC TẬP, THANH TOÁN, QUẢN LÝ XE, LỊCH THI, NHẮC NHỞ, BÁO CÁO THỐNG KÊ**.
- Sửa trực tiếp trong Sheet được, bot đọc dữ liệu mới ngay. Nên dùng Sheet cho các việc bot chưa hỗ trợ: đổi trạng thái buổi học, nhập kết quả thi, cập nhật km xe, ghi chi phí (loại *Chi*) trong tab THANH TOÁN.
- **Không đổi tên tab, không xóa hay chèn cột, không sửa dòng tiêu đề**: bot đọc theo vị trí cột.
- Ô ngày nên nhập dạng `dd/mm/yyyy`.

---

## 11. Câu hỏi thường gặp

**Bot báo "Bạn không có quyền sử dụng bot này".** Bạn chưa được admin thêm hoặc đã bị khóa. Gửi ID trong tin đó cho admin.

**Tôi gõ nhầm giữa chừng.** Gõ `/huy` rồi bắt đầu lại. Dữ liệu chỉ được lưu khi bạn xác nhận ở bước cuối.

**Tôi nhập số tiền mà bot không hiểu.** Dùng `12tr`, `12 triệu` hoặc số nguyên `12000000`. Không dùng dấu phẩy thập phân.

**Có thể dùng bot trong nhóm Telegram không?** Có, nhưng chỉ người đã được cấp phép ra lệnh được; người khác trong nhóm nhận thông báo từ chối.

**Dữ liệu của tôi ai xem được?** Bạn qua bot (và qua Google Sheet nếu admin chia sẻ), admin, và những ai admin chia sẻ Sheet cho. Giáo viên khác không thấy dữ liệu của bạn.

**Tôi muốn đổi học phí đã nhập sai.** Mở `/xem_HVxxx` → **Sửa** → **Học phí**. Số đã đóng thì sửa trong tab THANH TOÁN của Sheet.
