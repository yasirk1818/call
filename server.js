const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
// ... baqi dependencies

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json()); // Body parser

// EJS setup
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Routes
// const authRoutes = require('./routes/authRoutes');
// app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    // Check if user is logged in, then render index.ejs
    res.render('login'); // Start with login page
});

// Socket.IO Connection
io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    // Apne tamam events yahan handle karein
    socket.on('sendMessage', (data) => {
        // Message ko database me save karein
        // Receiver ko message forward karein
        io.to(receiverSocketId).emit('receiveMessage', data);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
