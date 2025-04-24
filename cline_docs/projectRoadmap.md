# Project Roadmap: Tarot Website Backend

## High-Level Goals
- [ ] Xây dựng một backend API ổn định, bảo mật và có khả năng mở rộng cho ứng dụng web Tarot.
- [ ] Cung cấp các endpoint cần thiết để quản lý người dùng, lá bài Tarot, trải bài, tử vi, và thanh toán.
- [ ] Đảm bảo hiệu suất tốt và trải nghiệm người dùng mượt mà.

## Key Features (MVP - Minimum Viable Product)

### Module 1: Quản Lý Người Dùng (Ưu tiên cao)
- [x] Thiết lập project, cấu trúc thư mục, DB cơ bản.
- [x] API Đăng ký (`/register`)
- [x] API Đăng nhập (`/login`)
- [x] Middleware xác thực JWT (`authMiddleware.protect`)
- [x] API Lấy thông tin cá nhân (`/me`)
- [x] API Cập nhật thông tin cá nhân (`/update-profile`)
- [x] API Đổi mật khẩu (`/change-password`)
- [x] API Quên mật khẩu (`/forgot-password`)
- [x] API Đặt lại mật khẩu (`/reset-password/:resetToken`)
- [x] Phân quyền cơ bản (user, admin) (`authMiddleware.restrictTo`) - *Đã kiểm tra và xác nhận*
- [x] API Làm mới token (`/refresh-token`) - *Đã triển khai logic cơ bản*
- [x] API Đăng xuất (`/logout`) - *Đã triển khai*

### Module 2: Quản Lý Bài Tarot (Ưu tiên cao)
- [x] Model `Card`
- [x] API Lấy danh sách tất cả lá bài (`/cards`)
- [x] API Lấy thông tin chi tiết lá bài (`/cards/:id`)
- [x] API Lấy bài theo bộ (`/cards/deck/:deckName`) - *Đã triển khai*
- [x] API Lấy bài theo loại (`/cards/type/:cardType`) - *Đã triển khai*
- [x] Chức năng CRUD cho Card (Admin) - *Đã xem xét và xác nhận*

### Module 3: Hệ Thống Đọc Bài (Ưu tiên cao)
- [x] Model `Reading`
- [x] API Tạo lần đọc bài mới (`/readings`) - *Service logic cơ bản đã có*
- [x] API Lấy kết quả đọc bài (`/readings/:id`)
- [x] API Lấy lịch sử đọc bài (`/readings/history`)
- [x] API Lấy danh sách các kiểu trải bài (`/readings/spreads`) - *Đã có danh sách cứng*
- [x] API Thêm giải nghĩa (Reader) (`/readings/reader/:id/interpret`) - *Service logic đã có*
- [x] API Thêm feedback (User) (`/readings/:id/feedback`) - *Service logic đã có*
- [x] Chức năng CRUD cho Reading (Admin) - *Đã triển khai R/U/D*

### Module 4: Tích Hợp Astrology (Ưu tiên trung bình)
- [x] Model `Zodiac`, `Horoscope`
- [x] API Lấy thông tin cung hoàng đạo (`/astrology/signs/:sign`)
- [x] API Lấy tử vi (`/astrology/:sign`) - *Đã triển khai (logic trong model)*
- [x] API Lấy tương hợp cung hoàng đạo (`/astrology/compatibility/:sign1/:sign2`) - *Đã triển khai*
- [x] API Lấy liên kết Tarot (`/astrology/tarot-relation/:sign`) - *Đã triển khai*
- [x] Chức năng CRUD cho Horoscope (Admin) - *Đã triển khai*
- [x] Chức năng CRUD cho Zodiac (Admin) - *Đã triển khai*

### Module 5: Thanh Toán (Ưu tiên trung bình)
- [x] Model `SubscriptionPlan`, `Payment`, `UserSubscription`
- [x] API Lấy danh sách gói (`/payments/plans`)
- [x] API Lấy chi tiết gói (`/payments/plans/:id`)
- [x] API Tạo checkout session (`/payments/create-checkout-session`)
- [x] API Xử lý webhook Stripe (`/payments/webhook`) - *Đã xem xét, tái cấu trúc và thêm idempotency*
- [x] API Lấy subscription hiện tại (`/payments/subscription`)
- [x] API Hủy subscription (`/payments/cancel-subscription`)
- [x] API Lấy lịch sử thanh toán (`/payments/payment-history`)
- [x] Chức năng CRUD cho SubscriptionPlan (Admin) - *Đã triển khai*

### Module 6: Hệ Thống Trò Chuyện (Ưu tiên thấp)
- [x] Model `Chat`, `Message` (đã tạo Message model)
- [x] API Lấy danh sách chat của user (`/chats`)
- [x] API Tạo chat mới (`/chats`) - *Đã triển khai service logic*
- [x] API Gửi tin nhắn (`/chats/:id/messages`) - *Đã triển khai service logic*
- [x] API Lấy tin nhắn của chat (`/chats/:id/messages`) - *Đã triển khai*
- [x] API Đánh dấu đã đọc (`/chats/:id/read`) - *Đã triển khai service logic*
- [x] API Lên lịch chat (`/chats/schedule`) - *Đã triển khai service logic*
- [x] API Lấy lịch sắp tới (`/chats/schedules/upcoming`) - *Đã triển khai service logic*

## Completion Criteria (MVP)
- [ ] Tất cả các API trong phần "Key Features (MVP)" được triển khai và hoạt động ổn định.
- [ ] Hệ thống xác thực và phân quyền hoạt động chính xác.
- [ ] Dữ liệu được lưu trữ và truy xuất đúng cách từ MongoDB.
- [ ] Tích hợp thanh toán Stripe cơ bản hoạt động (tạo checkout, xử lý webhook).
- [ ] Có tài liệu API cơ bản (ví dụ: thông qua comment JSDoc hoặc Swagger).
- [ ] Có bộ test cơ bản (unit/integration) cho các chức năng cốt lõi.
- [ ] Server có thể khởi động và chạy mà không có lỗi nghiêm trọng.

## Progress Tracker
- **Giai Đoạn 1 (Thiết Lập Cơ Bản):** [x] Hoàn thành (Thiết lập project, DB, Auth API cơ bản, Validation cơ bản)
- **Giai Đoạn 2 (Core Features - Tarot):** [ ] Đang tiến hành (Models OK, Routes OK, Services cần làm)
- **Giai Đoạn 3 (Tính Năng Nâng Cao - Astrology, Payment, Chat):** [ ] Đang tiến hành (Models OK, Routes OK, Services cần làm)
- **Giai Đoạn 4 (Testing & Tối Ưu):** [ ] Chưa bắt đầu
- **Giai Đoạn 5 (Triển Khai):** [ ] Chưa bắt đầu

## Completed Tasks (Chi tiết hơn trong currentTask.md)
- Thiết lập cấu trúc dự án ban đầu.
- Cấu hình kết nối MongoDB.
- Triển khai các model cơ bản.
- Triển khai các route và controller cơ bản.
- Áp dụng middleware bảo mật (Helmet, CORS, rate-limit).
- Triển khai middleware xác thực JWT.
- Triển khai middleware xử lý lỗi và ghi log.
- Rà soát và sửa lỗi ban đầu.
- Tích hợp `express-validator` và bổ sung validation cơ bản.
- Khắc phục lỗi khởi động server và cảnh báo Mongoose.
