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
- [x] API Lấy danh sách các kiểu trải bài (`/api/spreads`) - *Đã chuyển sang module Spread*
- [x] API Thêm giải nghĩa (Reader) (`/readings/reader/:id/interpret`) - *Service logic đã có*
- [x] API Thêm feedback (User) (`/readings/:id/feedback`) - *Service logic đã có*
- [x] Chức năng CRUD cho Reading (Admin) - *Đã triển khai R/U/D*
- [x] Quản lý Kiểu Trải Bài (Spreads) bằng DB (Admin CRUD & Tests) - *Hoàn thành*

### Module 4: Tích Hợp Astrology (Ưu tiên trung bình)
- [x] Model `Zodiac`, `Horoscope`
- [x] API Lấy thông tin cung hoàng đạo (`/astrology/signs/:sign`)
- [x] API Lấy tử vi (`/astrology/:sign`) - *Đã triển khai (logic trong model)*
- [x] API Lấy tương hợp cung hoàng đạo (`/astrology/compatibility/:sign1/:sign2`) - *Đã triển khai*
- [x] API Lấy liên kết Tarot (`/astrology/tarot-relation/:sign`) - *Đã triển khai*
- [x] Chức năng CRUD cho Horoscope (Admin) - *Đã triển khai*
- [x] Chức năng CRUD cho Zodiac (Admin) - *Đã triển khai*

### Module 5: Thanh Toán (Tạm hoãn - Stripe)
*Ghi chú: Tạm thời vô hiệu hóa do thiếu Stripe secrets. Để kích hoạt lại:*
  *- Bỏ comment kiểm tra biến môi trường Stripe trong `src/server.js`.*
  *- Bỏ comment các dòng liên quan đến `paymentRoutes` và webhook trong `src/app.js`.*
  *- Cung cấp `STRIPE_SECRET_KEY` và `STRIPE_WEBHOOK_SECRET` trong file `.env`.*

- [ ] Model `SubscriptionPlan`, `Payment`, `UserSubscription` (Đã tạo, cần xem xét lại khi tích hợp)
- [ ] API Lấy danh sách gói (`/payments/plans`) (Tạm hoãn)
- [ ] API Lấy chi tiết gói (`/payments/plans/:id`) (Tạm hoãn)
- [ ] API Tạo checkout session (`/payments/create-checkout-session`) (Tạm hoãn)
- [ ] API Xử lý webhook Stripe (`/payments/webhook`) (Tạm hoãn)
- [ ] API Lấy subscription hiện tại (`/payments/subscription`) (Tạm hoãn)
- [ ] API Hủy subscription (`/payments/cancel-subscription`) (Tạm hoãn)
- [ ] API Lấy lịch sử thanh toán (`/payments/payment-history`) (Tạm hoãn)
- [ ] Chức năng CRUD cho SubscriptionPlan (Admin) (Tạm hoãn)

### Module 6: Hệ Thống Trò Chuyện (Ưu tiên thấp)
- [x] Model `Chat`, `Message` (đã tạo Message model, sau đó refactor vào Chat)
- [x] API Lấy danh sách chat của user (`/chats`)
- [x] API Tạo chat mới (`/chats`) - *Đã triển khai service logic*
- [x] API Gửi tin nhắn (`/chats/:id/messages`) - *Đã triển khai service logic*
- [x] API Lấy tin nhắn của chat (`/chats/:id/messages`) - *Đã triển khai*
- [x] API Đánh dấu đã đọc (`/chats/:id/read`) - *Đã triển khai service logic*
- [x] API Lên lịch chat (`/chats/schedule`) - *Đã triển khai service logic*
- [x] API Lấy lịch sắp tới (`/chats/schedules/upcoming`) - *Đã triển khai service logic*

## Completion Criteria (MVP)
- [ ] Tất cả các API trong phần "Key Features (MVP)" được triển khai và hoạt động ổn định.
- [x] Hệ thống xác thực và phân quyền hoạt động chính xác.
- [x] Dữ liệu được lưu trữ và truy xuất đúng cách từ MongoDB.
- [ ] Tích hợp thanh toán Stripe cơ bản hoạt động (tạo checkout, xử lý webhook). (Tạm hoãn)
- [x] Có tài liệu API cơ bản (ví dụ: thông qua comment JSDoc hoặc Swagger). - *Đã hoàn thành (Swagger UI functional)*
- [x] Có bộ test cơ bản (unit/integration) cho các chức năng cốt lõi. - *Đã hoàn thành (106 tests passed, trừ Payment)*
- [x] Server có thể khởi động và chạy mà không có lỗi nghiêm trọng.

## Progress Tracker
- **Giai Đoạn 1 (Thiết Lập Cơ Bản):** [x] Hoàn thành (Thiết lập project, DB, Auth API cơ bản, Validation cơ bản)
- **Giai Đoạn 2 (Core Features - Tarot):** [x] Hoàn thành (Triển khai service logic cơ bản)
- **Giai Đoạn 3 (Tính Năng Nâng Cao - Astrology, Payment, Chat):** [x] Hoàn thành (Triển khai service logic cơ bản, Payment tạm hoãn)
- **Giai Đoạn 4 (Testing & Tối Ưu):** [x] Hoàn thành (Tests cho các module chính: User, Card, Reading, Astrology, Spread. Trừ Payment)
- **Giai Đoạn 5 (Triển Khai):** [x] Hoàn thành (Docker setup cơ bản, logging, health check)
- **Giai Đoạn 6 (Cleanup & Docs):** [x] Hoàn thành (Codebase review, refactor, Swagger docs)

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
- Hoàn thành tests cho các module User, Card, Reading, Astrology, Spread.
- Thiết lập Docker và Docker Compose.
- Hoàn thiện tài liệu API (Swagger).
- Refactor và dọn dẹp codebase.
