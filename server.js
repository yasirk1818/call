// Step 1: Zaroori packages aur environment variables ko load karna
require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http'); 
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken'); // Socket authentication ke liye

// Step 2: Apne banaye huye routes aur middleware ko import karna
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // Naye user routes
const { protect } = require('./middleware/authMiddleware');

// App, Server, aur Socket.IO Initialization
const app = express();
const server = http.createServer(app); 
const io = new Server(server);

// Step 3: Middlewares
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Step 4: View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Step 5: Static files
app.use(express.static(path.join(__dirname, 'public')));

// Step 6: Database Connection
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB database se connection kamyab ho gaya...');
}).catch(err => {
    console.log('Database connection me error:', err);
});

// Step 7: API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // User routes ko register karna

// Step 8: Socket.IO Authentication Middleware
// Yeh har naye socket connection ko pehle authenticate karega
io.use((socket, next) => {
    const token = socket.handshake.auth.token; // Client se bheja gaya token
    if (!token) {
        return next(new Error('Authentication error: Token nahi mila.'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error('Authentication error: Token ghalat hai.'));
        }
        socket.user = decoded; // User ki info (ID) ko socket object me store kar dein
        next(); // Connection ko aage barhne dein
    });
});

// User ID aur Socket ID ka map store karne ke liye object
const userSockets = {};

// Step 9: Real-time Communication Logic
io.on('connection', (socket) => {
    console.log(`User connect hua: ${socket.user.id} (Socket ID: ${socket.id})`);
    
    // User ki ID ko uske current socket ID ke sath map karein
    userSockets[socket.user.id] = socket.id;

    // Client se private message receive karna
    socket.on('privateMessage', ({ content, toUserId }) => {
        const receiverSocketId = userSockets[toUserId];

        // Yahan message ko database me save karne ka logic ayega
        // ... (Hum isay agle steps me add karenge)

        // Agar receiver online hai (uska socket ID mojood hai) to usay message bhejein
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('receivePrivateMessage', {
                content: content,
                from: socket.user.id,
                timestamp: new Date()
            });
        }
    });

    // Jab user disconnect ho
    socket.on('disconnect', () => {
        console.log(`User disconnect hua: ${socket.user.id}`);
        // User ko 'userSockets' map se hata dein
        for (let userId in userSockets) {
            if (userSockets[userId] === socket.id) {
                delete userSockets[userId];
                break;
            }
        }
    });
});

// Step 10: Page Rendering Routes
app.get('/', (req, res) => res.redirect('/login'));
app.get('/register', (req, res) => res.render('register', { title: 'Register' }));
app.get('/login', (req, res) => res.render('login', { title: 'Login' }));
app.get('/chat', protect, (req, res) => res.render('chat', { user: req.user }));

// Step 11: Server ko start karna
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} par chal raha hai`);
});
