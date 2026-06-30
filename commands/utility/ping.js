const { SlashCommandBuilder } = require('discord.js');

// I love you Akiyama Mizuki from the hit video game, Project Sekai : Colourful Stage feat. Hatsune Miku
const mizukiQuote = [
    "Me and Ena went to go get some Mont Blanc and we bumped into Li'l Bro, An and the others there! We all went in, the six of us. It was so much fun! ",
    "I bet Ena will be so surprised to have people celebrate her birthday at school. We'd better work hard to make it a special one♪ ",
    "Usually I'd do something to distract myself, but now I just feel nothing... ",
    "Oh yeah, I have work today. Ugh... It'd be bad if I didn't show up. ",
    "I'm sorry... for not telling you about this all this time. I'm sorry-- Because I couldn't face you."
]

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Give you quotes from Akiyama Mizuki from Proseka'),
	async execute(interaction) {
		await interaction.reply(mizukiQuote[Math.floor(Math.random() * mizukiQuote.length)]);
	},
};