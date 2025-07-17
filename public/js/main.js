// PAPKASH Website JavaScript

// Global variables
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

// Initialize the application
function initializeApp() {
    // Set up mobile menu toggle
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
    
    // Initialize page-specific functionality
    const currentPage = window.location.pathname;
    
    switch(currentPage) {
        case '/':
            initializeHomePage();
            break;
        case '/register':
            initializeRegisterPage();
            break;
        case '/login':
            initializeLoginPage();
            break;
        case '/dashboard':
            initializeDashboard();
            break;
        case '/tasks':
            initializeTasksPage();
            break;
        case '/referral':
            initializeReferralPage();
            break;
    }
}

// Set up global event listeners
function setupEventListeners() {
    // Handle form submissions
    document.addEventListener('submit', handleFormSubmit);
    
    // Handle button clicks
    document.addEventListener('click', handleButtonClick);
    
    // Handle input changes
    document.addEventListener('input', handleInputChange);
}

// Check authentication status
function checkAuthStatus() {
    if (authToken) {
        fetchCurrentUser();
    } else {
        updateAuthUI(false);
    }
}

// Fetch current user data
async function fetchCurrentUser() {
    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            currentUser = result.user;
            updateAuthUI(true);
        } else {
            localStorage.removeItem('authToken');
            authToken = null;
            updateAuthUI(false);
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        localStorage.removeItem('authToken');
        authToken = null;
        updateAuthUI(false);
    }
}

// Update UI based on authentication status
function updateAuthUI(isAuthenticated) {
    const authLinks = document.querySelectorAll('.auth-link');
    const guestLinks = document.querySelectorAll('.guest-link');
    const userInfo = document.querySelector('.user-info');
    
    if (isAuthenticated) {
        authLinks.forEach(link => link.style.display = 'block');
        guestLinks.forEach(link => link.style.display = 'none');
        
        if (userInfo && currentUser) {
            userInfo.textContent = `Welcome, ${currentUser.name}`;
        }
    } else {
        authLinks.forEach(link => link.style.display = 'none');
        guestLinks.forEach(link => link.style.display = 'block');
        
        if (userInfo) {
            userInfo.textContent = '';
        }
    }
}

// Handle form submissions
async function handleFormSubmit(event) {
    const form = event.target;
    
    if (form.classList.contains('auth-form')) {
        event.preventDefault();
        await handleAuthForm(form);
    } else if (form.classList.contains('payment-form')) {
        event.preventDefault();
        await handlePaymentForm(form);
    } else if (form.classList.contains('task-form')) {
        event.preventDefault();
        await handleTaskForm(form);
    }
}

// Handle button clicks
async function handleButtonClick(event) {
    const button = event.target;
    
    if (button.classList.contains('pay-btn')) {
        await handlePaymentButton(button);
    } else if (button.classList.contains('copy-btn')) {
        handleCopyButton(button);
    } else if (button.classList.contains('task-btn')) {
        await handleTaskButton(button);
    } else if (button.classList.contains('logout-btn')) {
        handleLogout();
    }
}

// Handle input changes
function handleInputChange(event) {
    const input = event.target;
    
    if (input.classList.contains('form-input')) {
        validateInput(input);
    }
}

// Initialize home page
function initializeHomePage() {
    // Animate hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.opacity = '0';
        hero.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            hero.style.transition = 'all 0.8s ease';
            hero.style.opacity = '1';
            hero.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // Animate feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 200 + (index * 100));
    });
}

// Initialize register page
function initializeRegisterPage() {
    const form = document.querySelector('#registerForm');
    if (form) {
        setupFormValidation(form);
    }
}

// Initialize login page
function initializeLoginPage() {
    const form = document.querySelector('#loginForm');
    if (form) {
        setupFormValidation(form);
    }
}

// Initialize dashboard
async function initializeDashboard() {
    if (!authToken) {
        window.location.href = '/login';
        return;
    }
    
    await loadDashboardData();
    setupDashboardCharts();
}

