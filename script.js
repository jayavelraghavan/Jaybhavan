// LocalStorage Keys
const STORAGE_KEYS = {
    MENU_ITEMS: 'menuItems',
    ORDERS: 'orders',
    CANCELLED_ORDERS: 'cancelledOrders',
    RESTAURANT_INFO: 'restaurantInfo',
    USERS: 'users',
    CURRENT_USER: 'currentUser'
};

// Default Menu Items
const DEFAULT_MENU_ITEMS = [
    { id: 1, itemCode: 'ITM101', name: 'Idly', price: 30.00, image: 'images/idly.jpg', barcode: '1001' },
    { id: 2, itemCode: 'ITM102', name: 'Dosa', price: 50.00, image: 'images/dosa.jpg', barcode: '1002' },
    { id: 3, itemCode: 'ITM103', name: 'Parotta', price: 40.00, image: 'images/parotta.jpg', barcode: '1003' },
    { id: 4, itemCode: 'ITM104', name: 'Vada', price: 25.00, image: 'images/vada.jpg', barcode: '1004' },
    { id: 5, itemCode: 'ITM105', name: 'Pongal', price: 35.00, image: 'images/pongal.jpg', barcode: '1005' }
];

// State
let cart = [];
let menuItems = [];
let editingItemId = null;
let selectedImageBase64 = null;
let employeeProofAttachment = null;
let editingEmployeeId = null;
let editEmployeeProofAttachment = null;
let qrCodeBase64 = null;
let qrCodeRemoved = false;
let currentUser = null;
let isAdmin = false;
let editImageState = null; // State for image editing
let cropSelection = null; // Current crop selection {x, y, width, height}
let isCropping = false; // Whether user is currently cropping

// Generate auto item code
function generateItemCode() {
    // Find the highest existing item code number
    let maxCode = 100; // Start from 100 (ITM101)
    menuItems.forEach(item => {
        if (item.itemCode) {
            // Extract number from item code (e.g., ITM101 -> 101)
            const match = item.itemCode.match(/\d+$/);
            if (match) {
                const codeNum = parseInt(match[0]);
                if (codeNum >= 101 && codeNum > maxCode) {
                    maxCode = codeNum;
                }
            }
        }
    });
    
    // Generate next item code (ITM101, ITM102, etc.)
    const nextCodeNum = maxCode + 1;
    return `ITM${String(nextCodeNum).padStart(3, '0')}`;
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

// Outer Panel Height Management
function setOuterPanelHeight() {
    const outerPanel = document.querySelector('.outer-panel');
    if (outerPanel) {
        // Account for top position and margins
        const topOffset = 10; // matches CSS top: 10px
        const bottomMargin = 20; // matches CSS margin-bottom: 20px
        const calculatedHeight = window.innerHeight - topOffset - bottomMargin;
        
        // Use important to override CSS if needed
        outerPanel.style.setProperty('height', calculatedHeight + 'px', 'important');
        outerPanel.style.setProperty('max-height', calculatedHeight + 'px', 'important');
    }
}

// Initialize Application
function initializeApp() {
    // Set outer panel height dynamically
    setOuterPanelHeight();
    
    // Add resize listener
    window.addEventListener('resize', setOuterPanelHeight);
    
    // Set cart sidebar scrolling
    const cartSidebar = document.getElementById('cartPanel');
    if (cartSidebar) {
        cartSidebar.style.overflowY = "auto";
    }
    
    // Initialize LocalStorage
    if (!localStorage.getItem(STORAGE_KEYS.MENU_ITEMS)) {
        localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(DEFAULT_MENU_ITEMS));
    } else {
        // Ensure existing items have barcodes
        const existingItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.MENU_ITEMS) || '[]');
        let updated = false;
        existingItems.forEach(item => {
            if (!item.barcode) {
                item.barcode = String(1000 + item.id);
                updated = true;
            }
        });
        if (updated) {
            localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(existingItems));
        }
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CANCELLED_ORDERS)) {
        localStorage.setItem(STORAGE_KEYS.CANCELLED_ORDERS, JSON.stringify([]));
    }
    
    // Initialize users - create default admin if no users exist
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        const defaultUsers = [
            { id: 1, username: 'admin', password: 'admin123', role: 'admin', cashierCode: '', employeeId: null },
            { id: 2, username: 'user1', password: 'user123', role: 'user', cashierCode: '', employeeId: null }
        ];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
        
        // Ensure admin user always has password "admin123"
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const adminUser = users.find(u => u.role === 'admin' && u.username === 'admin');
        if (adminUser && adminUser.password !== 'admin123') {
            adminUser.password = 'admin123';
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
    }
    
    // Load current user
    const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isAdmin = currentUser.role === 'admin';
        updateUserDisplay();
    } else {
        // Clear cart if no user is logged in
        cart = [];
        saveCart();
    }

    // Load menu items
    menuItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.MENU_ITEMS) || '[]');
    
    // Update item codes for all existing items to start from ITM101
    let menuUpdated = false;
    let nextCodeNum = 101; // Start from ITM101
    
    // First, find the highest existing code >= 101
    menuItems.forEach(item => {
        if (item.itemCode) {
            const match = item.itemCode.match(/\d+$/);
            if (match) {
                const codeNum = parseInt(match[0]);
                if (codeNum >= 101 && codeNum >= nextCodeNum) {
                    nextCodeNum = codeNum + 1;
                }
            }
        }
    });
    
    // Update all items: generate new codes for items without codes or with codes < 101
    menuItems.forEach(item => {
        if (!item.itemCode || (item.itemCode.match(/\d+$/) && parseInt(item.itemCode.match(/\d+$/)[0]) < 101)) {
            item.itemCode = `ITM${String(nextCodeNum).padStart(3, '0')}`;
            nextCodeNum++;
            menuUpdated = true;
        }
    });
    
    // Save if any items were updated with item codes
    if (menuUpdated) {
        localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(menuItems));
    }
    
    // Clean up and validate menu item images
    menuUpdated = false;
    menuItems.forEach(item => {
        if (item.image) {
            // Check if image URL is invalid (looks like placeholder service URL or invalid format)
            const invalidPatterns = [
                /^\d+x\d+/,  // Starts with dimensions like "200x150"
                /\?text=/,   // Contains query parameter like "?text=Vada"
                /^http.*placeholder/,  // Placeholder service URLs
                /^https?:\/\/\d+x\d+/  // HTTP URLs with dimensions
            ];
            
            const isInvalid = invalidPatterns.some(pattern => pattern.test(item.image));
            const isBase64 = item.image.startsWith('data:image');
            const isValidPath = item.image.startsWith('images/') || item.image.startsWith('./images/');
            
            if (isInvalid || (!isBase64 && !isValidPath)) {
                // Reset to default image path
                item.image = `images/${item.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
                menuUpdated = true;
            }
        } else {
            // If no image, set default
            item.image = `images/${item.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
            menuUpdated = true;
        }
    });
    
    // Save updated menu items if any were fixed
    if (menuUpdated) {
        localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(menuItems));
    }
    
    // Load restaurant info and update header
    loadRestaurantInfo();
    
    // Render menu
    renderMenu();
    
    // Load cart from localStorage only if user is logged in
    if (currentUser) {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
    }
    renderCart();
}

// Setup Event Listeners
function setupEventListeners() {
    // Login button (will be updated by updateUserDisplay based on login status)
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.addEventListener('click', () => {
        if (currentUser) {
            // If logged in, show logout confirmation
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        } else {
            // If not logged in, show login modal
            document.getElementById('loginModal').classList.remove('hidden');
        }
    });
    
    // Header Fullscreen button
    const headerFullscreenBtn = document.getElementById('headerFullscreenBtn');
    if (headerFullscreenBtn) {
        headerFullscreenBtn.addEventListener('click', toggleHeaderFullscreen);
        // Listen for fullscreen changes to update button icon
        document.addEventListener('fullscreenchange', handleHeaderFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleHeaderFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleHeaderFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleHeaderFullscreenChange);
    }
    
    // Login Modal
    document.getElementById('loginSubmitBtn').addEventListener('click', handleLogin);
    document.getElementById('closeLoginModal').addEventListener('click', () => {
        document.getElementById('loginModal').classList.add('hidden');
        // Clear form
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
    });
    document.getElementById('loginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    document.getElementById('loginUsername').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('loginPassword').focus();
        }
    });
    
    // Close login modal on outside click
    document.getElementById('loginModal').addEventListener('click', (e) => {
        if (e.target.id === 'loginModal') {
            document.getElementById('loginModal').classList.add('hidden');
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
        }
    });
    
    // Edit User Modal
    document.getElementById('saveUserBtn').addEventListener('click', saveUserChanges);
    document.getElementById('resetPasswordBtn').addEventListener('click', resetUserPassword);
    document.getElementById('closeEditUserModal').addEventListener('click', closeEditUserModal);
    document.getElementById('editUserModal').addEventListener('click', (e) => {
        if (e.target.id === 'editUserModal') {
            closeEditUserModal();
        }
    });
    
    // Employee Modal
    if (document.getElementById('employeeBtn')) {
        document.getElementById('employeeBtn').addEventListener('click', () => {
            document.getElementById('employeeModal').classList.remove('hidden');
            loadEmployeesList();
            // Load admin employee ID and name
            const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
            if (document.getElementById('adminEmployeeId')) {
                document.getElementById('adminEmployeeId').value = restaurantInfo.adminEmployeeId || '';
            }
            if (document.getElementById('adminEmployeeName')) {
                document.getElementById('adminEmployeeName').value = restaurantInfo.adminEmployeeName || '';
            }
            // Load lock state
            const isLocked = restaurantInfo.adminEmployeeIdLocked || false;
            updateLockButtonState(isLocked);
            // Generate and display next employee ID
            if (document.getElementById('newEmployeeId')) {
                document.getElementById('newEmployeeId').value = generateNextEmployeeId();
            }
        });
    }
    if (document.getElementById('closeEmployeeModal')) {
        document.getElementById('closeEmployeeModal').addEventListener('click', closeEmployeeModal);
    }
    if (document.getElementById('employeeFullscreenBtn')) {
        document.getElementById('employeeFullscreenBtn').addEventListener('click', toggleEmployeeFullscreen);
    }
    if (document.getElementById('employeeModal')) {
        document.getElementById('employeeModal').addEventListener('click', (e) => {
            if (e.target.id === 'employeeModal') {
                closeEmployeeModal();
            }
        });
    }
    if (document.getElementById('showAddEmployeeFormBtn')) {
        document.getElementById('showAddEmployeeFormBtn').addEventListener('click', showAddEmployeeForm);
    }
    if (document.getElementById('showAddEmployeeFormBtn')) {
        document.getElementById('showAddEmployeeFormBtn').addEventListener('click', showAddEmployeeForm);
    }
    if (document.getElementById('addEmployeeBtn')) {
        document.getElementById('addEmployeeBtn').addEventListener('click', addEmployee);
    }
    if (document.getElementById('newEmployeeIdProofFile')) {
        document.getElementById('newEmployeeIdProofFile').addEventListener('change', handleEmployeeProofAttachment);
    }
    if (document.getElementById('removeEmployeeProofBtn')) {
        document.getElementById('removeEmployeeProofBtn').addEventListener('click', removeEmployeeProofAttachment);
    }
    if (document.getElementById('closeEditEmployeeModal')) {
        document.getElementById('closeEditEmployeeModal').addEventListener('click', closeEditEmployeeModal);
    }
    if (document.getElementById('cancelEditEmployeeBtn')) {
        document.getElementById('cancelEditEmployeeBtn').addEventListener('click', closeEditEmployeeModal);
    }
    if (document.getElementById('saveEmployeeChangesBtn')) {
        document.getElementById('saveEmployeeChangesBtn').addEventListener('click', saveEmployeeChanges);
    }
    if (document.getElementById('editEmployeeIdProofFile')) {
        document.getElementById('editEmployeeIdProofFile').addEventListener('change', handleEditEmployeeProofAttachment);
    }
    if (document.getElementById('removeEditEmployeeProofBtn')) {
        document.getElementById('removeEditEmployeeProofBtn').addEventListener('click', removeEditEmployeeProofAttachment);
    }
    if (document.getElementById('lockAdminEmployeeIdBtn')) {
        document.getElementById('lockAdminEmployeeIdBtn').addEventListener('click', toggleLockAdminEmployeeId);
    }
    
    // Starting Bill Number Lock Button
    if (document.getElementById('lockStartingBillNumberBtn')) {
        document.getElementById('lockStartingBillNumberBtn').addEventListener('click', toggleLockStartingBillNumber);
    }
    
    // Hamburger Menu
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    if (hamburgerBtn && hamburgerMenu) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleHamburgerMenu();
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (hamburgerMenu && !hamburgerMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                if (!hamburgerMenu.classList.contains('hidden')) {
                    closeHamburgerMenu();
                }
            }
        });
    }
    
    // Navigation buttons
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            if (isAdmin) {
                showAdmin();
            } else {
                document.getElementById('adminLoginModal').classList.remove('hidden');
            }
            closeHamburgerMenu();
        });
    }
    
    // Admin Login
    document.getElementById('adminLoginBtn').addEventListener('click', adminLogin);
    document.getElementById('closeAdminLoginModal').addEventListener('click', () => {
        document.getElementById('adminLoginModal').classList.add('hidden');
    });
    document.getElementById('adminPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            adminLogin();
        }
    });
    
    // User Management
    document.getElementById('addUserBtn').addEventListener('click', addUser);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Employee ID selection handlers
    if (document.getElementById('newUserEmployeeId')) {
        document.getElementById('newUserEmployeeId').addEventListener('change', handleEmployeeIdSelection);
    }
    if (document.getElementById('editUserEmployeeId')) {
        document.getElementById('editUserEmployeeId').addEventListener('change', handleEditEmployeeIdSelection);
    }
    
    // Cancel Bill (Admin only)
    document.getElementById('cancelPreviousBillBtn').addEventListener('click', cancelBill);
    
    const menuManagementBtn = document.getElementById('menuManagementBtn');
    if (menuManagementBtn) {
        menuManagementBtn.addEventListener('click', () => {
            if (!isAdmin) {
                alert('Only admins can access Menu Management!');
                return;
            }
            showMenuManagement();
            closeHamburgerMenu();
        });
    }
    
    const salesReportBtn = document.getElementById('salesReportBtn');
    if (salesReportBtn) {
        salesReportBtn.addEventListener('click', () => {
            if (!isAdmin) {
                alert('Only admins can access Sales Report!');
                return;
            }
            showSalesReport();
            closeHamburgerMenu();
        });
    }
    
    // Cancel Bill Section
    const cancelBillBtn = document.getElementById('cancelBillBtn');
    if (cancelBillBtn) {
        cancelBillBtn.addEventListener('click', () => {
            if (isAdmin) {
                showCancelBillSection();
            } else {
                alert('Only admins can access Cancel Bill section!');
                document.getElementById('adminLoginModal').classList.remove('hidden');
            }
            closeHamburgerMenu();
        });
    }
    document.getElementById('closeCancelBillBtn').addEventListener('click', () => {
        document.getElementById('cancelBillSection').classList.add('hidden');
    });
    document.getElementById('searchCancelBillBtn').addEventListener('click', searchCancelBillByNumber);
    document.getElementById('cancelBillOrderSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchCancelBillByNumber();
        }
    });
    document.getElementById('searchCancelBillByDateBtn').addEventListener('click', searchCancelBillByDate);

    // Menu search
    document.getElementById('menuSearchInput').addEventListener('input', (e) => {
        filterMenuItems(e.target.value);
    });

    // Cart controls
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);
    document.getElementById('payNowBtn').addEventListener('click', showQRModal);
    document.getElementById('printBillBtn').addEventListener('click', printBill);
    
    // Cart tabs
    document.getElementById('currentCartTab').addEventListener('click', () => {
        switchCartTab('current');
    });
    document.getElementById('previousBillsTab').addEventListener('click', () => {
        switchCartTab('previous');
    });

    // Menu Management
    document.getElementById('closeManagementBtn').addEventListener('click', () => {
        document.getElementById('menuManagementSection').classList.add('hidden');
        editingItemId = null;
        removeImagePreview();
        // Clear form
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        document.getElementById('itemImageFile').value = '';
        document.getElementById('itemTax').value = 'no';
        document.getElementById('gstPercentageGroup').classList.add('hidden');
        document.getElementById('itemGstPercentage').value = '';
        document.getElementById('itemSgstPercentage').value = '';
    });
    
    // Management Tabs
    document.querySelectorAll('.management-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchManagementTab(tabName);
        });
    });
    
    // Stock Management Actions
    const stockFullscreenBtn = document.getElementById('stockFullscreenBtn');
    const downloadStockTemplateBtn = document.getElementById('downloadStockTemplateBtn');
    const bulkStockUpload = document.getElementById('bulkStockUpload');
    const stockSearchInput = document.getElementById('stockSearchInput');
    const clearStockSearchBtn = document.getElementById('clearStockSearchBtn');
    const stockColorFilter = document.getElementById('stockColorFilter');
    const exportStockBtn = document.getElementById('exportStockBtn');
    const exportDropdown = document.getElementById('exportDropdown');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    
    if (stockFullscreenBtn) {
        stockFullscreenBtn.addEventListener('click', toggleStockFullscreen);
    }
    if (downloadStockTemplateBtn) {
        downloadStockTemplateBtn.addEventListener('click', downloadStockTemplate);
    }
    if (bulkStockUpload) {
        bulkStockUpload.addEventListener('change', handleBulkStockUpload);
    }
    if (stockSearchInput) {
        stockSearchInput.addEventListener('input', handleStockSearch);
    }
    if (clearStockSearchBtn) {
        clearStockSearchBtn.addEventListener('click', clearStockSearch);
    }
    if (stockColorFilter) {
        stockColorFilter.addEventListener('change', handleStockSearch);
    }
    if (exportStockBtn) {
        exportStockBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportDropdown.classList.toggle('hidden');
        });
    }
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', () => {
            exportDropdown.classList.add('hidden');
            exportStockToExcel();
        });
    }
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', () => {
            exportDropdown.classList.add('hidden');
            exportStockToPDF();
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (exportDropdown && !exportDropdown.contains(e.target) && !exportStockBtn.contains(e.target)) {
            exportDropdown.classList.add('hidden');
        }
    });
    document.getElementById('addItemBtn').addEventListener('click', addMenuItem);
    document.getElementById('itemImageFile').addEventListener('change', handleImageSelect);
    document.getElementById('removeImageBtn').addEventListener('click', removeImagePreview);
    document.getElementById('editImageBtn').addEventListener('click', openImageEditModal);
    
    // Paste image functionality (Ctrl+V)
    document.addEventListener('paste', handlePasteImage);
    
    // Image Edit Modal event listeners
    document.getElementById('closeImageEditModal').addEventListener('click', closeImageEditModal);
    document.getElementById('cancelEditImageBtn').addEventListener('click', closeImageEditModal);
    document.getElementById('saveEditedImageBtn').addEventListener('click', saveEditedImage);
    
    // Close modal on outside click
    document.getElementById('imageEditModal').addEventListener('click', (e) => {
        if (e.target.id === 'imageEditModal') {
            closeImageEditModal();
        }
    });
    document.getElementById('applyResizeBtn').addEventListener('click', applyResize);
    document.getElementById('applyCropBtn').addEventListener('click', applyCrop);
    document.getElementById('resetCropBtn').addEventListener('click', resetCrop);
    
    // Maintain aspect ratio toggle
    document.getElementById('maintainAspectRatio').addEventListener('change', function() {
        if (this.checked && editImageState && editImageState.originalWidth && editImageState.originalHeight) {
            const width = parseFloat(document.getElementById('resizeWidth').value);
            if (width) {
                const aspectRatio = editImageState.originalWidth / editImageState.originalHeight;
                document.getElementById('resizeHeight').value = Math.round(width / aspectRatio);
            }
        }
    });
    
    // Resize width/height input handlers for aspect ratio
    document.getElementById('resizeWidth').addEventListener('input', function() {
        if (document.getElementById('maintainAspectRatio').checked && editImageState && editImageState.originalWidth && editImageState.originalHeight) {
            const width = parseFloat(this.value);
            if (width) {
                const aspectRatio = editImageState.originalWidth / editImageState.originalHeight;
                document.getElementById('resizeHeight').value = Math.round(width / aspectRatio);
            }
        }
    });
    
    document.getElementById('resizeHeight').addEventListener('input', function() {
        if (document.getElementById('maintainAspectRatio').checked && editImageState && editImageState.originalWidth && editImageState.originalHeight) {
            const height = parseFloat(this.value);
            if (height) {
                const aspectRatio = editImageState.originalWidth / editImageState.originalHeight;
                document.getElementById('resizeWidth').value = Math.round(height * aspectRatio);
            }
        }
    });
    document.getElementById('itemTax').addEventListener('change', function() {
        const gstGroup = document.getElementById('gstPercentageGroup');
        if (this.value === 'yes') {
            gstGroup.classList.remove('hidden');
            gstGroup.style.display = 'block';
        } else {
            gstGroup.classList.add('hidden');
            document.getElementById('itemGstPercentage').value = '';
            document.getElementById('itemSgstPercentage').value = '';
            document.getElementById('itemPriceIncludesTax').value = 'no';
        }
    });
    
    document.getElementById('itemStockItem').addEventListener('change', function() {
        const stockFieldsGroup = document.getElementById('stockFieldsGroup');
        if (this.value === 'yes') {
            stockFieldsGroup.classList.remove('hidden');
            stockFieldsGroup.style.display = 'block';
        } else {
            stockFieldsGroup.classList.add('hidden');
            document.getElementById('itemStockValue').value = '';
            document.getElementById('itemMinStock').value = '';
        }
    });
    
    // Admin
    document.getElementById('closeAdminBtn').addEventListener('click', () => {
        document.getElementById('adminSection').classList.add('hidden');
    });
    document.getElementById('saveRestaurantInfoBtn').addEventListener('click', saveRestaurantInfo);
    document.getElementById('qrCodeFile').addEventListener('change', handleQRCodeSelect);
    document.getElementById('removeQRCodeBtn').addEventListener('click', removeQRCodePreview);

    // Sales Report
    document.getElementById('closeSalesReportBtn').addEventListener('click', () => {
        document.getElementById('salesReportSection').classList.add('hidden');
    });
    document.getElementById('generateDateRangeReportBtn').addEventListener('click', () => {
        generateDateRangeReport();
    });
    document.getElementById('searchOrderBtn').addEventListener('click', searchOrder);
    document.getElementById('orderSearchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchOrder();
        }
    });
    document.getElementById('generateUserWiseReportBtn').addEventListener('click', generateUserWiseReport);
    document.getElementById('generateItemWiseReportBtn').addEventListener('click', generateItemWiseReport);
    document.getElementById('exportPDFBtn').addEventListener('click', exportToPDF);
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
    
    // Report Modal
    document.getElementById('closeReportModal').addEventListener('click', () => {
        document.getElementById('reportModal').classList.add('hidden');
        // Exit fullscreen if active
        exitFullscreen();
    });
    document.getElementById('closeReportModalBtn').addEventListener('click', () => {
        document.getElementById('reportModal').classList.add('hidden');
        // Exit fullscreen if active
        exitFullscreen();
    });
    document.getElementById('reportModal').addEventListener('click', (e) => {
        if (e.target.id === 'reportModal') {
            document.getElementById('reportModal').classList.add('hidden');
            // Exit fullscreen if active
            exitFullscreen();
        }
    });
    
    // Fullscreen Toggle
    document.getElementById('fullscreenReportBtn').addEventListener('click', toggleReportFullscreen);
    
    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    // Sales Report Tab Switching
    const reportTabs = document.querySelectorAll('.report-tab');
    reportTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            switchReportTab(targetTab);
        });
    });

    // Print Bill Preview Modal
    document.getElementById('closePrintBillPreviewModal').addEventListener('click', () => {
        document.getElementById('printBillPreviewModal').classList.add('hidden');
    });
    document.getElementById('cancelPrintBillBtn').addEventListener('click', () => {
        document.getElementById('printBillPreviewModal').classList.add('hidden');
    });
    document.getElementById('confirmPrintBillBtn').addEventListener('click', () => {
        document.getElementById('printBillPreviewModal').classList.add('hidden');
        // Proceed with actual print
        printBillDirect();
    });
    
    // Close print bill preview modal on outside click
    document.getElementById('printBillPreviewModal').addEventListener('click', (e) => {
        if (e.target.id === 'printBillPreviewModal') {
            document.getElementById('printBillPreviewModal').classList.add('hidden');
        }
    });

    // Previous Bill Modal
    document.getElementById('closePreviousBillModal').addEventListener('click', () => {
        document.getElementById('previousBillModal').classList.add('hidden');
    });
    document.getElementById('closePreviousBillBtn').addEventListener('click', () => {
        document.getElementById('previousBillModal').classList.add('hidden');
    });
    document.getElementById('printPreviousBillBtn').addEventListener('click', () => {
        if (currentPreviewOrder) {
            printBillForOrder(currentPreviewOrder);
        }
    });
    
    // Close previous bill modal on outside click
    document.getElementById('previousBillModal').addEventListener('click', (e) => {
        if (e.target.id === 'previousBillModal') {
            document.getElementById('previousBillModal').classList.add('hidden');
        }
    });

    // QR Modal
    document.getElementById('closeQRModal').addEventListener('click', () => {
        document.getElementById('qrModal').classList.add('hidden');
        resetPaymentModal();
    });
    document.getElementById('gpayBtn').addEventListener('click', () => {
        showGPaySection();
    });
    document.getElementById('cashBtn').addEventListener('click', () => {
        showCashSection();
    });
    document.getElementById('confirmGPayBtn').addEventListener('click', confirmPayment);
    document.getElementById('confirmCashBtn').addEventListener('click', confirmCashPayment);

    // Close modals on outside click
    document.getElementById('qrModal').addEventListener('click', (e) => {
        if (e.target.id === 'qrModal') {
            document.getElementById('qrModal').classList.add('hidden');
        }
    });
}

// Menu Rendering
let filteredMenuItems = [];

