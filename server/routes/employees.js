const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../database/db');

// Get all employees
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const employees = await db.collection('employees').find({}).sort({ id: 1 }).toArray();
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        let employee;
        
        if (ObjectId.isValid(req.params.id)) {
            employee = await db.collection('employees').findOne({ _id: new ObjectId(req.params.id) });
        }
        
        if (!employee) {
            employee = await db.collection('employees').findOne({ id: parseInt(req.params.id) });
        }
        
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new employee
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const existing = await db.collection('employees').findOne({ employee_id: req.body.employeeId });
        if (existing) {
            return res.status(400).json({ error: 'Employee ID already exists' });
        }

        const newEmployee = {
            ...req.body,
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await db.collection('employees').insertOne(newEmployee);
        res.json({ id: result.insertedId, message: 'Employee created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update employee
router.put('/:id', async (req, res) => {
    try {
        const db = getDB();
        const updateData = {
            ...req.body,
            updated_at: new Date()
        };
        
        let result;
        if (ObjectId.isValid(req.params.id)) {
            result = await db.collection('employees').updateOne(
                { _id: new ObjectId(req.params.id) },
                { $set: updateData }
            );
        } else {
            result = await db.collection('employees').updateOne(
                { id: parseInt(req.params.id) },
                { $set: updateData }
            );
        }

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json({ message: 'Employee updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete employee
router.delete('/:id', async (req, res) => {
    try {
        const db = getDB();
        let result;
        
        if (ObjectId.isValid(req.params.id)) {
            result = await db.collection('employees').deleteOne({ _id: new ObjectId(req.params.id) });
        } else {
            result = await db.collection('employees').deleteOne({ id: parseInt(req.params.id) });
        }

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
