const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all orders
router.get('/', (req, res) => {
    try {
        let orders = db.get('orders').value();
        const { startDate, endDate, status } = req.query;

        if (startDate) {
            orders = orders.filter(o => new Date(o.created_at).toISOString().split('T')[0] >= startDate);
        }
        if (endDate) {
            orders = orders.filter(o => new Date(o.created_at).toISOString().split('T')[0] <= endDate);
        }
        if (status) {
            orders = orders.filter(o => o.status === status);
        }

        orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get order by ID
router.get('/:id', (req, res) => {
    try {
        const order = db.get('orders').find({ id: parseInt(req.params.id) }).value();
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const items = db.get('order_items').filter({ order_id: parseInt(req.params.id) }).value();
        res.json({ ...order, items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get order by order number
router.get('/number/:orderNumber', (req, res) => {
    try {
        const order = db.get('orders').find({ order_number: req.params.orderNumber }).value();
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const items = db.get('order_items').filter({ order_id: order.id }).value();
        res.json({ ...order, items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new order
router.post('/', (req, res) => {
    try {
        const {
            orderNumber, customerName, cashierCode, userId,
            items, subtotal, cgst, sgst, totalTax, total, paymentMethod
        } = req.body;

        const orders = db.get('orders').value();
        const maxId = orders.length > 0 ? Math.max(...orders.map(o => o.id || 0)) : 0;
        const orderId = maxId + 1;

        const newOrder = {
            id: orderId,
            order_number: orderNumber,
            customer_name: customerName,
            cashier_code: cashierCode,
            user_id: userId,
            subtotal,
            cgst,
            sgst,
            total_tax: totalTax,
            total,
            payment_method: paymentMethod,
            status: 'completed',
            created_at: new Date().toISOString()
        };

        db.get('orders').push(newOrder).write();

        // Insert order items
        const orderItems = db.get('order_items').value();
        const maxItemId = orderItems.length > 0 ? Math.max(...orderItems.map(i => i.id || 0)) : 0;
        let nextItemId = maxItemId + 1;

        items.forEach(item => {
            const orderItem = {
                id: nextItemId++,
                order_id: orderId,
                menu_item_id: item.menuItemId,
                item_name: item.itemName,
                item_price: item.itemPrice,
                quantity: item.quantity,
                subtotal: item.subtotal,
                cgst: item.cgst || 0,
                sgst: item.sgst || 0,
                total_tax: item.totalTax || 0,
                total: item.total
            };
            db.get('order_items').push(orderItem).write();

            // Update stock if item is stock item
            if (item.isStockItem === 'yes') {
                const menuItem = db.get('menu_items').find({ id: item.menuItemId });
                if (menuItem.value()) {
                    menuItem.assign({
                        stock_value: (menuItem.value().stock_value || 0) - item.quantity,
                        updated_at: new Date().toISOString()
                    }).write();
                }
            }
        });

        res.json({ id: orderId, orderNumber, message: 'Order created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel order
router.post('/:id/cancel', (req, res) => {
    try {
        const order = db.get('orders').find({ id: parseInt(req.params.id) }).value();
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Get order items to restore stock
        const items = db.get('order_items').filter({ order_id: parseInt(req.params.id) }).value();

        // Restore stock
        items.forEach(item => {
            const menuItem = db.get('menu_items').find({ id: item.menu_item_id });
            if (menuItem.value()) {
                menuItem.assign({
                    stock_value: (menuItem.value().stock_value || 0) + item.quantity,
                    updated_at: new Date().toISOString()
                }).write();
            }
        });

        // Update order status
        db.get('orders').find({ id: parseInt(req.params.id) }).assign({ status: 'cancelled' }).write();

        // Insert into cancelled_orders
        const cancelledOrders = db.get('cancelled_orders').value();
        const maxId = cancelledOrders.length > 0 ? Math.max(...cancelledOrders.map(o => o.id || 0)) : 0;
        db.get('cancelled_orders').push({
            id: maxId + 1,
            original_order_id: parseInt(req.params.id),
            order_number: order.order_number,
            cancelled_by: req.body.cancelledBy,
            cancellation_reason: req.body.reason,
            cancelled_at: new Date().toISOString()
        }).write();

        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get cancelled orders
router.get('/cancelled/all', (req, res) => {
    try {
        const cancelled = db.get('cancelled_orders').value();
        const orders = db.get('orders').value();
        
        const result = cancelled.map(co => {
            const order = orders.find(o => o.id === co.original_order_id);
            return { ...co, ...order };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
