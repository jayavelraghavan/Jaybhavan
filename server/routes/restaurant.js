const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');

// Get restaurant info
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const info = await db.collection('restaurant_info').findOne({});
        
        if (!info) {
            return res.json({
                name: '',
                address: '',
                gstin: '',
                fssai: '',
                show_gstin: 0,
                show_fssai: 0,
                qr_code_image: '',
                starting_bill_number: 1001,
                starting_bill_number_locked: 0,
                admin_employee_id: '',
                admin_employee_name: '',
                admin_employee_id_locked: 0
            });
        }
        res.json(info);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update restaurant info
router.put('/', async (req, res) => {
    try {
        const db = getDB();
        const updateData = {
            ...req.body,
            updated_at: new Date()
        };
        
        await db.collection('restaurant_info').updateOne(
            {},
            { $set: updateData },
            { upsert: true }
        );
        
        res.json({ message: 'Restaurant info updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