function renderMenu(itemsToRender = null) {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = '';

    const items = itemsToRender || menuItems;
    filteredMenuItems = items;

    if (items.length === 0) {
        menuGrid.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1 / -1; padding: 40px;">No items found.</p>';
        return;
    }

    items.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        
        // Validate and sanitize image URL - check if it's base64 or a valid path
        let imageSrc = item.image || '';
        const isBase64 = imageSrc.startsWith('data:image');
        const isValidPath = imageSrc.startsWith('images/') || imageSrc.startsWith('./images/') || imageSrc.startsWith('../images/');
        
        // If image is invalid (not base64 and not a valid path), use fallback
        if (!isBase64 && !isValidPath && imageSrc) {
            // Check if it looks like a placeholder service URL or invalid URL
            if (imageSrc.includes('?') || imageSrc.includes('http') || imageSrc.match(/^\d+x\d+/)) {
                imageSrc = ''; // Reset to empty to trigger fallback
            }
        }
        
        // Fallback to default image path or SVG placeholder
        if (!imageSrc) {
            imageSrc = `images/${item.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
        }
        
        // Create SVG placeholder as data URI
        const svgPlaceholder = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#ddd" width="200" height="200"/><text fill="#999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%" y="50%" text-anchor="middle">${item.name}</text></svg>`)}`;
        
        menuItem.innerHTML = `
            <img src="${imageSrc}" alt="${item.name}" onclick="addToCart(${item.id})" style="cursor: pointer;" onerror="this.onerror=null; this.src='${svgPlaceholder}';">
            <div class="menu-item-info">
                <h3>${item.name}</h3>
                <p>₹${item.price.toFixed(2)}</p>
            </div>
        `;
        menuGrid.appendChild(menuItem);
    });
}

function filterMenuItems(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (term === '') {
        renderMenu();
        return;
    }
    
    const filtered = menuItems.filter(item => 
        item.name.toLowerCase().includes(term) ||
        (item.barcode && item.barcode.toLowerCase().includes(term))
    );
    
    renderMenu(filtered);
}

// Cart Functions
function addToCart(itemId) {
    // Check if user is logged in
    if (!currentUser) {
        alert('Please login to add items to cart!');
        document.getElementById('loginModal').classList.remove('hidden');
        return;
    }
    
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    const existingItem = cart.find(c => c.id === itemId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            hasTax: item.hasTax || false,
            gstPercentage: item.gstPercentage || 0,
            sgstPercentage: item.sgstPercentage || 0,
            priceIncludesTax: item.priceIncludesTax || false
        });
    }

    saveCart();
    renderCart();
    updateCartCount();
}

function removeFromCart(itemId) {
    // Check if user is logged in
    if (!currentUser) {
        alert('Please login to manage cart!');
        document.getElementById('loginModal').classList.remove('hidden');
        return;
    }
    
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    renderCart();
    updateCartCount();
}

function updateQuantity(itemId, change) {
    // Check if user is logged in
    if (!currentUser) {
        alert('Please login to manage cart!');
        document.getElementById('loginModal').classList.remove('hidden');
        return;
    }
    
    const item = cart.find(c => c.id === itemId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(itemId);
    } else {
        saveCart();
        renderCart();
        updateCartCount();
    }
}

function clearCart() {
    if (cart.length === 0) return;
    if (confirm('Are you sure you want to clear the cart?')) {
        cart = [];
        saveCart();
        renderCart();
        updateCartCount();
    }
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    // Check if user is logged in
    if (!currentUser) {
        cartItems.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Please login to view and manage your cart.<br><button onclick="document.getElementById(\'loginModal\').classList.remove(\'hidden\')" class="btn btn-primary" style="margin-top: 10px;">Login</button></p>';
        cartTotal.textContent = '0.00';
        // Clear cart if not logged in
        cart = [];
        saveCart();
        updateCartCount();
        return;
    }
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty-state">
                <div class="cart-empty-icon">🛒</div>
                <div class="cart-empty-text">Your cart is empty</div>
                <div class="cart-empty-subtext">Add items from the menu to get started</div>
            </div>
        `;
        cartTotal.textContent = '0.00';
        // Update header cart total
        const headerCartTotal = document.getElementById('headerCartTotal');
        const headerCartTotalDisplay = document.getElementById('headerCartTotalDisplay');
        if (headerCartTotal) {
            headerCartTotal.textContent = '0.00';
        }
        if (headerCartTotalDisplay && currentUser) {
            headerCartTotalDisplay.style.display = 'flex';
        } else if (headerCartTotalDisplay) {
            headerCartTotalDisplay.style.display = 'none';
        }
        return;
    }

    cartItems.innerHTML = '';
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>₹${item.price.toFixed(2)} × ${item.quantity} = ₹${itemTotal.toFixed(2)}</p>
                ${item.hasTax && (item.gstPercentage > 0 || item.sgstPercentage > 0) ? 
                    `<p style="font-size: 14px; color: #666; margin-top: 6px;">
                        ${item.gstPercentage > 0 ? `CGST ${item.gstPercentage}%` : ''}
                        ${item.gstPercentage > 0 && item.sgstPercentage > 0 ? ' + ' : ''}
                        ${item.sgstPercentage > 0 ? `SGST ${item.sgstPercentage}%` : ''}
                    </p>` : ''}
            </div>
            <div class="cart-item-controls">
                <div class="quantity-control-group">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${item.id})" title="Remove item">
                    <span class="remove-icon">🗑️</span>
                </button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });

    const subtotal = calculateSubtotal();
    const taxData = calculateTax();
    const total = calculateTotal();
    
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartSubtotalAmount = document.getElementById('cartSubtotalAmount');
    const cartCgst = document.getElementById('cartCgst');
    const cartCgstAmount = document.getElementById('cartCgstAmount');
    const cartSgst = document.getElementById('cartSgst');
    const cartSgstAmount = document.getElementById('cartSgstAmount');
    const cartTax = document.getElementById('cartTax');
    const cartTaxAmount = document.getElementById('cartTaxAmount');
    
    if (taxData.total > 0) {
        if (cartSubtotal) {
            cartSubtotal.style.display = 'block';
        }
        if (cartSubtotalAmount) {
            cartSubtotalAmount.textContent = subtotal.toFixed(2);
        }
        if (cartCgst) {
            cartCgst.style.display = taxData.cgst > 0 ? 'block' : 'none';
        }
        if (cartCgstAmount) {
            cartCgstAmount.textContent = taxData.cgst.toFixed(2);
        }
        if (cartSgst) {
            cartSgst.style.display = taxData.sgst > 0 ? 'block' : 'none';
        }
        if (cartSgstAmount) {
            cartSgstAmount.textContent = taxData.sgst.toFixed(2);
        }
        if (cartTax) {
            cartTax.style.display = 'block';
        }
        if (cartTaxAmount) {
            cartTaxAmount.textContent = taxData.total.toFixed(2);
        }
    } else {
        if (cartSubtotal) {
            cartSubtotal.style.display = 'none';
        }
        if (cartCgst) {
            cartCgst.style.display = 'none';
        }
        if (cartSgst) {
            cartSgst.style.display = 'none';
        }
        if (cartTax) {
            cartTax.style.display = 'none';
        }
    }
    
    cartTotal.textContent = total.toFixed(2);
    
    // Update header cart total
    const headerCartTotal = document.getElementById('headerCartTotal');
    const headerCartTotalDisplay = document.getElementById('headerCartTotalDisplay');
    if (headerCartTotal) {
        headerCartTotal.textContent = total.toFixed(2);
    }
    if (headerCartTotalDisplay && currentUser) {
        headerCartTotalDisplay.style.display = 'flex';
    } else if (headerCartTotalDisplay) {
        headerCartTotalDisplay.style.display = 'none';
    }
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cartCount');
    const cartItemsCountElement = document.getElementById('cartItemsCount');
    
    if (cartCountElement) {
        cartCountElement.textContent = count;
    }
    
    if (cartItemsCountElement) {
        cartItemsCountElement.textContent = count;
    }
}

function switchCartTab(tab) {
    const currentTab = document.getElementById('currentCartTab');
    const previousTab = document.getElementById('previousBillsTab');
    const currentContent = document.getElementById('currentCartContent');
    const previousContent = document.getElementById('previousBillsContent');
    
    if (tab === 'current') {
        currentTab.classList.add('active');
        previousTab.classList.remove('active');
        currentContent.classList.add('active');
        previousContent.classList.remove('active');
    } else {
        previousTab.classList.add('active');
        currentTab.classList.remove('active');
        previousContent.classList.add('active');
        currentContent.classList.remove('active');
        loadPreviousBills();
    }
}

function loadPreviousBills() {
    const previousBillsList = document.getElementById('previousBillsList');
    if (!previousBillsList) return;
    
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    const cancelledOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.CANCELLED_ORDERS) || '[]');
    
    // Combine active and cancelled orders, mark cancelled ones
    const allOrders = [
        ...orders.map(o => ({ ...o, isCancelled: false })),
        ...cancelledOrders.map(o => ({ ...o, isCancelled: true }))
    ];
    
    if (allOrders.length === 0) {
        previousBillsList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No previous bills found.</p>';
        return;
    }
    
    // Sort orders by date (newest first)
    // For cancelled orders, use cancelledDate if available, otherwise use date
    const sortedOrders = allOrders.sort((a, b) => {
        const dateA = a.isCancelled && a.cancelledDate ? new Date(a.cancelledDate) : new Date(a.date);
        const dateB = b.isCancelled && b.cancelledDate ? new Date(b.cancelledDate) : new Date(b.date);
        return dateB - dateA;
    });
    
    previousBillsList.innerHTML = '';
    
    sortedOrders.forEach(order => {
        const billItem = document.createElement('div');
        billItem.className = 'previous-bill-item';
        if (order.isCancelled) {
            billItem.style.borderLeft = '4px solid #f44336';
            billItem.style.backgroundColor = '#ffebee';
        } else {
            billItem.style.borderLeft = '4px solid #4CAF50';
        }
        billItem.onclick = () => previewPreviousBill(order);
        
        // Use cancelledDate if available for cancelled orders
        const orderDate = order.isCancelled && order.cancelledDate 
            ? new Date(order.cancelledDate).toLocaleString() 
            : new Date(order.date).toLocaleString();
        const paymentMethod = order.paymentMethod || 'N/A';
        const paymentMethodLabel = paymentMethod === 'gpay' ? 'GPay' : paymentMethod === 'cash' ? 'Cash' : paymentMethod;
        
        billItem.innerHTML = `
            <div class="previous-bill-item-header">
                <div>
                    <div class="previous-bill-item-id">
                        Order #${order.id}
                        ${order.isCancelled ? '<span style="color: #f44336; font-weight: bold; margin-left: 10px;">[CANCELLED]</span>' : '<span style="color: #4CAF50; font-weight: bold; margin-left: 10px;">[ACTIVE]</span>'}
                    </div>
                    <div class="previous-bill-item-date">${orderDate}</div>
                </div>
                <div class="previous-bill-item-total" style="color: ${order.isCancelled ? '#f44336' : '#4CAF50'};">₹${order.total.toFixed(2)}</div>
            </div>
            <div class="previous-bill-item-payment">Payment: ${paymentMethodLabel}</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">
                ${order.items.length} item(s)
            </div>
        `;
        
        previousBillsList.appendChild(billItem);
    });
}

function previewPreviousBill(order) {
    currentPreviewOrder = order;
    
    const modal = document.getElementById('previousBillModal');
    const content = document.getElementById('previousBillContent');
    
    if (!modal || !content) return;
    
    // Get restaurant info
    const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    const restaurantName = restaurantInfo.name || 'Restaurant';
    const restaurantAddress = restaurantInfo.address || '';
    const restaurantGstin = restaurantInfo.gstin || '';
    const restaurantFssai = restaurantInfo.fssai || '';
    const showGstinInBill = restaurantInfo.showGstinInBill !== false; // Default to true if not set
    const showFssaiInBill = restaurantInfo.showFssaiInBill !== false; // Default to true if not set
    
    // Check if order is cancelled
    const isCancelled = order.isCancelled || false;
    const cancelledDate = order.cancelledDate ? new Date(order.cancelledDate).toLocaleString() : null;
    const cancelledBy = order.cancelledBy || null;
    
    // Format date - use cancelledDate if available for cancelled orders
    const orderDate = isCancelled && cancelledDate 
        ? cancelledDate 
        : new Date(order.date).toLocaleString();
    const paymentMethod = order.paymentMethod || 'N/A';
    const paymentMethodLabel = paymentMethod === 'gpay' ? 'GPay' : paymentMethod === 'cash' ? 'Cash' : paymentMethod;
    
    // Build bill HTML with all details
    let itemsHtml = '';
    order.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        itemsHtml += `
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                <div>
                    <strong>${item.name}</strong>
                    <div style="font-size: 12px; color: #666;">₹${item.price.toFixed(2)} × ${item.quantity}</div>
                </div>
                <div style="font-weight: bold;">₹${itemTotal.toFixed(2)}</div>
            </div>
        `;
    });
    
    // Show all details like print bill preview
    content.innerHTML = `
        <div style="padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h3 style="margin: 0 0 5px 0;">${restaurantName}</h3>
                ${restaurantAddress ? `<p style="margin: 0; color: #666; font-size: 14px;">${restaurantAddress}</p>` : ''}
                ${(restaurantGstin && showGstinInBill) ? `<p style="margin: 0; color: #666; font-size: 12px;">GSTIN: ${restaurantGstin}</p>` : ''}
                ${(restaurantFssai && showFssaiInBill) ? `<p style="margin: 0; color: #666; font-size: 12px;">FSSAI Code: ${restaurantFssai}</p>` : ''}
            </div>
            ${isCancelled ? `
            <div style="background: #ffebee; border: 2px solid #f44336; border-radius: 5px; padding: 15px; margin-bottom: 20px; text-align: center;">
                <h3 style="color: #c62828; margin: 0 0 10px 0;">⚠️ CANCELLED BILL</h3>
                ${cancelledDate ? `<p style="margin: 5px 0; color: #d32f2f;"><strong>Cancelled Date:</strong> ${cancelledDate}</p>` : ''}
                ${cancelledBy ? `<p style="margin: 5px 0; color: #d32f2f;"><strong>Cancelled By:</strong> ${cancelledBy}</p>` : ''}
            </div>
            ` : ''}
            <div style="border-top: 2px solid #333; border-bottom: 2px solid #333; padding: 15px 0; margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span><strong style="font-size: 16px;">Bill No.:</strong></span>
                    <span style="font-size: 16px; font-weight: bold;">${(typeof order.id === 'number' ? order.id : parseInt(order.id) || order.id).toString()}${isCancelled ? ' <span style="color: #f44336;">(CANCELLED)</span>' : ' <span style="color: #4CAF50;">(ACTIVE)</span>'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span><strong>Status:</strong></span>
                    <span style="color: ${isCancelled ? '#f44336' : '#4CAF50'}; font-weight: bold;">${isCancelled ? 'CANCELLED' : 'ACTIVE'}</span>
                </div>
                ${order.customerName && order.customerName.trim() ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span><strong>Customer Name:</strong></span>
                    <span>${order.customerName}</span>
                </div>
                ` : ''}
                ${(() => {
                    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
                    const loggedInUser = users.find(u => u.id === order.userId);
                    return (loggedInUser && loggedInUser.cashierCode && loggedInUser.cashierCode.trim()) ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span><strong>Cashier Code:</strong></span>
                    <span>${loggedInUser.cashierCode}</span>
                </div>
                ` : '';
                })()}
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span><strong>Date:</strong></span>
                    <span>${orderDate}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span><strong>Payment Method:</strong></span>
                    <span>${paymentMethodLabel}</span>
                </div>
            </div>
            <div style="margin: 20px 0;">
                <h4 style="margin-bottom: 15px;">Items:</h4>
                ${itemsHtml}
            </div>
        </div>
    `;
    
    // Update total amount in the footer (if it exists)
    const totalElement = document.getElementById('previousBillTotal');
    if (totalElement) {
        totalElement.textContent = `Total: ₹${order.total.toFixed(2)}`;
    }
    
    // Show/hide cancel button based on admin status and if bill is already cancelled
    const cancelBtn = document.getElementById('cancelPreviousBillBtn');
    if (cancelBtn) {
        // Hide cancel button if bill is already cancelled or user is not admin
        cancelBtn.classList.toggle('hidden', !isAdmin || isCancelled);
    }
    
    modal.classList.remove('hidden');
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function calculateTotal() {
    let total = 0;
    cart.forEach(item => {
        if (item.hasTax && item.priceIncludesTax) {
            // Price includes tax - use the price as total (tax already included)
            total += item.price * item.quantity;
        } else {
            // Price excludes tax - add price, tax will be added separately
            const itemSubtotal = item.price * item.quantity;
            total += itemSubtotal;
            if (item.hasTax) {
                const totalTaxRate = (item.gstPercentage || 0) + (item.sgstPercentage || 0);
                total += (itemSubtotal * totalTaxRate) / 100;
            }
        }
    });
    return total;
}

function calculateSubtotal() {
    let subtotal = 0;
    cart.forEach(item => {
        if (item.hasTax && item.priceIncludesTax) {
            // Price includes tax - calculate base price (price - tax)
            const totalTaxRate = (item.gstPercentage || 0) + (item.sgstPercentage || 0);
            const itemPriceTotal = item.price * item.quantity;
            const basePrice = itemPriceTotal / (1 + totalTaxRate / 100);
            subtotal += basePrice;
        } else {
            // Price excludes tax - use price as subtotal
            subtotal += item.price * item.quantity;
        }
    });
    return subtotal;
}

function calculateTax() {
    let totalCgst = 0;
    let totalSgst = 0;
    cart.forEach(item => {
        if (item.hasTax) {
            const totalTaxRate = (item.gstPercentage || 0) + (item.sgstPercentage || 0);
            const itemPriceTotal = item.price * item.quantity;
            
            if (item.priceIncludesTax) {
                // Price includes tax - calculate base price and tax
                const basePrice = itemPriceTotal / (1 + totalTaxRate / 100);
                const totalTax = itemPriceTotal - basePrice;
                
                // Distribute tax proportionally between CGST and SGST
                if (totalTaxRate > 0) {
                    if (item.gstPercentage > 0) {
                        totalCgst += (totalTax * item.gstPercentage) / totalTaxRate;
                    }
                    if (item.sgstPercentage > 0) {
                        totalSgst += (totalTax * item.sgstPercentage) / totalTaxRate;
                    }
                }
            } else {
                // Price excludes tax - calculate tax separately
                if (item.gstPercentage > 0) {
                    totalCgst += (itemPriceTotal * item.gstPercentage) / 100;
                }
                if (item.sgstPercentage > 0) {
                    totalSgst += (itemPriceTotal * item.sgstPercentage) / 100;
                }
            }
        }
    });
    return {
        cgst: totalCgst,
        sgst: totalSgst,
        total: totalCgst + totalSgst
    };
}

// Login Functions
function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    if (!username || !password) {
        alert('Please enter both username and password!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        alert('Invalid username or password!');
        return;
    }
    
    // Set current user
    currentUser = user;
    isAdmin = user.role === 'admin';
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    
    // Update UI
    updateUserDisplay();
    
    // Refresh cart display after login
    renderCart();
    
    // Close login modal
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    
    alert(`Welcome, ${user.username}! You are logged in as ${user.role === 'admin' ? 'Admin' : 'User'}.`);
}

// User Management Functions
function updateUserDisplay() {
    const userDisplay = document.getElementById('currentUserDisplay');
    const userRole = document.getElementById('currentUserRole');
    const cancelBtn = document.getElementById('cancelPreviousBillBtn');
    const menuManagementBtn = document.getElementById('menuManagementBtn');
    const salesReportBtn = document.getElementById('salesReportBtn');
    
    // Update admin section display
    if (userDisplay) {
        userDisplay.textContent = currentUser ? currentUser.username : 'Guest';
    }
    if (userRole) {
        userRole.textContent = currentUser ? currentUser.role : 'Guest';
    }
    if (cancelBtn) {
        cancelBtn.classList.toggle('hidden', !isAdmin);
    }
    
    // Hide menu management and sales report buttons for non-admin users
    if (menuManagementBtn) {
        menuManagementBtn.style.display = isAdmin ? 'block' : 'none';
    }
    if (salesReportBtn) {
        salesReportBtn.style.display = isAdmin ? 'block' : 'none';
    }
    
    // Update header user display
    const headerUserInfo = document.getElementById('userInfoDisplay');
    const headerUserName = document.getElementById('headerUserName');
    const headerUserRole = document.getElementById('headerUserRole');
    const loginBtn = document.getElementById('loginBtn');
    
    if (currentUser) {
        // Show user info in header
        if (headerUserInfo) {
            headerUserInfo.style.display = 'block';
        }
        if (headerUserName) {
            headerUserName.textContent = currentUser.username;
        }
        if (headerUserRole) {
            headerUserRole.textContent = currentUser.role === 'admin' ? 'Admin' : 'User';
        }
        // Change login button to show logout option
        if (loginBtn) {
            loginBtn.textContent = 'Logout';
        }
    } else {
        // Hide user info in header
        if (headerUserInfo) {
            headerUserInfo.style.display = 'none';
        }
        // Change logout button back to login
        if (loginBtn) {
            loginBtn.textContent = 'Login';
        }
    }
    
    loadUsersList();
}

function adminLogin() {
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    
    if (!username || !password) {
        alert('Please enter username and password!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = { id: user.id, username: user.username, role: user.role };
        isAdmin = user.role === 'admin';
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
        updateUserDisplay();
        document.getElementById('adminLoginModal').classList.add('hidden');
        document.getElementById('adminUsername').value = '';
        document.getElementById('adminPassword').value = '';
        if (isAdmin) {
            showAdmin();
        } else {
            alert('Login successful! You are logged in as a regular user.');
        }
    } else {
        alert('Invalid username or password!');
    }
}

function logout() {
    // Clear cart on logout
    cart = [];
    saveCart();
    renderCart();
    updateCartCount();
    
    currentUser = null;
    isAdmin = false;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    updateUserDisplay();
    document.getElementById('adminSection').classList.add('hidden');
    
    // Hide header cart total when logged out
    const headerCartTotalDisplay = document.getElementById('headerCartTotalDisplay');
    if (headerCartTotalDisplay) {
        headerCartTotalDisplay.style.display = 'none';
    }
    
    alert('Logged out successfully!');
}

function loadEmployeeIdsDropdown(selectElementId, selectedEmployeeId = '', excludeEmployeeId = '') {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) return;
    
    const employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
    const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    // Get list of employee IDs that are already assigned to users
    // Exclude the current employee ID if we're editing (so it still shows in the dropdown)
    const usedEmployeeIds = new Set();
    users.forEach(user => {
        if (user.employeeId && user.employeeId !== excludeEmployeeId) {
            usedEmployeeIds.add(user.employeeId);
        }
    });
    
    // Clear existing options except the first one
    selectElement.innerHTML = '<option value="">Select Employee ID (Optional)</option>';
    
    // Add admin employee ID first if it exists and is not already used (or is the selected one)
    if (restaurantInfo.adminEmployeeId && (!usedEmployeeIds.has(restaurantInfo.adminEmployeeId) || restaurantInfo.adminEmployeeId === selectedEmployeeId)) {
        const adminOption = document.createElement('option');
        adminOption.value = restaurantInfo.adminEmployeeId;
        adminOption.textContent = `${restaurantInfo.adminEmployeeId}${restaurantInfo.adminEmployeeName ? ' - ' + restaurantInfo.adminEmployeeName : ''} (Admin)`;
        if (selectedEmployeeId && restaurantInfo.adminEmployeeId === selectedEmployeeId) {
            adminOption.selected = true;
        }
        selectElement.appendChild(adminOption);
    }
    
    // Add regular employee IDs that are not already used (or is the selected one)
    employees.forEach(employee => {
        const employeeId = employee.employeeId || '';
        // Include if not used, or if it's the currently selected employee ID (for editing)
        if (employeeId && (!usedEmployeeIds.has(employeeId) || employeeId === selectedEmployeeId)) {
            const option = document.createElement('option');
            option.value = employeeId;
            option.textContent = `${employeeId}${employee.employeeName ? ' - ' + employee.employeeName : ''}`;
            if (selectedEmployeeId && employeeId === selectedEmployeeId) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        }
    });
}

function handleEmployeeIdSelection(event) {
    const selectedEmployeeId = event.target.value.trim();
    const usernameField = document.getElementById('newUsername');
    const cashierCodeField = document.getElementById('newCashierCode');
    const roleField = document.getElementById('userRole');
    
    if (selectedEmployeeId) {
        // Set username based on role - admin should be "admin", others use employee ID
        if (usernameField) {
            const role = roleField ? roleField.value : 'user';
            if (role === 'admin') {
                usernameField.value = 'admin';
            } else {
                usernameField.value = selectedEmployeeId;
            }
        }
        // Set cashier code to "CH" + Employee ID
        if (cashierCodeField) {
            cashierCodeField.value = 'CH' + selectedEmployeeId;
        }
    } else {
        // Clear fields if no employee is selected
        if (usernameField) {
            usernameField.value = '';
        }
        if (cashierCodeField) {
            cashierCodeField.value = '';
        }
    }
}

function handleEditEmployeeIdSelection(event) {
    const selectedEmployeeId = event.target.value.trim();
    const usernameField = document.getElementById('editUsername');
    const cashierCodeField = document.getElementById('editCashierCode');
    const roleField = document.getElementById('editUserRole');
    
    if (selectedEmployeeId) {
        // For admin users, username should remain "admin", for others update to employee ID
        // Note: Username is readonly in edit mode, but we ensure it's correct
        if (usernameField && roleField) {
            const role = roleField.value;
            if (role === 'admin') {
                usernameField.value = 'admin';
            } else {
                // Username is readonly, so we don't change it here
                // It should already be set to the employee ID
            }
        }
        // Set cashier code to "CH" + Employee ID
        if (cashierCodeField) {
            cashierCodeField.value = 'CH' + selectedEmployeeId;
        }
    } else {
        // Clear cashier code if no employee is selected
        if (cashierCodeField) {
            cashierCodeField.value = '';
        }
    }
}

function addUser() {
    if (!isAdmin) {
        alert('Only admins can add users!');
        return;
    }
    
    let username = document.getElementById('newUsername').value.trim();
    const cashierCode = document.getElementById('newCashierCode').value.trim();
    const employeeId = document.getElementById('newUserEmployeeId').value.trim();
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('userRole').value;
    
    if (!employeeId) {
        alert('Please select an Employee ID!');
        return;
    }
    
    // For admin users, always set username to "admin"
    if (role === 'admin') {
        username = 'admin';
    }
    
    if (!username || !password) {
        alert('Please select an Employee ID to auto-generate username and cashier code!');
        return;
    }
    
    if (!cashierCode) {
        alert('Cashier code is mandatory! Please select an Employee ID.');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    // Check if username already exists (but allow admin username if updating existing admin)
    const existingUser = users.find(u => u.username === username);
    if (existingUser && !(role === 'admin' && username === 'admin' && existingUser.role === 'admin')) {
        alert('Username already exists!');
        return;
    }
    
    // If admin user already exists, update it instead of creating new one
    if (role === 'admin' && username === 'admin') {
        const adminUser = users.find(u => u.role === 'admin');
        if (adminUser) {
            adminUser.cashierCode = cashierCode;
            adminUser.employeeId = employeeId || null;
            if (password) {
                adminUser.password = password;
            }
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
            document.getElementById('newUsername').value = '';
            document.getElementById('newCashierCode').value = '';
            document.getElementById('newUserEmployeeId').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('userRole').value = 'user';
            loadUsersList();
            alert('Admin user updated successfully!');
            return;
        }
    }
    
    // If creating new admin user, ensure password is "admin123" if not provided
    let finalPassword = password;
    if (role === 'admin' && username === 'admin' && !password) {
        finalPassword = 'admin123';
    }
    
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    users.push({
        id: newId,
        username: username,
        cashierCode: cashierCode,
        employeeId: employeeId || null,
        password: finalPassword,
        role: role
    });
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    document.getElementById('newUsername').value = '';
    document.getElementById('newCashierCode').value = '';
    document.getElementById('newUserEmployeeId').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('userRole').value = 'user';
    
    loadUsersList();
    alert('User added successfully!');
}

function loadUsersList() {
    const usersListContent = document.getElementById('usersListContent');
    if (!usersListContent) return;
    
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    if (users.length === 0) {
        usersListContent.innerHTML = '<p>No users found.</p>';
        return;
    }
    
    usersListContent.innerHTML = users.map(user => `
        <div style="padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>${user.username}</strong> (${user.role})
            </div>
            ${isAdmin ? `
                <div style="display: flex; gap: 5px;">
                    <button class="btn btn-edit" onclick="editUser(${user.id})" style="padding: 5px 10px; font-size: 12px;">Edit</button>
                    <button class="btn btn-delete" onclick="deleteUser(${user.id})" style="padding: 5px 10px; font-size: 12px;">Delete</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

let editingUserId = null;

function editUser(userId) {
    if (!isAdmin) {
        alert('Only admins can edit users!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found!');
        return;
    }
    
    editingUserId = userId;
    // For admin users, always show "admin" as username
    const displayUsername = user.role === 'admin' ? 'admin' : user.username;
    document.getElementById('editUsername').value = displayUsername;
    document.getElementById('editCashierCode').value = user.cashierCode || '';
    document.getElementById('editUserRole').value = user.role;
    document.getElementById('currentPassword').value = user.password || '';
    document.getElementById('editUserPassword').value = '';
    document.getElementById('confirmEditPassword').value = '';
    
    // Load and set employee ID dropdown (exclude current user's employee ID so it still shows)
    loadEmployeeIdsDropdown('editUserEmployeeId', user.employeeId || '', user.employeeId || '');
    
    // If employee ID exists, update cashier code to "CH" + Employee ID
    if (user.employeeId) {
        const cashierCodeField = document.getElementById('editCashierCode');
        if (cashierCodeField) {
            cashierCodeField.value = 'CH' + user.employeeId;
        }
    }
    
    document.getElementById('editUserModal').classList.remove('hidden');
}

function saveUserChanges() {
    if (!isAdmin) {
        alert('Only admins can edit users!');
        return;
    }
    
    if (!editingUserId) {
        alert('No user selected for editing!');
        return;
    }
    
    let username = document.getElementById('editUsername').value.trim();
    const cashierCode = document.getElementById('editCashierCode').value.trim();
    const employeeId = document.getElementById('editUserEmployeeId').value.trim();
    const role = document.getElementById('editUserRole').value;
    const newPassword = document.getElementById('editUserPassword').value;
    const confirmPassword = document.getElementById('confirmEditPassword').value;
    
    if (!employeeId) {
        alert('Please select an Employee ID!');
        return;
    }
    
    // For admin users, always set username to "admin"
    if (role === 'admin') {
        username = 'admin';
    }
    
    if (!username) {
        alert('Username is required! Please select an Employee ID.');
        return;
    }
    
    if (!cashierCode) {
        alert('Cashier code is mandatory! Please select an Employee ID.');
        return;
    }
    
    // If password is provided, validate it
    if (newPassword) {
        if (newPassword.length < 3) {
            alert('Password must be at least 3 characters long!');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
    }
    
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const userIndex = users.findIndex(u => u.id === editingUserId);
    
    if (userIndex === -1) {
        alert('User not found!');
        return;
    }
    
    // Check if username is already taken by another user (but allow admin username for admin users)
    const existingUser = users.find(u => u.username === username && u.id !== editingUserId);
    if (existingUser && !(role === 'admin' && username === 'admin')) {
        alert('Username already exists!');
        return;
    }
    
    // Update user
    users[userIndex].username = username;
    users[userIndex].cashierCode = cashierCode;
    users[userIndex].employeeId = employeeId || null;
    users[userIndex].role = role;
    if (newPassword) {
        users[userIndex].password = newPassword;
    }
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // If current user was edited, update current user data
    if (currentUser && currentUser.id === editingUserId) {
        currentUser.username = username;
        currentUser.role = role;
        isAdmin = role === 'admin';
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
        updateUserDisplay();
    }
    
    loadUsersList();
    closeEditUserModal();
    alert('User updated successfully!');
}

function togglePassword(inputId, buttonId) {
    const passwordInput = document.getElementById(inputId);
    const toggleBtn = document.getElementById(buttonId);
    
    if (passwordInput && toggleBtn) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleBtn.textContent = '👁️';
        }
    }
}

function toggleHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    
    if (hamburgerBtn && hamburgerMenu) {
        const isHidden = hamburgerMenu.classList.contains('hidden');
        if (isHidden) {
            hamburgerMenu.classList.remove('hidden');
            hamburgerBtn.classList.add('active');
        } else {
            hamburgerMenu.classList.add('hidden');
            hamburgerBtn.classList.remove('active');
        }
    }
}

function closeHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    
    if (hamburgerBtn && hamburgerMenu) {
        hamburgerMenu.classList.add('hidden');
        hamburgerBtn.classList.remove('active');
    }
}

function resetUserPassword() {
    if (!isAdmin) {
        alert('Only admins can reset passwords!');
        return;
    }
    
    if (!editingUserId) {
        alert('No user selected!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.id === editingUserId);
    
    if (!user) {
        alert('User not found!');
        return;
    }
    
    // For admin users, always reset to "admin123", for others use username + "123"
    const defaultPassword = user.role === 'admin' && user.username === 'admin' ? 'admin123' : user.username + '123';
    
    if (confirm(`Reset password for ${user.username} to "${defaultPassword}"?`)) {
        const userIndex = users.findIndex(u => u.id === editingUserId);
        users[userIndex].password = defaultPassword;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        
        // Update password fields in modal
        document.getElementById('editUserPassword').value = defaultPassword;
        document.getElementById('confirmEditPassword').value = defaultPassword;
        
        alert(`Password reset successfully! New password: ${defaultPassword}`);
    }
}

function closeEditUserModal() {
    editingUserId = null;
    document.getElementById('editUserModal').classList.add('hidden');
    document.getElementById('editUsername').value = '';
    document.getElementById('editCashierCode').value = '';
    document.getElementById('editUserRole').value = 'user';
    document.getElementById('currentPassword').value = '';
    document.getElementById('editUserPassword').value = '';
    document.getElementById('confirmEditPassword').value = '';
    // Reset password field types
    const currentPasswordField = document.getElementById('currentPassword');
    if (currentPasswordField) {
        currentPasswordField.type = 'password';
    }
    const toggleCurrentPasswordBtn = document.getElementById('toggleCurrentPassword');
    if (toggleCurrentPasswordBtn) {
        toggleCurrentPasswordBtn.textContent = '👁️';
    }
}

function deleteUser(userId) {
    if (!isAdmin) {
        alert('Only admins can delete users!');
        return;
    }
    
    if (confirm('Are you sure you want to delete this user?')) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const filteredUsers = users.filter(u => u.id !== userId);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredUsers));
        loadUsersList();
        alert('User deleted successfully!');
    }
}

function cancelBill() {
    if (!isAdmin) {
        alert('Only admins can cancel bills!');
        return;
    }
    
    if (!currentPreviewOrder) {
        alert('No bill selected to cancel!');
        return;
    }
    
    if (confirm(`Are you sure you want to cancel Order #${currentPreviewOrder.id}? This action cannot be undone.`)) {
        // Add cancellation timestamp
        const cancelledOrder = {
            ...currentPreviewOrder,
            cancelledDate: new Date().toISOString(),
            cancelledBy: currentUser ? currentUser.username : 'Admin'
        };
        
        // Save to cancelled orders
        const cancelledOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.CANCELLED_ORDERS) || '[]');
        cancelledOrders.push(cancelledOrder);
        localStorage.setItem(STORAGE_KEYS.CANCELLED_ORDERS, JSON.stringify(cancelledOrders));
        
        // Remove from active orders
        const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
        const filteredOrders = orders.filter(o => o.id !== currentPreviewOrder.id);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(filteredOrders));
        
        // Close modal
        document.getElementById('previousBillModal').classList.add('hidden');
        currentPreviewOrder = null;
        
        // Reload previous bills
        loadPreviousBills();
        
        // Reload cancelled bills in sales report
        loadCancelledBills();
        
        alert('Bill cancelled successfully!');
    }
}

