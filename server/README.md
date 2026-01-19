# Restaurant POS Backend API

Backend API server for the Restaurant POS System using Node.js, Express, and SQLite.

## Architecture

```
Browser → Backend API → Database → Backend → Browser
```

## Features

- RESTful API endpoints for all data operations
- SQLite database for data persistence
- User authentication
- Menu management
- Order processing
- Stock management
- Sales reports
- Employee management

## Installation

```bash
cd server
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your settings:
```
PORT=3000
NODE_ENV=development
```

## Database Setup

The database is automatically initialized when the server starts. The database file will be created at `server/database/restaurant_pos.db`.

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get menu item by ID
- `GET /api/menu/barcode/:barcode` - Get menu item by barcode
- `POST /api/menu` - Create new menu item
- `PUT /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item
- `PATCH /api/menu/:id/stock` - Update stock

### Orders
- `GET /api/orders` - Get all orders (with optional query params: startDate, endDate, status)
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/number/:orderNumber` - Get order by order number
- `POST /api/orders` - Create new order
- `POST /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/cancelled/all` - Get all cancelled orders

### Users
- `POST /api/users/login` - User login
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/reset-password` - Reset user password

### Restaurant Info
- `GET /api/restaurant` - Get restaurant information
- `PUT /api/restaurant` - Update restaurant information

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Stock
- `GET /api/stock` - Get all stock items (with optional query params: search, filter)
- `POST /api/stock/bulk-update` - Bulk update stock

### Reports
- `GET /api/reports/date-range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Date range report
- `GET /api/reports/user-wise?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - User-wise report
- `GET /api/reports/item-wise?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Item-wise report
- `GET /api/reports/transactions?limit=100` - Transaction history

## Default Credentials

- **Username:** admin
- **Password:** admin123

## Database Schema

The database includes the following tables:
- `users` - User accounts
- `restaurant_info` - Restaurant information
- `menu_items` - Menu items
- `orders` - Orders
- `order_items` - Order line items
- `employees` - Employee records
- `cancelled_orders` - Cancelled orders tracking

## Frontend Integration

The frontend uses `api-service.js` to communicate with this backend. Update the `API_BASE_URL` in `api-service.js` if your backend runs on a different port.

## Development

- The database file is created automatically on first run
- Default menu items and admin user are created automatically
- Use `npm run dev` for development with auto-reload (requires nodemon)
