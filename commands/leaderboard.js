const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the leaderboard!')
    .setIntegrationTypes(1)
    .setContexts(0, 1, 2),
    async execute(interaction) {
        await interaction.reply({ content: "Test completed. (Hello from SlashCommandBuilder)", ephemeral: false});
    },
};
