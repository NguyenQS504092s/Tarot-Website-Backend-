const request = require('supertest');
// dotenv should be handled by cross-env in npm script
const app = require('../app'); // Import Express app
const mongoose = require('mongoose');
const User = require('../models/userModel');
const { connectDB, closeDB } = require('../config/database'); // Corrected import name
const Card = require('../models/cardModel'); // Import other models for cleanup
const Zodiac = require('../models/zodiacModel');
const Horoscope = require('../models/horoscopeModel');
const Reading = require('../models/readingModel');

// Biến toàn cục để lưu trữ thông tin người dùng test
let testUser;
let authToken;

// Kết nối DB trước khi chạy tất cả test trong file này
beforeAll(async () => {
    // Sử dụng DB test riêng biệt nếu có, hoặc kết nối DB dev/test hiện tại
    // Lưu ý: Cần đảm bảo DB test được dọn dẹp sau mỗi lần chạy
    await connectDB();
    // Clear ALL potentially relevant test data before seeding for this suite
    await User.deleteMany({});
    await Zodiac.deleteMany({});
    await Horoscope.deleteMany({});
    await Card.deleteMany({});
    await Reading.deleteMany({});
});

// Ngắt kết nối DB sau khi chạy xong tất cả test
afterAll(async () => {
    // Xóa người dùng test đã tạo
    if (testUser && testUser._id) {
        await User.findByIdAndDelete(testUser._id);
    }
    await closeDB(); // Corrected function call
});

