const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { loadConfig, saveConfig } = require('../../utils/config');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('set-honeypot')
        .setDescription('Set the honeypot channel to catch the bots')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Honeypot Channel')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const config = loadConfig();
        config[interaction.guildId] = channel.id;
        saveConfig(config);

        await interaction.reply({
            content: `Honeypot set to ${channel}.`,
            flags: MessageFlags.Ephemeral,
        });
    },
};