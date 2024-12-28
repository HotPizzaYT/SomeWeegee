const { Client, Events, Collection, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const { token } = require('./config.json');
const fs = require("node:fs");
const path = require("node:path");
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, () => {
    console.log("SomeWeegee is now online!");
    client.user.setActivity("Mama Luigi!");
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const cowFile = "cow.json";
    const pointsFile = "points.json";

    // Ensure the points file exists
    if (!fs.existsSync(pointsFile)) {
        fs.writeFileSync(pointsFile, JSON.stringify({}, null, 2));
    }

    // Load points data
    let pointsData;
    try {
        pointsData = JSON.parse(fs.readFileSync(pointsFile, "utf8"));
    } catch (error) {
        console.error("Error reading points data: ", error);
        await interaction.reply("There was an error reading the points data.");
        return;
    }

    // Milk cow logic
    if (interaction.commandName === "milkcow") {
        // Ensure the cow file exists or create it
        if (fs.existsSync(cowFile)) {
            const data = fs.readFileSync(cowFile, "utf8");
            let cowData;

            try {
                cowData = JSON.parse(data);
            } catch (error) {
                console.error("Error parsing cow.json: ", error);
                await interaction.reply("There was an error reading the cow data.");
                return;
            }

            const currDate = new Date();
            const lastMilkTime = new Date(cowData.time || 0);

            if (
                lastMilkTime.getDate() === currDate.getDate() &&
                lastMilkTime.getMonth() === currDate.getMonth() &&
                lastMilkTime.getFullYear() === currDate.getFullYear()
            ) {
                // Same day logic
                if (cowData.lastMilk === interaction.user.username) {
                    await interaction.reply("You've already milked the cow this hour.");
                } else {
                    cowData.lastMilk = interaction.user.username;
                    fs.writeFileSync(cowFile, JSON.stringify(cowData, null, 2));

                    // Add points
                    const userId = interaction.user.id;
                    const username = interaction.user.username;
                    if (!pointsData[userId]) {
                        pointsData[userId] = { username, points: 0 };
                    }
                    pointsData[userId].points += 500;
                    fs.writeFileSync(pointsFile, JSON.stringify(pointsData, null, 2));

                    await interaction.reply("You have successfully milked the cow first this hour! You earned 500 points.");
                }
            } else {
                // New day logic
                cowData.time = currDate.toISOString();
                cowData.lastMilk = interaction.user.username;
                fs.writeFileSync(cowFile, JSON.stringify(cowData, null, 2));

                // Add points
                const userId = interaction.user.id;
                const username = interaction.user.username;
                if (!pointsData[userId]) {
                    pointsData[userId] = { username, points: 0 };
                }
                pointsData[userId].points += 500;
                fs.writeFileSync(pointsFile, JSON.stringify(pointsData, null, 2));

                await interaction.reply("A new day has started. You've milked the cow and earned 500 points!");
            }
        } else {
            // Initialize cow file
            const currDate = new Date();
            const defaultData = {
                time: currDate.toISOString(),
          lastMilk: interaction.user.username,
            };
            fs.writeFileSync(cowFile, JSON.stringify(defaultData, null, 2));

            // Add points
            const userId = interaction.user.id;
            const username = interaction.user.username;
            if (!pointsData[userId]) {
                pointsData[userId] = { username, points: 0 };
            }
            pointsData[userId].points += 500;
            fs.writeFileSync(pointsFile, JSON.stringify(pointsData, null, 2));

            await interaction.reply("The cow has been initialized. You've milked it first and earned 500 points!");
        }
    }

    // Leaderboard logic
    if (interaction.commandName === "leaderboard") {
        const sortedUsers = Object.values(pointsData).sort((a, b) => b.points - a.points);
        const leaderboard = sortedUsers.slice(0, 10).map((user, index) =>
        `${index + 1}. **${user.username}**: ${user.points} points`
        );

        if (leaderboard.length === 0) {
            await interaction.reply("The leaderboard is empty.");
        } else {
            await interaction.reply(`🏆 **Leaderboard** 🏆\n${leaderboard.join("\n")}`);
        }
    }
});


client.login(token);
