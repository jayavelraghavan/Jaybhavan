# MongoDB Setup Guide

This guide explains how to set up MongoDB for the Restaurant POS System.

## Prerequisites

- MongoDB installed on your system
- MongoDB service running

## Installation

### Windows

1. Download MongoDB from: https://www.mongodb.com/try/download/community
2. Install MongoDB Community Server
3. MongoDB will typically install as a Windows service and start automatically

### macOS

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

## Configuration

1. Copy `.env.example` to `.env` in the `server` directory:
```bash
cd server
cp .env.example .env
```

2. Update `.env` with your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/restaurant_pos
```

### MongoDB Atlas (Cloud)

If you're using MongoDB Atlas (cloud-hosted MongoDB):

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get your connection string
4. Update `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/restaurant_pos
```

## Verify MongoDB is Running

### Windows
```bash
# Check if MongoDB service is running
sc query MongoDB
```

### macOS/Linux
```bash
# Check MongoDB status
brew services list  # macOS
sudo systemctl status mongodb  # Linux
```

### Test Connection
```bash
# Connect to MongoDB shell
mongosh
# or
mongo
```

## Starting the Backend Server

Once MongoDB is running:

```bash
cd server
npm install
npm start
```

The server will:
1. Connect to MongoDB
2. Create the database if it doesn't exist
3. Initialize default data (admin user, menu items)

## Database Structure

The application uses the following collections:
- `users` - User accounts
- `restaurantinfos` - Restaurant information
- `menuitems` - Menu items
- `orders` - Orders
- `orderitems` - Order line items
- `employees` - Employee records
- `cancelledorders` - Cancelled orders

## Default Data

On first run, the database is automatically populated with:
- Default admin user (username: `admin`, password: `admin123`)
- Default menu items (Idly, Dosa, Parotta, Vada, Pongal)

## Troubleshooting

### MongoDB Not Running

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:** Start MongoDB service
- Windows: Check Services panel or run `net start MongoDB`
- macOS: `brew services start mongodb-community`
- Linux: `sudo systemctl start mongodb`

### Connection String Issues

Make sure your `MONGODB_URI` in `.env` is correct:
- Local: `mongodb://localhost:27017/restaurant_pos`
- Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/restaurant_pos`

### Port Already in Use

If MongoDB is using a different port, update the connection string:
```
MONGODB_URI=mongodb://localhost:27018/restaurant_pos
```

## MongoDB Compass (GUI)

For a visual interface to manage your database:
1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Connect using: `mongodb://localhost:27017`
3. Browse collections and documents

## Backup and Restore

### Backup
```bash
mongodump --db restaurant_pos --out /path/to/backup
```

### Restore
```bash
mongorestore --db restaurant_pos /path/to/backup/restaurant_pos
```
