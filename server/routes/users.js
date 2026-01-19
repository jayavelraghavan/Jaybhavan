const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const { getDB } = require('../database/db');

// Login
router.post('/login', async (req, res) => {
    try {
        const db = getDB();
        const { username, password } = req.body;
        const user = await db.collection('users').findOne({ username });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // For default admin, check plain password
        if (username === 'admin' && password === 'admin123') {
            const { password: _, ...userWithoutPassword } = user;
            return res.json({ user: userWithoutPassword, message: 'Login successful' });
        }

        // For other users, use bcrypt
        if (user.password === password || (user.password && bcrypt.compareSync(password, user.password))) {
            const { password: _, ...userWithoutPassword } = user;
            res.json({ user: userWithoutPassword, message: 'Login successful' });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all users
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const users = await db.collection('users').find({}).project({ password: 0 }).toArray();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        let user;
        
        if (ObjectId.isValid(req.params.id)) {
            user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) }, { projection: { password: 0 } });
        }
        
        if (!user) {
            user = await db.collection('users').findOne({ id: parseInt(req.params.id) }, { projection: { password: 0 } });
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new user
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { username, password, role, cashierCode, employeeId } = req.body;

        const existingUser = await db.collection('users').findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = password ? bcrypt.hashSync(password, 10) : '';

        const newUser = {
            username,
            password: hashedPassword,
            role: role || 'user',
            cashier_code: cashierCode || '',
            employee_id: employeeId || null,
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await db.collection('users').insertOne(newUser);
        res.json({ id: result.insertedId, message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const db = getDB();
        const updateData = {
            ...req.body,
            updated_at: new Date()
        };

        if (req.body.password) {
            updateData.password = bcrypt.hashSync(req.body.password, 10);
        }

        let result;
        if (ObjectId.isValid(req.params.id)) {
            result = await db.collection('users').updateOne(
                { _id: new ObjectId(req.params.id) },
                { $set: updateData }
            );
        } else {
            result = await db.collection('users').updateOne(
                { id: parseInt(req.params.id) },
                { $set: updateData }
            );
        }

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const db = getDB();
        let result;
        
        if (ObjectId.isValid(req.params.id)) {
            result = await db.collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
        } else {
            result = await db.collection('users').deleteOne({ id: parseInt(req.params.id) });
        }

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset password
router.post('/:id/reset-password', async (req, res) => {
    try {
        const db = getDB();
        const hashedPassword = bcrypt.hashSync(req.body.newPassword, 10);
        
        let result;
        if (ObjectId.isValid(req.params.id)) {
            result = await db.collection('users').updateOne(
                { _id: new ObjectId(req.params.id) },
                { $set: { password: hashedPassword, updated_at: new Date() } }
            );
        } else {
            result = await db.collection('users').updateOne(
                { id: parseInt(req.params.id) },
                { $set: { password: hashedPassword, updated_at: new Date() } }
            );
        }

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
