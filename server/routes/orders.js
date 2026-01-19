const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../database/db');

// Get all orders
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const { startDate, endDate, status } = req.query;
        const query = {};

        if (startDate || endDate) {
            query.created_at = {};
            if (startDate) {
                query.created_at.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.created_at.$lte = end;
            }
        }

        if (status) {
            query.status = status;
        }

        const orders = await db.collection('orders').find(query).sort({ created_at: -1 }).toArray();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get order by ID
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        let order;
        
        if (ObjectId.isValid(req.params.id)) {
            order = await db.collection('orders').findOne({ _id: new ObjectId(req.params.id) });
        }
        
        if (!order) {
            order = await db.collection('orders').findOne({ id: parseInt(req.params.id) });
        }
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const items = await db.collection('order_items').find({ 
            order_id: order._id || order.id 
        }).toArray();
        
        res.json({ ...order, items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get order by order number
router.get('/number/:orderNumber', async (req, res) => {
    try {
        const db = getDB();
        const order = await db.collection('orders').findOne({ order_number: req.params.orderNumber });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const items = await db.collection('order_items').find({ 
            order_id: order._id || order.id 
        }).toArray();
        
        res.json({ ...order, items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new order
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const {
            orderNumber, customerName, cashierCode, userId,
            items, subtotal, cgst, sgst, totalTax, total, paymentMethod
        } = req.body;

        const newOrder = {
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
            created_at: new Date()
        };

        const orderResult = await db.collection('orders').insertOne(newOrder);
        const orderId = orderResult.insertedId;

        // Insert order items and update stock
        for (const item of items) {
            const orderItem = {
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
            await db.collection('order_items').insertOne(orderItem);

            // Update stock if item is stock item
            if (item.isStockItem === 'yes') {
                await db.collection('menu_items').updateOne(
                    { _id: new ObjectId(item.menuItemId) },
                    { $inc: { stock_value: -item.quantity }, $set: { updated_at: new Date() } }
                );
            }
        }

        res.json({ id: orderId, orderNumber, message: 'Order created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel order
router.post('/:id/cancel', async (req, res) => {
    try {
        const db = getDB();
        let order;
        
        if (ObjectId.isValid(req.params.id)) {
            order = await db.collection('orders').findOne({ _id: new ObjectId(req.params.id) });
        } else {
            order = await db.collection('orders').findOne({ id: parseInt(req.params.id) });
        }
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Get order items to restore stock
        const items = await db.collection('order_items').find({ 
            order_id: order._id || order.id 
        }).toArray();

        // Restore stock
        for (const item of items) {
            await db.collection('menu_items').updateOne(
                { _id: new ObjectId(item.menu_item_id) },
                { $inc: { stock_value: item.quantity }, $set: { updated_at: new Date() } }
            );
        }

        // Update order status
        await db.collection('orders').updateOne(
            { _id: order._id || { id: order.id } },
            { $set: { status: 'cancelled' } }
        );

        // Insert into cancelled_orders
        await db.collection('cancelled_orders').insertOne({
            original_order_id: order._id || order.id,
            order_number: order.order_number,
            cancelled_by: req.body.cancelledBy,
            cancellation_reason: req.body.reason,
            cancelled_at: new Date()
        });

        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get cancelled orders
router.get('/cancelled/all', async (req, res) => {
    try {
        const db = getDB();
        const cancelled = await db.collection('cancelled_orders').find({}).toArray();
        const orders = await db.collection('orders').find({}).toArray();
        
        const result = cancelled.map(co => {
            const order = orders.find(o => 
                (o._id && co.original_order_id && o._id.toString() === co.original_order_id.toString()) ||
                (o.id === co.original_order_id)
            );
            return { ...co, ...order };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
