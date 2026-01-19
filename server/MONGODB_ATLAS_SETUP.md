# MongoDB Atlas Configuration

Your MongoDB Atlas connection has been configured!

## Connection Details

- **Cluster**: cluster0.xjnbqza.mongodb.net
- **Username**: Appa-2025
- **Database**: restaurant_pos
- **Connection String**: Configured in `server/database/db.js`

## Current Configuration

The MongoDB Atlas connection string is set in:
- `server/database/db.js` (default fallback)
- Can be overridden with `MONGODB_URI` environment variable in `server/.env`

## Environment Variable (Optional)

To use environment variable instead, create `server/.env`:

```
MONGODB_URI=mongodb+srv://Appa-2025:Appa-2025@cluster0.xjnbqza.mongodb.net/restaurant_pos?retryWrites=true&w=majority
```

## MongoDB Atlas Setup Checklist

1. ✅ Connection string configured
2. ⚠️ **IMPORTANT: Add your IP address to Network Access:**
   - Go to MongoDB Atlas Dashboard
   - Network Access → Add IP Address
   - **Your IP:** `72.131.119.201/32`
   - Or add `0.0.0.0/0` for all IPs (development only)
   - See `MONGODB_ATLAS_IP_WHITELIST.md` for detailed instructions
3. ⚠️ Verify database user permissions:
   - Database Access → Ensure user has read/write permissions

## Testing Connection

The server will automatically:
- Connect to MongoDB Atlas on startup
- Create the database if it doesn't exist
- Initialize default data (admin user, menu items)

## Troubleshooting

### Connection Timeout
- Check MongoDB Atlas Network Access settings
- Verify your IP is whitelisted

### Authentication Failed
- Verify username and password in connection string
- Check Database Access user permissions

### Database Not Found
- The database will be created automatically on first connection
- Default database name: `restaurant_pos`