// Initialize tasks page
async function initializeTasksPage() {
    if (!authToken) {
        window.location.href = '/login';
        return;
    }
    
    await loadTasks();
}

// Initialize referral page
function initializeReferralPage() {
    if (!authToken) {
        window.location.href = '/login';
        return;
    }
    
    loadReferralData();
}

// Handle authentication forms
async function handleAuthForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const isLogin = form.id === 'loginForm';
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    // Clear previous errors
    form.querySelectorAll('.form-error').forEach(error => error.remove());
    form.querySelectorAll('.form-input').forEach(input => input.classList.remove('error'));
    
    try {
        showLoading(form.querySelector('button[type="submit"]'));
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            authToken = result.token;
            localStorage.setItem('authToken', authToken);
            currentUser = result.user;
            
            showAlert('success', result.message);
            
            if (isLogin) {
                // Check if user is active
                if (result.user.isActive) {
                    window.location.href = '/dashboard';
                } else {
                    window.location.href = '/register?step=payment';
                }
            } else {
                // Redirect to payment for new users
                window.location.href = '/register?step=payment';
            }
        } else {
            // Handle validation errors
            if (result.errors && Array.isArray(result.errors)) {
                result.errors.forEach(error => {
                    const field = form.querySelector(`[name="${error.param}"]`);
                    if (field) {
                        showError(field, error.msg);
                    }
                });
            }
            
            showAlert('error', result.message || 'An error occurred');
        }
    } catch (error) {
        console.error('Auth error:', error);
        showAlert('error', 'Network error. Please try again.');
    } finally {
        hideLoading(form.querySelector('button[type="submit"]'));
    }
}

// Handle payment form
async function handlePaymentForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        showLoading(form);
        
        const response = await fetch('/api/payment/stk-push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('success', 'Payment request sent! Please check your phone for M-Pesa prompt.');
            
            // Poll for payment status
            pollPaymentStatus(result.paymentId);
        } else {
            showAlert('error', result.message || 'Payment failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showAlert('error', 'Payment failed. Please try again.');
    } finally {
        hideLoading(form);
    }
}

// Handle task form
async function handleTaskForm(form) {
    const formData = new FormData(form);
    const taskId = form.dataset.taskId;
    
    try {
        showLoading(form);
        
        const response = await fetch(`/api/tasks/${taskId}/complete`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('success', result.message);
            await loadTasks(); // Refresh tasks
        } else {
            showAlert('error', result.message || 'Task submission failed');
        }
    } catch (error) {
        console.error('Task error:', error);
        showAlert('error', 'Task submission failed. Please try again.');
    } finally {
        hideLoading(form);
    }
}

// Handle payment button
async function handlePaymentButton(button) {
    const amount = button.dataset.amount;
    const phone = currentUser?.phone;
    
    if (!phone) {
        showAlert('error', 'Phone number not found. Please update your profile.');
        return;
    }
    
    try {
        showLoading(button);
        
        const response = await fetch('/api/payment/stk-push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ amount, phone })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('success', 'Payment request sent! Please check your phone for M-Pesa prompt.');
            pollPaymentStatus(result.paymentId);
        } else {
            showAlert('error', result.message || 'Payment failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showAlert('error', 'Payment failed. Please try again.');
    } finally {
        hideLoading(button);
    }
}

// Handle copy button
function handleCopyButton(button) {
    const textToCopy = button.dataset.copy;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            showAlert('success', 'Copied to clipboard!');
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = 'Copy';
            }, 2000);
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        showAlert('success', 'Copied to clipboard!');
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = 'Copy';
        }, 2000);
    }
}

// Handle task button
async function handleTaskButton(button) {
    const taskId = button.dataset.taskId;
    const action = button.dataset.action;
    
    if (action === 'complete') {
        // Show task completion modal/form
        showTaskCompletionForm(taskId);
    } else if (action === 'view') {
        // Show task details
        showTaskDetails(taskId);
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    window.location.href = '/';
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            renderDashboard(data.dashboard);
        } else {
            showAlert('error', 'Failed to load dashboard data');
        }
    } catch (error) {
        console.error('Dashboard error:', error);
        showAlert('error', 'Failed to load dashboard data');
    }
}

