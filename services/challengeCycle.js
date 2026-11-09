
const Challenge = require("../models/Challenge");
const completeChallenge = require("./completeChallenge");
const formatChallengeResults = require("./reports");
const startChallenge = require("./startChallenge");
const closeChallengePolls = require("./closeChallengePolls");

let isProcessing = false;

async function processChallengeCycle(bot, groupId) {
    if (isProcessing) {
        return;
    }

    isProcessing = true;

    try {
        // Find and complete an expired challenge
        const expiredChallenge = await Challenge.findOne({
            status: "active",
            endDate: { $lte: new Date() }
        });

        if (expiredChallenge) {
            await closeChallengePolls(bot, expiredChallenge);
            await completeChallenge(expiredChallenge);
        }

        // Find the oldest completed challenge awaiting announcement
        const pendingAnnouncement = await Challenge.findOne({
            status: "completed",
            resultsAnnounced: false
        }).sort({ number: 1 });

        if (pendingAnnouncement) {
            const message = formatChallengeResults(
                pendingAnnouncement.number,
                pendingAnnouncement.results
            );

            await bot.api.sendMessage(groupId, message);

            pendingAnnouncement.resultsAnnounced = true;
            await pendingAnnouncement.save();

            console.log(
                `Challenge ${pendingAnnouncement.number} results announced.`
            );
        }

        // Don't start another challenge if one is already active
        const activeChallenge = await Challenge.findOne({
            status: "active"
        });

        if (activeChallenge) {
            return;
        }

        // Start the next challenge from the previous scheduled end time
        const lastChallenge = await Challenge.findOne({
            status: "completed"
        }).sort({ number: -1 });

        if (lastChallenge) {
            await startChallenge(lastChallenge.endDate);
        }

    } finally {
        isProcessing = false;
    }
}

module.exports = processChallengeCycle;
