
require("dotenv").config();

const { Bot } = require("grammy");
const connectDB = require("./config/database");
const startScheduler = require("./services/scheduler");
const Poll = require("./models/Poll");
const User = require("./models/User");

if (!process.env.BOT_TOKEN) {
    throw new Error("BOT_TOKEN is missing from .env");
}

if (!process.env.GROUP_ID) {
    throw new Error("GROUP_ID is missing from .env");
}

const bot = new Bot(process.env.BOT_TOKEN);

bot.command("start", async (ctx) => {
    await ctx.reply("Fajr Tracker is connected.");
});

bot.command("chatid", async (ctx) => {
    await ctx.reply(`Chat ID: ${ctx.chat.id}`);
});


// Record votes and handle vote changes
bot.on("poll_answer", async (ctx) => {
    try {
        const pollAnswer = ctx.update.poll_answer;

        const poll = await Poll.findOne({
            pollId: pollAnswer.poll_id
        });

        if (!poll || poll.closed) {
            return;
        }

        const telegramUser = pollAnswer.user;
        const userId = String(telegramUser.id);

        // Register or update the user
        await User.findOneAndUpdate(
            { telegramId: userId },
            {
                $set: {
                    username: telegramUser.username || null,
                    firstName: telegramUser.first_name
                },
                $setOnInsert: {
                    telegramId: userId
                }
            },
            { upsert: true, new: true }
        );

        // Identify the latest answer
        let answer = null;

        if (pollAnswer.option_ids.length > 0) {
            answer = pollAnswer.option_ids[0] === 0
                ? "Yes"
                : "No";
        }

        // Find the user's previous vote
        const voteIndex = poll.votes.findIndex(
            vote => vote.userId === userId
        );

        if (answer === null) {
            // User withdrew their vote
            if (voteIndex !== -1) {
                poll.votes.splice(voteIndex, 1);
            }
        } else if (voteIndex !== -1) {
            // Update existing vote
            poll.votes[voteIndex].answer = answer;
        } else {
            // Save new vote
            poll.votes.push({
                userId,
                answer
            });
        }

        await poll.save();

        console.log(
            `${telegramUser.first_name} voted ${answer || "withdrawn"} on ${poll.type}.`
        );

    } catch (error) {
        console.error("Vote recording failed:", error);
    }
});

bot.catch((err) => {
    console.error("Bot error:", err);
});

async function startBot() {
    await connectDB();

    startScheduler(bot, process.env.GROUP_ID);

    console.log("Starting Fajr Tracker bot...");

    await bot.start({
        onStart: (botInfo) => {
            console.log(`Bot started: @${botInfo.username}`);
        }
    });
}

startBot().catch((error) => {
    console.error("Failed to start bot:", error);
    process.exit(1);
});
