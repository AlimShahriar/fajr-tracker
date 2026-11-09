
const calculateChallengeResults = require("./challengeScoring");
const Challenge = require("../models/Challenge");

async function completeChallenge(challenge) {
    const results = await calculateChallengeResults(challenge);

    challenge.results = results;
    challenge.status = "completed";
    challenge.completedAt = new Date();

    await challenge.save();

    console.log(
        `Challenge ${challenge.number} completed. ${results.length} participants ranked.`
    );

    return results;
}

module.exports = completeChallenge;
