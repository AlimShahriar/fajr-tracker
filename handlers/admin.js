
const startChallenge = require("../services/startChallenge");

function registerAdminHandlers(bot, groupId) {
    bot.command("startchallenge", async (ctx) => {
        try {
            // Only allow this command in the configured group
            if (String(ctx.chat.id) !== String(groupId)) {
                return;
            }

            // Check whether the command sender is a group admin
            const member = await ctx.api.getChatMember(
                groupId,
                ctx.from.id
            );

            if (
                member.status !== "creator" &&
                member.status !== "administrator"
            ) {
                return ctx.reply("Only group admins can start a challenge.");
            }

            const challenge = await startChallenge();

            const formatDate = (date) =>
                new Intl.DateTimeFormat("en-GB", {
                    timeZone: "Asia/Dhaka",
                    dateStyle: "medium",
                    timeStyle: "short"
                }).format(date);

            await ctx.reply(
                `Challenge ${challenge.number} has started!\n\n` +
                `Start: ${formatDate(challenge.startDate)}\n` +
                `End: ${formatDate(challenge.endDate)}`
            );

        } catch (error) {
            await ctx.reply(error.message);
        }
    });
}

module.exports = registerAdminHandlers;
