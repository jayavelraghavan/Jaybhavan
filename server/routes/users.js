const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');

// Login
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const user = db.get('users').find({ username }).value();

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
router.get('/', (req, res) => {
    try {
        const users = db.get('users').value().map(({ password, ...user }) => user);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user by ID
router.get('/:id', (req, res) => {
    try {
        const user = db.get('users').find({ id: parseInt(req.params.id) }).value();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new user
router.post('/', (req, res) => {
    try {
        const { username, password, role, cashierCode, employeeId } = req.body;
        const users = db.get('users').value();
        const maxId = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) : 0;
        const newId = maxId + 1;

        const existingUser = db.get('users').find({ username }).value();
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = password ? bcrypt.hashSync(password, 10) : '';

        const newUser = {
            id: newId,
            username,
            password: hashedPassword,
            role: role || 'user',
            cashier_code: cashierCode || '',
            employee_id: employeeId || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        db.get('users').push(newUser).write();
        res.json({ id: newId, message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user
router.put('/:id', (req, res) => {
    try {
        const user = db.get('users').find({ id: parseInt(req.params.id) });
        if (!user.value()) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updateData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };

        if (req.body.password) {
            updateData.password = bcrypt.hashSync(req.body.password, 10);
        }

        user.assign(updateData).write();
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete user
router.delete('/:id', (req, res) => {
    try {
        const user = db.get('users').find({ id: parseInt(req.params.id) });
        if (!user.value()) {
            return res.status(404).json({ error: 'User not found' });
        }

        db.get('users').remove({ id: parseInt(req.params.id) }).write();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset password
router.post('/:id/reset-password', (req, res) => {
    try {
        const user = db.get('users').find({ id: parseInt(req.params.id) });
        if (!user.value()) {
            return res.status(404).json({ error: 'User not found' });
        }

        const hashedPassword = bcrypt.hashSync(req.body.newPassword, 10);
        user.assign({
            password: hashedPassword,
            updated_at: new Date().toISOString()
        }).write();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
