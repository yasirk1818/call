// Step 1: Zaroori packages aur environment variables ko load karna
require('dotenv').config(); // .env file se variables load karta hai
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// Step 2: Apne banaye huye routes aur middleware ko import karna
const authRoutes = require('./routes/authRoutes');
const { protect } = require('./middleware/authMiddleware'); // Yeh hamara gatekeeper hai

// Express app initialize karna
const app = express();

// Step 3: Middlewares ko istemaal karna
// Yeh aane wali requests ke body se JSON data nikalne me madad karta hai
app.use(express.json()); 
// Yeh HTML forms se aane wale data (URL-encoded) ko nikalne me madad karta hai
app.use(express.urlencoded({ extended: true }));

// Step 4: View Engine (EJS) ko set karna
app.set('view engine', 'ejs');
// 'views' folder ka path batana
app.set('views', path.join(__dirname, 'views'));

// Step 5: Static files (CSS, Frontend JS, Images) ke liye public folder ko set karna
app.use(express.static(path.join(__dirname, 'public')));


// Step 6: MongoDB Database se connection banana
mongoose.connect(process.env.DATABASE_URL, {
    // Yeh options connection ko behtar banate hain
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    // Connection kamyab hone par message show karna
    console.log('MongoDB database se connection kamyab ho gaya...');
}).catch(err => {
    // Connection fail hone par error show karna
    console.log('Database connection me error:', err);
});


// Step 7: API Routes ko istemaal karna
// Jab bhi koi request '/api/auth' se shuru hogi, woh authRoutes file me jayegi
app.use('/api/auth', authRoutes);


// Step 8: Page Rendering Routes (Jo user ko HTML pages dikhayenge)

// Default/Root route
app.get('/', (req, res) => {
    // User ko સીધા login page par bhej do
    res.redirect('/login');
});

// Register page ka route
app.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});

// Login page ka route
app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});


// === PROTECTED ROUTE ===
// Yeh hamara main chat page hai jisay sirf logged-in user hi dekh sakta hai
// 'protect' middleware pehle chalega. Agar user ke pas valid token hoga tab hi aage jayega.
app.get('/chat', protect, (req, res) => {
    // 'protect' middleware ne user ki details 'req.user' me daal di hain.
    // Hum woh details EJS template ko pass kar rahe hain.
    res.render('chat', { user: req.user });
});


// Step 9: Server ko start karna
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} par chal raha hai`);
});
