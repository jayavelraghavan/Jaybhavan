# Build Windows Application - Step by Step Guide

This guide will help you convert your Restaurant POS web application into a Windows desktop application (.exe file).

## Prerequisites

1. **Node.js and npm** (v14 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **Windows 10/11** (64-bit recommended)

## Step 1: Install Dependencies

Open PowerShell or Command Prompt in the project directory and run:

```bash
npm install
```

This will install Electron and all required dependencies.

## Step 2: Test the Application

Before building, test the application to make sure everything works:

```bash
npm start
```

or

```bash
npm run electron
```

This will launch the application in a desktop window. Verify that all features work correctly:
- Menu display
- Cart functionality
- Payment processing
- Bill printing
- Menu management
- Sales reports

## Step 3: Build Windows Executable

### Option A: Build Installer (Recommended)

This creates a Windows installer (.exe) that users can run to install the application:

```bash
npm run build:win
```

The installer will be created in the `dist` folder.

### Option B: Build Portable Application

This creates a portable version (folder with executable) that doesn't require installation:

```bash
npm run build:win:dir
```

The portable application will be in the `dist/win-unpacked` folder. You can zip this folder and distribute it.

### Option C: Build All Formats

```bash
npm run dist
```

This builds all configured formats.

## Step 4: Customize Application Icon (Optional)

1. Create or obtain an icon file in `.ico` format (for Windows)
2. Place it in the `images/` folder as `icon.ico`
3. The build process will automatically use it

If you don't have an icon, the default Electron icon will be used.

## Step 5: Distribution

### For End Users:

**Using the Installer:**
- Share the `.exe` installer file from the `dist` folder
- Users double-click to install
- Application will appear in Start Menu and Desktop

**Using Portable Version:**
- Share the entire `win-unpacked` folder (or zip it)
- Users can run `Restaurant POS.exe` directly
- No installation required

## Updating the Application

After making changes to your web files (HTML, CSS, JS):

1. Test the changes:
   ```bash
   npm start
   ```

2. Rebuild the application:
   ```bash
   npm run build:win
   ```

3. Distribute the new installer from the `dist` folder

## Application Features

The Windows application includes:
- ✅ Native Windows window controls
- ✅ Menu bar with File, View, and Help menus
- ✅ Keyboard shortcuts (Ctrl+Q to quit, etc.)
- ✅ Full-screen support
- ✅ All web application features work offline
- ✅ LocalStorage data persists between sessions
- ✅ Print functionality works with Windows printers

## Troubleshooting

### Issue: "npm start" doesn't work
- Make sure all dependencies are installed: `npm install`
- Check that Node.js is properly installed: `node --version`

### Issue: Build fails
- Clear node_modules and reinstall:
  ```bash
  rmdir /s /q node_modules
  npm install
  ```
- Make sure you have enough disk space (build process requires several GB)

### Issue: Application window is blank
- Check the console for errors (View → Toggle Developer Tools)
- Verify that `index.html` exists in the project root
- Ensure all file paths in your code are correct

### Issue: Images not loading
- Make sure all images are in the `images/` folder
- Check file paths in your HTML/JavaScript code
- Verify image file extensions match

### Issue: LocalStorage not working
- Electron uses Chromium's LocalStorage, which should work automatically
- Check browser console for any errors
- Clear application data if needed (delete user data folder)

## Advanced Configuration

### Customize Window Size

Edit `main.js` and modify the `createWindow()` function:

```javascript
mainWindow = new BrowserWindow({
  width: 1400,  // Change default width
  height: 900,  // Change default height
  // ... other options
});
```

### Disable Developer Tools in Production

In `main.js`, remove or comment out:

```javascript
if (process.env.NODE_ENV === 'development') {
  mainWindow.webContents.openDevTools();
}
```

### Add Auto-Updater

For production applications, consider adding `electron-updater` for automatic updates:

```bash
npm install electron-updater
```

## File Structure

After building, your project structure will be:

```
project-root/
├── main.js                    # Electron main process
├── index.html                 # Your web app
├── script.js                  # Your JavaScript
├── styles.css                 # Your CSS
├── images/                    # Your images
├── node_modules/              # Dependencies
├── dist/                      # Build output (created after build)
│   ├── Restaurant POS Setup x.x.x.exe  # Installer
│   └── win-unpacked/          # Portable version
└── package.json               # Project configuration
```

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Run application (development)
npm start

# Build Windows installer
npm run build:win

# Build portable version
npm run build:win:dir

# Build all formats
npm run dist
```

## Next Steps

- Test the application thoroughly on different Windows versions
- Consider code signing for distribution (requires certificate)
- Add application icon and branding
- Configure auto-updates if needed
- Publish to Microsoft Store (optional, requires developer account)

## Security Notes

- The application runs in a secure context (nodeIntegration: false)
- External links are blocked by default
- All web security features are enabled
- LocalStorage data is stored in the user's AppData folder

Good luck building your Windows application! 🚀

