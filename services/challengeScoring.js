
const Poll = require("../models/Poll");
const DailyRecord = require("../models/DailyRecord");
const User = require("../models/User");

async function calculateChallengeResults(challenge) {
    // Find polls created during this exact 30-day period
    const polls = await Poll.find({
        postedAt: {
            $gte: challenge.startDate,
            $lt: challenge.endDate
        }
    }).select("pollId");

    const pollIds = new Set(polls.map(poll => poll.pollId));

    if (pollIds.size === 0) {
        return [];
    }

    // Find daily records containing votes from these polls
    const records = await DailyRecord.find({
        "activities.pollId": { $in: [...pollIds] }
    });

    const scores = new Map();

    for (const record of records) {
        for (const activity of record.activities) {
            if (!pollIds.has(activity.pollId)) {
                continue;
            }

            const currentPoints = scores.get(record.userId) || 0;

            scores.set(
                record.userId,
                currentPoints + activity.points
            );
        }
    }

    const userIds = [...scores.keys()];

    const users = await User.find({
        telegramId: { $in: userIds }
    });

    const userMap = new Map(
        users.map(user => [user.telegramId, user])
    );

    const results = [...scores.entries()].map(([userId, totalPoints]) => {
        const user = userMap.get(userId);

        return {
            userId,
            username: user?.username || null,
            firstName: user?.firstName || "Unknown",
            totalPoints
        };
    });

    results.sort((a, b) => b.totalPoints - a.totalPoints);

    let previousPoints = null;
    let previousRank = 0;

    return results.map((result, index) => {
        const rank = result.totalPoints === previousPoints
            ? previousRank
            : index + 1;

        previousPoints = result.totalPoints;
        previousRank = rank;

        return {
            ...result,
            rank
        };
    });
}

module.exports = calculateChallengeResults;
