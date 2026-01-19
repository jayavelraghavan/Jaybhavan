const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../database/db');

// Get all stock items
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const { search, filter } = req.query;
        let query = { stock_item: 'yes' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { item_code: { $regex: search, $options: 'i' } },
                { barcode: { $regex: search, $options: 'i' } }
            ];
        }

        let items = await db.collection('menu_items').find(query).sort({ name: 1 }).toArray();

        if (filter && filter !== 'all') {
            if (filter === 'red') {
                items = items.filter(item => item.stock_value < item.min_stock);
            } else if (filter === 'yellow') {
                items = items.filter(item => item.stock_value === 0 || item.stock_value === item.min_stock);
            } else if (filter === 'normal') {
                items = items.filter(item => item.stock_value > item.min_stock);
            }
        }

        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update stock for multiple items (bulk update)
router.post('/bulk-update', async (req, res) => {
    try {
        const db = getDB();
        const { updates } = req.body;

        for (const update of updates) {
            await db.collection('menu_items').updateOne(
                { _id: new ObjectId(update.id) },
                { $set: { stock_value: update.stockValue, updated_at: new Date() } }
            );
        }

        res.json({ message: 'Stock updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