// Cancel Bill Functions
function showCancelBillSection() {
    if (!isAdmin) {
        alert('Only admins can access Cancel Bill section!');
        document.getElementById('adminLoginModal').classList.remove('hidden');
        return;
    }
    
    document.getElementById('cancelBillSection').classList.remove('hidden');
    
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('cancelBillStartDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('cancelBillEndDate').value = endDate.toISOString().split('T')[0];
    
    // Clear previous results
    document.getElementById('cancelBillResults').innerHTML = '';
    document.getElementById('cancelBillTransactionDetails').classList.add('hidden');
    document.getElementById('cancelBillOrderSearch').value = '';
    
    // Load transaction history
    loadCancelBillTransactionHistory();
}

function searchCancelBillByNumber() {
    const orderNumber = document.getElementById('cancelBillOrderSearch').value.trim();
    
    if (!orderNumber) {
        alert('Please enter an order number!');
        return;
    }
    
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    const cancelledOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.CANCELLED_ORDERS) || '[]');
    
    // Search in both active and cancelled orders
    let order = orders.find(o => String(o.id) === orderNumber);
    let isCancelled = false;
    
    if (!order) {
        order = cancelledOrders.find(o => String(o.id) === orderNumber);
        isCancelled = true;
    }
    
    if (!order) {
        document.getElementById('cancelBillResults').innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Order not found.</p>';
        document.getElementById('cancelBillTransactionDetails').classList.add('hidden');
        return;
    }
    
    // Mark order as cancelled if found in cancelled orders
    const orderWithStatus = { ...order, isCancelled: isCancelled };
    displayCancelBillResult([orderWithStatus]);
    showCancelBillTransactionDetails(orderWithStatus);
}

function searchCancelBillByDate() {
    const startDate = document.getElementById('cancelBillStartDate').value;
    const endDate = document.getElementById('cancelBillEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates!');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('Start date must be before end date!');
        return;
    }
    
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    const cancelledOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.CANCELLED_ORDERS) || '[]');
    
    // Filter orders by date range (check original date for both active and cancelled)
    const filteredActiveOrders = orders.filter(order => {
        try {
            const orderDate = new Date(order.date);
            const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
            const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
            
            const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
            const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
            
            return orderDate >= start && orderDate <= end;
        } catch (error) {
            console.error('Error filtering order:', error, order);
            return false;
        }
    }).map(o => ({ ...o, isCancelled: false }));
    
    const filteredCancelledOrders = cancelledOrders.filter(order => {
        try {
            const orderDate = new Date(order.date);
            const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
            const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
            
            const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
            const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
            
            return orderDate >= start && orderDate <= end;
        } catch (error) {
            console.error('Error filtering cancelled order:', error, order);
            return false;
        }
    }).map(o => ({ ...o, isCancelled: true }));
    
    const filteredOrders = [...filteredActiveOrders, ...filteredCancelledOrders];
    
    if (filteredOrders.length === 0) {
        document.getElementById('cancelBillResults').innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No orders found for the selected date range.</p>';
        document.getElementById('cancelBillTransactionDetails').classList.add('hidden');
        return;
    }
    
    displayCancelBillResult(filteredOrders);
    document.getElementById('cancelBillTransactionDetails').classList.add('hidden');
}

function displayCancelBillResult(orders) {
    const resultsDiv = document.getElementById('cancelBillResults');
    resultsDiv.innerHTML = '';
    
    // Sort by date (newest first)
    const sortedOrders = orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '20px';
    table.innerHTML = `
        <thead>
            <tr style="background-color: #f0f0f0;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Order #</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Date</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Payment</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Actions</th>
            </tr>
        </thead>
        <tbody>
            ${sortedOrders.map(order => {
                const orderDate = new Date(order.date).toLocaleString();
                const paymentMethod = order.paymentMethod || 'N/A';
                const paymentMethodLabel = paymentMethod === 'gpay' ? 'GPay' : paymentMethod === 'cash' ? 'Cash' : paymentMethod;
                return `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">${order.id}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${orderDate}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${paymentMethodLabel}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${order.total.toFixed(2)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
                            <button class="btn btn-primary" onclick="viewCancelBillDetails(${order.id})" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">View</button>
                            <button class="btn btn-danger" onclick="cancelBillFromList(${order.id})" style="padding: 5px 10px; font-size: 12px;">Cancel</button>
                        </td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;
    
    resultsDiv.appendChild(table);
}

function viewCancelBillDetails(orderId) {
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    const cancelledOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.CANCELLED_ORDERS) || '[]');
    
    // Search in both active and cancelled orders
    let order = orders.find(o => o.id === orderId);
    let isCancelled = false;
    
    if (!order) {
        order = cancelledOrders.find(o => o.id === orderId);
        isCancelled = true;
    }
    
    if (order) {
        const orderWithStatus = { ...order, isCancelled: isCancelled };
        showCancelBillTransactionDetails(orderWithStatus);
    }
}

function showCancelBillTransactionDetails(order) {
    const detailsDiv = document.getElementById('cancelBillTransactionContent');
    const detailsSection = document.getElementById('cancelBillTransactionDetails');
    
    if (!detailsDiv || !detailsSection) return;
    
    const orderDate = new Date(order.date).toLocaleString();
    const isCancelled = order.isCancelled || false;
    const cancelledDate = isCancelled && order.cancelledDate ? new Date(order.cancelledDate).toLocaleString() : null;
    const cancelledBy = isCancelled ? (order.cancelledBy || 'Admin') : null;
    const paymentMethod = order.paymentMethod || 'N/A';
    const paymentMethodLabel = paymentMethod === 'gpay' ? 'GPay' : paymentMethod === 'cash' ? 'Cash' : paymentMethod;
    
    let itemsHtml = '';
    order.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        itemsHtml += `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                <div>
                    <strong>${item.name}</strong>
                    <div style="font-size: 12px; color: #666;">₹${item.price.toFixed(2)} × ${item.quantity}</div>
                </div>
                <div style="font-weight: bold;">₹${itemTotal.toFixed(2)}</div>
            </div>
        `;
    });
    
    detailsDiv.innerHTML = `
        <div style="padding: 20px; background: ${isCancelled ? '#ffebee' : '#f9f9f9'}; border-radius: 5px; border: 2px solid ${isCancelled ? '#ef5350' : '#ddd'};">
            <div style="margin-bottom: 15px;">
                <p><strong>Order #:</strong> ${order.id}${isCancelled ? ' <span style="color: #d32f2f; font-weight: bold;">(Cancelled)</span>' : ''}</p>
                <p><strong>Date:</strong> ${orderDate}</p>
                ${isCancelled && cancelledDate ? `<p><strong>Cancelled Date:</strong> ${cancelledDate}</p>` : ''}
                ${isCancelled && cancelledBy ? `<p><strong>Cancelled By:</strong> ${cancelledBy}</p>` : ''}
                <p><strong>Payment Method:</strong> ${paymentMethodLabel}</p>
                <p><strong>Status:</strong> <span style="color: ${isCancelled ? '#d32f2f' : '#4CAF50'}; font-weight: bold;">${isCancelled ? 'Cancelled' : 'Active'}</span></p>
            </div>
            <div style="margin: 15px 0;">
                <h4>Items:</h4>
                ${itemsHtml}
            </div>
            <div style="border-top: 2px solid #333; padding-top: 15px; margin-top: 15px;">
                <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                    <span>Total Amount:</span>
                    <span style="color: ${isCancelled ? '#d32f2f' : '#333'};">₹${order.total.toFixed(2)}</span>
                </div>
            </div>
            ${!isCancelled ? `
                <div style="margin-top: 20px; text-align: center;">
                    <button class="btn btn-danger" onclick="cancelBillFromList(${order.id})">Cancel This Bill</button>
                </div>
            ` : ''}
        </div>
    `;
    
    detailsSection.classList.remove('hidden');
}

function cancelBillFromList(orderId) {
    if (!isAdmin) {
        alert('Only admins can cancel bills!');
        return;
    }
    
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Order not found!');
        return;
    }
    
    if (confirm(`Are you sure you want to cancel Order #${order.id}? This action cannot be undone.`)) {
        // Add cancellation timestamp
        const cancelledOrder = {
            ...order,
            cancelledDate: new Date().toISOString(),
            cancelledBy: currentUser ? currentUser.username : 'Admin'
        };
        
        // Save to cancelled orders
        const cancelledOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.CANCELLED_ORDERS) || '[]');
        cancelledOrders.push(cancelledOrder);
        localStorage.setItem(STORAGE_KEYS.CANCELLED_ORDERS, JSON.stringify(cancelledOrders));
        
        // Remove from active orders
        const filteredOrders = orders.filter(o => o.id !== orderId);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(filteredOrders));
        
        // Refresh the display
        const orderSearch = document.getElementById('cancelBillOrderSearch').value.trim();
        if (orderSearch) {
            searchCancelBillByNumber();
        } else {
            searchCancelBillByDate();
        }
        
        // Also reload previous bills if on that tab
        loadPreviousBills();
        
        // Reload transaction history
        loadCancelBillTransactionHistory();
        
        // Reload cancelled bills in sales report
        loadCancelledBills();
        
        alert('Bill cancelled successfully!');
    }
}

function loadCancelBillTransactionHistory() {
    const historyContent = document.getElementById('cancelBillTransactionHistoryContent');
    if (!historyContent) return;
    
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    const cancelledOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.CANCELLED_ORDERS) || '[]');
    
    // Combine active and cancelled orders, mark cancelled ones
    const allOrders = [
        ...orders.map(o => ({ ...o, isCancelled: false })),
        ...cancelledOrders.map(o => ({ ...o, isCancelled: true }))
    ];
    
    if (allOrders.length === 0) {
        historyContent.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No transaction history found.</p>';
        return;
    }
    
    // Sort by date (newest first)
    const sortedOrders = allOrders.sort((a, b) => {
        const dateA = a.isCancelled && a.cancelledDate ? new Date(a.cancelledDate) : new Date(a.date);
        const dateB = b.isCancelled && b.cancelledDate ? new Date(b.cancelledDate) : new Date(b.date);
        return dateB - dateA;
    });
    
    historyContent.innerHTML = '';
    
    sortedOrders.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'transaction-item';
        
        if (order.isCancelled) {
            // Styling for cancelled transactions
            orderDiv.style.cssText = 'padding: 15px; margin-bottom: 10px; background: #ffebee; border: 1px solid #ef5350; border-radius: 5px; cursor: pointer; transition: all 0.3s ease;';
            orderDiv.onmouseover = function() {
                this.style.background = '#ffcdd2';
                this.style.borderColor = '#e53935';
            };
            orderDiv.onmouseout = function() {
                this.style.background = '#ffebee';
                this.style.borderColor = '#ef5350';
            };
        } else {
            // Styling for active transactions
            orderDiv.style.cssText = 'padding: 15px; margin-bottom: 10px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 5px; cursor: pointer; transition: all 0.3s ease;';
            orderDiv.onmouseover = function() {
                this.style.background = '#e8f5e9';
                this.style.borderColor = '#4CAF50';
            };
            orderDiv.onmouseout = function() {
                this.style.background = '#f9f9f9';
                this.style.borderColor = '#ddd';
            };
        }
        
        orderDiv.onclick = () => {
            viewCancelBillDetails(order.id);
        };
        
        const orderDate = new Date(order.date).toLocaleString();
        const cancelledDate = order.isCancelled && order.cancelledDate ? new Date(order.cancelledDate).toLocaleString() : null;
        const cancelledBy = order.isCancelled ? (order.cancelledBy || 'Admin') : null;
        const paymentMethod = order.paymentMethod || 'N/A';
        const paymentMethodLabel = paymentMethod === 'gpay' ? 'GPay' : paymentMethod === 'cash' ? 'Cash' : paymentMethod;
        
        orderDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div>
                    <strong style="font-size: 16px; color: ${order.isCancelled ? '#c62828' : '#333'};">
                        Order #${order.id}${order.isCancelled ? ' (Cancelled)' : ''}
                    </strong>
                    <div style="font-size: 12px; color: #666; margin-top: 3px;">${orderDate}</div>
                    ${order.isCancelled && cancelledDate ? `
                        <div style="font-size: 11px; color: #d32f2f; margin-top: 3px;">
                            Cancelled: ${cancelledDate}${cancelledBy ? ` by ${cancelledBy}` : ''}
                        </div>
                    ` : ''}
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 18px; font-weight: bold; color: ${order.isCancelled ? '#d32f2f' : '#4CAF50'};">
                        ₹${order.total.toFixed(2)}
                    </div>
                    <div style="font-size: 12px; color: #666; margin-top: 3px;">${paymentMethodLabel}</div>
                </div>
            </div>
            <div style="font-size: 13px; color: #666; border-top: 1px solid ${order.isCancelled ? '#ffcdd2' : '#eee'}; padding-top: 8px; margin-top: 8px;">
                ${order.items.length} item(s): ${order.items.map(item => `${item.name} (${item.quantity}x)`).join(', ')}
            </div>
        `;
        
        historyContent.appendChild(orderDiv);
    });
}

// Admin Functions
function showAdmin() {
    if (!isAdmin) {
        document.getElementById('adminLoginModal').classList.remove('hidden');
        return;
    }
    document.getElementById('adminSection').classList.remove('hidden');
    loadRestaurantInfo();
    loadUsersList();
    // Load employee IDs dropdown
    loadEmployeeIdsDropdown('newUserEmployeeId');
}

function loadRestaurantInfo() {
    const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    
    // Update form fields
    if (document.getElementById('restaurantName')) {
        document.getElementById('restaurantName').value = restaurantInfo.name || '';
    }
    if (document.getElementById('restaurantAddress')) {
        document.getElementById('restaurantAddress').value = restaurantInfo.address || '';
    }
    if (document.getElementById('startingBillNumber')) {
        document.getElementById('startingBillNumber').value = restaurantInfo.startingBillNumber || '';
        const isLocked = restaurantInfo.startingBillNumberLocked !== undefined ? restaurantInfo.startingBillNumberLocked : true;
        document.getElementById('startingBillNumber').readOnly = isLocked;
        updateStartingBillNumberLockButtonState(isLocked);
    }
    if (document.getElementById('restaurantGstin')) {
        document.getElementById('restaurantGstin').value = restaurantInfo.gstin || '';
    }
    if (document.getElementById('restaurantFssai')) {
        document.getElementById('restaurantFssai').value = restaurantInfo.fssai || '';
    }
    if (document.getElementById('showGstinInBill')) {
        document.getElementById('showGstinInBill').checked = restaurantInfo.showGstinInBill !== false; // Default to true
    }
    if (document.getElementById('showFssaiInBill')) {
        document.getElementById('showFssaiInBill').checked = restaurantInfo.showFssaiInBill !== false; // Default to true
    }
    
    // Load QR code if exists
    if (restaurantInfo.qrCode) {
        qrCodeBase64 = restaurantInfo.qrCode;
        qrCodeRemoved = false;
        if (document.getElementById('qrCodePreviewImage')) {
            document.getElementById('qrCodePreviewImage').src = qrCodeBase64;
            document.getElementById('qrCodePreview').classList.remove('hidden');
        }
    } else {
        qrCodeBase64 = null;
        qrCodeRemoved = false;
    }
    
    // Update header title
    const restaurantTitle = document.getElementById('restaurantTitle');
    if (restaurantInfo.name) {
        restaurantTitle.textContent = `${restaurantInfo.name}`;
    } else {
        restaurantTitle.textContent = 'Restaurant Menu';
    }
    
    // Update QR code in modal if it exists
    updateQRCodeInModal();
}

function handleQRCodeSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please select an image file!');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        qrCodeBase64 = e.target.result;
        qrCodeRemoved = false;
        document.getElementById('qrCodePreviewImage').src = qrCodeBase64;
        document.getElementById('qrCodePreview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function removeQRCodePreview() {
    qrCodeBase64 = null;
    qrCodeRemoved = true;
    document.getElementById('qrCodeFile').value = '';
    document.getElementById('qrCodePreviewImage').src = '';
    document.getElementById('qrCodePreview').classList.add('hidden');
}

function updateQRCodeInModal() {
    const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    const qrCodeImage = document.getElementById('qrCodeImage');
    if (qrCodeImage && restaurantInfo.qrCode) {
        qrCodeImage.src = restaurantInfo.qrCode;
    } else if (qrCodeImage) {
        qrCodeImage.src = 'images/qr-placeholder.png';
    }
}

function saveRestaurantInfo() {
    const name = document.getElementById('restaurantName').value.trim();
    const address = document.getElementById('restaurantAddress').value.trim();
    const startingBillNumber = document.getElementById('startingBillNumber').value.trim();
    const gstin = document.getElementById('restaurantGstin').value.trim().toUpperCase();
    const fssai = document.getElementById('restaurantFssai').value.trim();
    const showGstinInBill = document.getElementById('showGstinInBill').checked;
    const showFssaiInBill = document.getElementById('showFssaiInBill').checked;
    const adminEmployeeId = document.getElementById('adminEmployeeId') ? document.getElementById('adminEmployeeId').value.trim() : '';
    
    // Get existing restaurant info to preserve lock state
    const existingInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    
    const restaurantInfo = {
        name: name,
        address: address,
        startingBillNumber: startingBillNumber ? parseInt(startingBillNumber) : null,
        startingBillNumberLocked: existingInfo.startingBillNumberLocked !== undefined ? existingInfo.startingBillNumberLocked : true,
        gstin: gstin,
        fssai: fssai,
        showGstinInBill: showGstinInBill,
        showFssaiInBill: showFssaiInBill,
        adminEmployeeId: adminEmployeeId
    };
    
    // Save QR code if uploaded
    if (qrCodeBase64) {
        restaurantInfo.qrCode = qrCodeBase64;
    } else if (qrCodeRemoved) {
        // QR code was explicitly removed, don't save it
        restaurantInfo.qrCode = null;
    } else {
        // Keep existing QR code if not removed and no new one uploaded
        const existingInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
        if (existingInfo.qrCode) {
            restaurantInfo.qrCode = existingInfo.qrCode;
        }
    }
    
    localStorage.setItem(STORAGE_KEYS.RESTAURANT_INFO, JSON.stringify(restaurantInfo));
    
    // Reset removal flag
    qrCodeRemoved = false;
    
    // Update header
    const restaurantTitle = document.getElementById('restaurantTitle');
    if (name) {
        restaurantTitle.textContent = `${name}`;
    } else {
        restaurantTitle.textContent = 'Restaurant Menu';
    }
    
    // Update QR code in modal
    updateQRCodeInModal();
    
    alert('Restaurant information saved successfully!');
}

// Menu Management
function showMenuManagement() {
    if (!isAdmin) {
        alert('Only admins can access Menu Management!');
        return;
    }
    document.getElementById('menuManagementSection').classList.remove('hidden');
    editingItemId = null;
    removeImagePreview();
    // Clear form
    document.getElementById('itemName').value = '';
    document.getElementById('itemBarcode').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemImageFile').value = '';
    document.getElementById('itemTax').value = 'no';
    document.getElementById('gstPercentageGroup').classList.add('hidden');
    document.getElementById('itemGstPercentage').value = '';
    renderManagementMenu();
    renderStockItems();
}

// Switch management tabs
function switchManagementTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.management-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.management-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to selected tab and content
    document.querySelector(`.management-tab[data-tab="${tabName}"]`).classList.add('active');
    if (tabName === 'add-item') {
        document.getElementById('addItemTab').classList.add('active');
    } else if (tabName === 'stock') {
        document.getElementById('stockTab').classList.add('active');
        renderStockItems();
    }
}

// Render stock items
function renderStockItems() {
    const stockList = document.getElementById('stockItemsList');
    if (!stockList) return;
    
    stockList.innerHTML = '';
    
    // Filter items that are stock items
    let stockItems = menuItems.filter(item => item.isStockItem);
    
    // Apply search filter if search query exists
    const searchInput = document.getElementById('stockSearchInput');
    const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    if (searchQuery) {
        stockItems = stockItems.filter(item => {
            const itemName = (item.name || '').toLowerCase();
            const itemCode = (item.itemCode || '').toLowerCase();
            const barcode = (item.barcode || '').toLowerCase();
            
            return itemName.includes(searchQuery) || 
                   itemCode.includes(searchQuery) || 
                   barcode.includes(searchQuery);
        });
    }
    
    // Apply color/status filter
    const colorFilter = document.getElementById('stockColorFilter');
    const filterValue = colorFilter ? colorFilter.value : 'all';
    
    if (filterValue !== 'all') {
        stockItems = stockItems.filter(item => {
            const currentStock = item.stockValue || 0;
            const minStock = item.minStock || 0;
            const isZeroStock = currentStock === 0;
            const isBelowMinStock = currentStock > 0 && currentStock < minStock;
            const isAtMinStock = currentStock === minStock && minStock > 0;
            
            switch (filterValue) {
                case 'red':
                    return isBelowMinStock;
                case 'yellow':
                    return isZeroStock || isAtMinStock;
                case 'normal':
                    return !isBelowMinStock && !isZeroStock && !isAtMinStock;
                default:
                    return true;
            }
        });
    }
    
    // Show/hide clear search button
    const clearStockSearchBtn = document.getElementById('clearStockSearchBtn');
    if (clearStockSearchBtn) {
        clearStockSearchBtn.style.display = searchQuery ? 'block' : 'none';
    }
    
    if (stockItems.length === 0) {
        if (searchQuery) {
            stockList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No stock items found matching your search.</p>';
        } else {
            stockList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No stock items found. Mark items as "Stock Item: YES" in the Add Item tab.</p>';
        }
        return;
    }
    
    stockItems.forEach(item => {
        const stockCard = document.createElement('div');
        stockCard.className = 'stock-item-card';
        
        const currentStock = item.stockValue || 0;
        const minStock = item.minStock || 0;
        const isZeroStock = currentStock === 0;
        const isBelowMinStock = currentStock > 0 && currentStock < minStock;
        const isAtMinStock = currentStock === minStock && minStock > 0;
        
        // Add red highlight class if stock is less than minimum (but not zero)
        if (isBelowMinStock) {
            stockCard.classList.add('stock-danger');
        }
        // Add yellow highlight class if stock is zero or exactly at minimum
        else if (isZeroStock || isAtMinStock) {
            stockCard.classList.add('stock-warning');
        }
        
        stockCard.innerHTML = `
            <div class="stock-item-info">
                <h4>${item.name}</h4>
                <div class="stock-item-details">
                    <span>
                        <strong>Item Code:</strong>
                        ${item.itemCode || 'N/A'}
                    </span>
                    <span>
                        <strong>Current Stock:</strong>
                        <span class="${isBelowMinStock ? 'stock-danger-text' : (isZeroStock || isAtMinStock ? 'stock-low' : '')}">${currentStock}</span>
                    </span>
                    <span>
                        <strong>Barcode:</strong>
                        ${item.barcode || 'N/A'}
                    </span>
                </div>
            </div>
            <div class="stock-actions">
                <div class="stock-update-group">
                    <label>Current Stock:</label>
                    <input type="number" id="stockUpdate_${item.id}" value="${currentStock}" min="0" step="1" placeholder="Stock">
                    <button class="btn btn-primary" onclick="updateStock(${item.id})">Update Stock</button>
                </div>
                <div class="stock-update-group">
                    <label>Minimum Stock:</label>
                    <input type="number" id="minStockUpdate_${item.id}" value="${minStock}" min="0" step="1" placeholder="Min Stock">
                    <button class="btn btn-primary" onclick="updateMinStock(${item.id})">Update Min</button>
                </div>
            </div>
        `;
        
        stockList.appendChild(stockCard);
    });
}

// Update stock for an item
function updateStock(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    const stockInput = document.getElementById(`stockUpdate_${itemId}`);
    const newStock = parseFloat(stockInput.value);
    
    if (isNaN(newStock) || newStock < 0) {
        alert('Please enter a valid stock value (0 or greater)!');
        return;
    }
    
    item.stockValue = newStock;
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(menuItems));
    
    // Re-render stock list
    renderStockItems();
    renderManagementMenu();
    renderMenu();
    
    alert(`Stock updated successfully for ${item.name}!`);
}

// Update minimum stock for an item
function updateMinStock(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    const minStockInput = document.getElementById(`minStockUpdate_${itemId}`);
    const newMinStock = parseFloat(minStockInput.value);
    
    if (isNaN(newMinStock) || newMinStock < 0) {
        alert('Please enter a valid minimum stock value (0 or greater)!');
        return;
    }
    
    item.minStock = newMinStock;
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(menuItems));
    
    // Re-render stock list
    renderStockItems();
    renderManagementMenu();
    renderMenu();
    
    alert(`Minimum stock updated successfully for ${item.name}!`);
}

// Handle stock search
function handleStockSearch() {
    renderStockItems();
}

// Clear stock search
function clearStockSearch() {
    const searchInput = document.getElementById('stockSearchInput');
    if (searchInput) {
        searchInput.value = '';
        renderStockItems();
    }
}

// Get filtered stock items (same logic as renderStockItems)
function getFilteredStockItems() {
    // Filter items that are stock items
    let stockItems = menuItems.filter(item => item.isStockItem);
    
    // Apply search filter if search query exists
    const searchInput = document.getElementById('stockSearchInput');
    const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    if (searchQuery) {
        stockItems = stockItems.filter(item => {
            const itemName = (item.name || '').toLowerCase();
            const itemCode = (item.itemCode || '').toLowerCase();
            const barcode = (item.barcode || '').toLowerCase();
            
            return itemName.includes(searchQuery) || 
                   itemCode.includes(searchQuery) || 
                   barcode.includes(searchQuery);
        });
    }
    
    // Apply color/status filter
    const colorFilter = document.getElementById('stockColorFilter');
    const filterValue = colorFilter ? colorFilter.value : 'all';
    
    if (filterValue !== 'all') {
        stockItems = stockItems.filter(item => {
            const currentStock = item.stockValue || 0;
            const minStock = item.minStock || 0;
            const isZeroStock = currentStock === 0;
            const isBelowMinStock = currentStock > 0 && currentStock < minStock;
            const isAtMinStock = currentStock === minStock && minStock > 0;
            
            switch (filterValue) {
                case 'red':
                    return isBelowMinStock;
                case 'yellow':
                    return isZeroStock || isAtMinStock;
                case 'normal':
                    return !isBelowMinStock && !isZeroStock && !isAtMinStock;
                default:
                    return true;
            }
        });
    }
    
    return stockItems;
}

// Export stock to Excel
function exportStockToExcel() {
    const stockItems = getFilteredStockItems();
    
    if (stockItems.length === 0) {
        alert('No stock items to export. Please adjust your filters.');
        return;
    }
    
    if (typeof XLSX === 'undefined') {
        alert('Excel export requires SheetJS library. Please ensure the library is loaded.');
        return;
    }
    
    try {
        const colorFilter = document.getElementById('stockColorFilter');
        const filterValue = colorFilter ? colorFilter.value : 'all';
        const filterLabel = filterValue === 'all' ? 'All Items' : 
                           filterValue === 'red' ? 'Red (Below Minimum)' :
                           filterValue === 'yellow' ? 'Yellow (Zero/At Minimum)' : 'Normal (Above Minimum)';
        
        // Create worksheet data
        const worksheetData = [
            ['Item Code', 'Item Name', 'Barcode', 'Current Stock', 'Minimum Stock', 'Status'] // Header row
        ];
        
        // Add data rows
        stockItems.forEach(item => {
            const currentStock = item.stockValue || 0;
            const minStock = item.minStock || 0;
            const isZeroStock = currentStock === 0;
            const isBelowMinStock = currentStock > 0 && currentStock < minStock;
            const isAtMinStock = currentStock === minStock && minStock > 0;
            
            let status = 'Normal';
            if (isBelowMinStock) {
                status = 'Below Minimum';
            } else if (isZeroStock) {
                status = 'Zero Stock';
            } else if (isAtMinStock) {
                status = 'At Minimum';
            }
            
            worksheetData.push([
                item.itemCode || '',
                item.name || '',
                item.barcode || '',
                currentStock,
                minStock,
                status
            ]);
        });
        
        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // Set column widths
        worksheet['!cols'] = [
            { wch: 12 }, // Item Code
            { wch: 30 }, // Item Name
            { wch: 15 }, // Barcode
            { wch: 15 }, // Current Stock
            { wch: 18 }, // Minimum Stock
            { wch: 15 }  // Status
        ];
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Items');
        
        // Generate Excel file and download
        const date = new Date().toISOString().split('T')[0];
        const fileName = `Stock_Export_${filterLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        alert(`Stock exported successfully! (${stockItems.length} items)`);
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('An error occurred while exporting to Excel. Please try again.');
    }
}

