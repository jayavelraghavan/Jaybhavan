// API Service Layer - Replaces localStorage with Backend API calls
const API_BASE_URL = 'http://localhost:3000/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API request failed');
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Menu API
const menuAPI = {
    getAll: () => apiCall('/menu'),
    getById: (id) => apiCall(`/menu/${id}`),
    getByBarcode: (barcode) => apiCall(`/menu/barcode/${barcode}`),
    create: (item) => apiCall('/menu', { method: 'POST', body: JSON.stringify(item) }),
    update: (id, item) => apiCall(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
    delete: (id) => apiCall(`/menu/${id}`, { method: 'DELETE' }),
    updateStock: (id, stockValue) => apiCall(`/menu/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ stockValue }) })
};

// Orders API
const ordersAPI = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/orders?${queryString}`);
    },
    getById: (id) => apiCall(`/orders/${id}`),
    getByOrderNumber: (orderNumber) => apiCall(`/orders/number/${orderNumber}`),
    create: (order) => apiCall('/orders', { method: 'POST', body: JSON.stringify(order) }),
    cancel: (id, data) => apiCall(`/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify(data) }),
    getCancelled: () => apiCall('/orders/cancelled/all')
};

// Users API
const usersAPI = {
    login: (credentials) => apiCall('/users/login', { method: 'POST', body: JSON.stringify(credentials) }),
    getAll: () => apiCall('/users'),
    getById: (id) => apiCall(`/users/${id}`),
    create: (user) => apiCall('/users', { method: 'POST', body: JSON.stringify(user) }),
    update: (id, user) => apiCall(`/users/${id}`, { method: 'PUT', body: JSON.stringify(user) }),
    delete: (id) => apiCall(`/users/${id}`, { method: 'DELETE' }),
    resetPassword: (id, newPassword) => apiCall(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) })
};

// Restaurant API
const restaurantAPI = {
    get: () => apiCall('/restaurant'),
    update: (info) => apiCall('/restaurant', { method: 'PUT', body: JSON.stringify(info) })
};

// Employees API
const employeesAPI = {
    getAll: () => apiCall('/employees'),
    getById: (id) => apiCall(`/employees/${id}`),
    create: (employee) => apiCall('/employees', { method: 'POST', body: JSON.stringify(employee) }),
    update: (id, employee) => apiCall(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(employee) }),
    delete: (id) => apiCall(`/employees/${id}`, { method: 'DELETE' })
};

// Stock API
const stockAPI = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/stock?${queryString}`);
    },
    bulkUpdate: (updates) => apiCall('/stock/bulk-update', { method: 'POST', body: JSON.stringify({ updates }) })
};

// Reports API
const reportsAPI = {
    dateRange: (startDate, endDate) => apiCall(`/reports/date-range?startDate=${startDate}&endDate=${endDate}`),
    userWise: (startDate, endDate) => apiCall(`/reports/user-wise?startDate=${startDate}&endDate=${endDate}`),
    itemWise: (startDate, endDate) => apiCall(`/reports/item-wise?startDate=${startDate}&endDate=${endDate}`),
    transactions: (limit = 100) => apiCall(`/reports/transactions?limit=${limit}`)
};

// Export API services
window.API = {
    menu: menuAPI,
    orders: ordersAPI,
    users: usersAPI,
    restaurant: restaurantAPI,
    employees: employeesAPI,
    stock: stockAPI,
    reports: reportsAPI
};

// Check API connection
async function checkAPIConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            console.log('✅ API connection successful');
            return true;
        }
    } catch (error) {
        console.warn('⚠️ API not available, falling back to localStorage');
        return false;
    }
    return false;
}

// Initialize API check on load
document.addEventListener('DOMContentLoaded', () => {
    checkAPIConnection();
});
