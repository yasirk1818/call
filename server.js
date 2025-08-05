require('dotenv').config(); // .env file ko load karne ke liye
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// Routes import karein
const authRoutes = require('./routes/authRoutes');
const { protect } = require('./middleware/authMiddleware'); // Middleware ko import karein
const app = express();

// Middlewares
app.use(express.json()); // JSON data parse karne ke liye
app.use(express.urlencoded({ extended: true })); // Form data parse karne ke liye

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files (CSS, Frontend JS) ke liye folder
app.use(express.static(path.join(__dirname, 'public')));


// Database Connection
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));


// API Routes ko istemaal karein
app.use('/api/auth', authRoutes);

// Page Routes
app.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chal raha hai port ${PORT} par`));
