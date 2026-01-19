const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'restaurant_pos.json');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database with default structure
const adapter = new FileSync(DB_PATH);
const db = low(adapter);

// Set default database structure
db.defaults({
    users: [],
    restaurant_info: {},
    menu_items: [],
    orders: [],
    order_items: [],
    employees: [],
    cancelled_orders: []
}).write();

console.log('✅ Connected to JSON database');

// Initialize default data
function initializeDatabase() {
    try {
        // Insert default admin user if not exists
        const users = db.get('users').value();
        const adminExists = users.some(u => u.username === 'admin');
        
        if (!adminExists) {
            db.get('users').push({
                id: 1,
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                cashier_code: '',
                employee_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }).write();
        }

        // Insert default menu items if not exists
        const menuItems = db.get('menu_items').value();
        if (menuItems.length === 0) {
            const defaultMenuItems = [
                { id: 1, item_code: 'ITM101', name: 'Idly', price: 30.00, image: 'images/idly.jpg', barcode: '1001', stock_item: 'no', stock_value: 0, min_stock: 0, tax: 'no', cgst_percentage: 0, sgst_percentage: 0, price_includes_tax: 'no', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 2, item_code: 'ITM102', name: 'Dosa', price: 50.00, image: 'images/dosa.jpg', barcode: '1002', stock_item: 'no', stock_value: 0, min_stock: 0, tax: 'no', cgst_percentage: 0, sgst_percentage: 0, price_includes_tax: 'no', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 3, item_code: 'ITM103', name: 'Parotta', price: 40.00, image: 'images/parotta.jpg', barcode: '1003', stock_item: 'no', stock_value: 0, min_stock: 0, tax: 'no', cgst_percentage: 0, sgst_percentage: 0, price_includes_tax: 'no', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 4, item_code: 'ITM104', name: 'Vada', price: 25.00, image: 'images/vada.jpg', barcode: '1004', stock_item: 'no', stock_value: 0, min_stock: 0, tax: 'no', cgst_percentage: 0, sgst_percentage: 0, price_includes_tax: 'no', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 5, item_code: 'ITM105', name: 'Pongal', price: 35.00, image: 'images/pongal.jpg', barcode: '1005', stock_item: 'no', stock_value: 0, min_stock: 0, tax: 'no', cgst_percentage: 0, sgst_percentage: 0, price_includes_tax: 'no', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
            ];
            
            db.set('menu_items', defaultMenuItems).write();
        }

        console.log('✅ Database initialized with default data');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Initialize database on module load
initializeDatabase();

module.exports = db;