describe('User Authentication API (/api/users)', () => {

    // Test đăng ký người dùng mới
    it('POST /register - should register a new user successfully', async () => {
        const newUser = {
            name: 'Test User',
            email: `testuser_${Date.now()}@test.com`, // Email duy nhất cho mỗi lần chạy test
            password: 'password123',
            passwordConfirm: 'password123',
        };

        const res = await request(app)
            .post('/api/users/register')
            .send(newUser);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('user');
        expect(res.body.data.user).toHaveProperty('email', newUser.email);
        expect(res.body.data).toHaveProperty('token'); // Kiểm tra có trả về token không

        // Lưu lại thông tin user để dùng cho các test khác (nếu cần)
        testUser = res.body.data.user;
    });

    // Test đăng ký với email đã tồn tại
    it('POST /register - should return error if email already exists', async () => {
        // Sử dụng email của user vừa tạo ở test trước
        const existingUser = {
            name: 'Another Test User',
            email: testUser.email, // Email đã tồn tại
            password: 'password456',
            passwordConfirm: 'password456',
        };

        const res = await request(app)
            .post('/api/users/register')
            .send(existingUser);

        expect(res.statusCode).toEqual(400); // Hoặc mã lỗi phù hợp bạn định nghĩa
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message'); // Kiểm tra có thông báo lỗi
    });

    // Test đăng ký với mật khẩu không khớp
    it('POST /register - should return error if passwords do not match', async () => {
        const mismatchedPasswordUser = {
            name: 'Mismatch User',
            email: `mismatch_${Date.now()}@test.com`,
            password: 'password123',
            passwordConfirm: 'password456', // Mật khẩu không khớp
        };

        const res = await request(app)
            .post('/api/users/register')
            .send(mismatchedPasswordUser);

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
        // Kiểm tra cụ thể lỗi validation nếu có
        // expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'passwordConfirm' })]));
    });


    // Test đăng nhập thành công
    it('POST /login - should login the user successfully and return a token', async () => {
        const loginCredentials = {
            email: testUser.email,
            password: 'password123', // Mật khẩu đã đăng ký ở test đầu tiên
        };

        const res = await request(app)
            .post('/api/users/login')
            .send(loginCredentials);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('token');
        expect(res.body.data).toHaveProperty('refreshToken'); // Kiểm tra có refresh token
        expect(res.body.data).toHaveProperty('user');
        expect(res.body.data.user).toHaveProperty('email', testUser.email);

        // Lưu token để sử dụng cho các API cần xác thực
        authToken = res.body.data.token;
    });

    // Test đăng nhập với sai mật khẩu
    it('POST /login - should return error for incorrect password', async () => {
        const wrongPasswordCredentials = {
            email: testUser.email,
            password: 'wrongpassword',
        };

        const res = await request(app)
            .post('/api/users/login')
            .send(wrongPasswordCredentials);

        expect(res.statusCode).toEqual(401); // Unauthorized
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message', 'Email hoặc mật khẩu không chính xác');
    });

    // Test đăng nhập với email không tồn tại
    it('POST /login - should return error for non-existent email', async () => {
        const nonExistentEmailCredentials = {
            email: 'nosuchuser@test.com',
            password: 'password123',
        };

        const res = await request(app)
            .post('/api/users/login')
            .send(nonExistentEmailCredentials);

        expect(res.statusCode).toEqual(401); // Unauthorized
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message', 'Email hoặc mật khẩu không chính xác');
    });

    // Test lấy thông tin cá nhân (/me)
    it('GET /me - should return user profile for logged in user', async () => {
        expect(authToken).toBeDefined(); // Đảm bảo đã đăng nhập và có token

        const res = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${authToken}`); // Gửi token trong header

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('user'); // Kiểm tra có object user
        expect(res.body.data.user).toHaveProperty('email', testUser.email); // Kiểm tra email trong user object
        expect(res.body.data.user).not.toHaveProperty('password'); // Đảm bảo mật khẩu không bị lộ
    });

     // Test lấy thông tin cá nhân (/me) khi chưa đăng nhập
     it('GET /me - should return error if not logged in', async () => {
        const res = await request(app)
            .get('/api/users/me');

        expect(res.statusCode).toEqual(401); // Unauthorized
        expect(res.body).toHaveProperty('success', false);
        // Cập nhật message cho khớp với lỗi thực tế từ authMiddleware
        expect(res.body).toHaveProperty('message', 'Bạn cần đăng nhập để truy cập tài nguyên này');
    });

    // Test cập nhật hồ sơ thành công
    it('PUT /update-profile - should update user profile successfully', async () => {
        expect(authToken).toBeDefined();
        const profileUpdate = {
            name: 'Test User Updated',
            birthDate: '1995-05-15' // Example date
        };

        const res = await request(app)
            .put('/api/users/update-profile')
            .set('Authorization', `Bearer ${authToken}`)
            .send(profileUpdate);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data.user).toHaveProperty('name', profileUpdate.name);
        // Convert date string back to compare, or compare ISO strings
        expect(new Date(res.body.data.user.birthDate).toISOString().split('T')[0]).toEqual(profileUpdate.birthDate);
        testUser.name = profileUpdate.name; // Update local copy for potential later tests
    });

     // Test cập nhật hồ sơ với dữ liệu không hợp lệ (ví dụ: tên quá ngắn)
     it('PUT /update-profile - should return error for invalid data', async () => {
        expect(authToken).toBeDefined();
        const invalidProfileUpdate = {
            name: 'Te' // Tên quá ngắn
        };

        const res = await request(app)
            .put('/api/users/update-profile')
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidProfileUpdate);

        expect(res.statusCode).toEqual(400); // Assuming validator catches this
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('errors');
        // expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'name' })]));
    });

    // Test đổi mật khẩu thành công
    it('PUT /change-password - should change password successfully', async () => {
        expect(authToken).toBeDefined();
        const passwordChange = {
            currentPassword: 'password123',
            newPassword: 'newpassword456'
        };

        const res = await request(app)
            .put('/api/users/change-password')
            .set('Authorization', `Bearer ${authToken}`)
            .send(passwordChange);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('token'); // Should return new tokens
        expect(res.body.data).toHaveProperty('refreshToken');

        // Cập nhật authToken cho các test sau (nếu cần)
        authToken = res.body.data.token;

        // Thử đăng nhập lại với mật khẩu mới để xác nhận
        const loginWithNewPassword = {
            email: testUser.email,
            password: 'newpassword456'
        };
        const loginRes = await request(app)
            .post('/api/users/login')
            .send(loginWithNewPassword);
        expect(loginRes.statusCode).toEqual(200);
    });

    // Test đổi mật khẩu với mật khẩu hiện tại sai
    it('PUT /change-password - should return error for incorrect current password', async () => {
        expect(authToken).toBeDefined();
        const wrongCurrentPassword = {
            currentPassword: 'wrongpassword123',
            newPassword: 'anothernewpassword'
        };

        const res = await request(app)
            .put('/api/users/change-password')
            .set('Authorization', `Bearer ${authToken}`)
            .send(wrongCurrentPassword);

        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message', 'Mật khẩu hiện tại không chính xác');
    });

    // Test quên mật khẩu
    it('POST /forgot-password - should send reset instructions (simulate)', async () => {
        const forgotPasswordReq = {
            email: testUser.email
        };

        const res = await request(app)
            .post('/api/users/forgot-password')
            .send(forgotPasswordReq);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('message', 'Token đặt lại mật khẩu đã được gửi đến email (nếu email tồn tại)');

        // Kiểm tra xem token đã được lưu vào DB chưa (cần lấy lại user)
        const userWithToken = await User.findOne({ email: testUser.email }).select('+passwordResetToken');
        expect(userWithToken.passwordResetToken).toBeDefined();
    });

    // Test đặt lại mật khẩu (cần token từ bước trước - khó test tự động hoàn toàn)
    // Lưu ý: Test này sẽ khó thực hiện tự động vì token reset thực tế được gửi qua email.
    // Chúng ta có thể test logic bằng cách lấy token từ DB (không an toàn cho production test)
    // hoặc mock việc gửi/nhận email.
    // Ở đây, chúng ta sẽ bỏ qua test tự động hoàn chỉnh cho reset password qua token.
    // it('PUT /reset-password/:resetToken - should reset password successfully', async () => { ... });


    // Test làm mới token (cần refresh token từ lần đăng nhập/đổi mật khẩu)
    // Lưu ý: Cần lấy refresh token từ response đăng nhập/đổi mật khẩu trước đó
    // it('POST /refresh-token - should refresh the access token', async () => { ... });


    // Test đăng xuất
    it('POST /logout - should logout the user successfully', async () => {
        expect(authToken).toBeDefined();

        const res = await request(app)
            .post('/api/users/logout')
            .set('Authorization', `Bearer ${authToken}`); // Cần token để xác định user cần logout

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('message', 'Đăng xuất thành công');

        // Kiểm tra xem refresh token đã bị xóa khỏi DB chưa
        const loggedOutUser = await User.findById(testUser._id).select('+refreshToken');
        expect(loggedOutUser.refreshToken).toBeUndefined();

        // Access token cũ vẫn có thể hợp lệ cho đến khi hết hạn.
        // Việc kiểm tra /me với token cũ có thể pass hoặc fail tùy thuộc vào thời gian hết hạn.
        // Do đó, chúng ta chỉ cần kiểm tra refresh token đã bị xóa là đủ cho logic logout hiện tại.
    });

});