// Load tasks
async function loadTasks() {
    try {
        const response = await fetch('/api/tasks', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            renderTasks(data.tasks);
        } else {
            showAlert('error', 'Failed to load tasks');
        }
    } catch (error) {
        console.error('Tasks error:', error);
        showAlert('error', 'Failed to load tasks');
    }
}

// Load referral data
async function loadReferralData() {
    try {
        const response = await fetch('/api/dashboard/referrals', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            renderReferralData(data.referralStats);
        } else {
            showAlert('error', 'Failed to load referral data');
        }
    } catch (error) {
        console.error('Referral error:', error);
        showAlert('error', 'Failed to load referral data');
    }
}

// Render dashboard
function renderDashboard(dashboard) {
    // Update user info
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        userInfo.innerHTML = `
            <h2>Welcome back, ${dashboard.user.name}!</h2>
            <p>Member since ${new Date(dashboard.user.joinedAt).toLocaleDateString()}</p>
        `;
    }
    
    // Update statistics
    const statsContainer = document.querySelector('.stats-grid');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-card">
                <span class="stat-number">Ksh ${dashboard.earnings.total}</span>
                <span class="stat-label">Total Earnings</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">Ksh ${dashboard.earnings.available}</span>
                <span class="stat-label">Available Balance</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">${dashboard.statistics.completedTasks}</span>
                <span class="stat-label">Tasks Completed</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">${dashboard.statistics.totalReferrals}</span>
                <span class="stat-label">Referrals</span>
            </div>
        `;
    }
    
    // Update recent activity
    const activityContainer = document.querySelector('.recent-activity');
    if (activityContainer && dashboard.recentActivity) {
        const activityHTML = dashboard.recentActivity.map(activity => `
            <div class="activity-item">
                <h4>${activity.task.title}</h4>
                <p>Completed: ${new Date(activity.completedAt).toLocaleDateString()}</p>
                <span class="earnings">+Ksh ${activity.earnings}</span>
                <span class="status status-${activity.status}">${activity.status}</span>
            </div>
        `).join('');
        
        activityContainer.innerHTML = activityHTML;
    }
}

// Render tasks
function renderTasks(tasks) {
    const tasksContainer = document.querySelector('.task-grid');
    if (!tasksContainer) return;
    
    const tasksHTML = tasks.map(task => `
        <div class="task-card">
            <div class="task-header">
                <h3 class="task-title">${task.title}</h3>
                <span class="task-category">${task.category}</span>
            </div>
            <div class="task-body">
                <div class="task-reward">Ksh ${task.reward}</div>
                <p class="task-description">${task.description}</p>
                <div class="task-meta">
                    <span>⏱️ ${task.estimatedTime} min</span>
                    <span>📊 ${task.difficulty}</span>
                </div>
                ${task.completed ? 
                    `<span class="task-status status-${task.completionStatus}">${task.completionStatus}</span>` :
                    `<button class="btn task-btn" data-task-id="${task._id}" data-action="complete">
                        Complete Task
                    </button>`
                }
            </div>
        </div>
    `).join('');
    
    tasksContainer.innerHTML = tasksHTML;
}

// Render referral data
function renderReferralData(referralStats) {
    const referralContainer = document.querySelector('.referral-stats');
    if (referralContainer) {
        referralContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-number">${referralStats.totalReferrals}</span>
                    <span class="stat-label">Total Referrals</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${referralStats.activeReferrals}</span>
                    <span class="stat-label">Active Referrals</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">Ksh ${referralStats.totalEarnings}</span>
                    <span class="stat-label">Referral Earnings</span>
                </div>
            </div>
        `;
    }
    
    const referralsList = document.querySelector('.referrals-list');
    if (referralsList && referralStats.referrals) {
        const referralsHTML = referralStats.referrals.map(referral => `
            <div class="referral-item">
                <h4>${referral.name}</h4>
                <p>${referral.email}</p>
                <span class="status status-${referral.status}">${referral.status}</span>
                <span class="date">${new Date(referral.joinedAt).toLocaleDateString()}</span>
            </div>
        `).join('');
        
        referralsList.innerHTML = referralsHTML;
    }
}

