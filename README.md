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
- **Data Persistence**: All data stored in browser LocalStorage

## Menu Items

The website comes pre-loaded with:
- Idly - ₹30.00
- Dosa - ₹50.00
- Parotta - ₹40.00
- Vada - ₹25.00
- Pongal - ₹35.00

## Usage

1. Open `index.html` in a web browser
2. Browse menu items and click "Add to Cart" to add items
3. View cart and adjust quantities
4. Click "Pay Now" to see QR code and confirm payment
5. Click "Print Bill" to print the bill
6. Click "Manage Menu" to add/edit/delete menu items (password: `admin`)
7. Click "Sales Report" to view monthly sales

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

- HTML5
- CSS3
- Vanilla JavaScript
- LocalStorage API
- Electron (for Windows desktop app)

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

## Browser Compatibility

Works on all modern browsers that support:
- LocalStorage API
- CSS Grid
- ES6 JavaScript

