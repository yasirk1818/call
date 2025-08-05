// Packages and environment variables
require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http'); 
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');

// Models, Routes, and Middleware
const Message = require('./models/Message');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const agoraRoutes = require('./routes/agoraRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Admin routes import
const { protect, admin } = require('./middleware/authMiddleware'); // Admin middleware import

// Initialization
const app = express();
const server = http.createServer(app); 
const io = new Server(server);

// Middlewares
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
mongoose.connect(process.env.DATABASE_URL, { /* options */ })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/admin', adminRoutes); // Admin routes ko register karna

// Socket.IO Logic (Authentication, Messaging, etc.)
// ... (Yeh hissa pichle version jaisa hi hai)
const userSockets = {};
io.use((socket, next) => { /* ... authentication logic ... */ });
io.on('connection', (socket) => { /* ... private messaging and disconnect logic ... */ });


// Page Rendering Routes
app.get('/', (req, res) => res.redirect('/login'));
app.get('/register', (req, res) => res.render('register', { title: 'Register' }));
app.get('/login', (req, res) => res.render('login', { title: 'Login' }));
app.get('/chat', protect, (req, res) => res.render('chat', { user: req.user }));

// Admin Panel Route (protected with both 'protect' and 'admin' middleware)
app.get('/admin', protect, admin, (req, res) => {
    res.render('admin', { title: 'Admin Panel', user: req.user });
});

// Server Start
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server http://localhost:${PORT} par chal raha hai`));
