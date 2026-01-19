const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || "mongodb+srv://Appa-2025:Appa-2025@cluster0.xjnbqza.mongodb.net/restaurant_pos?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db = null;

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
    
    db = client.db("restaurant_pos");
    console.log(`📊 Connected to database: restaurant_pos`);
    
    // Initialize database with default data
    await initializeDatabase();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Initialize database with default data
async function initializeDatabase() {
  try {
    // Insert default admin user if not exists
    const usersCollection = db.collection('users');
    const adminExists = await usersCollection.findOne({ username: 'admin' });
    
    if (!adminExists) {
      await usersCollection.insertOne({
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        cashier_code: '',
        employee_id: null,
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log('✅ Default admin user created');
    }

    // Insert default menu items if not exists
    const menuItemsCollection = db.collection('menu_items');
    const menuItemsCount = await menuItemsCollection.countDocuments();
    
    if (menuItemsCount === 0) {
      const defaultMenuItems = [
        { item_code: 'ITM101', name: 'Idly', price: 30.00, image: 'images/idly.jpg', barcode: '1001', stock_item: 'no', stock_value: 0, min_stock: 0, tax: 'no', cgst_percentage: 0, sgst_percentage: 0, price_includes_tax: 'no', created_at: new Date(), updated_at: new Date() },
        { item_code: 'ITM102', name: 'Dosa', price: 50.00, image: 'images/dosa.jpg', barcode: '1002', stock_item: 'no', stock_value: 0, min_stock: 0, tax: 'no', cgst_percentage: 0, sgst_percentage: 0, price_includes_tax: 'no', created_at: new Date(), updated_at: new Date() },
        { item_code: 'ITM103', name: 'Parotta', price: 40.00, image: 'images/parotta.jpg', barcode: '1003', stock_item: 'no', stock_value: 0, min_stock: 0, tax: 'no', cgst_percentage: 0, sgst_percentage: 0, price_includes_tax: 'no', created_at: new Date(), updated_at: new Date() },
        { item_code: 'ITM104', name: 'Vada', price: 25.00, image: 'images/vada.jpg', barcode: '1004', stock_item: 'no', stock_value: 0, min_stock: 0, tax: 'no', cgst_percentage: 0, sgst_percentage: 0, price_includes_tax: 'no', created_at: new Date(), updated_at: new Date() },
        { item_code: 'ITM105', name: 'Pongal', price: 35.00, image: 'images/pongal.jpg', barcode: '1005', stock_item: 'no', stock_value: 0, min_stock: 0, tax: 'no', cgst_percentage: 0, sgst_percentage: 0, price_includes_tax: 'no', created_at: new Date(), updated_at: new Date() }
      ];
      
      await menuItemsCollection.insertMany(defaultMenuItems);
      console.log('✅ Default menu items created');
    }

    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Get database instance
function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
}

// Close database connection
async function closeDB() {
  try {
    await client.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// Connect on module load
connectDB().catch(console.error);

module.exports = {
  client,
  getDB,
  connectDB,
  closeDB
};