// Setup form validation
function setupFormValidation(form) {
    const inputs = form.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateInput(input));
        input.addEventListener('input', () => clearError(input));
    });
}

// Validate input
function validateInput(input) {
    const value = input.value.trim();
    const type = input.type;
    const name = input.name;
    let isValid = true;
    let errorMessage = '';
    
    // Required field validation
    if (input.required && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    
    // Email validation
    if (type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }
    
    // Phone validation
    if (name === 'phone' && value) {
        const phoneRegex = /^254[0-9]{9}$/;
        if (!phoneRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid Kenyan phone number (254XXXXXXXXX)';
        }
    }
    
    // Password validation
    if (type === 'password' && value) {
        if (value.length < 6) {
            isValid = false;
            errorMessage = 'Password must be at least 6 characters long';
        }
    }
    
    // Show/hide error
    if (isValid) {
        clearError(input);
    } else {
        showError(input, errorMessage);
    }
    
    return isValid;
}

// Show input error
function showError(input, message) {
    clearError(input);
    
    input.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.textContent = message;
    input.parentNode.appendChild(errorDiv);
}

// Clear input error
function clearError(input) {
    input.classList.remove('error');
    const errorDiv = input.parentNode.querySelector('.form-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Show loading state
function showLoading(element) {
    const originalText = element.textContent;
    element.dataset.originalText = originalText;
    element.innerHTML = '<span class="loading"></span> Loading...';
    element.disabled = true;
}

// Hide loading state
function hideLoading(element) {
    const originalText = element.dataset.originalText;
    element.textContent = originalText;
    element.disabled = false;
}

// Show alert
function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Add new alert
    document.body.insertBefore(alertDiv, document.body.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Poll payment status
async function pollPaymentStatus(paymentId) {
    const maxAttempts = 30; // 30 attempts = 60 seconds
    let attempts = 0;
    
    const poll = async () => {
        try {
            const response = await fetch(`/api/payment/status/${paymentId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const payment = data.payment;
                
                if (payment.status === 'completed') {
                    showAlert('success', 'Payment completed successfully!');
                    // Refresh user data
                    await fetchCurrentUser();
                    return;
                } else if (payment.status === 'failed') {
                    showAlert('error', 'Payment failed. Please try again.');
                    return;
                }
            }
            
            attempts++;
            if (attempts < maxAttempts) {
                setTimeout(poll, 2000); // Poll every 2 seconds
            } else {
                showAlert('warning', 'Payment status check timed out. Please refresh the page.');
            }
        } catch (error) {
            console.error('Payment status error:', error);
        }
    };
    
    poll();
}

// Setup dashboard charts (placeholder for future implementation)
function setupDashboardCharts() {
    // This would integrate with a charting library like Chart.js
    // For now, we'll just log that charts would be set up here
    console.log('Dashboard charts would be initialized here');
}

// Show task completion form
function showTaskCompletionForm(taskId) {
    // This would show a modal or form for task completion
    // For now, we'll redirect to a completion page
    window.location.href = `/tasks/${taskId}/complete`;
}

// Show task details
function showTaskDetails(taskId) {
    // This would show a modal with task details
    // For now, we'll redirect to a details page
    window.location.href = `/tasks/${taskId}`;
}

// Utility functions
function formatCurrency(amount) {
    return `Ksh ${amount.toLocaleString()}`;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString();
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateInput,
        formatCurrency,
        formatDate,
        formatTime
    };
}