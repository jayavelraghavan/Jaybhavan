const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all employees
router.get('/', (req, res) => {
    try {
        const employees = db.get('employees').value();
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get employee by ID
router.get('/:id', (req, res) => {
    try {
        const employee = db.get('employees').find({ id: parseInt(req.params.id) }).value();
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new employee
router.post('/', (req, res) => {
    try {
        const employees = db.get('employees').value();
        const maxId = employees.length > 0 ? Math.max(...employees.map(e => e.id || 0)) : 0;
        const newId = maxId + 1;

        const existing = db.get('employees').find({ employee_id: req.body.employeeId }).value();
        if (existing) {
            return res.status(400).json({ error: 'Employee ID already exists' });
        }

        const newEmployee = {
            id: newId,
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        db.get('employees').push(newEmployee).write();
        res.json({ id: newId, message: 'Employee created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update employee
router.put('/:id', (req, res) => {
    try {
        const employee = db.get('employees').find({ id: parseInt(req.params.id) });
        if (!employee.value()) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        employee.assign({
            ...req.body,
            updated_at: new Date().toISOString()
        }).write();

        res.json({ message: 'Employee updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete employee
router.delete('/:id', (req, res) => {
    try {
        const employee = db.get('employees').find({ id: parseInt(req.params.id) });
        if (!employee.value()) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        db.get('employees').remove({ id: parseInt(req.params.id) }).write();
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
