const request = require('supertest');
// dotenv should be handled by cross-env in npm script
const app = require('../app');
const mongoose = require('mongoose');
const Reading = require('../models/readingModel');
const User = require('../models/userModel');
const Card = require('../models/cardModel');
const Spread = require('../models/spreadModel'); // Import Spread model
const { connectDB, closeDB } = require('../config/database');
const Zodiac = require('../models/zodiacModel');
const Horoscope = require('../models/horoscopeModel');

let regularUserToken;
let adminToken;
let regularUserId;
let adminUserId;
let sampleCardIds = []; // To store IDs of seeded cards

// Use card data consistent with card.test.js for potential reuse/less conflict
// Or ensure very distinct names/decks if keeping separate
const sampleCardDataForReading = [
    { name: 'The Fool RTest', number: 0, type: 'Major Arcana', suit: null, deck: 'Reading Test Deck', imageUrl: 'r00.jpg', uprightMeaning: '...', reversedMeaning: '...', description: '...' },
    { name: 'The Magician RTest', number: 1, type: 'Major Arcana', suit: null, deck: 'Reading Test Deck', imageUrl: 'r01.jpg', uprightMeaning: '...', reversedMeaning: '...', description: '...' },
    { name: 'Ace of Wands RTest', number: 1, type: 'Minor Arcana', suit: 'Gậy', deck: 'Reading Test Deck', imageUrl: 'rw01.jpg', uprightMeaning: '...', reversedMeaning: '...', description: '...' },
    { name: 'Two of Wands RTest', number: 2, type: 'Minor Arcana', suit: 'Gậy', deck: 'Reading Test Deck', imageUrl: 'rw02.jpg', uprightMeaning: '...', reversedMeaning: '...', description: '...' },
    { name: 'Ace of Cups RTest', number: 1, type: 'Minor Arcana', suit: 'Cốc', deck: 'Reading Test Deck', imageUrl: 'rc01.jpg', uprightMeaning: '...', reversedMeaning: '...', description: '...' },
];


beforeAll(async () => {
    await connectDB();
    // Clear ALL potentially relevant test data before seeding for this suite
    await User.deleteMany({});
    await Zodiac.deleteMany({});
    await Horoscope.deleteMany({});
    await Card.deleteMany({});
    await Reading.deleteMany({});
    await Spread.deleteMany({}); // Clear spreads as well

    // Seed cards specific to reading tests
    const createdCards = await Card.insertMany(sampleCardDataForReading);
    sampleCardIds = createdCards.map(card => card._id.toString());

    // Seed necessary Spreads
    await Spread.insertMany([
        {
            name: "Ba Lá Bài",
            description: "Trải bài 3 lá cơ bản.",
            cardCount: 3,
            positions: [
                { positionNumber: 1, name: "Quá khứ", meaning: "Ảnh hưởng quá khứ" },
                { positionNumber: 2, name: "Hiện tại", meaning: "Tình hình hiện tại" },
                { positionNumber: 3, name: "Tương lai", meaning: "Kết quả hoặc xu hướng tương lai" }
            ],
            isActive: true // Ensure it's active for tests
        },
        {
            name: "Celtic Cross",
            description: "Trải bài Celtic Cross 10 lá.",
            cardCount: 10,
            positions: [ /* ... define 10 positions ... */ ], // Add positions if needed for other tests
            isActive: true // Ensure it's active
        },
         {
            name: "Spread Không Hoạt Động",
            description: "Dùng để test.",
            cardCount: 1,
            positions: [{ positionNumber: 1, name: "Test", meaning: "Test" }],
            isActive: false // Ensure it's inactive
        }
    ]);


    // Create and login regular user
    const regularUserData = { name: 'Reading User', email: `user_${Date.now()}@readingtest.com`, password: 'password', role: 'user' };
    const createdRegularUser = await User.create(regularUserData);
    regularUserId = createdRegularUser._id;
    const loginResRegular = await request(app).post('/api/users/login').send({ email: regularUserData.email, password: 'password' });
    if (loginResRegular.body.data && loginResRegular.body.data.token) {
        regularUserToken = loginResRegular.body.data.token;
    } else {
        console.error("Regular user login failed in beforeAll:", loginResRegular.body);
        throw new Error("Failed to login regular user for tests");
    }

    // Create and login admin user
    const adminUserData = { name: 'Reading Admin', email: `admin_${Date.now()}@readingtest.com`, password: 'adminpassword', role: 'admin' };
    const createdAdminUser = await User.create(adminUserData);
    adminUserId = createdAdminUser._id;
    const loginResAdmin = await request(app).post('/api/users/login').send({ email: adminUserData.email, password: 'adminpassword' });
    if (loginResAdmin.body.data && loginResAdmin.body.data.token) {
        adminToken = loginResAdmin.body.data.token;
    } else {
        console.error("Admin login failed in beforeAll:", loginResAdmin.body);
        throw new Error("Failed to login admin user for tests");
    }
});