// Export stock to PDF
function exportStockToPDF() {
    const stockItems = getFilteredStockItems();
    
    if (stockItems.length === 0) {
        alert('No stock items to export. Please adjust your filters.');
        return;
    }
    
    if (typeof window.jspdf === 'undefined') {
        alert('PDF export requires jsPDF library. Please ensure the library is loaded.');
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const colorFilter = document.getElementById('stockColorFilter');
        const filterValue = colorFilter ? colorFilter.value : 'all';
        const filterLabel = filterValue === 'all' ? 'All Items' : 
                           filterValue === 'red' ? 'Red (Below Minimum)' :
                           filterValue === 'yellow' ? 'Yellow (Zero/At Minimum)' : 'Normal (Above Minimum)';
        
        // Add title
        doc.setFontSize(16);
        doc.text('Stock Management Report', 14, 15);
        
        // Add filter info
        doc.setFontSize(10);
        doc.text(`Filter: ${filterLabel}`, 14, 25);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
        doc.text(`Total Items: ${stockItems.length}`, 14, 35);
        
        // Prepare table data
        const tableData = stockItems.map(item => {
            const currentStock = item.stockValue || 0;
            const minStock = item.minStock || 0;
            const isZeroStock = currentStock === 0;
            const isBelowMinStock = currentStock > 0 && currentStock < minStock;
            const isAtMinStock = currentStock === minStock && minStock > 0;
            
            let status = 'Normal';
            if (isBelowMinStock) {
                status = 'Below Minimum';
            } else if (isZeroStock) {
                status = 'Zero Stock';
            } else if (isAtMinStock) {
                status = 'At Minimum';
            }
            
            return [
                item.itemCode || 'N/A',
                item.name || 'N/A',
                item.barcode || 'N/A',
                currentStock.toString(),
                minStock.toString(),
                status
            ];
        });
        
        // Add table
        doc.autoTable({
            startY: 40,
            head: [['Item Code', 'Item Name', 'Barcode', 'Current Stock', 'Minimum Stock', 'Status']],
            body: tableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [102, 126, 234] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: 40 }
        });
        
        // Save PDF
        const date = new Date().toISOString().split('T')[0];
        const fileName = `Stock_Export_${filterLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.pdf`;
        doc.save(fileName);
        
        alert(`Stock exported successfully! (${stockItems.length} items)`);
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        alert('An error occurred while exporting to PDF. Please try again.');
    }
}

// Fullscreen toggle for stock management
function toggleStockFullscreen() {
    const stockManagement = document.querySelector('.stock-management');
    if (stockManagement) {
        stockManagement.classList.toggle('fullscreen');
        const btn = document.getElementById('stockFullscreenBtn');
        if (btn) {
            if (stockManagement.classList.contains('fullscreen')) {
                btn.innerHTML = '<span>⛶</span> Exit Fullscreen';
            } else {
                btn.innerHTML = '<span>⛶</span> Fullscreen';
            }
        }
    }
}

