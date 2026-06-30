const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

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

client.on('messageCreate', async (message) => {
    // Ignore other bots, system messages, and messages outside the honeypot
    if (message.author.bot || message.system || message.channel.id !== CONFIG.HONEYPOT_CHANNEL_ID) {
        return;
    }

    const member = message.member;
    const guild = message.guild;

    // Check if the bot has the permissions required to ban members
    if (!guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
        console.error('Honeypot Triggered: Missing "BanMembers" permission.');
        return;
    }

    // Safety Check: Prevent accidental banning of administrators or server owners
    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
        return;
    }

    try {
        // 1. Instantly ban the offender and delete 7 days of their message history
        await guild.members.ban(message.author.id, {
            reason: 'Automated Honeypot Trigger: Account posted in a restricted decoy channel.',
            deleteMessageSeconds: 7 * 24 * 60 * 60 
        });

        // 2. Log the action to the staff channel
        const logChannel = await guild.channels.fetch(CONFIG.LOG_CHANNEL_ID);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('Bot Alert')
                .setColor('#FF0000')
                .setDescription(`A malicious user/bot was instantly banned for sending a message in <#${CONFIG.HONEYPOT_CHANNEL_ID}>.`)
                .addFields(
                    { name: 'User Tag', value: `${message.author.tag}`, inline: true },
                    { name: 'User ID', value: `\`${message.author.id}\``, inline: true },
                    { name: 'Message Content Snippet', value: `\`\`\`${message.content.slice(0, 500) || '[No Text/Attachment]'}\`\`\`` }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });
        }

    } catch (error) {
        console.error(`Failed to execute honeypot action on user ${message.author.id}:`, error);
    }
});

client.login(token);