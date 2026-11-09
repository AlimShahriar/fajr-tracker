const mongoose = require("mongoose");

const pollSchema = new mongoose.Schema({
    chatId: {
        type: String,
        required: true
    },
    messageId: {
        type: Number,
        required: true
    },
    pollId: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true
    },
    points: {
        type: Number,
        required: true
    },
    postedAt: {
        type: Date,
        required: true
    },
    closesAt: {
        type: Date,
        required: true
    },
    closed: {
        type: Boolean,
        default: false
    },
    scored: {
        type: Boolean,
        default: false
    },
    votes: [{
        userId: {
            type: String,
            required: true
        },
        answer: {
            type: String,
            enum: ["Yes", "No"],
            required: true
        }
    }]
});

module.exports = mongoose.model("Poll", pollSchema);