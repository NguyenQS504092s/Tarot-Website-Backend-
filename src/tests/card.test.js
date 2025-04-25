const request = require('supertest');
require('dotenv').config();
const app = require('../app');
const mongoose = require('mongoose');
const Card = require('../models/cardModel');
const User = require('../models/userModel'); // Needed for admin user
const { connectDB, closeDB } = require('../config/database');
const Zodiac = require('../models/zodiacModel'); // Import other models for cleanup
const Horoscope = require('../models/horoscopeModel');
const Reading = require('../models/readingModel');

let adminToken;
let testCardId; // To store the ID of a card for single card tests

// Standardized Seed data with a unique deck name for this suite
const cardTestDeckName = 'Card Test Deck';
const sampleCardData = [
    { name: 'The Fool CT', number: 0, type: 'Major Arcana', suit: null, deck: cardTestDeckName, imageUrl: 'ct00.jpg', uprightMeaning: '...', reversedMeaning: '...', description: '...' },
    { name: 'The Magician CT', number: 1, type: 'Major Arcana', suit: null, deck: cardTestDeckName, imageUrl: 'ct01.jpg', uprightMeaning: '...', reversedMeaning: '...', description: '...' },
    { name: 'Ace of Wands CT', number: 1, type: 'Minor Arcana', suit: 'Gậy', deck: cardTestDeckName, imageUrl: 'ctw01.jpg', uprightMeaning: '...', reversedMeaning: '...', description: '...' },
    { name: 'Two of Wands CT', number: 2, type: 'Minor Arcana', suit: 'Gậy', deck: cardTestDeckName, imageUrl: 'ctw02.jpg', uprightMeaning: '...', reversedMeaning: '...', description: '...' },
    { name: 'Ace of Cups CT', number: 1, type: 'Minor Arcana', suit: 'Cốc', deck: cardTestDeckName, imageUrl: 'ctc01.jpg', uprightMeaning: '...', reversedMeaning: '...', description: '...' },
];

beforeAll(async () => {
    await connectDB();
    // Clear ALL potentially relevant test data before seeding for this suite
    await User.deleteMany({});
    await Zodiac.deleteMany({});
    await Horoscope.deleteMany({});
    await Card.deleteMany({});
    await Reading.deleteMany({});

    // Seed cards for this suite
    const createdCards = await Card.insertMany(sampleCardData);
    testCardId = createdCards[0]._id.toString(); // Get ID of the first seeded card

    // Create and login admin user for protected routes (if any needed later)
    const adminUser = await User.create({
        name: 'Admin Card Tester',
        email: 'admin_cardtest@test.com',
        password: 'adminpassword',
        role: 'admin' // Ensure role is admin
    });
    // Login admin user to get token
    const res = await request(app)
        .post('/api/users/login')
        .send({
            email: 'admin_cardtest@test.com',
            password: 'adminpassword'
        });
    if (res.body.data && res.body.data.token) {
        adminToken = res.body.data.token;
    } else {
        console.error("Admin login failed in beforeAll:", res.body);
        // Throw an error or handle appropriately if admin login is critical
    }
});

afterAll(async () => {
    // Clean up test data specific to this suite
    await Card.deleteMany({ deck: cardTestDeckName });
    await User.deleteMany({ email: 'admin_cardtest@test.com' });
    await closeDB();
});

