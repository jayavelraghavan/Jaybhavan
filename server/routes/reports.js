const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Date range report
router.get('/date-range', (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const orders = db.get('orders')
            .filter(o => {
                const orderDate = new Date(o.created_at).toISOString().split('T')[0];
                return orderDate >= startDate && orderDate <= endDate && o.status === 'completed';
            })
            .value();

        const orderIds = orders.map(o => o.id);
        const items = db.get('order_items').filter(item => orderIds.includes(item.order_id)).value();

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
router.get('/user-wise', (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const users = db.get('users').value();
        const orders = db.get('orders')
            .filter(o => {
                const orderDate = new Date(o.created_at).toISOString().split('T')[0];
                return orderDate >= startDate && orderDate <= endDate && o.status === 'completed';
            })
            .value();

        const result = users.map(user => {
            const userOrders = orders.filter(o => o.user_id === user.id);
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
router.get('/item-wise', (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const orders = db.get('orders')
            .filter(o => {
                const orderDate = new Date(o.created_at).toISOString().split('T')[0];
                return orderDate >= startDate && orderDate <= endDate && o.status === 'completed';
            })
            .value();

        const orderIds = orders.map(o => o.id);
        const items = db.get('order_items').filter(item => orderIds.includes(item.order_id)).value();

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
router.get('/transactions', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const orders = db.get('orders')
            .filter({ status: 'completed' })
            .value()
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit);

        const users = db.get('users').value();
        const result = orders.map(order => {
            const user = users.find(u => u.id === order.user_id);
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
