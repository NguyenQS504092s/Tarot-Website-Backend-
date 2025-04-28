const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Assuming your Express app is exported from app.js
const { connectDB, closeDB } = require('../config/database'); // Correct import path and names
const { clearTestDB } = require('./setup'); // Import clearTestDB from setup
const User = require('../models/userModel');
const Spread = require('../models/spreadModel');
const { generateToken } = require('../utils/jwtUtils');
const bcrypt = require('bcryptjs');

// --- Test Data ---
const sampleAdminUserData = {
    name: 'Admin Spread Tester',
    email: 'admin.spread@test.com',
    password: 'password123',
    role: 'admin',
};

const sampleUserData = {
    name: 'User Spread Tester',
    email: 'user.spread@test.com',
    password: 'password123',
    role: 'user',
};

const sampleSpreadData1 = {
    name: 'Celtic Cross Test',
    // slug: 'celtic-cross-test', // Not in schema
    description: 'A classic spread for detailed insights.',
    cardCount: 10, // Correct field name
    positions: [ // Correct field name & structure
        { positionNumber: 1, name: 'Present', meaning: 'Current situation' },
        { positionNumber: 2, name: 'Challenge', meaning: 'Obstacles' },
        { positionNumber: 3, name: 'Past', meaning: 'Background influences' },
        { positionNumber: 4, name: 'Future', meaning: 'Near future possibilities' },
        { positionNumber: 5, name: 'Conscious', meaning: 'Goals, conscious thoughts' },
        { positionNumber: 6, name: 'Unconscious', meaning: 'Underlying factors' },
        { positionNumber: 7, name: 'Advice', meaning: 'Guidance' },
        { positionNumber: 8, name: 'External Influences', meaning: 'Environment, others' },
        { positionNumber: 9, name: 'Hopes and Fears', meaning: 'Aspirations and anxieties' },
        { positionNumber: 10, name: 'Outcome', meaning: 'Likely result' },
    ],
    // category: 'General', // Not in schema
    // keywords: ['insight', 'detailed', 'classic'], // Not in schema
    isActive: true, // Correct field name
};

const sampleSpreadData2 = {
    name: 'Three Card Test',
    // slug: 'three-card-test', // Not in schema
    description: 'A simple spread for quick guidance.',
    cardCount: 3, // Correct field name
    positions: [ // Correct field name & structure
        { positionNumber: 1, name: 'Past', meaning: 'Influences from the past' },
        { positionNumber: 2, name: 'Present', meaning: 'Current situation' },
        { positionNumber: 3, name: 'Future', meaning: 'Potential outcome' },
    ],
    // category: 'Quick', // Not in schema
    // keywords: ['simple', 'quick', 'guidance'], // Not in schema
    isActive: true, // Correct field name
};

let adminUser;
let normalUser;
let adminToken;
let userToken;
let spread1;
let spread2;

