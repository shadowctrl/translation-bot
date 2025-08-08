"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
const discord_js_1 = __importDefault(require("discord.js"));
const database_1 = require("./database");
dotenv_1.default.config();
const emoji = '🌍';
const channels_to_translate = ['1361347616801030335'];
const AVAILABLE_LANGUAGES = [
    { label: 'Spanish', value: 'Spanish', emoji: '🇪🇸' },
    { label: 'French', value: 'French', emoji: '🇫🇷' },
    { label: 'German', value: 'German', emoji: '🇩🇪' },
    { label: 'Italian', value: 'Italian', emoji: '🇮🇹' },
    { label: 'Portuguese', value: 'Portuguese', emoji: '🇵🇹' },
    { label: 'Russian', value: 'Russian', emoji: '🇷🇺' },
    { label: 'Japanese', value: 'Japanese', emoji: '🇯🇵' },
    { label: 'Korean', value: 'Korean', emoji: '🇰🇷' },
    { label: 'Chinese (Simplified)', value: 'Chinese (Simplified)', emoji: '🇨🇳' },
    { label: 'Hindi', value: 'Hindi', emoji: '🇮🇳' },
    { label: 'Arabic', value: 'Arabic', emoji: '🇸🇦' },
    { label: 'Dutch', value: 'Dutch', emoji: '🇳🇱' },
    { label: 'Swedish', value: 'Swedish', emoji: '🇸🇪' },
    { label: 'Norwegian', value: 'Norwegian', emoji: '🇳🇴' },
    { label: 'Danish', value: 'Danish', emoji: '🇩🇰' },
    { label: 'Finnish', value: 'Finnish', emoji: '🇫🇮' },
    { label: 'Polish', value: 'Polish', emoji: '🇵🇱' },
    { label: 'Turkish', value: 'Turkish', emoji: '🇹🇷' },
    { label: 'Greek', value: 'Greek', emoji: '🇬🇷' },
    { label: 'Hebrew', value: 'Hebrew', emoji: '🇮🇱' },
    { label: 'Thai', value: 'Thai', emoji: '🇹🇭' },
    { label: 'Vietnamese', value: 'Vietnamese', emoji: '🇻🇳' },
    { label: 'Indonesian', value: 'Indonesian', emoji: '🇮🇩' },
    { label: 'Malay', value: 'Malay', emoji: '🇲🇾' },
    { label: 'English', value: 'English', emoji: '🇺🇸' },
];
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL });
const client = new discord_js_1.default.Client({
    intents: [discord_js_1.default.GatewayIntentBits.Guilds, discord_js_1.default.GatewayIntentBits.GuildWebhooks, discord_js_1.default.GatewayIntentBits.GuildMessages, discord_js_1.default.GatewayIntentBits.MessageContent, discord_js_1.default.GatewayIntentBits.GuildMessageReactions, discord_js_1.default.GatewayIntentBits.DirectMessages],
});
const translateMessage = async (text, targetLanguage) => {
    const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
            {
                role: 'system',
                content: `You are a translation expert. Translate the given text to ${targetLanguage}. Only provide the translated text without any additional commentary. If the user's is not a valid language or not meaningful, respond with "Translation not available."`,
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
const createLanguageSelectMenu = () => {
    return new discord_js_1.default.StringSelectMenuBuilder()
        .setCustomId('language_select')
        .setPlaceholder('Select your preferred language')
        .addOptions(AVAILABLE_LANGUAGES.map((lang) => ({ label: lang.label, description: `Translate messages to ${lang.label}`, value: lang.value, emoji: lang.emoji })));
};
const createSetupEmbed = () => {
    return new discord_js_1.default.EmbedBuilder()
        .setTitle('🌍 Translation Bot Setup')
        .setDescription('Welcome to the Translation Bot! To get started, please select your preferred language from the dropdown below.')
        .setColor(0x00ae86)
        .addFields({ name: 'How it works:', value: '• React to messages with 🌍 to get translations\n• Messages will be translated to your chosen language\n• You can change your language anytime by reacting again', inline: false })
        .setFooter({ text: 'Choose your language below to continue' });
};
const createTranslationEmbed = (originalText, translatedText, targetLanguage, author) => {
    return new discord_js_1.default.EmbedBuilder()
        .setTitle('🌍 Translation')
        .setColor(0x00ae86)
        .addFields({ name: '📝 Original Message', value: `\`\`\`\n${originalText.length > 1000 ? originalText.substring(0, 1000) + '...' : originalText}\n\`\`\``, inline: false }, { name: `🌍 Translated to ${targetLanguage}`, value: `\`\`\`\n${translatedText.length > 1000 ? translatedText.substring(0, 1000) + '...' : translatedText}\n\`\`\``, inline: false })
        .setFooter({ text: `Original message by ${author.displayName}`, iconURL: author.displayAvatarURL() })
        .setTimestamp();
};
const initializeBot = async () => {
    try {
        await database_1.database.initialize();
        console.log('Database initialized successfully');
        await client.login(process.env.BOT_TOKEN);
    }
    catch (error) {
        console.error('Failed to initialize bot:', error);
        process.exit(1);
    }
};
client.once(discord_js_1.default.Events.ClientReady, () => {
    console.log(`Logged in as ${client.user?.tag}`);
    console.log(`Database has ${database_1.database.getUserCount()} users with ${database_1.database.getTotalTranslationCount()} total translations`);
});
client.on(discord_js_1.default.Events.MessageCreate, (message) => {
    if (message.author.bot)
        return;
    if (!channels_to_translate.includes(message.channel.id))
        return;
    message.react(emoji);
});
client.on(discord_js_1.default.Events.MessageReactionAdd, async (reaction, user) => {
    if (user.bot)
        return;
    if (reaction.partial) {
        try {
            await reaction.fetch();
        }
        catch (error) {
            console.error('Something went wrong when fetching the reaction:', error);
            return;
        }
    }
    const message = reaction.message;
    if (!channels_to_translate.includes(message.channel.id))
        return;
    if (reaction.emoji.name !== emoji)
        return;
    const userId = user.id;
    try {
        if (!database_1.database.userExists(userId)) {
            const setupEmbed = createSetupEmbed();
            const selectMenu = createLanguageSelectMenu();
            const actionRow = new discord_js_1.default.ActionRowBuilder().addComponents(selectMenu);
            try {
                await user.send({ embeds: [setupEmbed], components: [actionRow] });
            }
            catch (error) {
                console.error('Could not send DM to user:', error);
                try {
                    await message.reply({ content: `${user}, I couldn't send you a DM! Please enable DMs from server members to use the translation feature.`, allowedMentions: { users: [userId] } });
                }
                catch (channelError) {
                    console.error('Could not send message in channel either:', channelError);
                }
            }
            return;
        }
        const targetLanguage = database_1.database.getUserTargetLanguage(userId);
        if (!targetLanguage) {
            console.error(`User ${userId} exists but has no target language set`);
            return;
        }
        if (!message.content || message.content.trim() === '') {
            try {
                await user.send('Sorry, I can only translate text messages. This message appears to be empty or contains only media.');
            }
            catch (error) {
                console.error('Could not send DM to user:', error);
            }
            return;
        }
        const translatedText = await translateMessage(message.content, targetLanguage);
        if (!message.author) {
            console.error('Message author is null, cannot create translation embed');
            return;
        }
        const translationEmbed = createTranslationEmbed(message.content, translatedText, targetLanguage, message.author);
        try {
            await user.send({ embeds: [translationEmbed] });
            await database_1.database.addTranslation(userId, message.content, translatedText);
            try {
                await reaction.users.remove(userId);
            }
            catch (error) {
                console.error("Could not remove user's reaction:", error);
            }
            console.log(`Translated message for ${user.username}: "${message.content}" -> "${translatedText}"`);
        }
        catch (error) {
            console.error('Could not send translation DM to user:', error);
        }
    }
    catch (error) {
        console.error('Translation error:', error);
        try {
            await user.send('Sorry, I could not translate that message. Please try again later.');
        }
        catch (dmError) {
            console.error('Could not send error DM to user:', dmError);
        }
    }
});
client.on(discord_js_1.default.Events.InteractionCreate, async (interaction) => {
    if (!interaction.isStringSelectMenu())
        return;
    if (interaction.customId !== 'language_select')
        return;
    const selectedLanguage = interaction.values[0];
    const userId = interaction.user.id;
    try {
        await database_1.database.upsertUser(userId, selectedLanguage);
        const successEmbed = new discord_js_1.default.EmbedBuilder()
            .setTitle('✅ Setup Complete!')
            .setDescription(`Your preferred language has been set to **${selectedLanguage}**.`)
            .setColor(0x00ff00)
            .addFields({ name: "What's next?", value: "React to any message with 🌍 in the designated channels and I'll send you a translation!", inline: false }, { name: 'Change language anytime', value: 'Just react to the 🌍 emoji again to update your language preference.', inline: false })
            .setFooter({ text: 'Happy translating! 🌍' });
        await interaction.update({ embeds: [successEmbed] });
        console.log(`User ${interaction.user.username} set their language to ${selectedLanguage}`);
    }
    catch (error) {
        console.error('Error saving user language preference:', error);
        const errorEmbed = new discord_js_1.default.EmbedBuilder().setTitle('❌ Setup Error').setDescription('There was an error saving your language preference. Please try again.').setColor(0xff0000);
        await interaction.update({ embeds: [errorEmbed] });
    }
});
process.on('SIGINT', async () => {
    console.log('Shutting down bot...');
    client.destroy();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Shutting down bot...');
    client.destroy();
    process.exit(0);
});
initializeBot();
