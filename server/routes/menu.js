const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../database/db');

// Get all menu items
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const items = await db.collection('menu_items').find({}).sort({ id: 1 }).toArray();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get menu item by ID
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        let item;
        
        // Try ObjectId first
        if (ObjectId.isValid(req.params.id)) {
            item = await db.collection('menu_items').findOne({ _id: new ObjectId(req.params.id) });
        }
        
        // If not found, try numeric ID
        if (!item) {
            item = await db.collection('menu_items').findOne({ id: parseInt(req.params.id) });
        }
        
        if (!item) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get menu item by barcode
router.get('/barcode/:barcode', async (req, res) => {
    try {
        const db = getDB();
        const item = await db.collection('menu_items').findOne({ barcode: req.params.barcode });
        if (!item) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new menu item
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const newItem = {
            ...req.body,
            created_at: new Date(),
            updated_at: new Date()
        };
        const result = await db.collection('menu_items').insertOne(newItem);
        res.json({ id: result.insertedId, message: 'Menu item created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update menu item
router.put('/:id', async (req, res) => {
    try {
        const db = getDB();
        const updateData = {
            ...req.body,
            updated_at: new Date()
        };
        
        let result;
        if (ObjectId.isValid(req.params.id)) {
            result = await db.collection('menu_items').updateOne(
                { _id: new ObjectId(req.params.id) },
                { $set: updateData }
            );
        } else {
            result = await db.collection('menu_items').updateOne(
                { id: parseInt(req.params.id) },
                { $set: updateData }
            );
        }
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json({ message: 'Menu item updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete menu item
router.delete('/:id', async (req, res) => {
    try {
        const db = getDB();
        let result;
        
        if (ObjectId.isValid(req.params.id)) {
            result = await db.collection('menu_items').deleteOne({ _id: new ObjectId(req.params.id) });
        } else {
            result = await db.collection('menu_items').deleteOne({ id: parseInt(req.params.id) });
        }
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update stock for menu item
router.patch('/:id/stock', async (req, res) => {
    try {
        const db = getDB();
        const updateData = {
            stock_value: req.body.stockValue,
            updated_at: new Date()
        };
        
        let result;
        if (ObjectId.isValid(req.params.id)) {
            result = await db.collection('menu_items').updateOne(
                { _id: new ObjectId(req.params.id) },
                { $set: updateData }
            );
        } else {
            result = await db.collection('menu_items').updateOne(
                { id: parseInt(req.params.id) },
                { $set: updateData }
            );
        }
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json({ message: 'Stock updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
