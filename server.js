// Step 1: Zaroori packages aur environment variables ko load karna
require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const path = 'path';
const http = 'http'; // HTTP module ko Express ke sath istemaal karne ke liye
const { Server } = require("socket.io"); // Socket.IO ko import karna

// Step 2: Apne banaye huye routes aur middleware ko import karna
const authRoutes = require('./routes/authRoutes');
const { protect } = require('./middleware/authMiddleware'); 

// Express app initialize karna
const app = express();
// HTTP server banana jo Express app ko istemaal karega
const server = http.createServer(app); 
// Socket.IO server ko HTTP server ke upar initialize karna
const io = new Server(server);

// Step 3: Middlewares ko istemaal karna
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Step 4: View Engine (EJS) ko set karna
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Step 5: Static files (CSS, Frontend JS) ke liye public folder ko set karna
app.use(express.static(path.join(__dirname, 'public')));

// Step 6: MongoDB Database se connection banana
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB database se connection kamyab ho gaya...');
}).catch(err => {
    console.log('Database connection me error:', err);
});

// Step 7: API Routes ko istemaal karna
app.use('/api/auth', authRoutes);

// === Step 8: Real-time Communication Logic with Socket.IO ===
io.on('connection', (socket) => {
    console.log('Naya user connect ho gaya:', socket.id);

    // 'sendMessage' event ko sunna jo client se aayega
    socket.on('sendMessage', (data) => {
        // Filhal, message ko tamam connected clients ko bheja ja raha hai
        // Hum 'receiveMessage' event emit kar rahe hain jise client sunega
        io.emit('receiveMessage', { 
            message: data.message,
            user: "Anonymous" // Isay hum baad me theek karenge
        });
    });

    // Jab user disconnect ho to console me log karna
    socket.on('disconnect', () => {
        console.log('User disconnect ho gaya:', socket.id);
    });
});
// =============================================================

// Step 9: Page Rendering Routes (Jo user ko HTML pages dikhayenge)
app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

// Protected Chat Route
app.get('/chat', protect, (req, res) => {
    res.render('chat', { user: req.user });
});

// Step 10: Server ko start karna
const PORT = process.env.PORT || 3000;
// Hum 'app.listen' ki jagah 'server.listen' ka istemaal kar rahe hain
// taake Socket.IO theek se kaam kar sake
server.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} par chal raha hai`);
});