// Download stock template (CSV format)
function downloadStockTemplate() {
    const stockItems = menuItems.filter(item => item.isStockItem);
    
    if (stockItems.length === 0) {
        alert('No stock items found. Please add stock items first.');
        return;
    }
    
    // Check if SheetJS is available for Excel generation
    if (typeof XLSX !== 'undefined') {
        // Generate Excel file using SheetJS
        try {
            // Create worksheet data
            const worksheetData = [
                ['Item Code', 'Item Name', 'Barcode', 'Current Stock', 'Minimum Stock'] // Header row
            ];
            
            // Add data rows
            stockItems.forEach(item => {
                worksheetData.push([
                    item.itemCode || '',
                    item.name || '',
                    item.barcode || '',
                    item.stockValue || 0,
                    item.minStock || 0
                ]);
            });
            
            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            
            // Set column widths
            worksheet['!cols'] = [
                { wch: 12 }, // Item Code
                { wch: 30 }, // Item Name
                { wch: 15 }, // Barcode
                { wch: 15 }, // Current Stock
                { wch: 18 }  // Minimum Stock
            ];
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Items');
            
            // Generate Excel file and download
            const fileName = `Stock_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            
            alert('Stock template (Excel) downloaded successfully!');
        } catch (error) {
            console.error('Error generating Excel file:', error);
            // Fallback to CSV if Excel generation fails
            downloadStockTemplateCSV(stockItems);
        }
    } else {
        // Fallback to CSV if SheetJS is not available
        downloadStockTemplateCSV(stockItems);
    }
}

// Helper function to download CSV template (fallback)
function downloadStockTemplateCSV(stockItems) {
    // Create CSV content with BOM for UTF-8
    let csvContent = '\uFEFF'; // BOM for UTF-8
    
    // Header row
    csvContent += 'Item Code,Item Name,Barcode,Current Stock,Minimum Stock\n';
    
    // Data rows
    stockItems.forEach(item => {
        const itemCode = item.itemCode || '';
        const name = `"${item.name.replace(/"/g, '""')}"`;
        const barcode = item.barcode || '';
        const currentStock = item.stockValue || 0;
        const minStock = item.minStock || 0;
        csvContent += `${itemCode},${name},${barcode},${currentStock},${minStock}\n`;
    });
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = `Stock_Template_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('Stock template (CSV) downloaded successfully!');
}

// Bulk upload stock from CSV/Excel file
function handleBulkStockUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file extension
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCSV = fileName.endsWith('.csv');
    
    if (!isCSV && !isExcel) {
        alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            let dataRows = [];
            
            if (isExcel) {
                // Parse Excel file using SheetJS
                if (typeof XLSX === 'undefined') {
                    alert('Excel file support requires SheetJS library. Please use CSV format or ensure the library is loaded.');
                    event.target.value = '';
                    return;
                }
                
                try {
                    const workbook = XLSX.read(e.target.result, { type: 'binary' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Convert to JSON array
                    dataRows = XLSX.utils.sheet_to_json(worksheet, { 
                        header: 1, 
                        defval: '',
                        raw: false 
                    });
                    
                    console.log('Excel Upload - Total rows:', dataRows.length);
                    console.log('Excel Upload - First 3 rows:', dataRows.slice(0, 3));
                    
                    // Filter out empty rows
                    dataRows = dataRows.filter(row => row && row.length > 0 && row.some(cell => cell && String(cell).trim()));
                    
                } catch (excelError) {
                    console.error('Excel parsing error:', excelError);
                    alert('Error reading Excel file. Please ensure it\'s a valid Excel file (.xlsx or .xls format).\n\nError: ' + excelError.message);
                    event.target.value = '';
                    return;
                }
            } else {
                // Parse CSV file
                let text = e.target.result;
                
                // Remove BOM if present
                if (text.charCodeAt(0) === 0xFEFF) {
                    text = text.slice(1);
                }
                
                // Handle different line endings (Windows \r\n, Unix \n, Mac \r)
                const lines = text.split(/\r?\n|\r/).filter(line => line.trim());
                
                console.log('CSV Upload - Total lines:', lines.length);
                console.log('CSV Upload - First 3 lines:', lines.slice(0, 3));
                
                // Find header row (look for "Item Code", "Item Name", or similar)
                let headerIndex = 0;
                for (let i = 0; i < Math.min(5, lines.length); i++) {
                    const lineLower = lines[i].toLowerCase();
                    if (lineLower.includes('item code') || 
                        lineLower.includes('item name') || 
                        lineLower.includes('barcode') ||
                        lines[i].split(',').length >= 4) {
                        headerIndex = i;
                        break;
                    }
                }
                
                // Parse CSV lines into rows
                for (let i = headerIndex; i < lines.length; i++) {
                    const line = lines[i];
                    if (!line.trim()) continue;
                    
                    // Parse CSV line (handle quoted values and different separators)
                    let values = [];
                    let current = '';
                    let inQuotes = false;
                    
                    // Try to detect separator (comma or semicolon)
                    const hasSemicolon = line.includes(';') && !line.includes(',');
                    const separator = hasSemicolon ? ';' : ',';
                    
                    for (let j = 0; j < line.length; j++) {
                        const char = line[j];
                        if (char === '"') {
                            if (inQuotes && line[j + 1] === '"') {
                                current += '"';
                                j++; // Skip next quote
                            } else {
                                inQuotes = !inQuotes;
                            }
                        } else if (char === separator && !inQuotes) {
                            values.push(current.trim());
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                    values.push(current.trim()); // Add last value
                    
                    // Filter out empty values at the end
                    while (values.length > 0 && values[values.length - 1] === '') {
                        values.pop();
                    }
                    
                    // If parsing failed, try simple split as fallback
                    if (values.length < 4) {
                        const simpleSplit = line.split(separator).map(v => v.trim());
                        if (simpleSplit.length >= 4) {
                            values = simpleSplit;
                        }
                    }
                    
                    // Accept rows with 4 columns (old format) or 5 columns (new format with Item Code)
                    if (values.length >= 4) {
                        dataRows.push(values);
                    }
                }
            }
            
            if (dataRows.length < 2) {
                alert('File is empty or invalid format. Please check the template.\n\nExpected format:\nItem Code,Item Name,Barcode,Current Stock,Minimum Stock\n\nExample:\nITM101,"Idly","1001",10,5');
                event.target.value = '';
                return;
            }
            
            // Find header row in dataRows
            let headerIndex = 0;
            for (let i = 0; i < Math.min(5, dataRows.length); i++) {
                const firstCell = String(dataRows[i][0] || '').toLowerCase();
                const secondCell = String(dataRows[i][1] || '').toLowerCase();
                if (firstCell.includes('item code') || secondCell.includes('item name') || firstCell.includes('item name') || firstCell.includes('barcode') || dataRows[i].length >= 4) {
                    headerIndex = i;
                    break;
                }
            }
            
            // Skip header row
            const dataLines = dataRows.slice(headerIndex + 1);
            let updatedCount = 0;
            let errorCount = 0;
            const errors = [];
            
            dataLines.forEach((row, index) => {
                if (!row || row.length === 0) return;
                
                // Check if old format (4 columns) or new format (5 columns with Item Code)
                const hasItemCode = row.length >= 5 || (row.length >= 4 && String(row[0] || '').toUpperCase().match(/^ITM\d+$/));
                
                if (hasItemCode && row.length < 5) {
                    errorCount++;
                    const rowPreview = row.slice(0, 5).map(cell => String(cell || '').substring(0, 20)).join(', ');
                    errors.push(`Row ${headerIndex + index + 2}: Insufficient columns (found ${row.length}, expected 5). Values: "${rowPreview}"`);
                    return;
                } else if (!hasItemCode && row.length < 4) {
                    errorCount++;
                    const rowPreview = row.slice(0, 4).map(cell => String(cell || '').substring(0, 20)).join(', ');
                    errors.push(`Row ${headerIndex + index + 2}: Insufficient columns (found ${row.length}, expected 4). Values: "${rowPreview}"`);
                    return;
                }
                
                let itemCode, itemName, barcode, currentStockStr, minStockStr;
                
                if (hasItemCode) {
                    // New format: Item Code, Item Name, Barcode, Current Stock, Minimum Stock
                    [itemCode, itemName, barcode, currentStockStr, minStockStr] = row;
                } else {
                    // Old format (backward compatibility): Item Name, Barcode, Current Stock, Minimum Stock
                    [itemName, barcode, currentStockStr, minStockStr] = row;
                    itemCode = '';
                }
                
                // Clean values (remove quotes and trim)
                const cleanItemCode = String(itemCode || '').replace(/^"|"$/g, '').trim();
                const cleanItemName = String(itemName || '').replace(/^"|"$/g, '').trim();
                const cleanBarcode = String(barcode || '').trim();
                
                if (!cleanItemName && !cleanItemCode) {
                    errorCount++;
                    errors.push(`Row ${headerIndex + index + 2}: Item name and item code are both empty`);
                    return;
                }
                
                // Find item by item code (highest priority), then name, then barcode
                let item = null;
                if (cleanItemCode) {
                    item = menuItems.find(i => i.itemCode === cleanItemCode);
                }
                if (!item && cleanItemName) {
                    item = menuItems.find(i => i.name === cleanItemName);
                }
                if (!item && cleanBarcode) {
                    item = menuItems.find(i => i.barcode === cleanBarcode);
                }
                
                if (!item) {
                    errorCount++;
                    errors.push(`Row ${headerIndex + index + 2}: Item "${cleanItemName}" (Barcode: ${cleanBarcode || 'N/A'}) not found`);
                    return;
                }
                
                if (!item.isStockItem) {
                    errorCount++;
                    errors.push(`Row ${headerIndex + index + 2}: "${cleanItemName}" is not a stock item. Please mark it as stock item first.`);
                    return;
                }
                
                // Parse stock values
                const currentStock = parseFloat(String(currentStockStr || '').replace(/[^\d.-]/g, ''));
                const minStock = parseFloat(String(minStockStr || '').replace(/[^\d.-]/g, ''));
                
                if (isNaN(currentStock) || currentStock < 0) {
                    errorCount++;
                    errors.push(`Row ${headerIndex + index + 2}: Invalid current stock value "${currentStockStr}"`);
                    return;
                }
                
                if (isNaN(minStock) || minStock < 0) {
                    errorCount++;
                    errors.push(`Row ${headerIndex + index + 2}: Invalid minimum stock value "${minStockStr}"`);
                    return;
                }
                
                // Update stock values on the respective item
                item.stockValue = currentStock;
                item.minStock = minStock;
                updatedCount++;
            });
            
            // Save updated items to localStorage (this persists the stock updates)
            // IMPORTANT: Save even if there were some errors, as long as some items were updated
            if (updatedCount > 0) {
                // Save the updated menuItems array to localStorage
                localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(menuItems));
                
                // Force reload menuItems from localStorage to ensure consistency
                menuItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.MENU_ITEMS) || '[]');
                
                // Re-render all views to reflect updated stock values
                renderStockItems();
                renderManagementMenu();
                renderMenu();
                
                console.log(`Stock bulk update: ${updatedCount} items updated successfully`);
            }
            
            // Show results
            if (updatedCount > 0) {
                // Show success message first if items were updated
                let successMsg = `Stock updated successfully!\n\nUpdated: ${updatedCount} item(s)`;
                if (errorCount > 0) {
                    successMsg += `\n\nNote: ${errorCount} item(s) had errors and were skipped.`;
                }
                alert(successMsg);
                
                // Show detailed errors in a separate alert if there are many errors
                if (errorCount > 0 && errorCount <= 20) {
                    let errorMsg = `Error details:\n\n${errors.join('\n')}`;
                    alert(errorMsg);
                } else if (errorCount > 20) {
                    let errorMsg = `Error details (showing first 20):\n\n${errors.slice(0, 20).join('\n')}\n\n... and ${errorCount - 20} more error(s)`;
                    alert(errorMsg);
                }
            } else {
                // No items updated - show all errors
                let errorMsg = `Bulk upload failed!\n\nNo items were updated.\n\nErrors (${errorCount} item(s)):\n${errors.slice(0, 15).join('\n')}`;
                if (errors.length > 15) {
                    errorMsg += `\n... and ${errors.length - 15} more error(s)`;
                }
                errorMsg += `\n\nPlease check:\n1. File format matches template\n2. Item names/barcodes match existing items\n3. All items are marked as stock items`;
                alert(errorMsg);
            }
            
        } catch (error) {
            console.error('Error parsing file:', error);
            alert('Error reading file. Please check the file format and try again.');
        }
        
        // Reset file input
        event.target.value = '';
    };
    
    reader.onerror = function() {
        alert('Error reading file. Please try again.');
        event.target.value = '';
    };
    
    // Read file based on type
    if (isExcel) {
        // For Excel files, read as binary
        reader.readAsBinaryString(file);
    } else {
        // For CSV files, read as text
        reader.readAsText(file);
    }
}

function renderManagementMenu() {
    const managementList = document.getElementById('managementMenuList');
    managementList.innerHTML = '';

    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'management-menu-item';
        menuItem.innerHTML = `
            <div class="management-menu-item-info">
                <h4>${item.name}</h4>
                <p><strong>Item Code:</strong> ${item.itemCode || 'N/A'}</p>
                <p>Barcode: ${item.barcode || 'N/A'}</p>
                <p>₹${item.price.toFixed(2)}</p>
            </div>
            <div class="management-menu-item-actions">
                <button class="btn btn-edit" onclick="editMenuItem(${item.id})">Edit</button>
                <button class="btn btn-delete" onclick="deleteMenuItem(${item.id})">Delete</button>
            </div>
        `;
        managementList.appendChild(menuItem);
    });
}

function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please select an image file!');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        selectedImageBase64 = e.target.result;
        document.getElementById('previewImage').src = selectedImageBase64;
        document.getElementById('imagePreview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function removeImagePreview() {
    selectedImageBase64 = null;
    document.getElementById('itemImageFile').value = '';
    document.getElementById('previewImage').src = '';
    document.getElementById('imagePreview').classList.add('hidden');
}

// Paste image functionality
function handlePasteImage(e) {
    // Only handle paste if the menu management section is visible
    const menuManagementSection = document.getElementById('menuManagementSection');
    if (menuManagementSection.classList.contains('hidden')) {
        return;
    }
    
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            const reader = new FileReader();
            reader.onload = function(e) {
                selectedImageBase64 = e.target.result;
                document.getElementById('previewImage').src = selectedImageBase64;
                document.getElementById('imagePreview').classList.remove('hidden');
            };
            reader.readAsDataURL(blob);
            e.preventDefault();
            break;
        }
    }
}

// Open Image Edit Modal
function openImageEditModal() {
    if (!selectedImageBase64) {
        alert('Please select an image first!');
        return;
    }
    
    const modal = document.getElementById('imageEditModal');
    const canvas = document.getElementById('imageCanvas');
    const previewImg = document.getElementById('editPreviewImage');
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = function() {
        // Store original image state
        editImageState = {
            image: img,
            originalWidth: img.width,
            originalHeight: img.height,
            currentImageData: selectedImageBase64
        };
        
        // Set canvas size to fit within max dimensions while maintaining aspect ratio
        const maxWidth = 600;
        const maxHeight = 400;
        let displayWidth = img.width;
        let displayHeight = img.height;
        
        if (displayWidth > maxWidth) {
            displayHeight = (maxWidth / displayWidth) * displayHeight;
            displayWidth = maxWidth;
        }
        if (displayHeight > maxHeight) {
            displayWidth = (maxHeight / displayHeight) * displayWidth;
            displayHeight = maxHeight;
        }
        
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        
        // Draw image on canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
        
        // Set resize inputs
        document.getElementById('resizeWidth').value = img.width;
        document.getElementById('resizeHeight').value = img.height;
        document.getElementById('maintainAspectRatio').checked = true;
        
        // Reset crop selection
        cropSelection = null;
        resetCropInputs();
        
        // Set preview
        previewImg.src = selectedImageBase64;
        
        // Show modal
        modal.classList.remove('hidden');
        
        // Setup canvas for cropping
        const scaleX = displayWidth / img.width;
        const scaleY = displayHeight / img.height;
        editImageState.scaleX = scaleX;
        editImageState.scaleY = scaleY;
        setupCanvasForCropping(canvas, ctx, scaleX, scaleY);
    };
    img.src = selectedImageBase64;
}

// Setup canvas for cropping interaction
function setupCanvasForCropping(canvas, ctx, scaleX, scaleY) {
    let startX, startY, isDragging = false;
    
    // Remove old event listeners
    canvas.onmousedown = null;
    canvas.onmousemove = null;
    canvas.onmouseup = null;
    canvas.onmouseleave = null;
    
    canvas.onmousedown = function(e) {
        const rect = canvas.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        isDragging = true;
        
        // Clear previous crop selection
        cropSelection = null;
        redrawCanvas(canvas, ctx);
    };
    
    canvas.onmousemove = function(e) {
        if (!isDragging) return;
        
        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        const x = Math.min(startX, currentX);
        const y = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        
        cropSelection = { x, y, width, height };
        
        // Get current scale factors from editImageState
        const currentScaleX = editImageState ? (editImageState.scaleX || scaleX) : scaleX;
        const currentScaleY = editImageState ? (editImageState.scaleY || scaleY) : scaleY;
        
        // Update crop inputs (convert back to original image coordinates)
        document.getElementById('cropX').value = Math.round(x / currentScaleX);
        document.getElementById('cropY').value = Math.round(y / currentScaleY);
        document.getElementById('cropWidth').value = Math.round(width / currentScaleX);
        document.getElementById('cropHeight').value = Math.round(height / currentScaleY);
        
        redrawCanvas(canvas, ctx);
        drawCropSelection(ctx, x, y, width, height);
    };
    
    canvas.onmouseup = function() {
        isDragging = false;
    };
    
    canvas.onmouseleave = function() {
        isDragging = false;
    };
}

// Redraw canvas with current image
function redrawCanvas(canvas, ctx) {
    if (!editImageState) return;
    
    const img = editImageState.image;
    const displayWidth = canvas.width;
    const displayHeight = canvas.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
}

// Draw crop selection overlay
function drawCropSelection(ctx, x, y, width, height) {
    if (!cropSelection || width === 0 || height === 0) return;
    
    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Clear the selected area
    ctx.clearRect(x, y, width, height);
    
    // Draw the image again in the selected area
    if (editImageState) {
        const img = editImageState.image;
        const scaleX = ctx.canvas.width / img.width;
        const scaleY = ctx.canvas.height / img.height;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();
        ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }
    
    // Draw selection border
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
}

// Reset crop inputs
function resetCropInputs() {
    document.getElementById('cropX').value = '';
    document.getElementById('cropY').value = '';
    document.getElementById('cropWidth').value = '';
    document.getElementById('cropHeight').value = '';
}

// Apply resize
function applyResize() {
    if (!editImageState) return;
    
    const width = parseInt(document.getElementById('resizeWidth').value);
    const height = parseInt(document.getElementById('resizeHeight').value);
    
    if (!width || !height || width <= 0 || height <= 0) {
        alert('Please enter valid width and height values!');
        return;
    }
    
    const canvas = document.getElementById('cropCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw resized image
    ctx.drawImage(editImageState.image, 0, 0, width, height);
    
    // Update preview and state
    const resizedDataURL = canvas.toDataURL('image/png');
    document.getElementById('editPreviewImage').src = resizedDataURL;
    editImageState.currentImageData = resizedDataURL;
    
    // Create new image object for further editing
    const img = new Image();
    img.onload = function() {
        editImageState.image = img;
        editImageState.originalWidth = img.width;
        editImageState.originalHeight = img.height;
        
        // Update canvas display
        const displayCanvas = document.getElementById('imageCanvas');
        const displayCtx = displayCanvas.getContext('2d');
        const maxWidth = 600;
        const maxHeight = 400;
        let displayWidth = img.width;
        let displayHeight = img.height;
        
        if (displayWidth > maxWidth) {
            displayHeight = (maxWidth / displayWidth) * displayHeight;
            displayWidth = maxWidth;
        }
        if (displayHeight > maxHeight) {
            displayWidth = (maxHeight / displayHeight) * displayWidth;
            displayHeight = maxHeight;
        }
        
        displayCanvas.width = displayWidth;
        displayCanvas.height = displayHeight;
        displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
        displayCtx.drawImage(img, 0, 0, displayWidth, displayHeight);
        
        // Update scale factors
        const scaleX = displayWidth / img.width;
        const scaleY = displayHeight / img.height;
        editImageState.scaleX = scaleX;
        editImageState.scaleY = scaleY;
        
        // Update resize inputs
        document.getElementById('resizeWidth').value = img.width;
        document.getElementById('resizeHeight').value = img.height;
        
        // Reset crop
        cropSelection = null;
        resetCropInputs();
        
        // Re-setup canvas for cropping
        setupCanvasForCropping(displayCanvas, displayCtx, scaleX, scaleY);
    };
    img.src = resizedDataURL;
}

// Apply crop
function applyCrop() {
    if (!editImageState || !cropSelection) {
        alert('Please select a crop area first!');
        return;
    }
    
    const canvas = document.getElementById('imageCanvas');
    const scaleX = canvas.width / editImageState.image.width;
    const scaleY = canvas.height / editImageState.image.height;
    
    const x = parseInt(document.getElementById('cropX').value);
    const y = parseInt(document.getElementById('cropY').value);
    const width = parseInt(document.getElementById('cropWidth').value);
    const height = parseInt(document.getElementById('cropHeight').value);
    
    if (!x && x !== 0 || !y && y !== 0 || !width || !height || width <= 0 || height <= 0) {
        alert('Please select a valid crop area!');
        return;
    }
    
    const cropCanvas = document.getElementById('cropCanvas');
    const ctx = cropCanvas.getContext('2d');
    
    cropCanvas.width = width;
    cropCanvas.height = height;
    
    // Draw cropped portion
    ctx.drawImage(
        editImageState.image,
        x, y, width, height,
        0, 0, width, height
    );
    
    // Update preview and state
    const croppedDataURL = cropCanvas.toDataURL('image/png');
    document.getElementById('editPreviewImage').src = croppedDataURL;
    editImageState.currentImageData = croppedDataURL;
    
    // Create new image object for further editing
    const img = new Image();
    img.onload = function() {
        editImageState.image = img;
        editImageState.originalWidth = img.width;
        editImageState.originalHeight = img.height;
        
        // Update canvas display
        const displayCanvas = document.getElementById('imageCanvas');
        const displayCtx = displayCanvas.getContext('2d');
        const maxWidth = 600;
        const maxHeight = 400;
        let displayWidth = img.width;
        let displayHeight = img.height;
        
        if (displayWidth > maxWidth) {
            displayHeight = (maxWidth / displayWidth) * displayHeight;
            displayWidth = maxWidth;
        }
        if (displayHeight > maxHeight) {
            displayWidth = (maxHeight / displayHeight) * displayWidth;
            displayHeight = maxHeight;
        }
        
        displayCanvas.width = displayWidth;
        displayCanvas.height = displayHeight;
        displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
        displayCtx.drawImage(img, 0, 0, displayWidth, displayHeight);
        
        // Update scale factors
        const scaleX = displayWidth / img.width;
        const scaleY = displayHeight / img.height;
        editImageState.scaleX = scaleX;
        editImageState.scaleY = scaleY;
        
        // Update resize inputs
        document.getElementById('resizeWidth').value = img.width;
        document.getElementById('resizeHeight').value = img.height;
        
        // Reset crop
        cropSelection = null;
        resetCropInputs();
        
        // Re-setup canvas for cropping
        setupCanvasForCropping(displayCanvas, displayCtx, scaleX, scaleY);
    };
    img.src = croppedDataURL;
}

// Reset crop selection
function resetCrop() {
    cropSelection = null;
    resetCropInputs();
    
    if (editImageState) {
        const canvas = document.getElementById('imageCanvas');
        const ctx = canvas.getContext('2d');
        redrawCanvas(canvas, ctx);
    }
}

// Save edited image
function saveEditedImage() {
    if (!editImageState || !editImageState.currentImageData) {
        alert('No image to save!');
        return;
    }
    
    selectedImageBase64 = editImageState.currentImageData;
    document.getElementById('previewImage').src = selectedImageBase64;
    document.getElementById('imagePreview').classList.remove('hidden');
    
    closeImageEditModal();
}

// Close Image Edit Modal
function closeImageEditModal() {
    document.getElementById('imageEditModal').classList.add('hidden');
    editImageState = null;
    cropSelection = null;
}

// Generate auto item code
function addMenuItem() {
    const name = document.getElementById('itemName').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value);
    const barcode = document.getElementById('itemBarcode').value.trim();
    const hasTax = document.getElementById('itemTax').value === 'yes';
    const cgstPercentage = hasTax ? parseFloat(document.getElementById('itemGstPercentage').value) || 0 : 0;
    const sgstPercentage = hasTax ? parseFloat(document.getElementById('itemSgstPercentage').value) || 0 : 0;
    const priceIncludesTax = hasTax ? document.getElementById('itemPriceIncludesTax').value === 'yes' : false;
    const isStockItem = document.getElementById('itemStockItem').value === 'yes';
    const stockValue = isStockItem ? parseFloat(document.getElementById('itemStockValue').value) || 0 : 0;
    const minStock = isStockItem ? parseFloat(document.getElementById('itemMinStock').value) || 0 : 0;

    if (!name || !price || price <= 0) {
        alert('Please fill in all required fields with valid values!');
        return;
    }
    
    if (hasTax && (cgstPercentage < 0 || cgstPercentage > 100 || sgstPercentage < 0 || sgstPercentage > 100)) {
        alert('Please enter valid CGST and SGST percentages (0-100)!');
        return;
    }
    
    if (hasTax && cgstPercentage === 0 && sgstPercentage === 0) {
        alert('Please enter at least one tax percentage (CGST or SGST)!');
        return;
    }
    
    if (isStockItem && stockValue < 0) {
        alert('Please enter a valid stock value (0 or greater)!');
        return;
    }
    
    if (isStockItem && minStock < 0) {
        alert('Please enter a valid minimum stock value (0 or greater)!');
        return;
    }

    // Use base64 image if selected, otherwise use default path
    const image = selectedImageBase64 || `images/${name.toLowerCase()}.jpg`;
    
    // Generate barcode if not provided
    const finalBarcode = barcode || String(1000 + (menuItems.length > 0 ? Math.max(...menuItems.map(i => i.id)) + 1 : 1));

    if (editingItemId) {
        // Update existing item
        const item = menuItems.find(i => i.id === editingItemId);
        if (item) {
            item.name = name;
            item.price = price;
            item.barcode = barcode || item.barcode || String(1000 + item.id);
            item.hasTax = hasTax;
            item.gstPercentage = hasTax ? cgstPercentage : 0;
            item.sgstPercentage = hasTax ? sgstPercentage : 0;
            item.priceIncludesTax = hasTax ? priceIncludesTax : false;
            item.isStockItem = isStockItem;
            item.stockValue = isStockItem ? stockValue : 0;
            item.minStock = isStockItem ? minStock : 0;
            if (selectedImageBase64) item.image = selectedImageBase64;
        }
        editingItemId = null;
        document.getElementById('addItemBtn').textContent = 'Add Item';
    } else {
        // Add new item
        const newId = menuItems.length > 0 ? Math.max(...menuItems.map(i => i.id)) + 1 : 1;
        const itemCode = generateItemCode(); // Generate auto item code
        menuItems.push({
            id: newId,
            itemCode: itemCode,
            name: name,
            price: price,
            image: image,
            barcode: finalBarcode,
            hasTax: hasTax,
            gstPercentage: hasTax ? cgstPercentage : 0,
            sgstPercentage: hasTax ? sgstPercentage : 0,
            priceIncludesTax: hasTax ? priceIncludesTax : false,
            isStockItem: isStockItem,
            stockValue: isStockItem ? stockValue : 0,
            minStock: isStockItem ? minStock : 0
        });
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(menuItems));
    
    // Clear form
    document.getElementById('itemName').value = '';
    document.getElementById('itemBarcode').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemImageFile').value = '';
        document.getElementById('itemTax').value = 'no';
        document.getElementById('gstPercentageGroup').classList.add('hidden');
        document.getElementById('itemGstPercentage').value = '';
        document.getElementById('itemSgstPercentage').value = '';
        document.getElementById('itemPriceIncludesTax').value = 'no';
        document.getElementById('itemStockItem').value = 'no';
        document.getElementById('stockFieldsGroup').classList.add('hidden');
        document.getElementById('itemStockValue').value = '';
        document.getElementById('itemMinStock').value = '';
        removeImagePreview();

    // Re-render
    renderMenu();
    renderManagementMenu();
}

function editMenuItem(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('itemName').value = item.name;
    document.getElementById('itemBarcode').value = item.barcode || '';
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemImageFile').value = '';
    
    // Set tax fields
    const hasTax = item.hasTax || false;
    document.getElementById('itemTax').value = hasTax ? 'yes' : 'no';
    if (hasTax) {
        const gstGroup = document.getElementById('gstPercentageGroup');
        gstGroup.classList.remove('hidden');
        gstGroup.style.display = 'block';
        document.getElementById('itemGstPercentage').value = item.gstPercentage || 0;
        document.getElementById('itemSgstPercentage').value = item.sgstPercentage || 0;
        document.getElementById('itemPriceIncludesTax').value = item.priceIncludesTax ? 'yes' : 'no';
    } else {
        document.getElementById('gstPercentageGroup').classList.add('hidden');
        document.getElementById('itemGstPercentage').value = '';
        document.getElementById('itemSgstPercentage').value = '';
        document.getElementById('itemPriceIncludesTax').value = 'no';
    }
    
    // Set stock fields
    const isStockItem = item.isStockItem || false;
    document.getElementById('itemStockItem').value = isStockItem ? 'yes' : 'no';
    if (isStockItem) {
        const stockFieldsGroup = document.getElementById('stockFieldsGroup');
        stockFieldsGroup.classList.remove('hidden');
        stockFieldsGroup.style.display = 'block';
        document.getElementById('itemStockValue').value = item.stockValue || 0;
        document.getElementById('itemMinStock').value = item.minStock || 0;
    } else {
        document.getElementById('stockFieldsGroup').classList.add('hidden');
        document.getElementById('itemStockValue').value = '';
        document.getElementById('itemMinStock').value = '';
    }
    
    // Show image preview if it's a base64 image
    if (item.image && item.image.startsWith('data:image')) {
        selectedImageBase64 = item.image;
        document.getElementById('previewImage').src = item.image;
        document.getElementById('imagePreview').classList.remove('hidden');
    } else {
        removeImagePreview();
    }
    
    editingItemId = itemId;
    document.getElementById('addItemBtn').textContent = 'Update Item';
}

function deleteMenuItem(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        menuItems = menuItems.filter(i => i.id !== itemId);
        localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(menuItems));
        renderMenu();
        renderManagementMenu();
    }
}

// Payment & Billing
function showQRModal() {
    // Check if user is logged in
    if (!currentUser) {
        alert('Please login to make a payment!');
        document.getElementById('loginModal').classList.remove('hidden');
        return;
    }
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const total = calculateTotal();
    document.getElementById('qrAmount').textContent = total.toFixed(2);
    
    // Update QR code image before showing modal
    updateQRCodeInModal();
    
    // Reset payment modal to show payment method selection
    resetPaymentModal();
    
    // Show the modal - remove hidden class and reset display style
    const qrModal = document.getElementById('qrModal');
    if (qrModal) {
        qrModal.classList.remove('hidden');
        qrModal.style.display = ''; // Reset display style to allow CSS to control visibility
    }
}

function resetPaymentModal() {
    document.getElementById('gpaySection').classList.add('hidden');
    document.getElementById('cashSection').classList.add('hidden');
}

function showGPaySection() {
    document.getElementById('gpaySection').classList.remove('hidden');
    document.getElementById('cashSection').classList.add('hidden');
}

function showCashSection() {
    document.getElementById('cashSection').classList.remove('hidden');
    document.getElementById('gpaySection').classList.add('hidden');
}

// Function to reduce stock when order is confirmed
function reduceStockForOrder(order) {
    order.items.forEach(orderItem => {
        // Find the menu item by ID
        const menuItem = menuItems.find(item => item.id === orderItem.id);
        if (menuItem && menuItem.isStockItem) {
            // Reduce stock by the quantity sold
            menuItem.stockValue = Math.max(0, (menuItem.stockValue || 0) - orderItem.quantity);
        }
    });
    
    // Save updated menu items to localStorage
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(menuItems));
    
    // Re-render menu to show updated stock values
    renderMenu();
    renderManagementMenu();
}

function confirmCashPayment() {
    // Check if user is logged in
    if (!currentUser) {
        alert('Please login to make a payment!');
        document.getElementById('loginModal').classList.remove('hidden');
        document.getElementById('qrModal').classList.add('hidden');
        return;
    }
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const total = calculateTotal();
    const customerName = document.getElementById('customerName') ? document.getElementById('customerName').value.trim() : '';
    const billNumber = generateNextBillNumber();
    // Ensure bill number is a number
    const order = {
        id: Number(billNumber),
        date: new Date().toISOString(),
        paymentMethod: 'cash',
        userId: currentUser ? currentUser.id : null,
        username: currentUser ? currentUser.username : 'Guest',
        customerName: customerName,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            hasTax: item.hasTax || false,
            gstPercentage: item.gstPercentage || 0,
            sgstPercentage: item.sgstPercentage || 0,
            priceIncludesTax: item.priceIncludesTax || false
        })),
        subtotal: subtotal,
        tax: tax.total || tax,
        total: total
    };

    // Save order
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    orders.push(order);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    // Reduce stock for stock items
    reduceStockForOrder(order);

    // Check if cashier code exists before asking to print
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const loggedInUser = users.find(u => u.id === currentUser.id);
    if (!loggedInUser || !loggedInUser.cashierCode || !loggedInUser.cashierCode.trim()) {
        alert('Payment confirmed! However, cashier code is mandatory for printing bills. Please update your user profile with a cashier code to print bills in the future.');
    } else {
        // Ask if user wants to print bill before closing
        const printBill = confirm('Payment confirmed! Would you like to print the bill?');
        
        if (printBill) {
            // Print bill before closing
            printBillForOrder(order);
        }
    }

    // Close modal immediately - hide the modal first
    const qrModal = document.getElementById('qrModal');
    if (qrModal) {
        qrModal.classList.add('hidden');
        qrModal.style.display = 'none';
    }
    resetPaymentModal();

    // Clear cart after closing modal
    cart = [];
    saveCart();
    renderCart();
    updateCartCount();
}

function confirmPayment() {
    // Check if user is logged in
    if (!currentUser) {
        alert('Please login to make a payment!');
        document.getElementById('loginModal').classList.remove('hidden');
        document.getElementById('qrModal').classList.add('hidden');
        return;
    }
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const total = calculateTotal();
    const customerName = document.getElementById('customerName') ? document.getElementById('customerName').value.trim() : '';
    const billNumber = generateNextBillNumber();
    // Ensure bill number is a number
    const order = {
        id: Number(billNumber),
        date: new Date().toISOString(),
        paymentMethod: 'gpay',
        userId: currentUser ? currentUser.id : null,
        username: currentUser ? currentUser.username : 'Guest',
        customerName: customerName,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            hasTax: item.hasTax || false,
            gstPercentage: item.gstPercentage || 0,
            sgstPercentage: item.sgstPercentage || 0,
            priceIncludesTax: item.priceIncludesTax || false
        })),
        subtotal: subtotal,
        tax: tax.total || tax,
        total: total
    };

    // Save order
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    orders.push(order);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    // Reduce stock for stock items
    reduceStockForOrder(order);

    // Check if cashier code exists before asking to print
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const loggedInUser = users.find(u => u.id === currentUser.id);
    if (!loggedInUser || !loggedInUser.cashierCode || !loggedInUser.cashierCode.trim()) {
        alert('Payment confirmed! However, cashier code is mandatory for printing bills. Please update your user profile with a cashier code to print bills in the future.');
    } else {
        // Ask if user wants to print bill before closing
        const printBill = confirm('Payment confirmed! Would you like to print the bill?');
        
        if (printBill) {
            // Print bill before closing
            printBillForOrder(order);
        }
    }

    // Close modal immediately - hide the modal first
    const qrModal = document.getElementById('qrModal');
    if (qrModal) {
        qrModal.classList.add('hidden');
        qrModal.style.display = 'none';
    }
    resetPaymentModal();

    // Clear cart after closing modal
    cart = [];
    saveCart();
    renderCart();
    updateCartCount();
}

function printBillForOrder(order) {
    // Check if cashier code exists for the logged-in user
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const loggedInUser = users.find(u => u.id === order.userId);
    if (!loggedInUser || !loggedInUser.cashierCode || !loggedInUser.cashierCode.trim()) {
        alert('Cashier code is mandatory for printing bills! Please update your user profile with a cashier code.');
        return;
    }
    
    const printBillDiv = document.getElementById('printBill');
    const billItemsBody = document.getElementById('billItemsBody');
    const billTotal = document.getElementById('billTotal');
    const billDate = document.getElementById('billDate');
    const billOrderNumber = document.getElementById('billOrderNumber');
    const billRestaurantName = document.getElementById('billRestaurantName');
    const billRestaurantAddress = document.getElementById('billRestaurantAddress');
    const billRestaurantGstin = document.getElementById('billRestaurantGstin');
    const billRestaurantFssai = document.getElementById('billRestaurantFssai');

    // Get restaurant info
    const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    if (billRestaurantName) {
        billRestaurantName.textContent = restaurantInfo.name || 'Restaurant Bill';
    }
    if (billRestaurantAddress) {
        billRestaurantAddress.textContent = restaurantInfo.address || '';
        billRestaurantAddress.style.display = restaurantInfo.address ? 'block' : 'none';
    }
    if (billRestaurantGstin) {
        const showInBill = restaurantInfo.showGstinInBill !== false; // Default to true if not set
        billRestaurantGstin.textContent = restaurantInfo.gstin ? `GSTIN: ${restaurantInfo.gstin}` : '';
        billRestaurantGstin.style.display = (restaurantInfo.gstin && showInBill) ? 'block' : 'none';
    }
    if (billRestaurantFssai) {
        const showInBill = restaurantInfo.showFssaiInBill !== false; // Default to true if not set
        billRestaurantFssai.textContent = restaurantInfo.fssai ? `FSSAI Code: ${restaurantInfo.fssai}` : '';
        billRestaurantFssai.style.display = (restaurantInfo.fssai && showInBill) ? 'block' : 'none';
    }

    // Set order number, customer name, cashier code, and date
    if (billOrderNumber) {
        // Ensure bill number is displayed as a number
        const billNo = typeof order.id === 'number' ? order.id : (order.id ? parseInt(order.id) : null);
        billOrderNumber.textContent = (billNo && !isNaN(billNo)) ? billNo.toString() : 'Pending';
    }
    if (billCustomerName && billCustomerNameValue) {
        if (order.customerName && order.customerName.trim()) {
            billCustomerNameValue.textContent = order.customerName;
            billCustomerName.style.display = 'block';
        } else {
            billCustomerName.style.display = 'none';
        }
    }
    // Get cashier code from current logged-in user
    if (billCashierCode && billCashierCodeValue) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const loggedInUser = users.find(u => u.id === order.userId);
        if (loggedInUser && loggedInUser.cashierCode && loggedInUser.cashierCode.trim()) {
            billCashierCodeValue.textContent = loggedInUser.cashierCode;
            billCashierCode.style.display = 'block';
        } else {
            billCashierCode.style.display = 'none';
        }
    }
    if (billDate) {
        billDate.textContent = new Date(order.date).toLocaleString();
    }

    // Clear and populate bill items
    if (billItemsBody) {
        billItemsBody.innerHTML = '';
    }

    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    
    order.items.forEach(item => {
        const itemPriceTotal = item.price * item.quantity;
        const totalTaxRate = (item.gstPercentage || 0) + (item.sgstPercentage || 0);
        
        if (item.hasTax && item.priceIncludesTax) {
            // Price includes tax - calculate base price and tax
            const basePrice = itemPriceTotal / (1 + totalTaxRate / 100);
            const totalTax = itemPriceTotal - basePrice;
            subtotal += basePrice;
            
            // Distribute tax proportionally between CGST and SGST
            if (totalTaxRate > 0) {
                if (item.gstPercentage > 0) {
                    totalCgst += (totalTax * item.gstPercentage) / totalTaxRate;
                }
                if (item.sgstPercentage > 0) {
                    totalSgst += (totalTax * item.sgstPercentage) / totalTaxRate;
                }
            }
        } else {
            // Price excludes tax - use price as subtotal and calculate tax separately
            subtotal += itemPriceTotal;
            if (item.hasTax) {
                if (item.gstPercentage > 0) {
                    totalCgst += (itemPriceTotal * item.gstPercentage) / 100;
                }
                if (item.sgstPercentage > 0) {
                    totalSgst += (itemPriceTotal * item.sgstPercentage) / 100;
                }
            }
        }

        // Create POS format item row
        const itemRow = document.createElement('div');
        itemRow.className = 'pos-item-row';
        
        // Truncate item name if too long for POS printer
        const itemName = item.name.length > 20 ? item.name.substring(0, 17) + '...' : item.name;
        
        itemRow.innerHTML = `
            <span class="pos-item-name"><strong>${itemName}</strong></span>
            <span class="pos-item-price"><strong>₹${item.price.toFixed(2)}</strong></span>
            <span class="pos-item-qty"><strong>${item.quantity}</strong></span>
            <span class="pos-item-total">₹${itemPriceTotal.toFixed(2)}</span>
        `;
        if (billItemsBody) {
            billItemsBody.appendChild(itemRow);
        }
    });

    // Show/hide tax section based on whether there's tax
    const billSubtotal = document.getElementById('billSubtotal');
    const billSubtotalAmount = document.getElementById('billSubtotalAmount');
    const billCgst = document.getElementById('billCgst');
    const billCgstAmount = document.getElementById('billCgstAmount');
    const billSgst = document.getElementById('billSgst');
    const billSgstAmount = document.getElementById('billSgstAmount');
    const billTax = document.getElementById('billTax');
    const billTaxAmount = document.getElementById('billTaxAmount');
    
    const totalTax = totalCgst + totalSgst;
    
    if (totalTax > 0) {
        if (billSubtotal) {
            billSubtotal.style.display = 'block';
        }
        if (billSubtotalAmount) {
            billSubtotalAmount.textContent = subtotal.toFixed(2);
        }
        if (billCgst) {
            billCgst.style.display = totalCgst > 0 ? 'block' : 'none';
        }
        if (billCgstAmount) {
            billCgstAmount.textContent = totalCgst.toFixed(2);
        }
        if (billSgst) {
            billSgst.style.display = totalSgst > 0 ? 'block' : 'none';
        }
        if (billSgstAmount) {
            billSgstAmount.textContent = totalSgst.toFixed(2);
        }
        if (billTax) {
            billTax.style.display = 'block';
        }
        if (billTaxAmount) {
            billTaxAmount.textContent = totalTax.toFixed(2);
        }
    } else {
        if (billSubtotal) {
            billSubtotal.style.display = 'none';
        }
        if (billCgst) {
            billCgst.style.display = 'none';
        }
        if (billSgst) {
            billSgst.style.display = 'none';
        }
        if (billTax) {
            billTax.style.display = 'none';
        }
    }

    if (billTotal) {
        billTotal.textContent = order.total.toFixed(2);
    }

    // Show print bill and print
    if (printBillDiv) {
        printBillDiv.classList.remove('hidden');
        
        // Wait a bit for the content to render, then print
        setTimeout(() => {
            window.print();
            // Hide after print dialog closes (or user cancels)
            setTimeout(() => {
                printBillDiv.classList.add('hidden');
            }, 100);
        }, 100);
    }
}

function printBill() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // Show preview modal first
    showPrintBillPreview();
}

function showPrintBillPreview() {
    // Check if cashier code exists for the current logged-in user
    if (!currentUser) {
        alert('Please login to preview bills!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const loggedInUser = users.find(u => u.id === currentUser.id);
    if (!loggedInUser || !loggedInUser.cashierCode || !loggedInUser.cashierCode.trim()) {
        alert('Cashier code is mandatory for printing bills! Please update your user profile with a cashier code.');
        return;
    }
    
    const modal = document.getElementById('printBillPreviewModal');
    const content = document.getElementById('printBillPreviewContent');
    
    if (!modal || !content) return;
    
    // Get restaurant info
    const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    const restaurantName = restaurantInfo.name || 'Restaurant';
    const restaurantAddress = restaurantInfo.address || '';
    const restaurantGstin = restaurantInfo.gstin || '';
    const restaurantFssai = restaurantInfo.fssai || '';
    const showGstinInBill = restaurantInfo.showGstinInBill !== false; // Default to true if not set
    const showFssaiInBill = restaurantInfo.showFssaiInBill !== false; // Default to true if not set
    
    // Calculate totals
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let itemsHtml = '';
    
    cart.forEach(item => {
        const itemPriceTotal = item.price * item.quantity;
        const totalTaxRate = (item.gstPercentage || 0) + (item.sgstPercentage || 0);
        
        if (item.hasTax && item.priceIncludesTax) {
            // Price includes tax - calculate base price and tax
            const basePrice = itemPriceTotal / (1 + totalTaxRate / 100);
            const totalTax = itemPriceTotal - basePrice;
            subtotal += basePrice;
            
            // Distribute tax proportionally between CGST and SGST
            if (totalTaxRate > 0) {
                if (item.gstPercentage > 0) {
                    totalCgst += (totalTax * item.gstPercentage) / totalTaxRate;
                }
                if (item.sgstPercentage > 0) {
                    totalSgst += (totalTax * item.sgstPercentage) / totalTaxRate;
                }
            }
        } else {
            // Price excludes tax - use price as subtotal and calculate tax separately
            subtotal += itemPriceTotal;
            if (item.hasTax) {
                if (item.gstPercentage > 0) {
                    totalCgst += (itemPriceTotal * item.gstPercentage) / 100;
                }
                if (item.sgstPercentage > 0) {
                    totalSgst += (itemPriceTotal * item.sgstPercentage) / 100;
                }
            }
        }
        
        const taxInfo = [];
        if (item.hasTax && item.gstPercentage > 0) taxInfo.push(`CGST ${item.gstPercentage}%`);
        if (item.hasTax && item.sgstPercentage > 0) taxInfo.push(`SGST ${item.sgstPercentage}%`);
        
        itemsHtml += `
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                <div>
                    <strong>${item.name}</strong>
                    <div style="font-size: 12px; color: #666;">₹${item.price.toFixed(2)} × ${item.quantity}</div>
                    ${taxInfo.length > 0 ? `<div style="font-size: 11px; color: #999;">${taxInfo.join(' + ')}</div>` : ''}
                </div>
                <div style="font-weight: bold;">₹${itemPriceTotal.toFixed(2)}</div>
            </div>
        `;
    });
    
    const totalTax = totalCgst + totalSgst;
    const total = subtotal + totalTax;
    const orderDate = new Date().toLocaleString();
    const customerName = document.getElementById('customerName') ? document.getElementById('customerName').value.trim() : '';
    const previewBillNumber = generateNextBillNumber();
    
    content.innerHTML = `
        <div style="padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h3 style="margin: 0 0 5px 0;">${restaurantName}</h3>
                ${restaurantAddress ? `<p style="margin: 0; color: #666; font-size: 14px;">${restaurantAddress}</p>` : ''}
                ${(restaurantGstin && showGstinInBill) ? `<p style="margin: 0; color: #666; font-size: 12px;">GSTIN: ${restaurantGstin}</p>` : ''}
                ${(restaurantFssai && showFssaiInBill) ? `<p style="margin: 0; color: #666; font-size: 12px;">FSSAI Code: ${restaurantFssai}</p>` : ''}
            </div>
            <div style="border-top: 2px solid #333; border-bottom: 2px solid #333; padding: 15px 0; margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span><strong style="font-size: 16px;">Bill No.:</strong></span>
                    <span style="font-size: 16px; font-weight: bold;">${previewBillNumber.toString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span><strong>Date:</strong></span>
                    <span>${orderDate}</span>
                </div>
                ${customerName ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span><strong>Customer Name:</strong></span>
                    <span>${customerName}</span>
                </div>
                ` : ''}
                ${(() => {
                    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
                    const loggedInUser = users.find(u => u.id === currentUser?.id);
                    return (loggedInUser && loggedInUser.cashierCode && loggedInUser.cashierCode.trim()) ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span><strong>Cashier Code:</strong></span>
                    <span>${loggedInUser.cashierCode}</span>
                </div>
                ` : '';
                })()}
            </div>
            <div style="margin: 20px 0;">
                <h4 style="margin-bottom: 15px;">Items:</h4>
                ${itemsHtml}
            </div>
            ${totalTax > 0 ? `
                <div style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Subtotal:</span>
                        <span>₹${subtotal.toFixed(2)}</span>
                    </div>
                    ${totalCgst > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>CGST:</span>
                        <span>₹${totalCgst.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    ${totalSgst > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>SGST:</span>
                        <span>₹${totalSgst.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Total Tax:</span>
                        <span>₹${totalTax.toFixed(2)}</span>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Update total amount in the footer
    const totalElement = document.getElementById('billPreviewTotal');
    if (totalElement) {
        totalElement.textContent = `Total: ₹${total.toFixed(2)}`;
    }
    
    modal.classList.remove('hidden');
}

function printBillDirect() {
    // Check if cashier code exists for the current logged-in user
    if (!currentUser) {
        alert('Please login to print bills!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const loggedInUser = users.find(u => u.id === currentUser.id);
    if (!loggedInUser || !loggedInUser.cashierCode || !loggedInUser.cashierCode.trim()) {
        alert('Cashier code is mandatory for printing bills! Please update your user profile with a cashier code.');
        return;
    }
    
    const printBillDiv = document.getElementById('printBill');
    const billItemsBody = document.getElementById('billItemsBody');
    const billTotal = document.getElementById('billTotal');
    const billDate = document.getElementById('billDate');
    const billOrderNumber = document.getElementById('billOrderNumber');
    const billRestaurantName = document.getElementById('billRestaurantName');
    const billRestaurantAddress = document.getElementById('billRestaurantAddress');
    const billRestaurantGstin = document.getElementById('billRestaurantGstin');
    const billRestaurantFssai = document.getElementById('billRestaurantFssai');

    // Get restaurant info
    const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    if (billRestaurantName) {
        billRestaurantName.textContent = restaurantInfo.name || 'Restaurant Bill';
    }
    if (billRestaurantAddress) {
        billRestaurantAddress.textContent = restaurantInfo.address || '';
        billRestaurantAddress.style.display = restaurantInfo.address ? 'block' : 'none';
    }
    if (billRestaurantGstin) {
        const showInBill = restaurantInfo.showGstinInBill !== false; // Default to true if not set
        billRestaurantGstin.textContent = restaurantInfo.gstin ? `GSTIN: ${restaurantInfo.gstin}` : '';
        billRestaurantGstin.style.display = (restaurantInfo.gstin && showInBill) ? 'block' : 'none';
    }
    if (billRestaurantFssai) {
        const showInBill = restaurantInfo.showFssaiInBill !== false; // Default to true if not set
        billRestaurantFssai.textContent = restaurantInfo.fssai ? `FSSAI Code: ${restaurantInfo.fssai}` : '';
        billRestaurantFssai.style.display = (restaurantInfo.fssai && showInBill) ? 'block' : 'none';
    }

    // Set order number, customer name, cashier code, and date
    // Generate preview bill number for current cart (before payment confirmation)
    const previewBillNumber = generateNextBillNumber();
    if (billOrderNumber) {
        billOrderNumber.textContent = previewBillNumber.toString();
    }
    const customerName = document.getElementById('customerName') ? document.getElementById('customerName').value.trim() : '';
    if (billCustomerName && billCustomerNameValue) {
        if (customerName) {
            billCustomerNameValue.textContent = customerName;
            billCustomerName.style.display = 'block';
        } else {
            billCustomerName.style.display = 'none';
        }
    }
    // Get cashier code from current logged-in user
    if (billCashierCode && billCashierCodeValue) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const loggedInUser = users.find(u => u.id === currentUser?.id);
        if (loggedInUser && loggedInUser.cashierCode && loggedInUser.cashierCode.trim()) {
            billCashierCodeValue.textContent = loggedInUser.cashierCode;
            billCashierCode.style.display = 'block';
        } else {
            billCashierCode.style.display = 'none';
        }
    }
    if (billDate) {
        billDate.textContent = new Date().toLocaleString();
    }

    // Clear and populate bill items
    if (billItemsBody) {
        billItemsBody.innerHTML = '';
    }
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    cart.forEach(item => {
        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;
        
        // Calculate tax for this item if applicable
        if (item.hasTax) {
            if (item.gstPercentage > 0) {
                totalCgst += (itemSubtotal * item.gstPercentage) / 100;
            }
            if (item.sgstPercentage > 0) {
                totalSgst += (itemSubtotal * item.sgstPercentage) / 100;
            }
        }

        // Create POS format item row
        const itemRow = document.createElement('div');
        itemRow.className = 'pos-item-row';
        
        // Truncate item name if too long for POS printer
        const itemName = item.name.length > 20 ? item.name.substring(0, 17) + '...' : item.name;
        
        itemRow.innerHTML = `
            <span class="pos-item-name"><strong>${itemName}</strong></span>
            <span class="pos-item-price"><strong>₹${item.price.toFixed(2)}</strong></span>
            <span class="pos-item-qty"><strong>${item.quantity}</strong></span>
            <span class="pos-item-total">₹${itemSubtotal.toFixed(2)}</span>
        `;
        if (billItemsBody) {
            billItemsBody.appendChild(itemRow);
        }
    });

    // Show/hide tax section based on whether there's tax
    const billSubtotal = document.getElementById('billSubtotal');
    const billSubtotalAmount = document.getElementById('billSubtotalAmount');
    const billCgst = document.getElementById('billCgst');
    const billCgstAmount = document.getElementById('billCgstAmount');
    const billSgst = document.getElementById('billSgst');
    const billSgstAmount = document.getElementById('billSgstAmount');
    const billTax = document.getElementById('billTax');
    const billTaxAmount = document.getElementById('billTaxAmount');
    
    const totalTax = totalCgst + totalSgst;
    
    if (totalTax > 0) {
        if (billSubtotal) {
            billSubtotal.style.display = 'block';
        }
        if (billSubtotalAmount) {
            billSubtotalAmount.textContent = subtotal.toFixed(2);
        }
        if (billCgst) {
            billCgst.style.display = totalCgst > 0 ? 'block' : 'none';
        }
        if (billCgstAmount) {
            billCgstAmount.textContent = totalCgst.toFixed(2);
        }
        if (billSgst) {
            billSgst.style.display = totalSgst > 0 ? 'block' : 'none';
        }
        if (billSgstAmount) {
            billSgstAmount.textContent = totalSgst.toFixed(2);
        }
        if (billTax) {
            billTax.style.display = 'block';
        }
        if (billTaxAmount) {
            billTaxAmount.textContent = totalTax.toFixed(2);
        }
    } else {
        if (billSubtotal) {
            billSubtotal.style.display = 'none';
        }
        if (billCgst) {
            billCgst.style.display = 'none';
        }
        if (billSgst) {
            billSgst.style.display = 'none';
        }
        if (billTax) {
            billTax.style.display = 'none';
        }
    }

    const total = subtotal + totalTax;
    if (billTotal) {
        billTotal.textContent = total.toFixed(2);
    }

    // Show print bill and print
    if (printBillDiv) {
        printBillDiv.classList.remove('hidden');
        
        // Wait a bit for the content to render, then print
        setTimeout(() => {
            window.print();
            // Hide after print dialog closes (or user cancels)
            setTimeout(() => {
                printBillDiv.classList.add('hidden');
            }, 100);
        }, 100);
    }
}

// Sales Report
function showSalesReport() {
    if (!isAdmin) {
        alert('Only admins can access Sales Report!');
        return;
    }
    document.getElementById('salesReportSection').classList.remove('hidden');
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    document.getElementById('userReportStartDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('userReportEndDate').value = endDate.toISOString().split('T')[0];
    document.getElementById('itemReportStartDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('itemReportEndDate').value = endDate.toISOString().split('T')[0];
    
    // Clear search and hide preview
    const orderSearchInput = document.getElementById('orderSearchInput');
    if (orderSearchInput) {
        orderSearchInput.value = '';
    }
    const reportPreviewSection = document.getElementById('reportPreviewSection');
    if (reportPreviewSection) {
        reportPreviewSection.classList.add('hidden');
    }
    const salesReportContent = document.getElementById('salesReportContent');
    if (salesReportContent) {
        salesReportContent.innerHTML = '';
    }
    
    // Load transaction history
    loadTransactionHistory();
    
    // Load cancelled bills
    loadCancelledBills();
    
    // Switch to first tab (date-range) by default
    switchReportTab('date-range');
}

// Switch between report tabs
function switchReportTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.report-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab contents
    document.querySelectorAll('.report-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to selected tab
    const selectedTab = document.querySelector(`.report-tab[data-tab="${tabName}"]`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Show selected tab content
    const selectedContent = document.getElementById(`tab-${tabName}`);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
    
    // Load data for specific tabs if needed
    if (tabName === 'transactions') {
        loadTransactionHistory();
    } else if (tabName === 'cancelled') {
        loadCancelledBills();
    }
}

function generateSalesReport() {
    const monthSelect = document.getElementById('monthSelect').value;
    if (!monthSelect) {
        alert('Please select a month!');
        return;
    }

    const [year, month] = monthSelect.split('-').map(Number);
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');

    // Filter orders by selected month
    const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate.getFullYear() === year && orderDate.getMonth() + 1 === month;
    });

    // Calculate totals
    let totalRevenue = 0;
    const itemSales = {};

    filteredOrders.forEach(order => {
        totalRevenue += order.total;
        order.items.forEach(item => {
            if (!itemSales[item.name]) {
                itemSales[item.name] = { quantity: 0, revenue: 0 };
            }
            itemSales[item.name].quantity += item.quantity;
            itemSales[item.name].revenue += item.price * item.quantity;
        });
    });

    // Render report
    const reportContent = document.getElementById('salesReportContent');
    reportContent.innerHTML = '';

    if (filteredOrders.length === 0) {
        reportContent.innerHTML = '<p style="text-align: center; color: #999;">No orders found for this month.</p>';
        return;
    }

    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'report-summary';
    summaryDiv.innerHTML = `
        <h3>Summary for ${new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
        <p>Total Orders: ${filteredOrders.length}</p>
        <p>Total Revenue: ₹${totalRevenue.toFixed(2)}</p>
    `;
    reportContent.appendChild(summaryDiv);

    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'report-items';
    itemsDiv.innerHTML = '<h4>Item-wise Sales</h4>';
    
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Item Name</th>
                <th>Quantity Sold</th>
                <th>Revenue</th>
            </tr>
        </thead>
        <tbody>
            ${Object.entries(itemSales).map(([name, data]) => `
                <tr>
                    <td>${name}</td>
                    <td>${data.quantity}</td>
                    <td>₹${data.revenue.toFixed(2)}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    itemsDiv.appendChild(table);
    reportContent.appendChild(itemsDiv);
    
    // Show preview and store report data
    showReportPreview(filteredOrders, itemSales, totalRevenue, startDateFormatted, endDateFormatted);
}

// Store current report data for export
let currentReportData = null;
let currentUserWiseReportData = null;
let currentItemWiseReportData = null;

// Helper function to display report in modal with modern dashboard layout
function showReportInModal(title, htmlContent) {
    const modal = document.getElementById('reportModal');
    const modalTitle = document.getElementById('reportModalTitle');
    const modalContent = document.getElementById('reportModalContent');
    
    modalTitle.textContent = title;
    
    // Create a temporary container to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Extract data from HTML
    const summaryDiv = tempDiv.querySelector('.report-summary');
    const itemsDiv = tempDiv.querySelector('.report-items');
    const transactionsDiv = tempDiv.querySelector('.report-transactions');
    const orderDetails = tempDiv.querySelector('.order-details');
    
    let dashboardHTML = '<div class="report-dashboard-container">';
    
    // Check for empty state messages first
    const emptyStateMatch = htmlContent.match(/No orders found|Order not found/i);
    if (emptyStateMatch && !summaryDiv && !itemsDiv && !transactionsDiv && !orderDetails) {
        dashboardHTML += `<div class="report-empty-state">
            <div class="report-empty-state-icon">📭</div>
            <div class="report-empty-state-text">${htmlContent.replace(/<[^>]*>/g, '')}</div>
        </div>`;
    }
    // If it's an order details view (search order result)
    else if (orderDetails) {
        dashboardHTML += orderDetails.outerHTML;
    } else {
        // Extract metrics from summary
        let metricsHTML = '<div class="report-metrics-grid">';
        let dateRangeHTML = '';
        
        if (summaryDiv) {
            const summaryText = summaryDiv.textContent || summaryDiv.innerText;
            const summaryHTML = summaryDiv.innerHTML;
            
            // Extract date range from h3 or text
            const dateRangeMatch = summaryText.match(/(?:Summary for|Date Range:)\s*(.+?)\s+to\s+(.+?)(?:\n|$)/i) ||
                                   summaryText.match(/(.+?)\s+to\s+(.+?)(?=\s+Total)/i);
            if (dateRangeMatch) {
                dateRangeHTML = `<div class="report-date-range">
                    <p class="report-date-range-text">📅 Report Period: ${dateRangeMatch[1].trim()} to ${dateRangeMatch[2].trim()}</p>
                </div>`;
            } else {
                // Try to get from h3 element
                const h3Element = summaryDiv.querySelector('h3');
                if (h3Element) {
                    const h3Text = h3Element.textContent;
                    const h3DateMatch = h3Text.match(/(.+?)\s+to\s+(.+?)$/i);
                    if (h3DateMatch) {
                        dateRangeHTML = `<div class="report-date-range">
                            <p class="report-date-range-text">📅 Report Period: ${h3DateMatch[1].trim()} to ${h3DateMatch[2].trim()}</p>
                        </div>`;
                    }
                }
            }
            
            // Extract metrics
            const totalOrdersMatch = summaryText.match(/Total Orders:\s*(\d+)/i);
            const totalRevenueMatch = summaryText.match(/Total Revenue:\s*₹?([\d,]+\.?\d*)/i);
            const subtotalMatch = summaryText.match(/Subtotal:\s*₹?([\d,]+\.?\d*)/i);
            const taxMatch = summaryText.match(/CGST\/Tax:\s*₹?([\d,]+\.?\d*)/i);
            const totalUsersMatch = summaryText.match(/Total Users:\s*(\d+)/i);
            const totalItemsMatch = summaryText.match(/Total Items Sold:\s*(\d+)/i);
            
            if (totalOrdersMatch) {
                metricsHTML += `
                    <div class="report-metric-card info">
                        <div class="report-metric-icon">📊</div>
                        <div class="report-metric-label">Total Orders</div>
                        <div class="report-metric-value">${totalOrdersMatch[1]}</div>
                    </div>
                `;
            }
            
            if (totalUsersMatch) {
                metricsHTML += `
                    <div class="report-metric-card info">
                        <div class="report-metric-icon">👥</div>
                        <div class="report-metric-label">Total Users</div>
                        <div class="report-metric-value">${totalUsersMatch[1]}</div>
                    </div>
                `;
            }
            
            if (totalItemsMatch) {
                metricsHTML += `
                    <div class="report-metric-card warning">
                        <div class="report-metric-icon">📦</div>
                        <div class="report-metric-label">Items Sold</div>
                        <div class="report-metric-value">${totalItemsMatch[1]}</div>
                    </div>
                `;
            }
            
            if (subtotalMatch) {
                metricsHTML += `
                    <div class="report-metric-card primary">
                        <div class="report-metric-icon">💰</div>
                        <div class="report-metric-label">Subtotal</div>
                        <div class="report-metric-value">₹${subtotalMatch[1]}</div>
                    </div>
                `;
            }
            
            if (taxMatch) {
                metricsHTML += `
                    <div class="report-metric-card warning">
                        <div class="report-metric-icon">📝</div>
                        <div class="report-metric-label">CGST/Tax</div>
                        <div class="report-metric-value">₹${taxMatch[1]}</div>
                    </div>
                `;
            }
            
            if (totalRevenueMatch) {
                metricsHTML += `
                    <div class="report-metric-card total">
                        <div class="report-metric-icon">💵</div>
                        <div class="report-metric-label">Total Revenue</div>
                        <div class="report-metric-value">₹${totalRevenueMatch[1]}</div>
                    </div>
                `;
            }
        }
        
        metricsHTML += '</div>';
        dashboardHTML += metricsHTML;
        
        // Add date range if available
        if (dateRangeHTML) {
            dashboardHTML += dateRangeHTML;
        }
        
        // Add sections
        if (itemsDiv) {
            const itemsTable = itemsDiv.querySelector('table');
            const itemsTitle = itemsDiv.querySelector('h4');
            const sectionTitle = itemsTitle ? itemsTitle.textContent : 'Item-wise Sales';
            dashboardHTML += `
                <div class="report-section">
                    <div class="report-section-header">
                        <span class="report-section-icon">📦</span>
                        <h3 class="report-section-title">${sectionTitle}</h3>
                    </div>
                    <div class="report-table-wrapper">
                        ${itemsTable ? itemsTable.outerHTML : itemsDiv.innerHTML.replace(/<h4[^>]*>.*?<\/h4>/gi, '')}
                    </div>
                </div>
            `;
        }
        
        if (transactionsDiv) {
            const transactionsTable = transactionsDiv.querySelector('table');
            const transactionsTitle = transactionsDiv.querySelector('h4');
            const sectionTitle = transactionsTitle ? transactionsTitle.textContent : 'Transaction Details';
            dashboardHTML += `
                <div class="report-section">
                    <div class="report-section-header">
                        <span class="report-section-icon">📋</span>
                        <h3 class="report-section-title">${sectionTitle}</h3>
                    </div>
                    <div class="report-table-wrapper">
                        ${transactionsTable ? transactionsTable.outerHTML : transactionsDiv.innerHTML.replace(/<h4[^>]*>.*?<\/h4>/gi, '')}
                    </div>
                </div>
            `;
        }
        
        // Handle user-wise and item-wise reports with nested content
        const userWiseReport = tempDiv.querySelector('.user-wise-report');
        const itemWiseReport = tempDiv.querySelector('.item-wise-report');
        
        if (userWiseReport || itemWiseReport) {
            // These reports already have their own structure, wrap them in sections
            const reportContent = userWiseReport || itemWiseReport;
            const existingSections = reportContent.querySelectorAll('div[style*="margin-top"]');
            
            existingSections.forEach(section => {
                const sectionTitle = section.querySelector('h4, h5');
                if (sectionTitle) {
                    const titleText = sectionTitle.textContent;
                    const tables = section.querySelectorAll('table');
                    
                    dashboardHTML += `
                        <div class="report-section">
                            <div class="report-section-header">
                                <span class="report-section-icon">📊</span>
                                <h3 class="report-section-title">${titleText}</h3>
                            </div>
                            <div class="report-table-wrapper">
                                ${tables.length > 0 ? Array.from(tables).map(t => t.outerHTML).join('') : section.innerHTML.replace(/<h[45][^>]*>.*?<\/h[45]>/gi, '')}
                            </div>
                        </div>
                    `;
                }
            });
        }
        
        // Add any other content that doesn't match our patterns
        const otherContent = tempDiv.innerHTML.trim();
        if (otherContent && !summaryDiv && !itemsDiv && !transactionsDiv && !orderDetails && !userWiseReport && !itemWiseReport) {
            // Check if it's an empty state message
            if (otherContent.includes('No orders found') || otherContent.includes('Order not found')) {
                dashboardHTML += `<div class="report-empty-state">
                    <div class="report-empty-state-icon">📭</div>
                    <div class="report-empty-state-text">${otherContent.replace(/<[^>]*>/g, '')}</div>
                </div>`;
            } else {
                dashboardHTML += `<div class="report-section">${otherContent}</div>`;
            }
        }
    }
    
    dashboardHTML += '</div>';
    
    modalContent.innerHTML = dashboardHTML;
    modal.classList.remove('hidden');
    
    // Scroll to top of modal content
    const modalBody = document.querySelector('.report-modal-body');
    if (modalBody) {
        modalBody.scrollTop = 0;
    }
}

// Store current preview order
let currentPreviewOrder = null;

// Fullscreen functionality for report modal
function toggleReportFullscreen() {
    const modal = document.getElementById('reportModal');
    const modalContent = document.querySelector('.report-modal-content');
    
    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && 
        !document.msFullscreenElement) {
        // Enter fullscreen
        enterFullscreen(modalContent);
    } else {
        // Exit fullscreen
        exitFullscreen();
    }
}

function enterFullscreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    } else {
        // Fallback: Use CSS fullscreen
        document.getElementById('reportModal').classList.add('fullscreen');
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    } else {
        // Fallback: Remove CSS fullscreen class
        document.getElementById('reportModal').classList.remove('fullscreen');
    }
}

function handleFullscreenChange() {
    const modal = document.getElementById('reportModal');
    const fullscreenBtn = document.getElementById('fullscreenReportBtn');
    if (!fullscreenBtn) return;
    
    const fullscreenIcon = fullscreenBtn.querySelector('.fullscreen-icon');
    
    const isFullscreen = !!(document.fullscreenElement || 
                           document.webkitFullscreenElement || 
                           document.mozFullScreenElement || 
                           document.msFullscreenElement);
    
    if (isFullscreen) {
        modal.classList.add('fullscreen');
        fullscreenIcon.textContent = '⛶'; // Fullscreen exit icon
        fullscreenBtn.title = 'Exit Fullscreen';
    } else {
        modal.classList.remove('fullscreen');
        fullscreenIcon.textContent = '⛶'; // Fullscreen enter icon
        fullscreenBtn.title = 'Toggle Fullscreen';
    }
}

// Header Fullscreen functionality
function toggleHeaderFullscreen() {
    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && 
        !document.msFullscreenElement) {
        // Enter fullscreen
        enterHeaderFullscreen();
    } else {
        // Exit fullscreen
        exitHeaderFullscreen();
    }
}