// --- Test Suite ---
describe('Spread API Endpoints', () => {
    // --- Hooks ---
    beforeAll(async () => {
        await connectDB(); // Use correct function name
    });

    beforeEach(async () => {
        await clearTestDB(); // Corrected function call

        // Create users
        const salt = await bcrypt.genSalt(10);
        const hashedAdminPassword = await bcrypt.hash(sampleAdminUserData.password, salt);
        const hashedUserPassword = await bcrypt.hash(sampleUserData.password, salt);

        adminUser = await User.create({ ...sampleAdminUserData, password: hashedAdminPassword });
        normalUser = await User.create({ ...sampleUserData, password: hashedUserPassword });

        // Generate tokens
        adminToken = generateToken(adminUser._id);
        userToken = generateToken(normalUser._id);

        // Seed spreads
        spread1 = await Spread.create(sampleSpreadData1);
        spread2 = await Spread.create(sampleSpreadData2);
    });

    afterAll(async () => {
        await closeDB(); // Use correct function name
    });

    // --- Test Cases ---

    // == Public Access ==
    describe('GET /api/spreads (Public)', () => {
        it('should return a list of public spreads', async () => {
            const res = await request(app)
                .get('/api/spreads')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body.success).toBe(true);
            // Assuming the controller returns data directly in res.body.data if successful
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBeGreaterThanOrEqual(2); // At least the two seeded ones
            expect(res.body.data[0]).toHaveProperty('name', sampleSpreadData1.name);
            expect(res.body.data[1]).toHaveProperty('name', sampleSpreadData2.name);
            // Ensure inactive spreads are not returned by the public route
            const inactiveSpread = res.body.data.find(s => s.isActive === false);
            expect(inactiveSpread).toBeUndefined();
        });

        it('should return an empty array if no public spreads exist', async () => {
            await Spread.deleteMany({}); // Clear spreads
            const res = await request(app)
                .get('/api/spreads')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body.success).toBe(true);
            // Assuming the controller returns data directly in res.body.data
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBe(0);
        });
    });

    // == Admin CRUD ==
    // == Admin CRUD == (Note: Admin routes are prefixed with /admin)
    describe('POST /api/spreads/admin (Admin)', () => {
        // Data sent in the request body - might still need slug, category, keywords if API handles them
        // But ensure it matches schema structure for fields that ARE in the schema
        const newSpreadDataForRequest = {
            name: 'Relationship Test Spread',
            slug: 'relationship-test', // Keep slug if API endpoint expects/handles it
            description: 'For relationship insights.',
            cardCount: 5, // Correct field name
            positions: [ // Correct field name & structure
                { positionNumber: 1, name: 'You', meaning: 'Your perspective' },
                { positionNumber: 2, name: 'Partner', meaning: 'Partner\'s perspective' },
                { positionNumber: 3, name: 'Foundation', meaning: 'Basis of the relationship' },
                { positionNumber: 4, name: 'Challenge', meaning: 'Current obstacles' },
                { positionNumber: 5, name: 'Potential', meaning: 'Future possibilities' }
            ],
            category: 'Relationship', // Keep if API endpoint expects/handles it
            keywords: ['love', 'partner'], // Keep if API endpoint expects/handles it
            isActive: true, // Correct field name
        };

        it('should allow admin to create a new spread', async () => {
            const res = await request(app)
                .post('/api/spreads/admin') // Correct path
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newSpreadDataForRequest) // Use updated data structure for request
                .expect('Content-Type', /json/)
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.data.spread).toHaveProperty('_id');
            expect(res.body.data.spread.name).toBe(newSpreadDataForRequest.name);
            // expect(res.body.data.spread.slug).toBe(newSpreadDataForRequest.slug); // Check if slug is returned

            // Verify in DB
            const dbSpread = await Spread.findById(res.body.data.spread._id);
            expect(dbSpread).not.toBeNull();
            expect(dbSpread.name).toBe(newSpreadDataForRequest.name);
            expect(dbSpread.cardCount).toBe(newSpreadDataForRequest.cardCount); // Verify correct field
            expect(dbSpread.positions.length).toBe(newSpreadDataForRequest.positions.length); // Verify positions
            expect(dbSpread.isActive).toBe(newSpreadDataForRequest.isActive); // Verify correct field
        });

        it('should prevent non-admin from creating a spread', async () => {
            const res = await request(app)
                .post('/api/spreads/admin') // Correct path
                .set('Authorization', `Bearer ${userToken}`)
                .send(newSpreadDataForRequest) // Use updated data structure
                .expect('Content-Type', /json/)
                .expect(403); // Forbidden

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Bạn không có quyền thực hiện hành động này'); // Expect Vietnamese message
        });

        it('should return validation errors for invalid data', async () => {
            // Ensure invalid data still uses the correct structure where possible
            // Ensure invalid data still uses the correct structure where possible
            const invalidData = { ...newSpreadDataForRequest, name: '' }; // Missing name
            const res = await request(app)
                .post('/api/spreads/admin') // Correct path
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidData)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(res.body.success).toBe(false);
            // Check message instead of errors array
            expect(res.body.message).toContain('Tên kiểu trải bài là bắt buộc'); // Expect Vietnamese validation message
            // expect(res.body.errors).toBeInstanceOf(Array); // Remove this check
            // expect(res.body.errors[0].msg).toContain('Spread name is required'); // Remove this check
        });

         // This test might need adjustment as 'slug' is not in the schema.
         // The unique constraint is on 'name'. Let's test duplicate name instead.
         it('should prevent creating a spread with a duplicate name', async () => {
             const duplicateNameData = { ...newSpreadDataForRequest, name: sampleSpreadData1.name };
             const res = await request(app)
                 .post('/api/spreads/admin') // Correct path
                 .set('Authorization', `Bearer ${adminToken}`)
                 .send(duplicateNameData) // Use existing name
                 .expect('Content-Type', /json/)
                 .expect(400);

             expect(res.body.success).toBe(false);
             // Expect specific Vietnamese message for duplicate name
             expect(res.body.message).toContain(`Kiểu trải bài với tên "${sampleSpreadData1.name}" đã tồn tại`);
         });
    });

    // Test both public and admin GET by ID
    describe('GET /api/spreads/:id (Public/Admin)', () => {
        // Test public access (should succeed for active spreads)
        it('should allow public to get an active spread by ID', async () => {
            const res = await request(app)
                .get(`/api/spreads/${spread1._id}`) // Public path
                // No Authorization header needed
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.spread).toHaveProperty('_id', spread1._id.toString());
            expect(res.body.data.spread.name).toBe(sampleSpreadData1.name);
            expect(res.body.data.spread.isActive).toBe(true); // Assuming spread1 is active
        });

        // Test admin access to the admin-specific endpoint
        it('should allow admin to get a specific spread by ID via admin route', async () => {
            const res = await request(app)
                .get(`/api/spreads/admin/${spread1._id}`) // Admin path
                .set('Authorization', `Bearer ${adminToken}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.spread).toHaveProperty('_id', spread1._id.toString());
            expect(res.body.data.spread.name).toBe(sampleSpreadData1.name);
        });

        // Test that non-admin CANNOT access the ADMIN endpoint
        it('should prevent non-admin from getting a specific spread via admin route', async () => {
             const res = await request(app)
                .get(`/api/spreads/admin/${spread1._id}`) // Target admin path
                .set('Authorization', `Bearer ${userToken}`) // Use normal user token
                .expect('Content-Type', /json/)
                .expect(403); // Forbidden

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Bạn không có quyền thực hiện hành động này'); // Expect Vietnamese message
        });

        // Test 404 for admin route
        it('should return 404 via admin route if spread ID does not exist', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/spreads/admin/${nonExistentId}`) // Admin path
                .set('Authorization', `Bearer ${adminToken}`)
                .expect('Content-Type', /json/)
                .expect(404);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Không tìm thấy kiểu trải bài'); // Expect Vietnamese message
        });

         // Test invalid ID for admin route
         it('should return 400 via admin route for invalid spread ID format', async () => {
            const invalidId = 'invalid-id-format';
            const res = await request(app)
                .get(`/api/spreads/admin/${invalidId}`) // Admin path
                .set('Authorization', `Bearer ${adminToken}`)
                .expect('Content-Type', /json/)
                .expect(400); // Bad Request due to CastError (or validator)

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('ID kiểu trải bài không hợp lệ'); // Expect Vietnamese message
        });
    });

    describe('PUT /api/spreads/admin/:id (Admin)', () => {
        // Update data should also use correct field names
        const updateData = {
            name: 'Updated Celtic Cross Test',
            description: 'An updated description.',
            isActive: false, // Use isActive
        };

        it('should allow admin to update a spread', async () => {
            const res = await request(app)
                .put(`/api/spreads/admin/${spread1._id}`) // Correct path
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.spread.name).toBe(updateData.name);
            expect(res.body.data.spread.description).toBe(updateData.description);
            expect(res.body.data.spread.isActive).toBe(updateData.isActive); // Check isActive

            // Verify in DB
            const dbSpread = await Spread.findById(spread1._id);
            expect(dbSpread.name).toBe(updateData.name);
            expect(dbSpread.isActive).toBe(false); // Check isActive
        });

        it('should prevent non-admin from updating a spread', async () => {
            const res = await request(app)
                .put(`/api/spreads/admin/${spread1._id}`) // Correct path
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData)
                .expect('Content-Type', /json/)
                .expect(403); // Forbidden

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Bạn không có quyền thực hiện hành động này'); // Expect Vietnamese message
        });

        it('should return validation errors for invalid update data', async () => {
            const invalidUpdate = { name: '' }; // Empty name
            const res = await request(app)
                .put(`/api/spreads/admin/${spread1._id}`) // Correct path
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidUpdate)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(res.body.success).toBe(false);
            // Check message instead of errors array
            expect(res.body.message).toContain('Tên kiểu trải bài là bắt buộc'); // Expect Vietnamese validation message
            // expect(res.body.errors).toBeInstanceOf(Array); // Remove this check
            // expect(res.body.errors[0].msg).toContain('Spread name is required'); // Remove this check
        });

        it('should return 404 if updating a non-existent spread ID', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .put(`/api/spreads/admin/${nonExistentId}`) // Correct path
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect('Content-Type', /json/)
                .expect(404);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Không tìm thấy kiểu trải bài để cập nhật'); // Expect Vietnamese message
        });

        // This test needs adjustment as 'slug' is not in the schema.
        // Test preventing update to duplicate 'name' instead.
        it('should prevent updating name to an existing one', async () => {
            const conflictingUpdate = { name: sampleSpreadData2.name }; // Name of spread2
            const res = await request(app)
                .put(`/api/spreads/admin/${spread1._id}`) // Correct path
                .set('Authorization', `Bearer ${adminToken}`)
                .send(conflictingUpdate)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(res.body.success).toBe(false);
            // Expect specific Vietnamese message for duplicate name
            expect(res.body.message).toContain(`Tên kiểu trải bài "${sampleSpreadData2.name}" đã tồn tại`);
        });
    });

    describe('DELETE /api/spreads/admin/:id (Admin)', () => {
        it('should allow admin to delete a spread (soft delete)', async () => {
            const res = await request(app)
                .delete(`/api/spreads/admin/${spread1._id}`) // Correct path
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(204); // Expect 204 No Content for successful deletion

            // Verify in DB that the spread is marked inactive, not actually deleted
            const dbSpread = await Spread.findById(spread1._id);
            expect(dbSpread).not.toBeNull(); // Should still exist
            expect(dbSpread.isActive).toBe(false); // Should be inactive
        });

        it('should prevent non-admin from deleting a spread', async () => {
            const res = await request(app)
                .delete(`/api/spreads/admin/${spread1._id}`) // Correct path
                .set('Authorization', `Bearer ${userToken}`)
                .expect('Content-Type', /json/)
                .expect(403); // Forbidden

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Bạn không có quyền thực hiện hành động này'); // Expect Vietnamese message
        });

        it('should return 404 if deleting a non-existent spread ID', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .delete(`/api/spreads/admin/${nonExistentId}`) // Correct path
                .set('Authorization', `Bearer ${adminToken}`)
                .expect('Content-Type', /json/)
                .expect(404);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Không tìm thấy kiểu trải bài để xóa'); // Expect Vietnamese message
        });

         it('should return 400 for invalid spread ID format on delete', async () => {
            const invalidId = 'invalid-id-format';
            const res = await request(app)
                .delete(`/api/spreads/admin/${invalidId}`) // Correct path
                .set('Authorization', `Bearer ${adminToken}`)
                .expect('Content-Type', /json/)
                .expect(400); // Bad Request due to CastError (or validator)

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('ID kiểu trải bài không hợp lệ'); // Expect Vietnamese message
        });
    });
});
