
const Poll = require("../models/Poll");
const scorePoll = require("./scoring");

async function closeChallengePolls(bot, challenge) {
    const polls = await Poll.find({
        postedAt: {
            $gte: challenge.startDate,
            $lt: challenge.endDate
        },
        $or: [
            { closed: { $ne: true } },
            { scored: { $ne: true } }
        ]
    });

    for (const poll of polls) {
        try {
            if (!poll.closed) {
                try {
                    await bot.api.stopPoll(
                        poll.chatId,
                        poll.messageId
                    );
                } catch (error) {
                    const description = (
                        error.description || error.message || ""
                    ).toLowerCase();

                    if (
                        !description.includes("poll has already been closed") &&
                        !description.includes("poll has already been stopped")
                    ) {
                        throw error;
                    }
                }

                poll.closed = true;
                await poll.save();
            }

            if (!poll.scored) {
                await scorePoll(poll);

                poll.scored = true;
                await poll.save();
            }

            console.log(
                `${poll.type} poll finalized for challenge ${challenge.number}.`
            );

        } catch (error) {
            console.error(
                `Failed to finalize ${poll.type} poll:`,
                error.message
            );

            throw error;
        }
    }
}

module.exports = closeChallengePolls;
