
const Challenge = require("../models/Challenge");

async function startChallenge(startDate = new Date()) {
    const activeChallenge = await Challenge.findOne({
        status: "active"
    });

    if (activeChallenge) {
        throw new Error(
            `Challenge ${activeChallenge.number} is already active.`
        );
    }

    const lastChallenge = await Challenge.findOne()
        .sort({ number: -1 });

    const number = lastChallenge
        ? lastChallenge.number + 1
        : 1;

    const endDate = new Date(
        startDate.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    const challenge = await Challenge.create({
        number,
        startDate,
        endDate
    });

    console.log(`Challenge ${number} started.`);

    return challenge;
}

module.exports = startChallenge;