afterAll(async () => {
    // Clean up test data specific to this suite
    await Reading.deleteMany({});
    await User.deleteMany({ email: /@readingtest\.com$/ });
    await Card.deleteMany({ deck: 'Reading Test Deck' });
    await closeDB();
});

describe('Reading API (/api/readings)', () => {

    let createdReadingId; // To store ID of reading created by user

    // Test GET /spreads - Lấy danh sách các kiểu trải bài (Requires Auth)
    it('GET /api/spreads - should return available spread types', async () => { // Sửa tên test và route
        expect(regularUserToken).toBeDefined(); // Ensure user is logged in
        const res = await request(app)
            .get('/api/spreads') // Sửa route thành /api/spreads
            .set('Authorization', `Bearer ${regularUserToken}`); // Vẫn cần auth nếu route /api/spreads yêu cầu

        // Route /api/spreads không yêu cầu auth, nên không cần set header
        // const res = await request(app).get('/api/spreads');

        expect(res.statusCode).toEqual(200); // Route /api/spreads trả về 200
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        // Dữ liệu trả về từ /api/spreads nằm trực tiếp trong data
        expect(Array.isArray(res.body.data)).toBe(true); 
        // Check for specific known spreads by name within the array of objects
        expect(res.body.data.map(spread => spread.name)).toEqual(
            // Only active spreads should be returned
            expect.arrayContaining(['Ba Lá Bài', 'Celtic Cross']) 
        );
         // Ensure inactive spread is NOT returned
        expect(res.body.data.map(spread => spread.name)).not.toEqual(
            expect.arrayContaining(['Spread Không Hoạt Động'])
        );
    });

    // Test POST / - Tạo lượt xem bài mới (User)
    it('POST / - should create a new reading for logged in user', async () => {
        expect(regularUserToken).toBeDefined();
        expect(sampleCardIds.length).toBeGreaterThanOrEqual(3); // Ensure we have cards

        const newReadingData = {
            question: 'Câu hỏi test cho lượt xem bài?',
            spreadType: 'Ba Lá Bài', // Use a valid spread type
            deckName: 'Reading Test Deck' // Specify the deck to use
        };

        const res = await request(app)
            .post('/api/readings')
            .set('Authorization', `Bearer ${regularUserToken}`)
            .send(newReadingData);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        const reading = res.body.data; // Data itself is the reading object
        expect(reading).toHaveProperty('_id');
        // Check for userId field containing the populated user object
        expect(reading).toHaveProperty('userId');
        expect(typeof reading.userId).toBe('object'); // Should be populated object
        expect(reading.userId).toHaveProperty('_id', regularUserId.toString());
        expect(reading.userId).toHaveProperty('name'); // Check if name exists
        expect(reading).toHaveProperty('question', newReadingData.question);
        expect(reading).toHaveProperty('spread', newReadingData.spreadType); // Check for 'spread' field
        expect(reading).toHaveProperty('cards');
        expect(Array.isArray(reading.cards)).toBe(true);
        expect(reading.cards.length).toEqual(3); // 'Ba Lá Bài' has 3 cards
        expect(reading.cards[0]).toHaveProperty('cardId');
        expect(reading.cards[0]).toHaveProperty('isReversed');
        expect(reading.cards[0]).toHaveProperty('position', 1);

        createdReadingId = reading._id; // Save for later tests
    });

     // Test POST / - Lỗi khi thiếu câu hỏi (Validator should catch this)
     it('POST / - should return error if question is missing', async () => {
        expect(regularUserToken).toBeDefined();
        const invalidReadingData = { 
            spreadType: 'Ba Lá Bài',
            deckName: 'Reading Test Deck' // Still provide deck
        };

        const res = await request(app)
            .post('/api/readings')
            .set('Authorization', `Bearer ${regularUserToken}`)
            .send(invalidReadingData);

        expect(res.statusCode).toEqual(400); // Validation error
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('errors');
        // Check specific error message if validator is set up
        // expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'question' })]));
    });

    // Test POST / - Lỗi khi kiểu trải bài không hợp lệ
    it('POST / - should return error for invalid spread type', async () => {
        expect(regularUserToken).toBeDefined();
        const invalidReadingData = {
            question: 'Câu hỏi với kiểu trải bài sai?',
            spreadType: 'Kiểu Không Tồn Tại'
        };

        const res = await request(app)
            .post('/api/readings')
            .set('Authorization', `Bearer ${regularUserToken}`)
            .send(invalidReadingData);

        expect(res.statusCode).toEqual(400); // Expecting error from service/controller
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
        // Adjust regex slightly to be more robust or match exact message if preferred
        expect(res.body.message).toMatch(/Kiểu trải bài không hợp lệ hoặc không hoạt động/i); 
    });

     // Test POST / - Lỗi khi chưa đăng nhập
     it('POST / - should return 401 if user not logged in', async () => {
        const newReadingData = { question: 'Test?', spreadType: 'Ba Lá Bài' };
        const res = await request(app)
            .post('/api/readings')
            .send(newReadingData);

        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message', 'Bạn cần đăng nhập để truy cập tài nguyên này');
    });

    // Test GET /history - Lấy lịch sử đọc bài của người dùng
    it('GET /history - should return reading history for the logged in user', async () => {
        expect(regularUserToken).toBeDefined();
        expect(createdReadingId).toBeDefined(); // Ensure a reading was created

        const res = await request(app)
            .get('/api/readings/history')
            .set('Authorization', `Bearer ${regularUserToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
        // Check if the created reading is in the history
        expect(res.body.data.some(reading => reading._id === createdReadingId)).toBe(true);
        // Check pagination properties if implemented in response
        expect(res.body).toHaveProperty('pagination');
        expect(res.body.pagination).toHaveProperty('total');
        expect(res.body.pagination).toHaveProperty('page');
        expect(res.body.pagination).toHaveProperty('limit');
    });

    it('GET /history - should return 401 if user not logged in', async () => {
        const res = await request(app).get('/api/readings/history');
        expect(res.statusCode).toEqual(401);
    });

    // Test GET /:id - Lấy chi tiết lượt đọc bài
    it('GET /:id - should return reading details for the owner', async () => {
        expect(regularUserToken).toBeDefined();
        expect(createdReadingId).toBeDefined();

        const res = await request(app)
            .get(`/api/readings/${createdReadingId}`)
            .set('Authorization', `Bearer ${regularUserToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('_id', createdReadingId);
        expect(res.body.data).toHaveProperty('question', 'Câu hỏi test cho lượt xem bài?');
        // Check if user field is populated correctly
        expect(res.body.data).toHaveProperty('userId');
         if (typeof res.body.data.userId === 'object' && res.body.data.userId !== null) {
            expect(res.body.data.userId).toHaveProperty('_id', regularUserId.toString());
        } else {
            expect(res.body.data.userId).toEqual(regularUserId.toString());
        }
    });

    it('GET /:id - should return reading details for admin', async () => {
        expect(adminToken).toBeDefined();
        expect(createdReadingId).toBeDefined();

        const res = await request(app)
            .get(`/api/readings/${createdReadingId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('_id', createdReadingId);
    });

    it('GET /:id - should return 404 for non-existent reading ID', async () => {
        expect(regularUserToken).toBeDefined();
        const nonExistentId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .get(`/api/readings/${nonExistentId}`)
            .set('Authorization', `Bearer ${regularUserToken}`);

        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body.message).toMatch(/Không tìm thấy phiên đọc bài/);
    });

    it('GET /:id - should return 400 for invalid ID format', async () => {
        expect(regularUserToken).toBeDefined();
        const invalidId = 'invalid-id';
        const res = await request(app)
            .get(`/api/readings/${invalidId}`)
            .set('Authorization', `Bearer ${regularUserToken}`);

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('errors'); // Expect validation errors
    });

     it('GET /:id - should return 401 if user not logged in', async () => {
        expect(createdReadingId).toBeDefined();
        const res = await request(app).get(`/api/readings/${createdReadingId}`);
        expect(res.statusCode).toEqual(401);
    });

    // TODO: Test GET /:id - should return 403 if accessed by another user (need another user token)

    // Test PUT /:id/feedback - Thêm phản hồi (User)
    it('PUT /:id/feedback - should add feedback to the reading by the owner', async () => {
        expect(regularUserToken).toBeDefined();
        expect(createdReadingId).toBeDefined();

        const feedbackData = {
            rating: 5,
            comment: 'Diễn giải rất chính xác!'
        };

        const res = await request(app)
            .put(`/api/readings/${createdReadingId}/feedback`)
            .set('Authorization', `Bearer ${regularUserToken}`)
            .send(feedbackData);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('feedback');
        expect(res.body.data.feedback).toHaveProperty('rating', feedbackData.rating);
        expect(res.body.data.feedback).toHaveProperty('comment', feedbackData.comment);

        // Verify in DB (optional but good)
        const readingInDb = await Reading.findById(createdReadingId);
        expect(readingInDb.feedback.rating).toEqual(feedbackData.rating);
        expect(readingInDb.feedback.comment).toEqual(feedbackData.comment);
    });

    it('PUT /:id/feedback - should return error for invalid rating', async () => {
        expect(regularUserToken).toBeDefined();
        expect(createdReadingId).toBeDefined();
        const feedbackData = { rating: 6, comment: 'Rating sai' }; // Invalid rating

        const res = await request(app)
            .put(`/api/readings/${createdReadingId}/feedback`)
            .set('Authorization', `Bearer ${regularUserToken}`)
            .send(feedbackData);

        expect(res.statusCode).toEqual(400); // Validation error
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('errors'); // Expect validation errors from validator
    });

    it('PUT /:id/feedback - should return 403 if user is not the owner', async () => {
        expect(adminToken).toBeDefined(); // Use admin token (not owner)
        expect(createdReadingId).toBeDefined();
        const feedbackData = { rating: 4, comment: 'Admin feedback?' };

        const res = await request(app)
            .put(`/api/readings/${createdReadingId}/feedback`)
            .set('Authorization', `Bearer ${adminToken}`) // Use admin token
            .send(feedbackData);

        expect(res.statusCode).toEqual(403);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body.message).toMatch(/Bạn không có quyền thêm phản hồi/);
    });

     it('PUT /:id/feedback - should return 401 if user not logged in', async () => {
        expect(createdReadingId).toBeDefined();
        const feedbackData = { rating: 5 };
        const res = await request(app)
            .put(`/api/readings/${createdReadingId}/feedback`)
            .send(feedbackData);
        expect(res.statusCode).toEqual(401);
    });

    // Test PUT /reader/:id/interpret - Thêm diễn giải (Admin/Reader)
    it('PUT /reader/:id/interpret - should add interpretation by admin', async () => {
        expect(adminToken).toBeDefined();
        expect(createdReadingId).toBeDefined();

        const interpretationData = {
            interpretation: 'Đây là diễn giải của admin.'
        };

        const res = await request(app)
            .put(`/api/readings/reader/${createdReadingId}/interpret`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(interpretationData);

        // Expect successful response now that controller is fixed
        expect(res.statusCode).toEqual(200); 
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('interpretation', interpretationData.interpretation);
        expect(res.body.data).toHaveProperty('readerId', adminUserId.toString());


        // Verify in DB
        const readingInDb = await Reading.findById(createdReadingId);
        expect(readingInDb.interpretation).toEqual(interpretationData.interpretation);
        // Sửa: So sánh _id của readerId nếu nó là object (đã populate), hoặc chính nó nếu là ID
        const readerIdString = readingInDb.readerId._id ? readingInDb.readerId._id.toString() : readingInDb.readerId.toString();
        expect(readerIdString).toEqual(adminUserId.toString());
    });

    it('PUT /reader/:id/interpret - should return error if interpretation already exists', async () => {
        expect(adminToken).toBeDefined();
        expect(createdReadingId).toBeDefined(); // Reading now has interpretation from previous test
        const interpretationData = { interpretation: 'Diễn giải thứ hai?' };

        const res = await request(app)
            .put(`/api/readings/reader/${createdReadingId}/interpret`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(interpretationData);

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body.message).toMatch(/Phiên đọc bài này đã có diễn giải/);
    });

     it('PUT /reader/:id/interpret - should return 403 if user is not admin/reader', async () => {
        expect(regularUserToken).toBeDefined(); // Use regular user token
        expect(createdReadingId).toBeDefined();
        const interpretationData = { interpretation: 'User diễn giải?' };

        const res = await request(app)
            .put(`/api/readings/reader/${createdReadingId}/interpret`)
            .set('Authorization', `Bearer ${regularUserToken}`) // Use regular user
            .send(interpretationData);

        expect(res.statusCode).toEqual(403); // Forbidden by restrictTo middleware
        expect(res.body).toHaveProperty('success', false);
        expect(res.body.message).toMatch(/Bạn không có quyền thực hiện hành động này/);
    });

    it('PUT /reader/:id/interpret - should return 401 if user not logged in', async () => {
        expect(createdReadingId).toBeDefined();
        const interpretationData = { interpretation: 'Chưa đăng nhập' };
        const res = await request(app)
            .put(`/api/readings/reader/${createdReadingId}/interpret`)
            .send(interpretationData);
        expect(res.statusCode).toEqual(401);
    });

     it('PUT /reader/:id/interpret - should return validation error if interpretation is missing', async () => {
        expect(adminToken).toBeDefined();
        // Need a new reading without interpretation for this test
        const readingForValidation = await Reading.create({
            userId: regularUserId,
            spread: 'Ba Lá Bài',
            question: 'Test validation diễn giải',
            cards: [] // Simplified for this test
        });
        const interpretationData = {}; // Missing interpretation

        const res = await request(app)
            .put(`/api/readings/reader/${readingForValidation._id}/interpret`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(interpretationData);

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('errors'); // Expect validation errors
        await Reading.findByIdAndDelete(readingForValidation._id); // Clean up
    });

    // --- Admin CRUD Tests ---

    let adminCreatedReadingId; // ID for reading created specifically for admin tests

    // Test GET /admin/all - Lấy tất cả readings (Admin)
    it('GET /admin/all - should return all readings for admin', async () => {
        expect(adminToken).toBeDefined();
        // Ensure at least the reading created by the user exists
        expect(createdReadingId).toBeDefined(); 

        const res = await request(app)
            .get('/api/readings/admin/all')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1); // Should have at least one reading
        expect(res.body).toHaveProperty('pagination');
        // Check if the user reading is present
        expect(res.body.data.some(r => r._id === createdReadingId)).toBe(true);
    });

    it('GET /admin/all - should return 403 for non-admin user', async () => {
        expect(regularUserToken).toBeDefined();
        const res = await request(app)
            .get('/api/readings/admin/all')
            .set('Authorization', `Bearer ${regularUserToken}`);
        expect(res.statusCode).toEqual(403);
    });

    // Test PUT /admin/:id - Cập nhật reading (Admin)
    it('PUT /admin/:id - should update a reading by admin', async () => {
        expect(adminToken).toBeDefined();
        // Create a specific reading to update/delete in admin tests
        const readingToUpdate = await Reading.create({
            userId: regularUserId,
            spread: 'Ba Lá Bài',
            question: 'Reading để admin cập nhật',
            cards: [], // Simplified
            isPublic: false
        });
        adminCreatedReadingId = readingToUpdate._id.toString();

        const updateData = {
            question: 'Câu hỏi đã được admin cập nhật',
            isPublic: true
        };

        const res = await request(app)
            .put(`/api/readings/admin/${adminCreatedReadingId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateData);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('_id', adminCreatedReadingId);
        expect(res.body.data).toHaveProperty('question', updateData.question);
        expect(res.body.data).toHaveProperty('isPublic', updateData.isPublic);

        // Verify in DB
        const updatedReadingInDb = await Reading.findById(adminCreatedReadingId);
        expect(updatedReadingInDb.question).toEqual(updateData.question);
        expect(updatedReadingInDb.isPublic).toEqual(updateData.isPublic);
    });

     it('PUT /admin/:id - should return 400 for invalid update data (if validator exists)', async () => {
        expect(adminToken).toBeDefined();
        expect(adminCreatedReadingId).toBeDefined();
        const invalidUpdateData = { isPublic: 'not-a-boolean' }; // Invalid data type

        const res = await request(app)
            .put(`/api/readings/admin/${adminCreatedReadingId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(invalidUpdateData);

        // Expecting 400 due to Mongoose validation or specific validator
        expect(res.statusCode).toEqual(400); 
        expect(res.body).toHaveProperty('success', false);
        // Check for specific error message if possible
        // expect(res.body.message).toMatch(/validation failed/i); 
    });

    it('PUT /admin/:id - should return 403 for non-admin user', async () => {
        expect(regularUserToken).toBeDefined();
        expect(adminCreatedReadingId).toBeDefined();
        const updateData = { question: 'User cố cập nhật' };

        const res = await request(app)
            .put(`/api/readings/admin/${adminCreatedReadingId}`)
            .set('Authorization', `Bearer ${regularUserToken}`)
            .send(updateData);
        expect(res.statusCode).toEqual(403);
    });

    // Test DELETE /admin/:id - Xóa reading (Admin)
    it('DELETE /admin/:id - should delete a reading by admin', async () => {
        expect(adminToken).toBeDefined();
        expect(adminCreatedReadingId).toBeDefined();

        const res = await request(app)
            .delete(`/api/readings/admin/${adminCreatedReadingId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.message).toMatch(/Phiên đọc bài đã được xóa thành công/);
        expect(res.body.data).toHaveProperty('deletedReadingId', adminCreatedReadingId);

        // Verify deletion in DB
        const deletedReading = await Reading.findById(adminCreatedReadingId);
        expect(deletedReading).toBeNull();
    });

    it('DELETE /admin/:id - should return 404 for non-existent ID', async () => {
        expect(adminToken).toBeDefined();
        const nonExistentId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .delete(`/api/readings/admin/${nonExistentId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(404);
    });

    it('DELETE /admin/:id - should return 403 for non-admin user', async () => {
        expect(regularUserToken).toBeDefined();
        // Use the first reading created by the user for this test
        expect(createdReadingId).toBeDefined(); 
        const res = await request(app)
            .delete(`/api/readings/admin/${createdReadingId}`)
            .set('Authorization', `Bearer ${regularUserToken}`);
        expect(res.statusCode).toEqual(403);
    });


});
