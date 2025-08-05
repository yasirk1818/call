const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username zaroori hai'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email zaroori hai'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Password zaroori hai'],
        minlength: 6
    },
    whatsappNumber: {
        type: String,
        required: [true, 'WhatsApp number zaroori hai'],
    },
    city: {
        type: String,
        required: [true, 'City zaroori hai'],
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['active', 'blocked'],
        default: 'active'
    },
    callingEnabled: {
        type: Boolean,
        default: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Password ko save karne se pehle hash karein
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
