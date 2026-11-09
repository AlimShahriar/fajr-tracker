
const DailyRecord = require("../models/DailyRecord");

function getDhakaDate(date) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Dhaka",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(date);
}

async function scorePoll(poll) {
    const date = getDhakaDate(poll.postedAt);

    for (const vote of poll.votes) {
        const points = vote.answer === "Yes" ? poll.points : 0;

        // Create the daily record if it doesn't exist
        await DailyRecord.updateOne(
            {
                userId: vote.userId,
                date
            },
            {
                $setOnInsert: {
                    userId: vote.userId,
                    date
                }
            },
            { upsert: true }
        );

        // Add this poll's activity only if it hasn't been scored
        await DailyRecord.findOneAndUpdate(
            {
                userId: vote.userId,
                date,
                "activities.pollId": { $ne: poll.pollId }
            },
            {
                $push: {
                    activities: {
                        pollId: poll.pollId,
                        type: poll.type,
                        answer: vote.answer,
                        points
                    }
                },
                $inc: {
                    totalPoints: points
                }
            }
        );
    }

    console.log(`${poll.type} poll scoring completed.`);
}

module.exports = scorePoll;
