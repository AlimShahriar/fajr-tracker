const mongoose = require("mongoose");

const dailyRecordSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    activities: [{
        pollId: {
    type: String,
    required: true
},
        type: {
            type: String,
            required: true
        },
        answer: {
            type: String,
            required: true
        },
        points: {
            type: Number,
            required: true
        }
    }],
    totalPoints: {
        type: Number,
        default: 0
    }
});

dailyRecordSchema.index(
    { userId: 1, date: 1 },
    { unique: true }
);

module.exports = mongoose.model("DailyRecord", dailyRecordSchema);