
const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema({
    number: {
        type: Number,
        required: true,
        unique: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["active", "completed"],
        default: "active"
    },
    results: [{
        userId: {
            type: String,
            required: true
        },
        username: {
            type: String,
            default: null
        },
        firstName: {
            type: String,
            required: true
        },
        rank: {
            type: Number,
            required: true
        },
        totalPoints: {
            type: Number,
            required: true
        }
    }],
    completedAt: {
        type: Date,
        default: null
    },
    resultsAnnounced: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Challenge", challengeSchema);
