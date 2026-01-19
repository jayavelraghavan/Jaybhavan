# Backend API Setup Guide

This guide explains how to set up the backend API server for the Restaurant POS System.

## Architecture Overview

```
Browser → Backend API → Database → Backend → Browser
```

The application now uses a full-stack architecture:
- **Frontend**: HTML/CSS/JavaScript (existing)
- **Backend API**: Node.js + Express.js
- **Database**: SQLite

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation Steps

### 1. Install Backend Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment (Optional)

Create a `.env` file in the `server` directory:

```bash
PORT=3000
NODE_ENV=development
```

### 3. Start the Backend Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

### 4. Verify Installation

Open your browser and visit:
```
http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "ok",
  "message": "Restaurant POS API is running"
}
```

## Database

The application uses MongoDB. Make sure MongoDB is installed and running before starting the server.

### MongoDB Setup

1. **Install MongoDB** (if not already installed):
   - Windows: Download from https://www.mongodb.com/try/download/community
   - macOS: `brew install mongodb-community`
   - Linux: `sudo apt-get install mongodb`

2. **Start MongoDB**:
   - Windows: MongoDB typically runs as a service automatically
   - macOS: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongodb`

3. **Configure Connection**:
   - Update `server/.env` with your MongoDB connection string:
     ```
     MONGODB_URI=mongodb://localhost:27017/restaurant_pos
     ```

See [MONGODB_SETUP.md](MONGODB_SETUP.md) for detailed MongoDB setup instructions.

The database is automatically created and initialized when you first start the server.

### Default Data

On first run, the database is automatically populated with:
- Default admin user (username: `admin`, password: `admin123`)
- Default menu items (Idly, Dosa, Parotta, Vada, Pongal)

## Frontend Integration

The frontend has been updated to use the API service layer (`api-service.js`). The frontend will:

1. **Try to connect to the API** when the page loads
2. **Fall back to localStorage** if the API is not available

### API Configuration

To change the API URL, edit `api-service.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

Change this to your backend server URL if different.

## Running Both Frontend and Backend

### Option 1: Separate Terminals

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
# Open index.html in browser or use a local server
python -m http.server 8000
# Then visit http://localhost:8000
```

### Option 2: Using a Web Server

You can serve the frontend using any static file server:
- Python: `python -m http.server 8000`
- Node.js: `npx http-server`
- VS Code Live Server extension

## API Endpoints

See `server/README.md` for complete API documentation.

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, change it in `server/.env`:
```
PORT=3001
```

### Database Issues

If you need to reset the database:
1. Stop the server
2. Delete `server/database/restaurant_pos.db`
3. Restart the server (database will be recreated)

### CORS Issues

CORS is enabled by default. If you encounter CORS errors:
- Check that the backend server is running
- Verify the API_BASE_URL in `api-service.js` matches your backend URL

## Development

- Use `npm run dev` for development (requires nodemon)
- Database changes require server restart
- Check server console for errors

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use `npm start` instead of `npm run dev`
3. Consider using a process manager like PM2
4. Set up proper database backups
