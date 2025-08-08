import OpenAI from 'openai';
import dotenv from 'dotenv';
import discord from 'discord.js';
import * as Types from './types';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL });
const client = new discord.Client({ intents: [discord.GatewayIntentBits.Guilds, discord.GatewayIntentBits.GuildWebhooks, discord.GatewayIntentBits.GuildMessages, discord.GatewayIntentBits.MessageContent, discord.GatewayIntentBits.GuildMessageReactions] });

const translateMessage = async (text: string, targetLanguage: string): Promise<string> => {
	const response = await openai.chat.completions.create({
		model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
		messages: [
			{
				role: 'system',
				content: `You are a translation expert. Translate the given text to ${targetLanguage}. Only provide the translated text without any additional commentary.`,
			},
			{
				role: 'user',
				content: text,
			},
		],
		response_format: {
			type: 'json_schema',
			json_schema: {
				name: 'translation_response',
				strict: true,
				schema: {
					type: 'object',
					properties: {
						translated_text: {
							type: 'string',
							description: 'The translated text in the target language',
						},
					},
					required: ['translated_text'],
					additionalProperties: false,
				},
			},
		},
	});
	const result = JSON.parse(response.choices[0].message.content || '{}');
	return result.translated_text;
};

client.once(discord.Events.ClientReady, () => {
	console.log(`Logged in as ${client.user?.tag}`);
});

client.on(discord.Events.MessageCreate, (message) => {
	if (message.author.bot) return;

	console.log(`Received message: ${message.content}`);
});
