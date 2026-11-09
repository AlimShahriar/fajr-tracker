
function formatChallengeResults(challengeNumber, results) {
    if (results.length === 0) {
        return `Challenge ${challengeNumber} has ended.\n\nNo participants recorded any votes.`;
    }

    const topThree = results.filter(result => result.rank <= 3);

    let message = `Challenge ${challengeNumber} Results\n\n`;

    for (const result of topThree) {
        message += `${result.rank}. ${result.firstName} — ${result.totalPoints} points\n`;
    }

    message += `\nCongratulations to everyone who participated.`;

    return message;
}

module.exports = formatChallengeResults;
