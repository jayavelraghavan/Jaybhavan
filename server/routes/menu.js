const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all menu items
router.get('/', (req, res) => {
    try {
        const items = db.get('menu_items').value();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get menu item by ID
router.get('/:id', (req, res) => {
    try {
        const item = db.get('menu_items').find({ id: parseInt(req.params.id) }).value();
        if (!item) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get menu item by barcode
router.get('/barcode/:barcode', (req, res) => {
    try {
        const item = db.get('menu_items').find({ barcode: req.params.barcode }).value();
        if (!item) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new menu item
router.post('/', (req, res) => {
    try {
        const items = db.get('menu_items').value();
        const maxId = items.length > 0 ? Math.max(...items.map(i => i.id || 0)) : 0;
        const newId = maxId + 1;

        const newItem = {
            id: newId,
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        db.get('menu_items').push(newItem).write();
        res.json({ id: newId, message: 'Menu item created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update menu item
router.put('/:id', (req, res) => {
    try {
        const item = db.get('menu_items').find({ id: parseInt(req.params.id) });
        if (!item.value()) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        item.assign({
            ...req.body,
            updated_at: new Date().toISOString()
        }).write();

        res.json({ message: 'Menu item updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete menu item
router.delete('/:id', (req, res) => {
    try {
        const item = db.get('menu_items').find({ id: parseInt(req.params.id) });
        if (!item.value()) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        db.get('menu_items').remove({ id: parseInt(req.params.id) }).write();
        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update stock for menu item
router.patch('/:id/stock', (req, res) => {
    try {
        const item = db.get('menu_items').find({ id: parseInt(req.params.id) });
        if (!item.value()) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        item.assign({
            stock_value: req.body.stockValue,
            updated_at: new Date().toISOString()
        }).write();

        res.json({ message: 'Stock updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
