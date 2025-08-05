const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    // Aap yahan message type bhi add kar sakte hain (text, image, etc.)
    // type: { type: String, enum: ['text', 'image'], default: 'text' }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
