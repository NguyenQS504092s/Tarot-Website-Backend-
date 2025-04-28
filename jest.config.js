module.exports = {
  // Môi trường test (node là phù hợp cho backend API)
  testEnvironment: 'node',

  // Thư mục chứa các tệp test
  // Mặc định Jest tìm trong __tests__ hoặc các tệp có đuôi .spec.js/.test.js
  // Chúng ta có thể giữ mặc định hoặc chỉ định rõ ràng
  // testMatch: ['**/tests/**/*.test.js'], // Ví dụ chỉ định thư mục tests

  // Bỏ qua các thư mục không cần test
  modulePathIgnorePatterns: ['<rootDir>/node_modules/'],

  // Thiết lập timeout cho các test (ms)
  // testTimeout: 60000, // 60 giây (Keep commented out for now)

  // Tùy chọn để chạy các hàm setup/teardown trước/sau khi test
  setupFilesAfterEnv: ['./src/tests/setup.js'], // Use the setup file

  // Báo cáo coverage (tùy chọn)
  // collectCoverage: true,
  // coverageDirectory: 'coverage',
  // coverageReporters: ['text', 'lcov'],

  // Tắt cache để tránh lỗi không mong muốn khi thay đổi cấu hình
  // cache: false,

  // Hiển thị log chi tiết hơn khi test thất bại
  // verbose: true, // Comment out
};