function enterHeaderFullscreen() {
    const element = document.documentElement;
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

function exitHeaderFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

function handleHeaderFullscreenChange() {
    const fullscreenBtn = document.getElementById('headerFullscreenBtn');
    if (!fullscreenBtn) return;
    
    const fullscreenIcon = fullscreenBtn.querySelector('.fullscreen-icon');
    if (!fullscreenIcon) return;
    
    const isFullscreen = !!(document.fullscreenElement || 
                           document.webkitFullscreenElement || 
                           document.mozFullScreenElement || 
                           document.msFullscreenElement);
    
    if (isFullscreen) {
        fullscreenIcon.textContent = '⛶'; // Fullscreen exit icon (could use different icon)
        fullscreenBtn.title = 'Exit Fullscreen';
    } else {
        fullscreenIcon.textContent = '⛶'; // Fullscreen enter icon
        fullscreenBtn.title = 'Toggle Fullscreen';
    }
}

function showReportPreview(orders, itemSales, totalRevenue, startDate, endDate, totalSubtotal = 0, totalTax = 0) {
    const previewSection = document.getElementById('reportPreviewSection');
    const previewContent = document.getElementById('reportPreviewContent');
    
    // Return early if elements don't exist
    if (!previewSection || !previewContent) {
        console.warn('Report preview elements not found');
        return;
    }
    
    // Calculate totals if not provided
    if (totalSubtotal === 0 && totalTax === 0) {
        totalSubtotal = orders.reduce((sum, order) => sum + (order.subtotal || order.total || 0), 0);
        totalTax = orders.reduce((sum, order) => sum + (order.tax || 0), 0);
    }
    
    // Store report data for export
    currentReportData = {
        orders: orders,
        itemSales: itemSales,
        totalRevenue: totalRevenue,
        totalSubtotal: totalSubtotal,
        totalTax: totalTax,
        startDate: startDate,
        endDate: endDate
    };
    
    // Create preview content
    previewContent.innerHTML = '';
    
    const previewDiv = document.createElement('div');
    previewDiv.className = 'report-preview-content';
    previewDiv.innerHTML = `
        <div class="preview-summary">
            <h4>Sales Report: ${startDate} to ${endDate}</h4>
            <p><strong>Total Orders:</strong> ${orders.length}</p>
            <p><strong>Subtotal:</strong> ₹${totalSubtotal.toFixed(2)}</p>
            <p><strong>CGST/Tax:</strong> ₹${totalTax.toFixed(2)}</p>
            <p><strong>Total Revenue:</strong> ₹${totalRevenue.toFixed(2)}</p>
        </div>
        <div class="preview-table">
            <h5 style="margin-top: 20px;">Item-wise Sales</h5>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f0f0f0;">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Item Name</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Quantity Sold</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(itemSales).map(([name, data]) => `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;">${name}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${data.quantity}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${data.revenue.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr style="background-color: #f0f0f0; font-weight: bold;">
                        <td style="padding: 10px; border: 1px solid #ddd;" colspan="2">Subtotal</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${totalSubtotal.toFixed(2)}</td>
                    </tr>
                    <tr style="background-color: #f0f0f0; font-weight: bold;">
                        <td style="padding: 10px; border: 1px solid #ddd;" colspan="2">CGST/Tax</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${totalTax.toFixed(2)}</td>
                    </tr>
                    <tr style="background-color: #f0f0f0; font-weight: bold;">
                        <td style="padding: 10px; border: 1px solid #ddd;" colspan="2">Total Revenue</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${totalRevenue.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        <div class="preview-transactions" style="margin-top: 30px;">
            <h5>Transaction Details</h5>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f0f0f0;">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Order #</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Date & Time</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Items</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Subtotal</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">CGST/Tax</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => {
                        const orderDate = new Date(order.date).toLocaleString();
                        const itemsList = order.items.map(item => `${item.name} (${item.quantity}x)`).join(', ');
                        const orderSubtotal = order.subtotal || order.total || 0;
                        const orderTax = order.tax || 0;
                        return `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">${order.id}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${orderDate}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${itemsList}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${orderSubtotal.toFixed(2)}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${orderTax.toFixed(2)}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;"><strong>₹${order.total.toFixed(2)}</strong></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr style="background-color: #f0f0f0; font-weight: bold;">
                        <td style="padding: 10px; border: 1px solid #ddd;" colspan="3">Grand Total</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${totalSubtotal.toFixed(2)}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${totalTax.toFixed(2)}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${totalRevenue.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
    
    previewContent.appendChild(previewDiv);
    previewSection.classList.remove('hidden');
}

function generateDateRangeReport() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates!');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('Start date must be before end date!');
        return;
    }
    
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    
    // Filter orders by date range
    const filteredOrders = orders.filter(order => {
        try {
            const orderDate = new Date(order.date);
            
            // Parse start and end dates (YYYY-MM-DD format from input)
            const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
            const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
            
            // Create date objects in local timezone
            const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
            const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
            
            // Compare dates
            return orderDate >= start && orderDate <= end;
        } catch (error) {
            console.error('Error filtering order:', error, order);
            return false;
        }
    });
    
    // Calculate totals with CGST
    let totalRevenue = 0;
    let totalSubtotal = 0;
    let totalTax = 0;
    const itemSales = {};
    
    filteredOrders.forEach(order => {
        totalRevenue += order.total || 0;
        totalSubtotal += order.subtotal || order.total || 0;
        totalTax += order.tax || 0;
        order.items.forEach(item => {
            if (!itemSales[item.name]) {
                itemSales[item.name] = { quantity: 0, revenue: 0 };
            }
            itemSales[item.name].quantity += item.quantity;
            itemSales[item.name].revenue += item.price * item.quantity;
        });
    });
    
    // Check if no orders found
    if (filteredOrders.length === 0) {
        showReportInModal('Date Range Report', '<p style="text-align: center; color: #999; padding: 40px; font-size: 18px;">No orders found for the selected date range.</p>');
        currentReportData = null;
        return;
    }
    
    // Prepare report HTML
    const startDateFormatted = new Date(startDate).toLocaleDateString();
    const endDateFormatted = new Date(endDate).toLocaleDateString();
    
    let reportHTML = `
        <div class="report-summary">
            <h3>Summary for ${startDateFormatted} to ${endDateFormatted}</h3>
            <p>Total Orders: ${filteredOrders.length}</p>
            <p>Subtotal: ₹${totalSubtotal.toFixed(2)}</p>
            <p>CGST/Tax: ₹${totalTax.toFixed(2)}</p>
            <p><strong>Total Revenue: ₹${totalRevenue.toFixed(2)}</strong></p>
        </div>
        
        <div class="report-items">
            <h4>Item-wise Sales</h4>
            <table>
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Quantity Sold</th>
                        <th>Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(itemSales).map(([name, data]) => `
                        <tr>
                            <td>${name}</td>
                            <td>${data.quantity}</td>
                            <td>₹${data.revenue.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="report-transactions" style="margin-top: 30px;">
            <h4>Transaction Details</h4>
            <table style="width: 100%; margin-top: 10px;">
                <thead>
                    <tr>
                        <th>Order #</th>
                        <th>Date & Time</th>
                        <th>Items</th>
                        <th>Subtotal</th>
                        <th>CGST/Tax</th>
                        <th>Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredOrders.map(order => {
                        const orderDate = new Date(order.date).toLocaleString();
                        const itemsList = order.items.map(item => `${item.name} (${item.quantity}x)`).join(', ');
                        const orderSubtotal = order.subtotal || order.total || 0;
                        const orderTax = order.tax || 0;
                        return `
                            <tr>
                                <td>${order.id}</td>
                                <td>${orderDate}</td>
                                <td>${itemsList}</td>
                                <td>₹${orderSubtotal.toFixed(2)}</td>
                                <td>₹${orderTax.toFixed(2)}</td>
                                <td><strong>₹${order.total.toFixed(2)}</strong></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3">Grand Total</td>
                        <td>₹${totalSubtotal.toFixed(2)}</td>
                        <td>₹${totalTax.toFixed(2)}</td>
                        <td><strong>₹${totalRevenue.toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
    
    // Store report data for export
    currentReportData = {
        orders: filteredOrders,
        itemSales: itemSales,
        totalRevenue: totalRevenue,
        totalSubtotal: totalSubtotal,
        totalTax: totalTax,
        startDate: startDateFormatted,
        endDate: endDateFormatted
    };
    
    // Display report in modal
    showReportInModal('Date Range Report', reportHTML);
}

function exportToPDF() {
    if (!currentReportData) {
        alert('No report data available. Please generate a report first.');
        return;
    }
    
    // Get restaurant info for header
    const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    const restaurantName = restaurantInfo.name || 'Restaurant';
    const restaurantAddress = restaurantInfo.address || '';
    
    // Create PDF content
    const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sales Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { margin: 0; }
                .summary { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #000; padding: 10px; text-align: left; }
                th { background-color: #f0f0f0; }
                .total-row { font-weight: bold; background-color: #f0f0f0; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${restaurantName}</h1>
                ${restaurantAddress ? `<p>${restaurantAddress}</p>` : ''}
                <h2>Sales Report</h2>
                <p>${currentReportData.startDate} to ${currentReportData.endDate}</p>
            </div>
            <div class="summary">
                <p><strong>Total Orders:</strong> ${currentReportData.orders.length}</p>
                <p><strong>Total Revenue:</strong> ₹${currentReportData.totalRevenue.toFixed(2)}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th class="text-center">Quantity Sold</th>
                        <th class="text-right">Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(currentReportData.itemSales).map(([name, data]) => `
                        <tr>
                            <td>${name}</td>
                            <td class="text-center">${data.quantity}</td>
                            <td class="text-right">₹${data.revenue.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="2"><strong>Subtotal</strong></td>
                        <td class="text-right"><strong>₹${(currentReportData.totalSubtotal || currentReportData.totalRevenue || 0).toFixed(2)}</strong></td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="2"><strong>CGST/Tax</strong></td>
                        <td class="text-right"><strong>₹${(currentReportData.totalTax || 0).toFixed(2)}</strong></td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="2"><strong>Total Revenue</strong></td>
                        <td class="text-right"><strong>₹${currentReportData.totalRevenue.toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
            <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
                <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
    `;
    
    // Open in new window and print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

function exportToExcel() {
    if (!currentReportData) {
        alert('No report data available. Please generate a report first.');
        return;
    }
    
    // Get restaurant info for header
    const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    const restaurantName = restaurantInfo.name || 'Restaurant';
    
    // Get cancelled orders for the same date range
    const cancelledOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.CANCELLED_ORDERS) || '[]');
    const [startYear, startMonth, startDay] = currentReportData.startDate.split('/').map(Number);
    const [endYear, endMonth, endDay] = currentReportData.endDate.split('/').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
    
    const filteredCancelledOrders = cancelledOrders.filter(order => {
        try {
            const orderDate = new Date(order.date);
            return orderDate >= start && orderDate <= end;
        } catch (error) {
            return false;
        }
    });
    
    // Create CSV content for Sales Report (Sheet 1)
    let csvContent = '\uFEFF'; // BOM for UTF-8
    
    // Header
    csvContent += `${restaurantName}\n`;
    csvContent += `Sales Report\n`;
    csvContent += `${currentReportData.startDate} to ${currentReportData.endDate}\n`;
    csvContent += `\n`;
    csvContent += `Total Orders,${currentReportData.orders.length}\n`;
    csvContent += `Subtotal,₹${(currentReportData.totalSubtotal || currentReportData.totalRevenue || 0).toFixed(2)}\n`;
    csvContent += `CGST/Tax,₹${(currentReportData.totalTax || 0).toFixed(2)}\n`;
    csvContent += `Total Revenue,₹${currentReportData.totalRevenue.toFixed(2)}\n`;
    csvContent += `\n`;
    
    // Item-wise Sales Section
    csvContent += `ITEM-WISE SALES\n`;
    csvContent += `Item Name,Quantity Sold,Revenue\n`;
    
    // Table data
    Object.entries(currentReportData.itemSales).forEach(([name, data]) => {
        csvContent += `"${name}",${data.quantity},₹${data.revenue.toFixed(2)}\n`;
    });
    
    // Total rows
    csvContent += `Subtotal,,₹${(currentReportData.totalSubtotal || currentReportData.totalRevenue || 0).toFixed(2)}\n`;
    csvContent += `CGST/Tax,,₹${(currentReportData.totalTax || 0).toFixed(2)}\n`;
    csvContent += `Total Revenue,,₹${currentReportData.totalRevenue.toFixed(2)}\n`;
    csvContent += `\n`;
    
    // Transaction Details Section
    csvContent += `TRANSACTION DETAILS\n`;
    csvContent += `Order #,Date & Time,Payment Method,Items,Subtotal,CGST/Tax,Total Amount\n`;
    
    // Transaction data
    currentReportData.orders.forEach(order => {
        const orderDate = new Date(order.date).toLocaleString();
        const itemsList = order.items.map(item => `${item.name} (${item.quantity}x)`).join('; ');
        const paymentMethod = order.paymentMethod || 'N/A';
        const paymentMethodLabel = paymentMethod === 'gpay' ? 'GPay' : paymentMethod === 'cash' ? 'Cash' : paymentMethod;
        const orderSubtotal = order.subtotal || order.total || 0;
        const orderTax = order.tax || 0;
        csvContent += `${order.id},"${orderDate}","${paymentMethodLabel}","${itemsList}",₹${orderSubtotal.toFixed(2)},₹${orderTax.toFixed(2)},₹${order.total.toFixed(2)}\n`;
    });
    
    // Create blob and download Sales Report
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = `Sales_Report_${currentReportData.startDate.replace(/\//g, '-')}_to_${currentReportData.endDate.replace(/\//g, '-')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Create separate CSV for Cancelled Bills (Sheet 2)
    if (filteredCancelledOrders.length > 0) {
        let cancelledCsvContent = '\uFEFF'; // BOM for UTF-8
        
        cancelledCsvContent += `${restaurantName}\n`;
        cancelledCsvContent += `Cancelled Bills Report\n`;
        cancelledCsvContent += `${currentReportData.startDate} to ${currentReportData.endDate}\n`;
        cancelledCsvContent += `\n`;
        cancelledCsvContent += `Total Cancelled Orders,${filteredCancelledOrders.length}\n`;
        
        let cancelledTotal = 0;
        filteredCancelledOrders.forEach(order => {
            cancelledTotal += order.total;
        });
        cancelledCsvContent += `Total Cancelled Amount,₹${cancelledTotal.toFixed(2)}\n`;
        cancelledCsvContent += `\n`;
        
        // Cancelled Bills Details
        cancelledCsvContent += `CANCELLED BILLS DETAILS\n`;
        cancelledCsvContent += `Order #,Original Date,Payment Method,Cancelled Date,Cancelled By,Items,Total Amount\n`;
        
        filteredCancelledOrders.forEach(order => {
            const orderDate = new Date(order.date).toLocaleString();
            const cancelledDate = order.cancelledDate ? new Date(order.cancelledDate).toLocaleString() : 'N/A';
            const cancelledBy = order.cancelledBy || 'Admin';
            const itemsList = order.items.map(item => `${item.name} (${item.quantity}x)`).join('; ');
            const paymentMethod = order.paymentMethod || 'N/A';
            const paymentMethodLabel = paymentMethod === 'gpay' ? 'GPay' : paymentMethod === 'cash' ? 'Cash' : paymentMethod;
            cancelledCsvContent += `${order.id},"${orderDate}","${paymentMethodLabel}","${cancelledDate}","${cancelledBy}","${itemsList}",₹${order.total.toFixed(2)}\n`;
        });
        
        // Download cancelled bills CSV
        const cancelledBlob = new Blob([cancelledCsvContent], { type: 'text/csv;charset=utf-8;' });
        const cancelledLink = document.createElement('a');
        const cancelledUrl = URL.createObjectURL(cancelledBlob);
        
        const cancelledFileName = `Cancelled_Bills_${currentReportData.startDate.replace(/\//g, '-')}_to_${currentReportData.endDate.replace(/\//g, '-')}.csv`;
        cancelledLink.setAttribute('href', cancelledUrl);
        cancelledLink.setAttribute('download', cancelledFileName);
        cancelledLink.style.visibility = 'hidden';
        document.body.appendChild(cancelledLink);
        cancelledLink.click();
        document.body.removeChild(cancelledLink);
    }
}

function generateUserWiseReport() {
    const startDate = document.getElementById('userReportStartDate').value;
    const endDate = document.getElementById('userReportEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates!');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('Start date must be before end date!');
        return;
    }
    
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    
    // Filter orders by date range
    const filteredOrders = orders.filter(order => {
        try {
            const orderDate = new Date(order.date);
            const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
            const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
            
            const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
            const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
            
            return orderDate >= start && orderDate <= end;
        } catch (error) {
            console.error('Error filtering order:', error, order);
            return false;
        }
    });
    
    if (filteredOrders.length === 0) {
        showReportInModal('User-Wise Report', '<p style="text-align: center; color: #999; padding: 40px; font-size: 18px;">No orders found for the selected date range.</p>');
        return;
    }
    
    // Group orders by user
    const userWiseData = {};
    
    filteredOrders.forEach(order => {
        const username = order.username || 'Guest';
        const userId = order.userId || 'guest';
        
        if (!userWiseData[username]) {
            userWiseData[username] = {
                userId: userId,
                username: username,
                orders: [],
                totalOrders: 0,
                totalRevenue: 0,
                totalTax: 0,
                totalSubtotal: 0
            };
        }
        
        userWiseData[username].orders.push(order);
        userWiseData[username].totalOrders += 1;
        userWiseData[username].totalRevenue += order.total || 0;
        userWiseData[username].totalTax += order.tax || 0;
        userWiseData[username].totalSubtotal += order.subtotal || order.total || 0;
    });
    
    const startDateFormatted = new Date(startDate).toLocaleDateString();
    const endDateFormatted = new Date(endDate).toLocaleDateString();
    
    let reportHtml = `
        <div class="report-summary">
            <h3>User-Wise Sales Report</h3>
            <p><strong>Date Range:</strong> ${startDateFormatted} to ${endDateFormatted}</p>
            <p><strong>Total Users:</strong> ${Object.keys(userWiseData).length}</p>
        </div>
    `;
    
    // Create table for user-wise summary
    let summaryTable = `
        <div style="margin-top: 20px;">
            <h4>User Summary</h4>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background-color: #f0f0f0;">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">User</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Total Orders</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Subtotal</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Tax</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total Revenue</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Sort users by total revenue (descending)
    const sortedUsers = Object.values(userWiseData).sort((a, b) => b.totalRevenue - a.totalRevenue);
    
    sortedUsers.forEach(userData => {
        summaryTable += `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>${userData.username}</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${userData.totalOrders}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${userData.totalSubtotal.toFixed(2)}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${userData.totalTax.toFixed(2)}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${userData.totalRevenue.toFixed(2)}</td>
            </tr>
        `;
    });
    
    // Add total row
    const grandTotalOrders = sortedUsers.reduce((sum, u) => sum + u.totalOrders, 0);
    const grandTotalSubtotal = sortedUsers.reduce((sum, u) => sum + u.totalSubtotal, 0);
    const grandTotalTax = sortedUsers.reduce((sum, u) => sum + u.totalTax, 0);
    const grandTotalRevenue = sortedUsers.reduce((sum, u) => sum + u.totalRevenue, 0);
    
    summaryTable += `
                </tbody>
                <tfoot>
                    <tr style="background-color: #f0f0f0; font-weight: bold;">
                        <td style="padding: 10px; border: 1px solid #ddd;">Grand Total</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${grandTotalOrders}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${grandTotalSubtotal.toFixed(2)}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${grandTotalTax.toFixed(2)}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${grandTotalRevenue.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
    
    // Add detailed breakdown by user
    reportHtml += summaryTable;
    
    reportHtml += `
        <div style="margin-top: 30px;">
            <h4>Detailed Breakdown by User</h4>
    `;
    
    sortedUsers.forEach(userData => {
        reportHtml += `
            <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px; border: 1px solid #ddd;">
                <h5 style="margin-top: 0; color: #333;">${userData.username} - ${userData.totalOrders} Order(s)</h5>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #e8e8e8;">
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Order #</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Date</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">User</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Payment</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Subtotal</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Tax</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Sort orders by date (newest first)
        const sortedUserOrders = userData.orders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedUserOrders.forEach(order => {
            const orderDate = new Date(order.date).toLocaleString();
            const paymentMethod = order.paymentMethod || 'N/A';
            const paymentMethodLabel = paymentMethod === 'gpay' ? 'GPay' : paymentMethod === 'cash' ? 'Cash' : paymentMethod;
            const orderSubtotal = order.subtotal || order.total || 0;
            const orderTax = order.tax || 0;
            const orderUser = order.username || 'Guest';
            
            reportHtml += `
                <tr>
                    <td style="padding: 6px; border: 1px solid #ddd;">${order.id}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${orderDate}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;"><strong>${orderUser}</strong></td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${paymentMethodLabel}</td>
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">₹${orderSubtotal.toFixed(2)}</td>
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">₹${orderTax.toFixed(2)}</td>
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${order.total.toFixed(2)}</td>
                </tr>
            `;
        });
        
        reportHtml += `
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #e8e8e8; font-weight: bold;">
                            <td style="padding: 8px; border: 1px solid #ddd;" colspan="4">Subtotal for ${userData.username}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${userData.totalSubtotal.toFixed(2)}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${userData.totalTax.toFixed(2)}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${userData.totalRevenue.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    });
    
    reportHtml += `</div>`;
    
    // Store user-wise report data for export
    currentUserWiseReportData = {
        userWiseData: userWiseData,
        sortedUsers: sortedUsers,
        filteredOrders: filteredOrders,
        startDate: startDate,
        endDate: endDate,
        startDateFormatted: startDateFormatted,
        endDateFormatted: endDateFormatted,
        grandTotalOrders: sortedUsers.reduce((sum, u) => sum + u.totalOrders, 0),
        grandTotalSubtotal: sortedUsers.reduce((sum, u) => sum + u.totalSubtotal, 0),
        grandTotalTax: sortedUsers.reduce((sum, u) => sum + u.totalTax, 0),
        grandTotalRevenue: sortedUsers.reduce((sum, u) => sum + u.totalRevenue, 0)
    };
    
    // Display report in modal
    showReportInModal('User-Wise Report', reportHtml);
}

function exportUserWiseReportToPDF() {
    if (!currentUserWiseReportData) {
        alert('No user-wise report data available. Please generate a report first.');
        return;
    }
    
    // Get restaurant info for header
    const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    const restaurantName = restaurantInfo.name || 'Restaurant';
    const restaurantAddress = restaurantInfo.address || '';
    
    const { sortedUsers, startDateFormatted, endDateFormatted, grandTotalOrders, grandTotalSubtotal, grandTotalTax, grandTotalRevenue } = currentUserWiseReportData;
    
    // Create PDF content
    let pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>User-Wise Sales Report</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    font-size: 12px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 10px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 18px;
                }
                .header p {
                    margin: 5px 0;
                    color: #666;
                }
                .summary {
                    margin: 20px 0;
                    padding: 10px;
                    background: #f0f0f0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                }
                .text-center {
                    text-align: center;
                }
                .text-right {
                    text-align: right;
                }
                .user-section {
                    margin: 20px 0;
                    page-break-inside: avoid;
                }
                .user-header {
                    background: #e8e8e8;
                    padding: 10px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${restaurantName}</h1>
                ${restaurantAddress ? `<p>${restaurantAddress}</p>` : ''}
                <h2>User-Wise Sales Report</h2>
                <p>${startDateFormatted} to ${endDateFormatted}</p>
            </div>
            <div class="summary">
                <p><strong>Total Users:</strong> ${sortedUsers.length}</p>
                <p><strong>Total Orders:</strong> ${grandTotalOrders}</p>
                <p><strong>Total Revenue:</strong> ₹${grandTotalRevenue.toFixed(2)}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>User</th>
                        <th class="text-center">Total Orders</th>
                        <th class="text-right">Subtotal</th>
                        <th class="text-right">Tax</th>
                        <th class="text-right">Total Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedUsers.map(userData => `
                        <tr>
                            <td><strong>${userData.username}</strong></td>
                            <td class="text-center">${userData.totalOrders}</td>
                            <td class="text-right">₹${userData.totalSubtotal.toFixed(2)}</td>
                            <td class="text-right">₹${userData.totalTax.toFixed(2)}</td>
                            <td class="text-right"><strong>₹${userData.totalRevenue.toFixed(2)}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td><strong>Grand Total</strong></td>
                        <td class="text-center"><strong>${grandTotalOrders}</strong></td>
                        <td class="text-right"><strong>₹${grandTotalSubtotal.toFixed(2)}</strong></td>
                        <td class="text-right"><strong>₹${grandTotalTax.toFixed(2)}</strong></td>
                        <td class="text-right"><strong>₹${grandTotalRevenue.toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
            ${sortedUsers.map(userData => {
                const sortedUserOrders = userData.orders.sort((a, b) => new Date(b.date) - new Date(a.date));
                return `
                    <div class="user-section">
                        <div class="user-header">${userData.username} - ${userData.totalOrders} Order(s)</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Date</th>
                                    <th>User</th>
                                    <th>Payment</th>
                                    <th class="text-right">Subtotal</th>
                                    <th class="text-right">Tax</th>
                                    <th class="text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sortedUserOrders.map(order => {
                                    const orderDate = new Date(order.date).toLocaleString();
                                    const paymentMethod = order.paymentMethod || 'N/A';
                                    const paymentMethodLabel = paymentMethod === 'gpay' ? 'GPay' : paymentMethod === 'cash' ? 'Cash' : paymentMethod;
                                    const orderSubtotal = order.subtotal || order.total || 0;
                                    const orderTax = order.tax || 0;
                                    const orderUser = order.username || 'Guest';
                                    return `
                                        <tr>
                                            <td>${order.id}</td>
                                            <td>${orderDate}</td>
                                            <td><strong>${orderUser}</strong></td>
                                            <td>${paymentMethodLabel}</td>
                                            <td class="text-right">₹${orderSubtotal.toFixed(2)}</td>
                                            <td class="text-right">₹${orderTax.toFixed(2)}</td>
                                            <td class="text-right"><strong>₹${order.total.toFixed(2)}</strong></td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="4"><strong>Subtotal for ${userData.username}</strong></td>
                                    <td class="text-right"><strong>₹${userData.totalSubtotal.toFixed(2)}</strong></td>
                                    <td class="text-right"><strong>₹${userData.totalTax.toFixed(2)}</strong></td>
                                    <td class="text-right"><strong>₹${userData.totalRevenue.toFixed(2)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                `;
            }).join('')}
            <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
                <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
    `;
    
    // Open in new window and print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

function exportUserWiseReportToCSV() {
    if (!currentUserWiseReportData) {
        alert('No user-wise report data available. Please generate a report first.');
        return;
    }
    
    // Get restaurant info for header
    const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    const restaurantName = restaurantInfo.name || 'Restaurant';
    
    const { sortedUsers, startDateFormatted, endDateFormatted, grandTotalOrders, grandTotalSubtotal, grandTotalTax, grandTotalRevenue } = currentUserWiseReportData;
    
    // Create CSV content
    let csvContent = '\uFEFF'; // BOM for UTF-8
    
    // Header
    csvContent += `${restaurantName}\n`;
    csvContent += `User-Wise Sales Report\n`;
    csvContent += `${startDateFormatted} to ${endDateFormatted}\n`;
    csvContent += `\n`;
    csvContent += `Total Users,${sortedUsers.length}\n`;
    csvContent += `Total Orders,${grandTotalOrders}\n`;
    csvContent += `Total Revenue,₹${grandTotalRevenue.toFixed(2)}\n`;
    csvContent += `\n`;
    
    // User Summary Section
    csvContent += `USER SUMMARY\n`;
    csvContent += `User,Total Orders,Subtotal,Tax,Total Revenue\n`;
    
    sortedUsers.forEach(userData => {
        csvContent += `"${userData.username}",${userData.totalOrders},₹${userData.totalSubtotal.toFixed(2)},₹${userData.totalTax.toFixed(2)},₹${userData.totalRevenue.toFixed(2)}\n`;
    });
    
    // Grand Total
    csvContent += `Grand Total,${grandTotalOrders},₹${grandTotalSubtotal.toFixed(2)},₹${grandTotalTax.toFixed(2)},₹${grandTotalRevenue.toFixed(2)}\n`;
    csvContent += `\n`;
    
    // Detailed Breakdown by User
    csvContent += `DETAILED BREAKDOWN BY USER\n`;
    csvContent += `\n`;
    
    sortedUsers.forEach(userData => {
        csvContent += `${userData.username} - ${userData.totalOrders} Order(s)\n`;
        csvContent += `Order #,Date & Time,User,Payment Method,Subtotal,Tax,Total Amount\n`;
        
        // Sort orders by date (newest first)
        const sortedUserOrders = userData.orders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedUserOrders.forEach(order => {
            const orderDate = new Date(order.date).toLocaleString();
            const paymentMethod = order.paymentMethod || 'N/A';
            const paymentMethodLabel = paymentMethod === 'gpay' ? 'GPay' : paymentMethod === 'cash' ? 'Cash' : paymentMethod;
            const orderSubtotal = order.subtotal || order.total || 0;
            const orderTax = order.tax || 0;
            const orderUser = order.username || 'Guest';
            csvContent += `${order.id},"${orderDate}","${orderUser}","${paymentMethodLabel}",₹${orderSubtotal.toFixed(2)},₹${orderTax.toFixed(2)},₹${order.total.toFixed(2)}\n`;
        });
        
        // User subtotal
        csvContent += `Subtotal for ${userData.username},,,,₹${userData.totalSubtotal.toFixed(2)},₹${userData.totalTax.toFixed(2)},₹${userData.totalRevenue.toFixed(2)}\n`;
        csvContent += `\n`;
    });
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = `User_Wise_Report_${startDateFormatted.replace(/\//g, '-')}_to_${endDateFormatted.replace(/\//g, '-')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generateItemWiseReport() {
    const startDate = document.getElementById('itemReportStartDate').value;
    const endDate = document.getElementById('itemReportEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates!');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('Start date must be before end date!');
        return;
    }
    
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    
    // Filter orders by date range
    const filteredOrders = orders.filter(order => {
        try {
            const orderDate = new Date(order.date);
            const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
            const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
            
            const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
            const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
            
            return orderDate >= start && orderDate <= end;
        } catch (error) {
            console.error('Error filtering order:', error, order);
            return false;
        }
    });
    
    if (filteredOrders.length === 0) {
        showReportInModal('Item-Wise Report', '<p style="text-align: center; color: #999; padding: 40px; font-size: 18px;">No orders found for the selected date range.</p>');
        return;
    }
    
    // Calculate item-wise sales with daily breakdown
    const itemSales = {};
    const itemDailySales = {}; // Track daily sales for each item
    let totalRevenue = 0;
    let totalQuantity = 0;
    
    filteredOrders.forEach(order => {
        totalRevenue += order.total || 0;
        const orderDate = new Date(order.date);
        const dateKey = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        order.items.forEach(item => {
            if (!itemSales[item.name]) {
                itemSales[item.name] = {
                    quantity: 0,
                    revenue: 0,
                    orders: 0,
                    averagePrice: 0
                };
                itemDailySales[item.name] = {};
            }
            
            // Update totals
            itemSales[item.name].quantity += item.quantity;
            itemSales[item.name].revenue += item.price * item.quantity;
            itemSales[item.name].orders += 1;
            totalQuantity += item.quantity;
            
            // Track daily sales
            if (!itemDailySales[item.name][dateKey]) {
                itemDailySales[item.name][dateKey] = {
                    quantity: 0,
                    revenue: 0
                };
            }
            itemDailySales[item.name][dateKey].quantity += item.quantity;
            itemDailySales[item.name][dateKey].revenue += item.price * item.quantity;
        });
    });
    
    // Calculate average price for each item
    Object.keys(itemSales).forEach(itemName => {
        if (itemSales[itemName].quantity > 0) {
            itemSales[itemName].averagePrice = itemSales[itemName].revenue / itemSales[itemName].quantity;
        }
    });
    
    const startDateFormatted = new Date(startDate).toLocaleDateString();
    const endDateFormatted = new Date(endDate).toLocaleDateString();
    
    let reportHtml = `
        <div class="report-summary">
            <h3>Item-Wise Sales Report</h3>
            <p><strong>Date Range:</strong> ${startDateFormatted} to ${endDateFormatted}</p>
            <p><strong>Total Orders:</strong> ${filteredOrders.length}</p>
            <p><strong>Total Items Sold:</strong> ${totalQuantity}</p>
            <p><strong>Total Revenue:</strong> ₹${totalRevenue.toFixed(2)}</p>
        </div>
    `;
    
    // Create table for item-wise summary
    let summaryTable = `
        <div style="margin-top: 20px;">
            <h4>Item Summary</h4>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background-color: #f0f0f0;">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Item Name</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Quantity Sold</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Average Price</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total Revenue</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Orders</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Sort items by revenue (descending)
    const sortedItems = Object.entries(itemSales).sort((a, b) => b[1].revenue - a[1].revenue);
    
    sortedItems.forEach(([itemName, data]) => {
        summaryTable += `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>${itemName}</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${data.quantity}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${data.averagePrice.toFixed(2)}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${data.revenue.toFixed(2)}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${data.orders}</td>
            </tr>
        `;
    });
    
    // Add total row
    summaryTable += `
                </tbody>
                <tfoot>
                    <tr style="background-color: #f0f0f0; font-weight: bold;">
                        <td style="padding: 10px; border: 1px solid #ddd;">Grand Total</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${totalQuantity}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">-</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${totalRevenue.toFixed(2)}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${filteredOrders.length}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
    
    reportHtml += summaryTable;
    
    // Add daily breakdown section
    reportHtml += `
        <div style="margin-top: 30px;">
            <h4>Daily Breakdown by Item</h4>
    `;
    
    sortedItems.forEach(([itemName, data]) => {
        const dailyData = itemDailySales[itemName];
        const sortedDates = Object.keys(dailyData).sort();
        
        if (sortedDates.length === 0) return;
        
        reportHtml += `
            <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px; border: 1px solid #ddd;">
                <h5 style="margin-top: 0; color: #333;">${itemName} - Daily Sales</h5>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #e8e8e8;">
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Date</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Quantity</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        sortedDates.forEach(dateKey => {
            const dateObj = new Date(dateKey);
            const dateFormatted = dateObj.toLocaleDateString();
            const dayData = dailyData[dateKey];
            
            reportHtml += `
                <tr>
                    <td style="padding: 6px; border: 1px solid #ddd;">${dateFormatted}</td>
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${dayData.quantity}</td>
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${dayData.revenue.toFixed(2)}</td>
                </tr>
            `;
        });
        
        reportHtml += `
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #e8e8e8; font-weight: bold;">
                            <td style="padding: 8px; border: 1px solid #ddd;">Total for ${itemName}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${data.quantity}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${data.revenue.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    });
    
    reportHtml += `</div>`;
    
    // Store item-wise report data for export
    currentItemWiseReportData = {
        itemSales: itemSales,
        itemDailySales: itemDailySales,
        sortedItems: sortedItems,
        filteredOrders: filteredOrders,
        startDate: startDate,
        endDate: endDate,
        startDateFormatted: startDateFormatted,
        endDateFormatted: endDateFormatted,
        totalRevenue: totalRevenue,
        totalQuantity: totalQuantity,
        totalOrders: filteredOrders.length
    };
    
    // Display report in modal
    showReportInModal('Item-Wise Report', reportHtml);
}

function exportItemWiseReportToPDF() {
    if (!currentItemWiseReportData) {
        alert('No item-wise report data available. Please generate a report first.');
        return;
    }
    
    // Get restaurant info for header
    const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    const restaurantName = restaurantInfo.name || 'Restaurant';
    const restaurantAddress = restaurantInfo.address || '';
    
    const { sortedItems, itemDailySales, startDateFormatted, endDateFormatted, totalRevenue, totalQuantity, totalOrders } = currentItemWiseReportData;
    
    // Create PDF content
    let pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Item-Wise Sales Report</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    font-size: 12px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 10px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 18px;
                }
                .header p {
                    margin: 5px 0;
                    color: #666;
                }
                .summary {
                    margin: 20px 0;
                    padding: 10px;
                    background: #f0f0f0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                }
                .text-center {
                    text-align: center;
                }
                .text-right {
                    text-align: right;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${restaurantName}</h1>
                ${restaurantAddress ? `<p>${restaurantAddress}</p>` : ''}
                <h2>Item-Wise Sales Report</h2>
                <p>${startDateFormatted} to ${endDateFormatted}</p>
            </div>
            <div class="summary">
                <p><strong>Total Orders:</strong> ${totalOrders}</p>
                <p><strong>Total Items Sold:</strong> ${totalQuantity}</p>
                <p><strong>Total Revenue:</strong> ₹${totalRevenue.toFixed(2)}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th class="text-center">Quantity Sold</th>
                        <th class="text-right">Average Price</th>
                        <th class="text-right">Total Revenue</th>
                        <th class="text-center">Orders</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedItems.map(([itemName, data]) => `
                        <tr>
                            <td><strong>${itemName}</strong></td>
                            <td class="text-center">${data.quantity}</td>
                            <td class="text-right">₹${data.averagePrice.toFixed(2)}</td>
                            <td class="text-right"><strong>₹${data.revenue.toFixed(2)}</strong></td>
                            <td class="text-center">${data.orders}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td><strong>Grand Total</strong></td>
                        <td class="text-center"><strong>${totalQuantity}</strong></td>
                        <td class="text-right">-</td>
                        <td class="text-right"><strong>₹${totalRevenue.toFixed(2)}</strong></td>
                        <td class="text-center"><strong>${totalOrders}</strong></td>
                    </tr>
                </tfoot>
            </table>
            ${sortedItems.map(([itemName, data]) => {
                const dailyData = itemDailySales[itemName] || {};
                const sortedDates = Object.keys(dailyData).sort();
                
                if (sortedDates.length === 0) return '';
                
                return `
                    <div style="margin-top: 30px; page-break-inside: avoid;">
                        <h4 style="margin-bottom: 10px; color: #333;">${itemName} - Daily Sales</h4>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th class="text-center">Quantity</th>
                                    <th class="text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sortedDates.map(dateKey => {
                                    const dateObj = new Date(dateKey);
                                    const dateFormatted = dateObj.toLocaleDateString();
                                    const dayData = dailyData[dateKey];
                                    return `
                                        <tr>
                                            <td>${dateFormatted}</td>
                                            <td class="text-center">${dayData.quantity}</td>
                                            <td class="text-right"><strong>₹${dayData.revenue.toFixed(2)}</strong></td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td><strong>Total for ${itemName}</strong></td>
                                    <td class="text-center"><strong>${data.quantity}</strong></td>
                                    <td class="text-right"><strong>₹${data.revenue.toFixed(2)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                `;
            }).join('')}
            <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
                <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
    `;
    
    // Open in new window and print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

function exportItemWiseReportToCSV() {
    if (!currentItemWiseReportData) {
        alert('No item-wise report data available. Please generate a report first.');
        return;
    }
    
    // Get restaurant info for header
    const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    const restaurantName = restaurantInfo.name || 'Restaurant';
    
    const { sortedItems, itemDailySales, startDateFormatted, endDateFormatted, totalRevenue, totalQuantity, totalOrders } = currentItemWiseReportData;
    
    // Create CSV content
    let csvContent = '\uFEFF'; // BOM for UTF-8
    
    // Header
    csvContent += `${restaurantName}\n`;
    csvContent += `Item-Wise Sales Report\n`;
    csvContent += `${startDateFormatted} to ${endDateFormatted}\n`;
    csvContent += `\n`;
    csvContent += `Total Orders,${totalOrders}\n`;
    csvContent += `Total Items Sold,${totalQuantity}\n`;
    csvContent += `Total Revenue,₹${totalRevenue.toFixed(2)}\n`;
    csvContent += `\n`;
    
    // Item Summary Section
    csvContent += `ITEM SUMMARY\n`;
    csvContent += `Item Name,Quantity Sold,Average Price,Total Revenue,Orders\n`;
    
    sortedItems.forEach(([itemName, data]) => {
        csvContent += `"${itemName}",${data.quantity},₹${data.averagePrice.toFixed(2)},₹${data.revenue.toFixed(2)},${data.orders}\n`;
    });
    
    // Grand Total
    csvContent += `Grand Total,${totalQuantity},,₹${totalRevenue.toFixed(2)},${totalOrders}\n`;
    csvContent += `\n`;
    
    // Daily Breakdown Section
    csvContent += `DAILY BREAKDOWN BY ITEM\n`;
    csvContent += `\n`;
    
    sortedItems.forEach(([itemName, data]) => {
        const dailyData = itemDailySales[itemName] || {};
        const sortedDates = Object.keys(dailyData).sort();
        
        if (sortedDates.length === 0) return;
        
        csvContent += `${itemName} - Daily Sales\n`;
        csvContent += `Date,Quantity,Revenue\n`;
        
        sortedDates.forEach(dateKey => {
            const dateObj = new Date(dateKey);
            const dateFormatted = dateObj.toLocaleDateString();
            const dayData = dailyData[dateKey];
            csvContent += `"${dateFormatted}",${dayData.quantity},₹${dayData.revenue.toFixed(2)}\n`;
        });
        
        csvContent += `Total for ${itemName},${data.quantity},₹${data.revenue.toFixed(2)}\n`;
        csvContent += `\n`;
    });
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = `Item_Wise_Report_${startDateFormatted.replace(/\//g, '-')}_to_${endDateFormatted.replace(/\//g, '-')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function searchOrder() {
    const orderNumber = document.getElementById('orderSearchInput').value.trim();
    
    if (!orderNumber) {
        alert('Please enter an order number!');
        return;
    }
    
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    const order = orders.find(o => o.id.toString() === orderNumber || o.id.toString().includes(orderNumber));
    
    if (!order) {
        showReportInModal('Search Order', '<p style="text-align: center; color: #999; padding: 40px; font-size: 18px;">Order not found.</p>');
        return;
    }
    
    // Display order details in modal
    const orderDate = new Date(order.date).toLocaleString();
    
    let itemsHtml = '';
    order.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        itemsHtml += `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>₹${itemTotal.toFixed(2)}</td>
            </tr>
        `;
    });
    
    const orderHTML = `
        <div class="order-details">
            <h3>Order #${order.id}</h3>
            <p><strong>Date:</strong> ${orderDate}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}</p>
            <p><strong>Total:</strong> ₹${order.total.toFixed(2)}</p>
            <table style="width: 100%; margin-top: 15px;">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            <button onclick="reprintOrder(${order.id})" class="btn btn-primary" style="margin-top: 15px;">Reprint Order</button>
        </div>
    `;
    
    showReportInModal('Search Order Result', orderHTML);
}

function reprintOrder(orderId) {
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Order not found!');
        return;
    }
    
    const printBillDiv = document.getElementById('printBill');
    const billItemsBody = document.getElementById('billItemsBody');
    const billTotal = document.getElementById('billTotal');
    const billDate = document.getElementById('billDate');
    const billOrderNumber = document.getElementById('billOrderNumber');
    
    // Set order number and date
    if (billOrderNumber) {
        billOrderNumber.textContent = order.id;
    }
    billDate.textContent = new Date(order.date).toLocaleString();
    
    // Clear and populate bill items
    billItemsBody.innerHTML = '';
    let total = 0;
    
    order.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>₹${itemTotal.toFixed(2)}</td>
        `;
        billItemsBody.appendChild(row);
    });
    
    billTotal.textContent = total.toFixed(2);
    
    // Show print bill and print
    printBillDiv.classList.remove('hidden');
    window.print();
    printBillDiv.classList.add('hidden');
}

function loadCancelledBills() {
    const cancelledBillsContent = document.getElementById('cancelledBillsContent');
    if (!cancelledBillsContent) return;
    
    const cancelledOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.CANCELLED_ORDERS) || '[]');
    
    if (cancelledOrders.length === 0) {
        cancelledBillsContent.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No cancelled bills found.</p>';
        return;
    }
    
    // Sort by cancelled date (newest first)
    const sortedCancelledOrders = cancelledOrders.sort((a, b) => {
        const dateA = a.cancelledDate ? new Date(a.cancelledDate) : new Date(a.date);
        const dateB = b.cancelledDate ? new Date(b.cancelledDate) : new Date(b.date);
        return dateB - dateA;
    });
    
    cancelledBillsContent.innerHTML = '';
    
    sortedCancelledOrders.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'transaction-item cancelled-item';
        orderDiv.style.cssText = 'padding: 15px; margin-bottom: 10px; background: #ffebee; border: 1px solid #ef5350; border-radius: 5px; cursor: pointer; transition: all 0.3s ease;';
        orderDiv.onmouseover = function() {
            this.style.background = '#ffcdd2';
            this.style.borderColor = '#e53935';
        };
        orderDiv.onmouseout = function() {
            this.style.background = '#ffebee';
            this.style.borderColor = '#ef5350';
        };
        
        const orderDate = new Date(order.date).toLocaleString();
        const cancelledDate = order.cancelledDate ? new Date(order.cancelledDate).toLocaleString() : 'N/A';
        const cancelledBy = order.cancelledBy || 'Admin';
        const paymentMethod = order.paymentMethod || 'N/A';
        const paymentMethodLabel = paymentMethod === 'gpay' ? 'GPay' : paymentMethod === 'cash' ? 'Cash' : paymentMethod;
        
        orderDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div>
                    <strong style="font-size: 16px; color: #c62828;">Order #${order.id} (Cancelled)</strong>
                    <div style="font-size: 12px; color: #666; margin-top: 3px;">Original: ${orderDate}</div>
                    <div style="font-size: 12px; color: #d32f2f; margin-top: 3px;">Cancelled: ${cancelledDate} by ${cancelledBy}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 18px; font-weight: bold; color: #d32f2f;">₹${order.total.toFixed(2)}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 3px;">${paymentMethodLabel}</div>
                </div>
            </div>
            <div style="font-size: 13px; color: #666; border-top: 1px solid #ffcdd2; padding-top: 8px; margin-top: 8px;">
                ${order.items.length} item(s): ${order.items.map(item => `${item.name} (${item.quantity}x)`).join(', ')}
            </div>
        `;
        
        cancelledBillsContent.appendChild(orderDiv);
    });
}

function loadTransactionHistory() {
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    const historyContent = document.getElementById('transactionHistoryContent');
    
    if (orders.length === 0) {
        historyContent.innerHTML = '<p style="text-align: center; color: #999;">No transactions found.</p>';
        return;
    }
    
    // Sort orders by date (newest first)
    const sortedOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    historyContent.innerHTML = '';
    
    sortedOrders.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'transaction-item';
        const orderDate = new Date(order.date).toLocaleString();
        
        orderDiv.innerHTML = `
            <div class="transaction-header">
                <div>
                    <strong>Order #${order.id}</strong>
                    <span style="color: #666; margin-left: 10px;">${orderDate}</span>
                </div>
                <div>
                    <strong>₹${order.total.toFixed(2)}</strong>
                    <button onclick="reprintOrder(${order.id})" class="btn btn-secondary" style="margin-left: 10px; padding: 5px 10px;">Reprint</button>
                </div>
            </div>
            <div class="transaction-items">
                ${order.items.map(item => `${item.name} (${item.quantity}x)`).join(', ')}
            </div>
        `;
        historyContent.appendChild(orderDiv);
    });
}

// Make functions globally accessible for onclick handlers
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.editUser = editUser;
window.deleteUser = deleteUser;

// Employee Management Functions
function generateNextEmployeeId() {
    const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    const adminEmployeeId = restaurantInfo.adminEmployeeId || '';
    
    if (!adminEmployeeId) {
        return '';
    }
    
    // Extract prefix and number from admin employee ID (e.g., "EMP001" -> prefix: "EMP", number: 1)
    const match = adminEmployeeId.match(/^([A-Za-z]+)(\d+)$/);
    if (!match) {
        return '';
    }
    
    const prefix = match[1];
    const adminNumber = parseInt(match[2], 10);
    
    // Get all employees and find the highest number
    const employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
    let maxNumber = adminNumber;
    
    employees.forEach(emp => {
        if (emp.employeeId) {
            const empMatch = emp.employeeId.match(new RegExp(`^${prefix}(\\d+)$`));
            if (empMatch) {
                const empNumber = parseInt(empMatch[1], 10);
                if (empNumber > maxNumber) {
                    maxNumber = empNumber;
                }
            }
        }
    });
    
    // Generate next ID
    const nextNumber = maxNumber + 1;
    const numberStr = String(nextNumber).padStart(String(adminNumber).length, '0');
    return prefix + numberStr;
}

function toggleLockAdminEmployeeId() {
    if (!isAdmin) {
        alert('Only admins can lock/unlock admin employee ID!');
        return;
    }
    
    const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    const isCurrentlyLocked = restaurantInfo.adminEmployeeIdLocked || false;
    const newLockState = !isCurrentlyLocked;
    
    if (newLockState) {
        // Locking - save the admin employee ID and name first
        const adminEmployeeId = document.getElementById('adminEmployeeId').value.trim();
        const adminEmployeeName = document.getElementById('adminEmployeeName').value.trim();
        
        if (!adminEmployeeId) {
            alert('Please enter admin employee ID before locking!');
            return;
        }
        
        // Validate format (should be letters followed by numbers, e.g., EMP001)
        if (!/^[A-Za-z]+\d+$/.test(adminEmployeeId)) {
            alert('Invalid format! Employee ID should be letters followed by numbers (e.g., EMP001)');
            return;
        }
        
        restaurantInfo.adminEmployeeId = adminEmployeeId;
        restaurantInfo.adminEmployeeName = adminEmployeeName;
        restaurantInfo.adminEmployeeIdLocked = true;
        localStorage.setItem(STORAGE_KEYS.RESTAURANT_INFO, JSON.stringify(restaurantInfo));
        
        // Update the employee ID field if employee modal is open
        if (document.getElementById('newEmployeeId')) {
            document.getElementById('newEmployeeId').value = generateNextEmployeeId();
        }
        
        alert('Admin Employee ID locked successfully!');
    } else {
        // Unlocking
        restaurantInfo.adminEmployeeIdLocked = false;
        localStorage.setItem(STORAGE_KEYS.RESTAURANT_INFO, JSON.stringify(restaurantInfo));
    }
    
    updateLockButtonState(newLockState);
}

function updateLockButtonState(isLocked) {
    const lockBtn = document.getElementById('lockAdminEmployeeIdBtn');
    const adminEmployeeIdContainer = document.getElementById('adminEmployeeIdContainer');
    const adminEmployeeNameContainer = document.getElementById('adminEmployeeNameContainer');
    
    if (lockBtn) {
        if (isLocked) {
            lockBtn.innerHTML = '🔒 Unlock';
            lockBtn.classList.remove('btn-secondary');
            lockBtn.classList.add('btn-primary');
        } else {
            lockBtn.innerHTML = '🔓 Lock';
            lockBtn.classList.remove('btn-primary');
            lockBtn.classList.add('btn-secondary');
        }
    }
    
    if (adminEmployeeIdContainer) {
        adminEmployeeIdContainer.style.display = isLocked ? 'none' : 'block';
    }
    
    if (adminEmployeeNameContainer) {
        adminEmployeeNameContainer.style.display = isLocked ? 'none' : 'block';
    }
}

function toggleLockStartingBillNumber() {
    const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    const isCurrentlyLocked = restaurantInfo.startingBillNumberLocked !== undefined ? restaurantInfo.startingBillNumberLocked : true;
    const newLockState = !isCurrentlyLocked;
    
    restaurantInfo.startingBillNumberLocked = newLockState;
    localStorage.setItem(STORAGE_KEYS.RESTAURANT_INFO, JSON.stringify(restaurantInfo));
    
    updateStartingBillNumberLockButtonState(newLockState);
}

function updateStartingBillNumberLockButtonState(isLocked) {
    const lockBtn = document.getElementById('lockStartingBillNumberBtn');
    const startingBillNumberField = document.getElementById('startingBillNumber');
    
    if (lockBtn) {
        if (isLocked) {
            lockBtn.innerHTML = '🔒 Unlock';
            lockBtn.classList.remove('btn-secondary');
            lockBtn.classList.add('btn-primary');
        } else {
            lockBtn.innerHTML = '🔓 Lock';
            lockBtn.classList.remove('btn-primary');
            lockBtn.classList.add('btn-secondary');
        }
    }
    
    if (startingBillNumberField) {
        startingBillNumberField.readOnly = isLocked;
        if (isLocked) {
            startingBillNumberField.style.backgroundColor = '#f5f5f5';
        } else {
            startingBillNumberField.style.backgroundColor = '';
        }
    }
}

function generateNextBillNumber() {
    const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    const startingBillNumber = Number(restaurantInfo.startingBillNumber) || 1;
    
    // Get all orders (active and cancelled)
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    const cancelledOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.CANCELLED_ORDERS) || '[]');
    const allOrders = [...orders, ...cancelledOrders];
    
    // Find the highest bill number
    let maxBillNumber = startingBillNumber - 1;
    
    allOrders.forEach(order => {
        // Check if order.id is a number (bill number) or timestamp
        const orderId = typeof order.id === 'number' ? order.id : parseInt(order.id);
        // Only consider IDs that are valid numbers and are likely bill numbers (not timestamps)
        // Timestamps are typically 13 digits (milliseconds) or 10 digits (seconds)
        // Bill numbers should be reasonable (less than 1 billion to avoid timestamp conflicts)
        if (!isNaN(orderId) && orderId >= startingBillNumber && orderId > maxBillNumber && orderId < 1000000000) {
            maxBillNumber = orderId;
        }
    });
    
    // Return next bill number as a number
    return Number(maxBillNumber + 1);
}

function showAddEmployeeForm() {
    const formContainer = document.getElementById('addEmployeeFormContainer');
    const showBtn = document.getElementById('showAddEmployeeFormBtn');
    
    if (formContainer && showBtn) {
        if (formContainer.style.display === 'none') {
            formContainer.style.display = 'block';
            showBtn.innerHTML = 'Hide Add Employee Form';
            // Generate and display next employee ID
            if (document.getElementById('newEmployeeId')) {
                document.getElementById('newEmployeeId').value = generateNextEmployeeId();
            }
        } else {
            formContainer.style.display = 'none';
            showBtn.innerHTML = 'Add Employee';
        }
    }
}

function handleEmployeeProofAttachment(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file type
    const fileType = file.type;
    const isPDF = fileType === 'application/pdf';
    const isImage = fileType.startsWith('image/');
    
    if (!isPDF && !isImage) {
        alert('Please select a PDF or image file!');
        event.target.value = '';
        return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB!');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        employeeProofAttachment = {
            name: file.name,
            type: fileType,
            data: e.target.result,
            size: file.size
        };
        
        // Show preview
        const preview = document.getElementById('employeeProofPreview');
        const fileName = document.getElementById('employeeProofFileName');
        if (preview && fileName) {
            fileName.textContent = file.name;
            preview.style.display = 'block';
        }
    };
    
    if (isPDF) {
        reader.readAsDataURL(file);
    } else {
        reader.readAsDataURL(file);
    }
}

function removeEmployeeProofAttachment() {
    employeeProofAttachment = null;
    const fileInput = document.getElementById('newEmployeeIdProofFile');
    const preview = document.getElementById('employeeProofPreview');
    
    if (fileInput) {
        fileInput.value = '';
    }
    if (preview) {
        preview.style.display = 'none';
    }
}

function addEmployee() {
    if (!isAdmin) {
        alert('Only admins can add employees!');
        return;
    }
    
    const employeeId = document.getElementById('newEmployeeId').value.trim();
    const employeeName = document.getElementById('newEmployeeName').value.trim();
    const position = document.getElementById('newEmployeePosition').value.trim();
    const address = document.getElementById('newEmployeeAddress').value.trim();
    const phone = document.getElementById('newEmployeePhone').value.trim();
    const referral = document.getElementById('newEmployeeReferral').value.trim();
    const idProof = document.getElementById('newEmployeeIdProof').value.trim();
    
    if (!employeeId) {
        alert('Employee ID is required! Please set admin employee ID first.');
        return;
    }
    
    const employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
    
    // Check if employee ID already exists
    if (employees.find(e => e.employeeId === employeeId)) {
        alert('Employee ID already exists!');
        return;
    }
    
    const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
    employees.push({
        id: newId,
        employeeId: employeeId,
        employeeName: employeeName,
        position: position,
        address: address,
        phone: phone,
        referral: referral,
        idProof: idProof,
        proofAttachment: employeeProofAttachment
    });
    
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    
    // Clear form
    document.getElementById('newEmployeeName').value = '';
    document.getElementById('newEmployeeAddress').value = '';
    document.getElementById('newEmployeePhone').value = '';
    document.getElementById('newEmployeeReferral').value = '';
    document.getElementById('newEmployeeIdProof').value = '';
    removeEmployeeProofAttachment();
    
    // Generate next employee ID
    document.getElementById('newEmployeeId').value = generateNextEmployeeId();
    
    // Generate next employee ID
    document.getElementById('newEmployeeId').value = generateNextEmployeeId();
    
    loadEmployeesList();
    alert('Employee added successfully!');
}

function loadEmployeesList() {
    const employeesListContent = document.getElementById('employeesListContent');
    if (!employeesListContent) return;
    
    const employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
    const restaurantInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTAURANT_INFO) || '{}');
    
    // Create admin employee entry if admin employee ID exists
    let allEmployees = [];
    if (restaurantInfo.adminEmployeeId) {
        allEmployees.push({
            id: 0, // Special ID for admin
            employeeId: restaurantInfo.adminEmployeeId,
            employeeName: restaurantInfo.adminEmployeeName || '',
            address: '',
            phone: '',
            referral: '',
            idProof: '',
            proofAttachment: null,
            isAdmin: true
        });
    }
    
    // Add regular employees
    allEmployees = allEmployees.concat(employees);
    
    if (allEmployees.length === 0) {
        employeesListContent.innerHTML = '<p>No employees found.</p>';
        return;
    }
    
    employeesListContent.innerHTML = allEmployees.map(employee => `
        <div style="padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; ${employee.isAdmin ? 'background: #e3f2fd; border-color: #2196F3;' : ''}">
            <div>
                <strong>${employee.employeeId || 'N/A'}</strong>
                ${employee.isAdmin ? ' <span style="background: #2196F3; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-left: 5px;">ADMIN</span>' : ''}
                ${employee.employeeName ? `<br><span style="color: #666; font-size: 12px;">Name: ${employee.employeeName}</span>` : ''}
                ${employee.position ? `<br><span style="color: #666; font-size: 12px;">Position: ${employee.position}</span>` : ''}
                ${employee.address ? `<br><span style="color: #666; font-size: 12px;">Address: ${employee.address}</span>` : ''}
                ${employee.phone ? `<br><span style="color: #666; font-size: 12px;">Phone: ${employee.phone}</span>` : ''}
                ${employee.referral ? `<br><span style="color: #666; font-size: 12px;">Referral: ${employee.referral}</span>` : ''}
                ${employee.idProof ? `<br><span style="color: #666; font-size: 12px;">ID Proof: ${employee.idProof}</span>` : ''}
                ${employee.proofAttachment ? `<br><span style="color: #666; font-size: 12px;">📎 Attachment: ${employee.proofAttachment.name}</span>` : ''}
            </div>
            ${isAdmin && !employee.isAdmin ? `
                <div style="display: flex; gap: 5px;">
                    <button class="btn btn-edit" onclick="editEmployee(${employee.id})" style="padding: 5px 10px; font-size: 12px;">Edit</button>
                    <button class="btn btn-delete" onclick="deleteEmployee(${employee.id})" style="padding: 5px 10px; font-size: 12px;">Delete</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function deleteEmployee(employeeId) {
    if (!isAdmin) {
        alert('Only admins can delete employees!');
        return;
    }
    
    if (confirm('Are you sure you want to delete this employee?')) {
        const employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
        const filteredEmployees = employees.filter(e => e.id !== employeeId);
        localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(filteredEmployees));
        loadEmployeesList();
        alert('Employee deleted successfully!');
    }
}

function handleEditEmployeeProofAttachment(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file type
    const fileType = file.type;
    const isPDF = fileType === 'application/pdf';
    const isImage = fileType.startsWith('image/');
    
    if (!isPDF && !isImage) {
        alert('Please select a PDF or image file!');
        event.target.value = '';
        return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB!');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        editEmployeeProofAttachment = {
            name: file.name,
            type: fileType,
            data: e.target.result,
            size: file.size
        };
        
        // Show preview
        const preview = document.getElementById('editEmployeeProofPreview');
        const fileName = document.getElementById('editEmployeeProofFileName');
        if (preview && fileName) {
            fileName.textContent = file.name;
            preview.style.display = 'block';
        }
    };
    
    reader.readAsDataURL(file);
}

function removeEditEmployeeProofAttachment() {
    editEmployeeProofAttachment = null;
    const fileInput = document.getElementById('editEmployeeIdProofFile');
    const preview = document.getElementById('editEmployeeProofPreview');
    
    if (fileInput) {
        fileInput.value = '';
    }
    if (preview) {
        preview.style.display = 'none';
    }
}

function editEmployee(employeeId) {
    if (!isAdmin) {
        alert('Only admins can edit employees!');
        return;
    }
    
    const employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
    const employee = employees.find(e => e.id === employeeId);
    
    if (!employee) {
        alert('Employee not found!');
        return;
    }
    
    editingEmployeeId = employeeId;
    editEmployeeProofAttachment = null;
    
    // Populate form fields
    document.getElementById('editEmployeeId').value = employee.employeeId || '';
    document.getElementById('editEmployeeName').value = employee.employeeName || '';
    document.getElementById('editEmployeePosition').value = employee.position || '';
    document.getElementById('editEmployeeAddress').value = employee.address || '';
    document.getElementById('editEmployeePhone').value = employee.phone || '';
    document.getElementById('editEmployeeReferral').value = employee.referral || '';
    document.getElementById('editEmployeeIdProof').value = employee.idProof || '';
    
    // Handle existing proof attachment
    const preview = document.getElementById('editEmployeeProofPreview');
    const fileName = document.getElementById('editEmployeeProofFileName');
    if (employee.proofAttachment) {
        editEmployeeProofAttachment = employee.proofAttachment;
        if (preview && fileName) {
            fileName.textContent = employee.proofAttachment.name;
            preview.style.display = 'block';
        }
    } else {
        if (preview) {
            preview.style.display = 'none';
        }
    }
    
    // Clear file input
    const fileInput = document.getElementById('editEmployeeIdProofFile');
    if (fileInput) {
        fileInput.value = '';
    }
    
    document.getElementById('editEmployeeModal').classList.remove('hidden');
}

function saveEmployeeChanges() {
    if (!isAdmin) {
        alert('Only admins can edit employees!');
        return;
    }
    
    if (!editingEmployeeId) {
        alert('No employee selected for editing!');
        return;
    }
    
    const employeeName = document.getElementById('editEmployeeName').value.trim();
    const position = document.getElementById('editEmployeePosition').value.trim();
    const address = document.getElementById('editEmployeeAddress').value.trim();
    const phone = document.getElementById('editEmployeePhone').value.trim();
    const referral = document.getElementById('editEmployeeReferral').value.trim();
    const idProof = document.getElementById('editEmployeeIdProof').value.trim();
    
    const employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
    const employeeIndex = employees.findIndex(e => e.id === editingEmployeeId);
    
    if (employeeIndex === -1) {
        alert('Employee not found!');
        return;
    }
    
    // Update employee
    employees[employeeIndex].employeeName = employeeName;
    employees[employeeIndex].position = position;
    employees[employeeIndex].address = address;
    employees[employeeIndex].phone = phone;
    employees[employeeIndex].referral = referral;
    employees[employeeIndex].idProof = idProof;
    
    // Update proof attachment if a new one was uploaded
    if (editEmployeeProofAttachment) {
        employees[employeeIndex].proofAttachment = editEmployeeProofAttachment;
    }
    
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    
    // Close modal and refresh list
    closeEditEmployeeModal();
    loadEmployeesList();
    alert('Employee updated successfully!');
}

function closeEditEmployeeModal() {
    editingEmployeeId = null;
    editEmployeeProofAttachment = null;
    document.getElementById('editEmployeeModal').classList.add('hidden');
    
    // Clear form
    document.getElementById('editEmployeeId').value = '';
    document.getElementById('editEmployeeName').value = '';
    document.getElementById('editEmployeePosition').value = '';
    document.getElementById('editEmployeeAddress').value = '';
    document.getElementById('editEmployeePhone').value = '';
    document.getElementById('editEmployeeReferral').value = '';
    document.getElementById('editEmployeeIdProof').value = '';
    removeEditEmployeeProofAttachment();
}

function toggleEmployeeFullscreen() {
    const employeeModal = document.getElementById('employeeModal');
    const employeeModalContent = document.getElementById('employeeModalContent');
    if (employeeModal && employeeModalContent) {
        employeeModal.classList.toggle('fullscreen');
        const btn = document.getElementById('employeeFullscreenBtn');
        if (btn) {
            if (employeeModal.classList.contains('fullscreen')) {
                btn.innerHTML = '⛶ Exit Fullscreen';
                employeeModalContent.style.maxWidth = '100%';
                employeeModalContent.style.maxHeight = '100vh';
                employeeModalContent.style.width = '100%';
                employeeModalContent.style.height = '100vh';
            } else {
                btn.innerHTML = '⛶ Fullscreen';
                employeeModalContent.style.maxWidth = '800px';
                employeeModalContent.style.maxHeight = '90vh';
                employeeModalContent.style.width = '';
                employeeModalContent.style.height = '';
            }
        }
    }
}

function closeEmployeeModal() {
    const employeeModal = document.getElementById('employeeModal');
    if (employeeModal) {
        employeeModal.classList.remove('fullscreen');
        const employeeModalContent = document.getElementById('employeeModalContent');
        if (employeeModalContent) {
            employeeModalContent.style.maxWidth = '800px';
            employeeModalContent.style.maxHeight = '90vh';
            employeeModalContent.style.width = '';
            employeeModalContent.style.height = '';
        }
        const btn = document.getElementById('employeeFullscreenBtn');
        if (btn) {
            btn.innerHTML = '⛶ Fullscreen';
        }
    }
    document.getElementById('employeeModal').classList.add('hidden');
    // Hide and reset add employee form
    const formContainer = document.getElementById('addEmployeeFormContainer');
    const showBtn = document.getElementById('showAddEmployeeFormBtn');
    if (formContainer) {
        formContainer.style.display = 'none';
    }
    if (showBtn) {
        showBtn.textContent = 'Add Employee';
    }
    // Clear form
    document.getElementById('newEmployeeName').value = '';
    document.getElementById('newEmployeePosition').value = '';
    document.getElementById('newEmployeeAddress').value = '';
    document.getElementById('newEmployeePhone').value = '';
    document.getElementById('newEmployeeReferral').value = '';
    document.getElementById('newEmployeeIdProof').value = '';
    removeEmployeeProofAttachment();
}

window.viewCancelBillDetails = viewCancelBillDetails;
window.cancelBillFromList = cancelBillFromList;
window.editMenuItem = editMenuItem;
window.deleteMenuItem = deleteMenuItem;
window.reprintOrder = reprintOrder;
window.toggleLockStartingBillNumber = toggleLockStartingBillNumber;
window.updateStock = updateStock;
window.updateMinStock = updateMinStock;
window.deleteEmployee = deleteEmployee;
window.editEmployee = editEmployee;
window.handleEmployeeProofAttachment = handleEmployeeProofAttachment;
window.removeEmployeeProofAttachment = removeEmployeeProofAttachment;
window.handleEditEmployeeProofAttachment = handleEditEmployeeProofAttachment;
window.removeEditEmployeeProofAttachment = removeEditEmployeeProofAttachment;
window.saveEmployeeChanges = saveEmployeeChanges;
window.closeEditEmployeeModal = closeEditEmployeeModal;
window.loadEmployeeIdsDropdown = loadEmployeeIdsDropdown;
window.handleEmployeeIdSelection = handleEmployeeIdSelection;
window.handleEditEmployeeIdSelection = handleEditEmployeeIdSelection;
window.togglePassword = togglePassword;
window.toggleHamburgerMenu = toggleHamburgerMenu;
window.closeHamburgerMenu = closeHamburgerMenu;
window.toggleHamburgerMenu = toggleHamburgerMenu;
window.closeHamburgerMenu = closeHamburgerMenu;
