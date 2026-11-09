
const scorePoll = require("./scoring");
const cron = require("node-cron");
const Poll = require("../models/Poll");
const processChallengeCycle = require("./challengeCycle");

const TIMEZONE = "Asia/Dhaka";

async function createPoll(bot, groupId, question, type, points, closesAt) {
    try {
        const message = await bot.api.sendPoll(
            groupId,
            question,
            ["Yes", "No"],
            {
                is_anonymous: false,
                allows_multiple_answers: false
            }
        );

        await Poll.create({
            chatId: String(groupId),
            messageId: message.message_id,
            pollId: message.poll.id,
            type,
            points,
            postedAt: new Date(),
            closesAt,
            closed: false,
            scored: false
        });

        console.log(`${type} poll created successfully.`);
    } catch (error) {
        console.error(`Failed to create ${type} poll:`, error.message);
    }
}

async function closePolls(bot) {
    const polls = await Poll.find({
        closesAt: { $lte: new Date() },
        $or: [
            { closed: { $ne: true } },
            { scored: { $ne: true } }
        ]
    });

    for (const poll of polls) {
        try {
            // Close the Telegram poll if it is not already closed
            if (!poll.closed) {
                try {
                    await bot.api.stopPoll(poll.chatId, poll.messageId);
                    console.log(`${poll.type} poll closed.`);
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

                    console.log(
                        `${poll.type} poll was already closed in Telegram.`
                    );
                }

                poll.closed = true;
                await poll.save();
            }

            // Score the poll if it has not been scored
            if (!poll.scored) {
                await scorePoll(poll);

                poll.scored = true;
                await poll.save();

                console.log(`${poll.type} poll scored.`);
            }

        } catch (error) {
            console.error(
                `Failed to process ${poll.type} poll:`,
                error.message
            );
        }
    }
}

function startScheduler(bot, groupId) {
    // Fajr: Every day at 07:00
    cron.schedule("0 7 * * *", async () => {
        const closesAt = new Date(Date.now() + 60 * 60 * 1000);

        await createPoll(
            bot, groupId,
            "Did you pray Fajr?",
            "fajr", 5, closesAt
        );
    }, { timezone: TIMEZONE });

    // Zikr and Friday activities: Every day at 18:00
    cron.schedule("0 18 * * *", async () => {
        const closesAt = new Date(Date.now() + 60 * 60 * 1000);

        await createPoll(
            bot, groupId,
            "Did you complete your daily zikr?",
            "zikr", 3, closesAt
        );

        const day = new Intl.DateTimeFormat("en-US", {
            timeZone: TIMEZONE,
            weekday: "long"
        }).format(new Date());

        if (day === "Friday") {
            await createPoll(
                bot, groupId,
                "Did you attend Jumu'ah prayer?",
                "jumuah", 2, closesAt
            );

            await createPoll(
                bot, groupId,
                "Did you read Surah Al-Kahf?",
                "kahf", 2, closesAt
            );

            await createPoll(
                bot, groupId,
                "Did you perform ghusl?",
                "ghusl", 2, closesAt
            );

            await createPoll(
                bot, groupId,
                "Did you apply fragrance?",
                "fragrance", 2, closesAt
            );
        }
    }, { timezone: TIMEZONE });

    // Check for expired polls every minute
    cron.schedule("* * * * *", () => {
        closePolls(bot).catch(console.error);
    }, { timezone: TIMEZONE });

        // Check the 30-day challenge cycle every minute
    cron.schedule("* * * * *", () => {
        processChallengeCycle(bot, groupId).catch(error => {
            console.error("Challenge cycle failed:", error.message);
        });
    }, { timezone: TIMEZONE });
    console.log("Poll scheduler started.");
}

module.exports = startScheduler;
