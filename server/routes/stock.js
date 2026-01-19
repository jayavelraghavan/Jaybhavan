const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all stock items
router.get('/', (req, res) => {
    try {
        let items = db.get('menu_items').filter({ stock_item: 'yes' }).value();
        const { search, filter } = req.query;

        if (search) {
            const searchLower = search.toLowerCase();
            items = items.filter(item => 
                item.name.toLowerCase().includes(searchLower) ||
                (item.item_code && item.item_code.toLowerCase().includes(searchLower)) ||
                (item.barcode && item.barcode.includes(search))
            );
        }

        if (filter && filter !== 'all') {
            if (filter === 'red') {
                items = items.filter(item => item.stock_value < item.min_stock);
            } else if (filter === 'yellow') {
                items = items.filter(item => item.stock_value === 0 || item.stock_value === item.min_stock);
            } else if (filter === 'normal') {
                items = items.filter(item => item.stock_value > item.min_stock);
            }
        }

        items.sort((a, b) => a.name.localeCompare(b.name));
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update stock for multiple items (bulk update)
router.post('/bulk-update', (req, res) => {
    try {
        const { updates } = req.body;

        updates.forEach(update => {
            const item = db.get('menu_items').find({ id: update.id });
            if (item.value()) {
                item.assign({
                    stock_value: update.stockValue,
                    updated_at: new Date().toISOString()
                }).write();
            }
        });

        res.json({ message: 'Stock updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
