# MongoDB Atlas IP Whitelist Setup

## Your IP Address
**IP Address to Whitelist:** `72.131.119.201/32`

## Steps to Add IP Address to MongoDB Atlas

### Method 1: Add Specific IP Address

1. **Log in to MongoDB Atlas**
   - Go to https://cloud.mongodb.com/
   - Sign in with your MongoDB Atlas account

2. **Navigate to Network Access**
   - Click on your project/cluster
   - Go to **Security** → **Network Access** (or click "Network Access" in the left sidebar)

3. **Add IP Address**
   - Click the **"Add IP Address"** button (green button)
   - Select **"Add Current IP Address"** OR
   - Enter manually: `72.131.119.201/32`
   - Click **"Confirm"**

4. **Verify**
   - You should see your IP address in the list
   - Status should show as "Active"

### Method 2: Allow All IPs (Development Only - Not Recommended for Production)

If you want to allow connections from anywhere (useful for development):

1. Click **"Add IP Address"**
2. Click **"Allow Access from Anywhere"**
3. This will add `0.0.0.0/0` to your whitelist
4. **Warning:** Only use this for development/testing, not production!

## Current Configuration

- **IP Address:** `72.131.119.201/32`
- **Cluster:** `cluster0.xjnbqza.mongodb.net`
- **Database:** `restaurant_pos`

## Verify Connection

After adding the IP address, test your connection:

```bash
# Test from your server
curl http://localhost:3000/api/health

# Test MongoDB connection
curl http://localhost:3000/api/menu
```

## Troubleshooting

### Connection Still Failing?

1. **Wait a few minutes** - IP whitelist changes can take 1-2 minutes to propagate
2. **Check IP format** - Make sure you entered `72.131.119.201/32` (with /32)
3. **Verify cluster status** - Ensure your MongoDB Atlas cluster is running
4. **Check firewall** - Make sure your local firewall isn't blocking MongoDB connections
5. **Verify credentials** - Double-check username and password in connection string

### Find Your Current IP

If your IP changes, you can find it:
- Visit: https://whatismyipaddress.com/
- Or run: `curl ifconfig.me` in terminal

## Security Best Practices

1. **Use Specific IPs** - Only whitelist IPs you actually use
2. **Remove Old IPs** - Remove IP addresses you no longer use
3. **Use VPN IP** - If using VPN, whitelist the VPN IP
4. **Production** - For production, use specific IPs or VPC peering

## Next Steps

Once the IP is whitelisted:
1. Restart your server (if needed)
2. Test the connection
3. Verify data is being saved to MongoDB Atlas
