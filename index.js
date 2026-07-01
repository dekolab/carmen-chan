const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.commands = new Collection(); 

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return; 
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: 'There was an error while executing this command!',
				flags: MessageFlags.Ephemeral,
			});
		} else {
			await interaction.reply({
				content: 'There was an error while executing this command!',
				flags: MessageFlags.Ephemeral,
			});
		}
	}
});

const { loadConfig } = require('./utils/config');

client.on('messageCreate', async (message) => {
    if (message.author.bot || message.system || !message.guild) return;

    const config = loadConfig();
    const honeypotId = config[message.guild.id];
    if (!honeypotId || message.channel.id !== honeypotId) return;

    const member = message.member;
    const guild = message.guild;

    if (!guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
        console.error('Honeypot Triggered: Missing "BanMembers" permission.');
        return;
    }

    // Prevent accidental banning of admins / owners
    if (member && member.permissions.has(PermissionFlagsBits.Administrator)) {
        return;
    }

    try {
        await guild.members.ban(message.author.id, {
            reason: 'Automated Honeypot Trigger: Account posted in a restricted decoy channel.',
            deleteMessageSeconds: 7 * 24 * 60 * 60,
        });
    } catch (error) {
        console.error(`Failed to execute honeypot action on user ${message.author.id}:`, error);
    }
});

client.login(token);