describe('Tarot Card API (/api/cards)', () => {

    // Test GET all cards
    it('GET / - should return all tarot cards', async () => {
        const res = await request(app).get('/api/cards');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('cards');
        expect(Array.isArray(res.body.data.cards)).toBe(true);
        // Check against the count seeded in *this* test suite
        expect(res.body.data.cards.length).toEqual(sampleCardData.length); 
    });

    // Test GET single card by ID
    it('GET /:id - should return a single card by ID', async () => {
        expect(testCardId).toBeDefined(); // Ensure we have an ID from seeding

        const res = await request(app).get(`/api/cards/${testCardId}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('card');
        expect(res.body.data.card).toHaveProperty('_id', testCardId);
        expect(res.body.data.card).toHaveProperty('name', sampleCardData[0].name);
    });

    // Test GET single card with invalid ID
    it('GET /:id - should return 404 for non-existent card ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId(); // Generate a valid but non-existent ID
        const res = await request(app).get(`/api/cards/${nonExistentId}`);

        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('success', false);
        // Update message to match the one thrown by the service
        expect(res.body.message).toMatch(/Không tìm thấy lá bài với ID:/); 
    });

     // Test GET single card with invalid ID format
     it('GET /:id - should return 400 for invalid ID format', async () => {
        const invalidId = 'invalid-id-format';
        const res = await request(app).get(`/api/cards/${invalidId}`);

        expect(res.statusCode).toEqual(400); // Expect validation error
        expect(res.body).toHaveProperty('success', false);
        // Check for validation error message if possible
        expect(res.body).toHaveProperty('message');
    });

    // Test GET cards by deck (Major Arcana)
    it('GET /deck/:deckName - should return cards for Major Arcana', async () => {
        const res = await request(app).get('/api/cards/deck/Major%20Arcana'); // URL encode space

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        // This query is for deck 'Major Arcana', but we seeded 'Card Test Deck'. Should return 0.
        expect(res.body.data.cards.length).toEqual(0); 
        // expect(res.body.data.cards.every(card => card.type === 'Major Arcana')).toBe(true); // Cannot check type if empty
    });

     // Test GET cards by deck (Wands) - Adjusted to test the specific test deck
    it('GET /deck/:deckName - should return cards for the test deck', async () => {
        // Test getting by the specific test deck name
        const res = await request(app).get(`/api/cards/deck/${encodeURIComponent(cardTestDeckName)}`); 

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        // Should return all cards from this test deck
        expect(res.body.data.cards.length).toEqual(sampleCardData.length); 
        expect(res.body.data.cards.every(card => card.deck === cardTestDeckName)).toBe(true); 
    });

    // Test GET cards by deck (Invalid Deck) - Should still return 200 empty
    it('GET /deck/:deckName - should return empty array for invalid deck', async () => {
        const res = await request(app).get('/api/cards/deck/SomeOtherDeckName');

        expect(res.statusCode).toEqual(200); 
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data.cards.length).toEqual(0);
    });

    // Test GET cards by type (Major Arcana) - Check count based on *this* suite's data
    it('GET /type/:cardType - should return cards for Major Arcana type', async () => {
        const res = await request(app).get('/api/cards/type/Major%20Arcana'); 

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data.cards.length).toEqual(2); // 2 Major Arcana seeded here
        expect(res.body.data.cards.every(card => card.type === 'Major Arcana')).toBe(true); 
    });

    // Test GET cards by type (Minor Arcana) - Check count based on *this* suite's data
    it('GET /type/:cardType - should return cards for Minor Arcana type', async () => {
        const res = await request(app).get('/api/cards/type/Minor%20Arcana');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data.cards.length).toEqual(3); // 3 Minor Arcana seeded here
        expect(res.body.data.cards.every(card => card.type === 'Minor Arcana')).toBe(true); 
    });

     // Test GET cards by type (Invalid Type) - Should return 200 with empty array now
     it('GET /type/:cardType - should return empty array for invalid type', async () => {
        const res = await request(app).get('/api/cards/type/InvalidType');

        expect(res.statusCode).toEqual(200); // Expect 200 OK
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('cards');
        expect(res.body.data.cards.length).toEqual(0); // Expect empty array
    });

    // TODO: Add tests for Admin CRUD operations (POST, PUT, DELETE) using adminToken
    // Example:
    // it('POST / - should create a new card (Admin only)', async () => { ... });
    // --- Admin CRUD Tests ---
    let createdCardId; // To store ID of card created by admin tests

    // Test POST / - Create card (Admin only)
    it('POST / - should create a new card (Admin only)', async () => {
        expect(adminToken).toBeDefined(); // Ensure admin is logged in

        const newCardData = {
            name: 'The Test Card',
            number: 99,
            type: 'Major Arcana',
            suit: null,
            deck: 'Test Deck',
            imageUrl: 'test.jpg',
            keywords: ['testing', 'creation'],
            uprightMeaning: 'Successful test creation.',
            reversedMeaning: 'Failed test creation.',
            description: 'A card created for testing purposes.',
        };

        const res = await request(app)
            .post('/api/cards')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(newCardData);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('card');
        expect(res.body.data.card).toHaveProperty('name', newCardData.name);
        expect(res.body.data.card).toHaveProperty('_id');
        createdCardId = res.body.data.card._id; // Save ID for update/delete tests
    });

    // Test POST / - Create card with duplicate name (Admin only)
    it('POST / - should return error for duplicate card name (Admin only)', async () => {
        expect(adminToken).toBeDefined();
        const duplicateCardData = sampleCardData[0]; // Use name from seeded data

        const res = await request(app)
            .post('/api/cards')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(duplicateCardData);

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body.message).toMatch(/đã tồn tại/);
    });

     // Test POST / - Create card without required fields (Admin only)
     it('POST / - should return validation error for missing required fields (Admin only)', async () => {
        expect(adminToken).toBeDefined();
        const incompleteCardData = { name: 'Incomplete Card' }; // Missing many fields

        const res = await request(app)
            .post('/api/cards')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(incompleteCardData);

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('errors'); // Check for validation errors array
    });

    // Test PUT /:id - Update card (Admin only)
    it('PUT /:id - should update a card successfully (Admin only)', async () => {
        expect(adminToken).toBeDefined();
        expect(createdCardId).toBeDefined(); // Ensure we have a card to update

        const updateData = {
            keywords: ['testing', 'creation', 'updated'],
            description: 'Updated description.'
        };

        const res = await request(app)
            .put(`/api/cards/${createdCardId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateData);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('card');
        expect(res.body.data.card).toHaveProperty('_id', createdCardId);
        expect(res.body.data.card).toHaveProperty('keywords', updateData.keywords);
        expect(res.body.data.card).toHaveProperty('description', updateData.description);
    });

    // Test PUT /:id - Update non-existent card (Admin only)
    it('PUT /:id - should return 404 for non-existent card ID (Admin only)', async () => {
        expect(adminToken).toBeDefined();
        const nonExistentId = new mongoose.Types.ObjectId();
        const updateData = { description: 'Trying to update non-existent' };

        const res = await request(app)
            .put(`/api/cards/${nonExistentId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateData);

        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body.message).toMatch(/Không tìm thấy lá bài với ID:/);
    });

    // Test DELETE /:id - Delete card (Admin only)
    it('DELETE /:id - should delete a card successfully (Admin only)', async () => {
        expect(adminToken).toBeDefined();
        expect(createdCardId).toBeDefined(); // Ensure we have a card to delete

        const res = await request(app)
            .delete(`/api/cards/${createdCardId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('message', 'Lá bài đã được xóa');

        // Verify the card is actually deleted
        const deletedCard = await Card.findById(createdCardId);
        expect(deletedCard).toBeNull();
    });

     // Test DELETE /:id - Delete non-existent card (Admin only)
     it('DELETE /:id - should return 404 for non-existent card ID (Admin only)', async () => {
        expect(adminToken).toBeDefined();
        const nonExistentId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .delete(`/api/cards/${nonExistentId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body.message).toMatch(/Không tìm thấy lá bài với ID:/);
    });

     // Test Access Denied for non-admin user
     it('POST / - should return 403 Forbidden for non-admin user', async () => {
        // Need a non-admin token. Let's quickly register and login a regular user.
        const regularUserData = { name: 'Regular User', email: `regular_${Date.now()}@test.com`, password: 'password', passwordConfirm: 'password' };
        await request(app).post('/api/users/register').send(regularUserData);
        const loginRes = await request(app).post('/api/users/login').send({ email: regularUserData.email, password: 'password' });
        const regularToken = loginRes.body.data.token;

        const newCardData = { name: 'Forbidden Card', type: 'Major Arcana', deck: 'Forbidden', imageUrl: 'f.jpg', uprightMeaning: '...', reversedMeaning: '...', description: '...' };

        const res = await request(app)
            .post('/api/cards')
            .set('Authorization', `Bearer ${regularToken}`)
            .send(newCardData);

        expect(res.statusCode).toEqual(403);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message', 'Bạn không có quyền thực hiện hành động này');

        // Clean up regular user
        await User.deleteOne({ email: regularUserData.email });
    });

});
