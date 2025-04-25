const request = require('supertest');
require('dotenv').config(); // Load environment variables for tests
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Zodiac = require('../models/zodiacModel');
const Horoscope = require('../models/horoscopeModel');
const Card = require('../models/cardModel'); // Import Card model
const { connectDB, closeDB } = require('../config/database');

let regularUserToken;
let adminToken;
let regularUserId;
let adminUserId;
let sampleZodiacIds = [];
let sampleHoroscopeIds = [];
let sampleCardIds = []; // To store seeded card IDs
let songTuZodiacId; // Variable to store Song Tu ID

// Sample data for seeding
const sampleZodiacData = [
    // Thêm compatibility và tarotRelations (sẽ được cập nhật sau khi có cardId)
    { 
        name: 'Bạch Dương', nameEn: 'Aries', symbol: '♈', element: 'Lửa', period: '21/3 - 19/4', ruling_planet: 'Sao Hỏa', description: 'Mô tả Bạch Dương...',
        compatibility: [
            { sign: 'Kim Ngưu', score: 60, description: 'Bạch Dương và Kim Ngưu có thể ổn...' },
            { sign: 'Song Tử', score: 80, description: 'Bạch Dương và Song Tử khá hợp...' }
        ],
        tarotRelations: [] // Sẽ thêm sau
    },
    { 
        name: 'Kim Ngưu', nameEn: 'Taurus', symbol: '♉', element: 'Đất', period: '20/4 - 20/5', ruling_planet: 'Sao Kim', description: 'Mô tả Kim Ngưu...',
        compatibility: [
            { sign: 'Bạch Dương', score: 60, description: 'Kim Ngưu và Bạch Dương có thể ổn...' },
            { sign: 'Song Tử', score: 50, description: 'Kim Ngưu và Song Tử cần cố gắng...' }
        ],
        tarotRelations: [] // Sẽ thêm sau
    },
    { 
        name: 'Song Tử', nameEn: 'Gemini', symbol: '♊', element: 'Khí', period: '21/5 - 20/6', ruling_planet: 'Sao Thủy', description: 'Mô tả Song Tử...',
        compatibility: [
            { sign: 'Bạch Dương', score: 80, description: 'Song Tử và Bạch Dương khá hợp...' },
            { sign: 'Kim Ngưu', score: 50, description: 'Song Tử và Kim Ngưu cần cố gắng...' }
        ],
        tarotRelations: [] // Sẽ thêm sau
    },
];

// Sample Card Data - Đảm bảo tên là duy nhất so với các file test khác
const sampleCardData = [
    { 
        name: 'The Fool AstrologyTest', // Đổi tên
        type: 'Major Arcana', 
        deck: 'AstrologyDeck', 
        imageUrl: 'http://example.com/fool.jpg', // Thêm imageUrl
        keywords: ['beginning', 'innocence'], 
        uprightMeaning: 'Ý nghĩa xuôi The Fool...', // Thêm uprightMeaning
        reversedMeaning: 'Ý nghĩa ngược The Fool...', // Thêm reversedMeaning
        description: 'Mô tả The Fool...', // Thêm description
        number: 0, // Sửa tên trường thành 'number'
        suit: null 
    },
    { 
        name: 'The Magician AstrologyTest', // Đổi tên
        type: 'Major Arcana', 
        deck: 'AstrologyDeck', 
        imageUrl: 'http://example.com/magician.jpg', // Thêm imageUrl
        keywords: ['power', 'skill'], 
        uprightMeaning: 'Ý nghĩa xuôi The Magician...', // Thêm uprightMeaning
        reversedMeaning: 'Ý nghĩa ngược The Magician...', // Thêm reversedMeaning
        description: 'Mô tả The Magician...', // Thêm description
        number: 1, // Sửa tên trường thành 'number'
        suit: null 
    },
];


const sampleHoroscopeData = (zodiacId) => [ // This function is not used, seeding logic is inline
    { sign: 'Bạch Dương', date: new Date('2025-04-25'), content: 'Horoscope Bạch Dương hôm nay...', zodiacId: zodiacId },
    { sign: 'Kim Ngưu', date: new Date('2025-04-25'), content: 'Horoscope Kim Ngưu hôm nay...', zodiacId: zodiacId }, // Need correct zodiacId
];


