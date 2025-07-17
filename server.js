const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// In-memory storage for demo (replace with MongoDB in production)
let users = [];
let tasks = [
  {
    _id: '1',
    title: "Watch Marketing Video - Brand Awareness",
    description: "Watch a 3-minute promotional video about a new product launch and provide feedback",
    category: "video",
    reward: 30,
    requirements: "Must watch the complete video and answer 3 simple questions",
    instructions: "1. Click on the video link provided\n2. Watch the entire video\n3. Answer the feedback questions\n4. Submit a screenshot of the completed survey",
    platform: "youtube",
    videoUrl: "https://www.youtube.com/watch?v=example1",
    verificationMethod: "screenshot",
    estimatedTime: 5,
    difficulty: "easy",
    isActive: true
  },
  {
    _id: '2',
    title: "Share Product Image on WhatsApp Status",
    description: "Share a promotional image on your WhatsApp status for 24 hours",
    category: "whatsapp",
    reward: 50,
    requirements: "Must have at least 50 WhatsApp contacts",
    instructions: "1. Download the promotional image\n2. Post it on your WhatsApp status\n3. Keep it active for 24 hours\n4. Take a screenshot showing the status post",
    platform: "whatsapp",
    imageUrl: "/images/promo1.jpg",
    verificationMethod: "screenshot",
    estimatedTime: 3,
    difficulty: "easy",
    isActive: true
  },
  {
    _id: '3',
    title: "Follow and Like Facebook Business Page",
    description: "Follow a business Facebook page and like their recent posts",
    category: "social_media",
    reward: 25,
    requirements: "Must have an active Facebook account",
    instructions: "1. Visit the Facebook page link\n2. Click Follow/Like the page\n3. Like the 3 most recent posts\n4. Share one post to your timeline\n5. Screenshot your actions",
    platform: "facebook",
    targetUrl: "https://facebook.com/examplepage",
    verificationMethod: "screenshot",
    estimatedTime: 4,
    difficulty: "easy",
    isActive: true
  }
];

// Mock routes for demo
app.use('/api/auth', (req, res, next) => {
  if (req.path === '/register' && req.method === 'POST') {
    const { name, email, phone, password } = req.body;
    const user = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      paymentStatus: 'pending',
      isActive: false,
      earnings: { total: 0, available: 0, pending: 0 },
      completedTasks: []
    };
    users.push(user);
    return res.json({
      success: true,
      message: 'User registered successfully. Please complete payment to activate your account.',
      token: 'demo-token-' + user.id,
      user
    });
  }
  
  if (req.path === '/login' && req.method === 'POST') {
    const { email } = req.body;
    const user = users.find(u => u.email === email);
    if (user) {
      return res.json({
        success: true,
        message: 'Login successful',
        token: 'demo-token-' + user.id,
        user
      });
    }
    return res.status(400).json({ success: false, message: 'User not found' });
  }
  
  if (req.path === '/me' && req.method === 'GET') {
    return res.json({
      success: true,
      user: {
        id: '1',
        name: 'Demo User',
        email: 'demo@example.com',
        phone: '254712345678',
        referralCode: 'DEMO123',
        paymentStatus: 'completed',
        isActive: true,
        earnings: { total: 500, available: 300, pending: 200 }
      }
    });
  }
  
  next();
});

app.use('/api/tasks', (req, res, next) => {
  if (req.method === 'GET' && req.path === '/') {
    return res.json({ success: true, tasks });
  }
  next();
});

app.use('/api/dashboard', (req, res, next) => {
  if (req.method === 'GET' && req.path === '/') {
    return res.json({
      success: true,
      dashboard: {
        user: {
          name: 'Demo User',
          email: 'demo@example.com',
          phone: '254712345678',
          referralCode: 'DEMO123',
          isActive: true,
          paymentStatus: 'completed',
          joinedAt: new Date()
        },
        statistics: {
          totalTasks: 10,
          completedTasks: 5,
          pendingTasks: 2,
          approvedTasks: 3,
          totalReferrals: 3
        },
        earnings: {
          total: 500,
          available: 300,
          pending: 200,
          fromTasks: 400,
          fromReferrals: 100
        },
        recentActivity: [],
        referrals: [],
        payments: []
      }
    });
  }
  next();
});

app.use('/api/payment', (req, res, next) => {
  if (req.path === '/stk-push' && req.method === 'POST') {
    return res.json({
      success: true,
      message: 'STK Push initiated successfully (Demo Mode)',
      checkoutRequestId: 'demo-checkout-' + Date.now(),
      merchantRequestId: 'demo-merchant-' + Date.now(),
      paymentId: 'demo-payment-' + Date.now()
    });
  }
  next();
});

// Main routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard');
});

app.get('/tasks', (req, res) => {
  res.render('tasks');
});

app.get('/support', (req, res) => {
  res.render('support');
});

app.get('/referral', (req, res) => {
  res.render('referral');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 PAPKASH Server running on port ${PORT}`);
  console.log(`🌐 Visit: http://localhost:${PORT}`);
  console.log(`📝 Note: Running in demo mode without MongoDB`);
});