const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../database/db');

// Date range report
router.get('/date-range', async (req, res) => {
    try {
        const db = getDB();
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const orders = await db.collection('orders').find({
            created_at: { $gte: start, $lte: end },
            status: 'completed'
        }).sort({ created_at: -1 }).toArray();

        const orderIds = orders.map(o => o._id || o.id);
        const items = await db.collection('order_items').find({
            order_id: { $in: orderIds }
        }).toArray();

        // Calculate item sales
        const itemSales = {};
        items.forEach(item => {
            if (!itemSales[item.item_name]) {
                itemSales[item.item_name] = { quantity: 0, revenue: 0 };
            }
            itemSales[item.item_name].quantity += item.quantity;
            itemSales[item.item_name].revenue += item.total;
        });

        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const totalSubtotal = orders.reduce((sum, order) => sum + (order.subtotal || 0), 0);
        const totalTax = orders.reduce((sum, order) => sum + (order.total_tax || 0), 0);

        res.json({
            orders,
            itemSales,
            totalRevenue,
            totalSubtotal,
            totalTax,
            orderCount: orders.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User-wise report
router.get('/user-wise', async (req, res) => {
    try {
        const db = getDB();
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const users = await db.collection('users').find({}).toArray();
        const orders = await db.collection('orders').find({
            created_at: { $gte: start, $lte: end },
            status: 'completed'
        }).toArray();

        const result = users.map(user => {
            const userOrders = orders.filter(o => {
                if (o.user_id && user._id) {
                    return o.user_id.toString() === user._id.toString();
                }
                return o.user_id === user.id;
            });
            return {
                username: user.username,
                cashier_code: user.cashier_code,
                order_count: userOrders.length,
                total_revenue: userOrders.reduce((sum, o) => sum + o.total, 0)
            };
        });

        result.sort((a, b) => b.total_revenue - a.total_revenue);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Item-wise report
router.get('/item-wise', async (req, res) => {
    try {
        const db = getDB();
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const orders = await db.collection('orders').find({
            created_at: { $gte: start, $lte: end },
            status: 'completed'
        }).toArray();

        const orderIds = orders.map(o => o._id || o.id);
        const items = await db.collection('order_items').find({
            order_id: { $in: orderIds }
        }).toArray();

        const itemSales = {};
        items.forEach(item => {
            if (!itemSales[item.item_name]) {
                itemSales[item.item_name] = { total_quantity: 0, total_revenue: 0 };
            }
            itemSales[item.item_name].total_quantity += item.quantity;
            itemSales[item.item_name].total_revenue += item.total;
        });

        const result = Object.entries(itemSales).map(([item_name, data]) => ({
            item_name,
            total_quantity: data.total_quantity,
            total_revenue: data.total_revenue
        }));

        result.sort((a, b) => b.total_revenue - a.total_revenue);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Transaction history
router.get('/transactions', async (req, res) => {
    try {
        const db = getDB();
        const limit = parseInt(req.query.limit) || 100;
        const orders = await db.collection('orders').find({ status: 'completed' })
            .sort({ created_at: -1 })
            .limit(limit)
            .toArray();

        const users = await db.collection('users').find({}).toArray();
        const result = orders.map(order => {
            const user = users.find(u => {
                if (order.user_id && u._id) {
                    return order.user_id.toString() === u._id.toString();
                }
                return order.user_id === u.id;
            });
            return {
                ...order,
                username: user ? user.username : null,
                cashier_code: user ? user.cashier_code : null
            };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