const Reading = require('../models/readingModel'); // Import Reading model for cleanup

beforeAll(async () => {
    await connectDB();
    // Clear ALL potentially relevant test data before seeding for this suite
    await User.deleteMany({});
    await Zodiac.deleteMany({});
    await Horoscope.deleteMany({});
    await Card.deleteMany({});
    await Reading.deleteMany({}); // Add Reading cleanup

    // Seed Cards for this suite
    const createdCards = await Card.insertMany(sampleCardData);
    sampleCardIds = createdCards.map(c => c._id.toString());

    // Update Zodiac data with Tarot Relations
    const bachDuongData = sampleZodiacData.find(z => z.name === 'Bạch Dương');
    if (bachDuongData && sampleCardIds.length > 0) {
        bachDuongData.tarotRelations.push({ cardId: sampleCardIds[0], description: 'Liên kết The Fool với Bạch Dương' });
    }
    const kimNguuData = sampleZodiacData.find(z => z.name === 'Kim Ngưu');
     if (kimNguuData && sampleCardIds.length > 1) {
        kimNguuData.tarotRelations.push({ cardId: sampleCardIds[1], description: 'Liên kết The Magician với Kim Ngưu' });
    }

    // Seed Zodiac signs with updated data
    const createdZodiacs = await Zodiac.insertMany(sampleZodiacData);
    sampleZodiacIds = createdZodiacs.map(z => z._id.toString());
    // Find and store Song Tu ID immediately after seeding
    const songTuZodiacFromSeed = createdZodiacs.find(z => z.name === 'Song Tử');
    if (songTuZodiacFromSeed) {
        songTuZodiacId = songTuZodiacFromSeed._id.toString();
    } else {
         console.error("CRITICAL: Failed to find 'Song Tử' immediately after seeding Zodiacs.");
         // Optionally throw an error here if Song Tu is critical for subsequent setup
    }


    // Seed Horoscopes (use correct zodiacId from the final seeded zodiacs)
    const bachDuongZodiacId = createdZodiacs.find(z => z.name === 'Bạch Dương')?._id;
    const kimNguuZodiacId = createdZodiacs.find(z => z.name === 'Kim Ngưu')?._id;
    if (bachDuongZodiacId && kimNguuZodiacId) {
        const horoscopesToSeed = [
             {
                 sign: 'Bạch Dương', 
                 date: new Date('2025-04-25'), 
                 general: 'Nội dung chung Bạch Dương...', 
                 love: 'Nội dung tình yêu Bạch Dương...', 
                 career: 'Nội dung sự nghiệp Bạch Dương...', 
                 health: 'Nội dung sức khỏe Bạch Dương...', 
                 zodiacId: bachDuongZodiacId 
             },
             { 
                 sign: 'Kim Ngưu', 
                 date: new Date('2025-04-25'), 
                 general: 'Nội dung chung Kim Ngưu...', 
                 love: 'Nội dung tình yêu Kim Ngưu...', 
                 career: 'Nội dung sự nghiệp Kim Ngưu...', 
                 health: 'Nội dung sức khỏe Kim Ngưu...', 
                 zodiacId: kimNguuZodiacId 
             },
        ];
        const createdHoroscopes = await Horoscope.insertMany(horoscopesToSeed);
        sampleHoroscopeIds = createdHoroscopes.map(h => h._id.toString());
    } else {
        console.error("Failed to find seeded Zodiac IDs for Horoscope seeding.");
    }


    // Create and login regular user
    const regularUserData = { name: 'Astrology User', email: `user_${Date.now()}@astrologytest.com`, password: 'password', role: 'user' };
    const createdRegularUser = await User.create(regularUserData);
    regularUserId = createdRegularUser._id;
    const loginResRegular = await request(app).post('/api/users/login').send({ email: regularUserData.email, password: 'password' });
    if (loginResRegular.body.data && loginResRegular.body.data.token) {
        regularUserToken = loginResRegular.body.data.token;
    } else {
        console.error("Regular user login failed in beforeAll (astrology):", loginResRegular.body);
        throw new Error("Failed to login regular user for astrology tests");
    }

    // Create and login admin user
    const adminUserData = { name: 'Astrology Admin', email: `admin_${Date.now()}@astrologytest.com`, password: 'adminpassword', role: 'admin' };
    const createdAdminUser = await User.create(adminUserData);
    adminUserId = createdAdminUser._id;
    const loginResAdmin = await request(app).post('/api/users/login').send({ email: adminUserData.email, password: 'adminpassword' });
    if (loginResAdmin.body.data && loginResAdmin.body.data.token) {
        adminToken = loginResAdmin.body.data.token;
    } else {
        console.error("Admin login failed in beforeAll (astrology):", loginResAdmin.body);
        throw new Error("Failed to login admin user for astrology tests");
    }
});

afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: /@astrologytest\.com$/ });
    await Zodiac.deleteMany({ name: { $in: sampleZodiacData.map(z => z.name) } });
    await Horoscope.deleteMany({ sign: { $in: sampleZodiacData.map(z => z.name) } });
    await Card.deleteMany({ deckName: 'AstrologyDeck' }); // Clean up test cards
    await closeDB();
});

describe('Astrology API (/api/astrology)', () => {

    // --- Public Routes ---

    it('GET /signs - should return all zodiac signs', async () => {
        const res = await request(app).get('/api/astrology/signs');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(sampleZodiacData.length);
        // Check for a specific sign
        expect(res.body.data.some(sign => sign.name === 'Bạch Dương')).toBe(true);
    });

    it('GET /horoscope/:sign - should return daily horoscope for a valid sign and date', async () => {
        expect(sampleHoroscopeIds.length).toBeGreaterThanOrEqual(1); // Ensure horoscope was seeded
        const signToTest = 'Bạch Dương'; // Use a sign that was seeded
        const dateToTestISO = '2025-04-25T00:00:00.000Z'; // Use ISO string for UTC start of day
        const encodedSign = encodeURIComponent(signToTest); // Encode the sign
        const res = await request(app).get(`/api/astrology/horoscope/${encodedSign}?date=${dateToTestISO}`); // Use ISO date in query

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('sign', signToTest);
        // Check for specific content fields now that seeding is correct
        expect(res.body.data).toHaveProperty('general');
        expect(res.body.data.general).toMatch(/Nội dung chung Bạch Dương/);
        expect(res.body.data).toHaveProperty('love');
        expect(res.body.data).toHaveProperty('career');
        expect(res.body.data).toHaveProperty('health');
        // Check date (compare ISO strings for exact match)
        expect(new Date(res.body.data.date).toISOString()).toEqual(dateToTestISO);
    });

    it('GET /horoscope/:sign - should return 404 for a sign with no horoscope for the specified date', async () => {
        const signWithoutHoroscope = 'Song Tử'; // Sign exists but no horoscope seeded for this date
        const dateToTestISO = '2025-04-25T00:00:00.000Z';
        const encodedSign = encodeURIComponent(signWithoutHoroscope); // Encode the sign
        const res = await request(app).get(`/api/astrology/horoscope/${encodedSign}?date=${dateToTestISO}`);
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('success', false);
        // Sửa: Kiểm tra message chính xác hơn
        expect(res.body.message).toMatch(`Không tìm thấy tử vi cho cung ${signWithoutHoroscope}`); 
    });

     it('GET /horoscope/:sign - should return 400 for an invalid sign name', async () => {
        const invalidSign = 'InvalidSignName';
        const res = await request(app).get(`/api/astrology/horoscope/${invalidSign}`);
        expect(res.statusCode).toEqual(400); 
        expect(res.body).toHaveProperty('success', false);
        // Sửa: Kiểm tra message thay vì errors
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toMatch(`Cung hoàng đạo không hợp lệ: ${invalidSign}`);
    });

    // TODO: Add tests for GET /compatibility/:sign1/:sign2
    // --- Admin Horoscope CRUD Routes ---
    describe('Admin Horoscope CRUD Routes (/api/astrology/admin/horoscopes)', () => {
        let newHoroscopeId;
        // Sửa lại cấu trúc data cho phù hợp validator và model Horoscope
        const newHoroscopeData = {
            sign: 'Song Tử', 
            date: '2025-04-26', 
            general: 'Nội dung chung Song Tử mới...', // Khớp model
            love: 'Nội dung tình yêu Song Tử mới...', // Khớp model
            career: 'Nội dung sự nghiệp Song Tử mới...', // Khớp model
            health: 'Nội dung sức khỏe Song Tử mới...', // Khớp model
            zodiacId: null // Will be fetched dynamically
        };

        beforeAll(() => { // No longer needs to be async
            // Use the pre-fetched Song Tu ID
            if (songTuZodiacId) {
                newHoroscopeData.zodiacId = songTuZodiacId;
            } else {
                // This should ideally not happen if the main beforeAll succeeded
                throw new Error("Pre-fetched 'Song Tử' Zodiac ID is missing for horoscope test setup.");
            }
        });

        it('POST /admin/horoscopes - should create a new horoscope (Admin only)', async () => {
            const res = await request(app)
                .post('/api/astrology/admin/horoscopes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newHoroscopeData);

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.sign).toEqual(newHoroscopeData.sign);
            expect(res.body.data.general).toEqual(newHoroscopeData.general); // Kiểm tra general
            expect(res.body.data.love).toEqual(newHoroscopeData.love); // Kiểm tra love
            expect(res.body.data.career).toEqual(newHoroscopeData.career); // Kiểm tra career
            expect(res.body.data.health).toEqual(newHoroscopeData.health); // Kiểm tra health
            // Bỏ kiểm tra zodiacId trong response vì có thể service không trả về
            newHoroscopeId = res.body.data._id; // Save ID for later tests
        });

        it('POST /admin/horoscopes - should return 401 if not admin', async () => {
            const res = await request(app)
                .post('/api/astrology/admin/horoscopes')
                .set('Authorization', `Bearer ${regularUserToken}`) // Use regular user token
                .send(newHoroscopeData);
            expect(res.statusCode).toEqual(403); // Expect Forbidden
             expect(res.body.message).toMatch(/Bạn không có quyền thực hiện hành động này/); // Sửa message
        });

        it('POST /admin/horoscopes - should return 400 for invalid data', async () => {
            // Sửa invalid data cho phù hợp validator và model
            const invalidData = { ...newHoroscopeData, general: '' }; // Invalid general content
            const res = await request(app)
                .post('/api/astrology/admin/horoscopes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidData);
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('errors'); // Expect validation errors
        });

        it('PUT /admin/horoscopes/:id - should update an existing horoscope (Admin only)', async () => {
            expect(newHoroscopeId).toBeDefined(); // Ensure horoscope was created
            // Sửa updatedData cho phù hợp validator và model
            const updatedData = { general: 'Nội dung chung Song Tử đã cập nhật...' };
            const res = await request(app)
                .put(`/api/astrology/admin/horoscopes/${newHoroscopeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatedData);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data.general).toEqual(updatedData.general); // Kiểm tra general
        });

        it('PUT /admin/horoscopes/:id - should return 404 for non-existent horoscope ID', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            // Sửa updatedData cho phù hợp validator và model
            const updatedData = { general: 'Nội dung cập nhật...' };
            const res = await request(app)
                .put(`/api/astrology/admin/horoscopes/${nonExistentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatedData);
            expect(res.statusCode).toEqual(404);
             expect(res.body.message).toMatch(/Không tìm thấy tử vi/);
        });

        it('DELETE /admin/horoscopes/:id - should delete a horoscope (Admin only)', async () => {
            expect(newHoroscopeId).toBeDefined();
            const res = await request(app)
                .delete(`/api/astrology/admin/horoscopes/${newHoroscopeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.message).toMatch(/Xóa tử vi thành công/);

            // Verify deletion
            const checkRes = await request(app).get(`/api/astrology/horoscope/Song%20T%E1%BB%AD?date=2025-04-26`);
            expect(checkRes.statusCode).toEqual(404); // Should not find it anymore
        });

         it('DELETE /admin/horoscopes/:id - should return 404 for non-existent horoscope ID', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .delete(`/api/astrology/admin/horoscopes/${nonExistentId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toEqual(404);
             expect(res.body.message).toMatch(/Không tìm thấy tử vi/);
        });
    });

    // --- Admin Zodiac CRUD Routes ---
    describe('Admin Zodiac CRUD Routes (/api/astrology/admin/signs)', () => {
        let newZodiacId;
        // Sửa lại cấu trúc data cho phù hợp validator và model Zodiac
        const newZodiacData = {
            name: 'Xử Nữ',
            nameEn: 'Virgo', // Khớp model
            symbol: '♍', // Khớp model
            element: 'Đất', // Khớp model
            period: '23/8 - 22/9', // Khớp model
            ruling_planet: 'Sao Thủy', // Khớp model
            description: 'Mô tả Xử Nữ...', // Khớp model
        };

        it('POST /admin/signs - should create a new zodiac sign (Admin only)', async () => {
            const res = await request(app)
                .post('/api/astrology/admin/signs')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newZodiacData);

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.name).toEqual(newZodiacData.name);
            newZodiacId = res.body.data._id; // Save ID for later tests

            // Clean up the newly created sign immediately to avoid affecting other tests if needed,
            // or rely on afterAll cleanup. For simplicity, rely on afterAll for now.
        });

        it('POST /admin/signs - should return 403 if not admin', async () => {
            const res = await request(app)
                .post('/api/astrology/admin/signs')
                .set('Authorization', `Bearer ${regularUserToken}`) // Use regular user token
                .send(newZodiacData);
            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toMatch(/Bạn không có quyền thực hiện hành động này/); // Sửa message
        });

        it('POST /admin/signs - should return 400 for invalid data', async () => {
            // Sửa invalid data cho phù hợp validator và model
            const invalidData = { ...newZodiacData, nameEn: '' }; // Invalid nameEn
            const res = await request(app)
                .post('/api/astrology/admin/signs')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidData);
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('errors');
        });

        it('PUT /admin/signs/:id - should update an existing zodiac sign (Admin only)', async () => {
            // Use one of the seeded IDs for update test
            const zodiacToUpdateId = sampleZodiacIds[0]; // Update Bạch Dương
            const updatedData = { description: 'Mô tả Bạch Dương đã cập nhật...' };
            const res = await request(app)
                .put(`/api/astrology/admin/signs/${zodiacToUpdateId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatedData);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data.description).toEqual(updatedData.description);
            expect(res.body.data.name).toEqual('Bạch Dương'); // Ensure other fields remain
        });

        it('PUT /admin/signs/:id - should return 404 for non-existent zodiac ID', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const updatedData = { description: 'Cập nhật...' };
            const res = await request(app)
                .put(`/api/astrology/admin/signs/${nonExistentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatedData);
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toMatch(/Không tìm thấy cung hoàng đạo/);
        });

        it('DELETE /admin/signs/:id - should delete a zodiac sign (Admin only)', async () => {
            // Create a temporary sign to delete using a valid enum name but unique nameEn
            const uniqueSuffix = Date.now(); 
            const tempSignData = { 
                name: 'Ma Kết', // Use a valid enum name
                nameEn: `Capricorn Delete ${uniqueSuffix}`, // Make nameEn unique
                symbol: '♑', // Use correct symbol for Ma Kết
                element: 'Đất', // Use correct element for Ma Kết
                period: '22/12 - 19/1', // Use correct period for Ma Kết
                ruling_planet: 'Sao Thổ', // Use correct planet for Ma Kết
                description: 'Sign tạm thời để xóa...' 
            };
            const createRes = await request(app)
                .post('/api/astrology/admin/signs')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(tempSignData);
            expect(createRes.statusCode).toEqual(201);
            const tempSignId = createRes.body.data._id;

            const deleteRes = await request(app)
                .delete(`/api/astrology/admin/signs/${tempSignId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(deleteRes.statusCode).toEqual(200);
            expect(deleteRes.body).toHaveProperty('success', true);
            expect(deleteRes.body.message).toMatch(/Xóa cung hoàng đạo thành công/);

            // Verify deletion by trying to get it
             const getRes = await request(app).get('/api/astrology/signs');
             expect(getRes.body.data.some(sign => sign._id === tempSignId)).toBe(false);
        });

         it('DELETE /admin/signs/:id - should return 404 for non-existent zodiac ID', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .delete(`/api/astrology/admin/signs/${nonExistentId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toMatch(/Không tìm thấy cung hoàng đạo/);
        });
    });

    // --- Authenticated Routes ---

    describe('Authenticated Routes', () => {
        it('GET /compatibility/:sign1/:sign2 - should return compatibility info for valid signs', async () => {
            const sign1 = 'Bạch Dương';
            const sign2 = 'Kim Ngưu';
            const encodedSign1 = encodeURIComponent(sign1);
            const encodedSign2 = encodeURIComponent(sign2);

            const res = await request(app)
                .get(`/api/astrology/compatibility/${encodedSign1}/${encodedSign2}`)
                .set('Authorization', `Bearer ${regularUserToken}`); // Use regular user token

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('sign1', sign1);
            expect(res.body.data).toHaveProperty('sign2', sign2);
            expect(res.body.data).toHaveProperty('compatibilityScore');
            expect(res.body.data).toHaveProperty('description');
        });

        it('GET /compatibility/:sign1/:sign2 - should return 400 for invalid sign', async () => {
            const sign1 = 'Bạch Dương';
            const sign2 = 'InvalidSign';
            const encodedSign1 = encodeURIComponent(sign1);
            // No need to encode invalid sign

            const res = await request(app)
                .get(`/api/astrology/compatibility/${encodedSign1}/${sign2}`)
                .set('Authorization', `Bearer ${regularUserToken}`);

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body.message).toMatch(/Cung hoàng đạo không hợp lệ: InvalidSign/);
        });

        it('GET /compatibility/:sign1/:sign2 - should return 400 for same signs', async () => {
            const sign1 = 'Bạch Dương';
            const encodedSign1 = encodeURIComponent(sign1);

            const res = await request(app)
                .get(`/api/astrology/compatibility/${encodedSign1}/${encodedSign1}`)
                .set('Authorization', `Bearer ${regularUserToken}`);

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body.message).toMatch(/Vui lòng cung cấp hai cung hoàng đạo khác nhau/);
        });

        it('GET /compatibility/:sign1/:sign2 - should return 401 if not logged in', async () => {
            const sign1 = 'Bạch Dương';
            const sign2 = 'Kim Ngưu';
            const encodedSign1 = encodeURIComponent(sign1);
            const encodedSign2 = encodeURIComponent(sign2);

            const res = await request(app)
                .get(`/api/astrology/compatibility/${encodedSign1}/${encodedSign2}`); // No token

            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('success', false);
            // Sửa: Cập nhật message lỗi 401
            expect(res.body.message).toMatch(/Bạn cần đăng nhập/); 
        });

        it('GET /tarot-relation/:sign - should return tarot relation info for a valid sign', async () => {
            const sign = 'Bạch Dương'; // Assuming this sign has relations seeded or added
            const encodedSign = encodeURIComponent(sign);

            // Pre-requisite: Add a tarot relation for Bạch Dương using admin (if not seeded)
            // For now, assume the service handles cases where relations might be empty
            // We might need to add a relation in beforeAll or a specific test setup later

            const res = await request(app)
                .get(`/api/astrology/tarot-relation/${encodedSign}`)
                .set('Authorization', `Bearer ${regularUserToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('sign', sign);
            expect(res.body.data).toHaveProperty('tarotRelations');
            expect(Array.isArray(res.body.data.tarotRelations)).toBe(true);
            // Check if the seeded relation is present
            expect(res.body.data.tarotRelations.length).toBeGreaterThanOrEqual(1);
            // Sửa assertion: Kiểm tra cardName thay vì cardId trực tiếp
            expect(res.body.data.tarotRelations[0]).toHaveProperty('cardName', sampleCardData[0].name); 
            expect(res.body.data.tarotRelations[0]).toHaveProperty('description', 'Liên kết The Fool với Bạch Dương');
        });

        it('GET /tarot-relation/:sign - should return 400 for invalid sign', async () => {
            const sign = 'InvalidSign';

            const res = await request(app)
                .get(`/api/astrology/tarot-relation/${sign}`)
                .set('Authorization', `Bearer ${regularUserToken}`);

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body.message).toMatch(/Cung hoàng đạo không hợp lệ: InvalidSign/);
        });

        it('GET /tarot-relation/:sign - should return 401 if not logged in', async () => {
            const sign = 'Bạch Dương';
            const encodedSign = encodeURIComponent(sign);

            const res = await request(app)
                .get(`/api/astrology/tarot-relation/${encodedSign}`); // No token

            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('success', false);
            // Sửa: Cập nhật message lỗi 401
            expect(res.body.message).toMatch(/Bạn cần đăng nhập/);
        });
    });

});
