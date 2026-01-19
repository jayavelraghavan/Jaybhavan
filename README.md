# Restaurant Website with Billing System

A complete restaurant website with menu management, shopping cart, billing system, payment QR code, bill printing, and monthly sales reports.

## Features

- **Menu Display**: View menu items with images, names, and prices
- **Shopping Cart**: Add items to cart, update quantities, and remove items
- **Billing**: Calculate total bill dynamically
- **Payment**: Pay Now button with QR code display
- **Bill Printing**: Print formatted bills
- **Menu Management**: Password-protected CRUD operations for menu items
- **Sales Reports**: Monthly sales reports with item-wise breakdown
- **Data Persistence**: Backend API with SQLite database (localStorage fallback available)

## Menu Items

The website comes pre-loaded with:
- Idly - ₹30.00
- Dosa - ₹50.00
- Parotta - ₹40.00
- Vada - ₹25.00
- Pongal - ₹35.00

## Quick Start

### Option 1: With Backend API (Recommended)

1. **Start the backend server:**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Open the frontend:**
   - Open `index.html` in a web browser, or
   - Use a local web server (e.g., `python -m http.server 8000`)

3. The frontend will automatically connect to the API.

See [BACKEND_SETUP.md](BACKEND_SETUP.md) for detailed setup instructions.

### Option 2: Standalone (localStorage only)

1. Open `index.html` in a web browser
2. The app will work with localStorage if the API is not available

## Usage

1. Browse menu items and click "Add to Cart" to add items
2. View cart and adjust quantities
3. Click "Pay Now" to see QR code and confirm payment
4. Click "Print Bill" to print the bill
5. Click "Manage Menu" to add/edit/delete menu items (password: `admin`)
6. Click "Sales Report" to view monthly sales

## Menu Management

- Default password: `admin`
- Add new items with name, price, and image filename
- Edit existing items
- Delete items from menu

## Images

Replace placeholder images in the `images/` folder with your actual food images:
- `idly.jpg`
- `dosa.jpg`
- `parotta.jpg`
- `vada.jpg`
- `pongal.jpg`
- `qr-placeholder.png` (for payment QR code)

## Technologies

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Storage**: Backend API (with localStorage fallback)
- **Desktop**: Electron (for Windows desktop app)

## Platforms

### Web Browser
1. Open `index.html` in a web browser
2. All features work in modern browsers

### Windows Desktop Application
The application can be built as a Windows desktop app using Electron.

**Quick Start:**
```bash
# Install dependencies
npm install

# Run the Windows app
npm start

# Build Windows installer
npm run build:win
```

For detailed Windows build instructions, see [WINDOWS_BUILD_INSTRUCTIONS.md](WINDOWS_BUILD_INSTRUCTIONS.md)

### Android Application
The application can also be built as an Android APK using Capacitor.

For detailed Android build instructions, see [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md)

### Backend API Server

The application now includes a full backend API server. See [BACKEND_SETUP.md](BACKEND_SETUP.md) for setup instructions.

## Browser Compatibility

Works on all modern browsers that support:
- LocalStorage API
- CSS Grid
- ES6 JavaScript

